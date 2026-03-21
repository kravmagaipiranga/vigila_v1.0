/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import GuideScreen from './screens/GuideScreen';
import ContactsScreen from './screens/ContactsScreen';
import SettingsScreen from './screens/SettingsScreen';
import ChecklistScreen from './screens/ChecklistScreen';
import RisksScreen from './screens/RisksScreen';
import { seedGuides, seedOfficialContacts } from './services/firestore';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    if (user) {
      seedGuides();
      seedOfficialContacts();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidiana flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-ouro/20 border-t-ouro rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
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
      default:
        return <HomeScreen setActiveTab={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
      
      {/* Special trigger for Risks Screen from Home */}
      {activeTab === 'home' && (
        <button 
          onClick={() => setActiveTab('risks')}
          className="mt-6 w-full bg-ardosia border border-ouro/10 rounded-3xl p-5 flex items-center justify-between hover:border-ouro/40 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-ouro/10 rounded-xl flex items-center justify-center text-ouro">
              <AlertTriangle size={20} />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-black uppercase italic leading-none text-pergaminho">Riscos Locais</h4>
              <p className="text-[10px] font-bold uppercase tracking-widest text-pergaminho/40 mt-1">Inteligência de Área</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-ouro/20" />
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

