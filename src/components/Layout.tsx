import React, { useState } from 'react';
import { Home, CheckSquare, BookOpen, Phone, Settings, ChevronLeft, Bell, Languages, Book, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { profile, isAdmin } = useAuth();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('PT');

  const isExpired = !isAdmin && profile ? (!profile.isPro && profile.trialEndsAt && new Date() > new Date(profile.trialEndsAt)) : false;

  const languages = [
    { code: 'PT', name: 'Português', flag: '🇧🇷' },
    { code: 'EN', name: 'English', flag: '🇺🇸' },
    { code: 'ES', name: 'Español', flag: '🇪🇸' },
  ];

  const tabs = [
    { id: 'home', icon: Home, label: 'Início', isPro: false },
    { id: 'checklist', icon: CheckSquare, label: 'Checklist', isPro: false },
    { id: 'guide', icon: BookOpen, label: 'Guia', isPro: true },
    { id: 'contacts', icon: Phone, label: 'Contatos', isPro: false },
    { id: 'journal', icon: Book, label: 'Diário', isPro: true },
  ];

  const showBackButton = activeTab !== 'home';

  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleLanguageChange = (langCode: string) => {
    setCurrentLang(langCode);
    setIsLanguageOpen(false);
    
    // Trigger Google Translate
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = langCode.toLowerCase();
      select.dispatchEvent(new Event('change'));
    }
  };

  return (
    <div className="min-h-screen bg-obsidiana text-pergaminho flex flex-col max-w-md mx-auto relative overflow-y-auto shadow-2xl">
      {/* Top Header */}
      <header className="px-6 py-4 flex justify-between items-center bg-ardosia/80 backdrop-blur-md sticky top-0 z-50 border-b border-ouro/20">
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {showBackButton && (
              <motion.button
                key="back"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => setActiveTab('home')}
                className="p-2 -ml-2 text-pergaminho/60 hover:text-ouro transition-colors"
              >
                <ChevronLeft size={24} />
              </motion.button>
            )}
          </AnimatePresence>
          <img 
            src="https://raw.githubusercontent.com/kravmagaipiranga/vigila/5913bbe85976c4203320be5cf9ec67c3613c752e/Vigila.png" 
            alt="VIGILA" 
            className="h-12 w-auto object-contain" 
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => setIsLanguageOpen(!isLanguageOpen)}
            className="p-2 text-pergaminho/60 hover:text-ouro transition-colors flex items-center gap-1"
          >
            <Languages size={20} />
            <span className="text-[10px] font-black">{currentLang}</span>
          </button>

          <AnimatePresence>
            {isLanguageOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-48 bg-ardosia border border-ouro/20 rounded-2xl shadow-2xl overflow-hidden z-[100]"
              >
                <div className="p-2 space-y-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full p-3 rounded-xl flex items-center justify-between transition-all ${
                        currentLang === lang.code 
                          ? 'bg-ouro/10 text-ouro' 
                          : 'text-pergaminho/60 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{lang.flag}</span>
                        <span className="text-xs font-bold">{lang.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button className="p-2 text-pergaminho/60 hover:text-ouro transition-colors">
            <Bell size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`p-2 transition-colors ${activeTab === 'settings' ? 'text-ouro' : 'text-pergaminho/60 hover:text-ouro'}`}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-4 px-4">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className="w-full bg-ardosia/90 backdrop-blur-lg border-t border-ouro/20 px-6 py-6 flex justify-between items-center z-50 mt-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isLocked = isExpired && tab.isPro;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (isLocked) {
                  alert('Esta funcionalidade é exclusiva para assinantes PRO.');
                  return;
                }
                setActiveTab(tab.id);
              }}
              className={`flex flex-col items-center gap-1 transition-colors relative ${
                isActive ? 'text-ciano' : 'text-pergaminho/40'
              } ${isLocked ? 'opacity-50' : ''}`}
            >
              <div className="relative">
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {isLocked && (
                  <div className="absolute -bottom-1 -right-1 bg-obsidiana rounded-full p-0.5">
                    <Lock size={10} className="text-alerta" />
                  </div>
                )}
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider">
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-3 w-1 h-1 bg-ciano rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
