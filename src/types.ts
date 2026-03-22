export type Section = 'Desastres e Emergências' | 'Preparação' | 'Segurança';
export type ContactType = 'Polícia' | 'Hospital' | 'Advogado' | 'Outro';

export enum ProfileType {
  GENERIC = 'Perfil Genérico',
  SECURITY_AGENT = 'Agente de Segurança',
  TEACHER = 'Professor',
  NGO_VOLUNTEER = 'Voluntário em ONG',
  HEALTH_PROFESSIONAL = 'Profissional da Saúde',
  TOURIST = 'Turista',
  PUBLIC_FIGURE = 'Figura Pública'
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: string;
  profileType?: ProfileType;
  isPro?: boolean;
  proExpirationDate?: string | null;
  planType?: 'gratuito' | '7 dias' | '1 ano' | 'vitalício';
  role?: 'admin' | 'user';
}

export interface Contact {
  id: string;
  userId?: string;
  type: ContactType;
  name: string;
  phone: string;
  email?: string;
  isOfficial: boolean;
  location?: string;
}

export interface ChecklistItem {
  id: string;
  userId: string;
  text: string;
  completed: boolean;
  isDefault: boolean;
  order: number;
  profile?: ProfileType;
}

export interface GuideContent {
  id: string;
  section: Section;
  title: string;
  content: string;
  order: number;
  profile?: ProfileType;
}
