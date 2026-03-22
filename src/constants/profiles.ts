import { ProfileType, ChecklistItem, GuideContent } from '../types';

export const PROFILE_CHECKLIST_ITEMS: Record<ProfileType, Partial<ChecklistItem>[]> = {
  [ProfileType.GENERIC]: [
    { text: 'Verificar arredores ao sair de casa', order: 1 },
    { text: 'Manter celular carregado e com contatos de emergência', order: 2 },
    { text: 'Evitar ostentar objetos de valor em locais públicos', order: 3 },
  ],
  [ProfileType.SECURITY_AGENT]: [
    { text: 'Revisar protocolo de comunicação tática', order: 1 },
    { text: 'Verificar estado dos equipamentos de proteção individual', order: 2 },
    { text: 'Mapear rotas de fuga e pontos de apoio na área de atuação', order: 3 },
    { text: 'Realizar varredura visual de 360 graus constantemente', order: 4 },
  ],
  [ProfileType.TEACHER]: [
    { text: 'Identificar alunos com necessidades especiais de segurança', order: 1 },
    { text: 'Revisar plano de evacuação da sala de aula', order: 2 },
    { text: 'Manter lista de contatos dos pais atualizada', order: 3 },
    { text: 'Verificar trincas e fechaduras da sala', order: 4 },
  ],
  [ProfileType.NGO_VOLUNTEER]: [
    { text: 'Conhecer a liderança comunitária local', order: 1 },
    { text: 'Estabelecer rede de contatos de confiança na região', order: 2 },
    { text: 'Mapear áreas de risco dentro da comunidade', order: 3 },
    { text: 'Sempre informar base sobre localização e horário de saída', order: 4 },
  ],
  [ProfileType.HEALTH_PROFESSIONAL]: [
    { text: 'Garantir acesso rápido a saídas de emergência no plantão', order: 1 },
    { text: 'Protocolo de segurança para atendimento domiciliar', order: 2 },
    { text: 'Identificar sinais de agressividade em pacientes precocemente', order: 3 },
    { text: 'Manter objetos cortantes em locais seguros', order: 4 },
  ],
  [ProfileType.TOURIST]: [
    { text: 'Salvar localização do hotel no GPS offline', order: 1 },
    { text: 'Ter cópia digital dos documentos na nuvem', order: 2 },
    { text: 'Evitar usar o celular em esquinas ou locais isolados', order: 3 },
    { text: 'Conhecer o número de emergência local', order: 4 },
  ],
  [ProfileType.PUBLIC_FIGURE]: [
    { text: 'Revisar agenda pública com equipe de segurança', order: 1 },
    { text: 'Monitorar menções de risco em redes sociais', order: 2 },
    { text: 'Variar rotas e horários de deslocamento', order: 3 },
    { text: 'Verificar segurança do local de evento previamente', order: 4 },
  ],
};

export const PROFILE_GUIDE_CONTENT: Record<ProfileType, Partial<GuideContent>[]> = {
  [ProfileType.GENERIC]: [
    { section: 'Segurança', title: 'Segurança no Dia a Dia', content: 'Dicas fundamentais para manter a vigilância em ambientes urbanos comuns.', order: 1 },
  ],
  [ProfileType.SECURITY_AGENT]: [
    { section: 'Desastres e Emergências', title: 'Análise de Risco Operacional', content: 'Como identificar ameaças em potencial antes que se tornem incidentes reais.', order: 1 },
  ],
  [ProfileType.TEACHER]: [
    { section: 'Preparação', title: 'Segurança Escolar', content: 'Protocolos para garantir a integridade dos alunos e funcionários no ambiente educacional.', order: 1 },
  ],
  [ProfileType.NGO_VOLUNTEER]: [
    { section: 'Segurança', title: 'Atuação em Áreas Críticas', content: 'Estratégias de aproximação e permanência segura em comunidades vulneráveis.', order: 1 },
  ],
  [ProfileType.HEALTH_PROFESSIONAL]: [
    { section: 'Segurança', title: 'Segurança Hospitalar', content: 'Gerenciamento de conflitos e proteção pessoal em ambientes de saúde.', order: 1 },
  ],
  [ProfileType.TOURIST]: [
    { section: 'Preparação', title: 'Viajante Seguro', content: 'Como aproveitar sua viagem minimizando riscos de furtos e golpes.', order: 1 },
  ],
  [ProfileType.PUBLIC_FIGURE]: [
    { section: 'Desastres e Emergências', title: 'Gestão de Exposição', content: 'Técnicas para reduzir a vulnerabilidade causada pela alta visibilidade pública.', order: 1 },
  ],
};
