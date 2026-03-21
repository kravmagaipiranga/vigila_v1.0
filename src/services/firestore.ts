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
      updateData.proExpirationDate = null;
      updateData.planType = 'vitalício';
    } else {
      const expirationDate = new Date();
      if (duration === '7days') {
        expirationDate.setDate(expirationDate.getDate() + 7);
        updateData.planType = '7 dias';
      } else if (duration === '1year') {
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        updateData.planType = '1 ano';
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

        const planType = duration === '7days' ? '7 dias' : (duration === '1year' ? '1 ano' : 'vitalício');

        await setDoc(doc(db, 'pending_pro_grants', email), {
          email,
          duration,
          planType,
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

export async function checkPendingProGrant(email: string): Promise<{ isPro: boolean, proExpirationDate: string | null, planType: '7 dias' | '1 ano' | 'vitalício' } | null> {
  try {
    const docRef = doc(db, 'pending_pro_grants', email);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Delete the pending grant after retrieving it
      await deleteDoc(docRef);
      return {
        isPro: true,
        proExpirationDate: data.proExpirationDate,
        planType: data.planType
      };
    }
    return null;
  } catch (err) {
    console.error("Error checking pending pro grant:", err);
    return null;
  }
}

// Data seeding for guides (only for dev/admin)
export async function seedGuides(force = false) {
  const CURRENT_GUIDE_VERSION = '20260321_ufmg_dsu_v1';
  
  try {
    const versionRef = doc(db, 'settings', 'guide_version');
    const versionSnap = await getDoc(versionRef);
    const existingVersion = versionSnap.exists() ? versionSnap.data().version : null;

    if (!force && existingVersion === CURRENT_GUIDE_VERSION) {
      console.log("Guias já estão na versão mais recente.");
      return;
    }

    console.log("Iniciando atualização de guias para a versão:", CURRENT_GUIDE_VERSION);
    
    const guides: Omit<GuideContent, 'id'>[] = [
      // FUNDAMENTOS (Based on OffGridWeb Prepping 101)
      { 
        section: 'Planejamento', 
        title: 'Fundamentos da Preparação (Prepping 101)', 
        content: `A preparação não é sobre medo, mas sobre resiliência e autonomia.

### O que é Prepping?
É o ato de se preparar antecipadamente para emergências, desde interrupções curtas de energia até desastres naturais de grande escala.

### A Regra dos Três (Prioridades):
* **3 Minutos** sem ar (ou em sangramento severo).
* **3 Horas** sem abrigo em condições extremas.
* **3 Dias** sem água.
* **3 Semanas** sem comida.

**Dica:** Foque primeiro no que te mata mais rápido. Comece pela água e abrigo antes de estocar comida para um ano.`, 
        order: 1, 
        profile: ProfileType.GENERIC 
      },
      { 
        section: 'Planejamento', 
        title: 'Kits de Emergência: EDC, GHB e BOB', 
        content: `Diferentes situações exigem diferentes níveis de equipamento.

### 1. EDC (Everyday Carry)
O que você carrega nos bolsos diariamente. 
* Itens: Canivete, lanterna pequena, isqueiro, apito, celular carregado.

### 2. GHB (Get Home Bag)
Mochila mantida no carro ou trabalho para te ajudar a voltar para casa.
* Foco: Calçados confortáveis, água, lanches, mapa físico, kit de primeiros socorros.

### 3. BOB (Bug Out Bag)
Mochila de 72 horas para evacuação imediata.
* Foco: Abrigo portátil, filtragem de água, rações, documentos e higiene.`, 
        order: 2, 
        profile: ProfileType.GENERIC 
      },

      // DESASTRES NATURAIS (Based on Ready.gov)
      { 
        section: 'Prevenção', 
        title: 'Inundações e Enchentes', 
        content: `As enchentes são o desastre natural mais comum.

### Antes:
* Conheça o risco de inundação da sua área.
* Eleve aparelhos elétricos e documentos.
* Prepare um kit de evacuação.

### Durante:
* **"Turn Around, Don't Drown!"** (Dê a volta, não se afogue). Nunca dirija ou ande em águas de enchente. 
* Apenas 15cm de água em movimento podem derrubar um adulto. 30cm podem arrastar a maioria dos carros.

### Depois:
* Evite contato com a água (pode estar contaminada ou eletrificada).`, 
        order: 3, 
        profile: ProfileType.GENERIC 
      },
      { 
        section: 'Prevenção', 
        title: 'Incêndios Florestais e Urbanos', 
        content: `Incêndios podem se espalhar com velocidade extrema.

### Preparação:
* Crie um "espaço defensável" ao redor de sua casa (remova vegetação seca).
* Tenha máscaras N95 para proteção contra fumaça.
* Conheça pelo menos duas rotas de saída da sua vizinhança.

### Se for evacuar:
* Feche todas as janelas e portas para reduzir correntes de ar.
* Deixe as luzes acesas para que os bombeiros vejam a casa na fumaça.`, 
        order: 4, 
        profile: ProfileType.GENERIC 
      },
      { 
        section: 'Prevenção', 
        title: 'Terremotos e Desabamentos', 
        content: `Terremotos ocorrem sem aviso prévio.

### Durante o tremor:
* **BAIXE, CUBRA E SEGURE:**
  1. **Baixe-se** de joelhos.
  2. **Cubra** sua cabeça e pescoço sob uma mesa resistente.
  3. **Segure-se** até que o tremor pare.

### Se estiver na rua:
* Afaste-se de prédios, postes e árvores.

### Se estiver no carro:
* Pare em local seguro, longe de pontes ou viadutos, e permaneça dentro do veículo.`, 
        order: 5, 
        profile: ProfileType.GENERIC 
      },

      // SEGURANÇA NO CAMPUS (Based on UFMG DSU)
      { 
        section: 'Prevenção', 
        title: 'Segurança no Campus e Áreas Públicas', 
        content: `Dicas essenciais para o dia a dia em ambientes universitários e urbanos.

### Ao Caminhar:
* Evite locais desertos ou mal iluminados.
* Procure andar em grupos, especialmente à noite.
* Não ostente objetos de valor (celulares, notebooks, joias).
* Mantenha a atenção ao que acontece ao seu redor (evite distrações excessivas com o celular).

### No Estacionamento:
* Não deixe objetos de valor visíveis no interior do veículo.
* Verifique se as portas e janelas estão devidamente fechadas.
* Ao entrar ou sair do veículo, observe se há pessoas suspeitas por perto.

### Em Salas e Laboratórios:
* Não deixe bolsas, mochilas ou equipamentos sozinhos.
* Ao sair da sala, mesmo que por pouco tempo, certifique-se de que a porta esteja trancada.
* Mantenha chaves e cartões de acesso em local seguro.

### Em Caso de Ocorrência:
* Mantenha a calma e não reaja.
* Memorize as características do suspeito.
* Comunique imediatamente à segurança interna ou autoridades locais.`, 
        order: 6, 
        profile: ProfileType.GENERIC 
      },

      // OUTRAS EMERGÊNCIAS (Based on Ready.gov)
      { 
        section: 'Análise', 
        title: 'Ataques Cibernéticos e Falhas Tecnológicas', 
        content: `A dependência digital cria novas vulnerabilidades.

### Proteção:
* **Backups Offline:** Mantenha cópias de documentos e fotos em HDs externos não conectados à rede.
* **Dinheiro em Espécie:** Em caso de queda do sistema bancário ou energia, cartões não funcionarão.
* **Comunicação Analógica:** Tenha um rádio AM/FM a pilhas para ouvir notícias oficiais.

### Segurança de Dados:
* Use autenticação de dois fatores (2FA).
* Desconfie de links e arquivos não solicitados durante crises.`, 
        order: 7, 
        profile: ProfileType.GENERIC 
      },
      { 
        section: 'Análise', 
        title: 'Emergências Químicas e Biológicas', 
        content: `Ameaças invisíveis exigem protocolos rigorosos.

### Abrigo no Local (Shelter-in-Place):
1. Entre em um cômodo interno com poucas janelas.
2. Desligue ventiladores e ar-condicionado.
3. Vede frestas de portas e janelas com fita adesiva e plástico.

### Descontaminação Básica:
* Remova as roupas externas (isso elimina até 80% da contaminação).
* Lave-se com água e sabão neutro, sem esfregar a pele com força.`, 
        order: 8, 
        profile: ProfileType.GENERIC 
      },

      // PERFIS ESPECÍFICOS
      { 
        section: 'Planejamento', 
        title: 'Protocolos para Agentes de Segurança', 
        content: `Gerenciamento de multidões e proteção de perímetros em crises.
      
* **Triagem de Riscos:** Identifique líderes de distúrbios e pontos de estrangulamento.
* **Comunicação de Crise:** Use linguagem clara e comandos diretos para evitar pânico.
* **Equipamento:** Verifique a integridade de EPIs e suprimentos médicos táticos (IFAK).`, 
        order: 9, 
        profile: ProfileType.SECURITY_AGENT 
      },
      { 
        section: 'Prevenção', 
        title: 'Segurança Escolar e Comunitária', 
        content: `Proteção de grupos vulneráveis em emergências.
      
* **Cadeia de Custódia:** Protocolos rigorosos para liberação de alunos em desastres.
* **Primeiros Socorros Psicológicos:** Técnicas para acalmar crianças e idosos durante o evento.
* **Inventário de Recursos:** Saiba quem na comunidade possui habilidades médicas, ferramentas ou veículos pesados.`, 
        order: 10, 
        profile: ProfileType.TEACHER 
      }
    ];

    const q = query(collection(db, 'guides'));
    const snapshot = await getDocs(q);
    
    // If version is different, clear and re-seed
    if (snapshot.size > 0) {
      console.log("Limpando guias antigos...");
      for (const d of snapshot.docs) {
        await deleteDoc(d.ref);
      }
    }

    console.log("Semeando novos guias...");
    for (const guide of guides) {
      await addDoc(collection(db, 'guides'), guide);
    }
    
    // Update version
    await setDoc(doc(db, 'settings', 'guide_version'), { version: CURRENT_GUIDE_VERSION });
    console.log("Semeadura de guias concluída.");
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
