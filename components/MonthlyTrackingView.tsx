
import React, { useState, useMemo } from 'react';
import { 
  ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import type { MonthlyRecord } from '../types';
import { ArrowUpIcon, ArrowDownIcon, PiggyBankIcon, ChartBarIcon } from './Icons';
import DashboardCard from './DashboardCard';

interface MonthlyTrackingViewProps {
  data: MonthlyRecord[];
  onAddRecord: (rec: MonthlyRecord) => void;
  onDeleteRecord: (id: string) => void;
}

const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", 
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

const formatCurrency = (val: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

const InputField: React.FC<{ label: string; value: number; onChange: (val: number) => void; suffix?: string }> = ({ label, value, onChange, suffix }) => (
    <div className="flex flex-col">
      <label className="text-xs text-brand-light mb-1.5 font-medium uppercase">{label}</label>
      <div className="relative">
        <input 
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-brand-primary border border-brand-accent rounded-lg p-2.5 text-brand-text focus:ring-2 focus:ring-brand-teal focus:border-transparent transition font-mono text-sm"
        />
        {suffix && <span className="absolute right-3 top-2.5 text-brand-light text-xs">{suffix}</span>}
      </div>
    </div>
  );

const MonthlyTrackingView: React.FC<MonthlyTrackingViewProps> = ({ data, onAddRecord, onDeleteRecord }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [form, setForm] = useState({
    year: currentYear,
    month: currentMonth,
    stocksValue: 0,
    bondsValue: 0,
    pension1Value: 0,
    pension2Value: 0,
    
    investedStocks: 0,
    investedBonds: 0,
    investedPension1: 0,
    investedPension2: 0,
    
    income: 0,
    expenses: 0,
    notes: ''
  });

  // Populate form with previous data for ease of use if available
  React.useEffect(() => {
      // Find most recent record
      const sorted = [...data].sort((a,b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
      if (sorted.length > 0) {
          setForm(prev => ({
              ...prev,
              stocksValue: sorted[0].stocksValue,
              bondsValue: sorted[0].bondsValue,
              pension1Value: sorted[0].pensionFund1Value,
              pension2Value: sorted[0].pensionFund2Value,
              income: sorted[0].income,
              expenses: sorted[0].expenses,
              // Reset flows
              investedStocks: 0,
              investedBonds: 0,
              investedPension1: 0,
              investedPension2: 0,
          }));
      }
  }, []); // Run only once on mount

  const handleAdd = () => {
      const savings = form.income - form.expenses;
      const newRec: MonthlyRecord = {
          id: Date.now().toString(),
          year: form.year,
          month: form.month,
          stocksValue: form.stocksValue,
          bondsValue: form.bondsValue,
          pensionFund1Value: form.pension1Value,
          pensionFund2Value: form.pension2Value,
          
          investedStocks: form.investedStocks,
          investedBonds: form.investedBonds,
          investedPension1: form.investedPension1,
          investedPension2: form.investedPension2,

          income: form.income,
          expenses: form.expenses,
          savings: savings,
          notes: form.notes
      };
      onAddRecord(newRec);
      // Reset note only
      setForm(p => ({...p, notes: ''}));
  };

  const filteredData = useMemo(() => {
      return [...data].sort((a,b) => (a.year * 12 + a.month) - (b.year * 12 + b.month));
  }, [data]);

  const sortedDescData = useMemo(() => {
      return [...data].sort((a,b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
  }, [data]);

  // --- LOGICA MEDIE ---
  const calculateAverage = (records: MonthlyRecord[]) => {
      if (records.length === 0) return null;
      const sum = records.reduce((acc, r) => ({
          income: acc.income + r.income,
          expenses: acc.expenses + r.expenses,
          savings: acc.savings + r.savings,
          invested: acc.invested + (r.investedStocks + r.investedBonds + r.investedPension1 + r.investedPension2)
      }), { income: 0, expenses: 0, savings: 0, invested: 0 });
      
      return {
          income: sum.income / records.length,
          expenses: sum.expenses / records.length,
          savings: sum.savings / records.length,
          invested: sum.invested / records.length
      };
  };

  const averages = {
      last3: calculateAverage(sortedDescData.slice(0, 3)),
      last6: calculateAverage(sortedDescData.slice(0, 6)),
      last12: calculateAverage(sortedDescData.slice(0, 12)),
      ytd: calculateAverage(sortedDescData.filter(d => d.year === currentYear))
  };


  // Chart Data Preparation (Last 12 months)
  const chartData = filteredData.slice(-12).map(rec => ({
      name: `${MONTHS[rec.month-1].substring(0,3)} ${rec.year.toString().substring(2)}`,
      netWorth: rec.stocksValue + rec.bondsValue + rec.pensionFund1Value + rec.pensionFund2Value,
      stocks: rec.stocksValue,
      bonds: rec.bondsValue,
      pension: rec.pensionFund1Value + rec.pensionFund2Value,
      savingsRate: rec.income > 0 ? (rec.savings / rec.income) * 100 : 0,
      savings: rec.savings
  }));

  // Stats for current year
  const thisYearRecords = filteredData.filter(d => d.year === currentYear);
  const totalSavings = thisYearRecords.reduce((acc, curr) => acc + curr.savings, 0);
  const totalIncome = thisYearRecords.reduce((acc, curr) => acc + curr.income, 0);
  const avgSavingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
  
  // Market Gain Calculation Helper
  const getPerformance = (current: MonthlyRecord, prev: MonthlyRecord | undefined) => {
      if (!prev) return { abs: 0, pct: 0 };
      
      // Gain = CurrentVal - (PrevVal + NewMoney)
      const gainStocks = current.stocksValue - (prev.stocksValue + current.investedStocks);
      const gainBonds = current.bondsValue - (prev.bondsValue + current.investedBonds);
      const gainP1 = current.pensionFund1Value - (prev.pensionFund1Value + current.investedPension1);
      const gainP2 = current.pensionFund2Value - (prev.pensionFund2Value + current.investedPension2);
      
      const totalGain = gainStocks + gainBonds + gainP1 + gainP2;
      const totalStart = prev.stocksValue + prev.bondsValue + prev.pensionFund1Value + prev.pensionFund2Value;
      const totalInvested = current.investedStocks + current.investedBonds + current.investedPension1 + current.investedPension2;
      
      const returnPct = totalStart > 0 ? (totalGain / totalStart) * 100 : 0;

      return { abs: totalGain, pct: returnPct };
  };

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DashboardCard 
                title="Risparmio Totale (Anno Corr.)"
                value={formatCurrency(totalSavings)}
                icon={<PiggyBankIcon />}
                subtext="Cash Flow positivo"
                variant="success"
            />
            <DashboardCard 
                title="Savings Rate Medio (Anno Corr.)"
                value={`${avgSavingsRate.toFixed(1)}%`}
                icon={<ArrowUpIcon />}
                subtext="Obiettivo: >20%"
                variant={avgSavingsRate > 20 ? 'success' : 'default'}
            />
             <DashboardCard 
                title="Ultimo Patrimonio Netto"
                value={filteredData.length > 0 
                    ? formatCurrency(filteredData[filteredData.length-1].stocksValue + filteredData[filteredData.length-1].bondsValue + filteredData[filteredData.length-1].pensionFund1Value + filteredData[filteredData.length-1].pensionFund2Value)
                    : '-'
                }
                icon={<ArrowUpIcon />}
                subtext="Snapshot mensile"
            />
        </div>
        
        {/* TABELLA MEDIE PER SIMULAZIONE */}
        <div className="bg-brand-secondary/60 border border-brand-accent/50 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-4 flex items-center gap-2">
                <ChartBarIcon />
                Medie Mensili per Simulazione
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-brand-text text-right">
                    <thead>
                        <tr className="text-xs text-brand-light border-b border-brand-accent/20">
                            <th className="pb-2 text-left">Voce</th>
                            <th className="pb-2 px-4">Ultimi 3 Mesi</th>
                            <th className="pb-2 px-4">Ultimi 6 Mesi</th>
                            <th className="pb-2 px-4">Ultimi 12 Mesi</th>
                            <th className="pb-2 px-4 text-brand-teal">Anno Corrente (YTD)</th>
                        </tr>
                    </thead>
                    <tbody className="font-mono">
                        <tr className="border-b border-brand-accent/10">
                            <td className="py-3 text-left font-medium text-brand-light">Entrate Nette</td>
                            <td className="py-3 px-4">{averages.last3 ? formatCurrency(averages.last3.income) : '-'}</td>
                            <td className="py-3 px-4">{averages.last6 ? formatCurrency(averages.last6.income) : '-'}</td>
                            <td className="py-3 px-4">{averages.last12 ? formatCurrency(averages.last12.income) : '-'}</td>
                            <td className="py-3 px-4 text-brand-teal font-bold">{averages.ytd ? formatCurrency(averages.ytd.income) : '-'}</td>
                        </tr>
                        <tr className="border-b border-brand-accent/10">
                            <td className="py-3 text-left font-medium text-brand-light">Spese Totali</td>
                            <td className="py-3 px-4 text-red-300">{averages.last3 ? formatCurrency(averages.last3.expenses) : '-'}</td>
                            <td className="py-3 px-4 text-red-300">{averages.last6 ? formatCurrency(averages.last6.expenses) : '-'}</td>
                            <td className="py-3 px-4 text-red-300">{averages.last12 ? formatCurrency(averages.last12.expenses) : '-'}</td>
                            <td className="py-3 px-4 text-red-300 font-bold">{averages.ytd ? formatCurrency(averages.ytd.expenses) : '-'}</td>
                        </tr>
                        <tr className="border-b border-brand-accent/10 bg-brand-primary/10">
                            <td className="py-3 text-left font-medium text-brand-light">Risparmio Effettivo</td>
                            <td className="py-3 px-4 text-green-400">{averages.last3 ? formatCurrency(averages.last3.savings) : '-'}</td>
                            <td className="py-3 px-4 text-green-400">{averages.last6 ? formatCurrency(averages.last6.savings) : '-'}</td>
                            <td className="py-3 px-4 text-green-400">{averages.last12 ? formatCurrency(averages.last12.savings) : '-'}</td>
                            <td className="py-3 px-4 text-green-400 font-bold">{averages.ytd ? formatCurrency(averages.ytd.savings) : '-'}</td>
                        </tr>
                        <tr>
                            <td className="py-3 text-left font-medium text-brand-light">Nuovi Investimenti (Flusso)</td>
                            <td className="py-3 px-4 text-blue-300">{averages.last3 ? formatCurrency(averages.last3.invested) : '-'}</td>
                            <td className="py-3 px-4 text-blue-300">{averages.last6 ? formatCurrency(averages.last6.invested) : '-'}</td>
                            <td className="py-3 px-4 text-blue-300">{averages.last12 ? formatCurrency(averages.last12.invested) : '-'}</td>
                            <td className="py-3 px-4 text-blue-300 font-bold">{averages.ytd ? formatCurrency(averages.ytd.invested) : '-'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Form */}
            <div className="bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg h-fit">
                <h3 className="text-xl font-bold text-brand-text mb-4">Nuovo Record Mensile</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-xs text-brand-light mb-1.5 font-medium uppercase">Anno</label>
                            <input type="number" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})} className="bg-brand-primary border border-brand-accent rounded-lg p-2 text-brand-text" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-xs text-brand-light mb-1.5 font-medium uppercase">Mese</label>
                            <select value={form.month} onChange={e => setForm({...form, month: parseInt(e.target.value)})} className="bg-brand-primary border border-brand-accent rounded-lg p-2 text-brand-text">
                                {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="h-px bg-brand-accent/30 my-2"></div>
                    
                    {/* ASSET VALUES */}
                    <h4 className="text-xs font-bold text-brand-teal uppercase mb-2">Valore Asset (Snapshot Fine Mese)</h4>
                    <div className="grid grid-cols-2 gap-4 mb-2">
                        <InputField label="Azioni (26%)" value={form.stocksValue} onChange={v => setForm(p => ({...p, stocksValue: v}))} suffix="€" />
                        <InputField label="Obblig. (12.5%)" value={form.bondsValue} onChange={v => setForm(p => ({...p, bondsValue: v}))} suffix="€" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Fondo P. 1" value={form.pension1Value} onChange={v => setForm(p => ({...p, pension1Value: v}))} suffix="€" />
                        <InputField label="Fondo P. 2" value={form.pension2Value} onChange={v => setForm(p => ({...p, pension2Value: v}))} suffix="€" />
                    </div>

                    <div className="h-px bg-brand-accent/30 my-2"></div>
                    
                    {/* INVESTMENTS */}
                    <h4 className="text-xs font-bold text-blue-300 uppercase mb-2">Nuovi Investimenti (Quote Versate)</h4>
                    <div className="grid grid-cols-2 gap-4 mb-2">
                        <InputField label="in Azioni" value={form.investedStocks} onChange={v => setForm(p => ({...p, investedStocks: v}))} suffix="€" />
                        <InputField label="in Obblig." value={form.investedBonds} onChange={v => setForm(p => ({...p, investedBonds: v}))} suffix="€" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="in FP 1" value={form.investedPension1} onChange={v => setForm(p => ({...p, investedPension1: v}))} suffix="€" />
                        <InputField label="in FP 2" value={form.investedPension2} onChange={v => setForm(p => ({...p, investedPension2: v}))} suffix="€" />
                    </div>

                    <div className="h-px bg-brand-accent/30 my-2"></div>
                    
                    {/* CASH FLOW */}
                    <h4 className="text-xs font-bold text-brand-gold uppercase mb-2">Flussi di Cassa</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Entrate Nette" value={form.income} onChange={v => setForm(p => ({...p, income: v}))} suffix="€" />
                        <InputField label="Uscite Totali" value={form.expenses} onChange={v => setForm(p => ({...p, expenses: v}))} suffix="€" />
                    </div>
                    
                    <div className="bg-brand-primary/30 p-2 rounded text-center text-sm text-brand-light mt-2">
                        Risparmio: <span className="font-bold text-brand-text">{(form.income - form.expenses).toLocaleString('it-IT', {style:'currency', currency:'EUR'})}</span>
                        <span className="mx-2">|</span>
                        Investito: <span className="font-bold text-blue-300">{(form.investedStocks + form.investedBonds + form.investedPension1 + form.investedPension2).toLocaleString('it-IT', {style:'currency', currency:'EUR', maximumFractionDigits:0})}</span>
                    </div>
                    
                    <input 
                        type="text" 
                        placeholder="Note (opzionale)" 
                        value={form.notes}
                        onChange={e => setForm({...form, notes: e.target.value})}
                        className="w-full bg-brand-primary border border-brand-accent rounded-lg p-2 text-sm text-brand-text mt-4"
                    />

                    <button 
                        onClick={handleAdd}
                        className="w-full mt-4 bg-brand-teal hover:bg-brand-teal/80 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg"
                    >
                        Registra Mese
                    </button>
                </div>
            </div>

            {/* Graphs */}
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg h-[300px]">
                    <h3 className="text-lg font-bold text-brand-text mb-4">Andamento Patrimonio Netto (Asset Allocation)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#415A77" opacity={0.3} />
                            <XAxis dataKey="name" stroke="#778DA9" tick={{fontSize: 10}} />
                            <YAxis stroke="#778DA9" tickFormatter={(val) => `€${(val/1000).toFixed(0)}k`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1B263B', borderColor: '#415A77', color: '#E0E1DD' }}
                                formatter={(value: number) => formatCurrency(value)}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="stocks" name="Azioni" stackId="1" stroke="#26A69A" fill="#26A69A" fillOpacity={0.6} />
                            <Area type="monotone" dataKey="bonds" name="Obbligazioni" stackId="1" stroke="#415A77" fill="#415A77" fillOpacity={0.6} />
                            <Area type="monotone" dataKey="pension" name="Fondi Pensione" stackId="1" stroke="#FFC107" fill="#FFC107" fillOpacity={0.6} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                 <div className="bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg h-[300px]">
                    <h3 className="text-lg font-bold text-brand-text mb-4">Savings Rate Mensile %</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#415A77" opacity={0.3} />
                            <XAxis dataKey="name" stroke="#778DA9" tick={{fontSize: 10}} />
                            <YAxis stroke="#778DA9" unit="%" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1B263B', borderColor: '#415A77', color: '#E0E1DD' }}
                                formatter={(value: number) => `${value.toFixed(1)}%`}
                            />
                            <Bar dataKey="savingsRate" fill="#FFC107" barSize={40} radius={[4, 4, 0, 0]} />
                            <Line type="monotone" dataKey="savingsRate" stroke="#FF8A65" strokeWidth={2} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* History Table */}
        <div className="bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg overflow-x-auto">
            <h3 className="text-xl font-bold text-brand-text mb-4">Storico Dettagliato & Performance</h3>
            <table className="w-full text-sm text-left text-brand-text min-w-[1200px]">
                <thead className="text-xs text-brand-light uppercase bg-brand-primary/20">
                    <tr>
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3 text-right">Patrimonio Tot</th>
                        <th className="px-4 py-3 text-right text-brand-teal">Azioni</th>
                        <th className="px-4 py-3 text-right text-blue-300">Obblig.</th>
                        <th className="px-4 py-3 text-right text-brand-gold">Fondi P.</th>
                        <th className="px-4 py-3 text-right border-l border-brand-accent/20">Rend. Mese</th>
                        <th className="px-4 py-3 text-right">% Mese</th>
                        <th className="px-4 py-3 text-right text-green-400">Risp.</th>
                        <th className="px-4 py-3 text-center">Azioni</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.reverse().map((rec, idx) => {
                        // filteredData is now reversed (newest first) because of .map on reverse()
                        // To find 'previous' chronologically, we need next element in this reversed array
                        const prevRec = filteredData[idx + 1]; 
                        
                        const netWorth = rec.stocksValue + rec.bondsValue + rec.pensionFund1Value + rec.pensionFund2Value;
                        const performance = getPerformance(rec, prevRec);

                        return (
                            <tr key={rec.id} className="border-b border-brand-accent/10 hover:bg-brand-primary/10">
                                <td className="px-4 py-3 font-medium">{MONTHS[rec.month-1].substring(0,3)} {rec.year}</td>
                                <td className="px-4 py-3 text-right font-bold">{formatCurrency(netWorth)}</td>
                                <td className="px-4 py-3 text-right font-mono text-brand-teal/80">{formatCurrency(rec.stocksValue)}</td>
                                <td className="px-4 py-3 text-right font-mono text-blue-300/80">{formatCurrency(rec.bondsValue)}</td>
                                <td className="px-4 py-3 text-right font-mono text-brand-gold/80">{formatCurrency(rec.pensionFund1Value + rec.pensionFund2Value)}</td>
                                
                                <td className={`px-4 py-3 text-right font-mono border-l border-brand-accent/20 ${performance.abs >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {prevRec ? (performance.abs > 0 ? '+' : '') + formatCurrency(performance.abs) : '-'}
                                </td>
                                <td className={`px-4 py-3 text-right font-mono ${performance.pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {prevRec ? (performance.pct > 0 ? '+' : '') + performance.pct.toFixed(2) + '%' : '-'}
                                </td>

                                <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(rec.savings)}</td>
                                <td className="px-4 py-3 text-center">
                                    <button onClick={() => onDeleteRecord(rec.id)} className="text-red-400 hover:text-red-300">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {filteredData.length === 0 && (
                        <tr><td colSpan={9} className="text-center py-4 text-brand-light italic">Nessun dato mensile inserito</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default MonthlyTrackingView;
