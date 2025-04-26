import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  FileText,
  CheckCircle,
  X,
  AlertCircle,
  Target,
  CheckSquare,
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
    goals?: {
      objectives: string;
      keyPoints: string[];
      examples: Array<{
        id: string;
        type: 'positive' | 'negative';
        text: string;
      }>;
    };
    agenteId?: string;
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

export function AgenteReview({ data }: AgenteReviewProps) {
  const { basic, knowledge, personality, goals, agenteId } = data;

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
              {agenteId && (
                <Badge variant="outline" className="mt-2">ID: {agenteId}</Badge>
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

      {/* Objetivos y ejemplos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            Objetivos y ejemplos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Objetivos del agente */}
            <div>
              <h4 className="text-sm font-medium mb-3">Objetivos del agente</h4>
              {goals?.objectives ? (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm whitespace-pre-wrap">
                      {goals.objectives}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No se han definido objetivos
                </p>
              )}
            </div>

            {/* Puntos clave */}
            <div>
              <h4 className="text-sm font-medium mb-3">Puntos clave</h4>
              {goals?.keyPoints && goals.keyPoints.length > 0 ? (
                <div className="space-y-2">
                  {goals.keyPoints.map((point, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckSquare className="h-4 w-4 text-primary mt-1" />
                      <p className="text-sm">{point}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No se han definido puntos clave
                </p>
              )}
            </div>

            {/* Ejemplos */}
            <div>
              <h4 className="text-sm font-medium mb-3">Ejemplos</h4>
              {goals?.examples && goals.examples.length > 0 ? (
                <ScrollArea className="h-[200px] rounded-md border">
                  <div className="p-4 space-y-4">
                    {goals.examples.map((example) => (
                      <Card key={example.id} className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <Badge
                              variant={example.type === 'positive' ? 'default' : 'destructive'}
                            >
                              {example.type === 'positive' ? 'Ejemplo positivo' : 'Ejemplo negativo'}
                            </Badge>
                            <p className="text-sm">{example.text}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No se han añadido ejemplos
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}