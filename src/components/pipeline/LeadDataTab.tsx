
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Edit, Save, Plus, User, Map, Calendar, 
  FileText, Mail, Phone
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lead } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LeadScoreChart } from "./LeadScoreChart";
import { LeadActivityChart } from "./LeadActivityChart";
import { LeadInteractionsList } from "./LeadInteractionsList";

interface LeadDataTabProps {
  lead: Lead;
  formatDate: (dateStr: string | null) => string;
}

export function LeadDataTab({ lead, formatDate }: LeadDataTabProps) {
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [customFields, setCustomFields] = useState<Array<{key: string, value: string}>>([]);
  const [newCustomField, setNewCustomField] = useState({key: "", value: ""});
  
  // Convert lead.score to a number for all calculations and displays
  const scoreNumber = Number(lead.score || 0);

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

  // Fetch lead interactions
  const { data: interactions = [], isLoading: loadingInteractions } = useQuery({
    queryKey: ["leadInteractions", lead.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_interactions")
        .select(`
          id, 
          created_at, 
          valor_score,
          interaction_type_id,
          lead_interaction_types:interaction_type_id (id, nombre, color)
        `)
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });
        
      if (error) {
        console.error("Error fetching interactions:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!lead.id,
  });
  
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

  // Get stats for charts
  const messageCount = lead.message_count || 0;
  const interactionCount = lead.interaction_count || 0;
  
  // Generate message activity data (fake data for now, will be replaced with real data)
  const generateMessageActivityData = () => {
    const today = new Date();
    const data = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      data.push({
        date: dateStr,
        messages: Math.floor(Math.random() * 5), // Random value between 0-5
        interactions: Math.floor(Math.random() * 3) // Random value between 0-3
      });
    }
    return data;
  };

  const messageActivityData = useMemo(() => generateMessageActivityData(), []);

  return (
    <div>
      {/* Main Tabs - Reordered to have Progreso first */}
      <Tabs defaultValue="progreso" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/60">
          <TabsTrigger value="progreso">Progreso</TabsTrigger>
          <TabsTrigger value="datos">Datos Personales</TabsTrigger>
        </TabsList>
        
        {/* Progreso Tab Content - Redesigned with modern charts */}
        <TabsContent value="progreso" className="space-y-4">
          {/* Lead Score Section - Using extracted component */}
          <LeadScoreChart 
            score={scoreNumber} 
            interactionCount={interactionCount} 
            stageName={lead.stage_name || ""}
          />

          {/* Activity/Messages Chart - Using extracted component */}
          <LeadActivityChart activityData={messageActivityData} />

          {/* Lead interaction history - Using extracted component */}
          <LeadInteractionsList 
            interactions={interactions} 
            isLoading={loadingInteractions} 
            formatDate={formatDate}
          />
          
          {/* Current stage info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Etapa actual</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <Badge 
                style={{ backgroundColor: lead.stage_color }} 
                className="w-full justify-center py-2 text-center"
              >
                {lead.stage_name}
              </Badge>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Datos Personales Tab Content - with secondary styling */}
        <TabsContent value="datos" className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Información Personal</h3>
            <Separator />
          </div>
          
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
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Información de Contacto</h3>
            <Separator />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium">{lead.email || "No disponible"}</div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">Teléfono</div>
                    <div className="font-medium">{lead.telefono || "No disponible"}</div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-4">
            <div className="space-y-1 mb-3">
              <h3 className="text-lg font-semibold">Campos Personalizados</h3>
              <Separator />
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-muted-foreground">
                Agrega información adicional personalizada
              </div>
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {customFields.map((field, index) => (
                <div key={index} className="flex justify-between items-center bg-accent/20 p-2 rounded-md">
                  <span className="text-xs font-medium">{field.key}:</span>
                  <span className="text-xs">{field.value}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
