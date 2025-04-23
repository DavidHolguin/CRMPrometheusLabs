import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpenText, Target, Bot, Sparkles, Plus, X, Check, Eye, EyeOff, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InstructionBlock {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  isPredefined: boolean;
  category?: string;
}

interface ContextTabProps {
  value: {
    main_purpose: string;
    welcome_message: string;
    general_context: string;
    special_instructions: string;
  };
  onChange: (value: ContextTabProps["value"]) => void;
}

// Bloques de instrucciones predefinidas
const predefinedBlocks: InstructionBlock[] = [
  {
    id: "clarity-format",
    title: "Claridad y Formato",
    content: `Markdown Esencial: Utiliza Markdown de forma moderada y consistente, enfocándote en elementos ampliamente compatibles (como en WhatsApp):
*Texto en negrita* para resaltar información clave, títulos de sección improvisados o términos importantes. (Usa * en lugar de ** para mayor compatibilidad).
_Texto en cursiva_ para énfasis sutil o títulos de obras. (Usa _ en lugar de * para mayor compatibilidad).
~Texto tachado~ si es necesario para indicar algo obsoleto o corregido.
\`\`\`Texto monoespaciado\`\`\` (triple backtick) para bloques de código, comandos literales o para preservar formato. Para texto corto inline, usa un solo backtick.
Listas:
Usa guiones - o asteriscos * para listas con viñetas (elige uno y sé consistente).
Usa números 1., 2., 3. para listas ordenadas o pasos secuenciales.
Evita Markdown complejo: No uses # para encabezados, > para citas, --- para líneas horizontales, o tablas complejas, ya que pueden no renderizarse correctamente en todas las plataformas. Prefiere la simplicidad.
Concisión y Legibilidad:
Sé directo y ve al grano. Elimina palabras o frases innecesarias.
Usa frases cortas y párrafos breves (máximo 3-4 líneas).
Utiliza saltos de línea (párrafos vacíos) para separar ideas y mejorar la escaneabilidad visual.
Lenguaje y Tono:
Responde siempre en el mismo idioma que el usuario utilizó en su último mensaje.
Adapta el tono (amigable, profesional, técnico, etc.) al contexto de la conversación y la personalidad definida para el bot, pero mantén siempre un fondo de amabilidad y respeto.`,
    enabled: true,
    isPredefined: true,
    category: "Formato"
  },
  {
    id: "response-structure",
    title: "Estructura de la Respuesta",
    content: `Respuesta Directa Primero: Comienza con la respuesta más importante o directa a la pregunta del usuario.
Contexto y Desarrollo: Luego, si es necesario, añade detalles, explicaciones o contexto adicional.
Introducción y Cierre (Opcional): Para respuestas más largas o complejas, considera una breve frase introductoria que resuma lo que vas a explicar y una frase final útil (ej. "¿Necesitas ayuda con algo más relacionado a esto?").
Segmentación Lógica: Divide respuestas largas en secciones lógicas usando listas, párrafos cortos o resaltados en *negrita* como pseudo-títulos para facilitar la lectura.`,
    enabled: true,
    isPredefined: true,
    category: "Estructura"
  },
  {
    id: "user-focus",
    title: "Enfoque Centrado en el Usuario",
    content: `Anticipación: Piensa en qué podría preguntar el usuario a continuación y, si es apropiado, incluye esa información o sugiere el siguiente paso lógico.
Claridad en Acciones: Si la respuesta implica que el usuario realice una acción, proporciona instrucciones claras, preferiblemente como una lista numerada paso a paso.
Comparación Equilibrada: Si presentas opciones, resume brevemente los puntos clave (pros/contras si aplica) de cada una para facilitar la decisión del usuario.`,
    enabled: true,
    isPredefined: true,
    category: "Enfoque"
  },
  {
    id: "conversational-style",
    title: "Estilo Conversacional y Personalidad",
    content: `Tono Natural y Empático: Evita sonar robótico. Usa un lenguaje natural, muestra empatía (cuando sea apropiado) y sé proactivo.
Evita Frases Genéricas de IA: No uses frases como "Como modelo de lenguaje...", "Según mis datos...", "No tengo acceso a información en tiempo real" (a menos que sea estrictamente necesario y no haya alternativa). Simplemente proporciona la información o indica la limitación de forma directa.
Personalización Contextual: Si el sistema lo permite y es relevante, usa referencias al contexto previo de la conversación para mostrar continuidad.`,
    enabled: true,
    isPredefined: true,
    category: "Personalidad"
  },
  {
    id: "adaptability",
    title: "Adaptabilidad e Interacción",
    content: `Petición de Clarificación: Si la pregunta del usuario es ambigua o falta información crucial, haz preguntas específicas y claras para obtener los detalles necesarios. Evita preguntas demasiado abiertas.
Manejo de Ambigüedad: Si no estás seguro de la intención, puedes ofrecer las interpretaciones más probables como opciones o pedir al usuario que precise.
Gestión de Errores o Problemas: Si el usuario reporta un problema o la conversación indica un error, reconócelo y ofrece soluciones prácticas, pasos para solucionarlo o alternativas viables.`,
    enabled: true,
    isPredefined: true,
    category: "Adaptabilidad"
  },
  {
    id: "specific-elements",
    title: "Uso de Elementos Específicos",
    content: `Enlaces: Preséntalos siempre con un texto descriptivo claro: [Texto Descriptivo del Enlace](https://...). Evita URLs desnudas a menos que sea inevitable.
Emojis: Úsalos con mucha moderación y solo si:
Aportan valor real (ej. énfasis visual, tono).
Son consistentes con la personalidad del bot y la marca.
No reemplazan palabras clave importantes.
Son universalmente entendidos.
Nunca los uses como relleno o de forma excesiva.
Visualizaciones: Evita tablas complejas. Si necesitas presentar datos comparativos, usa listas o descripciones claras. Las tablas simples de Markdown pueden no renderizarse bien en todas partes.`,
    enabled: true,
    isPredefined: true,
    category: "Elementos"
  },
  {
    id: "limitations",
    title: "Manejo de Limitaciones y Fallbacks",
    content: `Reconocer Limitaciones sin Excusas: Si no puedes responder directamente a una pregunta por falta de conocimiento o capacidad:
Reconoce directamente la limitación (ej. "No tengo acceso a esa información específica en este momento...").
Inmediatamente ofrece una alternativa útil: "¿Puedo ayudarte buscando información general sobre [tema relacionado]?" o "Lo que sí puedo hacer es [acción alternativa útil]".
Evita respuestas como "No sé" o "No puedo hacer eso" sin ofrecer nada más. El objetivo es siempre ser lo más útil posible dentro de las capacidades existentes.
Redirección Elegante: Si la pregunta está completamente fuera de alcance, indica amablemente el tipo de tareas o información con las que sí puedes ayudar.`,
    enabled: true,
    isPredefined: true,
    category: "Limitaciones"
  }
];

