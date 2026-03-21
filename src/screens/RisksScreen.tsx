import React, { useEffect, useState } from 'react';
import { MapPin, AlertTriangle, Shield, ChevronRight, Info } from 'lucide-react';
import { motion } from 'motion/react';

const RisksScreen: React.FC = () => {
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
          <h3 className="text-sm font-bold uppercase tracking-wide text-ouro">São Paulo, SP</h3>
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

      {/* Community Reports (Monetization Concept) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-ciano">Relatos da Comunidade</h3>
          <span className="bg-ciano/10 text-ciano px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Beta</span>
        </div>
        
        <div className="bg-ardosia border border-ciano/10 rounded-3xl p-6 space-y-4">
          <div className="flex gap-4 items-start border-b border-white/5 pb-4">
            <div className="w-8 h-8 bg-ciano/10 rounded-full flex items-center justify-center text-ciano shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-ciano">Há 15 min</span>
                <span className="text-[8px] font-bold text-pergaminho/20 uppercase">A 500m de você</span>
              </div>
              <p className="text-xs font-bold text-pergaminho">Tentativa de furto na Av. Paulista</p>
              <p className="text-[10px] text-pergaminho/40">Indivíduo em bicicleta abordando pedestres próximo ao metrô.</p>
            </div>
          </div>
          
          <button className="w-full py-3 bg-ciano/5 border border-ciano/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-ciano hover:bg-ciano/10 transition-all">
            Reportar Incidente
          </button>
        </div>
      </div>
    </div>
  );
};

export default RisksScreen;
