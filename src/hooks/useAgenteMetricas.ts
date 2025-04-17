import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

// Extend UserWithMeta type to include companyId
declare module '@/context/AuthContext' {
  interface UserWithMeta {
    companyId?: string;
  }
}

type AgenteMetricas = {
  total_evaluaciones: number;
  promedio_tiempo_respuesta: number;
  tasa_respuesta: number;
  tasa_resolucion: number;
  evolucion_tiempo: {
    fecha: string;
    total_evaluaciones: number;
    promedio_calificacion: number;
    tasa_respuesta: number;
  }[];
  comparacion_periodo_anterior: {
    promedio_calificacion_cambio: number;
    tasa_respuesta_cambio: number;
    tasa_resolucion_cambio: number;
  };
  ultima_actualizacion: string;
};

const metricasCache: Record<string, { data: AgenteMetricas; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export function useAgenteMetricas(agenteId: string | null | undefined, periodo: string = '30d') {
  const { user } = useAuth();
  const [data, setData] = useState<AgenteMetricas | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!agenteId || !user?.companyId) return;

    const cacheKey = `${agenteId}-${periodo}-${user.companyId}`;
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
        
        console.log(`Obteniendo métricas para agente: ${agenteId}, empresa: ${user.companyId}`);
        
        // Intentar obtener datos reales de leads asignados para personalizar las métricas simuladas
        const { data: leadsData } = await supabase
          .from('leads')
          .select('id, asignado_a, ultima_interaccion')
          .eq('asignado_a', agenteId)
          .limit(100);
        
        // Personalizar los datos simulados con información real
        let datosPersonalizados = generarDatosSimulados();
        
        if (leadsData?.length) {
          console.log(`Encontrados ${leadsData.length} leads asignados al agente`);
          
          // Personalizar los datos simulados con info real
          datosPersonalizados.total_evaluaciones = leadsData.length;
          
          // Calcular una "tasa de respuesta" estimada
          const ahora = new Date();
          const leadsRecientes = leadsData.filter(lead => {
            if (!lead.ultima_interaccion) return false;
            const fechaInteraccion = new Date(lead.ultima_interaccion);
            const diasDiferencia = (ahora.getTime() - fechaInteraccion.getTime()) / (1000 * 60 * 60 * 24);
            return diasDiferencia <= 7; // Interacciones en la última semana
          });
          
          if (leadsRecientes.length > 0) {
            datosPersonalizados.tasa_respuesta = leadsRecientes.length / leadsData.length;
          }
        } else {
          console.log("No se encontraron leads asignados al agente, usando datos completamente simulados");
        }
        
        setData(datosPersonalizados);
        
        // Guardar en caché
        metricasCache[cacheKey] = {
          data: datosPersonalizados,
          timestamp: Date.now()
        };
      } catch (err) {
        console.error("Error al obtener métricas del agente:", err);
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
  }, [agenteId, periodo, user?.companyId]);

  // Función para generar datos simulados para demo
  const generarDatosSimulados = (): AgenteMetricas => {
    // Generar evolución temporal para los últimos 7 días
    const ahora = new Date();
    const evolucion = Array.from({ length: 7 }, (_, i) => {
      const fecha = new Date();
      fecha.setDate(ahora.getDate() - (6 - i));
      
      return {
        fecha: fecha.toISOString().split('T')[0],
        total_evaluaciones: Math.floor(Math.random() * 15) + 5, // Entre 5 y 20
        promedio_calificacion: +(3 + Math.random() * 2).toFixed(1), // Entre 3 y 5
        tasa_respuesta: +(0.6 + Math.random() * 0.3).toFixed(2), // Entre 60% y 90%
      };
    });
    
    // Calcular tasas y promedios
    const tasaRespuesta = +(0.7 + Math.random() * 0.25).toFixed(2); // Entre 70% y 95%
    const tasaResolucion = +(0.6 + Math.random() * 0.3).toFixed(2); // Entre 60% y 90%
    
    // Datos de comparación con período anterior (valores entre -10% y +10%)
    const generarCambio = () => +(Math.random() * 20 - 10).toFixed(1);
    
    return {
      total_evaluaciones: Math.floor(Math.random() * 50) + 20, // Entre 20 y 70
      promedio_tiempo_respuesta: Math.floor(Math.random() * 180000) + 60000, // Entre 1 y 4 minutos en ms
      tasa_respuesta: tasaRespuesta,
      tasa_resolucion: tasaResolucion,
      evolucion_tiempo: evolucion,
      comparacion_periodo_anterior: {
        promedio_calificacion_cambio: generarCambio(),
        tasa_respuesta_cambio: generarCambio(),
        tasa_resolucion_cambio: generarCambio()
      },
      ultima_actualizacion: new Date().toISOString()
    };
  };

  return {
    data,
    isLoading,
    error
  };
}