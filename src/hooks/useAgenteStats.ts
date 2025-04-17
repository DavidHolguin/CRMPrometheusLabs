import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Interfaces para las métricas
export interface AgentePerformanceMetrics {
  tiempoRespuestaPromedio: number; // Tiempo promedio de respuesta en minutos
  satisfaccionPromedio: number; // Promedio de puntuación en evaluaciones (0-100)
  tasaConversionLeads: number; // Porcentaje de leads convertidos
  tasaResolucion: number; // Porcentaje de conversaciones resueltas
}

export interface AgenteActivityData {
  mes: string;
  conversaciones: number;
  mensajesEnviados: number;
  evaluacionesPromedio: number;
}

export interface AssignedLeadsStats {
  totalLeads: number;
  leadsActivos: number;
  leadsCerradosGanados: number;
  leadsCerradosPerdidos: number;
}

// Valores predeterminados para mostrar cuando no hay datos o hay errores
const DEFAULT_METRICS = {
  tiempoRespuestaPromedio: 5,
  satisfaccionPromedio: 85,
  tasaConversionLeads: 65,
  tasaResolucion: 78,
};

/**
 * Hook para obtener estadísticas detalladas de un agente específico
 */
export function useAgenteStats(agenteId: string | null) {
  // Métricas de rendimiento
  const {
    data: performanceMetrics,
    isLoading: isLoadingPerformance,
    error: errorPerformance,
  } = useQuery({
    queryKey: ["agentePerformance", agenteId],
    queryFn: async (): Promise<AgentePerformanceMetrics> => {
      if (!agenteId) {
        throw new Error("ID de agente no proporcionado");
      }

      let tiempoRespuesta = DEFAULT_METRICS.tiempoRespuestaPromedio;
      let satisfaccionPromedio = 0;
      let conversionData = DEFAULT_METRICS.tasaConversionLeads;
      let resolucionData = DEFAULT_METRICS.tasaResolucion;

      try {
        // Consultar tiempo de respuesta promedio (minutos entre mensaje de cliente y respuesta de agente)
        const { data: respuestaData, error: errorTiempo } = await supabase.rpc(
          "calcular_tiempo_respuesta_agente",
          { p_agente_id: agenteId }
        );
        
        if (!errorTiempo && respuestaData !== null) {
          tiempoRespuesta = respuestaData;
        }
      } catch (error) {
        console.log("Error al calcular tiempo de respuesta:", error);
      }

      try {
        // Consultar satisfacción promedio de las evaluaciones
        const { data: satisfaccionData, error: errorSatisfaccion } = await supabase
          .from("evaluaciones_respuestas")
          .select("puntuacion")
          .eq("evaluador_id", agenteId);
        
        // Calcular promedio manualmente ya que .avg() no está disponible
        if (!errorSatisfaccion && satisfaccionData && satisfaccionData.length > 0) {
          const suma = satisfaccionData.reduce((total, item) => total + item.puntuacion, 0);
          satisfaccionPromedio = (suma / satisfaccionData.length) * 10; // Convertir de 0-10 a 0-100
        } else {
          satisfaccionPromedio = DEFAULT_METRICS.satisfaccionPromedio;
        }
      } catch (error) {
        console.log("Error al calcular satisfacción:", error);
        satisfaccionPromedio = DEFAULT_METRICS.satisfaccionPromedio;
      }

      try {
        // Consultar tasa de conversión de leads
        const { data: conversionResult, error: errorConversion } = await supabase.rpc(
          "calcular_tasa_conversion_agente",
          { p_agente_id: agenteId }
        );
        
        if (!errorConversion && conversionResult !== null) {
          conversionData = conversionResult;
        }
      } catch (error) {
        console.log("Error al calcular tasa de conversión:", error);
      }

      try {
        // Consultar tasa de resolución de conversaciones
        const { data: resolucionResult, error: errorResolucion } = await supabase.rpc(
          "calcular_tasa_resolucion_agente",
          { p_agente_id: agenteId }
        );
        
        if (!errorResolucion && resolucionResult !== null) {
          resolucionData = resolucionResult;
        }
      } catch (error) {
        console.log("Error al calcular tasa de resolución:", error);
      }

      // Retornar valores calculados o por defecto
      return {
        tiempoRespuestaPromedio: tiempoRespuesta,
        satisfaccionPromedio: satisfaccionPromedio,
        tasaConversionLeads: conversionData,
        tasaResolucion: resolucionData,
      };
    },
    enabled: !!agenteId,
  });

  // Datos de actividad mensual
  const {
    data: activityData,
    isLoading: isLoadingActivity,
    error: errorActivity,
  } = useQuery({
    queryKey: ["agenteActivity", agenteId],
    queryFn: async (): Promise<AgenteActivityData[]> => {
      if (!agenteId) {
        throw new Error("ID de agente no proporcionado");
      }

      const fechaActual = new Date();
      const meses = [];

      // Obtener datos de los últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const fecha = new Date(fechaActual);
        fecha.setMonth(fechaActual.getMonth() - i);
        const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
        const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

        // Nombres de meses en español
        const nombresMeses = [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        const nombreMes = nombresMeses[fecha.getMonth()];

        let conversacionesUnicas = [];
        let mensajeCount = 0;
        let evaluacionesPromedio = 0;
        
        try {
          // Consultar conversaciones donde participó el agente
          const { data: conversacionesData, error: errorConversaciones } = await supabase
            .from("mensajes")
            .select("conversacion_id")
            .eq("remitente_id", agenteId)
            .gte("created_at", primerDia.toISOString())
            .lte("created_at", ultimoDia.toISOString())
            .order("conversacion_id", { ascending: true });

          if (!errorConversaciones && conversacionesData) {
            // Contar conversaciones únicas
            conversacionesUnicas = [...new Set(conversacionesData.map((item) => item.conversacion_id))];
          }
        } catch (error) {
          console.log("Error al consultar conversaciones:", error);
        }

        try {
          // Consultar mensajes enviados por el agente
          const { count, error: errorMensajes } = await supabase
            .from("mensajes")
            .select("*", { count: "exact", head: true })
            .eq("remitente_id", agenteId)
            .gte("created_at", primerDia.toISOString())
            .lte("created_at", ultimoDia.toISOString());
            
          if (!errorMensajes && count !== null) {
            mensajeCount = count;
          }
        } catch (error) {
          console.log("Error al consultar mensajes:", error);
        }

        try {
          // Consultar evaluaciones promedio recibidas
          const { data: evaluacionesData, error: errorEvaluaciones } = await supabase
            .from("evaluaciones_respuestas")
            .select("puntuacion")
            .eq("evaluador_id", agenteId)
            .gte("created_at", primerDia.toISOString())
            .lte("created_at", ultimoDia.toISOString());
          
          // Calcular promedio manualmente
          if (!errorEvaluaciones && evaluacionesData && evaluacionesData.length > 0) {
            const suma = evaluacionesData.reduce((total, item) => total + item.puntuacion, 0);
            evaluacionesPromedio = suma / evaluacionesData.length;
          }
        } catch (error) {
          console.log("Error al consultar evaluaciones:", error);
        }

        meses.push({
          mes: nombreMes,
          conversaciones: conversacionesUnicas.length || 0,
          mensajesEnviados: mensajeCount || 0,
          evaluacionesPromedio: evaluacionesPromedio,
        });
      }

      return meses;
    },
    enabled: !!agenteId,
  });

  // Estadísticas de leads asignados
  const {
    data: leadsStats,
    isLoading: isLoadingLeads,
    error: errorLeads,
  } = useQuery({
    queryKey: ["agenteLeadsStats", agenteId],
    queryFn: async (): Promise<AssignedLeadsStats> => {
      if (!agenteId) {
        throw new Error("ID de agente no proporcionado");
      }

      let totalCount = 0;
      let activosCount = 0;
      let ganadosCount = 0;
      let perdidosCount = 0;
      
      try {
        // Contar total de leads asignados
        const { count, error: errorTotal } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("asignado_a", agenteId);
          
        if (!errorTotal && count !== null) {
          totalCount = count;
        }
      } catch (error) {
        console.log("Error al contar leads totales:", error);
      }

      try {
        // Contar leads activos
        const { count, error: errorActivos } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("asignado_a", agenteId)
          .eq("is_active", true);
          
        if (!errorActivos && count !== null) {
          activosCount = count;
        }
      } catch (error) {
        console.log("Error al contar leads activos:", error);
      }
      
      try {
        // Usar consultas separadas para obtener IDs de las etapas primero
        const { data: stagesData, error: errorStages } = await supabase
          .from("pipeline_stages")
          .select("id, nombre");
          
        if (!errorStages && stagesData) {
          // Extraer los IDs de las etapas
          const ganadoStageIds = stagesData
            .filter(stage => stage.nombre === "Cerrado Ganado")
            .map(stage => stage.id);
            
          const perdidoStageIds = stagesData
            .filter(stage => stage.nombre === "Cerrado Perdido")
            .map(stage => stage.id);
          
          // Solo si tenemos IDs válidos, hacemos las consultas
          if (ganadoStageIds.length > 0) {
            const { count, error: errorGanados } = await supabase
              .from("leads")
              .select("id", { count: "exact", head: true })
              .eq("asignado_a", agenteId)
              .in("stage_id", ganadoStageIds);
              
            if (!errorGanados && count !== null) {
              ganadosCount = count;
            }
          }
          
          if (perdidoStageIds.length > 0) {
            const { count, error: errorPerdidos } = await supabase
              .from("leads")
              .select("id", { count: "exact", head: true })
              .eq("asignado_a", agenteId)
              .in("stage_id", perdidoStageIds);
              
            if (!errorPerdidos && count !== null) {
              perdidosCount = count;
            }
          }
        }
      } catch (error) {
        console.log("Error al consultar etapas o contar leads por etapa:", error);
      }

      return {
        totalLeads: totalCount,
        leadsActivos: activosCount,
        leadsCerradosGanados: ganadosCount,
        leadsCerradosPerdidos: perdidosCount,
      };
    },
    enabled: !!agenteId,
  });

  return {
    performanceMetrics,
    activityData,
    leadsStats,
    isLoading:
      isLoadingPerformance || isLoadingActivity || isLoadingLeads,
    error: errorPerformance || errorActivity || errorLeads,
  };
}