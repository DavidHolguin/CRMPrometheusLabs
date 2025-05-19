import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Copy, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FormularioEmbebidoProps {
  formularioId: string;
  nombre: string;
  campos: Array<{
    id: string;
    label: string;
    tipo: string;
    requerido: boolean;
    opciones?: string;
  }>;
  open: boolean;
  onClose: () => void;
}

export function FormularioEmbebido({ formularioId, nombre, campos, open, onClose }: FormularioEmbebidoProps) {
  const [activeTab, setActiveTab] = useState('html');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Genera la URL base del API
  const apiBaseUrl = window.location.origin;

  // Código HTML embebido
  const htmlCode = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Formulario: ${nombre}</title>
  <style>
    /* Estilos modernos para el formulario */
    .pl-form {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      background: white;
    }
    .pl-form-header {
      margin-bottom: 20px;
      text-align: center;
    }
    .pl-form-title {
      color: #002AE0;
      font-size: 24px;
      margin-bottom: 8px;
    }
    .pl-form-description {
      color: #666;
      font-size: 14px;
    }
    .pl-form-group {
      margin-bottom: 15px;
    }
    .pl-form-label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #333;
    }
    .pl-form-input,
    .pl-form-textarea,
    .pl-form-select {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      transition: border-color 0.2s, box-shadow 0.2s;
      font-size: 14px;
    }
    .pl-form-input:focus,
    .pl-form-textarea:focus,
    .pl-form-select:focus {
      outline: none;
      border-color: #002AE0;
      box-shadow: 0 0 0 2px rgba(0, 42, 224, 0.2);
    }
    .pl-form-textarea {
      min-height: 100px;
      resize: vertical;
    }
    .pl-form-button {
      background: #002AE0;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.3s;
      width: 100%;
    }
    .pl-form-button:hover {
      background: #001BB0;
    }
    .pl-form-footer {
      margin-top: 20px;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    /* Mensaje de éxito */
    .pl-form-success {
      display: none;
      text-align: center;
      padding: 20px;
    }
    .pl-form-success h3 {
      color: #28a745;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="pl-form" id="pl-form-${formularioId}">
    <div class="pl-form-header">
      <h2 class="pl-form-title">${nombre}</h2>
      <p class="pl-form-description">Complete el formulario a continuación</p>
    </div>
    <form id="prometheus-form">
      <input type="hidden" name="form_id" value="${formularioId}">
      ${campos.map(campo => {
        switch(campo.tipo) {
          case 'text':
            return `
      <div class="pl-form-group">
        <label class="pl-form-label" for="${campo.id}">${campo.label}${campo.requerido ? ' *' : ''}</label>
        <input class="pl-form-input" type="text" id="${campo.id}" name="${campo.id}" ${campo.requerido ? 'required' : ''}>
      </div>`;
          case 'email':
            return `
      <div class="pl-form-group">
        <label class="pl-form-label" for="${campo.id}">${campo.label}${campo.requerido ? ' *' : ''}</label>
        <input class="pl-form-input" type="email" id="${campo.id}" name="${campo.id}" ${campo.requerido ? 'required' : ''}>
      </div>`;
          case 'textarea':
            return `
      <div class="pl-form-group">
        <label class="pl-form-label" for="${campo.id}">${campo.label}${campo.requerido ? ' *' : ''}</label>
        <textarea class="pl-form-textarea" id="${campo.id}" name="${campo.id}" ${campo.requerido ? 'required' : ''}></textarea>
      </div>`;
          case 'select':
            const options = campo.opciones?.split(',').map(opt => 
              `<option value="${opt.trim()}">${opt.trim()}</option>`
            ).join('') || '';
            return `
      <div class="pl-form-group">
        <label class="pl-form-label" for="${campo.id}">${campo.label}${campo.requerido ? ' *' : ''}</label>
        <select class="pl-form-select" id="${campo.id}" name="${campo.id}" ${campo.requerido ? 'required' : ''}>
          <option value="">Seleccionar...</option>
          ${options}
        </select>
      </div>`;
          case 'phone':
            return `
      <div class="pl-form-group">
        <label class="pl-form-label" for="${campo.id}">${campo.label}${campo.requerido ? ' *' : ''}</label>
        <input class="pl-form-input" type="tel" id="${campo.id}" name="${campo.id}" ${campo.requerido ? 'required' : ''}>
      </div>`;
          case 'number':
            return `
      <div class="pl-form-group">
        <label class="pl-form-label" for="${campo.id}">${campo.label}${campo.requerido ? ' *' : ''}</label>
        <input class="pl-form-input" type="number" id="${campo.id}" name="${campo.id}" ${campo.requerido ? 'required' : ''}>
      </div>`;
          default:
            return `
      <div class="pl-form-group">
        <label class="pl-form-label" for="${campo.id}">${campo.label}${campo.requerido ? ' *' : ''}</label>
        <input class="pl-form-input" type="text" id="${campo.id}" name="${campo.id}" ${campo.requerido ? 'required' : ''}>
      </div>`;
        }
      }).join('')}
      <div class="pl-form-group">
        <button type="submit" class="pl-form-button">Enviar</button>
      </div>
    </form>
    <div class="pl-form-footer">
      Formulario creado con Prometheus Labs CRM
    </div>
    <div class="pl-form-success" id="pl-form-success-${formularioId}">
      <h3>¡Gracias por enviar el formulario!</h3>
      <p>Nos pondremos en contacto contigo pronto.</p>
    </div>
  </div>
  
  <script>
    document.getElementById('prometheus-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const formObject = {};
      formData.forEach((value, key) => {
        formObject[key] = value;
      });
      
      // Enviar datos al servidor
      fetch('${apiBaseUrl}/api/formularios/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formObject)
      })
      .then(response => response.json())
      .then(data => {
        // Mostrar mensaje de éxito
        document.getElementById('prometheus-form').style.display = 'none';
        document.getElementById('pl-form-success-${formularioId}').style.display = 'block';
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Ha ocurrido un error al enviar el formulario. Por favor, inténtalo de nuevo.');
      });
    });
  </script>
