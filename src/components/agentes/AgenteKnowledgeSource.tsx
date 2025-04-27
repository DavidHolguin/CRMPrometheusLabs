import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FileText, Globe, Table2, Loader2, CheckCircle, AlertCircle, Plus, X, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getSupabaseClient } from "@/integrations/supabase/client";

interface Source {
  id: string;
  type: 'pdf' | 'url' | 'excel';
  name: string;
  status: 'processing' | 'completed' | 'error';
  progress: number;
  file?: File;
  url?: string;
  response?: any;
}

interface AgenteKnowledgeSourceProps {
  onDataChange: (data: { sources: Source[] }) => void;
  initialData?: { sources: Source[] };
  agenteId?: string | null; // ID del agente para cargar documentos
}

const sourceTypes = [
  {
    id: 'pdf',
    name: 'Documentos PDF',
    description: 'Sube manuales, guías o documentación en PDF',
    icon: FileText,
    color: 'text-rose-500',
    accept: '.pdf',
    mimeTypes: ['application/pdf']
  },
  {
    id: 'url',
    name: 'Sitios web',
    description: 'Conecta con páginas web y documentación online',
    icon: Globe,
    color: 'text-blue-500'
  },
  {
    id: 'excel',
    name: 'Archivos Excel',
    description: 'Importa datos desde hojas de cálculo',
    icon: Table2,
    color: 'text-emerald-500',
    accept: '.xlsx,.xls,.csv',
    mimeTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']
  }
];

