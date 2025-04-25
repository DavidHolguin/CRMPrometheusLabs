import React, { useState } from "react";
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
import { FileText, Globe, Database, Table2, Loader2, CheckCircle, AlertCircle, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Source {
  id: string;
  type: 'pdf' | 'url' | 'excel' | 'database';
  name: string;
  status: 'processing' | 'completed' | 'error';
  progress: number;
}

interface AgenteKnowledgeSourceProps {
  onDataChange: (data: { sources: Source[] }) => void;
  initialData?: { sources: Source[] };
}

const sourceTypes = [
  {
    id: 'pdf',
    name: 'Documentos PDF',
    description: 'Sube manuales, guías o documentación en PDF',
    icon: FileText,
    color: 'text-rose-500'
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
    color: 'text-emerald-500'
  },
  {
    id: 'database',
    name: 'Base de datos',
    description: 'Conecta con tablas de Supabase',
    icon: Database,
    color: 'text-purple-500'
  }
];

export function AgenteKnowledgeSource({ onDataChange, initialData }: AgenteKnowledgeSourceProps) {
  const [sources, setSources] = useState<Source[]>(initialData?.sources || []);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

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

  const handleAddSource = (type: 'pdf' | 'url' | 'excel' | 'database') => {
    const newSource: Source = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      name: `Nueva fuente ${type.toUpperCase()}`,
      status: 'processing',
      progress: 0
    };

    setSources(prev => [...prev, newSource]);
    onDataChange({ sources: [...sources, newSource] });
    setSelectedSource(newSource);

    // Simular procesamiento
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress <= 100) {
        setSources(prev => 
          prev.map(s => 
            s.id === newSource.id 
              ? { ...s, progress } 
              : s
          )
        );
      } else {
        clearInterval(interval);
        setSources(prev => 
          prev.map(s => 
            s.id === newSource.id 
              ? { ...s, status: 'completed', progress: 100 } 
              : s
          )
        );
      }
    }, 500);
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
                <Sheet key={type.id}>
                  <SheetTrigger asChild>
                    <Card className="p-4 cursor-pointer hover:bg-accent transition-colors">
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
                      <SheetTitle>Agregar {type.name}</SheetTitle>
                      <SheetDescription>
                        Selecciona los archivos o introduce las URLs que deseas procesar
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-6">
                      <Button 
                        onClick={() => handleAddSource(type.id as Source['type'])}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar fuente
                      </Button>
                    </div>
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
                        <Card className="p-4">
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
                              <Badge variant={source.status === 'completed' ? 'default' : 'secondary'}>
                                {source.progress}%
                              </Badge>
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