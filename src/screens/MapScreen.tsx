import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Lock, Map as MapIcon } from 'lucide-react';
import { useAuth } from '../AuthContext';
import OfflineMap from '../components/OfflineMap';

interface MapScreenProps {
  onBack: () => void;
}

const MapScreen: React.FC<MapScreenProps> = ({ onBack }) => {
  const { isPro } = useAuth();
  
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string>('Localização Desconhecida');

  useEffect(() => {
    try {
      const cachedLoc = localStorage.getItem('last_known_location');
      if (cachedLoc) {
        const parsedLoc = JSON.parse(cachedLoc);
        if (parsedLoc.coords) {
          const [latStr, lngStr] = parsedLoc.coords.split(',');
          const parsedLat = parseFloat(latStr);
          const parsedLng = parseFloat(lngStr);
          
          if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            setLat(parsedLat);
            setLng(parsedLng);
            setLocationName(parsedLoc.address || 'Sua Localização');
          }
        }
      }
    } catch (e) {
      console.error("Error loading cached location for map", e);
    }
  }, []);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-ardosia border border-ouro/10 rounded-xl flex items-center justify-center text-pergaminho hover:text-ouro transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter text-ouro">MAPA OFFLINE</h1>
          <p className="text-pergaminho/60 text-xs font-medium mt-1">
            Navegação segura sem internet
          </p>
        </div>
      </div>

      {!isPro ? (
        <div className="bg-ardosia border border-ouro/10 rounded-3xl p-8 text-center space-y-4 relative overflow-hidden mt-8">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-obsidiana/80 pointer-events-none" />
          <div className="w-16 h-16 bg-ouro/10 rounded-2xl flex items-center justify-center text-ouro mx-auto relative z-10">
            <Lock size={32} />
          </div>
          <div className="relative z-10 space-y-2">
            <h4 className="text-lg font-black italic tracking-tighter text-pergaminho uppercase">Recurso Exclusivo PRO</h4>
            <p className="text-sm text-pergaminho/60 leading-relaxed max-w-xs mx-auto">
              Desbloqueie o acesso a mapas offline da sua região. Ideal para áreas sem cobertura de celular ou situações de emergência.
            </p>
          </div>
          <button className="w-full max-w-xs mx-auto bg-ouro text-obsidiana font-black uppercase tracking-widest text-xs py-4 rounded-2xl relative z-10 hover:bg-yellow-500 transition-colors mt-4">
            Fazer Upgrade
          </button>
        </div>
      ) : lat !== null && lng !== null ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <OfflineMap lat={lat} lng={lng} locationName={locationName} />
        </motion.div>
      ) : (
        <div className="bg-ardosia border border-ouro/10 rounded-3xl p-8 text-center space-y-4 mt-8">
          <div className="w-16 h-16 bg-obsidiana/50 rounded-2xl flex items-center justify-center text-pergaminho/30 mx-auto">
            <MapIcon size={32} />
          </div>
          <p className="text-sm font-bold text-pergaminho/60">
            Localização não encontrada. Volte para a tela inicial e permita o acesso ao GPS para carregar o mapa.
          </p>
        </div>
      )}
    </div>
  );
};

export default MapScreen;