</body>
</html>`;

  // Código JavaScript para insertar mediante script
  const jsCode = `<script>
  (function() {
    // Crear elemento para contener el formulario
    const formContainer = document.createElement('div');
    formContainer.id = 'prometheus-form-container-${formularioId}';
    
    // Insertar el HTML del formulario
    formContainer.innerHTML = \`
      <div class="pl-form" id="pl-form-${formularioId}">
        <div class="pl-form-header">
          <h2 class="pl-form-title">${nombre}</h2>
          <p class="pl-form-description">Complete el formulario a continuación</p>
        </div>
        <form id="prometheus-form-${formularioId}">
          <input type="hidden" name="form_id" value="${formularioId}">
          ${campos.map(campo => {
            switch(campo.tipo) {
              case 'text':
                return `
          <div class="pl-form-group">
            <label class="pl-form-label" for="${campo.id}">${campo.label}${campo.requerido ? ' *' : ''}</label>
            <input class="pl-form-input" type="text" id="${campo.id}" name="${campo.id}" ${campo.requerido ? 'required' : ''}>
          </div>`;
              case 'email':
                return `
          <div class="pl-form-group">
            <label class="pl-form-label" for="${campo.id}">${campo.label}${campo.requerido ? ' *' : ''}</label>
            <input class="pl-form-input" type="email" id="${campo.id}" name="${campo.id}" ${campo.requerido ? 'required' : ''}>
          </div>`;
              case 'textarea':
                return `
          <div class="pl-form-group">
            <label class="pl-form-label" for="${campo.id}">${campo.label}${campo.requerido ? ' *' : ''}</label>
            <textarea class="pl-form-textarea" id="${campo.id}" name="${campo.id}" ${campo.requerido ? 'required' : ''}></textarea>
          </div>`;
              case 'select':
                const options = campo.opciones?.split(',').map(opt => 
                  `<option value="${opt.trim()}">${opt.trim()}</option>`
                ).join('') || '';
                return `
          <div class="pl-form-group">
            <label class="pl-form-label" for="${campo.id}">${campo.label}${campo.requerido ? ' *' : ''}</label>
            <select class="pl-form-select" id="${campo.id}" name="${campo.id}" ${campo.requerido ? 'required' : ''}>
              <option value="">Seleccionar...</option>
              ${options}
            </select>
          </div>`;
              case 'phone':
                return `
          <div class="pl-form-group">
            <label class="pl-form-label" for="${campo.id}">${campo.label}${campo.requerido ? ' *' : ''}</label>
            <input class="pl-form-input" type="tel" id="${campo.id}" name="${campo.id}" ${campo.requerido ? 'required' : ''}>
          </div>`;
              case 'number':
                return `
          <div class="pl-form-group">
            <label class="pl-form-label" for="${campo.id}">${campo.label}${campo.requerido ? ' *' : ''}</label>
            <input class="pl-form-input" type="number" id="${campo.id}" name="${campo.id}" ${campo.requerido ? 'required' : ''}>
          </div>`;
              default:
                return `
          <div class="pl-form-group">
            <label class="pl-form-label" for="${campo.id}">${campo.label}${campo.requerido ? ' *' : ''}</label>
            <input class="pl-form-input" type="text" id="${campo.id}" name="${campo.id}" ${campo.requerido ? 'required' : ''}>
          </div>`;
            }
          }).join('')}
          <div class="pl-form-group">
            <button type="submit" class="pl-form-button">Enviar</button>
          </div>
        </form>
        <div class="pl-form-footer">
          Formulario creado con Prometheus Labs CRM
        </div>
        <div class="pl-form-success" id="pl-form-success-${formularioId}">
          <h3>¡Gracias por enviar el formulario!</h3>
          <p>Nos pondremos en contacto contigo pronto.</p>
        </div>
      </div>
    \`;
    
    // Agregar estilos CSS
    const styles = document.createElement('style');
    styles.textContent = \`
      /* Estilos modernos para el formulario */
      .pl-form {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 500px;
        margin: 0 auto;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        background: white;
      }
      .pl-form-header {
        margin-bottom: 20px;
        text-align: center;
      }
      .pl-form-title {
        color: #002AE0;
        font-size: 24px;
        margin-bottom: 8px;
      }
      .pl-form-description {
        color: #666;
        font-size: 14px;
      }
      .pl-form-group {
        margin-bottom: 15px;
      }
      .pl-form-label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #333;
      }
      .pl-form-input,
      .pl-form-textarea,
      .pl-form-select {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        transition: border-color 0.2s, box-shadow 0.2s;
        font-size: 14px;
      }
      .pl-form-input:focus,
      .pl-form-textarea:focus,
      .pl-form-select:focus {
        outline: none;
        border-color: #002AE0;
        box-shadow: 0 0 0 2px rgba(0, 42, 224, 0.2);
      }
      .pl-form-textarea {
        min-height: 100px;
        resize: vertical;
      }
      .pl-form-button {
        background: #002AE0;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        transition: background 0.3s;
        width: 100%;
      }
      .pl-form-button:hover {
        background: #001BB0;
      }
      .pl-form-footer {
        margin-top: 20px;
        text-align: center;
        font-size: 12px;
        color: #999;
      }
      /* Mensaje de éxito */
      .pl-form-success {
        display: none;
        text-align: center;
        padding: 20px;
      }
      .pl-form-success h3 {
        color: #28a745;
        margin-bottom: 10px;
      }
    \`;
    
    // Insertar el formulario en el DOM
    document.currentScript.parentNode.insertBefore(formContainer, document.currentScript);
    document.head.appendChild(styles);
    
    // Agregar evento de envío al formulario
    document.getElementById('prometheus-form-${formularioId}').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const formObject = {};
      formData.forEach((value, key) => {
        formObject[key] = value;
      });
      
      // Enviar datos al servidor
      fetch('${apiBaseUrl}/api/formularios/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formObject)
      })
      .then(response => response.json())
      .then(data => {
        // Mostrar mensaje de éxito
        document.getElementById('prometheus-form-${formularioId}').style.display = 'none';
        document.getElementById('pl-form-success-${formularioId}').style.display = 'block';
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Ha ocurrido un error al enviar el formulario. Por favor, inténtalo de nuevo.');
      });
    });
  })();
</script>`;

  // Función para copiar al portapapeles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({
        title: "Código copiado",
        description: "El código ha sido copiado al portapapeles.",
      });
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Error al copiar: ', err);
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles.",
        variant: "destructive"
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full md:w-[90%] lg:max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Integrar formulario</DialogTitle>
          <DialogDescription>
            Copia este código HTML para insertar el formulario "{nombre}" en tu sitio web.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="html" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="html" className="data-[state=active]:bg-[#002AE0] data-[state=active]:text-white">
              Página HTML completa
            </TabsTrigger>
            <TabsTrigger value="js" className="data-[state=active]:bg-[#002AE0] data-[state=active]:text-white">
              Script embebible
            </TabsTrigger>
          </TabsList>

          <TabsContent value="html" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="bg-gray-900 p-2 rounded-md relative">
                  <pre className="text-xs overflow-auto max-h-96 p-2 text-white">
                    <code>{htmlCode}</code>
                  </pre>
                  <Button 
                    size="sm" 
                    onClick={() => copyToClipboard(htmlCode)}
                    className="absolute top-2 right-2 bg-[#002AE0] hover:bg-[#001BB0]"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground">
              Usa este código si quieres crear una página HTML completa con el formulario.
            </p>
          </TabsContent>

          <TabsContent value="js" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="bg-gray-900 p-2 rounded-md relative">
                  <pre className="text-xs overflow-auto max-h-96 p-2 text-white">
                    <code>{jsCode}</code>
                  </pre>
                  <Button 
                    size="sm" 
                    onClick={() => copyToClipboard(jsCode)}
                    className="absolute top-2 right-2 bg-[#002AE0] hover:bg-[#001BB0]"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground">
              Usa este código para insertar el formulario en cualquier página web existente. Solo pega este script
              en el lugar donde quieres que aparezca el formulario.
            </p>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={onClose} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
