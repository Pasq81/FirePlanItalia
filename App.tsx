
import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import DashboardCard from './components/DashboardCard';
import CollapsiblePanel from './components/CollapsiblePanel';
import { WealthEvolutionChart, IncomeStackChart, ComparisonChart } from './components/Charts';
import SimulationTable from './components/SimulationTable';
import { WalletIcon, PiggyBankIcon, ChartBarIcon, ExclamationTriangleIcon, ArrowUpIcon, ChevronDownIcon, ArrowDownIcon, FlagIcon } from './components/Icons';
import type { UserProfile, Financials, AssetAllocation, Returns, ItalianTools, ActualRecord, OneTimeEvent, MonthlyRecord, BackupData, Category } from './types';
import { runSimulation } from './simulation';
import MonthlyTrackingView from './components/MonthlyTrackingView';
import DataManagement from './components/DataManagement';
import MilestoneTimeline from './components/MilestoneTimeline';
import InputField from './components/InputField';

const Checkbox: React.FC<{
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  description?: string;
}> = ({ label, checked, onChange, description }) => (
  <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-brand-primary/50 transition cursor-pointer" onClick={() => onChange(!checked)}>
    <div className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-brand-teal border-brand-teal' : 'border-brand-light bg-transparent'}`}>
      {checked && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
    </div>
    <div>
      <p className="text-brand-text font-medium text-sm">{label}</p>
      {description && <p className="text-brand-light text-xs mt-1">{description}</p>}
    </div>
  </div>
);

// --- DEFAULT CATEGORIES ---
const DEFAULT_CATEGORIES: Category[] = [
    { id: 'salary', label: 'Stipendio', type: 'income', color: '#4CAF50' },
    { id: 'bonus', label: 'Bonus/Extra', type: 'income', color: '#8BC34A' },
    { id: 'rents', label: 'Rendite', type: 'income', color: '#CDDC39' },
    { id: 'other_inc', label: 'Altro Entrate', type: 'income', color: '#FFEB3B' },
    
    { id: 'home', label: 'Casa/Affitto', type: 'expense', color: '#FF8A65' },
    { id: 'groceries', label: 'Spesa', type: 'expense', color: '#FFC107' },
    { id: 'transport', label: 'Trasporti', type: 'expense', color: '#415A77' },
    { id: 'leisure', label: 'Svago', type: 'expense', color: '#BA68C8' },
    { id: 'utilities', label: 'Bollette', type: 'expense', color: '#26A69A' },
    { id: 'health', label: 'Salute', type: 'expense', color: '#EF5350' },
    { id: 'other_exp', label: 'Altro Uscite', type: 'expense', color: '#BDBDBD' },
];

// --- TRACKING COMPONENT ---
const TrackingView: React.FC<{
    actualData: ActualRecord[];
    onAddRecord: (rec: ActualRecord) => void;
    onDeleteRecord: (id: string) => void;
    simulationResults: any[];
    fireTarget: number;
}> = ({ actualData, onAddRecord, onDeleteRecord, simulationResults, fireTarget }) => {
    const [newRecord, setNewRecord] = useState<{
        year: number, 
        portfolio: number, 
        pension1: number, 
        pension2: number,
        annualExpenses: number,
        monthlySavings: number,
        contrib1: number,
        contrib2: number
    }>({
        year: new Date().getFullYear(),
        portfolio: 0,
        pension1: 0,
        pension2: 0,
        annualExpenses: 0,
        monthlySavings: 0,
        contrib1: 0,
        contrib2: 0
    });

    const handleAdd = () => {
        onAddRecord({
            id: Date.now().toString(),
            year: newRecord.year,
            portfolioValue: newRecord.portfolio,
            pensionFund1Value: newRecord.pension1,
            pensionFund2Value: newRecord.pension2,
            totalWealth: newRecord.portfolio + newRecord.pension1 + newRecord.pension2,
            annualExpenses: newRecord.annualExpenses,
            monthlySavings: newRecord.monthlySavings,
            pensionContribution1: newRecord.contrib1,
            pensionContribution2: newRecord.contrib2
        });
    };

    // Comparison Logic
    const latestActual = actualData.sort((a,b) => b.year - a.year)[0];
    
    let simDataForYear = null;
    
    if (latestActual) {
        simDataForYear = simulationResults.find(r => r.year === latestActual.year);
    }

    const calculateDelta = (actual: number, simulated: number) => actual - simulated;
    const formatDelta = (val: number) => val.toLocaleString('it-IT', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0, signDisplay: 'always'});
    const formatCurrency = (val: number) => val.toLocaleString('it-IT', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0});

    // Calculate coverage
    const coveragePercent = (latestActual && fireTarget > 0) 
        ? (latestActual.totalWealth / fireTarget) * 100 
        : 0;

    return (
        <div className="space-y-8">
             
             {/* SUMMARY DASHBOARD */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                <DashboardCard 
                    title="Patrimonio Totale" 
                    value={latestActual ? formatCurrency(latestActual.totalWealth) : '-'}
                    subtext={latestActual && simDataForYear ? `Delta: ${formatDelta(calculateDelta(latestActual.totalWealth, simDataForYear.portfolioValue + simDataForYear.pensionFund1Value + simDataForYear.pensionFund2Value))}` : ''}
                    icon={<WalletIcon />}
                    variant={latestActual && simDataForYear && calculateDelta(latestActual.totalWealth, simDataForYear.portfolioValue + simDataForYear.pensionFund1Value + simDataForYear.pensionFund2Value) < 0 ? 'danger' : 'default'}
                />
                <DashboardCard 
                    title="Portafoglio Liquido" 
                    value={latestActual ? formatCurrency(latestActual.portfolioValue) : '-'}
                    subtext={latestActual && simDataForYear ? `Delta: ${formatDelta(calculateDelta(latestActual.portfolioValue, simDataForYear.portfolioValue))}` : ''}
                    icon={<ChartBarIcon />}
                    variant={latestActual && simDataForYear && calculateDelta(latestActual.portfolioValue, simDataForYear.portfolioValue) < 0 ? 'danger' : 'default'}
                />
                <DashboardCard 
                    title="% Copertura FIRE" 
                    value={latestActual ? `${coveragePercent.toFixed(1)}%` : '-'}
                    subtext={`Obiettivo: ${formatCurrency(fireTarget)}`}
                    icon={<FlagIcon />}
                    variant={coveragePercent >= 100 ? 'success' : 'default'}
                />
                <DashboardCard 
                    title="Fondo Pensione 1" 
                    value={latestActual ? formatCurrency(latestActual.pensionFund1Value) : '-'}
                    subtext={latestActual && simDataForYear ? `Delta: ${formatDelta(calculateDelta(latestActual.pensionFund1Value, simDataForYear.pensionFund1Value))}` : ''}
                    icon={<PiggyBankIcon />}
                    variant={latestActual && simDataForYear && calculateDelta(latestActual.pensionFund1Value, simDataForYear.pensionFund1Value) < 0 ? 'danger' : 'default'}
                />
                <DashboardCard 
                    title="Fondo Pensione 2" 
                    value={latestActual ? formatCurrency(latestActual.pensionFund2Value) : '-'}
                    subtext={latestActual && simDataForYear ? `Delta: ${formatDelta(calculateDelta(latestActual.pensionFund2Value, simDataForYear.pensionFund2Value))}` : ''}
                    icon={<PiggyBankIcon />}
                    variant={latestActual && simDataForYear && calculateDelta(latestActual.pensionFund2Value, simDataForYear.pensionFund2Value) < 0 ? 'danger' : 'default'}
                />
                
                {/* Expense Comparison Card */}
                <DashboardCard 
                    title="Spese Totali (Annue)" 
                    value={latestActual && latestActual.annualExpenses ? formatCurrency(latestActual.annualExpenses) : '-'}
                    subtext={latestActual && simDataForYear ? `Delta: ${formatDelta(calculateDelta(latestActual.annualExpenses, simDataForYear.totalExpenses))}` : ''}
                    icon={<ArrowDownIcon />}
                    // Expenses Logic: If actual > simulated => Danger (Spent too much). If actual < simulated => Success (Saved money).
                    variant={latestActual && simDataForYear ? (latestActual.annualExpenses > simDataForYear.totalExpenses ? 'danger' : 'success') : 'default'}
                />
             </div>
             
             {/* Milestone Timeline Moved Here */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-3">
                    <MilestoneTimeline data={actualData} fireNumber={fireTarget} />
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Form */}
                <div className="bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg h-fit">
                    <h3 className="text-xl font-bold text-brand-text mb-4">Inserisci Dati Reali</h3>
                    <div className="space-y-4">
                        <InputField label="Anno Riferimento" value={newRecord.year} onChange={v => setNewRecord(p => ({...p, year: v}))} step="1" />
                        
                        <div className="h-px bg-brand-accent/30 my-2"></div>
                        <h4 className="text-sm font-bold text-brand-teal uppercase">Patrimoni (Snapshot 31/12)</h4>
                        
                        <InputField label="Portafoglio Liquido" value={newRecord.portfolio} onChange={v => setNewRecord(p => ({...p, portfolio: v}))} suffix="€" />
                        <div className="grid grid-cols-2 gap-4">
                             <InputField label="Fondo Pensione 1" value={newRecord.pension1} onChange={v => setNewRecord(p => ({...p, pension1: v}))} suffix="€" />
                             <InputField label="Fondo Pensione 2" value={newRecord.pension2} onChange={v => setNewRecord(p => ({...p, pension2: v}))} suffix="€" />
                        </div>

                        <div className="h-px bg-brand-accent/30 my-2"></div>
                        <h4 className="text-sm font-bold text-brand-gold uppercase">Flussi Annuali (Effettivi)</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Spese Totali" value={newRecord.annualExpenses} onChange={v => setNewRecord(p => ({...p, annualExpenses: v}))} suffix="€" />
                            <InputField label="Risparmio Mensile" value={newRecord.monthlySavings} onChange={v => setNewRecord(p => ({...p, monthlySavings: v}))} suffix="€" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Versamento FP 1" value={newRecord.contrib1} onChange={v => setNewRecord(p => ({...p, contrib1: v}))} suffix="€" />
                            <InputField label="Versamento FP 2" value={newRecord.contrib2} onChange={v => setNewRecord(p => ({...p, contrib2: v}))} suffix="€" />
                        </div>
                        
                        <button 
                            onClick={handleAdd}
                            className="w-full mt-4 bg-brand-teal hover:bg-brand-teal/80 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                            Salva Dato Reale
                        </button>
                    </div>
                </div>

                {/* Chart */}
                <div className="lg:col-span-2 bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-brand-text mb-4">Realtà vs Simulazione</h3>
                    <ComparisonChart simulated={simulationResults} actual={actualData} />
                </div>
             </div>

             {/* Table */}
             <div className="bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg overflow-x-auto">
                <h3 className="text-xl font-bold text-brand-text mb-4">Storico Inserimenti</h3>
                <table className="w-full text-sm text-left text-brand-text min-w-[800px]">
                    <thead className="text-xs text-brand-light uppercase bg-brand-primary/20">
                        <tr>
                            <th className="px-4 py-3 rounded-tl-lg">Anno</th>
                            <th className="px-4 py-3 text-right">Portafoglio</th>
                            <th className="px-4 py-3 text-right">Fondi Pens.</th>
                            <th className="px-4 py-3 text-right">Totale</th>
                            <th className="px-4 py-3 text-right border-l border-brand-accent/20">Spese</th>
                            <th className="px-4 py-3 text-right">Risp. M.</th>
                            <th className="px-4 py-3 text-right">Vers. FP</th>
                            <th className="px-4 py-3 rounded-tr-lg text-center">Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {actualData.sort((a,b) => b.year - a.year).map(rec => (
                            <tr key={rec.id} className="border-b border-brand-accent/10 hover:bg-brand-primary/10">
                                <td className="px-4 py-3 font-bold">{rec.year}</td>
                                <td className="px-4 py-3 text-right font-mono">{rec.portfolioValue.toLocaleString('it-IT', {style:'currency', currency:'EUR', maximumFractionDigits:0})}</td>
                                <td className="px-4 py-3 text-right font-mono">{(rec.pensionFund1Value + rec.pensionFund2Value).toLocaleString('it-IT', {style:'currency', currency:'EUR', maximumFractionDigits:0})}</td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-brand-gold">{rec.totalWealth.toLocaleString('it-IT', {style:'currency', currency:'EUR', maximumFractionDigits:0})}</td>
                                <td className="px-4 py-3 text-right font-mono text-red-300/80 border-l border-brand-accent/20">
                                    {rec.annualExpenses ? rec.annualExpenses.toLocaleString('it-IT', {style:'currency', currency:'EUR', maximumFractionDigits:0}) : '-'}
                                </td>
                                <td className="px-4 py-3 text-right font-mono">
                                    {rec.monthlySavings ? rec.monthlySavings.toLocaleString('it-IT', {style:'currency', currency:'EUR', maximumFractionDigits:0}) : '-'}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-orange-300/80">
                                    {((rec.pensionContribution1 || 0) + (rec.pensionContribution2 || 0)).toLocaleString('it-IT', {style:'currency', currency:'EUR', maximumFractionDigits:0})}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button onClick={() => onDeleteRecord(rec.id)} className="text-red-400 hover:text-red-300">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {actualData.length === 0 && (
                            <tr><td colSpan={8} className="text-center py-4 text-brand-light italic">Nessun dato inserito</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>
    );
}

// Helper for migration
const migrateMonthlyData = (data: any[]): MonthlyRecord[] => {
    return data.map(d => {
        let rec = { ...d } as MonthlyRecord;
        
        // Migration 1: portfolioValue -> stocksValue
        // @ts-ignore
        if (d.portfolioValue !== undefined && d.stocksValue === undefined) {
             rec = {
                ...rec,
                stocksValue: d.portfolioValue, // Dump everything into stocks by default
                bondsValue: 0,
                // @ts-ignore
                portfolioValue: undefined 
            };
        }

        // Migration 2: Add Liquidity fields
        if (rec.liquidityValue === undefined) rec.liquidityValue = 0;
        if (rec.investedLiquidity === undefined) rec.investedLiquidity = 0;

        return rec;
    });
};

const App: React.FC = () => {
  // --- STATE ---
  const [view, setView] = useState<'simulation' | 'tracking' | 'monthly'>('monthly');
  
  // Profilo
  const [profile, setProfile] = useState<UserProfile>({
    currentAge: 35,
    fireAge: 50,
    retirementAge: 67,
    lifeExpectancy: 90
  });

  // Finanze
  const [fin, setFin] = useState<Financials>({
    currentPortfolio: 100000,
    currentPensionFund1: 25000,
    currentPensionFund2: 0,
    monthlySavings: 1500,
    annualExpenses: 24000,
    pensionContribution1: 5000, 
    pensionContribution2: 0,
    inflation: 2.0,
    annualMortgage: 0,
    mortgageStartYear: 2020,
    mortgageEndYear: 2040,
    oneTimeEvents: []
  });

  // Allocazione (per tasse)
  const [alloc, setAlloc] = useState<AssetAllocation>({
    stocks: 80,
    bonds: 20
  });

  // Rendimenti
  const [ret, setRet] = useState<Returns>({
    stockReturn: 7.0, // Lordo Azionario
    bondReturn: 3.0,  // Lordo Obbligazionario
    pension1Return: 4.0, // Lordo Fondo 1
    pension2Return: 4.0  // Lordo Fondo 2
  });

  // Strumenti Italiani
  const [tools, setTools] = useState<ItalianTools>({
    useNaspi: true,
    naspiNetMonth: 1300,
    useRita: true,
    estimatedInps: 1500, // Netta mensile
    pensionIndexationPercent: 75 // Default 75% rivalutazione
  });

  // CATEGORIE DINAMICHE
  const [categories, setCategories] = useState<Category[]>(() => {
      const saved = localStorage.getItem('fire_categories');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  // Tracking Data (Annual)
  const [actualData, setActualData] = useState<ActualRecord[]>(() => {
      const saved = localStorage.getItem('fire_actual_data');
      return saved ? JSON.parse(saved) : [];
  });

  // Tracking Data (Monthly)
  const [monthlyData, setMonthlyData] = useState<MonthlyRecord[]>(() => {
    const saved = localStorage.getItem('fire_monthly_data');
    const parsed = saved ? JSON.parse(saved) : [];
    return migrateMonthlyData(parsed);
  });

  // New OneTimeEvent State for Input
  const [newEvent, setNewEvent] = useState<{name: string, year: number, amount: number, type: 'expense' | 'income'}>({
      name: '', year: new Date().getFullYear(), amount: 0, type: 'expense'
  });

  const addOneTimeEvent = () => {
      if (newEvent.name && newEvent.amount > 0) {
          setFin(prev => ({
              ...prev,
              oneTimeEvents: [
                  ...prev.oneTimeEvents, 
                  {
                      id: Date.now().toString(),
                      name: newEvent.name,
                      year: newEvent.year,
                      amount: newEvent.type === 'expense' ? -newEvent.amount : newEvent.amount,
                      type: newEvent.type
                  }
              ]
          }));
          setNewEvent({name: '', year: new Date().getFullYear(), amount: 0, type: 'expense'});
      }
  };

  const removeOneTimeEvent = (id: string) => {
      setFin(prev => ({
          ...prev,
          oneTimeEvents: prev.oneTimeEvents.filter(e => e.id !== id)
      }));
  };


  useEffect(() => {
      localStorage.setItem('fire_actual_data', JSON.stringify(actualData));
  }, [actualData]);

  useEffect(() => {
    localStorage.setItem('fire_monthly_data', JSON.stringify(monthlyData));
  }, [monthlyData]);

  useEffect(() => {
    localStorage.setItem('fire_categories', JSON.stringify(categories));
  }, [categories]);

  const handleAddActual = (rec: ActualRecord) => {
      // Replace if exists for same year, else add
      setActualData(prev => {
          const filtered = prev.filter(p => p.year !== rec.year);
          return [...filtered, rec];
      });
  };

  const handleDeleteActual = (id: string) => {
      setActualData(prev => prev.filter(p => p.id !== id));
  };

  const handleAddMonthly = (rec: MonthlyRecord) => {
    setMonthlyData(prev => {
        const filtered = prev.filter(p => !(p.year === rec.year && p.month === rec.month));
        return [...filtered, rec];
    });
  };

  const handleDeleteMonthly = (id: string) => {
    setMonthlyData(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateCategories = (newCats: Category[]) => {
      setCategories(newCats);
  };

  // --- DATA IMPORT/EXPORT HANDLERS ---
  const handleExportData = (): BackupData => {
      return {
          profile,
          financials: fin,
          allocation: alloc,
          returns: ret,
          tools,
          actualData,
          monthlyData,
          categories,
          date: new Date().toISOString()
      };
  };

  const handleImportData = (data: BackupData) => {
      if(data.profile) setProfile(data.profile);
      if(data.financials) setFin(data.financials);
      if(data.allocation) setAlloc(data.allocation);
      if(data.returns) setRet(data.returns);
      if(data.tools) setTools(data.tools);
      if(data.actualData) setActualData(data.actualData);
      if(data.categories) setCategories(data.categories);
      
      if(data.monthlyData) {
          // Perform migration on import
          const migrated = migrateMonthlyData(data.monthlyData);
          setMonthlyData(migrated);
      }
  };

  // --- SIMULATION ---
  
  const simulationResults = useMemo(() => {
    // Ensure logic runs even if ages are weird, but results might be empty
    if (profile.currentAge > profile.lifeExpectancy) return [];
    return runSimulation(profile, fin, alloc, ret, tools);
  }, [profile, fin, alloc, ret, tools]);

  const failedYear = simulationResults.find(r => r.isFailed);
  
  // Safe access to last result
  const lastResult = simulationResults.length > 0 ? simulationResults[simulationResults.length - 1] : null;
  const wealthAtDeath = lastResult ? lastResult.portfolioValue + lastResult.pensionFund1Value + lastResult.pensionFund2Value : 0;
  
  // Stats for Dashboard
  const fireYearIndex = profile.fireAge - profile.currentAge;
  const wealthAtFire = fireYearIndex >= 0 && fireYearIndex < simulationResults.length 
    ? simulationResults[fireYearIndex].portfolioValue + simulationResults[fireYearIndex].pensionFund1Value + simulationResults[fireYearIndex].pensionFund2Value
    : 0;

  // Calculate current total expenses (Simulated for year 0)
  const currentYear = new Date().getFullYear();
  const hasActiveMortgage = currentYear >= fin.mortgageStartYear && currentYear <= fin.mortgageEndYear;
  const currentTotalExpenses = fin.annualExpenses + (hasActiveMortgage ? fin.annualMortgage : 0);

  return (
    <div className="min-h-screen bg-brand-primary font-sans text-brand-text flex flex-col">
      <Header /> 
      
      <main className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl flex-grow">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-10">
            <div>
                <h2 className="text-3xl font-bold text-brand-text mb-2">Pianificatore FIRE Italia</h2>
                <p className="text-brand-light max-w-xl">
                    Simulazione e Monitoraggio del tuo percorso verso l'indipendenza finanziaria.
                </p>
            </div>
            <div className="bg-brand-secondary p-1 rounded-lg border border-brand-accent mt-4 md:mt-0 flex">
                <button 
                    onClick={() => setView('monthly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'monthly' ? 'bg-brand-teal text-white shadow-md' : 'text-brand-light hover:text-brand-text'}`}
                >
                    Tracking Mensile
                </button>
                <button 
                    onClick={() => setView('tracking')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'tracking' ? 'bg-brand-teal text-white shadow-md' : 'text-brand-light hover:text-brand-text'}`}
                >
                    Tracking Annuale
                </button>
                <button 
                    onClick={() => setView('simulation')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'simulation' ? 'bg-brand-teal text-white shadow-md' : 'text-brand-light hover:text-brand-text'}`}
                >
                    Simulazione
                </button>
            </div>
        </div>

        {view === 'simulation' ? (
            <>
                {/* DASHBOARD RIASSUNTIVA */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <DashboardCard 
                    title="Età FIRE Obiettivo"
                    value={`${profile.fireAge} Anni`}
                    subtext={`Tra ${Math.max(0, profile.fireAge - profile.currentAge)} anni`}
                    icon={<ArrowUpIcon />}
                />
                <DashboardCard 
                    title="Patrimonio al FIRE"
                    value={wealthAtFire.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    subtext="Stimato (Investimenti + Fondi P.)"
                    icon={<WalletIcon />}
                />
                <DashboardCard 
                    title={`Risultato a ${profile.lifeExpectancy} anni`}
                    value={failedYear ? "FALLITO" : wealthAtDeath.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    subtext={failedYear ? `Soldi finiti a ${failedYear.age} anni` : "Patrimonio residuo stimato"}
                    icon={failedYear ? <ExclamationTriangleIcon /> : <PiggyBankIcon />}
                    variant={failedYear ? 'danger' : 'success'}
                />
                <DashboardCard 
                    title="Spese Annue Totali (Oggi)"
                    value={currentTotalExpenses.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                    subtext={hasActiveMortgage ? `Include ${fin.annualMortgage.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} di mutuo` : "Nessun mutuo attivo"}
                    icon={<ChartBarIcon />}
                />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* COLONNA SINISTRA: INPUT */}
                <div className="xl:col-span-1 space-y-6">
                    
                    <CollapsiblePanel title="1. Profilo & Obiettivi" initialOpen={true}>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Età Attuale" value={profile.currentAge} onChange={v => setProfile(p => ({...p, currentAge: v}))} />
                        <InputField label="Età Pensione INPS" value={profile.retirementAge} onChange={v => setProfile(p => ({...p, retirementAge: v}))} />
                        <InputField label="Età FIRE (Smetto Lavoro)" value={profile.fireAge} onChange={v => setProfile(p => ({...p, fireAge: v}))} />
                        <InputField label="Speranza di Vita" value={profile.lifeExpectancy} onChange={v => setProfile(p => ({...p, lifeExpectancy: v}))} />
                    </div>
                    </CollapsiblePanel>

                    <CollapsiblePanel title="2. Situazione Attuale" initialOpen={true}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <InputField label="Portafoglio Liquido" value={fin.currentPortfolio} onChange={v => setFin(f => ({...f, currentPortfolio: v}))} suffix="€" />
                             <InputField label="Risparmio Mensile" value={fin.monthlySavings} onChange={v => setFin(f => ({...f, monthlySavings: v}))} suffix="€" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-3 bg-brand-primary/30 rounded-lg border border-brand-accent/20">
                            <div className="col-span-2 text-xs font-bold text-brand-gold uppercase">Fondo Pensione 1</div>
                            <InputField label="Valore Attuale" value={fin.currentPensionFund1} onChange={v => setFin(f => ({...f, currentPensionFund1: v}))} suffix="€" />
                            <InputField label="Contributo Annuo" value={fin.pensionContribution1} onChange={v => setFin(f => ({...f, pensionContribution1: v}))} suffix="€" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-3 bg-brand-primary/30 rounded-lg border border-brand-accent/20">
                            <div className="col-span-2 text-xs font-bold text-orange-300 uppercase">Fondo Pensione 2</div>
                            <InputField label="Valore Attuale" value={fin.currentPensionFund2} onChange={v => setFin(f => ({...f, currentPensionFund2: v}))} suffix="€" />
                            <InputField label="Contributo Annuo" value={fin.pensionContribution2} onChange={v => setFin(f => ({...f, pensionContribution2: v}))} suffix="€" />
                        </div>
                        
                        <div className="h-px bg-brand-accent/30 my-2"></div>
                        
                        <InputField label="Spese Vita Annue (No Mutuo)" value={fin.annualExpenses} onChange={v => setFin(f => ({...f, annualExpenses: v}))} suffix="€" />
                        
                        <div className="bg-brand-primary/30 p-3 rounded-lg border border-brand-accent/30">
                            <p className="text-xs text-brand-light uppercase font-bold mb-2">Mutuo (Rata Fissa)</p>
                            <div className="space-y-3">
                                <InputField label="Rata Annuale" value={fin.annualMortgage} onChange={v => setFin(f => ({...f, annualMortgage: v}))} suffix="€" />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Anno Inizio" value={fin.mortgageStartYear} onChange={v => setFin(f => ({...f, mortgageStartYear: v}))} step="1" />
                                    <InputField label="Anno Fine" value={fin.mortgageEndYear} onChange={v => setFin(f => ({...f, mortgageEndYear: v}))} step="1" />
                                </div>
                            </div>
                        </div>
                    </div>
                    </CollapsiblePanel>

                    <CollapsiblePanel title="3. Eventi Straordinari (Extra)" initialOpen={false}>
                        <div className="space-y-4">
                            <div className="bg-brand-primary/30 p-3 rounded-lg space-y-2">
                                <h4 className="text-xs text-brand-light uppercase font-bold">Aggiungi Evento</h4>
                                <input 
                                    type="text" 
                                    placeholder="Descrizione (es. Auto Nuova)"
                                    value={newEvent.name}
                                    onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                                    className="w-full bg-brand-primary border border-brand-accent rounded-lg p-2 text-sm mb-2 text-brand-text"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input 
                                        type="number" 
                                        value={newEvent.year}
                                        onChange={(e) => setNewEvent({...newEvent, year: parseInt(e.target.value)})}
                                        className="bg-brand-primary border border-brand-accent rounded-lg p-2 text-sm text-brand-text"
                                    />
                                    <input 
                                        type="number" 
                                        placeholder="Importo"
                                        value={newEvent.amount}
                                        onChange={(e) => setNewEvent({...newEvent, amount: parseFloat(e.target.value)})}
                                        className="bg-brand-primary border border-brand-accent rounded-lg p-2 text-sm text-brand-text"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setNewEvent({...newEvent, type: 'expense'})}
                                        className={`flex-1 py-1.5 rounded text-xs font-bold ${newEvent.type === 'expense' ? 'bg-red-500/20 text-red-300 border border-red-500/50' : 'bg-brand-primary border border-brand-light/20 text-brand-light'}`}
                                    >
                                        Spesa
                                    </button>
                                    <button 
                                        onClick={() => setNewEvent({...newEvent, type: 'income'})}
                                        className={`flex-1 py-1.5 rounded text-xs font-bold ${newEvent.type === 'income' ? 'bg-green-500/20 text-green-300 border border-green-500/50' : 'bg-brand-primary border border-brand-light/20 text-brand-light'}`}
                                    >
                                        Entrata
                                    </button>
                                </div>
                                <button 
                                    onClick={addOneTimeEvent}
                                    className="w-full bg-brand-accent hover:bg-brand-teal text-white py-2 rounded text-sm font-bold transition"
                                >
                                    Aggiungi alla Simulazione
                                </button>
                            </div>

                            {fin.oneTimeEvents.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs text-brand-light uppercase font-bold">Lista Eventi</h4>
                                    {fin.oneTimeEvents.sort((a,b) => a.year - b.year).map(evt => (
                                        <div key={evt.id} className="flex justify-between items-center text-sm p-2 bg-brand-primary/20 rounded border border-brand-accent/10">
                                            <div>
                                                <span className="font-bold mr-2">{evt.year}</span>
                                                <span className="text-brand-text">{evt.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={evt.amount < 0 ? 'text-red-400' : 'text-green-400'}>
                                                    {evt.amount.toLocaleString('it-IT', {style:'currency', currency:'EUR', maximumFractionDigits:0})}
                                                </span>
                                                <button onClick={() => removeOneTimeEvent(evt.id)} className="text-brand-light hover:text-red-400">
                                                    &times;
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CollapsiblePanel>

                    <CollapsiblePanel title="4. Parametri Mercato & Tasse" initialOpen={false}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                        <InputField label="Rendimento Azionario (%)" value={ret.stockReturn} onChange={v => setRet(r => ({...r, stockReturn: v}))} />
                        <InputField label="Rendimento Obblig. (%)" value={ret.bondReturn} onChange={v => setRet(r => ({...r, bondReturn: v}))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Rend. Fondo P. 1 (%)" value={ret.pension1Return} onChange={v => setRet(r => ({...r, pension1Return: v}))} />
                            <InputField label="Rend. Fondo P. 2 (%)" value={ret.pension2Return} onChange={v => setRet(r => ({...r, pension2Return: v}))} />
                        </div>
                        <InputField label="Inflazione Stimata (%)" value={fin.inflation} onChange={v => setFin(f => ({...f, inflation: v}))} />
                        
                        <div className="pt-2">
                            <div className="flex justify-between text-xs text-brand-light mb-1">
                                <span>Asset Allocation</span>
                                <span>{alloc.stocks}% Azioni / {alloc.bonds}% Bond</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                step="5"
                                value={alloc.stocks} 
                                onChange={e => setAlloc({stocks: parseInt(e.target.value), bonds: 100 - parseInt(e.target.value)})} 
                                className="w-full accent-brand-teal h-2 bg-brand-accent/30 rounded-lg appearance-none cursor-pointer" 
                            />
                            <div className="flex justify-between text-[10px] text-brand-light mt-1 opacity-60">
                                <span>Conservativo</span>
                                <span>Aggressivo</span>
                            </div>
                        </div>
                    </div>
                    </CollapsiblePanel>

                    <CollapsiblePanel title="5. Strumenti Italia (Ponte)" initialOpen={true}>
                    <div className="space-y-3">
                        <Checkbox 
                        label="Utilizza NASpI (2 anni)" 
                        description="Disoccupazione dopo il termine del lavoro"
                        checked={tools.useNaspi} 
                        onChange={v => setTools(t => ({...t, useNaspi: v}))} 
                        />
                        {tools.useNaspi && (
                        <InputField label="NASpI Netta Mensile (Iniziale)" value={tools.naspiNetMonth} onChange={v => setTools(t => ({...t, naspiNetMonth: v}))} suffix="€" />
                        )}
                        
                        <div className="h-px bg-brand-accent/30 my-2"></div>
                        
                        <Checkbox 
                        label="Utilizza RITA" 
                        description="Rendita anticipata dai Fondi Pensione (max 10 anni prima)"
                        checked={tools.useRita} 
                        onChange={v => setTools(t => ({...t, useRita: v}))} 
                        />
                        
                        <div className="h-px bg-brand-accent/30 my-2"></div>

                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Pensione INPS (Oggi)" value={tools.estimatedInps} onChange={v => setTools(t => ({...t, estimatedInps: v}))} suffix="€" />
                            <InputField label="% Adeguamento Inflaz." value={tools.pensionIndexationPercent} onChange={v => setTools(t => ({...t, pensionIndexationPercent: v}))} suffix="%" />
                        </div>
                        <p className="text-xs text-brand-light italic mt-1">
                            Esempio: 100% segue tutta l'inflazione, 75% perde potere d'acquisto.
                        </p>
                    </div>
                    </CollapsiblePanel>

                </div>

                {/* COLONNA DESTRA: GRAFICI E TABELLA */}
                <div className="xl:col-span-2 space-y-8">
                    
                    <div className="bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-brand-text mb-4 flex items-center">
                        <span className="w-2 h-8 bg-brand-teal rounded mr-3"></span>
                        Evoluzione Patrimonio Netto
                    </h3>
                    <WealthEvolutionChart data={simulationResults} />
                    <p className="text-sm text-brand-light mt-4 italic">
                        Mostra la crescita in accumulo e l'erosione in fase di decumulo. Il fondo pensione viene consumato prima (RITA) o integrato alla pensione.
                    </p>
                    </div>

                    <div className="bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-brand-text mb-4 flex items-center">
                        <span className="w-2 h-8 bg-brand-gold rounded mr-3"></span>
                        Composizione Reddito (Fase FIRE)
                    </h3>
                    <IncomeStackChart data={simulationResults} />
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-brand-light">
                        <div className="flex items-center"><span className="w-3 h-3 bg-[#E57373] mr-2 rounded-full"></span> NASpI</div>
                        <div className="flex items-center"><span className="w-3 h-3 bg-[#FFC107] mr-2 rounded-full"></span> RITA (Fondi P.)</div>
                        <div className="flex items-center"><span className="w-3 h-3 bg-[#415A77] mr-2 rounded-full"></span> Pensione INPS</div>
                        <div className="flex items-center"><span className="w-3 h-3 bg-[#26A69A] mr-2 rounded-full"></span> Prelievo Portafoglio</div>
                    </div>
                    </div>

                    {/* TABELLA DETTAGLI */}
                    <SimulationTable data={simulationResults} />

                </div>

                </div>
            </>
        ) : view === 'tracking' ? (
            /* TRACKING ANNUAL VIEW */
            <TrackingView 
                actualData={actualData} 
                onAddRecord={handleAddActual} 
                onDeleteRecord={handleDeleteActual} 
                simulationResults={simulationResults} 
                fireTarget={wealthAtFire}
            />
        ) : (
            /* MONTHLY VIEW */
            <MonthlyTrackingView 
                data={monthlyData}
                categories={categories}
                onAddRecord={handleAddMonthly}
                onDeleteRecord={handleDeleteMonthly}
                onUpdateCategories={handleUpdateCategories}
            />
        )}

        {/* DATA MANAGEMENT FOOTER */}
        <DataManagement 
            onExport={handleExportData}
            onImport={handleImportData}
        />

      </main>

      <footer className="py-6 mt-8 border-t border-brand-accent/20 bg-brand-primary/80">
          <div className="container mx-auto px-4 text-center text-xs text-brand-light opacity-60">
              <p>
                  DISCLAIMER: Questa applicazione è uno strumento di simulazione a scopo puramente educativo e informativo. 
                  L'autore non si assume alcuna responsabilità per l'accuratezza dei calcoli, delle proiezioni o per eventuali decisioni finanziarie prese sulla base di questi dati.
                  Le performance passate non sono garanzia di rendimenti futuri. Si consiglia di consultare un consulente finanziario professionista.
              </p>
              <p className="mt-2">
                  FinJourney &copy; {new Date().getFullYear()} - Dati salvati localmente nel browser.
              </p>
          </div>
      </footer>
    </div>
  );
};

export default App;
