import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface Mensaje {
  id: string;
  conversacion_id: string;
  origen: string; // Cambiado para coincidir con el tipo de la base de datos
  contenido: string;
  created_at: string;
  tipo_contenido?: string;
  metadata?: any;
  score_impacto?: number;
  leido?: boolean;
  intencion_id?: string;
  interaction_type_id?: string;
  remitente_id?: string;
}

interface QAPair {
  id: string;
  question: {
    id: string;
    content: string;
    timestamp: string;
  };
  answer: {
    id: string;
    content: string;
    timestamp: string;
  };
}

export function useConversationMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Mensaje[]>([]);
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);

  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('mensajes')
          .select('*')
          .eq('conversacion_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
          throw error;
        }

        if (!data) {
          console.log('No messages found for conversation:', conversationId);
          setMessages([]);
          setQaPairs([]);
          return;
        }

        console.log('Fetched messages:', data.length);
        setMessages(data);

        // Organizar mensajes en pares Q&A
        const pairs: QAPair[] = [];
        for (let i = 0; i < data.length - 1; i++) {
          // Verificar si el mensaje actual es una pregunta del usuario y el siguiente es una respuesta del chatbot
          if (data[i].origen === 'user' && data[i + 1].origen === 'chatbot') {
            pairs.push({
              id: `${data[i].id}-${data[i + 1].id}`,
              question: {
                id: data[i].id,
                content: data[i].contenido,
                timestamp: data[i].created_at,
              },
              answer: {
                id: data[i + 1].id,
                content: data[i + 1].contenido,
                timestamp: data[i + 1].created_at,
              },
            });
          }
        }
        console.log('Created QA pairs:', pairs.length);
        setQaPairs(pairs);
      } catch (error) {
        console.error('Error al cargar mensajes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    console.log('Setting up conversation messages for:', conversationId);
    fetchMessages();

    // Suscribirse a nuevos mensajes
    const channelName = `mensajes_${conversationId}_${Date.now()}`;
    console.log('Creating realtime channel:', channelName);
    
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
          console.log('Updated messages count:', updatedMessages.length);
          
          // Actualizar pares Q&A si es necesario
          if (newMessage.origen === 'chatbot') {
            const lastMessage = current[current.length - 1];
            if (lastMessage?.origen === 'user') {
              setQaPairs((currentPairs) => [...currentPairs, {
                id: `${lastMessage.id}-${newMessage.id}`,
                question: {
                  id: lastMessage.id,
                  content: lastMessage.contenido,
                  timestamp: lastMessage.created_at,
                },
                answer: {
                  id: newMessage.id,
                  content: newMessage.contenido,
                  timestamp: newMessage.created_at,
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
  };
}