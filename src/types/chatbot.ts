
export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface QA {
  question: string;
  answer: string;
}

export interface ChatbotCreationData {
  name: string;
  welcomeMessage: string;
  persona: string;
  customInstructions?: string;
  avatarFile?: File | null;
  faqs: FAQ[];
  channels: string[];
}

export interface ChatbotContext {
  id: string;
  chatbot_id: string;
  tipo: string;
  contenido: string;
  welcome_message: string;
  personality: string;
  general_context: string;
  communication_tone: string;
  main_purpose: string;
  key_points: string[] | any; // Updated to handle both string[] and JSON
  special_instructions: string;
  prompt_template: string;
  qa_examples?: QA[] | any; // Updated to handle both QA[] and JSON
  orden: number;
  created_at: string;
  updated_at: string;
}
