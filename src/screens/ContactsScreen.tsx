import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, or } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Contact, ContactType } from '../types';
import { Phone, Mail, Plus, Trash2, Edit2, X, Check, MapPin, Shield, User, UserPlus, Share2 } from 'lucide-react';
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

  const handleAddContact = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!auth.currentUser) return;

    if (!name || !phone) {
      alert('Por favor, preencha o nome e o telefone.');
      return;
    }

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

  const handleImportContacts = async () => {
    try {
      // Check if Contact Picker API is supported
      const supported = 'contacts' in navigator && 'ContactsManager' in window;
      
      if (!supported) {
        alert('A importação de contatos não é suportada neste navegador. Por favor, insira manualmente.');
        return;
      }

      const props = ['name', 'tel'];
      const opts = { multiple: false };
      
      // @ts-ignore - Contact Picker API is relatively new
      const contacts = await navigator.contacts.select(props, opts);
      
      if (contacts.length > 0) {
        const contact = contacts[0];
        if (contact.name && contact.name.length > 0) {
          setName(contact.name[0]);
        }
        if (contact.tel && contact.tel.length > 0) {
          // Keep only numbers and + sign
          const cleanPhone = contact.tel[0].replace(/[^\d+]/g, '');
          setPhone(cleanPhone);
        }
      }
    } catch (err) {
      console.error('Error selecting contact:', err);
    }
  };

  const handleShare = async (contact: Contact) => {
    const message = `Contato de Emergência: ${contact.name} - ${contact.phone}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Contato de Emergência',
          text: message,
        });
      } catch (err) {
        console.error('Erro ao compartilhar:', err);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
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
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 text-ciano bg-ciano/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-ciano/20 transition-colors"
            >
              <Plus size={14} />
              Adicionar
            </button>
          )}
        </div>

        {/* Inline Add Contact Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-ardosia border border-ouro/20 rounded-[32px] p-6 space-y-6 mb-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter text-ouro">Novo Contato</h3>
                  <button onClick={() => setIsAdding(false)} className="p-2 text-pergaminho/40 hover:text-pergaminho">
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={handleImportContacts}
                    className="w-full flex items-center justify-center gap-2 bg-obsidiana border border-ouro/10 rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest text-ouro hover:bg-ouro/5 transition-all"
                  >
                    <UserPlus size={14} />
                    Importar do Telefone
                  </button>

                  <form onSubmit={handleAddContact} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-ouro/60 ml-1">Nome Completo</label>
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
                      <label className="text-[8px] font-black uppercase tracking-widest text-ouro/60 ml-1">Telefone / WhatsApp</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-obsidiana border border-ouro/10 rounded-2xl py-4 px-4 focus:outline-none focus:border-ouro transition-colors text-sm text-pergaminho placeholder:text-pergaminho/20"
                        placeholder="Ex: (11) 99999-9999"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAdding(false)}
                        className="flex-1 bg-obsidiana border border-ouro/10 text-pergaminho/40 font-black uppercase tracking-widest py-4 rounded-2xl transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-[2] bg-ouro hover:opacity-90 text-obsidiana font-black uppercase tracking-widest py-4 rounded-2xl transition-all"
                      >
                        Salvar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                    onClick={() => handleShare(contact)}
                    className="w-10 h-10 bg-ciano/10 text-ciano rounded-xl flex items-center justify-center hover:bg-ciano hover:text-obsidiana transition-all"
                    title="Compartilhar"
                  >
                    <Share2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="w-10 h-10 bg-alerta/10 text-alerta rounded-xl flex items-center justify-center hover:bg-alerta hover:text-pergaminho transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                  <a
                    href={`tel:${contact.phone}`}
                    className="w-12 h-12 bg-ardosia border border-ouro/20 text-ouro rounded-2xl flex items-center justify-center hover:bg-ouro hover:text-obsidiana transition-all"
                    title="Ligar"
                  >
                    <Phone size={20} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ContactsScreen;
