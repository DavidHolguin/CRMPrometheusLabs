import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** URL de la imagen o ruta relativa desde /public */
  src: string;
  /** Descripción alternativa de la imagen para accesibilidad */
  alt: string;
  /** Ancho deseado de la imagen */
  width: number;
  /** Altura deseada de la imagen */
  height: number;
  /** Calidad de la imagen (1-100), por defecto 75 */
  quality?: number;
  /** Deshabilitar la optimización para imágenes específicas */
  unoptimized?: boolean;
  /** Lazy loading de la imagen, por defecto true */
  lazyLoad?: boolean;
  /** Clave única para forzar la recarga de la imagen */
  cacheKey?: string;
}

/**
 * Componente OptimizedImage para optimizar imágenes con la API de Vercel
 * Compatible con proyectos Vite + React
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 75,
  unoptimized = false,
  lazyLoad = true,
  className,
  cacheKey,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  
  // Construir URL optimizada usando la API de Vercel Image Optimization
  useEffect(() => {
    if (unoptimized) {
      setImgSrc(src);
      return;
    }
    
    // Determinar si es una URL externa o un asset local
    const isExternalUrl = src.startsWith('http') || src.startsWith('//');
    
    if (isExternalUrl) {
      try {
        // Para URLs externas, usamos la API de Vercel para optimización
        const url = new URL('/_vercel/image', window.location.origin);
        url.searchParams.append('url', src);
        url.searchParams.append('w', width.toString());
        url.searchParams.append('q', quality.toString());
        
        if (cacheKey) {
          url.searchParams.append('cacheKey', cacheKey);
        }
        
        setImgSrc(url.toString());
      } catch (err) {
        console.error('Error al optimizar imagen externa:', err);
        setImgSrc(src); // Fallback a la imagen original
        setError(true);
      }
    } else {
      // Para assets locales
      setImgSrc(src);
    }
  }, [src, width, quality, unoptimized, cacheKey]);
  
  // Manejar errores de carga
  const handleError = () => {
    setError(true);
    setIsLoading(false);
    console.error(`Error al cargar la imagen: ${src}`);
  };
  
  // Manejar carga completa
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  return (
    <div 
      className={cn(
        "relative overflow-hidden",
        isLoading && "bg-gray-100 animate-pulse",
        className
      )}
      style={{ width, height }}
    >
      <img
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        loading={lazyLoad ? "lazy" : "eager"}
        onError={handleError}
        onLoad={handleLoad}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          error ? "filter grayscale opacity-60" : ""
        )}
        {...props}
      />
      
      {/* Indicador de estado de carga */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="sr-only">Cargando...</span>
        </div>
      )}
      
      {/* Indicador de error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-60">
          <span className="text-sm text-gray-500">Error de imagen</span>
        </div>
      )}
    </div>
  );
}