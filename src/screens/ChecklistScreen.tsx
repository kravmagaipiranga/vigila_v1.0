import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, orderBy, writeBatch, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ChecklistItem, ProfileType } from '../types';
import { Plus, Trash2, CheckCircle2, Circle, RotateCcw, X, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../services/firestore';
import { useAuth } from '../AuthContext';
import { PROFILE_CHECKLIST_ITEMS } from '../constants/profiles';

const ChecklistScreen: React.FC = () => {
  const { profile } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [loading, setLoading] = useState(true);

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const isExpired = profile ? (!profile.isPro && profile.trialEndsAt && new Date() > new Date(profile.trialEndsAt)) : false;

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'checklist'), 
      where('userId', '==', auth.currentUser.uid),
      orderBy('order', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChecklistItem));
      setItems(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'checklist'));

    return unsubscribe;
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newItemText.trim()) return;

    try {
      await addDoc(collection(db, 'checklist'), {
        userId: auth.currentUser.uid,
        text: newItemText,
        completed: false,
        isDefault: false,
        order: items.length + 1,
        profile: profile?.profileType || ProfileType.GENERIC
      });
      setNewItemText('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'checklist');
    }
  };

  const toggleComplete = async (item: ChecklistItem) => {
    try {
      await updateDoc(doc(db, 'checklist', item.id), {
        completed: !item.completed
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'checklist');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'checklist', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'checklist');
    }
  };

  const handleClearAll = async () => {
    if (!auth.currentUser || items.length === 0) return;
    
    try {
      const batch = writeBatch(db);
      items.forEach(item => {
        batch.delete(doc(db, 'checklist', item.id));
      });
      await batch.commit();
      setShowClearConfirm(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'checklist');
    }
  };

  const handleAddSuggested = async (text: string) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'checklist'), {
        userId: auth.currentUser.uid,
        text,
        completed: false,
        isDefault: false,
        order: items.length + 1,
        profile: profile?.profileType || ProfileType.GENERIC
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'checklist');
    }
  };

  const resetToDefault = async () => {
    if (!auth.currentUser) return;
    
    try {
      const batch = writeBatch(db);
      
      // Delete existing
      const q = query(collection(db, 'checklist'), where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(d => batch.delete(d.ref));

      // Add defaults based on profile
      const currentProfile = profile?.profileType || ProfileType.GENERIC;
      const defaults = PROFILE_CHECKLIST_ITEMS[currentProfile] || PROFILE_CHECKLIST_ITEMS[ProfileType.GENERIC];

      defaults.forEach((item, idx) => {
        const newDocRef = doc(collection(db, 'checklist'));
        batch.set(newDocRef, {
          userId: auth.currentUser?.uid,
          text: item.text,
          completed: false,
          isDefault: true,
          order: idx,
          profile: currentProfile
        });
      });

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'checklist');
    }
  };

  const pendingCount = items.filter(i => !i.completed).length;

  const SUGGESTED_ITEMS = [
    "Verificar bateria do celular",
    "Avisar contato de confiança",
    "Travar portas e janelas",
    "Ativar localização em tempo real",
    "Conferir rota no mapa",
    "Verificar arredores ao sair"
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="space-y-1">
        <h2 className="text-ouro/60 text-[10px] font-black uppercase tracking-[0.2em]">Prevenção</h2>
        <h1 className="text-3xl font-black tracking-tighter italic text-pergaminho">CHECKLIST</h1>
      </div>

      {/* Progress Bar */}
      <div className="bg-ardosia border border-ouro/10 rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ouro/60">Progresso Geral</span>
          <span className="text-xl font-black italic text-ouro">
            {items.length > 0 ? Math.round(((items.length - pendingCount) / items.length) * 100) : 0}%
          </span>
        </div>
        <div className="h-1.5 bg-obsidiana rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${items.length > 0 ? ((items.length - pendingCount) / items.length) * 100 : 0}%` }}
            className="h-full bg-esmeralda shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          />
        </div>
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-bold text-pergaminho/40 uppercase tracking-widest">
            {pendingCount} itens pendentes
          </p>
          <div className="flex items-center gap-4">
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleClearAll}
                  className="flex items-center gap-1 text-alerta font-black uppercase tracking-widest text-[10px]"
                >
                  Confirmar
                </button>
                <span className="text-pergaminho/20">|</span>
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="text-pergaminho/40 hover:text-pergaminho transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 text-alerta/80 hover:text-alerta transition-colors text-[10px] font-black uppercase tracking-widest"
              >
                <Trash2 size={12} />
                Limpar Tudo
              </button>
            )}
            {!isExpired && (
              <button 
                onClick={resetToDefault}
                className="flex items-center gap-2 text-ouro/60 hover:text-ouro transition-colors text-[10px] font-black uppercase tracking-widest"
              >
                <RotateCcw size={12} />
                Resetar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Item */}
      <div className="space-y-4">
        <form onSubmit={handleAddItem} className="relative group">
          <input
            type="text"
            placeholder="Adicionar novo item..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            className="w-full bg-ardosia border border-ouro/10 rounded-2xl py-5 pl-6 pr-16 focus:outline-none focus:border-ouro/40 transition-colors text-sm text-pergaminho placeholder:text-pergaminho/20"
          />
          <button 
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-ouro text-obsidiana rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </form>

        {/* Suggested Items */}
        {!isExpired && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-ouro/40 ml-1">Sugestões de Segurança</h3>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_ITEMS.map((text, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddSuggested(text)}
                  className="bg-ardosia/50 border border-ouro/5 hover:border-ouro/20 text-pergaminho/40 hover:text-ouro px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  + {text}
                </button>
              ))}
            </div>
          </div>
        )}
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
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
                className={`p-5 rounded-3xl border transition-all flex items-center justify-between gap-4 ${
                  item.completed ? 'bg-ardosia/30 border-ouro/5 opacity-40' : 'bg-ardosia border-ouro/10'
                }`}
              >
                <button 
                  onClick={() => toggleComplete(item)}
                  className="flex-1 flex items-center gap-4 text-left"
                >
                  <div className={item.completed ? 'text-esmeralda' : 'text-pergaminho/20'}>
                    {item.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </div>
                  <span className={`text-sm font-medium tracking-tight ${item.completed ? 'line-through text-esmeralda/40' : 'text-pergaminho'}`}>
                    {item.text}
                  </span>
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-pergaminho/20 hover:text-alerta transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {items.length === 0 && (
            <div className="text-center py-16 space-y-6">
              <div className="w-20 h-20 bg-ardosia rounded-[32px] border border-ouro/10 flex items-center justify-center mx-auto text-ouro/20">
                <CheckSquare size={40} />
              </div>
              <div className="space-y-2">
                <p className="text-pergaminho/40 text-[10px] font-black uppercase tracking-widest">Sua lista está vazia</p>
                {!isExpired && (
                  <button 
                    onClick={resetToDefault}
                    className="text-ouro text-xs font-black uppercase tracking-widest hover:underline"
                  >
                    Carregar Itens Padrão
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChecklistScreen;
