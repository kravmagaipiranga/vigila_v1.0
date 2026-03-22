/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AlertTriangle, ChevronRight, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import { seedGuides, seedOfficialContacts } from './services/firestore';

// Lazy load screens for better performance
const AuthScreen = lazy(() => import('./screens/AuthScreen'));
const HomeScreen = lazy(() => import('./screens/HomeScreen'));
const GuideScreen = lazy(() => import('./screens/GuideScreen'));
const ContactsScreen = lazy(() => import('./screens/ContactsScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));
const ChecklistScreen = lazy(() => import('./screens/ChecklistScreen'));
const RisksScreen = lazy(() => import('./screens/RisksScreen'));
const JournalScreen = lazy(() => import('./screens/JournalScreen'));

const LoadingScreen = () => (
  <div className="min-h-screen bg-obsidiana flex flex-col items-center justify-center gap-6 p-6">
    <div className="relative">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute inset-0 bg-ouro/20 rounded-full blur-2xl"
      />
      <div className="relative w-24 h-24 border-2 border-ouro/10 border-t-ouro rounded-full animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <img 
          src="https://raw.githubusercontent.com/kravmagaipiranga/vigila/5913bbe85976c4203320be5cf9ec67c3613c752e/icon.png" 
          alt="VIGILA" 
          className="w-10 h-10 object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
    <div className="text-center space-y-2">
      <h2 className="text-2xl font-black uppercase italic tracking-tighter text-ouro">VIGILA</h2>
      <div className="flex flex-col items-center gap-1">
        <p className="text-pergaminho/40 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
          Iniciando Protocolos de Segurança
        </p>
        <div className="w-32 h-0.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-full h-full bg-ouro/40"
          />
        </div>
      </div>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    if (user) {
      // Only seed if user is admin to prevent permission errors for regular users
      if (user.email === 'kravmagaipiranga@gmail.com') {
        seedGuides();
        seedOfficialContacts();
      }
    }
  }, [user]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <AuthScreen />
      </Suspense>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen setActiveTab={setActiveTab} />;
      case 'checklist':
        return <ChecklistScreen />;
      case 'guide':
        return <GuideScreen />;
      case 'contacts':
        return <ContactsScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'risks':
        return <RisksScreen />;
      case 'journal':
        return <JournalScreen />;
      default:
        return <HomeScreen setActiveTab={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Suspense fallback={<LoadingScreen />}>
        {renderContent()}
      </Suspense>
      
      {/* Special trigger for Risks Screen from Home */}
      {activeTab === 'home' && (
        <button 
          onClick={() => setActiveTab('risks')}
          className="mt-6 w-full bg-ardosia border border-ouro/10 rounded-3xl p-5 flex items-center justify-between hover:border-ouro/50 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-ouro/10 rounded-xl flex items-center justify-center text-ouro">
              <AlertTriangle size={20} />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-black uppercase italic leading-none">Riscos Locais</h4>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-1">Inteligência de Área</p>
            </div>
          </div>
          <ChevronRight size={20} className="opacity-50" />
        </button>
      )}
    </Layout>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

