import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  MessageSquare,
  Mail,
  BellRing,
  TimerReset,
  Calendar,
  AlertCircle,
  X,
} from "lucide-react";

interface Intent {
  id: string;
  name: string;
  keywords: string[];
  response: string;
  action: string;
}

interface Automation {
  id: string;
  trigger: {
    type: string;
    condition: string;
  };
  action: {
    type: string;
    value: string;
  };
}

interface AgenteAutomationProps {
  onDataChange: (data: {
    intents: Intent[];
    automations: Automation[];
  }) => void;
  initialData?: {
    intents: Intent[];
    automations: Automation[];
  };
}

const actionTypes = [
  { id: "reply", name: "Responder", icon: MessageSquare },
  { id: "email", name: "Enviar email", icon: Mail },
  { id: "notify", name: "Notificar", icon: BellRing },
  { id: "wait", name: "Esperar", icon: TimerReset },
  { id: "schedule", name: "Agendar", icon: Calendar },
];

const triggerTypes = [
  { id: "inactivity", name: "Sin actividad", icon: TimerReset },
  { id: "keyword", name: "Palabra clave", icon: MessageSquare },
  { id: "schedule", name: "Horario", icon: Calendar },
  { id: "error", name: "Error", icon: AlertCircle },
];

export function AgenteAutomation({
  onDataChange,
  initialData,
}: AgenteAutomationProps) {
  const [intents, setIntents] = useState<Intent[]>(initialData?.intents || []);
  const [automations, setAutomations] = useState<Automation[]>(
    initialData?.automations || []
  );
  const [newKeyword, setNewKeyword] = useState("");

  const addIntent = () => {
    const newIntent: Intent = {
      id: Math.random().toString(36).substr(2, 9),
      name: "Nueva intención",
      keywords: [],
      response: "",
      action: "reply",
    };
    setIntents([...intents, newIntent]);
    updateData([...intents, newIntent], automations);
  };

  const removeIntent = (id: string) => {
    const updated = intents.filter((intent) => intent.id !== id);
    setIntents(updated);
    updateData(updated, automations);
  };

  const updateIntent = (id: string, field: keyof Intent, value: any) => {
    const updated = intents.map((intent) =>
      intent.id === id ? { ...intent, [field]: value } : intent
    );
    setIntents(updated);
    updateData(updated, automations);
  };

  const addKeyword = (intentId: string) => {
    if (!newKeyword.trim()) return;
    const updated = intents.map((intent) =>
      intent.id === intentId
        ? { ...intent, keywords: [...intent.keywords, newKeyword.trim()] }
        : intent
    );
    setIntents(updated);
    setNewKeyword("");
    updateData(updated, automations);
  };

  const removeKeyword = (intentId: string, keyword: string) => {
    const updated = intents.map((intent) =>
      intent.id === intentId
        ? {
            ...intent,
            keywords: intent.keywords.filter((k) => k !== keyword),
          }
        : intent
    );
    setIntents(updated);
    updateData(updated, automations);
  };

  const addAutomation = (type: string) => {
    const newAutomation: Automation = {
      id: Math.random().toString(36).substr(2, 9),
      trigger: {
        type,
        condition: "",
      },
      action: {
        type: "reply",
        value: "",
      },
    };
    setAutomations([...automations, newAutomation]);
    updateData(intents, [...automations, newAutomation]);
  };

  const updateData = (updatedIntents: Intent[], updatedAutomations: Automation[]) => {
    onDataChange({
      intents: updatedIntents,
      automations: updatedAutomations,
    });
  };

  return (
    <div className="space-y-6">
      {/* Tabla de intenciones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-medium">Intenciones</CardTitle>
          <Button onClick={addIntent} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Añadir intención
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Palabras clave</TableHead>
                  <TableHead>Respuesta</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {intents.map((intent) => (
                  <TableRow key={intent.id}>
                    <TableCell>
                      <Input
                        value={intent.name}
                        onChange={(e) =>
                          updateIntent(intent.id, "name", e.target.value)
                        }
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {intent.keywords.map((keyword) => (
                            <Badge
                              key={keyword}
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => removeKeyword(intent.id, keyword)}
                            >
                              {keyword}
                              <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            placeholder="Nueva palabra clave"
                            className="h-8"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                addKeyword(intent.id);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addKeyword(intent.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={intent.response}
                        onChange={(e) =>
                          updateIntent(intent.id, "response", e.target.value)
                        }
                        placeholder="Respuesta predefinida..."
                        className="min-h-[80px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={intent.action}
                        onValueChange={(value) =>
                          updateIntent(intent.id, "action", value)
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Seleccionar acción" />
                        </SelectTrigger>
                        <SelectContent>
                          {actionTypes.map((action) => {
                            const Icon = action.icon;
                            return (
                              <SelectItem key={action.id} value={action.id}>
                                <div className="flex items-center">
                                  <Icon className="h-4 w-4 mr-2" />
                                  {action.name}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIntent(intent.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Constructor de automatizaciones */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">Automatizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {triggerTypes.map((trigger) => {
              const Icon = trigger.icon;
              return (
                <Card
                  key={trigger.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => addAutomation(trigger.id)}
                >
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium">{trigger.name}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {automations.length > 0 && (
            <ScrollArea className="h-[200px] mt-6 rounded-md border">
              <div className="p-4 space-y-4">
                {automations.map((automation) => {
                  const TriggerIcon =
                    triggerTypes.find((t) => t.id === automation.trigger.type)
                      ?.icon || AlertCircle;
                  const ActionIcon =
                    actionTypes.find((a) => a.id === automation.action.type)
                      ?.icon || MessageSquare;
                  return (
                    <div
                      key={automation.id}
                      className="flex items-center gap-4 p-4 rounded-lg border bg-muted/50"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <TriggerIcon className="h-4 w-4" />
                        </div>
                        <div className="text-sm">
                          Cuando{" "}
                          <span className="font-medium">
                            {
                              triggerTypes.find(
                                (t) => t.id === automation.trigger.type
                              )?.name
                            }
                          </span>
                        </div>
                        <div className="h-px w-12 bg-border" />
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <ActionIcon className="h-4 w-4" />
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">
                            {
                              actionTypes.find(
                                (a) => a.id === automation.action.type
                              )?.name
                            }
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const updated = automations.filter(
                            (a) => a.id !== automation.id
                          );
                          setAutomations(updated);
                          updateData(intents, updated);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}