
import React from 'react';
import type { SimulationYear } from '../types';

interface SimulationTableProps {
  data: SimulationYear[];
}

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

const formatNumber = (val: number) => val.toFixed(2).replace('.', ',');

const getPhaseLabel = (phase: SimulationYear['phase']) => {
  switch(phase) {
    case 'accumulation': return 'Accumulo';
    case 'naspi': return 'NASpI';
    case 'rita_bridge': return 'RITA (Ponte)';
    case 'fire_withdraw': return 'FIRE (Prelievo)';
    case 'pension': return 'Pensione INPS';
    default: return phase;
  }
};

const SimulationTable: React.FC<SimulationTableProps> = ({ data }) => {
  
  const downloadCSV = () => {
    const headers = [
      "Età", "Anno", "Fase", 
      "Portafoglio (€)", "Fondo Pensione 1 (€)", "Fondo Pensione 2 (€)", 
      "Spese Vita (€)", "Mutuo (€)", "Extra (€)", "Totale Uscite (€)", 
      "Entrate N+R+I (€)", "Entrate Extra (€)", "Prelievo Portafoglio Netto (€)", "Tasse Pagate (€)"
    ];

    const rows = data.map(row => [
      row.age,
      row.year,
      getPhaseLabel(row.phase),
      formatNumber(row.portfolioValue),
      formatNumber(row.pensionFund1Value),
      formatNumber(row.pensionFund2Value),
      formatNumber(row.livingExpensesAdjusted),
      formatNumber(row.mortgageExpense),
      formatNumber(row.extraExpenses),
      formatNumber(row.totalExpenses),
      formatNumber(row.incomeNaspi + row.incomeRita + row.incomeInps),
      formatNumber(row.extraIncome),
      formatNumber(row.withdrawalPortfolioNet),
      formatNumber(row.taxesPaid)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fire_simulation_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h3 className="text-xl font-bold text-brand-text flex items-center">
            <span className="w-2 h-8 bg-brand-accent rounded mr-3"></span>
            Dettaglio Annuale
        </h3>
        <button 
            onClick={downloadCSV}
            className="text-sm bg-brand-primary hover:bg-brand-accent border border-brand-accent text-brand-text px-4 py-2 rounded-lg transition-colors flex items-center"
        >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Scarica Excel (CSV)
        </button>
      </div>
      
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-brand-accent scrollbar-track-transparent pb-2">
        <table className="w-full text-sm text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="text-xs text-brand-light uppercase tracking-wider border-b border-brand-accent/50">
              <th className="px-4 py-3 font-medium">Età</th>
              <th className="px-4 py-3 font-medium">Anno</th>
              <th className="px-4 py-3 font-medium">Fase</th>
              <th className="px-4 py-3 font-medium text-right text-brand-teal">Portafoglio</th>
              <th className="px-4 py-3 font-medium text-right text-brand-gold">Fondo P. 1</th>
              <th className="px-4 py-3 font-medium text-right text-orange-300">Fondo P. 2</th>
              <th className="px-4 py-3 font-medium text-right text-red-300">Spese Vita</th>
              <th className="px-4 py-3 font-medium text-right text-orange-300">Mutuo</th>
              <th className="px-4 py-3 font-medium text-right text-red-200">Extra Out</th>
              <th className="px-4 py-3 font-medium text-right text-red-400 border-r border-brand-accent/30">Tot. Uscite</th>
              <th className="px-4 py-3 font-medium text-right bg-brand-primary/20">Entrate (N+R+I)</th>
              <th className="px-4 py-3 font-medium text-right text-green-200">Extra In</th>
              <th className="px-4 py-3 font-medium text-right text-brand-teal">Prelievo (Netto)</th>
              <th className="px-4 py-3 font-medium text-right text-brand-light">Tasse</th>
            </tr>
          </thead>
          <tbody className="text-brand-text font-mono">
            {data.map((row) => {
              const totalIncome = row.incomeNaspi + row.incomeRita + row.incomeInps;
              const isAccumulation = row.phase === 'accumulation';

              return (
                <tr 
                  key={row.age} 
                  className={`border-b border-brand-accent/10 hover:bg-brand-primary/30 transition-colors ${row.isFailed ? 'bg-red-900/20' : ''}`}
                >
                  <td className="px-4 py-3 font-bold">{row.age}</td>
                  <td className="px-4 py-3 text-brand-light">{row.year}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`px-2 py-1 rounded-full border border-white/5 
                      ${row.phase === 'accumulation' ? 'bg-green-900/20 text-green-200' : ''}
                      ${row.phase === 'naspi' ? 'bg-red-900/20 text-red-200' : ''}
                      ${row.phase === 'rita_bridge' ? 'bg-yellow-900/20 text-yellow-200' : ''}
                      ${row.phase === 'pension' ? 'bg-blue-900/20 text-blue-200' : ''}
                      ${row.phase === 'fire_withdraw' ? 'bg-gray-700/20 text-gray-300' : ''}
                    `}>
                      {getPhaseLabel(row.phase)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{formatCurrency(row.portfolioValue)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(row.pensionFund1Value)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(row.pensionFund2Value)}</td>
                  <td className="px-4 py-3 text-right text-red-300/80">{formatCurrency(row.livingExpensesAdjusted)}</td>
                  <td className="px-4 py-3 text-right text-orange-300/80">
                    {row.mortgageExpense > 0 ? formatCurrency(row.mortgageExpense) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-red-200/80">
                    {row.extraExpenses > 0 ? formatCurrency(row.extraExpenses) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-red-400 font-bold border-r border-brand-accent/30">{formatCurrency(row.totalExpenses)}</td>
                  <td className="px-4 py-3 text-right bg-brand-primary/20">
                    {!isAccumulation && totalIncome > 0 ? formatCurrency(totalIncome) : '-'}
                    {!isAccumulation && (
                        <div className="text-[10px] text-brand-light flex justify-end gap-1 opacity-70">
                           {row.incomeNaspi > 0 && <span title="NASpI">N</span>}
                           {row.incomeRita > 0 && <span title="RITA">R</span>}
                           {row.incomeInps > 0 && <span title="INPS">I</span>}
                        </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-green-200/80">
                    {row.extraIncome > 0 ? formatCurrency(row.extraIncome) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {!isAccumulation && row.withdrawalPortfolioNet > 0 ? formatCurrency(row.withdrawalPortfolioNet) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-brand-light text-xs">
                    {row.taxesPaid > 0 ? formatCurrency(row.taxesPaid) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-xs text-brand-light text-center">
        * Spese Vita rivalutate inflazione. Mutuo tasso fisso. Extra Out/In = Eventi Straordinari.
      </div>
    </div>
  );
};

export default SimulationTable;
