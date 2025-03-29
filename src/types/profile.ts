
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string | null;
  empresa_id?: string;
  companyId?: string; // Alias for empresa_id
  is_active?: boolean;
  role?: 'admin' | 'admin_empresa' | 'agente';
  last_sign_in?: string | null;
  onboarding_step?: string;
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
  name?: string; // Alias for full_name
  avatarUrl?: string; // Alias for avatar_url
}
