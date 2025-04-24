import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Mic, Smile, MoreVertical, Check, Star, Phone, Info, Shield, ExternalLink, Square } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { EmojiPicker } from "@/components/conversations/EmojiPicker";
import { AudioMessage } from "@/components/conversations/AudioMessage";
import { RecordingAnimation } from "@/components/conversations/RecordingAnimation";
import { useChatMessages, ChatMessage } from "@/hooks/useChatMessages";
import { useIsMobile } from "@/hooks/use-mobile";
import { getOrCreateAnonymousToken } from "@/utils/piiUtils";

const ChatInterface = () => {
  const { chatbotId } = useParams();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatbotInfo, setChatbotInfo] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [showUserForm, setShowUserForm] = useState(false);
  const [userFormSubmitted, setUserFormSubmitted] = useState(false);
  const [showRatingDrawer, setShowRatingDrawer] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userFeedback, setUserFeedback] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [anonymousToken, setAnonymousToken] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<number | null>(null);
  const [showRecordingControls, setShowRecordingControls] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const { messages, addMessage, updateMessage } = useChatMessages(conversationId);
  const isMobile = useIsMobile();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioPermissionGranted = useRef<boolean>(false);
  const audioStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let storedSessionId = localStorage.getItem(`chatbot_session_${chatbotId}`);
    if (!storedSessionId) {
      storedSessionId = uuidv4();
      localStorage.setItem(`chatbot_session_${chatbotId}`, storedSessionId);
    }
    setSessionId(storedSessionId);

    const storedLeadId = localStorage.getItem(`chatbot_lead_${chatbotId}`);
    const storedName = localStorage.getItem(`chatbot_name_${chatbotId}`);
    const storedPhone = localStorage.getItem(`chatbot_phone_${chatbotId}`);
    const storedConversationId = localStorage.getItem(`chatbot_conversation_${chatbotId}`);

    if (storedLeadId) {
      setLeadId(storedLeadId);
      setUserFormSubmitted(true);
    }
    if (storedName) setUserName(storedName);
    if (storedPhone) setUserPhone(storedPhone);
    if (storedConversationId) setConversationId(storedConversationId);

    fetchChatbotInfo();

    if (!storedLeadId && !storedName && !storedPhone) {
      setShowUserForm(true);
    }

    return () => {
      cancelRecording(); // Usar cancelRecording en lugar de stopRecording
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [chatbotId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
    };
  }, [recordingInterval]);

  useEffect(() => {
    const channel = setupRealtimeSubscription();
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversationId]);

  const fetchChatbotInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("chatbots")
        .select("*")
        .eq("id", chatbotId)
        .single();

      if (error) throw error;

      setChatbotInfo(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching chatbot info:", error);
      setLoading(false);
    }
  };

  // Nueva función para suscribirse a mensajes en tiempo real
  const setupRealtimeSubscription = () => {
    if (!conversationId) return null;
    
    console.log(`Configurando suscripción en tiempo real para conversación: ${conversationId}`);
    
    // Usar un timestamp único para evitar conflictos de canales
    const timestamp = Date.now();
    const channelName = `chat-messages-${conversationId}-${timestamp}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Escuchar solo inserciones para evitar duplicados
          schema: 'public',
          table: 'mensajes',
          filter: `conversacion_id=eq.${conversationId}`
        },
        (payload) => {
          console.log("Evento de mensaje en tiempo real recibido:", payload);
          
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as any;
            console.log("Nuevo mensaje recibido:", newMessage);
            
            // Verificar que el mensaje no existe ya en el estado para evitar duplicados
            const messageExists = messages.some(msg => msg.id === newMessage.id);
            if (messageExists) {
              console.log("Mensaje ya existe en el estado, omitiendo");
              return;
            }
            
            // Formatear el mensaje según la estructura esperada por ChatMessage
            const formattedMessage: ChatMessage = {
              id: newMessage.id,
              contenido: newMessage.contenido,
              origen: newMessage.origen,
              created_at: newMessage.created_at,
              metadata: newMessage.metadata || {}
            };
            
            // Agregar el mensaje al estado
            addMessage(formattedMessage);
            
            // Hacer scroll al último mensaje automáticamente
            setTimeout(scrollToBottom, 100);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Estado de suscripción en tiempo real para ${channelName}: ${status}`);
      });
      
    return channel;
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
      
      setIsRecording(false);
      setShowRecordingControls(false);
    }
  };

  const sendAudioMessage = async (audioBlob: Blob, audioDuration?: number) => {
    if (!audioBlob) return;

    setSending(true);

    try {
      const empresaId = chatbotInfo?.empresa_id;
      if (!empresaId) {
        throw new Error("No se pudo determinar la empresa del chatbot");
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      
      const finalAudioDuration = audioDuration !== undefined ? audioDuration : recordingTime;

      const optimisticId = uuidv4();
      const optimisticMsg: ChatMessage = {
        id: optimisticId,
        contenido: "",
        origen: "usuario",
        created_at: new Date().toISOString(),
        isAudio: true,
        audioUrl: audioUrl,
        audioDuration: finalAudioDuration
      };

      addMessage(optimisticMsg);
      setAudioBlob(null);

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64data = reader.result?.toString().split(',')[1];
        if (!base64data) {
          throw new Error("Error al convertir audio a base64");
        }

        const apiEndpoint = "https://web-production-01457.up.railway.app";

        let canalId: string | null = null;
        let canalIdentificador = "web";

        try {
          // Modificado para obtener todos los canales y elegir el canal web si existe
          const { data: canalesData, error: canalError } = await supabase
            .from("chatbot_canales")
            .select("id, canal_id")
            .eq("chatbot_id", chatbotId);
          
          if (canalError) {
            console.warn("No se pudo obtener canal_id de chatbot_canales:", canalError);
          } else if (canalesData && canalesData.length > 0) {
            // Intentar encontrar el canal web primero
            const canalWeb = canalesData.find(canal => canal.canal_id === 'web');
            
            if (canalWeb) {
              canalId = 'web'; // Usar 'web' como identificador para el canal web
              console.log("Usando canal web encontrado:", canalWeb.id);
            } else {
              // Si no hay canal web, usar el primer canal disponible
              canalId = canalesData[0].canal_id;
              console.log("Usando primer canal disponible:", canalesData[0].id);
            }
            
            // Obtener más información sobre el canal seleccionado
            if (canalId) {
              const { data: canalInfo, error: canalInfoError } = await supabase
                .from("canales")
                .select("tipo")
                .eq("id", canalId)
                .single();
                
              if (!canalInfoError && canalInfo) {
                canalIdentificador = canalInfo.tipo || "web";
                console.log("Usando canal_identificador:", canalIdentificador);
              }
            }
          }
        } catch (canalError) {
          console.error("Error al obtener información del canal:", canalError);
        }

        const apiRequest = {
          empresa_id: empresaId,
          chatbot_id: chatbotId,
          lead_id: leadId || null,
          // Si ya tenemos un ID de conversación, siempre lo enviamos para mantener consistencia
          // entre mensajes de texto y audios
          conversacion_id: conversationId || undefined,
          session_id: sessionId, // Agregamos session_id para consistencia con los mensajes de texto
 
          canal_identificador: canalIdentificador,
          audio_base64: base64data,
          formato_audio: "webm",
          idioma: "es",
          metadata: {
            browser: navigator.userAgent,
            page: window.location.pathname,
            duracion_segundos: finalAudioDuration
          }
        };

        console.log("Enviando audio a la API (datos simplificados):", {
          ...apiRequest,
          audio_base64: "[base64_data]"
        });

        const response = await fetch(`${apiEndpoint}/api/v1/channels/audio`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(apiRequest)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error en la respuesta API:", response.status, errorText);
          throw new Error(`Error al enviar audio: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Respuesta de la API:", data);

        if (data.respuesta) {
          addMessage({
            id: data.mensaje_id || uuidv4(),
            contenido: data.respuesta,
            origen: "chatbot",
            created_at: new Date().toISOString(),
            metadata: data.metadata || {}
          });
        }

        // Actualizar el ID de conversación solo si no teníamos uno antes
        // o si el backend nos da uno diferente
        if (data.conversacion_id && (!conversationId || data.conversacion_id !== conversationId)) {
          console.log(`Actualizando ID de conversación: ${conversationId} -> ${data.conversacion_id}`);
          setConversationId(data.conversacion_id);
          localStorage.setItem(`chatbot_conversation_${chatbotId}`, data.conversacion_id);
        }
        
        if (data.audio_id && data.mensaje_id) {
          try {
            // Usamos el ID de conversación que ya teníamos o el que nos devolvió la API
            const conversationIdToUse = conversationId || data.conversacion_id;
            const audioFileName = `${conversationIdToUse}/${data.mensaje_id}.webm`;
            
            const byteCharacters = atob(base64data);
            const byteArrays = [];
            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
              const slice = byteCharacters.slice(offset, offset + 512);
              const byteNumbers = new Array(slice.length);
              for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              byteArrays.push(byteArray);
            }
            const blob = new Blob(byteArrays, {type: 'audio/webm'});
            
            console.log(`Subiendo audio al bucket 'mensajes-audio' con path: ${audioFileName}`);
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('mensajes-audio')
              .upload(audioFileName, blob, {
                contentType: 'audio/webm',
                cacheControl: '3600',
                upsert: true
              });
              
            if (uploadError) {
              throw uploadError;
            }
            
            console.log("Audio subido correctamente:", uploadData);
            
            const { data: publicUrlData } = supabase.storage
              .from('mensajes-audio')
              .getPublicUrl(audioFileName);
              
            const archivoUrl = publicUrlData?.publicUrl || '';
            console.log("URL pública del audio:", archivoUrl);
            
            const audioData = {
              id: data.audio_id,
              mensaje_id: data.mensaje_id,
              conversacion_id: conversationIdToUse, // Usar el ID de conversación consistente
              archivo_url: archivoUrl,
              duracion_segundos: finalAudioDuration,
              transcripcion: data.transcripcion || '',
              idioma_detectado: data.idioma_detectado || 'es',
              formato: 'webm',
              tamano_bytes: blob.size,
              metadata: {
                navegador: navigator.userAgent,
                duracion: finalAudioDuration
              }
            };
            
            console.log("Guardando datos de audio en mensajes_audio:", audioData);
            
            const { error: audioError } = await supabase
              .from("mensajes_audio")
              .upsert(audioData);
            
            if (audioError) {
              console.error("Error al guardar datos de audio en mensajes_audio:", audioError);
            } else {
              console.log("Datos de audio guardados correctamente en mensajes_audio");
            }
          } catch (audioDbError) {
            console.error("Error al procesar datos de audio para la base de datos:", audioDbError);
          }
        }
      };

    } catch (error) {
      console.error("Error al enviar audio:", error);
      toast.error("No se pudo enviar el audio. Intente de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      if (!audioPermissionGranted.current) {
        const permissionGranted = await requestMicrophonePermission();
        if (!permissionGranted) return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mimeType = 'audio/webm';
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'audio/wav'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setShowRecordingControls(true);
      setRecordingTime(0);

      const interval = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      setRecordingInterval(interval);

    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("No se pudo iniciar la grabación. Intente de nuevo.");
    }
  };

  const stopRecordingAndSend = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    
    const currentDuration = recordingTime;
    
    mediaRecorderRef.current.addEventListener('stop', () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || 'audio/webm'
      });
      
      sendAudioMessage(audioBlob, currentDuration);
      
      setShowRecordingControls(false);
      setIsRecording(false);
    }, { once: true });
    
    mediaRecorderRef.current.stop();
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
      
      setIsRecording(false);
    }
    
    setShowRecordingControls(false);
    setAudioBlob(null);
    audioChunksRef.current = [];
  };

  const sendRecordedAudio = () => {
    if (isRecording) {
      stopRecordingAndSend();
    } else if (audioBlob) {
      sendAudioMessage(audioBlob);
      setShowRecordingControls(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecordingAndSend();
    } else {
      startRecording();
    }
  };

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.isAudio) {
      return (
        <AudioMessage 
          src={msg.audioUrl || ''} 
          duration={msg.audioDuration || 0} 
        />
      );
    }

    return (
      <ReactMarkdown className="whitespace-pre-wrap break-words text-sm font-normal">
        {msg.contenido}
      </ReactMarkdown>
    );
  };

  const handleSendButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage();
    } else if (!isRecording) {
      toggleRecording();
    }
  };

  const submitUserForm = async () => {
    if (!userName.trim() || !userPhone.trim()) {
      toast.error("Por favor, ingresa tu nombre y número de teléfono");
      return;
    }
    
    try {
      // Verificar si el número de teléfono ya existe en la base de datos
      const countryCode = document.getElementById("countryCode") as HTMLSelectElement;
      const fullPhone = (countryCode ? countryCode.value : "+57") + userPhone;
      
      // Buscar si ya existe un lead con ese número
      const { data: existingPhone, error: phoneCheckError } = await supabase
        .from("lead_datos_personales")
        .select("lead_id")
        .eq("telefono", fullPhone)
        .maybeSingle();
      
      if (phoneCheckError) {
        console.error("Error al verificar teléfono:", phoneCheckError);
      }
      
      if (existingPhone?.lead_id) {
        setPhoneError("Este número ya está registrado en nuestro sistema");
        return;
      }
      
      localStorage.setItem(`chatbot_name_${chatbotId}`, userName);
      localStorage.setItem(`chatbot_phone_${chatbotId}`, fullPhone); // Guardamos el teléfono completo con código de país
      
      setUserFormSubmitted(true);
      setShowUserForm(false);
      
      const leadId = await createLead(fullPhone);
      
      if (leadId) {
        const token = await getOrCreateAnonymousToken(leadId);
        setAnonymousToken(token);
        console.log("Anonymous token obtained:", token);
        
        // Obtener el welcome_message desde chatbot_contextos
        const { data: contextData, error: contextError } = await supabase
          .from("chatbot_contextos")
          .select("welcome_message")
          .eq("chatbot_id", chatbotId)
          .single();
        
        let welcomeText = `Hola ${userName}, bienvenido/a a nuestro chat. ¿En qué podemos ayudarte hoy?`;
        
        if (!contextError && contextData && contextData.welcome_message) {
          welcomeText = contextData.welcome_message.replace("{{nombre}}", userName);
        } else {
          console.log("Usando mensaje de bienvenida por defecto, no se encontró en chatbot_contextos");
        }
        
        const welcomeMessage = {
          id: uuidv4(),
          contenido: welcomeText,
          origen: "chatbot",
          created_at: new Date().toISOString()
        };
        
        addMessage(welcomeMessage);
      }
    } catch (error) {
      console.error("Error al iniciar chat:", error);
      toast.error("Hubo un problema al iniciar el chat. Intente de nuevo.");
    }
  };

  const createLead = async (fullPhone?: string) => {
    try {
      if (!chatbotInfo) {
        throw new Error("No se pudo determinar la información del chatbot");
      }
      
      const empresaId = chatbotInfo.empresa_id;
      const pipelineId = chatbotInfo.pipeline_id;
      const canalId = chatbotInfo.canal_id;
      
      console.log("Creating lead for chatbot:", chatbotInfo.nombre);
      console.log("Chatbot pipeline_id:", pipelineId);
      
      let pipeline;
      if (pipelineId) {
        const { data: pipelineData, error: pipelineError } = await supabase
          .from("pipelines")
          .select("id")
          .eq("id", pipelineId)
          .single();
          
        if (!pipelineError && pipelineData) {
          pipeline = pipelineData;
          console.log("Using chatbot's pipeline:", pipeline.id);
        } else {
          console.error("Error getting chatbot pipeline:", pipelineError);
        }
      }
      
      if (!pipeline) {
        console.log("No pipeline assigned to chatbot, looking for default pipeline");
        const { data: defaultPipeline, error: defaultPipelineError } = await supabase
          .from("pipelines")
          .select("id")
          .eq("empresa_id", empresaId)
          .eq("is_default", true)
          .single();
          
        if (defaultPipelineError) {
          console.log("No default pipeline found, getting any pipeline");
          const { data: anyPipeline, error: anyPipelineError } = await supabase
            .from("pipelines")
            .select("id")
            .eq("empresa_id", empresaId)
            .limit(1)
            .single();
            
          if (anyPipelineError) {
            console.error("No pipelines found:", anyPipelineError);
          } else {
            pipeline = anyPipeline;
            console.log("Using first available pipeline:", pipeline.id);
          }
        } else {
          pipeline = defaultPipeline;
          console.log("Using default pipeline:", pipeline.id);
        }
      }
      
      let stageId;
      if (pipeline) {
        console.log("Finding stage 1 for pipeline:", pipeline.id);
        const { data: stages, error: stagesError } = await supabase
          .from("pipeline_stages")
          .select("id, posicion, nombre")
          .eq("pipeline_id", pipeline.id)
          .eq("posicion", 1)
          .single();
          
        if (stagesError) {
          console.error("No stage with position 1 found:", stagesError);
          const { data: firstStage, error: firstStageError } = await supabase
            .from("pipeline_stages")
            .select("id, posicion, nombre")
            .eq("pipeline_id", pipeline.id)
            .order("posicion", { ascending: true })
            .limit(1)
            .single();
            
          if (!firstStageError) {
            stageId = firstStage.id;
            console.log(`Using first stage (position ${firstStage.posicion}): ${firstStage.nombre} (${stageId})`);
          } else {
            console.error("No stages found for pipeline:", firstStageError);
          }
        } else {
          stageId = stages.id;
          console.log(`Using stage 1: ${stages.nombre} (${stageId})`);
        }
      }
      
      const leadData = {
        empresa_id: empresaId,
        canal_origen: "web",
        canal_id: canalId,
        pipeline_id: pipeline?.id || null,
        stage_id: stageId || null,
        estado: "nuevo"
      };
      
      console.log("Creating lead with base data:", leadData);
      
      const { data: newLead, error: leadError } = await supabase
        .from("leads")
        .insert(leadData)
        .select()
        .single();
      
      if (leadError) throw leadError;
      
      console.log("Lead created:", newLead);
      
      if (newLead?.id) {
        const datosPersonales = {
          lead_id: newLead.id,
          nombre: userName,
          telefono: fullPhone || userPhone,
          datos_adicionales: {
            session_id: sessionId,
            user_agent: navigator.userAgent,
            page: window.location.pathname
          }
        };
        
        console.log("Creating lead_datos_personales:", datosPersonales);
        
        const { error: datosPersonalesError } = await supabase
          .from("lead_datos_personales")
          .insert(datosPersonales);
          
        if (datosPersonalesError) {
          console.error("Error creating lead_datos_personales:", datosPersonalesError);
        }
        
        setLeadId(newLead.id);
        localStorage.setItem(`chatbot_lead_${chatbotId}`, newLead.id);
        return newLead.id;
      }
      
      return null;
    } catch (error) {
      console.error("Error creating lead:", error);
      throw error;
    }
  };

  const sendMessage = async (customContent?: string) => {
    const messageContent = customContent || message.trim();
    if (!messageContent && !isRecording && audioChunksRef.current.length === 0) return;
    
    setSending(true);
    
    try {
      const empresaId = chatbotInfo?.empresa_id;
      if (!empresaId) {
        throw new Error("No se pudo determinar la empresa del chatbot");
      }
      
      const optimisticId = uuidv4();
      const optimisticMsg: ChatMessage = {
        id: optimisticId,
        contenido: messageContent,
        origen: "usuario",
        created_at: new Date().toISOString()
      };
      
      addMessage(optimisticMsg);
      
      if (!customContent) {
        setMessage("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
      
      const apiEndpoint = "https://web-production-01457.up.railway.app";
      
      // Obtenemos el canal_id del chatbot para Web Chat específicamente
      const CANAL_WEB_ID = "13956803-a8ca-4087-8050-e3c98eafa4bd";
      let chatbotCanalId; // Para almacenar el ID específico de la relación chatbot-canal
      let canalIdentificador = window.location.href;
      
      try {
        // Modificado para obtener todos los canales y encontrar específicamente el canal web
        const { data: canalesData, error: canalError } = await supabase
          .from("chatbot_canales")
          .select(`
            id, 
            canal_id
          `)
          .eq("chatbot_id", chatbotId);
        
        if (canalError) {
          console.warn("No se pudo obtener canales de chatbot_canales:", canalError);
        } else if (canalesData && canalesData.length > 0) {
          // Buscar explícitamente el canal que tiene canal_id = CANAL_WEB_ID
          const canalWebFound = canalesData.find(canal => canal.canal_id === CANAL_WEB_ID);
          
          if (canalWebFound) {
            console.log(`Canal Web encontrado con ID: ${canalWebFound.id}`);
            // Aquí guardamos el ID específico de la relación, que es el chatbot_canal_id
            chatbotCanalId = canalWebFound.id;
          } else {
            // Si no existe un canal específicamente web, usar el primer canal disponible
            console.log(`Canal Web no encontrado, usando el primer canal disponible: ${canalesData[0].id}`);
            chatbotCanalId = canalesData[0].id;
          }
        }
      } catch (canalError) {
        console.error("Error al obtener información del canal:", canalError);
      }
      
      // Recopilamos metadata adicional
      const metadata = {
        browser: navigator.userAgent,
        page: window.location.pathname,
        url: window.location.href,
        referer: document.referrer || null,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
        platform: navigator.platform,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: new Date().toISOString()
      };
      
      // Creamos el objeto de solicitud solo con los campos requeridos según la API
      const apiRequest = {
        chatbot_canal_id: chatbotCanalId,
        canal_identificador: canalIdentificador,
        mensaje: messageContent,
        lead_id: leadId || null,
        metadata: metadata,
        conversacion_id: conversationId // Enviar el ID de conversación si existe
      };
      
      console.log("Enviando mensaje a la API con formato simplificado:", {
        ...apiRequest,
        metadata: { ...metadata, browser: "[browser_info]" } // Simplificamos la información del navegador en los logs
      });
      
      // Usando el endpoint correcto según la documentación
      const response = await fetch(`${apiEndpoint}/api/v1/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiRequest)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error en la respuesta API:", response.status, errorText);
        throw new Error(`Error al enviar mensaje: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Respuesta de la API:", data);
      
      if (data.respuesta) {
        addMessage({
          id: data.mensaje_id || uuidv4(),
          contenido: data.respuesta,
          origen: "chatbot",
          created_at: new Date().toISOString(),
          metadata: data.metadata || {}
        });
      }
      
      if (data.conversacion_id && data.conversacion_id !== conversationId) {
        setConversationId(data.conversacion_id);
        localStorage.setItem(`chatbot_conversation_${chatbotId}`, data.conversacion_id);
      }
      
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      toast.error("No se pudo enviar el mensaje. Intente de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setShowEmojiPicker(false);
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioPermissionGranted.current = true;
      
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error("Error requesting microphone permission:", error);
      toast.error("No se pudo acceder al micrófono. Verifique los permisos.");
      return false;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };

  const getSenderType = (origen: string, metadata: any): "user" | "bot" | "agent" => {
    if (origen === 'usuario' || origen === 'lead' || origen === 'user') return "user";
    if (origen === 'chatbot' || origen === 'bot') return "bot";
    if (origen === 'agente' || origen === 'agent') return "agent";
    return origen === "agente" ? "agent" : origen === "chatbot" ? "bot" : "user";
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLastActiveTime = () => {
    if (messages.length === 0) return "Ahora";
    const lastMessage = messages[messages.length - 1];
    return formatTime(lastMessage.created_at);
  };

  const renderStars = () => {
    return Array.from({
      length: 5
    }).map((_, i) => <button key={i} className={`p-2 ${i < userRating ? 'text-yellow-400' : 'text-gray-300'}`} onClick={() => setUserRating(i + 1)}>
      <Star className="h-8 w-8" fill={i < userRating ? "currentColor" : "none"} />
    </button>);
  };

  const submitRating = async () => {
    if (userRating === 0) {
      toast.error("Por favor, seleccione una calificación");
      return;
    }
    
    try {
      toast.success("¡Gracias por tu opinión!");
      setShowRatingDrawer(false);
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("No se pudo enviar la calificación. Intente de nuevo.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0e1621] overflow-hidden" ref={containerRef}>
      <header className="p-3 bg-[#020817] shadow-sm flex items-center justify-between fixed top-0 left-0 right-0 z-30 border-b border-[#3b82f6]">
        <div className="flex items-center gap-3">
          <div className="avatar-border">
            <Avatar className="h-10 w-10 border-2 border-transparent text-green-500">
              <AvatarImage src={chatbotInfo?.avatar_url || ''} />
              <AvatarFallback>
                <Bot className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h1 className="text-base font-medium text-white">{chatbotInfo?.nombre || 'Chatbot'}</h1>
            <p className="text-xs text-gray-400">en línea</p>
          </div>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 bg-[#1f2c34] border-0 text-white" align="end">
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start text-gray-200 hover:bg-[#2a3942]" size="sm" onClick={() => setShowProfile(true)}>
                <User className="mr-2 h-4 w-4" />
                <span>Mi perfil</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-200 hover:bg-[#2a3942]" size="sm" onClick={() => setShowRatingDrawer(true)}>
                <Star className="mr-2 h-4 w-4" />
                <span>Calificar chatbot</span>
              </Button>
              <Separator className="my-2 bg-gray-700" />
              <Button variant="ghost" className="w-full justify-start text-xs text-gray-400 hover:bg-[#2a3942]" size="sm" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Políticas de privacidad</span>
                </a>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-xs text-gray-400 hover:bg-[#2a3942]" size="sm" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Info className="mr-2 h-4 w-4" />
                  <span>Términos de uso</span>
                </a>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </header>

      <div
        className="flex-1 chat-background overflow-y-auto pt-16 pb-16"
        style={{ height: 'calc(100vh - 122px)' }}
        ref={scrollAreaRef}
      >
        <div className="space-y-2 max-w-3xl mx-auto pb-2 p-4 chat-message-container">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-gray-500 mb-4 opacity-50" />
              <p className="text-gray-400 text-sm bg-[#1f2c34]/50 p-3 rounded-lg backdrop-blur-sm inline-block">
                Inicia una conversación con el chatbot.
              </p>
            </div>
          ) : (
            messages
              .filter(msg => !(msg.metadata && msg.metadata.is_system_message === true))
              .map(msg => {
                const senderType = getSenderType(msg.origen, msg.metadata);
                const isUser = senderType === "user";
                const isBot = senderType === "bot";
                const isAgent = senderType === "agent";

                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
                    <div className={`
                      relative px-3 py-2 shadow-sm
                      ${isUser ? 'user-bubble' : isBot ? 'bot-bubble' : 'agent-bubble'}
                    `}>
                      {renderMessageContent(msg)}
                      <span className="chat-timestamp">
                        {formatTime(msg.created_at)}
                        {isUser && <Check className="ml-1 h-3 w-3" />}
                      </span>
                    </div>
                  </div>
                );
              })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-2 bg-[#020817] border-t border-[#3b82f6] fixed bottom-0 left-0 right-0 z-30">
        {showRecordingControls ? (
          <div className="whatsapp-input-container">
            <RecordingAnimation
              duration={recordingTime}
              onCancel={cancelRecording}
              onSend={() => {
                stopRecordingAndSend();
              }}
            />
          </div>
        ) : (
          <div className="whatsapp-input-container" ref={inputContainerRef}>
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="whatsapp-button">
              <Smile className="h-6 w-6" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Mensaje"
              className="whatsapp-input"
              disabled={sending || isRecording || showUserForm}
            />

            <button
              onClick={handleSendButtonClick}
              className={`whatsapp-button ${message.trim() ? 'whatsapp-send-button' : ''} ${isRecording ? 'recording-button' : ''}`}
              disabled={sending || showUserForm}
            >
              {message.trim() ? <Send className="h-5 w-5" /> :
                (isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-6 w-6" />)}
            </button>
          </div>
        )}

        {audioBlob && !showRecordingControls && !sending && (
          <div className="mt-2 flex justify-end space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAudioBlob(null)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={sendRecordedAudio}
            >
              Enviar audio
            </Button>
          </div>
        )}
      </div>

      {showEmojiPicker && (
        <div className="absolute bottom-16 left-2 z-50">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        </div>
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6 space-y-4 relative">
            <div className="text-center mb-4">
              <Avatar className="h-16 w-16 mx-auto mb-2 avatar-border border-2 border-green-500">
                <AvatarImage src={chatbotInfo?.avatar_url || ''} />
                <AvatarFallback>
                  <Bot className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{chatbotInfo?.nombre || 'Chatbot'}</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Para iniciar la conversación, por favor comparte tus datos:
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="userName" className="text-sm font-medium">
                  Nombre completo
                </label>
                <input id="userName" type="text" value={userName} onChange={e => setUserName(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Ingresa tu nombre" />
              </div>
              <div className="space-y-1">
                <label htmlFor="userPhone" className="text-sm font-medium">
                  Número de teléfono
                </label>
                <div className="flex">
                  <select 
                    id="countryCode"
                    className="rounded-l-md border border-input bg-background px-2 py-2 text-sm border-r-0" 
                    defaultValue="+57"
                  >
                    <option value="+57">+57 🇨🇴</option>
                    <option value="+1">+1 🇺🇸</option>
                    <option value="+52">+52 🇲🇽</option>
                    <option value="+34">+34 🇪🇸</option>
                    <option value="+58">+58 🇻🇪</option>
                  </select>
                  <input 
                    id="userPhone" 
                    type="tel" 
                    value={userPhone} 
                    onChange={e => {
                      // Permitir solo números y limitar a 10 dígitos
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        setUserPhone(value);
                      }
                    }} 
                    className="flex-1 rounded-r-md border border-input bg-background px-3 py-2 text-sm" 
                    placeholder="Ej: 3001234567" 
                  />
                </div>
                {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
              </div>
            </div>
            <Button className="w-full mt-4" onClick={submitUserForm} disabled={!userName.trim() || !userPhone.trim()}>
              Iniciar chat
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Al continuar, aceptas nuestras <a href="http://prometheuslabs.com.co/politicas_de_privacidad" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">políticas de privacidad</a> y <a href="http://prometheuslabs.com.co/condiciones_de_servicio" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">términos de uso</a>.
            </p>
          </div>
        </div>
      )}

      {/* Profile Sheet */}
      <Sheet open={showProfile} onOpenChange={setShowProfile}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Mi perfil</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20 avatar-border">
              <AvatarImage src={chatbotInfo?.avatar_url || ''} />
              <AvatarFallback>
                <Bot className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-semibold">{userName || 'Usuario'}</h2>
            <p className="text-sm text-muted-foreground">{userPhone || 'Sin número de teléfono'}</p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Rating Drawer */}
      <Drawer open={showRatingDrawer} onOpenChange={setShowRatingDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Calificar chatbot</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-muted-foreground">¿Cómo calificarías tu experiencia?</p>
            <div className="flex space-x-1">{renderStars()}</div>
            <Textarea
              placeholder="Escribe tus comentarios aquí..."
              value={userFeedback}
              onChange={(e) => setUserFeedback(e.target.value)}
            />
          </div>
          <DrawerFooter>
            <Button onClick={submitRating}>Enviar</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default ChatInterface;
