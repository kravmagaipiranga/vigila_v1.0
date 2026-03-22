import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, X, Save, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { JournalEntry } from '../types';
import { subscribeToJournalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry } from '../services/journalService';

const JournalScreen: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToJournalEntries(user.uid, (data) => {
      setEntries(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleOpenModal = (entry?: JournalEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setTitle(entry.title);
      setContent(entry.content);
    } else {
      setEditingEntry(null);
      setTitle('');
      setContent('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
    setTitle('');
    setContent('');
  };

  const handleSave = async () => {
    if (!user || !title.trim() || !content.trim()) return;
    setIsSaving(true);
    try {
      if (editingEntry) {
        await updateJournalEntry(editingEntry.id, {
          title: title.trim(),
          content: content.trim(),
          updatedAt: new Date().toISOString()
        });
      } else {
        await addJournalEntry({
          userId: user.uid,
          title: title.trim(),
          content: content.trim(),
          createdAt: new Date().toISOString()
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving journal entry:", error);
      alert("Erro ao salvar a nota.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta nota?')) {
      try {
        await deleteJournalEntry(id);
      } catch (error) {
        console.error("Error deleting journal entry:", error);
        alert("Erro ao excluir a nota.");
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-ouro">DIÁRIO</h1>
          <p className="text-pergaminho/60 text-xs font-medium mt-1">
            Seus registros e observações
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="w-12 h-12 bg-ouro text-obsidiana rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      <div className="space-y-4">
        {entries.length === 0 ? (
          <div className="bg-ardosia border border-ouro/10 rounded-3xl p-8 text-center">
            <p className="text-pergaminho/40 text-sm font-medium">Nenhuma nota registrada.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-ardosia border border-ouro/10 rounded-3xl p-5 shadow-lg shadow-black/20"
            >
              <div className="flex justify-between items-start gap-4 mb-3">
                <h3 className="text-lg font-bold text-pergaminho leading-tight">{entry.title}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleOpenModal(entry)}
                    className="p-2 text-pergaminho/40 hover:text-ouro transition-colors rounded-xl hover:bg-white/5"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 text-pergaminho/40 hover:text-alerta transition-colors rounded-xl hover:bg-white/5"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <p className="text-pergaminho/70 text-sm whitespace-pre-wrap mb-4 line-clamp-3">
                {entry.content}
              </p>
              
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-pergaminho/30">
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span>{formatDate(entry.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={12} />
                  <span>{formatTime(entry.createdAt)}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="relative w-full max-w-md bg-ardosia border border-ouro/20 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-ouro/10 flex justify-between items-center bg-obsidiana/50">
                <h2 className="text-xl font-black italic tracking-tighter text-ouro">
                  {editingEntry ? 'EDITAR NOTA' : 'NOVA NOTA'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-pergaminho/40 hover:text-ouro transition-colors rounded-xl hover:bg-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-pergaminho/40 ml-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Observação sobre a rota"
                    className="w-full bg-obsidiana border border-ouro/10 rounded-2xl py-3 px-4 text-sm font-medium text-pergaminho focus:outline-none focus:border-ouro/50 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-pergaminho/40 ml-1">
                    Conteúdo
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escreva sua nota aqui..."
                    rows={8}
                    className="w-full bg-obsidiana border border-ouro/10 rounded-2xl py-3 px-4 text-sm font-medium text-pergaminho focus:outline-none focus:border-ouro/50 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-ouro/10 bg-obsidiana/50">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !title.trim() || !content.trim()}
                  className="w-full py-4 bg-ouro text-obsidiana rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-obsidiana/30 border-t-obsidiana rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={16} />
                      Salvar Nota
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JournalScreen;
