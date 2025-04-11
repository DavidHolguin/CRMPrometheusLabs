export interface Database {
  public: {
    Tables: {
      evaluaciones_respuestas: {
        Row: {
          id: string
          mensaje_id: string
          respuesta_id: string
          evaluador_id: string
          puntuacion: number
          retroalimentacion: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mensaje_id: string
          respuesta_id: string
          evaluador_id: string
          puntuacion: number
          retroalimentacion?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          mensaje_id?: string
          respuesta_id?: string
          evaluador_id?: string
          puntuacion?: number
          retroalimentacion?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // ... otras tablas ...
    }
  }
}