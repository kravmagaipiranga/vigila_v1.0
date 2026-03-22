import React, { useState } from 'react';
import { auth } from '../firebase';
import { updateProfile, updateEmail } from 'firebase/auth';
import { useAuth } from '../AuthContext';
import { 
  User, 
  Lock, 
  Info, 
  FileText, 
  MessageSquare, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Heart,
  Stethoscope,
  Plane,
  Star,
  UserCircle,
  X,
  Check,
  Camera,
  Watch,
  BookOpen,
  Smartphone,
  Mic,
  UserPlus,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProfileType } from '../types';
import { 
  updateUserProfile, 
  grantProAccessByEmail, 
  seedGuides, 
  seedOfficialContacts 
} from '../services/firestore';

const SettingsScreen: React.FC = () => {
  const { user, profile } = useAuth();
  const isAdmin = user?.email === 'kravmagaipiranga@gmail.com';
  const isPro = isAdmin || (profile?.isPro && (!profile.proExpirationDate || new Date(profile.proExpirationDate) > new Date()));
  
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  // Admin states
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [isAdminSaving, setIsAdminSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  
  // Edit profile states
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profiles = [
    { type: ProfileType.GENERIC, icon: UserCircle, color: 'bg-zinc-500' },
    { type: ProfileType.SECURITY_AGENT, icon: Briefcase, color: 'bg-blue-600' },
    { type: ProfileType.TEACHER, icon: GraduationCap, color: 'bg-emerald-600' },
    { type: ProfileType.NGO_VOLUNTEER, icon: Heart, color: 'bg-rose-600' },
    { type: ProfileType.HEALTH_PROFESSIONAL, icon: Stethoscope, color: 'bg-cyan-600' },
    { type: ProfileType.TOURIST, icon: Plane, color: 'bg-amber-600' },
    { type: ProfileType.PUBLIC_FIGURE, icon: Star, color: 'bg-purple-600' },
  ];

  const handleProfileSelect = async (type: ProfileType) => {
    if (!user) return;
    if (type !== ProfileType.GENERIC && !isPro) {
      alert('A escolha de perfis específicos é uma funcionalidade exclusiva do VIGILA PRO.');
      return;
    }
    
    try {
      await updateUserProfile(user.uid, { profileType: type });
      setIsProfileDropdownOpen(false);
    } catch (err) {
      console.error("Error updating profile type:", err);
      alert("Erro ao atualizar o perfil. Verifique sua conexão.");
    }
  };

  const handlePurchasePro = async (plan: '7days' | '1year' | 'lifetime' = 'lifetime') => {
    if (!user) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          plan
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar preferência de pagamento');
      }

      const { init_point } = await response.json();
      
      // Redirect to Mercado Pago
      window.location.href = init_point;
    } catch (err) {
      console.error("Error purchasing pro:", err);
      alert("Erro ao processar a compra. Tente novamente mais tarde.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGrantPro = async (duration: '7days' | '1year' | 'lifetime') => {
    if (!adminEmailInput) return;
    setIsAdminSaving(true);
    setAdminError(null);
    setAdminSuccess(null);
    try {
      await grantProAccessByEmail(adminEmailInput, duration);
      const durationText = duration === '7days' ? 'por 7 dias' : duration === '1year' ? 'por 1 ano' : 'vitalício';
      setAdminSuccess(`Acesso PRO ${durationText} concedido para ${adminEmailInput}.`);
      setAdminEmailInput('');
    } catch (err: any) {
      console.error("Error granting pro:", err);
      setAdminError(err.message || "Erro ao conceder acesso PRO.");
    } finally {
      setIsAdminSaving(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setAdminError(null);
    setAdminSuccess(null);
    try {
      await seedGuides();
      await seedOfficialContacts();
      setAdminSuccess("Conteúdo e contatos oficiais sincronizados com sucesso!");
    } catch (err: any) {
      console.error("Error syncing content:", err);
      setAdminError("Erro ao sincronizar conteúdo.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    setError(null);
    try {
      // Update Auth Profile
      await updateProfile(auth.currentUser, {
        displayName: editName
      });

      // Update Email if changed
      if (editEmail !== auth.currentUser.email) {
        try {
          await updateEmail(auth.currentUser, editEmail);
        } catch (emailErr: any) {
          console.error("Error updating email:", emailErr);
          if (emailErr.code === 'auth/requires-recent-login') {
             setError("Para alterar o e-mail, você precisa fazer login novamente recentemente.");
             setIsSaving(false);
             return;
          } else {
             setError("Não foi possível alterar o e-mail. Alguns provedores (como Google) podem restringir esta ação.");
             // We continue anyway to update other fields if email fails
          }
        }
      }

      // Update Firestore
      await updateUserProfile(auth.currentUser.uid, {
        displayName: editName,
        email: editEmail
      });

      setIsEditProfileOpen(false);
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError("Ocorreu um erro ao salvar as alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  const getRemainingTime = () => {
    if (!profile?.proExpirationDate) return null;
    const now = new Date();
    const expiry = new Date(profile.proExpirationDate);
    const diffTime = expiry.getTime() - now.getTime();
    if (diffTime <= 0) return null;

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    } else {
      const diffMonths = Math.floor(diffDays / 30);
      if (diffMonths >= 1) {
        const remainingDays = diffDays % 30;
        return `${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'}${remainingDays > 0 ? ` e ${remainingDays} d` : ''}`;
      }
      return `${diffDays} dias`;
    }
  };

  const currentPlan = isAdmin ? 'Vitalício (Admin)' : (profile?.planType || 'Gratuito');
  const remainingTime = getRemainingTime();

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-ouro/60 text-[10px] font-black uppercase tracking-[0.2em]">Preferências</h2>
        <h1 className="text-3xl font-black tracking-tighter italic text-pergaminho">CONFIGURAÇÕES</h1>
      </div>

      {/* VIGILA Premium Banner */}
      {!isPro && (
        <div className="bg-gradient-to-br from-ciano/20 to-ciano/5 border border-ciano/30 rounded-[32px] p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Star size={80} className="text-ciano" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2">
              <div className="bg-ciano text-obsidiana px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Planos Flexíveis</div>
              <h3 className="text-lg font-black italic tracking-tighter text-pergaminho uppercase">VIGILA PRO</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-obsidiana/40 border border-ciano/20 rounded-2xl p-4 flex flex-col justify-between gap-4">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-ciano">7 Dias</h4>
                  <p className="text-xl font-black text-pergaminho italic tracking-tighter">R$ 9,90</p>
                  <p className="text-[8px] text-pergaminho/40 font-bold uppercase mt-1">Acesso temporário</p>
                </div>
                <button 
                  onClick={() => handlePurchasePro('7days')}
                  disabled={isSaving}
                  className="w-full bg-ciano/10 border border-ciano/30 text-ciano py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-ciano hover:text-obsidiana transition-all disabled:opacity-50"
                >
                  Selecionar
                </button>
              </div>

              <div className="bg-obsidiana/40 border border-ouro/40 rounded-2xl p-4 flex flex-col justify-between gap-4 relative">
                <div className="absolute -top-2 -right-2 bg-ouro text-obsidiana px-2 py-0.5 rounded text-[6px] font-black uppercase tracking-widest">Popular</div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-ouro">1 Ano</h4>
                  <p className="text-xl font-black text-pergaminho italic tracking-tighter">R$ 29,90</p>
                  <p className="text-[8px] text-pergaminho/40 font-bold uppercase mt-1">Custo-benefício</p>
                </div>
                <button 
                  onClick={() => handlePurchasePro('1year')}
                  disabled={isSaving}
                  className="w-full bg-ouro text-obsidiana py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
                >
                  Selecionar
                </button>
              </div>

              <div className="bg-obsidiana/40 border border-ciano/20 rounded-2xl p-4 flex flex-col justify-between gap-4">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-ciano">Vitalício</h4>
                  <p className="text-xl font-black text-pergaminho italic tracking-tighter">R$ 49,90</p>
                  <p className="text-[8px] text-pergaminho/40 font-bold uppercase mt-1">Para sempre</p>
                </div>
                <button 
                  onClick={() => handlePurchasePro('lifetime')}
                  disabled={isSaving}
                  className="w-full bg-ciano/10 border border-ciano/30 text-ciano py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-ciano hover:text-obsidiana transition-all disabled:opacity-50"
                >
                  Selecionar
                </button>
              </div>
            </div>

            <p className="text-pergaminho/40 text-[8px] font-bold uppercase tracking-widest text-center">
              Pagamento seguro via Mercado Pago
            </p>
          </div>
        </div>
      )}

      {/* User Profile Card */}
      <div className="bg-ardosia border border-ouro/20 rounded-[40px] p-8 text-pergaminho shadow-2xl shadow-ouro/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <ShieldCheck size={120} className="text-ouro" />
        </div>
        <div className="flex flex-col gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-obsidiana rounded-3xl border border-ouro/20 flex items-center justify-center overflow-hidden">
              <User size={40} className="text-ouro/40" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black tracking-tighter italic uppercase leading-none text-ouro">
                {user?.displayName || 'Usuário Vigila'}
              </h3>
              <p className="text-pergaminho/40 text-xs font-medium">{user?.email}</p>
              <div className="inline-flex items-center gap-1 bg-ouro/10 text-ouro px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest mt-2">
                {profile?.profileType || 'Perfil Genérico'}
              </div>
            </div>
          </div>

          {/* Plan Info */}
          <div className="pt-6 border-t border-ouro/10 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[8px] font-black uppercase tracking-widest text-pergaminho/40">Plano Atual</p>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black italic uppercase tracking-tighter ${isPro ? 'text-ciano' : 'text-pergaminho'}`}>
                  {currentPlan}
                </span>
                {isPro && <ShieldCheck size={12} className="text-ciano" />}
              </div>
            </div>
            {remainingTime && (
              <div className="text-right space-y-1">
                <p className="text-[8px] font-black uppercase tracking-widest text-pergaminho/40">Tempo Restante</p>
                <p className="text-xs font-black italic uppercase tracking-tighter text-ouro">
                  {remainingTime}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="space-y-6">
        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-pergaminho/20 ml-1">Conta</h4>
          <div className="bg-ardosia border border-ouro/10 rounded-3xl overflow-hidden">
            {/* Profile Dropdown Item */}
            <div className="border-b border-ouro/5">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-obsidiana rounded-xl flex items-center justify-center text-ouro/40">
                    <UserCircle size={20} />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-bold tracking-tight text-pergaminho block">Escolher Perfil</span>
                    <span className="text-[10px] font-bold text-ouro uppercase tracking-widest">
                      {profile?.profileType || 'Não definido'}
                    </span>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isProfileDropdownOpen ? 90 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <ChevronRight size={18} className="text-pergaminho/20" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-obsidiana/50"
                  >
                    <div className="p-2 space-y-1">
                      {profiles.map((p) => {
                        const Icon = p.icon;
                        const isSelected = profile?.profileType === p.type;
                        const isLocked = p.type !== ProfileType.GENERIC && !isPro;
                        return (
                          <button
                            key={p.type}
                            onClick={() => handleProfileSelect(p.type)}
                            className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all ${
                              isSelected 
                                ? 'bg-ouro/10 border border-ouro/20' 
                                : isLocked ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 bg-ardosia rounded-lg flex items-center justify-center text-ouro shadow-sm`}>
                                <Icon size={16} />
                              </div>
                              <span className={`text-xs font-bold tracking-tight ${isSelected ? 'text-ouro' : 'text-pergaminho/40'}`}>
                                {p.type}
                              </span>
                            </div>
                            {isSelected ? (
                              <Check size={14} className="text-ouro" strokeWidth={4} />
                            ) : isLocked ? (
                              <Lock size={14} className="text-pergaminho/20" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setIsEditProfileOpen(!isEditProfileOpen)}
              className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-ouro/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-obsidiana rounded-xl flex items-center justify-center text-pergaminho/20">
                  <User size={20} />
                </div>
                <span className="text-sm font-bold tracking-tight text-pergaminho">Editar Perfil</span>
              </div>
              <motion.div
                animate={{ rotate: isEditProfileOpen ? 90 : 0 }}
              >
                <ChevronRight size={18} className="text-pergaminho/20" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isEditProfileOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-obsidiana/30 border-b border-ouro/5"
                >
                  <div className="p-6 space-y-6">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-obsidiana rounded-3xl border border-ouro/10 flex items-center justify-center overflow-hidden">
                        <User size={32} className="text-pergaminho/20" />
                      </div>
                      <div className="w-full space-y-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-pergaminho/20 ml-1">Nome</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Seu nome"
                            className="w-full bg-obsidiana border border-ouro/10 rounded-xl py-3 px-4 text-xs font-bold text-pergaminho focus:outline-none focus:border-ouro transition-colors"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-pergaminho/20 ml-1">E-mail</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            placeholder="seu@email.com"
                            className="w-full bg-obsidiana border border-ouro/10 rounded-xl py-3 px-4 text-xs font-bold text-pergaminho focus:outline-none focus:border-ouro transition-colors"
                          />
                        </div>
                        {error && <p className="text-[10px] font-bold text-alerta text-center">{error}</p>}
                        <button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="w-full py-4 bg-ouro rounded-2xl text-obsidiana font-black uppercase tracking-widest text-[10px] italic hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-obsidiana rounded-xl flex items-center justify-center text-pergaminho/20">
                  <Lock size={20} />
                </div>
                <span className="text-sm font-bold tracking-tight text-pergaminho">Alterar Senha</span>
              </div>
              <ChevronRight size={18} className="text-pergaminho/20" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-pergaminho/20 ml-1">Segurança Avançada</h4>
          <div className="bg-ardosia border border-ouro/10 rounded-3xl overflow-hidden">
            <button 
              onClick={() => setIsGuideOpen(!isGuideOpen)}
              className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-ouro/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-obsidiana rounded-xl flex items-center justify-center text-ciano/60">
                  <BookOpen size={20} />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold tracking-tight text-pergaminho block">Guia de Uso</span>
                  <span className="text-[10px] font-bold text-ciano uppercase tracking-widest">Aprenda a se proteger</span>
                </div>
              </div>
              <motion.div
                animate={{ rotate: isGuideOpen ? 90 : 0 }}
              >
                <ChevronRight size={18} className="text-pergaminho/20" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isGuideOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-obsidiana/30 border-b border-ouro/5"
                >
                  <div className="p-6 space-y-6">
                    <section className="space-y-2">
                      <div className="flex items-center gap-2 text-alerta">
                        <ShieldCheck size={16} />
                        <h4 className="text-[10px] font-black italic uppercase tracking-tighter">SOS e Alerta</h4>
                      </div>
                      <p className="text-pergaminho/60 text-[10px] leading-relaxed">
                        O VIGILA envia imediatamente um link do Google Maps para seus contatos de emergência e inicia gravação de áudio.
                      </p>
                    </section>
                    <section className="space-y-2">
                      <div className="flex items-center gap-2 text-ouro">
                        <Smartphone size={16} />
                        <h4 className="text-[10px] font-black italic uppercase tracking-tighter">Alarme Sonoro</h4>
                      </div>
                      <p className="text-pergaminho/60 text-[10px] leading-relaxed">
                        Utilize o Alarme para chamar atenção em locais públicos ou dissuadir abordagens suspeitas.
                      </p>
                    </section>
                    <section className="space-y-2">
                      <div className="flex items-center gap-2 text-esmeralda">
                        <Check size={16} />
                        <h4 className="text-[10px] font-black italic uppercase tracking-tighter">Checklist</h4>
                      </div>
                      <p className="text-pergaminho/60 text-[10px] leading-relaxed">
                        Complete o checklist antes de sair para garantir que tomou todas as precauções.
                      </p>
                    </section>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-pergaminho/20 ml-1">Aplicativo</h4>
          <div className="bg-ardosia border border-ouro/10 rounded-3xl overflow-hidden">
            <button className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-ouro/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-obsidiana rounded-xl flex items-center justify-center text-pergaminho/20">
                  <Info size={20} />
                </div>
                <span className="text-sm font-bold tracking-tight text-pergaminho">Sobre o VIGILA</span>
              </div>
              <ChevronRight size={18} className="text-pergaminho/20" />
            </button>
            <button className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-ouro/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-obsidiana rounded-xl flex items-center justify-center text-pergaminho/20">
                  <FileText size={20} />
                </div>
                <span className="text-sm font-bold tracking-tight text-pergaminho">Termos e Privacidade</span>
              </div>
              <ChevronRight size={18} className="text-pergaminho/20" />
            </button>
            <button className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-obsidiana rounded-xl flex items-center justify-center text-pergaminho/20">
                  <MessageSquare size={20} />
                </div>
                <span className="text-sm font-bold tracking-tight text-pergaminho">Enviar Feedback</span>
              </div>
              <ChevronRight size={18} className="text-pergaminho/20" />
            </button>
          </div>
        </div>

        {/* Admin Section */}
        {user?.email === 'kravmagaipiranga@gmail.com' && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-alerta ml-1">Administração</h4>
            <div className="bg-ardosia border border-alerta/20 rounded-3xl overflow-hidden">
              <button 
                onClick={() => setIsAdminOpen(!isAdminOpen)}
                className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-obsidiana rounded-xl flex items-center justify-center text-alerta">
                    <ShieldAlert size={20} />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-bold tracking-tight text-pergaminho block">Gerenciar Acessos</span>
                    <span className="text-[10px] font-bold text-alerta uppercase tracking-widest">Painel Admin</span>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isAdminOpen ? 90 : 0 }}
                >
                  <ChevronRight size={18} className="text-pergaminho/20" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isAdminOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-obsidiana/30"
                  >
                    <div className="p-6 space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-pergaminho/20 ml-1">E-mail do Usuário/Empresa</label>
                        <div className="relative">
                          <UserPlus size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-pergaminho/20" />
                          <input
                            type="email"
                            value={adminEmailInput}
                            onChange={(e) => setAdminEmailInput(e.target.value)}
                            placeholder="usuario@email.com"
                            className="w-full bg-obsidiana border border-ouro/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold tracking-tight text-pergaminho focus:outline-none focus:border-ouro transition-colors"
                          />
                        </div>
                      </div>

                      {adminError && (
                        <p className="text-[10px] font-bold text-alerta text-center">{adminError}</p>
                      )}
                      {adminSuccess && (
                        <p className="text-[10px] font-bold text-esmeralda text-center">{adminSuccess}</p>
                      )}

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleGrantPro('7days')}
                          disabled={isAdminSaving || !adminEmailInput}
                          className="w-full p-4 bg-esmeralda/20 border border-esmeralda/30 rounded-2xl text-esmeralda font-black uppercase tracking-widest text-[10px] italic hover:bg-esmeralda/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isAdminSaving ? (
                            <>
                              <div className="w-4 h-4 border-2 border-esmeralda/30 border-t-esmeralda rounded-full animate-spin" />
                              Processando...
                            </>
                          ) : (
                            'Conceder 7 Dias PRO'
                          )}
                        </button>
                        <button
                          onClick={() => handleGrantPro('1year')}
                          disabled={isAdminSaving || !adminEmailInput}
                          className="w-full p-4 bg-alerta rounded-2xl text-pergaminho font-black uppercase tracking-widest text-[10px] italic hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isAdminSaving ? (
                            <>
                              <div className="w-4 h-4 border-2 border-pergaminho/30 border-t-pergaminho rounded-full animate-spin" />
                              Processando...
                            </>
                          ) : (
                            'Conceder 1 Ano PRO'
                          )}
                        </button>
                        <button
                          onClick={() => handleGrantPro('lifetime')}
                          disabled={isAdminSaving || !adminEmailInput}
                          className="w-full p-4 bg-ouro rounded-2xl text-obsidiana font-black uppercase tracking-widest text-[10px] italic hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isAdminSaving ? (
                            <>
                              <div className="w-4 h-4 border-2 border-obsidiana/30 border-t-obsidiana rounded-full animate-spin" />
                              Processando...
                            </>
                          ) : (
                            'Conceder Acesso Vitalício'
                          )}
                        </button>

                        <div className="pt-4 border-t border-white/5">
                          <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="w-full p-4 bg-ciano/10 border border-ciano/30 rounded-2xl text-ciano font-black uppercase tracking-widest text-[10px] italic hover:bg-ciano/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isSyncing ? (
                              <>
                                <div className="w-4 h-4 border-2 border-ciano/30 border-t-ciano rounded-full animate-spin" />
                                Sincronizando...
                              </>
                            ) : (
                              <>
                                <Smartphone size={14} />
                                Sincronizar Conteúdo e Contatos
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <button
          onClick={() => auth.signOut()}
          className="w-full p-5 bg-alerta/10 border border-alerta/20 rounded-3xl flex items-center justify-center gap-3 text-alerta font-bold hover:bg-alerta/20 transition-all mt-4"
        >
          <LogOut size={20} />
          Sair da Conta
        </button>
      </div>

      <div className="text-center pt-4">
        <p className="text-[10px] font-bold text-pergaminho/20 uppercase tracking-widest">VIGILA v1.0.0</p>
      </div>

    </div>
  );
};

export default SettingsScreen;