export function ContextTab({ value, onChange }: ContextTabProps) {
  // Lista de bloques de instrucciones (predefinidos + personalizados)
  const [instructionBlocks, setInstructionBlocks] = useState<InstructionBlock[]>([]);
  // Estado para el nuevo bloque que se está creando/editando
  const [newBlock, setNewBlock] = useState<InstructionBlock | null>(null);
  // Modo del diálogo: 'create' o 'edit'
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  // Estado para controlar la apertura del diálogo
  const [dialogOpen, setDialogOpen] = useState(false);
  // Estado para controlar la visualización previa de las instrucciones
  const [showPreview, setShowPreview] = useState(false);

  // Inicializar los bloques de instrucciones cuando el componente se monta
  useEffect(() => {
    let initialBlocks: InstructionBlock[] = [...predefinedBlocks];
    
    // Si ya hay instrucciones especiales guardadas, buscar bloques personalizados
    if (value.special_instructions) {
      try {
        // Intentar extraer bloques personalizados si están en formato JSON al inicio del texto
        const match = value.special_instructions.match(/^CUSTOM_BLOCKS:(\[.*?\])\n\n/s);
        if (match && match[1]) {
          const customBlocks = JSON.parse(match[1]);
          
          // Actualizar bloques predefinidos desde la configuración guardada si existe
          initialBlocks = initialBlocks.map(block => {
            const savedBlock = customBlocks.find((b: InstructionBlock) => 
              b.id === block.id && b.isPredefined === true);
            
            if (savedBlock) {
              return { ...block, enabled: savedBlock.enabled };
            }
            return block;
          });
          
          // Añadir bloques personalizados
          const customOnlyBlocks = customBlocks.filter((b: InstructionBlock) => !b.isPredefined);
          initialBlocks = [...initialBlocks, ...customOnlyBlocks];
        }
      } catch (error) {
        console.error("Error al procesar los bloques de instrucciones guardados:", error);
      }
    }
    
    setInstructionBlocks(initialBlocks);
  }, []); // Solo se ejecuta al montar el componente

  // Actualizar las instrucciones especiales cuando cambian los bloques
  useEffect(() => {
    if (instructionBlocks.length > 0) {
      updateSpecialInstructions();
    }
  }, [instructionBlocks]);

  const handleChange = (field: string, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  // Función para cambiar el estado de habilitación de un bloque
  const toggleBlockEnabled = (id: string) => {
    setInstructionBlocks(blocks => blocks.map(block => 
      block.id === id ? { ...block, enabled: !block.enabled } : block
    ));
  };

  // Función para actualizar las instrucciones especiales basado en los bloques habilitados
  const updateSpecialInstructions = () => {
    // Guardar la configuración de los bloques al inicio del texto
    const blocksConfig = instructionBlocks.map(block => ({
      id: block.id,
      title: block.title,
      enabled: block.enabled,
      isPredefined: block.isPredefined,
      category: block.category
    }));
    
    const blocksConfigText = `CUSTOM_BLOCKS:${JSON.stringify(blocksConfig)}\n\n`;
    
    // Generar el texto de las instrucciones combinando los bloques habilitados
    const instructionsText = instructionBlocks
      .filter(block => block.enabled)
      .map(block => `## ${block.title}\n\n${block.content}`)
      .join('\n\n');
    
    // Combinar configuración + instrucciones
    const finalInstructions = blocksConfigText + instructionsText;
    
    handleChange("special_instructions", finalInstructions);
  };

  // Función para abrir el diálogo de creación de un nuevo bloque
  const openCreateDialog = () => {
    setNewBlock({
      id: `custom-${Date.now()}`,
      title: "",
      content: "",
      enabled: true,
      isPredefined: false,
    });
    setDialogMode('create');
    setDialogOpen(true);
  };

  // Función para abrir el diálogo de edición de un bloque existente
  const openEditDialog = (block: InstructionBlock) => {
    setNewBlock({ ...block });
    setDialogMode('edit');
    setDialogOpen(true);
  };

  // Función para guardar un bloque (creación o edición)
  const saveBlock = () => {
    if (!newBlock || !newBlock.title.trim() || !newBlock.content.trim()) return;

    if (dialogMode === 'create') {
      // Añadir nuevo bloque
      setInstructionBlocks(blocks => [...blocks, newBlock]);
    } else {
      // Actualizar bloque existente
      setInstructionBlocks(blocks => blocks.map(block => 
        block.id === newBlock.id ? newBlock : block
      ));
    }

    // Cerrar diálogo y limpiar estado
    setDialogOpen(false);
    setNewBlock(null);
  };

  // Función para eliminar un bloque
  const deleteBlock = (id: string) => {
    setInstructionBlocks(blocks => blocks.filter(block => block.id !== id));
  };

  // Renderizar la visualización previa de las instrucciones
  const renderInstructionsPreview = () => {
    return instructionBlocks
      .filter(block => block.enabled)
      .map((block, index) => (
        <div key={block.id} className="mb-6">
          <h3 className="font-medium text-lg mb-2">{block.title}</h3>
          <div className="whitespace-pre-line text-sm">
            {block.content}
          </div>
          {index < instructionBlocks.filter(b => b.enabled).length - 1 && (
            <div className="h-px w-full bg-border/50 my-6" />
          )}
        </div>
      ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-1 bg-primary/10 p-2 rounded-md">
              <Target className="text-primary h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">Propósito principal</h3>
              <p className="text-sm text-muted-foreground">
                Define el objetivo principal y la función de tu chatbot.
                Esto ayuda al modelo a entender para qué se utilizará principalmente.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="main_purpose">¿Cuál es el propósito principal del chatbot?</Label>
            <Textarea
              id="main_purpose"
              placeholder="Ej: Atender consultas sobre productos, reservar citas, proporcionar información sobre eventos..."
              value={value.main_purpose}
              onChange={(e) => handleChange("main_purpose", e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-1 bg-primary/10 p-2 rounded-md">
              <Bot className="text-primary h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">Mensaje de bienvenida</h3>
              <p className="text-sm text-muted-foreground">
                Configura el primer mensaje que mostrará el chatbot cuando un usuario inicie la conversación.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcome_message">Mensaje de bienvenida</Label>
            <Textarea
              id="welcome_message"
              placeholder="Ej: ¡Hola! Soy el asistente virtual de [Empresa]. ¿En qué puedo ayudarte hoy?"
              value={value.welcome_message}
              onChange={(e) => handleChange("welcome_message", e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              Este será el primer mensaje que verán tus usuarios. Hazlo amigable y claro.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="mt-1 bg-primary/10 p-2 rounded-md">
              <BookOpenText className="text-primary h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">Contexto general</h3>
              <p className="text-sm text-muted-foreground">
                Proporciona información de fondo que el chatbot debe conocer para responder con precisión.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="general_context">Contexto y conocimiento base</Label>
            <Textarea
              id="general_context"
              placeholder="Describe información sobre tu empresa, productos, servicios o cualquier dato relevante que el chatbot deba conocer..."
              value={value.general_context}
              onChange={(e) => handleChange("general_context", e.target.value)}
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              Incluye información sobre tu empresa, productos, servicios, políticas o cualquier conocimiento específico que el chatbot deba tener.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-primary/10 p-2 rounded-md">
                <Sparkles className="text-primary h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-lg mb-1">Instrucciones especiales</h3>
                <p className="text-sm text-muted-foreground">
                  Configura bloques de instrucciones que guiarán el comportamiento del chatbot.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {showPreview ? "Ocultar vista previa" : "Ver vista previa"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={openCreateDialog}
                    >
                      <Plus size={16} className="mr-1" />
                      <span>Añadir bloque</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Añadir bloque de instrucciones personalizado
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {showPreview ? (
            <div className="border rounded-md p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Vista previa de instrucciones</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowPreview(false)}
                >
                  <X size={16} className="mr-1" />
                  <span>Cerrar</span>
                </Button>
              </div>
              <div className="prose prose-sm max-w-none">
                {instructionBlocks.filter(block => block.enabled).length === 0 ? (
                  <p className="text-muted-foreground italic">No hay instrucciones habilitadas</p>
                ) : renderInstructionsPreview()}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Instrucciones predefinidas</h4>
                <Accordion type="multiple" className="w-full">
                  {instructionBlocks
                    .filter(block => block.isPredefined)
                    .map(block => (
                      <AccordionItem key={block.id} value={block.id} className="border rounded-md mb-2">
                        <div className="flex items-center px-4">
                          <Switch
                            checked={block.enabled}
                            onCheckedChange={() => toggleBlockEnabled(block.id)}
                            className="mr-3"
                          />
                          <AccordionTrigger className="py-2 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={block.enabled ? "font-medium" : "text-muted-foreground"}>
                                {block.title}
                              </span>
                              {block.category && (
                                <Badge variant="outline" className="text-xs">
                                  {block.category}
                                </Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                        </div>
                        <AccordionContent className="px-4 pb-3 pt-0">
                          <div className="whitespace-pre-line text-sm border-l-2 pl-3 ml-9">
                            {block.content}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Instrucciones personalizadas</h4>
                {instructionBlocks.filter(block => !block.isPredefined).length === 0 ? (
                  <div className="text-center p-6 border border-dashed rounded-md">
                    <p className="text-muted-foreground mb-3">
                      Aún no has añadido bloques personalizados
                    </p>
                    <Button variant="outline" size="sm" onClick={openCreateDialog}>
                      <Plus size={16} className="mr-1" />
                      <span>Añadir bloque personalizado</span>
                    </Button>
                  </div>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {instructionBlocks
                      .filter(block => !block.isPredefined)
                      .map(block => (
                        <AccordionItem key={block.id} value={block.id} className="border rounded-md mb-2">
                          <div className="flex items-center px-4">
                            <Switch
                              checked={block.enabled}
                              onCheckedChange={() => toggleBlockEnabled(block.id)}
                              className="mr-3"
                            />
                            <AccordionTrigger className="py-2 flex-1">
                              <span className={block.enabled ? "font-medium" : "text-muted-foreground"}>
                                {block.title}
                              </span>
                            </AccordionTrigger>
                            <div className="flex gap-1 mr-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(block);
                                }}
                              >
                                <Edit size={14} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:text-destructive" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteBlock(block.id);
                                }}
                              >
                                <Trash size={14} />
                              </Button>
                            </div>
                          </div>
                          <AccordionContent className="px-4 pb-3 pt-0">
                            <div className="whitespace-pre-line text-sm border-l-2 pl-3 ml-9">
                              {block.content}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para crear/editar bloques */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Crear nuevo bloque de instrucciones' : 'Editar bloque de instrucciones'}
            </DialogTitle>
            <DialogDescription>
              Añade instrucciones específicas sobre cómo debe comportarse el chatbot
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="block-title">Título del bloque</Label>
              <Input
                id="block-title"
                placeholder="Ej: Restricciones de contenido"
                value={newBlock?.title || ''}
                onChange={(e) => setNewBlock(prev => prev ? {...prev, title: e.target.value} : null)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="block-content">Contenido</Label>
              <Textarea
                id="block-content"
                placeholder="Describe las instrucciones específicas para este bloque..."
                value={newBlock?.content || ''}
                onChange={(e) => setNewBlock(prev => prev ? {...prev, content: e.target.value} : null)}
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                Puedes usar texto plano o formato Markdown básico.
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setNewBlock(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={saveBlock}
              disabled={!newBlock?.title || !newBlock?.content}
            >
              {dialogMode === 'create' ? 'Crear bloque' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}