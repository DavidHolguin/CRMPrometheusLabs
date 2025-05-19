import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Campo {
  id: string;
  label: string;
  tipo: string;
  requerido: boolean;
  opciones?: string[];
  placeholder?: string;
}

interface Formulario {
  id: string;
  nombre: string;
  descripcion: string;
  campos: Campo[];
}

interface FormularioPreviewProps {
  formulario: Formulario;
  open: boolean;
  onClose: () => void;
}

export function FormularioPreview({ formulario, open, onClose }: FormularioPreviewProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // En la versión de vista previa solo simulamos el envío
    alert('Este es solo un formulario de vista previa. En producción, los datos serían enviados.');
  };

  // Renderizar campo según su tipo
  const renderField = (campo: Campo) => {
    switch (campo.tipo) {
      case 'text':
        return (
          <div className="space-y-2" key={campo.id}>
            <Label htmlFor={campo.id} className="text-gray-700 font-medium">
              {campo.label} {campo.requerido && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={campo.id}
              name={campo.id}
              placeholder={campo.placeholder || `Introduce ${campo.label.toLowerCase()}`}
              className="border-gray-300 focus:border-[#002AE0] focus:ring-2 focus:ring-[#002AE0] focus:ring-opacity-30 transition-all duration-200"
              required={campo.requerido}
            />
          </div>
        );
      case 'email':
        return (
          <div className="space-y-2" key={campo.id}>
            <Label htmlFor={campo.id} className="text-gray-700 font-medium">
              {campo.label} {campo.requerido && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={campo.id}
              name={campo.id}
              type="email"
              placeholder={campo.placeholder || "correo@ejemplo.com"}
              className="border-gray-300 focus:border-[#002AE0] focus:ring-2 focus:ring-[#002AE0] focus:ring-opacity-30 transition-all duration-200"
              required={campo.requerido}
            />
          </div>
        );
      case 'textarea':
        return (
          <div className="space-y-2" key={campo.id}>
            <Label htmlFor={campo.id} className="text-gray-700 font-medium">
              {campo.label} {campo.requerido && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={campo.id}
              name={campo.id}
              placeholder={campo.placeholder || `Introduce ${campo.label.toLowerCase()}`}
              className="border-gray-300 focus:border-[#002AE0] focus:ring-2 focus:ring-[#002AE0] focus:ring-opacity-30 transition-all duration-200"
              required={campo.requerido}
              rows={4}
            />
          </div>
        );
      case 'select':
        return (
          <div className="space-y-2" key={campo.id}>
            <Label htmlFor={campo.id} className="text-gray-700 font-medium">
              {campo.label} {campo.requerido && <span className="text-red-500">*</span>}
            </Label>
            <Select>
              <SelectTrigger
                id={campo.id}
                className="border-gray-300 focus:border-[#002AE0] focus:ring-2 focus:ring-[#002AE0] focus:ring-opacity-30"
              >
                <SelectValue placeholder={campo.placeholder || "Selecciona una opción"} />
              </SelectTrigger>
              <SelectContent>
                {campo.opciones?.map((opcion) => (
                  <SelectItem key={opcion} value={opcion}>
                    {opcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'number':
        return (
          <div className="space-y-2" key={campo.id}>
            <Label htmlFor={campo.id} className="text-gray-700 font-medium">
              {campo.label} {campo.requerido && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={campo.id}
              name={campo.id}
              type="number"
              placeholder={campo.placeholder || "0"}
              className="border-gray-300 focus:border-[#002AE0] focus:ring-2 focus:ring-[#002AE0] focus:ring-opacity-30 transition-all duration-200"
              required={campo.requerido}
            />
          </div>
        );
      case 'phone':
        return (
          <div className="space-y-2" key={campo.id}>
            <Label htmlFor={campo.id} className="text-gray-700 font-medium">
              {campo.label} {campo.requerido && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={campo.id}
              name={campo.id}
              type="tel"
              placeholder={campo.placeholder || "+1 (123) 456-7890"}
              className="border-gray-300 focus:border-[#002AE0] focus:ring-2 focus:ring-[#002AE0] focus:ring-opacity-30 transition-all duration-200"
              required={campo.requerido}
            />
          </div>
        );
      default:
        return (
          <div className="space-y-2" key={campo.id}>
            <Label htmlFor={campo.id} className="text-gray-700 font-medium">
              {campo.label} {campo.requerido && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={campo.id}
              name={campo.id}
              placeholder={campo.placeholder || `Introduce ${campo.label.toLowerCase()}`}
              className="border-gray-300 focus:border-[#002AE0] focus:ring-2 focus:ring-[#002AE0] focus:ring-opacity-30 transition-all duration-200"
              required={campo.requerido}
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Vista previa del formulario</DialogTitle>
        </DialogHeader>

        <div className="p-4 border rounded-lg mt-4">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-[#002AE0] mb-2">{formulario.nombre}</h2>
            {formulario.descripcion && (
              <p className="text-gray-600">{formulario.descripcion}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {formulario.campos.map((campo) => renderField(campo))}

            <Button type="submit" className="w-full bg-[#002AE0] hover:bg-blue-700">
              Enviar
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
