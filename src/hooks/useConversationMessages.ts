import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface Mensaje {
  id: string;
  conversacion_id: string;
  origen: string; // En la base de datos puede ser 'lead', 'chatbot', 'agente', etc.
  contenido: string;
  created_at: string;
  tipo_contenido?: string;
  metadata?: any;
  score_impacto?: number;
  leido?: boolean;
  intencion_id?: string;
  interaction_type_id?: string;
  remitente_id?: string;
  remitente_nombre?: string;
}

interface QAPair {
  id: string;
  question: {
    id: string;
    content: string;
    timestamp: string;
    sender?: string;
  };
  answer: {
    id: string;
    content: string;
    timestamp: string;
    sender?: string;
  };
}

export function useConversationMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Mensaje[]>([]);
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`Fetching messages for conversation: ${conversationId}`);
        
        // Primero intentamos obtener de vista_lead_conversaciones_mensajes para tener más contexto
        let { data: vistaMensajes, error: vistaError } = await supabase
          .from('vista_lead_conversaciones_mensajes')
          .select('*')
          .eq('conversacion_id', conversationId)
          .order('mensaje_fecha', { ascending: true });
          
        if (vistaError) {
          console.error('Error fetching from vista_lead_conversaciones_mensajes:', vistaError);
          // Si falla, intentamos con la tabla mensajes directamente
          const { data, error } = await supabase
            .from('mensajes')
            .select('*')
            .eq('conversacion_id', conversationId)
            .order('created_at', { ascending: true });
            
          if (error) throw error;
          vistaMensajes = data;
        }
        
        if (!vistaMensajes || vistaMensajes.length === 0) {
          console.log('No messages found for conversation:', conversationId);
          setMessages([]);
          setQaPairs([]);
          return;
        }

        console.log(`Found ${vistaMensajes.length} messages for conversation ${conversationId}`);

        // Convertir los resultados de vista_lead_conversaciones_mensajes al formato Mensaje
        const mensajesFormateados: Mensaje[] = vistaMensajes.map(item => {
          // Determinar si estamos usando datos de la vista o de la tabla mensajes
          const esVista = !!item.mensaje_id;
          
          return {
            id: esVista ? item.mensaje_id : item.id,
            conversacion_id: conversationId,
            origen: esVista ? item.mensaje_origen : item.origen,
            contenido: esVista ? item.mensaje_contenido : item.contenido,
            created_at: esVista ? item.mensaje_fecha : item.created_at,
            tipo_contenido: esVista ? item.mensaje_tipo : item.tipo_contenido,
            metadata: esVista ? item.mensaje_metadata : item.metadata,
            score_impacto: esVista ? item.mensaje_score_impacto : item.score_impacto,
            leido: esVista ? item.mensaje_leido : item.leido,
            intencion_id: item.intencion_id,
            interaction_type_id: esVista ? item.tipo_interaccion : item.interaction_type_id,
            remitente_id: esVista ? item.mensaje_remitente_id : item.remitente_id,
            remitente_nombre: esVista ? item.remitente_nombre : undefined
          };
        });
        
        // Guardar los mensajes formateados
        setMessages(mensajesFormateados);

        // Organizar mensajes en pares pregunta-respuesta (Q&A)
        const pairs: QAPair[] = [];
        
        // Log para depuración
        console.log("Orígenes de mensajes encontrados:", 
          [...new Set(mensajesFormateados.map(m => m.origen))]);
        
        // En la base de datos, los mensajes del usuario pueden estar etiquetados como 'lead' o 'user'
        // y las respuestas como 'chatbot'
        for (let i = 0; i < mensajesFormateados.length - 1; i++) {
          const currentMsg = mensajesFormateados[i];
          const nextMsg = mensajesFormateados[i + 1];
          
          // Consideramos como pregunta los mensajes que vienen de usuario/lead
          const esOrigen_Lead = currentMsg.origen === 'lead' || currentMsg.origen === 'user';
          // Consideramos como respuesta los mensajes que vienen de chatbot
          const esSiguienteOrigen_Chatbot = nextMsg.origen === 'chatbot';
          
          if (esOrigen_Lead && esSiguienteOrigen_Chatbot) {
            pairs.push({
              id: `${currentMsg.id}-${nextMsg.id}`,
              question: {
                id: currentMsg.id,
                content: currentMsg.contenido,
                timestamp: currentMsg.created_at,
                sender: currentMsg.remitente_nombre
              },
              answer: {
                id: nextMsg.id,
                content: nextMsg.contenido,
                timestamp: nextMsg.created_at,
                sender: 'Chatbot'
              },
            });
            
            // Saltamos la respuesta para que no sea considerada como pregunta en la siguiente iteración
            i++;
          }
        }
        
        console.log(`Created ${pairs.length} QA pairs from ${mensajesFormateados.length} messages`);
        setQaPairs(pairs);
        
      } catch (err) {
        console.error('Error al cargar mensajes:', err);
        setError(err instanceof Error ? err : new Error('Error desconocido al cargar mensajes'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Suscribirse a nuevos mensajes en tiempo real
    const channelName = `mensajes_${conversationId}_${Date.now()}`;
    console.log('Setting up realtime channel:', channelName);
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes',
        filter: `conversacion_id=eq.${conversationId}`,
      }, (payload) => {
        console.log('New message received:', payload.new);
        const newMessage = payload.new as Mensaje;
        
        setMessages((current) => {
          // Verificar si el mensaje ya existe
          if (current.some(msg => msg.id === newMessage.id)) {
            console.log('Message already exists, skipping');
            return current;
          }
          
          const updatedMessages = [...current, newMessage];
          
          // Actualizar pares Q&A si es necesario
          if (newMessage.origen === 'chatbot') {
            const lastMessage = current[current.length - 1];
            if (lastMessage?.origen === 'lead' || lastMessage?.origen === 'user') {
              setQaPairs((currentPairs) => [...currentPairs, {
                id: `${lastMessage.id}-${newMessage.id}`,
                question: {
                  id: lastMessage.id,
                  content: lastMessage.contenido,
                  timestamp: lastMessage.created_at,
                  sender: lastMessage.remitente_nombre
                },
                answer: {
                  id: newMessage.id,
                  content: newMessage.contenido,
                  timestamp: newMessage.created_at,
                  sender: 'Chatbot'
                },
              }]);
            }
          }
          
          return updatedMessages;
        });
      })
      .subscribe((status) => {
        console.log(`Realtime subscription status for ${channelName}:`, status);
      });

    return () => {
      console.log('Cleaning up channel:', channelName);
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return {
    messages,
    qaPairs,
    isLoading,
    error
  };
}