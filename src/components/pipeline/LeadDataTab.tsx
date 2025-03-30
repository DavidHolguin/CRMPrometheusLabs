
import { Lead } from "@/hooks/useLeads";
import { useState } from "react";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Save, Plus, User, Map, Calendar, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LeadDataTabProps {
  lead: Lead;
  formatDate: (dateStr: string | null) => string;
}

export function LeadDataTab({ lead, formatDate }: LeadDataTabProps) {
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [customFields, setCustomFields] = useState<Array<{key: string, value: string}>>([]);
  const [newCustomField, setNewCustomField] = useState({key: "", value: ""});
  
  // Setup form with default values from the lead
  const form = useForm({
    defaultValues: {
      nombre: lead.nombre || "",
      apellido: lead.apellido || "",
      email: lead.email || "",
      telefono: lead.telefono || "",
      documento_tipo: "DNI",
      documento_numero: "",
      fecha_nacimiento: "",
      direccion: lead.direccion || "",
      ciudad: lead.ciudad || "",
      pais: lead.pais || "",
      codigo_postal: "",
    }
  });
  
  const toggleEditMode = (field: string) => {
    setEditMode(prev => ({...prev, [field]: !prev[field]}));
  };
  
  const addCustomField = () => {
    if (newCustomField.key && newCustomField.value) {
      setCustomFields([...customFields, newCustomField]);
      setNewCustomField({key: "", value: ""});
    }
  };
  
  // Function to render field with edit toggle
  const renderEditableField = (label: string, field: string, icon: JSX.Element, value: string) => {
    return (
      <div className="mb-3 bg-card rounded-md p-3 border shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{label}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7" 
            onClick={() => toggleEditMode(field)}
          >
            {editMode[field] ? <Save size={15} /> : <Edit size={15} />}
          </Button>
        </div>
        
        {!value && !editMode[field] ? (
          <div 
            className="text-sm text-muted-foreground cursor-pointer p-2 border border-dashed rounded hover:bg-accent/50 flex justify-center"
            onClick={() => toggleEditMode(field)}
          >
            Click para agregar {label}
          </div>
        ) : editMode[field] ? (
          <FormField
            control={form.control}
            name={field as any}
            render={({ field: formField }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    className="h-8 text-sm" 
                    placeholder={label}
                    {...formField}
                    autoFocus
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ) : (
          <div className="text-sm py-1">{value}</div>
        )}
      </div>
    );
  };
  
  // Get interaction stats for visuals
  const messageCount = lead.message_count || 0;
  const interactionCount = lead.interaction_count || 0;
  
  // Convert lead.score to a number for all calculations and displays
  const scoreNumber = Number(lead.score || 0);
  
  return (
    <Tabs defaultValue="datos" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="datos">Datos Personales</TabsTrigger>
        <TabsTrigger value="estadisticas">Progreso</TabsTrigger>
      </TabsList>
      
      <TabsContent value="datos" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Form {...form}>
              <div className="space-y-1">
                {renderEditableField("Tipo de Documento", "documento_tipo", <FileText size={16} className="text-purple-500" />, form.getValues("documento_tipo"))}
                {renderEditableField("Número de Documento", "documento_numero", <FileText size={16} className="text-purple-500" />, form.getValues("documento_numero"))}
                {renderEditableField("Fecha de Nacimiento", "fecha_nacimiento", <Calendar size={16} className="text-green-500" />, form.getValues("fecha_nacimiento"))}
              </div>
            </Form>
          </div>
          <div>
            <Form {...form}>
              <div className="space-y-1">
                {renderEditableField("Dirección", "direccion", <Map size={16} className="text-orange-500" />, form.getValues("direccion"))}
                {renderEditableField("Ciudad", "ciudad", <Map size={16} className="text-orange-500" />, form.getValues("ciudad"))}
                {renderEditableField("País", "pais", <Map size={16} className="text-orange-500" />, form.getValues("pais"))}
                {renderEditableField("Código Postal", "codigo_postal", <Map size={16} className="text-orange-500" />, form.getValues("codigo_postal"))}
              </div>
            </Form>
            
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">Campos Personalizados</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addCustomField}
                  disabled={!newCustomField.key || !newCustomField.value}
                >
                  <Plus size={14} className="mr-1" />
                  Agregar
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Input 
                  placeholder="Nombre del campo" 
                  size="sm" 
                  className="h-8 text-xs"
                  value={newCustomField.key}
                  onChange={(e) => setNewCustomField({...newCustomField, key: e.target.value})}
                />
                <Input 
                  placeholder="Valor" 
                  size="sm" 
                  className="h-8 text-xs"
                  value={newCustomField.value}
                  onChange={(e) => setNewCustomField({...newCustomField, value: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                {customFields.map((field, index) => (
                  <div key={index} className="flex justify-between items-center bg-accent/20 p-2 rounded-md">
                    <span className="text-xs font-medium">{field.key}:</span>
                    <span className="text-xs">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="estadisticas">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Puntuación</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="flex justify-center mb-2">
                <div className={cn(
                  "w-32 h-32 rounded-full flex items-center justify-center relative",
                  "bg-gradient-to-r from-slate-200 to-slate-100"
                )}>
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#eee"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={scoreNumber > 75 ? "#10b981" : scoreNumber > 50 ? "#f59e0b" : scoreNumber > 25 ? "#f97316" : "#ef4444"}
                      strokeWidth="2"
                      strokeDasharray={`${scoreNumber}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-bold">{scoreNumber}</span>
                    <span className="text-xs text-muted-foreground">puntos</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Mensajes</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="text-center">
                  <span className="text-3xl font-bold text-blue-500">{messageCount}</span>
                </div>
                <Progress value={Math.min(100, messageCount * 5)} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Interacciones</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="text-center">
                  <span className="text-3xl font-bold text-green-500">{interactionCount}</span>
                </div>
                <Progress value={Math.min(100, interactionCount * 10)} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Etapa actual</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <Badge style={{ backgroundColor: lead.stage_color }} className="w-full justify-center py-2 text-center">
                  {lead.stage_name}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
