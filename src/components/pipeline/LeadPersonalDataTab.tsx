
import { useState } from "react";
import { Lead } from "@/hooks/useLeads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash, Save, X } from "lucide-react";
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

interface LeadPersonalDataTabProps {
  lead: Lead;
}

export function LeadPersonalDataTab({ lead }: LeadPersonalDataTabProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  
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

  const saveField = (section: string, key: string) => {
    // Here you would make an API call to update the lead
    toast.success(`Campo "${key}" actualizado`);
    setEditingField(null);
  };

  const cancelEditing = () => {
    setEditingField(null);
  };

  const addNewField = () => {
    if (!newFieldName.trim()) {
      toast.error("El nombre del campo es obligatorio");
      return;
    }

    // Here you would make an API call to add the field to datos_adicionales
    toast.success(`Campo "${newFieldName}" añadido`);
    setIsAddingField(false);
    setNewFieldName("");
    setNewFieldValue("");
  };

  const deleteField = (key: string) => {
    // Here you would make an API call to remove the field from datos_adicionales
    toast.success(`Campo "${key}" eliminado`);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Datos Personales</CardTitle>
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8 gap-1"
          onClick={() => setIsAddingField(true)}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="text-xs">Añadir campo</span>
        </Button>
      </CardHeader>
      <CardContent>
        {isAddingField && (
          <div className="mb-4 p-3 border rounded-md bg-muted/30">
            <h4 className="text-sm font-medium mb-2">Añadir campo personalizado</h4>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground">Nombre del campo</label>
                <Input 
                  value={newFieldName} 
                  onChange={(e) => setNewFieldName(e.target.value)} 
                  placeholder="Ej: Profesión, Intereses, etc." 
                  className="h-8 mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Valor</label>
                <Input 
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
                >
                  Añadir
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <Accordion type="multiple" defaultValue={["personal", "location"]}>
          <AccordionItem value="personal" className="border-b">
            <AccordionTrigger className="text-sm font-medium py-2">
              Información Básica
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-1">
                {personalData["Información Básica"].map((item, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2 group items-center">
                    <div className="text-sm text-muted-foreground">{item.label}:</div>
                    {editingField === item.key ? (
                      <div className="flex items-center gap-1">
                        <Input 
                          value={editValue} 
                          onChange={(e) => setEditValue(e.target.value)} 
                          className="h-7 text-sm py-1"
                        />
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => saveField("Información Básica", item.key)}
                          >
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={cancelEditing}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm flex items-center group">
                        <span className="flex-1">{item.value}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => startEditing(item.key, item.value)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="location" className="border-b">
            <AccordionTrigger className="text-sm font-medium py-2">
              Ubicación
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-1">
                {personalData["Ubicación"].map((item, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2 group items-center">
                    <div className="text-sm text-muted-foreground">{item.label}:</div>
                    {editingField === item.key ? (
                      <div className="flex items-center gap-1">
                        <Input 
                          value={editValue} 
                          onChange={(e) => setEditValue(e.target.value)} 
                          className="h-7 text-sm py-1"
                        />
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => saveField("Ubicación", item.key)}
                          >
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={cancelEditing}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm flex items-center group">
                        <span className="flex-1">{item.value}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => startEditing(item.key, item.value)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="additional" className={cn(
            !personalData["Datos Adicionales"].length && "hidden"
          )}>
            <AccordionTrigger className="text-sm font-medium py-2">
              Campos Personalizados
              {personalData["Datos Adicionales"].length > 0 && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {personalData["Datos Adicionales"].length}
                </Badge>
              )}
            </AccordionTrigger>
            <AccordionContent>
              {personalData["Datos Adicionales"].length > 0 ? (
                <div className="space-y-3 pt-1">
                  {personalData["Datos Adicionales"].map((item, index) => (
                    <div key={index} className="grid grid-cols-2 gap-2 group items-center">
                      <div className="text-sm text-muted-foreground">{item.label}:</div>
                      {editingField === item.key ? (
                        <div className="flex items-center gap-1">
                          <Input 
                            value={editValue} 
                            onChange={(e) => setEditValue(e.target.value)} 
                            className="h-7 text-sm py-1"
                          />
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6" 
                              onClick={() => saveField("Datos Adicionales", item.key)}
                            >
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6" 
                              onClick={cancelEditing}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm flex items-center">
                          <span className="flex-1">{item.value}</span>
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => startEditing(item.key, item.value)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {item.customField && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={() => deleteField(item.key)}
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No hay campos personalizados
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        {!isAddingField && (
          <div className="mt-4 text-xs text-muted-foreground text-center">
            Utiliza el botón 'Añadir campo' para agregar información personalizada para este lead.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
