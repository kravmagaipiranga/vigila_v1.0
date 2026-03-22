import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { GuideContent, Section, ProfileType } from '../types';
import { seedGuides } from '../services/firestore';
import { ChevronDown, ChevronUp, BookOpen, Search, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../AuthContext';

const GuideScreen: React.FC = () => {
  const { profile } = useAuth();
  const [guides, setGuides] = useState<GuideContent[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('Todos os Temas');
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  const themes = [
    "Todos os Temas",
    "Fundamentos da Preparação",
    "Kits de Emergência",
    "Inundações e Enchentes",
    "Incêndios Florestais e Urbanos",
    "Terremotos e Desabamentos",
    "Segurança no Campus",
    "Ataques Cibernéticos",
    "Emergências Químicas",
    "Segurança Escolar",
    "Protocolos de Segurança"
  ];

  useEffect(() => {
    const currentProfile = profile?.profileType || ProfileType.GENERIC;
    
    // Fetch all guides and filter in memory to avoid index requirements for 'in' + 'orderBy'
    const q = query(
      collection(db, 'guides'), 
      orderBy('order', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuideContent));
      // Filter in memory
      const filteredData = data.filter(g => 
        !g.profile || g.profile === ProfileType.GENERIC || g.profile === currentProfile
      );
      setGuides(filteredData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching guides:", error);
      setLoading(false);
    });
    return unsubscribe;
  }, [profile?.profileType]);

  const filteredGuides = guides.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         g.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTheme = selectedTheme === 'Todos os Temas' || 
                        g.title.toLowerCase().includes(selectedTheme.toLowerCase()) ||
                        g.content.toLowerCase().includes(selectedTheme.toLowerCase());
    return matchesSearch && matchesTheme;
  });

  const sections: Section[] = ['Preparação', 'Desastres e Emergências', 'Segurança'];

  return (
    <div className="space-y-8 pb-20">
      <div className="space-y-1">
        <h2 className="text-ouro/60 text-[10px] font-black uppercase tracking-[0.2em]">Guia Estratégico</h2>
        <h1 className="text-3xl font-black tracking-tighter italic text-pergaminho">CONTEÚDO</h1>
      </div>

      {/* Search */}
      <div className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-ouro/40 group-focus-within:text-ouro transition-colors" size={18} />
          <input
            type="text"
            placeholder="Buscar dicas de segurança..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-ardosia border border-ouro/10 rounded-2xl py-5 pl-14 pr-6 focus:outline-none focus:border-ouro/40 transition-colors text-sm text-pergaminho placeholder:text-pergaminho/20"
          />
        </div>

        {/* Theme Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsThemeOpen(!isThemeOpen)}
            className="w-full bg-ardosia border border-ouro/10 rounded-2xl py-4 px-6 flex items-center justify-between text-sm font-black italic uppercase tracking-tight text-pergaminho hover:bg-ouro/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Info size={16} className="text-ouro/40" />
              <span>{selectedTheme}</span>
            </div>
            <ChevronDown size={18} className={`text-ouro transition-transform ${isThemeOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isThemeOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 top-full left-0 right-0 mt-2 bg-ardosia border border-ouro/20 rounded-2xl overflow-hidden shadow-2xl"
              >
                <div className="max-h-60 overflow-y-auto py-2">
                  {themes.map((theme) => (
                    <button
                      key={theme}
                      onClick={() => {
                        setSelectedTheme(theme);
                        setIsThemeOpen(false);
                      }}
                      className={`w-full px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest transition-colors ${
                        selectedTheme === theme ? 'bg-ouro text-obsidiana' : 'text-pergaminho/60 hover:bg-ouro/10'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-ouro/20 border-t-ouro rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src="https://raw.githubusercontent.com/kravmagaipiranga/vigila/5913bbe85976c4203320be5cf9ec67c3613c752e/icon.png" 
                alt="VIGILA" 
                className="w-5 h-5 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      ) : filteredGuides.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
          <div className="w-20 h-20 bg-ouro/5 rounded-full flex items-center justify-center text-ouro/20">
            <BookOpen size={40} />
          </div>
          <div className="space-y-2">
            <p className="text-pergaminho/40 text-sm font-bold uppercase tracking-widest">Nenhum guia encontrado</p>
            <p className="text-pergaminho/20 text-[10px] max-w-[200px] mx-auto uppercase tracking-tighter">
              Tente buscar por outro termo ou atualize o banco de dados.
            </p>
          </div>
          <button 
            onClick={async () => {
              setLoading(true);
              await seedGuides(true);
              setLoading(false);
            }}
            className="bg-ouro/10 border border-ouro/20 text-ouro text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-xl hover:bg-ouro/20 transition-all"
          >
            Sincronizar Conteúdo
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {sections.map(section => {
            const sectionGuides = filteredGuides.filter(g => g.section === section);
            if (sectionGuides.length === 0) return null;

            return (
              <div key={section} className="space-y-4">
                <div className="flex items-center gap-3 ml-1">
                  <div className="w-6 h-6 bg-ouro/10 rounded-lg flex items-center justify-center text-ouro">
                    <BookOpen size={12} strokeWidth={3} />
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ouro/60">
                    {section}
                  </h3>
                </div>
                <div className="space-y-3">
                  {sectionGuides.map(guide => (
                    <div 
                      key={guide.id}
                      className="bg-ardosia border border-ouro/10 rounded-3xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() => setExpandedId(expandedId === guide.id ? null : guide.id)}
                        className="w-full p-6 flex items-center justify-between text-left hover:bg-ouro/5 transition-colors"
                      >
                        <span className="text-sm font-black uppercase italic tracking-tight text-pergaminho">{guide.title}</span>
                        {expandedId === guide.id ? <ChevronUp size={18} className="text-ouro" /> : <ChevronDown size={18} className="text-ouro/40" />}
                      </button>
                      <AnimatePresence>
                        {expandedId === guide.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-6 pb-6"
                          >
                            <div className="pt-4 border-t border-ouro/10 text-pergaminho/60 text-sm leading-relaxed markdown-body">
                              <ReactMarkdown>{guide.content}</ReactMarkdown>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GuideScreen;
