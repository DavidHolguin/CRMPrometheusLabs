
import { Lead } from "@/hooks/useLeads";
import { useState } from "react";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Save, Plus, User, Mail, Phone, Map, Calendar, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
  const scoreValue = Math.round((lead.score / 100) * 100);
  
  return (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="personal">Datos Personales</TabsTrigger>
        <TabsTrigger value="contacto">Contacto</TabsTrigger>
        <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
      </TabsList>
      
      <TabsContent value="personal" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Form {...form}>
              <div className="space-y-1">
                {renderEditableField("Nombre", "nombre", <User size={16} className="text-blue-500" />, form.getValues("nombre"))}
                {renderEditableField("Apellido", "apellido", <User size={16} className="text-blue-500" />, form.getValues("apellido"))}
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
      
      <TabsContent value="contacto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form {...form}>
            <div className="space-y-1">
              {renderEditableField("Email", "email", <Mail size={16} className="text-blue-500" />, form.getValues("email"))}
              {renderEditableField("Teléfono", "telefono", <Phone size={16} className="text-green-500" />, form.getValues("telefono"))}
            </div>
          </Form>
          
          <div className="bg-card rounded-md p-3 border shadow-sm">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <span>Canal de Origen</span>
              <Badge>{lead.canal_origen || "Desconocido"}</Badge>
            </h4>
            <div className="text-xs text-muted-foreground">
              Lead creado el {formatDate(lead.created_at)}
            </div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="estadisticas">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Puntuación</h4>
            <div className="bg-card rounded-md p-4 border shadow-sm">
              <div className="flex justify-center">
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
                      stroke={scoreValue > 75 ? "#10b981" : scoreValue > 50 ? "#f59e0b" : scoreValue > 25 ? "#f97316" : "#ef4444"}
                      strokeWidth="2"
                      strokeDasharray={`${scoreValue}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-bold">{lead.score}</span>
                    <span className="text-xs text-muted-foreground">puntos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Actividad</h4>
            <div className="space-y-3">
              <div className="bg-card rounded-md p-3 border shadow-sm">
                <div className="text-sm mb-1">Mensajes</div>
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-slate-200">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, messageCount * 5)}%` }}
                      transition={{ duration: 1 }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                    ></motion.div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-semibold inline-block text-blue-500">
                      {messageCount}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-md p-3 border shadow-sm">
                <div className="text-sm mb-1">Interacciones</div>
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-slate-200">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, interactionCount * 10)}%` }}
                      transition={{ duration: 1 }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                    ></motion.div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-semibold inline-block text-green-500">
                      {interactionCount}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-card rounded-md p-3 border shadow-sm">
                <div className="text-sm mb-1">Etapa actual</div>
                <Badge style={{ backgroundColor: lead.stage_color }} className="w-full justify-center py-2 text-center">
                  {lead.stage_name}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
