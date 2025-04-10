
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export interface AnonymousMessage {
  id: string;
  mensaje_id: string;
  token_anonimo: string;
  contenido_sanitizado: string;
  metadata_sanitizada: any;
  created_at: string;
}

export function useAnonymousMessages(tokenAnonimo: string | null) {
  const [messages, setMessages] = useState<AnonymousMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tokenAnonimo) {
      setIsLoading(false);
      return;
    }

    const fetchMessages = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Use a more generic fetch approach to avoid TypeScript issues with the table names
        const { data, error } = await supabase
          .from('mensajes_sanitizados')
          .select('*')
          .eq('token_anonimo', tokenAnonimo)
          .order('created_at', { ascending: true }) as { data: AnonymousMessage[] | null, error: any };
        
        if (error) throw new Error(error.message);
        
        setMessages(data || []);
      } catch (err: any) {
        console.error('Error fetching anonymous messages:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
    
    // Set up real-time listener
    const channel = supabase
      .channel(`anonymous-messages-${tokenAnonimo}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'mensajes_sanitizados', 
          filter: `token_anonimo=eq.${tokenAnonimo}` 
        },
        (payload) => {
          const newMessage = payload.new as AnonymousMessage;
          setMessages(current => [...current, newMessage]);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tokenAnonimo]);

  const addMessage = async (mensaje_id: string, contenido: string, metadata: any = {}) => {
    if (!tokenAnonimo) return null;
    
    try {
      // Use direct fetch to API instead of RPC to avoid TypeScript issues
      const insertResult = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://web-production-01457.up.railway.app'}/api/v1/messages/sanitized`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mensaje_id,
          token_anonimo: tokenAnonimo,
          contenido_sanitizado: contenido,
          metadata_sanitizada: metadata
        })
      });
      
      if (!insertResult.ok) {
        console.error('Error en la llamada a la API:', insertResult.status, insertResult.statusText);
        throw new Error('Failed to insert sanitized message via API');
      }
      
      return await insertResult.json();
    } catch (err) {
      console.error('Error adding anonymous message:', err);
      return null;
    }
  };

  return {
    messages,
    isLoading,
    error,
    addMessage
  };
}
