import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

// Aseguramos que el tipo UserWithMeta tenga la propiedad companyId
declare module '@/context/AuthContext' {
  interface UserWithMeta {
    companyId?: string;
  }
}

type CalidadLLMMetricas = {
  total_mensajes: number;
  mensajes_evaluados: number;
  promedio_puntuacion: number;
  distribucion_puntuaciones: {
    puntuacion: number;
    cantidad: number;
    porcentaje: number;
  }[];
  temas_problematicos: {
    tema: string;
    menciones: number;
    puntuacion_promedio: number;
  }[];
  tendencia_tiempo?: {
    fecha: string;
    promedio: number;
    total_evaluaciones: number;
  }[];
  ultima_actualizacion: string;
};

const metricasCache: Record<string, { data: CalidadLLMMetricas; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export function useCalidadLLMMetricas(chatbotId: string | null | undefined, periodo: string = '30d') {
  const { user } = useAuth();
  const [data, setData] = useState<CalidadLLMMetricas | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!chatbotId || !user?.companyId) return;

    const cacheKey = `${chatbotId}-${periodo}-${user.companyId}`;
    const cachedData = metricasCache[cacheKey];
    
    // Si tenemos datos en caché y no han expirado, los usamos
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      setData(cachedData.data);
      return;
    }

    async function fetchMetricas() {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`Obteniendo métricas para chatbot: ${chatbotId}, empresa: ${user.companyId}`);
        
        // Intentar obtener datos reales de conversaciones para personalizar las métricas simuladas
        const { data: conversacionesData } = await supabase
          .from('conversaciones')
          .select('id')
          .eq('chatbot_id', chatbotId)
          .limit(100);
        
        // Calcular estadísticas básicas basadas en datos reales
        let datosPersonalizados = generarDatosSimulados();
        
        if (conversacionesData?.length) {
          console.log(`Encontradas ${conversacionesData.length} conversaciones para el chatbot`);
          
          // Personalizar los datos simulados con info real
          datosPersonalizados.total_mensajes = conversacionesData.length * 5; // estimación de mensajes
          datosPersonalizados.mensajes_evaluados = Math.floor(conversacionesData.length * 0.7);
        } else {
          console.log("No se encontraron conversaciones para el chatbot, usando datos completamente simulados");
        }
        
        setData(datosPersonalizados);
        
        // Guardar en caché
        metricasCache[cacheKey] = {
          data: datosPersonalizados,
          timestamp: Date.now()
        };
      } catch (err) {
        console.error("Error al obtener métricas de calidad LLM:", err);
        setError(err instanceof Error ? err : new Error('Error desconocido'));
        
        // Si hay un error, devolvemos datos simulados de todos modos
        const datosRespaldo = generarDatosSimulados();
        setData(datosRespaldo);
        
        metricasCache[cacheKey] = {
          data: datosRespaldo,
          timestamp: Date.now()
        };
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetricas();
  }, [chatbotId, periodo, user?.companyId]);

  // Función para generar datos simulados para demo
  const generarDatosSimulados = (): CalidadLLMMetricas => {
    // Distribución simulada de puntuaciones
    const distribucion = [
      { puntuacion: 1, cantidad: Math.floor(Math.random() * 5) + 1, porcentaje: 0 },
      { puntuacion: 2, cantidad: Math.floor(Math.random() * 10) + 5, porcentaje: 0 },
      { puntuacion: 3, cantidad: Math.floor(Math.random() * 20) + 10, porcentaje: 0 },
      { puntuacion: 4, cantidad: Math.floor(Math.random() * 40) + 20, porcentaje: 0 },
      { puntuacion: 5, cantidad: Math.floor(Math.random() * 30) + 15, porcentaje: 0 }
    ];
    
    // Calcular total y porcentajes
    const totalEvaluaciones = distribucion.reduce((sum, item) => sum + item.cantidad, 0);
    distribucion.forEach(item => {
      item.porcentaje = (item.cantidad / totalEvaluaciones) * 100;
    });
    
    // Calcular promedio ponderado
    const sumaPuntos = distribucion.reduce((sum, item) => sum + (item.puntuacion * item.cantidad), 0);
    const promedioPuntuacion = sumaPuntos / totalEvaluaciones;
    
    // Generar tendencia para los últimos 7 días
    const ahora = new Date();
    const tendencia = Array.from({ length: 7 }, (_, i) => {
      const fecha = new Date();
      fecha.setDate(ahora.getDate() - (6 - i));
      
      return {
        fecha: fecha.toISOString().split('T')[0],
        promedio: +(3 + Math.random() * 2).toFixed(1), // Entre 3 y 5
        total_evaluaciones: Math.floor(Math.random() * 15) + 5 // Entre 5 y 20
      };
    });
    
    return {
      total_mensajes: totalEvaluaciones + Math.floor(Math.random() * 100) + 50, // Total mensajes > evaluaciones
      mensajes_evaluados: totalEvaluaciones,
      promedio_puntuacion: promedioPuntuacion,
      distribucion_puntuaciones: distribucion,
      temas_problematicos: [
        { tema: "Problemas con productos", menciones: Math.floor(Math.random() * 8) + 3, puntuacion_promedio: +(2 + Math.random() * 1.5).toFixed(1) },
        { tema: "Información incorrecta", menciones: Math.floor(Math.random() * 6) + 2, puntuacion_promedio: +(2 + Math.random() * 1.5).toFixed(1) },
        { tema: "Respuestas incompletas", menciones: Math.floor(Math.random() * 10) + 5, puntuacion_promedio: +(2.5 + Math.random()).toFixed(1) },
        { tema: "Respuesta lenta", menciones: Math.floor(Math.random() * 5) + 2, puntuacion_promedio: +(2 + Math.random() * 2).toFixed(1) }
      ],
      tendencia_tiempo: tendencia,
      ultima_actualizacion: new Date().toISOString()
    };
  };

  return {
    data,
    isLoading,
    error
  };
}