import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  FileText,
  MessageSquare,
  Mail,
  BellRing,
  TimerReset,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";

interface AgenteReviewProps {
  data: {
    basic?: {
      nombre: string;
      email: string;
      sitioWeb?: string;
      avatar?: File | null;
    };
    knowledge?: {
      sources: Array<{
        id: string;
        type: string;
        name: string;
        status: string;
        progress: number;
      }>;
    };
    personality?: {
      preset: string;
      tone: number;
      instructions: string;
    };
    automation?: {
      intents: Array<{
        id: string;
        name: string;
        keywords: string[];
        response: string;
        action: string;
      }>;
      automations: Array<{
        id: string;
        trigger: {
          type: string;
          condition: string;
        };
        action: {
          type: string;
          value: string;
        };
      }>;
    };
  };
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

const getToneLabel = (tone: number) => {
  if (tone < 30) return "Muy formal";
  if (tone < 50) return "Formal";
  if (tone < 70) return "Neutral";
  if (tone < 90) return "Casual";
  return "Muy casual";
};

const actionIcons: Record<string, any> = {
  reply: MessageSquare,
  email: Mail,
  notify: BellRing,
  wait: TimerReset,
  schedule: Calendar,
};

const triggerIcons: Record<string, any> = {
  inactivity: TimerReset,
  keyword: MessageSquare,
  schedule: Calendar,
  error: AlertCircle,
};

export function AgenteReview({ data }: AgenteReviewProps) {
  const { basic, knowledge, personality, automation } = data;

  return (
    <div className="space-y-6">
      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Información básica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={basic?.avatar ? URL.createObjectURL(basic.avatar) : undefined} />
              <AvatarFallback>{getInitials(basic?.nombre || "NA")}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="font-medium">{basic?.nombre}</h3>
              <p className="text-sm text-muted-foreground">{basic?.email}</p>
              {basic?.sitioWeb && (
                <p className="text-sm text-muted-foreground">{basic.sitioWeb}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fuentes de conocimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Fuentes de conocimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {knowledge?.sources && knowledge.sources.length > 0 ? (
            <ScrollArea className="h-[200px] rounded-md border">
              <div className="p-4 space-y-4">
                {knowledge.sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center space-x-4">
                      <FileText className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{source.name}</p>
                        <div className="flex items-center space-x-2">
                          {source.status === "completed" ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-amber-500" />
                          )}
                          <p className="text-xs text-muted-foreground">
                            {source.status}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{source.progress}%</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">
              No se han agregado fuentes de conocimiento
            </p>
          )}
        </CardContent>
      </Card>

      {/* Personalidad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Personalidad y estilo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Tono de comunicación</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {getToneLabel(personality?.tone || 50)}
                </span>
                <span className="text-sm font-medium">
                  {personality?.tone || 50}%
                </span>
              </div>
              <Progress value={personality?.tone || 50} className="h-2" />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Instrucciones</p>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm whitespace-pre-wrap font-mono">
                    {personality?.instructions || "Sin instrucciones"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automatizaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Intenciones y automatizaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Intenciones */}
            <div>
              <h4 className="text-sm font-medium mb-3">Intenciones</h4>
              {automation?.intents && automation.intents.length > 0 ? (
                <ScrollArea className="h-[200px] rounded-md border">
                  <div className="p-4 space-y-4">
                    {automation.intents.map((intent) => (
                      <Card key={intent.id} className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <p className="font-medium">{intent.name}</p>
                              <div className="flex flex-wrap gap-1">
                                {intent.keywords.map((keyword) => (
                                  <Badge key={keyword} variant="secondary">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {intent.response}
                              </p>
                            </div>
                            {actionIcons[intent.action] && (
                              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                {React.createElement(actionIcons[intent.action], {
                                  className: "h-4 w-4",
                                })}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No se han definido intenciones
                </p>
              )}
            </div>

            {/* Automatizaciones */}
            <div>
              <h4 className="text-sm font-medium mb-3">Automatizaciones</h4>
              {automation?.automations && automation.automations.length > 0 ? (
                <ScrollArea className="h-[200px] rounded-md border">
                  <div className="p-4 space-y-4">
                    {automation.automations.map((automation) => {
                      const TriggerIcon = triggerIcons[automation.trigger.type];
                      const ActionIcon = actionIcons[automation.action.type];
                      return (
                        <div
                          key={automation.id}
                          className="flex items-center gap-4 p-4 rounded-lg border bg-muted/50"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                              {TriggerIcon && <TriggerIcon className="h-4 w-4" />}
                            </div>
                            <div className="text-sm">
                              Cuando{" "}
                              <span className="font-medium">
                                {automation.trigger.type}
                              </span>
                            </div>
                            <div className="h-px w-12 bg-border" />
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                              {ActionIcon && <ActionIcon className="h-4 w-4" />}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">
                                {automation.action.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No se han configurado automatizaciones
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}