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

      // Consultar tiempo de respuesta promedio (minutos entre mensaje de cliente y respuesta de agente)
      const { data: tiempoRespuesta, error: errorTiempo } = await supabase.rpc(
        "calcular_tiempo_respuesta_agente",
        { p_agente_id: agenteId }
      );

      // Consultar satisfacción promedio de las evaluaciones
      const { data: satisfaccionData, error: errorSatisfaccion } = await supabase
        .from("evaluaciones_respuestas")
        .select("puntuacion")
        .eq("evaluador_id", agenteId);
      
      // Calcular promedio manualmente ya que .avg() no está disponible
      let satisfaccionPromedio = 0;
      if (satisfaccionData && satisfaccionData.length > 0) {
        const suma = satisfaccionData.reduce((total, item) => total + item.puntuacion, 0);
        satisfaccionPromedio = suma / satisfaccionData.length;
      }

      // Consultar tasa de conversión de leads
      const { data: conversionData, error: errorConversion } = await supabase.rpc(
        "calcular_tasa_conversion_agente",
        { p_agente_id: agenteId }
      );

      // Consultar tasa de resolución de conversaciones
      const { data: resolucionData, error: errorResolucion } = await supabase.rpc(
        "calcular_tasa_resolucion_agente",
        { p_agente_id: agenteId }
      );

      if (errorTiempo || errorSatisfaccion || errorConversion || errorResolucion) {
        console.error("Errores al consultar métricas:", {
          errorTiempo,
          errorSatisfaccion,
          errorConversion,
          errorResolucion,
        });
      }

      // Retornar valores por defecto si hay errores
      return {
        tiempoRespuestaPromedio: tiempoRespuesta || 15,
        satisfaccionPromedio: satisfaccionPromedio * 10, // Convertir de 0-10 a 0-100
        tasaConversionLeads: conversionData || 65,
        tasaResolucion: resolucionData || 78,
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

        // Consultar conversaciones donde participó el agente
        const { data: conversacionesData, error: errorConversaciones } = await supabase
          .from("mensajes")
          .select("conversacion_id")
          .eq("remitente_id", agenteId)
          .gte("created_at", primerDia.toISOString())
          .lte("created_at", ultimoDia.toISOString())
          .order("conversacion_id", { ascending: true });

        // Consultar mensajes enviados por el agente
        const { count: mensajeCount, error: errorMensajes } = await supabase
          .from("mensajes")
          .select("*", { count: "exact", head: true })
          .eq("remitente_id", agenteId)
          .gte("created_at", primerDia.toISOString())
          .lte("created_at", ultimoDia.toISOString());

        // Consultar evaluaciones promedio recibidas
        const { data: evaluacionesData, error: errorEvaluaciones } = await supabase
          .from("evaluaciones_respuestas")
          .select("puntuacion")
          .eq("evaluador_id", agenteId)
          .gte("created_at", primerDia.toISOString())
          .lte("created_at", ultimoDia.toISOString());
        
        // Calcular promedio manualmente
        let evaluacionesPromedio = 0;
        if (evaluacionesData && evaluacionesData.length > 0) {
          const suma = evaluacionesData.reduce((total, item) => total + item.puntuacion, 0);
          evaluacionesPromedio = suma / evaluacionesData.length;
        }

        if (errorConversaciones || errorMensajes || errorEvaluaciones) {
          console.error("Errores al consultar actividad:", {
            errorConversaciones,
            errorMensajes,
            errorEvaluaciones,
          });
        }

        // Contar conversaciones únicas
        const conversacionesUnicas = conversacionesData
          ? [...new Set(conversacionesData.map((item) => item.conversacion_id))]
          : [];

        meses.push({
          mes: nombreMes,
          conversaciones: conversacionesUnicas.length,
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

      // Contar total de leads asignados
      const { count: totalCount, error: errorTotal } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("asignado_a", agenteId);

      // Contar leads activos
      const { count: activosCount, error: errorActivos } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("asignado_a", agenteId)
        .eq("is_active", true);
        
      // Usar consultas separadas para obtener IDs de las etapas primero
      const { data: stagesData, error: errorStages } = await supabase
        .from("pipeline_stages")
        .select("id, nombre");
        
      // Extraer los IDs de las etapas
      const ganadoStageIds = stagesData
        ?.filter(stage => stage.nombre === "Cerrado Ganado")
        .map(stage => stage.id) || [];
        
      const perdidoStageIds = stagesData
        ?.filter(stage => stage.nombre === "Cerrado Perdido")
        .map(stage => stage.id) || [];
      
      // Contar leads cerrados ganados
      const { count: ganadosCount, error: errorGanados } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("asignado_a", agenteId)
        .in("stage_id", ganadoStageIds);

      // Contar leads cerrados perdidos
      const { count: perdidosCount, error: errorPerdidos } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("asignado_a", agenteId)
        .in("stage_id", perdidoStageIds);

      if (errorTotal || errorActivos || errorGanados || errorPerdidos || errorStages) {
        console.error("Errores al consultar stats de leads:", {
          errorTotal,
          errorActivos,
          errorGanados,
          errorPerdidos,
          errorStages
        });
      }

      return {
        totalLeads: totalCount || 0,
        leadsActivos: activosCount || 0,
        leadsCerradosGanados: ganadosCount || 0,
        leadsCerradosPerdidos: perdidosCount || 0,
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