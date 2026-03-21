import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  getDocFromServer,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Contact, ChecklistItem, GuideContent, UserProfile, ProfileType } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    return null;
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, { ...data, uid }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function grantProAccessByEmail(email: string, duration: '7days' | '1year' | 'lifetime') {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error('Usuário não encontrado com este e-mail.');
    }
    const userDoc = snapshot.docs[0];
    
    const updateData: Partial<UserProfile> = {
      isPro: true
    };

    if (duration === 'lifetime') {
      updateData.proExpirationDate = undefined;
    } else {
      const expirationDate = new Date();
      if (duration === '7days') {
        expirationDate.setDate(expirationDate.getDate() + 7);
      } else if (duration === '1year') {
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      }
      updateData.proExpirationDate = expirationDate.toISOString();
    }
    
    await updateDoc(userDoc.ref, updateData);
  } catch (err: any) {
    if (err.message === 'Usuário não encontrado com este e-mail.') {
      // If user not found, create a pending grant
      try {
        const expirationDate = duration === 'lifetime' ? null : (() => {
          const d = new Date();
          if (duration === '7days') d.setDate(d.getDate() + 7);
          else if (duration === '1year') d.setFullYear(d.getFullYear() + 1);
          return d.toISOString();
        })();

        await setDoc(doc(db, 'pending_pro_grants', email), {
          email,
          duration,
          proExpirationDate: expirationDate,
          grantedAt: new Date().toISOString()
        });
        return; // Success
      } catch (pendingErr) {
        handleFirestoreError(pendingErr, OperationType.WRITE, `pending_pro_grants/${email}`);
      }
    }
    handleFirestoreError(err, OperationType.UPDATE, `users_by_email/${email}`);
  }
}

export async function checkPendingProGrant(email: string): Promise<{ isPro: boolean, proExpirationDate?: string } | null> {
  try {
    const docRef = doc(db, 'pending_pro_grants', email);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Delete the pending grant after retrieving it
      await deleteDoc(docRef);
      return {
        isPro: true,
        proExpirationDate: data.proExpirationDate
      };
    }
    return null;
  } catch (err) {
    console.error("Error checking pending pro grant:", err);
    return null;
  }
}

