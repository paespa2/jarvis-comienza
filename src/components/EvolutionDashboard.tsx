import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, Activity, Zap, Shield, Target, Dna, GitFork, ArrowUpRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface Genome {
  generationId: string;
  mutationVector: {
    aggressiveness: number;
    caution: number;
    predictivity: number;
    loyalty: number;
  };
  metrics: {
    totalActionsEvaluated: number;
    loyaltyScoreAverage: number;
    executionRate: number;
    successRate: number;
  };
}

interface EvolutionStats {
  totalDecisions: number;
  executionRate: number;
  averageLoyalty: number;
  decisionsByType: Record<string, number>;
}

interface RecentDecision {
  actionId: string;
  score: number;
  decision: "EXECUTE" | "MUTATE" | "REJECT";
  executed: boolean;
  timestamp: string;
}

export const EvolutionDashboard: React.FC = () => {
  const [data, setData] = useState<{
    currentGeneration: string;
    mutationVector: Genome['mutationVector'];
    metrics: Genome['metrics'];
    evolutionStats: EvolutionStats;
    recentDecisions: RecentDecision[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/evolution');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error("Failed to fetch evolution data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) return <div className="p-4 text-gray-500 animate-pulse text-xs">Sincronizando Cerebro Soberano...</div>;

  const { currentGeneration, mutationVector, metrics, evolutionStats, recentDecisions } = data;

  return (
    <div className="flex flex-col gap-6 p-4 h-full overflow-y-auto custom-scrollbar bg-black/20">
      {/* Genoma Actual */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] text-gray-500 tracking-[0.2em] uppercase font-bold">Estado del Genoma</h3>
          <div className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-[9px] text-cyan-400 font-bold uppercase">
            {currentGeneration}
          </div>
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Dna className="w-12 h-12" />
          </div>
          
          <div className="space-y-4 relative z-10">
            {[
              { label: 'Aggressiveness', value: mutationVector.aggressiveness, color: 'bg-red-500' },
              { label: 'Caution', value: mutationVector.caution, color: 'bg-blue-500' },
              { label: 'Predictivity', value: mutationVector.predictivity, color: 'bg-emerald-500' },
              { label: 'Loyalty', value: mutationVector.loyalty, color: 'bg-fuchsia-500' }
            ].map((attr) => (
              <div key={attr.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{attr.label}</span>
                  <span className="text-[10px] text-white font-mono">{(attr.value * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${attr.value * 100}%` }}
                    className={cn("h-full", attr.color)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Decisiones Recientes del LEE */}
      <section>
        <h3 className="text-[10px] text-gray-500 tracking-[0.2em] uppercase font-bold mb-4">Decisiones del LEE</h3>
        <div className="space-y-2">
          {recentDecisions.map((dec, i) => (
            <div key={i} className="p-2 bg-white/5 border border-white/5 rounded flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  dec.decision === 'EXECUTE' ? "bg-emerald-500" : dec.decision === 'MUTATE' ? "bg-fuchsia-500" : "bg-red-500"
                )} />
                <span className="text-[9px] text-gray-300 font-mono truncate max-w-[120px]">{dec.actionId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-white">{dec.score.toFixed(0)}%</span>
                <span className={cn(
                  "text-[8px] px-1 rounded font-bold",
                  dec.decision === 'EXECUTE' ? "bg-emerald-500/20 text-emerald-400" : 
                  dec.decision === 'MUTATE' ? "bg-fuchsia-500/20 text-fuchsia-400" : 
                  "bg-red-500/20 text-red-400"
                )}>
                  {dec.decision}
                </span>
              </div>
            </div>
          ))}
          {recentDecisions.length === 0 && (
            <div className="text-[10px] text-gray-600 italic text-center py-4">No hay decisiones registradas aún.</div>
          )}
        </div>
      </section>

      {/* Métricas de Ejecución */}
      <section>
        <h3 className="text-[10px] text-gray-500 tracking-[0.2em] uppercase font-bold mb-4">Métricas de Soberanía</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
            <Activity className="w-3 h-3 text-cyan-500 mb-2" />
            <p className="text-[8px] text-gray-500 uppercase font-bold">Lealtad Media</p>
            <p className="text-lg font-bold tracking-tight text-white">{evolutionStats.averageLoyalty.toFixed(1)}%</p>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
            <Shield className="w-3 h-3 text-emerald-500 mb-2" />
            <p className="text-[8px] text-gray-500 uppercase font-bold">Tasa Ejecución</p>
            <p className="text-lg font-bold tracking-tight text-white">{evolutionStats.executionRate.toFixed(1)}%</p>
          </div>
        </div>
        
        <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-3 h-3 text-orange-500" />
            <span className="text-[8px] text-gray-500 uppercase font-bold">Total Decisiones</span>
            <span className="text-[10px] font-bold text-white">{evolutionStats.totalDecisions}</span>
          </div>
          <div className="flex gap-1 h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="bg-emerald-500" style={{ width: `${(evolutionStats.decisionsByType.EXECUTE / evolutionStats.totalDecisions) * 100}%` }} />
            <div className="bg-fuchsia-500" style={{ width: `${(evolutionStats.decisionsByType.MUTATE / evolutionStats.totalDecisions) * 100}%` }} />
            <div className="bg-red-500" style={{ width: `${(evolutionStats.decisionsByType.REJECT / evolutionStats.totalDecisions) * 100}%` }} />
          </div>
        </div>
      </section>
    </div>
  );
};
