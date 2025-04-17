import { useState, useEffect } from "react";
import { Lead } from "@/hooks/useLeads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash, Save, X, Check, Pencil } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

interface LeadPersonalDataTabProps {
  lead: Lead;
}

export function LeadPersonalDataTab({ lead }: LeadPersonalDataTabProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  
  // Datos personales estructurados del lead
  const personalData = {
    "Información Básica": [
      { label: "Nombre", value: lead.nombre || "No especificado", key: "nombre" },
      { label: "Apellido", value: lead.apellido || "No especificado", key: "apellido" },
      { label: "Email", value: lead.email || "No especificado", key: "email" },
      { label: "Teléfono", value: lead.telefono || "No especificado", key: "telefono" },
    ],
    "Ubicación": [
      { label: "Dirección", value: lead.direccion || "No especificado", key: "direccion" },
      { label: "Ciudad", value: lead.ciudad || "No especificado", key: "ciudad" },
      { label: "País", value: lead.pais || "No especificado", key: "pais" },
    ],
    "Datos Adicionales": Object.entries(lead.datos_adicionales || {}).map(([key, value]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      value: value?.toString() || "No especificado",
      key,
      customField: true
    }))
  };

  const startEditing = (key: string, value: string) => {
    setEditingField(key);
    setEditValue(value === "No especificado" ? "" : value);
  };

  const saveField = async (section: string, key: string) => {
    try {
      setLoading(key);
      
      // Si el valor no ha cambiado, no hacer nada
      const currentValue = personalData[section].find(item => item.key === key)?.value;
      if (currentValue === editValue || (currentValue === "No especificado" && editValue === "")) {
        setEditingField(null);
        setLoading(null);
        return;
      }
      
      // Valores vacíos se manejan como null
      const valueToSave = editValue.trim() === "" ? null : editValue;
      
      // Si es un campo personalizado, actualizar en datos_adicionales
      if (section === "Datos Adicionales") {
        const { error } = await supabase
          .from('lead_datos_personales')
          .update({
            datos_adicionales: {
              ...lead.datos_adicionales,
              [key]: valueToSave
            }
          })
          .eq('lead_id', lead.id);
          
        if (error) throw error;
      } else {
        // Si es un campo estándar, actualizar directamente
        const { error } = await supabase
          .from('lead_datos_personales')
          .update({ [key]: valueToSave })
          .eq('lead_id', lead.id);
          
        if (error) throw error;
      }
      
      toast.success(`Campo "${key}" actualizado`);
    } catch (error) {
      console.error('Error al actualizar campo:', error);
      toast.error('No se pudo actualizar el campo');
    } finally {
      setEditingField(null);
      setLoading(null);
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
  };

  const addNewField = async () => {
    if (!newFieldName.trim()) {
      toast.error("El nombre del campo es obligatorio");
      return;
    }

    try {
      setLoading('newField');
      
      // Normalizar el nombre del campo (quitar espacios, etc.)
      const normalizedName = newFieldName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
      
      // Verificar si ya existe el campo
      if (Object.keys(lead.datos_adicionales || {}).includes(normalizedName)) {
        toast.error(`Ya existe un campo con el nombre "${newFieldName}"`);
        return;
      }
      
      // Actualizar datos_adicionales
      const { error } = await supabase
        .from('lead_datos_personales')
        .update({
          datos_adicionales: {
            ...lead.datos_adicionales,
            [normalizedName]: newFieldValue.trim() || null
          }
        })
        .eq('lead_id', lead.id);
        
      if (error) throw error;
      
      toast.success(`Campo "${newFieldName}" añadido`);
      setIsAddingField(false);
      setNewFieldName("");
      setNewFieldValue("");
    } catch (error) {
      console.error('Error al añadir campo:', error);
      toast.error('No se pudo añadir el campo');
    } finally {
      setLoading(null);
    }
  };

  const deleteField = async (key: string) => {
    try {
      setLoading(key);
      
      // Crear una copia de datos_adicionales sin el campo a eliminar
      const { [key]: _, ...updatedFields } = lead.datos_adicionales || {};
      
      // Actualizar en la base de datos
      const { error } = await supabase
        .from('lead_datos_personales')
        .update({
          datos_adicionales: updatedFields
        })
        .eq('lead_id', lead.id);
        
      if (error) throw error;
      
      toast.success(`Campo "${key}" eliminado`);
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error al eliminar campo:', error);
      toast.error('No se pudo eliminar el campo');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Datos Personales</CardTitle>
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8 gap-1.5"
          onClick={() => setIsAddingField(true)}
          disabled={isAddingField}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="text-xs">Añadir campo</span>
        </Button>
      </CardHeader>
      <CardContent>
        {isAddingField && (
          <div className="mb-6 p-4 border rounded-md bg-muted/30">
            <h4 className="text-sm font-medium mb-3">Añadir campo personalizado</h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="newFieldName" className="text-xs text-muted-foreground">Nombre del campo</Label>
                <Input 
                  id="newFieldName"
                  value={newFieldName} 
                  onChange={(e) => setNewFieldName(e.target.value)} 
                  placeholder="Ej: Profesión, Intereses, etc." 
                  className="h-8 mt-1"
                />
              </div>
              <div>
                <Label htmlFor="newFieldValue" className="text-xs text-muted-foreground">Valor</Label>
                <Input 
                  id="newFieldValue"
                  value={newFieldValue} 
                  onChange={(e) => setNewFieldValue(e.target.value)} 
                  placeholder="Valor del campo" 
                  className="h-8 mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsAddingField(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  size="sm" 
                  onClick={addNewField}
                  disabled={loading === 'newField'}
                >
                  {loading === 'newField' ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                      Guardando...
                    </span>
                  ) : (
                    <>Añadir</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-5">
          {/* Sección de información básica */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
              Información Básica
            </h3>
            <div className="rounded-md border bg-card overflow-hidden">
              <div className="divide-y">
                {personalData["Información Básica"].map((item, index) => (
                  <div key={index} className="px-3 py-2 group hover:bg-muted/50 transition-colors">
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <div className="text-sm text-muted-foreground">{item.label}:</div>
                      {editingField === item.key ? (
                        <div className="col-span-2 flex items-center gap-2">
                          <Input 
                            value={editValue} 
                            onChange={(e) => setEditValue(e.target.value)} 
                            className="h-7 text-sm py-1 flex-1"
                            autoFocus
                          />
                          <div className="flex gap-1 shrink-0">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50" 
                              onClick={() => saveField("Información Básica", item.key)}
                              disabled={loading === item.key}
                            >
                              {loading === item.key ? (
                                <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50" 
                              onClick={cancelEditing}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm flex items-center gap-1 col-span-2">
                          <span className="flex-1 font-medium">{item.value}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => startEditing(item.key, item.value)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sección de ubicación */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
              Ubicación
            </h3>
            <div className="rounded-md border bg-card overflow-hidden">
              <div className="divide-y">
                {personalData["Ubicación"].map((item, index) => (
                  <div key={index} className="px-3 py-2 group hover:bg-muted/50 transition-colors">
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <div className="text-sm text-muted-foreground">{item.label}:</div>
                      {editingField === item.key ? (
                        <div className="col-span-2 flex items-center gap-2">
                          <Input 
                            value={editValue} 
                            onChange={(e) => setEditValue(e.target.value)} 
                            className="h-7 text-sm py-1 flex-1"
                            autoFocus
                          />
                          <div className="flex gap-1 shrink-0">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50" 
                              onClick={() => saveField("Ubicación", item.key)}
                              disabled={loading === item.key}
                            >
                              {loading === item.key ? (
                                <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50" 
                              onClick={cancelEditing}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm flex items-center gap-1 col-span-2">
                          <span className="flex-1 font-medium">{item.value}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => startEditing(item.key, item.value)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sección de datos personalizados */}
          {personalData["Datos Adicionales"].length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                  Campos Personalizados
                </div>
                <Badge variant="outline" className="text-xs">
                  {personalData["Datos Adicionales"].length}
                </Badge>
              </h3>
              <div className="rounded-md border bg-card overflow-hidden">
                <div className="divide-y">
                  {personalData["Datos Adicionales"].map((item, index) => (
                    <div key={index} className="px-3 py-2 group hover:bg-muted/50 transition-colors">
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <div className="text-sm text-muted-foreground">{item.label}:</div>
                        {editingField === item.key ? (
                          <div className="col-span-2 flex items-center gap-2">
                            <Input 
                              value={editValue} 
                              onChange={(e) => setEditValue(e.target.value)} 
                              className="h-7 text-sm py-1 flex-1"
                              autoFocus
                            />
                            <div className="flex gap-1 shrink-0">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50" 
                                onClick={() => saveField("Datos Adicionales", item.key)}
                                disabled={loading === item.key}
                              >
                                {loading === item.key ? (
                                  <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50" 
                                onClick={cancelEditing}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm flex items-center gap-1 col-span-2">
                            <span className="flex-1 font-medium">{item.value}</span>
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => startEditing(item.key, item.value)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              {item.customField && (
                                <AlertDialog open={confirmDelete === item.key} onOpenChange={(open) => {
                                  if (!open) setConfirmDelete(null);
                                }}>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 text-destructive hover:text-destructive"
                                      onClick={() => setConfirmDelete(item.key)}
                                    >
                                      <Trash className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Eliminar este campo?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción eliminará permanentemente el campo "{item.label}" y su valor.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction 
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={() => deleteField(item.key)}
                                        disabled={loading === item.key}
                                      >
                                        {loading === item.key ? (
                                          <span className="inline-flex items-center gap-1">
                                            <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                                            Eliminando...
                                          </span>
                                        ) : (
                                          <>Eliminar</>
                                        )}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Mensaje si no hay campos personalizados */}
          {!isAddingField && personalData["Datos Adicionales"].length === 0 && (
            <div className="text-center py-5 border rounded-md bg-muted/20">
              <p className="text-sm text-muted-foreground mb-2">No hay campos personalizados</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5"
                onClick={() => setIsAddingField(true)}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Añadir campo</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
