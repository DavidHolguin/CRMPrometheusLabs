import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/database.types';

type EvaluacionRespuesta = {
  id?: string;
  mensaje_id: string;
  respuesta_id: string;
  evaluador_id: string;
  puntuacion: number;
  retroalimentacion?: string;
  created_at?: string;
  updated_at?: string;
};

// Cache para evitar peticiones repetidas
const evaluacionesCache: Record<string, any[]> = {};

export function useEvaluaciones() {
  const [isLoading, setIsLoading] = useState(false);

  const validateRating = (rating: number): number => {
    // Asegurarnos de que la puntuación esté en el rango 1-5 (en lugar de 0-10)
    if (rating < 1) return 1;
    if (rating > 5) return 5;
    return Math.round(rating);
  };

  const guardarEvaluacion = async ({
    mensaje_id,
    respuesta_id,
    evaluador_id,
    puntuacion,
    retroalimentacion
  }: Omit<EvaluacionRespuesta, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsLoading(true);
      
      // Validar y ajustar la puntuación
      const validatedRating = validateRating(puntuacion);
      
      console.log('Guardando evaluación:', {
        mensaje_id,
        respuesta_id,
        evaluador_id,
        puntuacion: validatedRating,
        retroalimentacion
      });

      // Usar la nueva función RPC v2 con manejo de errores y reintentos
      let intentos = 0;
      const maxIntentos = 3;
      let ultimoError = null;
      
      while (intentos < maxIntentos) {
        try {
          const { data, error } = await supabase
            .rpc('guardar_evaluacion_v2', {
              p_mensaje_id: mensaje_id,
              p_respuesta_id: respuesta_id,
              p_evaluador_id: evaluador_id,
              p_puntuacion: validatedRating,
              p_retroalimentacion: retroalimentacion
            });

          if (error) {
            ultimoError = error;
            // Si el error es de recursos insuficientes, esperamos antes de reintentar
            if (error.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (intentos + 1)));
            } else {
              // Para otros errores, no reintentamos
              throw error;
            }
          } else {
            // Invalidar caché para este mensaje
            delete evaluacionesCache[mensaje_id];
            return data;
          }
        } catch (err) {
          ultimoError = err;
          // Si es un error de red, reintentamos
          if (err.message?.includes('Failed to fetch')) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (intentos + 1)));
          } else {
            // Para otros errores, no reintentamos
            throw err;
          }
        }
        
        intentos++;
      }
      
      // Si llegamos aquí, es porque agotamos los reintentos
      console.error(`Error después de ${maxIntentos} intentos:`, ultimoError);
      throw ultimoError || new Error('Error desconocido al guardar evaluación');
    } catch (error) {
      console.error('Error al guardar evaluación:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const obtenerEvaluaciones = async (mensaje_id: string) => {
    try {
      // Verificar si tenemos los datos en caché
      if (evaluacionesCache[mensaje_id]) {
        return evaluacionesCache[mensaje_id];
      }
      
      setIsLoading(true);
      
      // Usar la nueva función RPC v2 con manejo de errores y reintentos
      let intentos = 0;
      const maxIntentos = 3;
      let ultimoError = null;
      
      while (intentos < maxIntentos) {
        try {
          const { data, error } = await supabase
            .rpc('obtener_evaluaciones_v2', {
              p_mensaje_id: mensaje_id
            });

          if (error) {
            ultimoError = error;
            // Si el error es de recursos insuficientes, esperamos antes de reintentar
            if (error.message?.includes('ERR_INSUFFICIENT_RESOURCES')) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (intentos + 1)));
            } else {
              throw error;
            }
          } else {
            // Guardar en caché
            const resultados = data || [];
            evaluacionesCache[mensaje_id] = resultados;
            return resultados;
          }
        } catch (err) {
          ultimoError = err;
          // Si es un error de red, reintentamos
          if (err.message?.includes('Failed to fetch')) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (intentos + 1)));
          } else {
            throw err;
          }
        }
        
        intentos++;
      }
      
      // Si llegamos aquí, es porque agotamos los reintentos
      console.error(`Error después de ${maxIntentos} intentos:`, ultimoError);
      throw ultimoError || new Error('Error desconocido al obtener evaluaciones');
    } catch (error) {
      console.error('Error al obtener evaluaciones:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    guardarEvaluacion,
    obtenerEvaluaciones,
    isLoading
  };
}