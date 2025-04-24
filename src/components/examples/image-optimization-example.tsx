import React from 'react';
import { OptimizedImage } from '@/components/ui/optimized-image';

export const ImageOptimizationExample: React.FC = () => {
  return (
    <div className="space-y-8 p-4">
      <h2 className="text-2xl font-bold">Ejemplos de Optimización de Imágenes con Vercel</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Ejemplo 1: Imagen remota con optimización */}
        <div className="p-4 border rounded-lg space-y-2">
          <h3 className="text-lg font-semibold">Imagen Remota Optimizada</h3>
          <OptimizedImage
            src="https://images.unsplash.com/photo-1682687982107-14492010e05e"
            alt="Ejemplo de imagen remota optimizada"
            width={400}
            height={300}
            className="rounded-md"
          />
          <p className="text-sm text-gray-500">
            Esta imagen se carga desde Unsplash y es optimizada automáticamente por Vercel.
          </p>
        </div>

        {/* Ejemplo 2: Imagen local desde carpeta public */}
        <div className="p-4 border rounded-lg space-y-2">
          <h3 className="text-lg font-semibold">Imagen Local</h3>
          <OptimizedImage
            src="/favicon.ico"
            alt="Favicon del proyecto"
            width={300}
            height={300}
            className="rounded-md"
          />
          <p className="text-sm text-gray-500">
            Esta imagen se carga desde la carpeta public y se optimiza automáticamente.
          </p>
        </div>

        {/* Ejemplo 3: Imagen con calidad personalizada */}
        <div className="p-4 border rounded-lg space-y-2">
          <h3 className="text-lg font-semibold">Calidad Personalizada</h3>
          <OptimizedImage
            src="https://images.unsplash.com/photo-1682687982107-14492010e05e"
            alt="Imagen con calidad personalizada"
            width={400}
            height={300}
            quality={90}
            className="rounded-md"
          />
          <p className="text-sm text-gray-500">
            Esta imagen utiliza una calidad personalizada del 90%.
          </p>
        </div>

        {/* Ejemplo 4: Imagen sin optimización */}
        <div className="p-4 border rounded-lg space-y-2">
          <h3 className="text-lg font-semibold">Sin Optimización</h3>
          <OptimizedImage
            src="https://images.unsplash.com/photo-1682687982107-14492010e05e"
            alt="Imagen sin optimización"
            width={400}
            height={300}
            unoptimized={true}
            className="rounded-md"
          />
          <p className="text-sm text-gray-500">
            Esta imagen no se optimiza (unoptimized=true).
          </p>
        </div>

        {/* Ejemplo 5: Imagen con carga inmediata */}
        <div className="p-4 border rounded-lg space-y-2">
          <h3 className="text-lg font-semibold">Carga Inmediata</h3>
          <OptimizedImage
            src="https://images.unsplash.com/photo-1682687982107-14492010e05e"
            alt="Imagen con carga inmediata"
            width={400}
            height={300}
            lazyLoad={false}
            className="rounded-md"
          />
          <p className="text-sm text-gray-500">
            Esta imagen se carga de inmediato sin lazy loading.
          </p>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">¿Cómo funciona?</h3>
        <p>
          Nuestro componente <code>OptimizedImage</code> aprovecha la API de optimización de imágenes de Vercel para:
        </p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Optimizar y comprimir automáticamente las imágenes</li>
          <li>Convertir las imágenes a formatos modernos como WebP cuando el navegador lo soporta</li>
          <li>Cargar las imágenes de manera eficiente utilizando lazy loading</li>
          <li>Servir las imágenes desde la CDN de Vercel para una mejor velocidad global</li>
          <li>Permitir controlar la calidad de la imagen para ajustar el balance entre calidad y tamaño</li>
        </ul>
      </div>
    </div>
  );
};