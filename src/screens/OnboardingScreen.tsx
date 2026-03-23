import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, AlertCircle, CheckSquare, BookOpen, Book, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { updateUserProfile } from '../services/firestore';

const OnboardingScreen: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleStartTrial = async () => {
    if (!user || !profile) return;
    setLoading(true);
    try {
      await updateUserProfile(user.uid, {
        ...profile,
        hasCompletedOnboarding: true
      });
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidiana text-pergaminho flex flex-col p-6">
      <div className="flex-1 max-w-md mx-auto w-full flex flex-col justify-center space-y-8">
        
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-20 h-20 bg-ouro/10 rounded-full flex items-center justify-center mx-auto"
          >
            <Shield size={40} className="text-ouro" />
          </motion.div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-ouro">Bem-vindo ao VIGILA</h1>
          <p className="text-sm text-pergaminho/60">Seu Guia de Bolso de Segurança Pessoal e Proteção.</p>
        </div>

        <div className="bg-ardosia border border-ouro/10 rounded-3xl p-6 space-y-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-ouro/80 text-center">Como funciona</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-xl bg-alerta/10 text-alerta flex items-center justify-center shrink-0">
                <AlertCircle size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest">SOS e Alarme</h3>
                <p className="text-[10px] text-pergaminho/50 mt-1">Acesso rápido a contatos de emergência e alarme sonoro para situações de risco.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-xl bg-ciano/10 text-ciano flex items-center justify-center shrink-0">
                <CheckSquare size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest">Checklist Básico</h3>
                <p className="text-[10px] text-pergaminho/50 mt-1">Crie listas de verificação manuais para sua segurança diária.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 opacity-60">
              <div className="w-8 h-8 rounded-xl bg-ouro/10 text-ouro flex items-center justify-center shrink-0 relative">
                <BookOpen size={16} />
                <Lock size={10} className="absolute -bottom-1 -right-1 text-ouro" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  Guia e Diário <span className="bg-ouro/20 text-ouro px-1.5 py-0.5 rounded text-[8px]">PRO</span>
                </h3>
                <p className="text-[10px] text-pergaminho/50 mt-1">Guias de sobrevivência, diário de incidentes e perfis personalizados.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4 bg-ouro/5 border border-ouro/20 p-6 rounded-3xl">
          <h3 className="text-sm font-black uppercase tracking-widest text-ouro">3 Dias de Teste Gratuito</h3>
          <p className="text-xs text-pergaminho/70 leading-relaxed">
            Você está recebendo <strong className="text-ouro">3 dias de acesso total</strong> com o perfil genérico para conhecer todas as funcionalidades.
          </p>
          <p className="text-[10px] text-pergaminho/40">
            Após esse período, as funções PRO serão bloqueadas, mas você continuará com acesso gratuito e vitalício ao SOS, Alarme e Checklist básico.
          </p>
        </div>

        <button
          onClick={handleStartTrial}
          disabled={loading}
          className="w-full bg-ouro hover:opacity-90 text-obsidiana font-black uppercase tracking-[0.2em] py-5 rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-xl shadow-ouro/10"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-obsidiana/20 border-t-obsidiana rounded-full animate-spin" />
          ) : (
            <>
              Começar Teste Gratuito
              <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

      </div>
    </div>
  );
};

export default OnboardingScreen;
