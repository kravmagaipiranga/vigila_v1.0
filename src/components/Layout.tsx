import React, { useState } from 'react';
import { Home, CheckSquare, BookOpen, Phone, Settings, ChevronLeft, Menu, Bell, X, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('PT');

  const languages = [
    { code: 'PT', name: 'Português', flag: '🇧🇷' },
    { code: 'EN', name: 'English', flag: '🇺🇸' },
    { code: 'ES', name: 'Español', flag: '🇪🇸' },
  ];

  const tabs = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'checklist', icon: CheckSquare, label: 'Checklist' },
    { id: 'guide', icon: BookOpen, label: 'Guia' },
    { id: 'contacts', icon: Phone, label: 'Contatos' },
    { id: 'settings', icon: Settings, label: 'Ajustes' },
  ];

  const showBackButton = activeTab !== 'home' && activeTab !== 'settings';

  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    setIsMenuOpen(false);
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
      {/* Sidebar Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-ardosia border-r border-ouro/20 z-[70] p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-12">
                <h2 className="text-2xl font-black italic tracking-tighter text-ouro">MENU</h2>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-pergaminho/40 hover:text-ouro transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {tabs.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabSelect(item.id)}
                      className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                        isActive 
                          ? 'bg-ciano/10 border border-ciano/20 text-ciano' 
                          : 'text-pergaminho/60 hover:bg-white/5'
                      }`}
                    >
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-auto pt-8 border-t border-ouro/10">
                <p className="text-[10px] font-bold text-pergaminho/20 uppercase tracking-[0.2em]">VIGILA v1.0.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="px-6 py-4 flex justify-between items-center bg-ardosia/80 backdrop-blur-md sticky top-0 z-50 border-b border-ouro/20">
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {showBackButton ? (
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
            ) : (
              <motion.button
                key="menu"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => setIsMenuOpen(true)}
                className="p-2 -ml-2 text-pergaminho/60 hover:text-ouro transition-colors"
              >
                <Menu size={24} />
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
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 transition-colors relative ${
                isActive ? 'text-ciano' : 'text-pergaminho/40'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
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
