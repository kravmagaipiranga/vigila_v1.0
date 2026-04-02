import React, { useEffect, useState } from 'react';
import { MapPin, AlertTriangle, Shield, ChevronRight, Info, Loader2, Clock, Satellite, CloudRain, Activity, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Incident } from '../types';
import { generateRiskAssessment, RiskAssessment } from '../services/geminiService';
import { useAuth } from '../AuthContext';

const RisksScreen: React.FC = () => {
  const { isPro } = useAuth();
  
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [assessing, setAssessing] = useState(false);
  const [assessError, setAssessError] = useState<string | null>(null);

  // Auto-load cached assessment if available
  useEffect(() => {
    if (!isPro) return;

    try {
      const cachedLoc = localStorage.getItem('last_known_location');
      if (cachedLoc) {
        const parsedLoc = JSON.parse(cachedLoc);
        if (parsedLoc.coords) {
          const [latStr, lngStr] = parsedLoc.coords.split(',');
          const lat = parseFloat(latStr);
          const lng = parseFloat(lngStr);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            // Check if we have a cached assessment for these coordinates
            const cacheKey = `risk_${lat.toFixed(3)}_${lng.toFixed(3)}`;
            const cachedAssessment = localStorage.getItem(cacheKey);
            
            if (cachedAssessment) {
              const parsedAssessment = JSON.parse(cachedAssessment);
              // If cache is valid (less than 24h old), load it immediately
              if (Date.now() - parsedAssessment.timestamp < 24 * 60 * 60 * 1000) {
                setAssessment(parsedAssessment.data);
              }
            }
          }
        }
      }
    } catch (e) {
      // Ignore cache errors
    }
  }, [isPro]);

  const handleAssessRisk = () => {
    setAssessing(true);
    setAssessError(null);

    // First try to use the last known location from cache to avoid waiting for GPS if possible
    try {
      const cachedLoc = localStorage.getItem('last_known_location');
      if (cachedLoc) {
        const parsedLoc = JSON.parse(cachedLoc);
        if (parsedLoc.coords && Date.now() - parsedLoc.timestamp < 24 * 60 * 60 * 1000) {
          const [latStr, lngStr] = parsedLoc.coords.split(',');
          const lat = parseFloat(latStr);
          const lng = parseFloat(lngStr);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            generateRiskAssessment(lat, lng)
              .then(result => setAssessment(result))
              .catch(err => {
                console.error(err);
                setAssessError("Falha ao gerar a avaliação de risco. Tente novamente.");
              })
              .finally(() => setAssessing(false));
            return; // Exit early since we used cached location
          }
        }
      }
    } catch (e) {
      // Ignore cache errors and fallback to GPS
    }

    if (!navigator.geolocation) {
      setAssessError("Geolocalização não é suportada pelo seu navegador.");
      setAssessing(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const result = await generateRiskAssessment(latitude, longitude);
          setAssessment(result);
        } catch (err) {
          console.error(err);
          setAssessError("Falha ao gerar a avaliação de risco. Tente novamente.");
        } finally {
          setAssessing(false);
        }
      },
      (err) => {
        console.error(err);
        setAssessError("Não foi possível obter sua localização. Verifique as permissões.");
        setAssessing(false);
      }
    );
  };

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const q = query(
          collection(db, 'incidents'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const querySnapshot = await getDocs(q);
        const fetchedIncidents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Incident[];
        setIncidents(fetchedIncidents);
      } catch (error) {
        console.error('Error fetching incidents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Agora mesmo';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Há ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Há ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Há ${diffInDays} dias`;
  };

  const getIncidentColor = (type: string) => {
    const highSeverity = [
      'Crimes Contra o Patrimônio (Roubos e Furtos)',
      'Roubo de Celular',
      'Furto por Distração (Pickpocketing)',
      'Arrastões',
      'Violência ou Abordagens Agressivas',
      'Assalto à Mão Armada',
      'Violência contra transeuntes',
      'Roubo de veículos',
      'Incêndio',
      'Ação de Gangues',
      'Risco alto de sequestro',
      'Assalto a veículos',
      'Desastres naturais'
    ];

    const mediumSeverity = [
      'Riscos de Trânsito e Mobilidade',
      'Atropelamentos',
      'Acidentes de Bicicleta/Moto',
      'Rotas Obstruídas',
      'Iluminação Precária ou Inexistente',
      'Área de risco para emergências naturais',
      'Atividade Suspeita'
    ];

    if (highSeverity.includes(type)) {
      return 'text-alerta bg-alerta/10 border-alerta/20';
    }
    if (mediumSeverity.includes(type)) {
      return 'text-ouro bg-ouro/10 border-ouro/20';
    }
    return 'text-ciano bg-ciano/10 border-ciano/20';
  };

  const getIncidentIconColor = (type: string) => {
    const highSeverity = [
      'Crimes Contra o Patrimônio (Roubos e Furtos)',
      'Roubo de Celular',
      'Furto por Distração (Pickpocketing)',
      'Arrastões',
      'Violência ou Abordagens Agressivas',
      'Assalto à Mão Armada',
      'Violência contra transeuntes',
      'Roubo de veículos',
      'Incêndio',
      'Ação de Gangues',
      'Risco alto de sequestro',
      'Assalto a veículos',
      'Desastres naturais'
    ];

    const mediumSeverity = [
      'Riscos de Trânsito e Mobilidade',
      'Atropelamentos',
      'Acidentes de Bicicleta/Moto',
      'Rotas Obstruídas',
      'Iluminação Precária ou Inexistente',
      'Área de risco para emergências naturais',
      'Atividade Suspeita'
    ];

    if (highSeverity.includes(type)) {
      return 'text-alerta';
    }
    if (mediumSeverity.includes(type)) {
      return 'text-ouro';
    }
    return 'text-ciano';
  };
  const risks = [
    { title: 'Roubos em SP', description: 'Aumento de furtos de celulares em áreas centrais e transporte público.', tip: 'Evite usar o celular em locais abertos e mantenha a bolsa à frente do corpo.', severity: 'high' },
    { title: 'Golpes Digitais', description: 'Crescimento de golpes via aplicativos de mensagem e links falsos.', tip: 'Nunca compartilhe códigos de verificação e desconfie de ofertas excessivamente boas.', severity: 'medium' },
    { title: 'Segurança Noturna', description: 'Áreas com baixa iluminação apresentam maior risco de abordagens.', tip: 'Planeje rotas bem iluminadas e evite caminhar sozinho tarde da noite.', severity: 'medium' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-ciano text-[10px] font-black uppercase tracking-[0.2em]">Inteligência Local</h2>
        <h1 className="text-3xl font-black tracking-tighter italic text-pergaminho">RISCOS LOCAIS</h1>
      </div>

      <div className="bg-ardosia border border-ouro/10 rounded-3xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-ouro/10 rounded-2xl flex items-center justify-center text-ouro">
          <MapPin size={24} />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-ouro">Ipiranga, São Paulo</h3>
          <p className="text-pergaminho/40 text-xs font-medium">Baseado em dados recentes da região.</p>
        </div>
      </div>

      <div className="space-y-4">
        {risks.map((risk, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-ardosia border border-ouro/10 rounded-3xl p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${risk.severity === 'high' ? 'bg-alerta' : 'bg-ouro'}`} />
                <h4 className="text-lg font-black tracking-tighter italic uppercase text-pergaminho">{risk.title}</h4>
              </div>
              <AlertTriangle size={20} className={risk.severity === 'high' ? 'text-alerta' : 'text-ouro'} />
            </div>
            
            <p className="text-pergaminho/60 text-sm leading-relaxed">
              {risk.description}
            </p>

            <div className="bg-obsidiana rounded-2xl p-4 border border-ouro/5 flex gap-3">
              <div className="text-esmeralda mt-0.5">
                <Shield size={16} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-esmeralda">Dica de Prevenção</span>
                <p className="text-xs text-pergaminho/80 font-medium">{risk.tip}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-4 bg-ardosia/50 rounded-2xl border border-ouro/5 flex items-center gap-3">
        <Info size={16} className="text-ciano" />
        <p className="text-[10px] font-bold text-pergaminho/30 uppercase tracking-widest leading-tight">
          Estes dados são baseados em estatísticas públicas e relatos da comunidade. Mantenha-se sempre alerta.
        </p>
      </div>

      {/* Avaliação Avançada */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ciano">Avaliação Avançada (GFDRR)</h3>
          {!isPro && (
            <span className="bg-ouro/10 text-ouro px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
              <Lock size={8} /> PRO
            </span>
          )}
        </div>

        {!isPro ? (
          <div className="bg-ardosia border border-ouro/10 rounded-3xl p-6 text-center space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-obsidiana/80 pointer-events-none" />
            <div className="w-12 h-12 bg-ouro/10 rounded-2xl flex items-center justify-center text-ouro mx-auto relative z-10">
              <Lock size={24} />
            </div>
            <div className="relative z-10 space-y-2">
              <h4 className="text-sm font-bold text-pergaminho">Recurso Exclusivo PRO</h4>
              <p className="text-xs text-pergaminho/60 leading-relaxed">
                Desbloqueie análises detalhadas de riscos climáticos, dados de satélite e histórico de desastres naturais num raio de 20km.
              </p>
            </div>
            <button className="w-full bg-ouro text-obsidiana font-black uppercase tracking-widest text-xs py-3 rounded-2xl relative z-10 hover:bg-ouro/90 transition-colors">
              Fazer Upgrade
            </button>
          </div>
        ) : (
          <>
            {!assessment && !assessing && (
              <button
                onClick={handleAssessRisk}
                className="w-full bg-ciano/10 text-ciano border border-ciano/20 rounded-3xl p-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-ciano/20 transition-colors"
              >
                <Satellite size={16} />
                Analisar Riscos Locais (20km)
              </button>
            )}

            {assessing && (
              <div className="bg-ardosia border border-ouro/10 rounded-3xl p-8 text-center space-y-3">
                <Loader2 className="animate-spin text-ciano mx-auto" size={32} />
                <p className="text-sm font-bold text-pergaminho/60">Analisando dados de satélite e clima...</p>
              </div>
            )}

            {assessError && (
              <div className="bg-alerta/10 border border-alerta/20 rounded-3xl p-4 text-alerta text-sm font-medium text-center">
                {assessError}
              </div>
            )}

            {assessment && !assessing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-ardosia border border-ouro/10 rounded-3xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-black tracking-tighter italic uppercase text-pergaminho">Índice Geral</h4>
                    <span className={`text-2xl font-black ${assessment.overallRiskScore > 60 ? 'text-alerta' : assessment.overallRiskScore > 30 ? 'text-ouro' : 'text-esmeralda'}`}>
                      {assessment.overallRiskScore}/100
                    </span>
                  </div>
                  <p className="text-pergaminho/60 text-sm leading-relaxed">
                    Local: {assessment.locationName}
                  </p>
                </div>

                {assessment.currentWarnings.length > 0 && (
                  <div className="bg-alerta/10 border border-alerta/20 rounded-3xl p-6 space-y-4">
                    <h4 className="text-sm font-black tracking-widest uppercase text-alerta flex items-center gap-2">
                      <AlertTriangle size={16} /> Avisos Atuais
                    </h4>
                    {assessment.currentWarnings.map((w, i) => (
                      <div key={i} className="space-y-1">
                        <p className="text-alerta font-bold text-sm">{w.type} ({w.severity})</p>
                        <p className="text-alerta/80 text-xs">{w.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-ardosia border border-ouro/10 rounded-3xl p-6 space-y-4">
                  <h4 className="text-sm font-black tracking-widest uppercase text-ciano flex items-center gap-2">
                    <CloudRain size={16} /> Riscos Climáticos
                  </h4>
                  {assessment.climateRisks.map((r, i) => (
                    <div key={i} className="space-y-1 border-b border-ouro/5 pb-3 last:border-0 last:pb-0">
                      <p className="text-pergaminho font-bold text-sm">{r.risk}</p>
                      <p className="text-pergaminho/60 text-xs">{r.description}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] bg-obsidiana px-2 py-0.5 rounded text-pergaminho/50">Probabilidade: {r.probability}</span>
                        <span className="text-[10px] bg-obsidiana px-2 py-0.5 rounded text-pergaminho/50">Impacto: {r.impact}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-ardosia border border-ouro/10 rounded-3xl p-6 space-y-4">
                  <h4 className="text-sm font-black tracking-widest uppercase text-ouro flex items-center gap-2">
                    <Activity size={16} /> Histórico de Desastres
                  </h4>
                  {assessment.naturalDisasters.map((d, i) => (
                    <div key={i} className="space-y-1 border-b border-ouro/5 pb-3 last:border-0 last:pb-0">
                      <p className="text-pergaminho font-bold text-sm">{d.event} <span className="text-[10px] font-normal text-pergaminho/50">({d.historicalFrequency})</span></p>
                      <p className="text-pergaminho/60 text-xs">{d.description}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-ardosia border border-ouro/10 rounded-3xl p-6 space-y-4">
                  <h4 className="text-sm font-black tracking-widest uppercase text-esmeralda flex items-center gap-2">
                    <Satellite size={16} /> Dados de Satélite
                  </h4>
                  {assessment.satelliteData.map((s, i) => (
                    <div key={i} className="space-y-1 border-b border-ouro/5 pb-3 last:border-0 last:pb-0">
                      <p className="text-pergaminho font-bold text-sm">{s.observation}</p>
                      <p className="text-pergaminho/60 text-xs">{s.details}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Community Reports */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ciano">Relatos da Comunidade</h3>
          <span className="bg-ciano/10 text-ciano px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Tempo Real</span>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-ciano" size={24} />
          </div>
        ) : incidents.length > 0 ? (
          <div className="space-y-3">
            {incidents.map((incident) => (
              <motion.div 
                key={incident.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-ardosia border rounded-3xl p-5 space-y-3 ${getIncidentColor(incident.type)}`}
              >
                <div className="flex gap-4 items-start">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-obsidiana/50 ${getIncidentIconColor(incident.type)}`}>
                    <AlertTriangle size={20} />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className={`text-xs font-black uppercase tracking-wide truncate ${getIncidentIconColor(incident.type)}`}>
                        {incident.type}
                      </h4>
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-1 shrink-0">
                        <Clock size={10} />
                        {formatTimeAgo(incident.createdAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-[10px] font-medium opacity-80 truncate">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{incident.locationName}</span>
                    </div>
                    
                    {incident.description && (
                      <p className="text-xs text-pergaminho/80 mt-2 leading-relaxed bg-obsidiana/30 p-3 rounded-xl border border-white/5">
                        {incident.description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-ardosia border border-ouro/10 rounded-3xl p-8 text-center space-y-3">
            <Shield size={32} className="text-ouro/40 mx-auto" />
            <p className="text-sm font-bold text-pergaminho/60">Nenhum incidente reportado recentemente.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RisksScreen;
