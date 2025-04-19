import * as React from "react";
import { X, Plus, MessageSquare, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export interface QAExample {
  question: string;
  answer: string;
}

interface QAExampleInputProps {
  value: QAExample[];
  onChange: (value: QAExample[]) => void;
  maxExamples?: number;
}

export function QAExampleInput({
  value = [],
  onChange,
  maxExamples = 10,
}: QAExampleInputProps) {
  
  const handleAddExample = () => {
    if (value.length >= maxExamples) return;
    onChange([...value, { question: "", answer: "" }]);
  };

  const handleRemoveExample = (index: number) => {
    const newExamples = [...value];
    newExamples.splice(index, 1);
    onChange(newExamples);
  };

  const handleChangeQuestion = (index: number, questionText: string) => {
    const newExamples = [...value];
    newExamples[index].question = questionText;
    onChange(newExamples);
  };

  const handleChangeAnswer = (index: number, answerText: string) => {
    const newExamples = [...value];
    newExamples[index].answer = answerText;
    onChange(newExamples);
  };

  return (
    <div className="space-y-3">
      {value.map((example, index) => (
        <Card key={index} className="relative border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4 pt-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7"
              onClick={() => handleRemoveExample(index)}
              title="Eliminar ejemplo"
            >
              <X size={16} />
            </Button>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <MessageSquare size={14} className="text-muted-foreground" />
                  <span className="text-sm font-medium">Pregunta {index + 1}</span>
                </div>
                <Textarea
                  placeholder="Escribe aquí la pregunta de ejemplo..."
                  value={example.question}
                  onChange={(e) => handleChangeQuestion(index, e.target.value)}
                  className="min-h-[60px] resize-none"
                />
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <CornerDownLeft size={14} className="text-muted-foreground" />
                  <span className="text-sm font-medium">Respuesta {index + 1}</span>
                </div>
                <Textarea
                  placeholder="Escribe aquí la respuesta ideal..."
                  value={example.answer}
                  onChange={(e) => handleChangeAnswer(index, e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {value.length < maxExamples && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full border-dashed"
          onClick={handleAddExample}
        >
          <Plus size={16} className="mr-1" />
          Agregar ejemplo de pregunta y respuesta
        </Button>
      )}
      
      {value.length >= maxExamples && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Máximo {maxExamples} ejemplos permitidos
        </p>
      )}
    </div>
  );
}