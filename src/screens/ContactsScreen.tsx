import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, or } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Contact, ContactType } from '../types';
import { Phone, Mail, Plus, Trash2, Edit2, X, Check, MapPin, Shield, User, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../services/firestore';

const ContactsScreen: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<ContactType>('Polícia');

  useEffect(() => {
    if (!auth.currentUser) return;

    // Filter to only get official contacts OR contacts belonging to the current user
    const q = query(
      collection(db, 'contacts'), 
      or(
        where('userId', '==', auth.currentUser.uid),
        where('isOfficial', '==', true)
      )
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
      setContacts(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'contacts'));

    return unsubscribe;
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      await addDoc(collection(db, 'contacts'), {
        userId: auth.currentUser.uid,
        name,
        phone,
        email,
        type,
        isOfficial: false,
      });
      setIsAdding(false);
      setName('');
      setPhone('');
      setEmail('');
      setType('Polícia');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'contacts');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contacts', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'contacts');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="space-y-1">
        <h2 className="text-ouro/60 text-[10px] font-black uppercase tracking-[0.2em]">Rede de Apoio</h2>
        <h1 className="text-3xl font-black tracking-tighter italic text-pergaminho">CONTATOS</h1>
      </div>

      {/* Official Contacts */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ouro/60">Canais Oficiais</h3>
        <div className="grid grid-cols-1 gap-3">
          {contacts.filter(c => c.isOfficial).map((contact) => (
            <motion.div
              key={contact.id}
              whileTap={{ scale: 0.98 }}
              className="bg-ardosia border border-esmeralda/30 p-5 rounded-3xl flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-esmeralda/10 rounded-2xl flex items-center justify-center text-esmeralda">
                  <Shield size={24} />
                </div>
                <div>
                  <h4 className="font-black uppercase italic text-esmeralda">{contact.name}</h4>
                  <p className="text-xs font-bold text-pergaminho/40 tracking-widest">{contact.phone}</p>
                </div>
              </div>
              <a
                href={`tel:${contact.phone}`}
                className="w-12 h-12 bg-esmeralda text-obsidiana rounded-2xl flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <Phone size={20} fill="currentColor" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Personal Contacts */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ouro/60">Meus Contatos</h3>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 text-ciano bg-ciano/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-ciano/20 transition-colors"
          >
            <Plus size={14} />
            Adicionar
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-ouro/20 border-t-ouro rounded-full animate-spin" />
          </div>
        ) : contacts.filter(c => !c.isOfficial).length === 0 ? (
          <div className="bg-ardosia/30 border border-dashed border-ouro/10 rounded-3xl p-12 text-center">
            <Plus size={40} className="mx-auto text-ouro/20 mb-4" />
            <p className="text-pergaminho/40 text-xs font-medium">Nenhum contato pessoal cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {contacts.filter(c => !c.isOfficial).map((contact) => (
              <motion.div
                key={contact.id}
                whileTap={{ scale: 0.98 }}
                className="bg-ardosia border border-ouro/10 p-5 rounded-3xl flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-ouro/5 rounded-2xl flex items-center justify-center text-pergaminho/40">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h4 className="font-black uppercase italic text-pergaminho">{contact.name}</h4>
                    <p className="text-xs font-bold text-pergaminho/40 tracking-widest">{contact.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="w-10 h-10 bg-alerta/10 text-alerta rounded-xl flex items-center justify-center hover:bg-alerta hover:text-pergaminho transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                  <a
                    href={`tel:${contact.phone}`}
                    className="w-12 h-12 bg-ardosia border border-ouro/20 text-ouro rounded-2xl flex items-center justify-center hover:bg-ouro hover:text-obsidiana transition-all"
                  >
                    <Phone size={20} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-obsidiana/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-ardosia border border-ouro/20 rounded-[32px] p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-ouro">Novo Contato</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 text-pergaminho/40 hover:text-pergaminho">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddContact} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ouro/60 ml-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-obsidiana border border-ouro/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-ouro transition-colors text-sm text-pergaminho placeholder:text-pergaminho/20"
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-ouro/60 ml-1">Telefone / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-obsidiana border border-ouro/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-ouro transition-colors text-sm text-pergaminho placeholder:text-pergaminho/20"
                    placeholder="Ex: (11) 99999-9999"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-ouro hover:opacity-90 text-obsidiana font-black uppercase tracking-widest py-4 rounded-2xl transition-all mt-4"
                >
                  Salvar Contato
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContactsScreen;
