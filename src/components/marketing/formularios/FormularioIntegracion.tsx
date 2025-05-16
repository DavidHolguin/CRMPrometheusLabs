import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Check, Copy, Code, FileCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Campo {
  id: string;
  label: string;
  tipo: string;
  requerido: boolean;
  opciones?: string[];
}

interface Formulario {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  campos: Campo[];
  fecha_creacion: string;
  fecha_modificacion: string;
  estado: string;
  envios: number;
  conversion: number;
  tasa_conversion: number;
}

interface FormularioIntegracionProps {
  formulario: Formulario;
  onClose: () => void;
}

export function FormularioIntegracion({ formulario, onClose }: FormularioIntegracionProps) {
  const [activeTab, setActiveTab] = useState("html");
  const [copiado, setCopiado] = useState(false);

  // Generar código HTML para el formulario
  const generarCodigoHTML = () => {
    const camposHTML = formulario.campos.map(campo => {
      let campoHTML = '';
      
      switch (campo.tipo) {
        case 'text':
        case 'email':
        case 'tel':
          campoHTML = `
  <div class="form-group">
    <label for="${campo.id}">${campo.label}${campo.requerido ? ' *' : ''}</label>
    <input type="${campo.tipo}" id="${campo.id}" name="${campo.id}"${campo.requerido ? ' required' : ''} class="form-control">
  </div>`;
          break;
        case 'textarea':
          campoHTML = `
  <div class="form-group">
    <label for="${campo.id}">${campo.label}${campo.requerido ? ' *' : ''}</label>
    <textarea id="${campo.id}" name="${campo.id}"${campo.requerido ? ' required' : ''} class="form-control" rows="4"></textarea>
  </div>`;
          break;
        case 'select': {
          let opciones = '';
          if (campo.opciones) {
            opciones = campo.opciones.map(opcion => `
      <option value="${opcion}">${opcion}</option>`).join('');
          }
          campoHTML = `
  <div class="form-group">
    <label for="${campo.id}">${campo.label}${campo.requerido ? ' *' : ''}</label>
    <select id="${campo.id}" name="${campo.id}"${campo.requerido ? ' required' : ''} class="form-control">
      <option value="">Seleccionar...</option>${opciones}
    </select>
  </div>`;
          break;
        }
        case 'checkbox':
          if (campo.opciones && campo.opciones.length > 0) {
            const checkboxes = campo.opciones.map((opcion, index) => `
    <div class="form-check">
      <input type="checkbox" id="${campo.id}_${index}" name="${campo.id}[]" value="${opcion}" class="form-check-input">
      <label for="${campo.id}_${index}" class="form-check-label">${opcion}</label>
    </div>`).join('');
            campoHTML = `
  <div class="form-group">
    <label>${campo.label}${campo.requerido ? ' *' : ''}</label>${checkboxes}
  </div>`;
          } else {
            campoHTML = `
  <div class="form-check">
    <input type="checkbox" id="${campo.id}" name="${campo.id}" class="form-check-input"${campo.requerido ? ' required' : ''}>
    <label for="${campo.id}" class="form-check-label">${campo.label}${campo.requerido ? ' *' : ''}</label>
  </div>`;
          }
          break;
        case 'radio':
          if (campo.opciones && campo.opciones.length > 0) {
            const radios = campo.opciones.map((opcion, index) => `
    <div class="form-check">
      <input type="radio" id="${campo.id}_${index}" name="${campo.id}" value="${opcion}" class="form-check-input"${index === 0 && campo.requerido ? ' required' : ''}>
      <label for="${campo.id}_${index}" class="form-check-label">${opcion}</label>
    </div>`).join('');
            campoHTML = `
  <div class="form-group">
    <label>${campo.label}${campo.requerido ? ' *' : ''}</label>${radios}
  </div>`;
          }
          break;
        default:
          campoHTML = `
  <div class="form-group">
    <label for="${campo.id}">${campo.label}${campo.requerido ? ' *' : ''}</label>
    <input type="text" id="${campo.id}" name="${campo.id}"${campo.requerido ? ' required' : ''} class="form-control">
  </div>`;
      }
      
      return campoHTML;
    }).join('');

    return `<!-- Formulario de ${formulario.nombre} - ID: ${formulario.id} -->
<form id="prometeo-form-${formulario.id}" class="prometeo-form" data-form-id="${formulario.id}">
  <input type="hidden" name="form_id" value="${formulario.id}">
  <input type="hidden" name="source" value="">
  <input type="hidden" name="utm_source" value="">
  <input type="hidden" name="utm_medium" value="">
  <input type="hidden" name="utm_campaign" value="">
  <input type="hidden" name="utm_content" value="">
  <input type="hidden" name="utm_term" value="">${camposHTML}
  
  <div class="form-group mt-4">
    <button type="submit" class="btn btn-primary">Enviar</button>
  </div>
</form>

<!-- Estilos básicos para el formulario -->
<style>
  .prometeo-form .form-group {
    margin-bottom: 1rem;
  }
  .prometeo-form label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  .prometeo-form .form-control {
    display: block;
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
    line-height: 1.5;
    border: 1px solid #ced4da;
    border-radius: 0.25rem;
  }
  .prometeo-form .form-check {
    padding-left: 1.5rem;
    margin-bottom: 0.5rem;
  }
  .prometeo-form .form-check-input {
    margin-left: -1.5rem;
  }
  .prometeo-form .btn {
    display: inline-block;
    font-weight: 400;
    text-align: center;
    vertical-align: middle;
    cursor: pointer;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    line-height: 1.5;
    border-radius: 0.25rem;
  }
  .prometeo-form .btn-primary {
    color: #fff;
    background-color: #007bff;
    border-color: #007bff;
  }
</style>
`;
  };

  // Generar código JavaScript para el formulario
  const generarCodigoJS = () => {
    return `// Script de integración para el formulario ${formulario.nombre} (ID: ${formulario.id})
document.addEventListener('DOMContentLoaded', function() {
  // Obtener parámetros UTM de la URL
  function getUTMParameters() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    // Capturar parámetros UTM
    const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    utmParams.forEach(param => {
      if (urlParams.has(param)) {
        params[param] = urlParams.get(param);
      }
    });
    
    // Capturar origen de referencia
    params.source = document.referrer || 'direct';
    
    return params;
  }

  // Configurar el formulario
  const form = document.getElementById('prometeo-form-${formulario.id}');
  if (form) {
    // Establecer parámetros UTM como valores ocultos
    const utmParams = getUTMParameters();
    for (const [key, value] of Object.entries(utmParams)) {
        const input = form.querySelector('input[name="' + key + '"]');
        if (input) {
          input.value = value;
        }
    }

    // Manejar envío del formulario
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Recopilar datos del formulario
      const formData = new FormData(form);
      const formDataObj = {};
      formData.forEach((value, key) => {
        formDataObj[key] = value;
      });
      
      // Enviar datos a la API de Prometeo
      fetch('https://api.prometeo.com/v1/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'TU_API_KEY_AQUI' // Reemplazar con la API key real
        },
        body: JSON.stringify(formDataObj)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Éxito - mostrar mensaje o redireccionar
          form.innerHTML = '<div class="alert alert-success">¡Gracias por tu envío!</div>';
          // Opcional: redireccionar
          // window.location.href = '/gracias';
        } else {
          // Error - mostrar mensaje
          const errorDiv = document.createElement('div');
          errorDiv.className = 'alert alert-danger';
          errorDiv.textContent = data.message || 'Ha ocurrido un error. Por favor, inténtalo de nuevo.';
          form.prepend(errorDiv);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = 'Ha ocurrido un error de conexión. Por favor, inténtalo de nuevo.';
        form.prepend(errorDiv);
      });
    });
  }
});
`;
  };

  // Generar código React para el formulario
  const generarCodigoReact = () => {
    return `// Componente React para el formulario ${formulario.nombre} (ID: ${formulario.id})
import { useState, useEffect } from 'react';

export default function FormularioPrometeo() {
  const [formData, setFormData] = useState({${formulario.campos.map(campo => `
    ${campo.id}: '',`).join('')}
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [utmParams, setUtmParams] = useState({});

  useEffect(() => {
    // Capturar parámetros UTM al cargar el componente
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const params = {};
    
    // Capturar parámetros UTM
    const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    utmParams.forEach(param => {
      if (urlParams.has(param)) {
        params[param] = urlParams.get(param);
      }
    });
    
    // Capturar origen de referencia
    params.source = document.referrer || 'direct';
    
    setUtmParams(params);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://api.prometeo.com/v1/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'TU_API_KEY_AQUI' // Reemplazar con la API key real
        },
        body: JSON.stringify({
          form_id: '${formulario.id}',
          ...formData,
          ...utmParams
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        setFormData({${formulario.campos.map(campo => `
          ${campo.id}: '',`).join('')}
        });
      } else {
        setError(data.message || 'Ha ocurrido un error. Por favor, inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Ha ocurrido un error de conexión. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="form-success">
        <h3>¡Gracias por tu envío!</h3>
        <p>Hemos recibido tu información correctamente.</p>
      </div>
    );
  }

  return (
    <div className="prometeo-form-container">
      <form onSubmit={handleSubmit} className="prometeo-form">
        {error && (
          <div className="form-error">{error}</div>
        )}${formulario.campos.map(campo => {
          let campoJSX = '';
          
          switch (campo.tipo) {
            case 'text':
            case 'email':
            case 'tel':
              campoJSX = `
        <div className="form-group">
          <label htmlFor="${campo.id}">${campo.label}{campo.requerido ? ' *' : ''}</label>
          <input
            type="${campo.tipo}"
            id="${campo.id}"
            name="${campo.id}"
            value={formData.${campo.id}}
            onChange={handleChange}
            required={${campo.requerido}}
            className="form-control"
          />
        </div>`;
              break;
            case 'textarea':
              campoJSX = `
        <div className="form-group">
          <label htmlFor="${campo.id}">${campo.label}{campo.requerido ? ' *' : ''}</label>
          <textarea
            id="${campo.id}"
            name="${campo.id}"
            value={formData.${campo.id}}
            onChange={handleChange}
            required={${campo.requerido}}
            className="form-control"
            rows={4}
          />
        </div>`;
              break;
            case 'select': {
              const opciones = campo.opciones?.map(opcion => `
            <option value="${opcion}">${opcion}</option>`).join('') || '';
              campoJSX = `
        <div className="form-group">
          <label htmlFor="${campo.id}">${campo.label}{campo.requerido ? ' *' : ''}</label>
          <select
            id="${campo.id}"
            name="${campo.id}"
            value={formData.${campo.id}}
            onChange={handleChange}
            required={${campo.requerido}}
            className="form-control"
          >
            <option value="">Seleccionar...</option>${opciones}
          </select>
        </div>`;
              break;
            }
            default:
              campoJSX = `
        <div className="form-group">
          <label htmlFor="${campo.id}">${campo.label}{campo.requerido ? ' *' : ''}</label>
          <input
            type="text"
            id="${campo.id}"
            name="${campo.id}"
            value={formData.${campo.id}}
            onChange={handleChange}
            required={${campo.requerido}}
            className="form-control"
          />
        </div>`;
          }
          
          return campoJSX;
        }).join('')}
        
        <div className="form-group mt-4">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}
`;
  };

  // Manejar copia de código
  const handleCopiarCodigo = () => {
    let codigo = '';
    
    switch (activeTab) {
      case 'html':
        codigo = generarCodigoHTML();
        break;
      case 'js':
        codigo = generarCodigoJS();
        break;
      case 'react':
        codigo = generarCodigoReact();
        break;
      default:
        codigo = generarCodigoHTML();
    }
    
    navigator.clipboard.writeText(codigo);
    setCopiado(true);
    
    setTimeout(() => {
      setCopiado(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={onClose} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Código de integración</h2>
          <p className="text-muted-foreground">
            Integra el formulario "{formulario.nombre}" en tu sitio web
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Código para {formulario.nombre}</CardTitle>
              <CardDescription>
                Copia el código y pégalo en tu sitio web para integrar este formulario
              </CardDescription>
            </div>
            <Badge variant={formulario.estado === "activo" ? "default" : "secondary"}>
              {formulario.estado === "activo" ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="html" className="flex items-center">
                <Code className="h-4 w-4 mr-2" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="js" className="flex items-center">
                <FileCode className="h-4 w-4 mr-2" />
                JavaScript
              </TabsTrigger>
              <TabsTrigger value="react" className="flex items-center">
                <FileCode className="h-4 w-4 mr-2" />
                React
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="html" className="mt-4">
              <div className="relative">
                <pre className="p-4 rounded-md bg-muted overflow-auto text-sm max-h-[400px]">
                  <code className="text-xs">{generarCodigoHTML()}</code>
                </pre>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={handleCopiarCodigo}
                >
                  {copiado ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar código
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="js" className="mt-4">
              <div className="relative">
                <pre className="p-4 rounded-md bg-muted overflow-auto text-sm max-h-[400px]">
                  <code className="text-xs">{generarCodigoJS()}</code>
                </pre>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={handleCopiarCodigo}
                >
                  {copiado ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar código
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="react" className="mt-4">
              <div className="relative">
                <pre className="p-4 rounded-md bg-muted overflow-auto text-sm max-h-[400px]">
                  <code className="text-xs">{generarCodigoReact()}</code>
                </pre>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={handleCopiarCodigo}
                >
                  {copiado ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar código
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Instrucciones de integración:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Copia el código HTML y pégalo en tu sitio web donde quieras que aparezca el formulario.</li>
              <li>Añade el código JavaScript en la sección &lt;head&gt; o al final del &lt;body&gt; de tu página.</li>
              <li>Reemplaza 'TU_API_KEY_AQUI' con tu clave de API real.</li>
              <li>Personaliza los estilos según sea necesario para que coincidan con tu sitio web.</li>
            </ol>
          </div>
          <div className="p-4 border rounded-md bg-muted/50">
            <h4 className="font-medium mb-2">Seguimiento de conversiones</h4>
            <p className="text-sm text-muted-foreground">
              Este código incluye seguimiento automático de parámetros UTM y origen de referencia para analizar
              la efectividad de tus campañas de marketing.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}