export function AgenteKnowledgeSource({ onDataChange, initialData, agenteId }: AgenteKnowledgeSourceProps) {
  const [sources, setSources] = useState<Source[]>(initialData?.sources || []);
  const [selectedSourceType, setSelectedSourceType] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth(); // Obtenemos el usuario actual que tiene el companyId
  const supabase = getSupabaseClient();

  const getStatusIcon = (status: Source['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (status: Source['status']) => {
    switch (status) {
      case 'processing':
        return 'Procesando';
      case 'completed':
        return 'Completado';
      case 'error':
        return 'Error';
    }
  };

  const openFileSelector = (type: 'pdf' | 'url' | 'excel') => {
    setSelectedSourceType(type);
    if (fileInputRef.current && type !== 'url') {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropzoneRef.current) {
      dropzoneRef.current.classList.add('border-primary', 'bg-primary/5');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropzoneRef.current) {
      dropzoneRef.current.classList.remove('border-primary', 'bg-primary/5');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropzoneRef.current) {
      dropzoneRef.current.classList.remove('border-primary', 'bg-primary/5');
    }
    
    if (!selectedSourceType || selectedSourceType === 'url') {
      toast.error("Selecciona primero un tipo de documento válido");
      return;
    }
    
    const files = Array.from(e.dataTransfer.files);
    
    // Verificar que los archivos coinciden con el tipo seleccionado
    const sourceType = sourceTypes.find(t => t.id === selectedSourceType);
    if (!sourceType || !sourceType.mimeTypes) return;
    
    const validFiles = files.filter(file => 
      sourceType.mimeTypes!.some(type => file.type.includes(type.split('/')[1]))
    );
    
    if (validFiles.length === 0) {
      toast.error(`Solo se permiten archivos ${sourceType.accept}`);
      return;
    }
    
    handleFileUpload(validFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    handleFileUpload(files);
    
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    e.target.value = '';
  };

  const handleUrlSubmit = async () => {
    if (!currentUrl || !currentUrl.trim()) {
      toast.error("Ingresa una URL válida");
      return;
    }
    
    try {
      // Validar URL
      new URL(currentUrl);
      
      const newSource: Source = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'url',
        name: currentUrl,
        status: 'processing',
        progress: 0,
        url: currentUrl
      };
      
      setSources(prev => [...prev, newSource]);
      onDataChange({ sources: [...sources, newSource] });
      
      if (agenteId) {
        await processUrlSource(newSource);
      } else {
        // Simulación cuando no hay agenteId disponible
        simulateProcessing(newSource.id);
      }
      
      setCurrentUrl('');
      setIsSheetOpen(false);
    } catch (error) {
      toast.error("URL inválida. Asegúrate de incluir 'http://' o 'https://'");
    }
  };

  const processUrlSource = async (source: Source) => {
    if (!user?.companyId || !agenteId) {
      toast.error("No hay una empresa asociada a tu usuario o ID de agente. No se puede procesar la URL.");
      updateSourceStatus(source.id, 'error', 0);
      return;
    }
    
    try {
      // URL base para apuntar al servidor Railway
      const apiBaseUrl = 'https://web-production-01457.up.railway.app';
      
      // Configuración para la petición
      const xhr = new XMLHttpRequest();
      
      // Configurar seguimiento del progreso
      if (xhr.upload) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            updateSourceProgress(source.id, progress);
          }
        });
      }
      
      // Promisificar el XMLHttpRequest
      const response = await new Promise<any>((resolve, reject) => {
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            console.log(`Response status: ${xhr.status}, response text: ${xhr.responseText}`);
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data);
              } catch (e) {
                reject(new Error("Error al procesar la respuesta del servidor"));
              }
            } else {
              console.error(`Error ${xhr.status}: `, xhr.responseText);
              reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`));
            }
          }
        };
        
        // Endpoint específico para URLs
        xhr.open('POST', `${apiBaseUrl}/api/v1/v2/knowledge/upload/url`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        // Enviar los datos en formato JSON como requiere el nuevo endpoint
        xhr.send(JSON.stringify({
          url: source.url,
          agent_id: agenteId,
          company_id: user.companyId,
          metadata: {}
        }));
      });
      
      updateSourceStatus(source.id, 'completed', 100, response);
      toast.success(`${source.name} procesado correctamente`);
    } catch (error) {
      updateSourceStatus(source.id, 'error', 0);
      toast.error(`Error al procesar la URL: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!selectedSourceType) return;
    
    for (const file of files) {
      const newSource: Source = {
        id: Math.random().toString(36).substr(2, 9),
        type: selectedSourceType as 'pdf' | 'url' | 'excel',
        name: file.name,
        status: 'processing',
        progress: 0,
        file: file
      };
      
      setSources(prev => [...prev, newSource]);
      onDataChange({ sources: [...sources, newSource] });
      
      if (agenteId) {
        await uploadFile(newSource);
      } else {
        // Simulación cuando no hay agenteId disponible
        simulateProcessing(newSource.id);
      }
    }
    
    setIsSheetOpen(false);
  };

  const uploadFile = async (source: Source) => {
    if (!source.file || !agenteId) return;
    
    if (!user?.companyId) {
      toast.error("No hay una empresa asociada a tu usuario. No se puede cargar el documento.");
      updateSourceStatus(source.id, 'error', 0);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', source.file);
      formData.append('agent_id', agenteId);
      formData.append('company_id', user.companyId); // Añadimos el ID de la empresa

      // Configuración para seguimiento del progreso
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          updateSourceProgress(source.id, progress);
        }
      });
      
      // Promisificar el XMLHttpRequest
      const response = await new Promise<any>((resolve, reject) => {
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            console.log(`Response status: ${xhr.status}, response text: ${xhr.responseText}`);
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data);
              } catch (e) {
                reject(new Error("Error al procesar la respuesta del servidor"));
              }
            } else {
              // Mostrar información más detallada sobre el error
              console.error(`Error ${xhr.status}: `, xhr.responseText);
              reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`));
            }
          }
        };
        
        // URL base para apuntar al servidor Railway
        const apiBaseUrl = 'https://web-production-01457.up.railway.app';
        xhr.open('POST', `${apiBaseUrl}/api/v1/v2/knowledge/upload`, true);
        
        // Ya no necesitamos el encabezado de autorización según los nuevos requisitos
        xhr.send(formData);
      });
      
      // Actualizar el estado del source con la respuesta
      updateSourceStatus(source.id, 'completed', 100, response);
      toast.success(`${source.name} procesado correctamente`);
      
    } catch (error) {
      updateSourceStatus(source.id, 'error', 0);
      toast.error(`Error al cargar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const updateSourceProgress = (id: string, progress: number) => {
    setSources(prev => 
      prev.map(s => 
        s.id === id 
          ? { ...s, progress } 
          : s
      )
    );
  };

  const updateSourceStatus = (id: string, status: Source['status'], progress: number, response?: any) => {
    setSources(prev => 
      prev.map(s => 
        s.id === id 
          ? { ...s, status, progress, response } 
          : s
      )
    );
  };

  const simulateProcessing = (sourceId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5; // Incrementos aleatorios entre 5-20%
      if (progress > 100) progress = 100;
      
      updateSourceProgress(sourceId, progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          updateSourceStatus(sourceId, 'completed', 100);
        }, 500);
      }
    }, 800);
  };

  const removeSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
    onDataChange({ sources: sources.filter(s => s.id !== id) });
  };

  const handleSourceClick = (source: Source) => {
    if (source.response) {
      //
      console.log('Detalles de la fuente:', source.response);
      // Aquí podrías implementar un modal o drawer para mostrar más detalles
    }
  };

  const renderUploadInterface = (type: string) => {
    const sourceType = sourceTypes.find(t => t.id === type);
    if (!sourceType) return null;

    if (type === 'url') {
      return (
        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="url-input" className="text-sm font-medium">
              URL del sitio web
            </label>
            <div className="flex items-center gap-2">
              <input
                id="url-input"
                type="url"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                placeholder="https://ejemplo.com/documentacion"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onKeyUp={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <Button onClick={handleUrlSubmit} disabled={!currentUrl.trim() || isUploading}>
                Procesar
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Ingresa la URL completa de una página web que contenga información relevante
          </p>
        </div>
      );
    }

    return (
      <div className="py-6 space-y-4">
        <div 
          ref={dropzoneRef}
          className="border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">Arrastra y suelta archivos aquí</h3>
          <p className="text-sm text-muted-foreground mb-4">
            o haz clic para seleccionar archivos
          </p>
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            Seleccionar archivos
          </Button>
          <input 
            ref={fileInputRef}
            type="file"
            accept={sourceType.accept}
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <p className="text-xs text-muted-foreground mt-4">
            {`Formatos soportados: ${sourceType.accept}`}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Encabezado con descripción */}
      <div>
        <h3 className="text-lg font-medium mb-2">Fuentes de conocimiento</h3>
        <p className="text-sm text-muted-foreground">
          Proporciona al agente información relevante para mejorar sus respuestas y conocimientos específicos
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Grid de tipos de fuentes */}
          <div className="grid grid-cols-2 gap-4">
            {sourceTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Sheet 
                  key={type.id} 
                  open={isSheetOpen && selectedSourceType === type.id}
                  onOpenChange={(open) => {
                    setIsSheetOpen(open);
                    if (!open) setSelectedSourceType(null);
                  }}
                >
                  <SheetTrigger asChild>
                    <Card 
                      className="p-4 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => {
                        setSelectedSourceType(type.id as 'pdf' | 'url' | 'excel');
                        setIsSheetOpen(true);
                      }}
                    >
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className={`rounded-lg p-2 ${type.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{type.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle className="flex items-center">
                        <Icon className={`h-5 w-5 mr-2 ${type.color}`} />
                        Agregar {type.name}
                      </SheetTitle>
                      <SheetDescription>
                        {type.id === 'url' 
                          ? 'Introduce la URL que deseas procesar'
                          : 'Selecciona los archivos que deseas procesar'}
                      </SheetDescription>
                    </SheetHeader>
                    {renderUploadInterface(type.id)}
                  </SheetContent>
                </Sheet>
              );
            })}
          </div>

          {/* Lista de fuentes */}
          {sources.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                Fuentes agregadas ({sources.length})
              </h4>
              <ScrollArea className="h-[300px] rounded-md border">
                <div className="p-4 space-y-4">
                  <AnimatePresence>
                    {sources.map((source) => (
                      <motion.div
                        key={source.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Card 
                          className={cn(
                            "p-4 hover:bg-accent/50 transition-colors",
                            source.status === 'completed' && "cursor-pointer"
                          )}
                          onClick={() => source.status === 'completed' && handleSourceClick(source)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <div className={`p-2 rounded-md ${
                                sourceTypes.find(t => t.id === source.type)?.color
                              }`}>
                                {React.createElement(
                                  sourceTypes.find(t => t.id === source.type)?.icon as any,
                                  { className: "h-4 w-4" }
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">{source.name}</h4>
                                <div className="flex items-center mt-1 space-x-2">
                                  {getStatusIcon(source.status)}
                                  <span className="text-xs text-muted-foreground">
                                    {getStatusText(source.status)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              {source.status === 'processing' && (
                                <div className="w-24">
                                  <Progress value={source.progress} className="h-2" />
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={source.status === 'completed' ? 'default' : 'secondary'}
                                  className={cn(
                                    source.status === 'error' && "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                  )}
                                >
                                  {source.progress}%
                                </Badge>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeSource(source.id);
                                  }}
                                >
                                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="lg:pl-6">
          {/* Recomendaciones */}
          <Card className="bg-muted/50 border-dashed mb-6">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Consejos para las fuentes de conocimiento</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">Documentación oficial:</span>{" "}
                  Prioriza documentos oficiales y manuales de la empresa
                </li>
                <li>
                  <span className="font-medium text-foreground">Información actualizada:</span>{" "}
                  Asegúrate de que la información esté vigente y sea precisa
                </li>
                <li>
                  <span className="font-medium text-foreground">Fuentes variadas:</span>{" "}
                  Combina diferentes tipos de fuentes para un conocimiento más completo
                </li>
                <li>
                  <span className="font-medium text-foreground">Organización:</span>{" "}
                  Mantén las fuentes organizadas por categorías o temas
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Estadísticas */}
          <Card className="sticky top-6">
            <CardContent className="p-6">
              <h4 className="font-medium mb-4">Resumen de conocimientos</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 bg-background">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {sources.length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Fuentes totales
                      </p>
                    </div>
                  </Card>
                  <Card className="p-4 bg-background">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {sources.filter(s => s.status === 'completed').length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Procesadas
                      </p>
                    </div>
                  </Card>
                </div>

                <div className="space-y-2">
                  {sourceTypes.map(type => {
                    const count = sources.filter(s => s.type === type.id).length;
                    if (count === 0) return null;
                    return (
                      <div key={type.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1 rounded-md ${type.color}`}>
                            {React.createElement(type.icon, { className: "h-4 w-4" })}
                          </div>
                          <span className="text-sm">{type.name}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}