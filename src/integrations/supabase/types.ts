export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      automatizacion_ejecuciones: {
        Row: {
          automatizacion_id: string | null
          created_at: string | null
          detalles: Json | null
          evento_id: string | null
          id: string
          mensaje: string | null
          resultado: string | null
        }
        Insert: {
          automatizacion_id?: string | null
          created_at?: string | null
          detalles?: Json | null
          evento_id?: string | null
          id?: string
          mensaje?: string | null
          resultado?: string | null
        }
        Update: {
          automatizacion_id?: string | null
          created_at?: string | null
          detalles?: Json | null
          evento_id?: string | null
          id?: string
          mensaje?: string | null
          resultado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automatizacion_ejecuciones_automatizacion_id_fkey"
            columns: ["automatizacion_id"]
            isOneToOne: false
            referencedRelation: "automatizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automatizacion_ejecuciones_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      automatizaciones: {
        Row: {
          acciones: Json
          condiciones: Json | null
          created_at: string | null
          descripcion: string | null
          empresa_id: string | null
          evento_tipo: string
          id: string
          is_active: boolean | null
          nombre: string
          updated_at: string | null
        }
        Insert: {
          acciones: Json
          condiciones?: Json | null
          created_at?: string | null
          descripcion?: string | null
          empresa_id?: string | null
          evento_tipo: string
          id?: string
          is_active?: boolean | null
          nombre: string
          updated_at?: string | null
        }
        Update: {
          acciones?: Json
          condiciones?: Json | null
          created_at?: string | null
          descripcion?: string | null
          empresa_id?: string | null
          evento_tipo?: string
          id?: string
          is_active?: boolean | null
          nombre?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automatizaciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      canales: {
        Row: {
          configuracion_requerida: Json | null
          created_at: string | null
          descripcion: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          nombre: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          configuracion_requerida?: Json | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          nombre: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          configuracion_requerida?: Json | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          nombre?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chatbot_canales: {
        Row: {
          canal_id: string | null
          chatbot_id: string | null
          configuracion: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          canal_id?: string | null
          chatbot_id?: string | null
          configuracion: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          canal_id?: string | null
          chatbot_id?: string | null
          configuracion?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_canales_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "canales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_canales_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_contextos: {
        Row: {
          chatbot_id: string | null
          communication_tone: string | null
          contenido: string
          created_at: string | null
          general_context: string | null
          id: string
          key_points: Json | null
          main_purpose: string | null
          orden: number | null
          personality: string | null
          prompt_template: string | null
          qa_examples: Json | null
          special_instructions: string | null
          tipo: string
          updated_at: string | null
          welcome_message: string | null
        }
        Insert: {
          chatbot_id?: string | null
          communication_tone?: string | null
          contenido: string
          created_at?: string | null
          general_context?: string | null
          id?: string
          key_points?: Json | null
          main_purpose?: string | null
          orden?: number | null
          personality?: string | null
          prompt_template?: string | null
          qa_examples?: Json | null
          special_instructions?: string | null
          tipo: string
          updated_at?: string | null
          welcome_message?: string | null
        }
        Update: {
          chatbot_id?: string | null
          communication_tone?: string | null
          contenido?: string
          created_at?: string | null
          general_context?: string | null
          id?: string
          key_points?: Json | null
          main_purpose?: string | null
          orden?: number | null
          personality?: string | null
          prompt_template?: string | null
          qa_examples?: Json | null
          special_instructions?: string | null
          tipo?: string
          updated_at?: string | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_contextos_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbots: {
        Row: {
          avatar_url: string | null
          configuracion: Json | null
          contexto: Json | null
          created_at: string | null
          descripcion: string | null
          empresa_id: string | null
          id: string
          instrucciones: string | null
          is_active: boolean | null
          nombre: string
          personalidad: string | null
          pipeline_id: string | null
          tono: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          configuracion?: Json | null
          contexto?: Json | null
          created_at?: string | null
          descripcion?: string | null
          empresa_id?: string | null
          id?: string
          instrucciones?: string | null
          is_active?: boolean | null
          nombre: string
          personalidad?: string | null
          pipeline_id?: string | null
          tono?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          configuracion?: Json | null
          contexto?: Json | null
          created_at?: string | null
          descripcion?: string | null
          empresa_id?: string | null
          id?: string
          instrucciones?: string | null
          is_active?: boolean | null
          nombre?: string
          personalidad?: string | null
          pipeline_id?: string | null
          tono?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbots_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contexto_conversacional: {
        Row: {
          contenido_sanitizado: string | null
          created_at: string | null
          id: string
          relevancia_score: number | null
          tipo_contexto: string | null
          token_anonimo: string | null
          updated_at: string | null
        }
        Insert: {
          contenido_sanitizado?: string | null
          created_at?: string | null
          id?: string
          relevancia_score?: number | null
          tipo_contexto?: string | null
          token_anonimo?: string | null
          updated_at?: string | null
        }
        Update: {
          contenido_sanitizado?: string | null
          created_at?: string | null
          id?: string
          relevancia_score?: number | null
          tipo_contexto?: string | null
          token_anonimo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contexto_conversacional_token_anonimo_fkey"
            columns: ["token_anonimo"]
            isOneToOne: false
            referencedRelation: "pii_tokens"
            referencedColumns: ["token_anonimo"]
          },
        ]
      }
      conversaciones: {
        Row: {
          canal_id: string | null
          canal_identificador: string | null
          chatbot_activo: boolean | null
          chatbot_id: string | null
          created_at: string | null
          estado: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          ultimo_mensaje: string | null
          updated_at: string | null
        }
        Insert: {
          canal_id?: string | null
          canal_identificador?: string | null
          chatbot_activo?: boolean | null
          chatbot_id?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          ultimo_mensaje?: string | null
          updated_at?: string | null
        }
        Update: {
          canal_id?: string | null
          canal_identificador?: string | null
          chatbot_activo?: boolean | null
          chatbot_id?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          ultimo_mensaje?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversaciones_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "canales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversaciones_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversaciones_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_faqs: {
        Row: {
          created_at: string | null
          empresa_id: string | null
          id: string
          orden: number | null
          pregunta: string
          respuesta: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          orden?: number | null
          pregunta: string
          respuesta: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          orden?: number | null
          pregunta?: string
          respuesta?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresa_faqs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_productos: {
        Row: {
          caracteristicas: Json | null
          created_at: string | null
          descripcion: string
          empresa_id: string | null
          id: string
          imagen_url: string | null
          is_active: boolean | null
          nombre: string
          orden: number | null
          precio: number | null
          updated_at: string | null
        }
        Insert: {
          caracteristicas?: Json | null
          created_at?: string | null
          descripcion: string
          empresa_id?: string | null
          id?: string
          imagen_url?: string | null
          is_active?: boolean | null
          nombre: string
          orden?: number | null
          precio?: number | null
          updated_at?: string | null
        }
        Update: {
          caracteristicas?: Json | null
          created_at?: string | null
          descripcion?: string
          empresa_id?: string | null
          id?: string
          imagen_url?: string | null
          is_active?: boolean | null
          nombre?: string
          orden?: number | null
          precio?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresa_productos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          ciudad: string | null
          codigo_postal: string | null
          configuracion: Json | null
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          direccion: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          nombre: string
          onboarding_completed: boolean | null
          pais: string | null
          sitio_web: string | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          ciudad?: string | null
          codigo_postal?: string | null
          configuracion?: Json | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          nombre: string
          onboarding_completed?: boolean | null
          pais?: string | null
          sitio_web?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          ciudad?: string | null
          codigo_postal?: string | null
          configuracion?: Json | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          nombre?: string
          onboarding_completed?: boolean | null
          pais?: string | null
          sitio_web?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluaciones_llm: {
        Row: {
          comentario: string | null
          conversacion_id: string
          created_at: string
          fecha_evaluacion: string
          id: number
          interes_productos: string[] | null
          lead_id: string
          llm_configuracion_id: string | null
          mensaje_id: string | null
          palabras_clave: string[] | null
          prompt_utilizado: string | null
          score_potencial: number
          score_satisfaccion: number
          updated_at: string
        }
        Insert: {
          comentario?: string | null
          conversacion_id: string
          created_at?: string
          fecha_evaluacion?: string
          id?: number
          interes_productos?: string[] | null
          lead_id: string
          llm_configuracion_id?: string | null
          mensaje_id?: string | null
          palabras_clave?: string[] | null
          prompt_utilizado?: string | null
          score_potencial: number
          score_satisfaccion: number
          updated_at?: string
        }
        Update: {
          comentario?: string | null
          conversacion_id?: string
          created_at?: string
          fecha_evaluacion?: string
          id?: number
          interes_productos?: string[] | null
          lead_id?: string
          llm_configuracion_id?: string | null
          mensaje_id?: string | null
          palabras_clave?: string[] | null
          prompt_utilizado?: string | null
          score_potencial?: number
          score_satisfaccion?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_llm_conversacion_id_fkey"
            columns: ["conversacion_id"]
            isOneToOne: false
            referencedRelation: "conversaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_llm_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_llm_llm_configuracion_id_fkey"
            columns: ["llm_configuracion_id"]
            isOneToOne: false
            referencedRelation: "llm_configuraciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_llm_mensaje_id_fkey"
            columns: ["mensaje_id"]
            isOneToOne: false
            referencedRelation: "mensajes"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos: {
        Row: {
          created_at: string | null
          datos: Json | null
          empresa_id: string | null
          entidad_id: string
          entidad_tipo: string
          id: string
          procesado: boolean | null
          tipo: string
        }
        Insert: {
          created_at?: string | null
          datos?: Json | null
          empresa_id?: string | null
          entidad_id: string
          entidad_tipo: string
          id?: string
          procesado?: boolean | null
          tipo: string
        }
        Update: {
          created_at?: string | null
          datos?: Json | null
          empresa_id?: string | null
          entidad_id?: string
          entidad_tipo?: string
          id?: string
          procesado?: boolean | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      galeria_imagenes: {
        Row: {
          created_at: string | null
          descripcion: string | null
          galeria_id: string | null
          id: string
          orden: number | null
          palabras_clave: string[] | null
          titulo: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          galeria_id?: string | null
          id?: string
          orden?: number | null
          palabras_clave?: string[] | null
          titulo?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          galeria_id?: string | null
          id?: string
          orden?: number | null
          palabras_clave?: string[] | null
          titulo?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "galeria_imagenes_galeria_id_fkey"
            columns: ["galeria_id"]
            isOneToOne: false
            referencedRelation: "galerias_imagenes"
            referencedColumns: ["id"]
          },
        ]
      }
      galerias_imagenes: {
        Row: {
          created_at: string | null
          descripcion: string | null
          empresa_id: string | null
          id: string
          nombre: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          empresa_id?: string | null
          id?: string
          nombre: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          empresa_id?: string | null
          id?: string
          nombre?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "galerias_imagenes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_comments: {
        Row: {
          contenido: string
          created_at: string | null
          id: string
          is_private: boolean | null
          lead_id: string
          metadata: Json | null
          parent_id: string | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          contenido: string
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          lead_id: string
          metadata?: Json | null
          parent_id?: string | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          contenido?: string
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          lead_id?: string
          metadata?: Json | null
          parent_id?: string | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_comments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "lead_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_history: {
        Row: {
          campo: string
          created_at: string | null
          id: string
          lead_id: string | null
          usuario_id: string | null
          valor_anterior: string | null
          valor_nuevo: string | null
        }
        Insert: {
          campo: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          usuario_id?: string | null
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Update: {
          campo?: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          usuario_id?: string | null
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_intentions: {
        Row: {
          color: string | null
          created_at: string | null
          descripcion: string | null
          empresa_id: string | null
          id: string
          is_active: boolean | null
          nombre: string
          palabras_clave: Json | null
          prioridad: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          empresa_id?: string | null
          id?: string
          is_active?: boolean | null
          nombre: string
          palabras_clave?: Json | null
          prioridad?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          empresa_id?: string | null
          id?: string
          is_active?: boolean | null
          nombre?: string
          palabras_clave?: Json | null
          prioridad?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_intentions_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_interaction_types: {
        Row: {
          color: string | null
          created_at: string | null
          descripcion: string | null
          empresa_id: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          nombre: string
          updated_at: string | null
          valor_score: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          empresa_id?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          nombre: string
          updated_at?: string | null
          valor_score: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          empresa_id?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          nombre?: string
          updated_at?: string | null
          valor_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_interaction_types_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_interactions: {
        Row: {
          agente_id: string | null
          conversacion_id: string | null
          created_at: string | null
          id: string
          intencion_id: string | null
          interaction_type_id: string | null
          lead_id: string | null
          mensaje_id: string | null
          metadata: Json | null
          notas: string | null
          valor_score: number
        }
        Insert: {
          agente_id?: string | null
          conversacion_id?: string | null
          created_at?: string | null
          id?: string
          intencion_id?: string | null
          interaction_type_id?: string | null
          lead_id?: string | null
          mensaje_id?: string | null
          metadata?: Json | null
          notas?: string | null
          valor_score: number
        }
        Update: {
          agente_id?: string | null
          conversacion_id?: string | null
          created_at?: string | null
          id?: string
          intencion_id?: string | null
          interaction_type_id?: string | null
          lead_id?: string | null
          mensaje_id?: string | null
          metadata?: Json | null
          notas?: string | null
          valor_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_conversacion_id_fkey"
            columns: ["conversacion_id"]
            isOneToOne: false
            referencedRelation: "conversaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interactions_intencion_id_fkey"
            columns: ["intencion_id"]
            isOneToOne: false
            referencedRelation: "lead_intentions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interactions_interaction_type_id_fkey"
            columns: ["interaction_type_id"]
            isOneToOne: false
            referencedRelation: "lead_interaction_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_interactions_mensaje_id_fkey"
            columns: ["mensaje_id"]
            isOneToOne: false
            referencedRelation: "mensajes"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_stage_history: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          metadata: Json | null
          motivo: string | null
          stage_id_anterior: string | null
          stage_id_nuevo: string
          tiempo_en_stage: unknown | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          motivo?: string | null
          stage_id_anterior?: string | null
          stage_id_nuevo: string
          tiempo_en_stage?: unknown | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          motivo?: string | null
          stage_id_anterior?: string | null
          stage_id_nuevo?: string
          tiempo_en_stage?: unknown | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_stage_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_stage_history_stage_id_anterior_fkey"
            columns: ["stage_id_anterior"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_stage_history_stage_id_nuevo_fkey"
            columns: ["stage_id_nuevo"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tag_relation: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          tag_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          tag_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_tag_relation_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tag_relation_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "lead_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tags: {
        Row: {
          color: string | null
          created_at: string | null
          empresa_id: string | null
          id: string
          nombre: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          nombre: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          nombre?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_tags_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          apellido: string | null
          asignado_a: string | null
          canal_id: string | null
          canal_origen: string | null
          ciudad: string | null
          created_at: string | null
          datos_adicionales: Json | null
          direccion: string | null
          email: string | null
          empresa_id: string | null
          estado: string | null
          id: string
          is_active: boolean | null
          nombre: string | null
          pais: string | null
          pipeline_id: string | null
          score: number | null
          stage_id: string | null
          telefono: string | null
          ultima_interaccion: string | null
          updated_at: string | null
        }
        Insert: {
          apellido?: string | null
          asignado_a?: string | null
          canal_id?: string | null
          canal_origen?: string | null
          ciudad?: string | null
          created_at?: string | null
          datos_adicionales?: Json | null
          direccion?: string | null
          email?: string | null
          empresa_id?: string | null
          estado?: string | null
          id?: string
          is_active?: boolean | null
          nombre?: string | null
          pais?: string | null
          pipeline_id?: string | null
          score?: number | null
          stage_id?: string | null
          telefono?: string | null
          ultima_interaccion?: string | null
          updated_at?: string | null
        }
        Update: {
          apellido?: string | null
          asignado_a?: string | null
          canal_id?: string | null
          canal_origen?: string | null
          ciudad?: string | null
          created_at?: string | null
          datos_adicionales?: Json | null
          direccion?: string | null
          email?: string | null
          empresa_id?: string | null
          estado?: string | null
          id?: string
          is_active?: boolean | null
          nombre?: string | null
          pais?: string | null
          pipeline_id?: string | null
          score?: number | null
          stage_id?: string | null
          telefono?: string | null
          ultima_interaccion?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_configuraciones: {
        Row: {
          api_key: string | null
          configuracion: Json | null
          created_at: string | null
          empresa_id: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          modelo: string
          nombre: string
          proveedor: string
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          configuracion?: Json | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          modelo: string
          nombre: string
          proveedor: string
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          configuracion?: Json | null
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          modelo?: string
          nombre?: string
          proveedor?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "llm_configuraciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      mensaje_plantillas: {
        Row: {
          categoria: string | null
          contenido: string
          created_at: string | null
          empresa_id: string | null
          id: string
          nombre: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          categoria?: string | null
          contenido: string
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          nombre: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          categoria?: string | null
          contenido?: string
          created_at?: string | null
          empresa_id?: string | null
          id?: string
          nombre?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mensaje_plantillas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes: {
        Row: {
          contenido: string
          conversacion_id: string | null
          created_at: string | null
          id: string
          intencion_id: string | null
          interaction_type_id: string | null
          leido: boolean | null
          metadata: Json | null
          origen: string
          remitente_id: string | null
          score_impacto: number | null
          tipo_contenido: string | null
        }
        Insert: {
          contenido: string
          conversacion_id?: string | null
          created_at?: string | null
          id?: string
          intencion_id?: string | null
          interaction_type_id?: string | null
          leido?: boolean | null
          metadata?: Json | null
          origen: string
          remitente_id?: string | null
          score_impacto?: number | null
          tipo_contenido?: string | null
        }
        Update: {
          contenido?: string
          conversacion_id?: string | null
          created_at?: string | null
          id?: string
          intencion_id?: string | null
          interaction_type_id?: string | null
          leido?: boolean | null
          metadata?: Json | null
          origen?: string
          remitente_id?: string | null
          score_impacto?: number | null
          tipo_contenido?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_conversacion_id_fkey"
            columns: ["conversacion_id"]
            isOneToOne: false
            referencedRelation: "conversaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_intencion_id_fkey"
            columns: ["intencion_id"]
            isOneToOne: false
            referencedRelation: "lead_intentions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_interaction_type_id_fkey"
            columns: ["interaction_type_id"]
            isOneToOne: false
            referencedRelation: "lead_interaction_types"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes_agentes: {
        Row: {
          contenido: string
          conversacion_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          origen: string | null
          remitente_id: string | null
        }
        Insert: {
          contenido: string
          conversacion_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          origen?: string | null
          remitente_id?: string | null
        }
        Update: {
          contenido?: string
          conversacion_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          origen?: string | null
          remitente_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_agentes_conversacion_id_fkey"
            columns: ["conversacion_id"]
            isOneToOne: false
            referencedRelation: "conversaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes_sanitizados: {
        Row: {
          contenido_sanitizado: string | null
          created_at: string | null
          id: string
          mensaje_id: string | null
          metadata_sanitizada: Json | null
          token_anonimo: string | null
        }
        Insert: {
          contenido_sanitizado?: string | null
          created_at?: string | null
          id?: string
          mensaje_id?: string | null
          metadata_sanitizada?: Json | null
          token_anonimo?: string | null
        }
        Update: {
          contenido_sanitizado?: string | null
          created_at?: string | null
          id?: string
          mensaje_id?: string | null
          metadata_sanitizada?: Json | null
          token_anonimo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_sanitizados_mensaje_id_fkey"
            columns: ["mensaje_id"]
            isOneToOne: false
            referencedRelation: "mensajes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_sanitizados_token_anonimo_fkey"
            columns: ["token_anonimo"]
            isOneToOne: false
            referencedRelation: "pii_tokens"
            referencedColumns: ["token_anonimo"]
          },
        ]
      }
      pii_tokens: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          lead_id: string | null
          token_anonimo: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          lead_id?: string | null
          token_anonimo?: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          lead_id?: string | null
          token_anonimo?: string
        }
        Relationships: [
          {
            foreignKeyName: "pii_tokens_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          color: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          is_active: boolean | null
          nombre: string
          pipeline_id: string | null
          posicion: number
          probabilidad: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          is_active?: boolean | null
          nombre: string
          pipeline_id?: string | null
          posicion: number
          probabilidad?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          is_active?: boolean | null
          nombre?: string
          pipeline_id?: string | null
          posicion?: number
          probabilidad?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string | null
          descripcion: string | null
          empresa_id: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          nombre: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          empresa_id?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          nombre: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          empresa_id?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          nombre?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          empresa_id: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_sign_in: string | null
          onboarding_completed: boolean | null
          onboarding_step: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          empresa_id?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_sign_in?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          empresa_id?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_sign_in?: string | null
          onboarding_completed?: boolean | null
          onboarding_step?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stage_automations: {
        Row: {
          accion: string
          configuracion: Json
          created_at: string | null
          empresa_id: string | null
          evento: string
          id: string
          is_active: boolean | null
          stage_id: string | null
          updated_at: string | null
        }
        Insert: {
          accion: string
          configuracion: Json
          created_at?: string | null
          empresa_id?: string | null
          evento: string
          id?: string
          is_active?: boolean | null
          stage_id?: string | null
          updated_at?: string | null
        }
        Update: {
          accion?: string
          configuracion?: Json
          created_at?: string | null
          empresa_id?: string | null
          evento?: string
          id?: string
          is_active?: boolean | null
          stage_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stage_automations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_automations_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      belongs_to_empresa: {
        Args: { user_id: string; empresa_id: string }
        Returns: boolean
      }
      calculate_lead_score: {
        Args: { lead_uuid: string }
        Returns: number
      }
      create_anonymous_token: {
        Args: { p_lead_id: string }
        Returns: {
          token_anonimo: string
        }[]
      }
      ejecutar_sql: {
        Args: { sql: string }
        Returns: Json[]
      }
      insert_mensaje_sanitizado: {
        Args: {
          p_mensaje_id: string
          p_token_anonimo: string
          p_contenido_sanitizado: string
          p_metadata_sanitizada?: Json
        }
        Returns: string
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_admin_empresa: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "admin_empresa" | "agente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "admin_empresa", "agente"],
    },
  },
} as const
