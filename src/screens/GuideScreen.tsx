import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { GuideContent, Section, ProfileType } from '../types';
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

  useEffect(() => {
    const currentProfile = profile?.profileType || ProfileType.GENERIC;
    
    // We want to show generic guides AND profile-specific guides
    const q = query(
      collection(db, 'guides'), 
      where('profile', 'in', [ProfileType.GENERIC, currentProfile]),
      orderBy('order', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuideContent));
      // Sort manually because 'in' query might not preserve order across different values perfectly if we want specific ordering
      const sortedData = data.sort((a, b) => a.order - b.order);
      setGuides(sortedData);
      setLoading(false);
    });
    return unsubscribe;
  }, [profile?.profileType]);

  const filteredGuides = guides.filter(g => 
    g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sections: Section[] = ['Planejamento', 'Prevenção', 'Análise'];

  return (
    <div className="space-y-8 pb-20">
      <div className="space-y-1">
        <h2 className="text-ouro/60 text-[10px] font-black uppercase tracking-[0.2em]">Guia Estratégico</h2>
        <h1 className="text-3xl font-black tracking-tighter italic text-pergaminho">CONTEÚDO</h1>
      </div>

      {/* Search */}
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