// Data seeding for guides (only for dev/admin)
export async function seedGuides() {
  console.log("Iniciando semeadura de guias...");
  const guides: Omit<GuideContent, 'id'>[] = [
    // Generic
    { section: 'Planejamento', title: 'Avaliação de Risco', content: 'Identifique áreas perigosas e planeje sua rota com antecedência.', order: 1, profile: ProfileType.GENERIC },
    { section: 'Planejamento', title: 'Comunicação', content: 'Sempre informe alguém de confiança sobre seu paradeiro.', order: 2, profile: ProfileType.GENERIC },
    { section: 'Prevenção', title: 'Consciência Situacional', content: 'Mantenha-se atento ao ambiente. Evite distrações com o celular.', order: 3, profile: ProfileType.GENERIC },
    { section: 'Prevenção', title: 'Linguagem Corporal', content: 'Caminhe com confiança e mantenha contato visual breve.', order: 4, profile: ProfileType.GENERIC },
    { section: 'Análise', title: 'Pós-Incidente', content: 'Se algo acontecer, procure um local seguro e reporte às autoridades.', order: 5, profile: ProfileType.GENERIC },
    
    // Security Agent
    { section: 'Análise', title: 'Análise de Risco Operacional', content: 'Como identificar ameaças em potencial antes que se tornem incidentes reais. Observe padrões de comportamento e anomalias no ambiente.', order: 1, profile: ProfileType.SECURITY_AGENT },
    { section: 'Prevenção', title: 'Postura Tática', content: 'Mantenha sempre as mãos livres e os olhos no horizonte. Evite pontos cegos.', order: 2, profile: ProfileType.SECURITY_AGENT },
    
    // Teacher
    { section: 'Planejamento', title: 'Segurança Escolar', content: 'Protocolos para garantir a integridade dos alunos e funcionários no ambiente educacional. Conheça as rotas de evacuação.', order: 1, profile: ProfileType.TEACHER },
    { section: 'Prevenção', title: 'Gestão de Crise em Sala', content: 'Como agir em situações de pânico ou intrusão. Mantenha a calma para guiar os alunos.', order: 2, profile: ProfileType.TEACHER },
    
    // NGO Volunteer
    { section: 'Prevenção', title: 'Atuação em Áreas Críticas', content: 'Estratégias de aproximação e permanência segura em comunidades vulneráveis. Respeite as lideranças locais.', order: 1, profile: ProfileType.NGO_VOLUNTEER },
    { section: 'Planejamento', title: 'Rede de Apoio Local', content: 'Identifique pontos seguros e pessoas de confiança na região de atuação.', order: 2, profile: ProfileType.NGO_VOLUNTEER },
    
    // Health Professional
    { section: 'Prevenção', title: 'Segurança Hospitalar', content: 'Gerenciamento de conflitos e proteção pessoal em ambientes de saúde. Identifique sinais de agressividade.', order: 1, profile: ProfileType.HEALTH_PROFESSIONAL },
    { section: 'Análise', title: 'Biossegurança e Proteção', content: 'Mantenha protocolos rígidos de segurança física e biológica durante o atendimento.', order: 2, profile: ProfileType.HEALTH_PROFESSIONAL },
    
    // Tourist
    { section: 'Planejamento', title: 'Viajante Seguro', content: 'Como aproveitar sua viagem minimizando riscos de furtos e golpes. Use doleiras e evite mapas físicos em público.', order: 1, profile: ProfileType.TOURIST },
    { section: 'Prevenção', title: 'Segurança em Transportes', content: 'Dicas para usar táxis, aplicativos e transporte público em cidades desconhecidas.', order: 2, profile: ProfileType.TOURIST },
    
    // Public Figure
    { section: 'Análise', title: 'Gestão de Exposição', content: 'Técnicas para reduzir a vulnerabilidade causada pela alta visibilidade pública. Monitore sua pegada digital.', order: 1, profile: ProfileType.PUBLIC_FIGURE },
    { section: 'Planejamento', title: 'Logística de Deslocamento', content: 'Varie rotas e horários. Tenha sempre um plano de contingência para eventos públicos.', order: 2, profile: ProfileType.PUBLIC_FIGURE },
  ];

  try {
    const q = query(collection(db, 'guides'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log("Coleção de guias vazia. Semeando...");
      for (const guide of guides) {
        await addDoc(collection(db, 'guides'), guide);
      }
      console.log("Semeadura de guias concluída.");
    } else {
      console.log("Guias já existem. Verificando perfis faltantes...");
      const existingProfiles = new Set(snapshot.docs.map(d => d.data().profile));
      for (const guide of guides) {
        if (!existingProfiles.has(guide.profile)) {
          await addDoc(collection(db, 'guides'), guide);
        }
      }
    }
  } catch (err) {
    console.error("Erro ao semear guias:", err);
  }
}

export async function seedOfficialContacts() {
  console.log("Iniciando semeadura de contatos oficiais...");
  const officialContacts: Omit<Contact, 'id'>[] = [
    { type: 'Polícia', name: 'Polícia Militar', phone: '190', isOfficial: true, location: 'Brasil' },
    { type: 'Hospital', name: 'SAMU', phone: '192', isOfficial: true, location: 'Brasil' },
    { type: 'Polícia', name: 'Bombeiros', phone: '193', isOfficial: true, location: 'Brasil' },
  ];

  try {
    const q = query(collection(db, 'contacts'), where('isOfficial', '==', true));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log("Contatos oficiais não encontrados. Semeando...");
      for (const contact of officialContacts) {
        await addDoc(collection(db, 'contacts'), contact);
      }
      console.log("Semeadura de contatos oficiais concluída.");
    } else {
      console.log("Contatos oficiais já existem.");
    }
  } catch (err) {
    console.error("Erro ao semear contatos oficiais:", err);
  }
}
