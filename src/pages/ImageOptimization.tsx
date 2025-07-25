import React from 'react';
import { ImageOptimizationExample } from '@/components/examples/image-optimization-example';

const ImageOptimizationPage: React.FC = () => {
  return (
    <>
      <div className="px-6 py-6">
        <h1 className="text-3xl font-bold mb-6">Optimización de Imágenes con Vercel</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="prose max-w-none">
            <p className="text-lg">
              Esta página demuestra cómo CRM Prometeo aprovecha la optimización de imágenes de Vercel 
              para mejorar el rendimiento de la aplicación, reducir el uso de datos y proporcionar 
              una mejor experiencia de usuario.
            </p>
            
            <h2 className="text-xl font-semibold mt-6">Beneficios de la Optimización de Imágenes</h2>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Mejora los tiempos de carga de la página hasta un 30%</li>
              <li>Reduce el consumo de datos para los usuarios móviles</li>
              <li>Sirve el formato de imagen óptimo dependiendo del navegador (WebP, AVIF)</li>
              <li>Dimensiona automáticamente las imágenes para diferentes dispositivos</li>
              <li>Optimiza la calidad para el mejor balance entre rendimiento y apariencia</li>
            </ul>
          </div>
          
          <hr className="my-8" />
          
          {/* Componente de ejemplo que muestra varios casos de uso */}
          <ImageOptimizationExample />
        </div>
      </div>
    </>
  );
}

export default ImageOptimizationPage;