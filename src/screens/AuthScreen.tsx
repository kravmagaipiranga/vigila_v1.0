import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Shield, Mail, Lock, Chrome, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Insira seu email para redefinir a senha.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Email de redefinição enviado!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-obsidiana flex flex-col items-center justify-center p-6 text-pergaminho">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm space-y-10"
      >
        <div className="text-center space-y-6">
          <img 
            src="https://raw.githubusercontent.com/kravmagaipiranga/vigila/5913bbe85976c4203320be5cf9ec67c3613c752e/Logo.png" 
            alt="VIGILA Logo" 
            className="w-48 h-auto mx-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <p className="text-pergaminho/40 text-[10px] font-black uppercase tracking-[0.3em]">
            Segurança Pessoal Estratégica
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-ouro/40 group-focus-within:text-ouro transition-colors" size={18} />
              <input
                type="email"
                placeholder="Email corporativo ou pessoal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-ardosia border border-ouro/10 rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:border-ouro/40 transition-colors text-sm text-pergaminho placeholder:text-pergaminho/20"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-ouro/40 group-focus-within:text-ouro transition-colors" size={18} />
              <input
                type="password"
                placeholder="Sua senha de acesso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-ardosia border border-ouro/10 rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:border-ouro/40 transition-colors text-sm text-pergaminho placeholder:text-pergaminho/20"
                required
              />
            </div>
          </div>

          {error && <p className="text-alerta text-[10px] font-black uppercase tracking-widest text-center bg-alerta/10 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ouro hover:opacity-90 text-obsidiana font-black uppercase tracking-[0.2em] py-5 rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-xl shadow-ouro/10"
          >
            {loading ? 'Processando...' : (isLogin ? 'Acessar Sistema' : 'Criar Credenciais')}
            <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="space-y-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ouro/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
              <span className="bg-obsidiana px-4 text-pergaminho/20">Acesso Rápido</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-ardosia border border-ouro/20 text-pergaminho font-black uppercase tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-ouro hover:text-obsidiana transition-all group"
          >
            <Chrome size={20} className="group-hover:scale-110 transition-transform" />
            Google Workspace
          </button>
        </div>

        <div className="text-center space-y-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-pergaminho/40 text-[10px] font-black uppercase tracking-widest hover:text-ouro transition-colors"
          >
            {isLogin ? 'Não possui credenciais? Solicite acesso' : 'Já possui credenciais? Entre aqui'}
          </button>
          {isLogin && (
            <div>
              <button
                onClick={handleResetPassword}
                className="text-ouro/40 text-[10px] font-black uppercase tracking-widest hover:text-ouro transition-colors"
              >
                Recuperar Senha
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
