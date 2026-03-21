import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Shield, AlertCircle, MapPin, ChevronRight, Share2, Volume2, VolumeX, Edit3, X, Search, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Contact } from '../types';
import { searchLocation, PlaceResult } from '../services/geminiService';

interface HomeProps {
  setActiveTab: (tab: string) => void;
}

const HomeScreen: React.FC<HomeProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const [sendingAlert, setSendingAlert] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [isManualLocationModalOpen, setIsManualLocationModalOpen] = useState(false);
  const [manualLocationInput, setManualLocationInput] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Audio Recording State
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Em um app real, enviaríamos para o Firebase Storage
        console.log('Gravação de áudio finalizada, tamanho:', audioBlob.size);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      console.log('Gravação iniciada discretamente...');
      
      // Para automaticamente após 2 minutos para economizar bateria/espaço
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 120000);

    } catch (err) {
      console.error('Falha ao iniciar gravação:', err);
    }
  };

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const cards = [
    { id: 'guide', title: 'Planejamento', subtitle: 'Antes de Sair', color: 'bg-ardosia border-ouro/20 text-ouro' },
    { id: 'guide', title: 'Prevenção', subtitle: 'Em Campo', color: 'bg-ardosia border-ouro/20 text-ouro' },
    { id: 'guide', title: 'Análise', subtitle: 'Após Incidente', color: 'bg-ardosia border-ouro/20 text-ouro' },
  ];

  const stopAlarm = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsAlarmActive(false);
  };

  const startAlarm = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 2;
      lfoGain.gain.value = 440;
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.1);

      lfo.start();
      osc.start();
      
      oscillatorRef.current = osc;
      gainNodeRef.current = gain;
      setIsAlarmActive(true);
    } catch (e) {
      console.error('Failed to start alarm:', e);
    }
  };

  const toggleAlarm = () => {
    if (isAlarmActive) {
      stopAlarm();
    } else {
      startAlarm();
    }
  };

  useEffect(() => {
    return () => {
      stopAlarm();
    };
  }, []);

  const handleAutoLocation = async () => {
    setLocationStatus('fetching');
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      setCurrentLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      setLocationStatus('success');
    } catch (error: any) {
      console.error('Error getting location:', error);
      setLocationStatus('error');
      alert('Não foi possível obter sua localização automática. Por favor, tente novamente ou insira manualmente.');
    }
  };

  const handleSendAlert = async () => {
    if (!user) return;
    setSendingAlert(true);
    
    // Iniciar gravação discreta
    startRecording();
    
    // If location is already set manually or successfully fetched, we use it.
    // Otherwise we try to fetch it.
    let mapsUrl = '';
    
    if (locationStatus === 'success' && currentLocation) {
      // If we have a location string, we use it. 
      // If it's coordinates, we make a maps link. If it's text, we just send text.
      if (currentLocation.includes(',')) {
        mapsUrl = `https://www.google.com/maps?q=${currentLocation.replace(' ', '')}`;
      } else {
        mapsUrl = `Localização manual: ${currentLocation}`;
      }
    } else {
      setLocationStatus('fetching');
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });

        const { latitude, longitude } = position.coords;
        mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setCurrentLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setLocationStatus('success');
      } catch (error: any) {
        console.error('Error getting location:', error);
        setLocationStatus('error');
        alert('Não foi possível obter sua localização automática. Por favor, insira manualmente.');
        setSendingAlert(false);
        return;
      }
    }

    try {
      const q = query(
        collection(db, 'contacts'), 
        where('userId', '==', user.uid),
        where('isOfficial', '==', false)
      );
      const snapshot = await getDocs(q);
      const contacts = snapshot.docs.map(doc => doc.data() as Contact);

      if (contacts.length === 0) {
        alert('Você não possui contatos de emergência cadastrados. Vá para a aba "Contatos" para adicionar.');
        setSendingAlert(false);
        return;
      }

      const message = `EMERGÊNCIA: preciso de ajuda agora.\nMinha localização: ${mapsUrl}\nMensagem automática enviada pelo meu app de segurança VIGILA.`;

      if (navigator.share) {
        await navigator.share({
          title: 'ALERTA DE EMERGÊNCIA - VIGILA',
          text: message,
        });
      } else {
        const firstContact = contacts[0];
        window.open(`sms:${firstContact.phone}?body=${encodeURIComponent(message)}`);
      }
    } catch (error: any) {
      console.error('Error sending alert:', error);
      alert('Erro ao enviar o alerta.');
    } finally {
      setSendingAlert(false);
    }
  };

  const handleManualLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLocationInput.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchLocation(manualLocationInput.trim());
      setSearchResults(results);
      if (results.length === 0) {
        alert('Nenhum local encontrado. Tente ser mais específico.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Erro ao buscar localização.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (place: PlaceResult) => {
    setCurrentLocation(`${place.location.lat.toFixed(4)}, ${place.location.lng.toFixed(4)}`);
    // We could also store the name/address if we want to show it in the UI instead of coords
    // For now, let's show the address if available
    setManualLocationInput(place.address || place.name);
    setLocationStatus('success');
    setIsManualLocationModalOpen(false);
    setSearchResults([]);
  };

  const handleManualLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualLocationInput.trim()) {
      setCurrentLocation(manualLocationInput.trim());
      setLocationStatus('success');
      setIsManualLocationModalOpen(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="space-y-1">
        <h2 className="text-ouro/60 text-[10px] font-black uppercase tracking-[0.2em]">Painel de Controle</h2>
        <h1 className="text-3xl font-black tracking-tighter italic text-pergaminho">OLÁ, {user?.displayName?.split(' ')[0] || 'USUÁRIO'}!</h1>
      </div>

      {/* Emergency Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* SOS Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab('contacts')}
          className="bg-alerta hover:opacity-90 text-pergaminho p-6 rounded-3xl flex flex-col items-center justify-center gap-3 shadow-xl shadow-alerta/20 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <AlertCircle size={32} strokeWidth={2.5} className="relative z-10" />
          <div className="text-center relative z-10">
            <span className="text-sm font-black uppercase italic tracking-tighter leading-tight block">SOS</span>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Contatos</span>
          </div>
        </motion.button>

        {/* Alarm Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleAlarm}
          className={`${
            isAlarmActive ? 'bg-pergaminho text-alerta animate-pulse' : 'bg-alerta text-pergaminho'
          } hover:opacity-90 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 shadow-xl shadow-alerta/20 group relative overflow-hidden transition-colors`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {isAlarmActive ? <VolumeX size={32} strokeWidth={2.5} className="relative z-10" /> : <Volume2 size={32} strokeWidth={2.5} className="relative z-10" />}
          <div className="text-center relative z-10">
            <span className="text-sm font-black uppercase italic tracking-tighter leading-tight block">ALARME</span>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Sonoro</span>
          </div>
        </motion.button>
      </div>

      {/* Location Status & Alert Button */}
      <div className="bg-ardosia border border-ouro/10 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-ouro/10 rounded-2xl flex items-center justify-center text-ouro">
            <MapPin size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold uppercase tracking-wide text-ouro">Sua Localização</h3>
            <p className="text-pergaminho/60 text-xs font-medium truncate max-w-[150px]">
              {locationStatus === 'success' ? currentLocation : 'São Paulo, SP - Brasil'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleAutoLocation}
              disabled={locationStatus === 'fetching'}
              className="p-2 bg-obsidiana text-ouro/60 rounded-xl hover:text-ouro transition-colors disabled:opacity-50"
              title="Identificar automaticamente"
            >
              <RefreshCw size={16} className={locationStatus === 'fetching' ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => setIsManualLocationModalOpen(true)}
              className="p-2 bg-obsidiana text-ouro/60 rounded-xl hover:text-ouro transition-colors"
              title="Definir manualmente"
            >
              <Edit3 size={16} />
            </button>
            <div className={`flex items-center gap-1 text-esmeralda bg-esmeralda/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors`}>
              <div className={`w-1.5 h-1.5 bg-esmeralda rounded-full ${locationStatus === 'fetching' ? 'animate-ping' : 'animate-pulse'}`} />
              {locationStatus === 'fetching' ? 'Buscando...' : 'Ativo'}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isManualLocationModalOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-obsidiana/50 rounded-2xl border border-ouro/10"
            >
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase italic tracking-tighter text-ouro">Localização Manual</h3>
                  <button onClick={() => setIsManualLocationModalOpen(false)} className="p-1 text-pergaminho/40 hover:text-pergaminho">
                    <X size={16} />
                  </button>
                </div>
                <form onSubmit={handleManualLocationSearch} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: Av. Paulista, 1000"
                      value={manualLocationInput}
                      onChange={(e) => setManualLocationInput(e.target.value)}
                      className="w-full bg-ardosia border border-ouro/10 rounded-xl py-3 px-4 pr-12 focus:outline-none focus:border-ouro transition-colors text-xs text-pergaminho placeholder:text-pergaminho/20"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-ouro/60 hover:text-ouro disabled:opacity-50"
                    >
                      {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    </button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {searchResults.map((result, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectLocation(result)}
                          className="w-full text-left p-3 rounded-xl bg-ardosia border border-ouro/5 hover:border-ouro/30 transition-all group"
                        >
                          <h4 className="text-[10px] font-black uppercase italic text-ouro group-hover:text-ouro/100">{result.name}</h4>
                          <p className="text-[9px] text-pergaminho/40 truncate">{result.address}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleManualLocationSubmit}
                    className="w-full bg-ouro/10 hover:bg-ouro/20 text-ouro font-black uppercase tracking-widest py-3 rounded-xl text-[10px] transition-all"
                  >
                    Usar Texto Como Está
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleSendAlert}
          disabled={sendingAlert}
          className={`w-full py-4 rounded-2xl font-black uppercase italic tracking-tighter flex items-center justify-center gap-3 transition-all ${
            sendingAlert 
              ? 'bg-ardosia/50 text-pergaminho/30 cursor-not-allowed' 
              : 'bg-alerta hover:opacity-90 text-pergaminho shadow-lg shadow-alerta/20'
          }`}
        >
          {sendingAlert ? (
            <>
              <div className="w-4 h-4 border-2 border-pergaminho/30 border-t-transparent rounded-full animate-spin" />
              Enviando Alerta...
            </>
          ) : (
            <>
              <Share2 size={20} />
              Enviar Localização
            </>
          )}
        </button>
      </div>

      {/* Content Cards */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ouro/60">Guia de Segurança</h3>
          <button onClick={() => setActiveTab('guide')} className="text-[10px] font-black uppercase tracking-widest text-ouro hover:underline">Ver Todos</button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {cards.map((card, idx) => (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('guide')}
              className={`flex items-center justify-between p-5 rounded-3xl border ${card.color} transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-black uppercase italic leading-none">{card.title}</h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-1">{card.subtitle}</p>
                </div>
              </div>
              <ChevronRight size={20} className="opacity-50" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
