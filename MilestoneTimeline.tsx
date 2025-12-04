
import React from 'react';
import type { ActualRecord } from '../types';
import { FlagIcon } from './Icons';

interface MilestoneTimelineProps {
  data: ActualRecord[];
  fireNumber: number;
}

const MILESTONES = [
  { value: 50000, label: "Primi 50k" },
  { value: 100000, label: "100k Club" },
  { value: 250000, label: "Quarto di Milione" },
  { value: 500000, label: "Mezzo Milione" },
  { value: 1000000, label: "Millionaire" },
  { value: 2000000, label: "Multi-Millionaire" },
];

const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({ data, fireNumber }) => {
  // Merge custom FIRE number into milestones if not too close to existing ones
  const allMilestones = [...MILESTONES];
  
  // Add FIRE milestone if unique
  if (!allMilestones.some(m => Math.abs(m.value - fireNumber) < 10000)) {
      allMilestones.push({ value: fireNumber, label: "🔥 FIRE Raggiunto" });
  }

  // Sort by value
  allMilestones.sort((a, b) => a.value - b.value);

  // Sort Data by Year Ascending
  const sortedData = [...data].sort((a, b) => a.year - b.year);

  const reachedMilestones = allMilestones.map(m => {
      // Find first year where totalWealth >= value
      const found = sortedData.find(rec => rec.totalWealth >= m.value);
      return {
          ...m,
          year: found ? found.year : null,
          reached: !!found
      };
  }).filter(m => m.reached);

  if (reachedMilestones.length === 0) return null;

  return (
    <div className="bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-brand-text mb-6 flex items-center">
        <FlagIcon />
        <span className="ml-2">Pietre Miliari Raggiunte</span>
      </h3>
      
      <div className="relative border-l-2 border-brand-accent/30 ml-3 space-y-8">
        {reachedMilestones.map((m, idx) => (
          <div key={idx} className="relative pl-8">
            {/* Dot */}
            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-brand-secondary ${
                m.value === fireNumber ? 'bg-red-500' : 
                m.value >= 1000000 ? 'bg-brand-gold' : 'bg-brand-teal'
            }`}></div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-brand-primary/20 p-3 rounded-lg border border-brand-accent/10 hover:border-brand-teal/50 transition-colors">
                <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                        m.value === fireNumber ? 'text-red-400' : 'text-brand-light'
                    }`}>
                        Raggiunto nel {m.year}
                    </span>
                    <h4 className="text-lg font-bold text-brand-text mt-1">{m.label}</h4>
                </div>
                <div className="text-2xl font-mono font-bold text-brand-text mt-2 sm:mt-0">
                    {m.value.toLocaleString('it-IT', {style:'currency', currency:'EUR', maximumFractionDigits: 0})}
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MilestoneTimeline;
