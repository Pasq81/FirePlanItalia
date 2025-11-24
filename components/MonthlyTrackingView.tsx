
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import type { MonthlyRecord, Category } from '../types';
import { ArrowUpIcon, ArrowDownIcon, PiggyBankIcon, ChartBarIcon, RefreshIcon } from './Icons';
import DashboardCard from './DashboardCard';
import CollapsiblePanel from './components/CollapsiblePanel';
import InputField from './InputField';

interface MonthlyTrackingViewProps {
  data: MonthlyRecord[];
  categories: Category[];
  onAddRecord: (rec: MonthlyRecord) => void;
  onDeleteRecord: (id: string) => void;
  onUpdateCategories: (cats: Category[]) => void;
}

const MONTHS = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", 
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

const formatCurrency = (val: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

const MonthlyTrackingView: React.FC<MonthlyTrackingViewProps> = ({ data, categories, onAddRecord, onDeleteRecord, onUpdateCategories }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // Categories State Management
  const [showCatSettings, setShowCatSettings] = useState(false);
  const [newCat, setNewCat] = useState<{label: string, type: 'income' | 'expense', color: string}>({
      label: '', type: 'expense', color: '#FF5722'
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Asset Allocation State
  const [excludedAssets, setExcludedAssets] = useState<string[]>([]);

  const handleSaveCategory = () => {
      if(newCat.label) {
          if (editingId) {
              // Update existing
              const updated = categories.map(c => 
                  c.id === editingId ? { ...c, label: newCat.label, type: newCat.type, color: newCat.color } : c
              );
              onUpdateCategories(updated);
              setEditingId(null);
          } else {
              // Create new
              const id = newCat.label.toLowerCase().replace(/\s/g, '_') + '_' + Date.now().toString().substring(8);
              onUpdateCategories([...categories, { id, ...newCat }]);
          }
          setNewCat({label: '', type: 'expense', color: '#FF5722'});
      }
  };

  const handleEditClick = (cat: Category) => {
      setNewCat({ label: cat.label, type: cat.type, color: cat.color });
      setEditingId(cat.id);
  };

  const handleCancelEdit = () => {
      setNewCat({label: '', type: 'expense', color: '#FF5722'});
      setEditingId(null);
  };

  const handleDeleteCategory = (id: string) => {
      if(window.confirm("Sei sicuro? I dati storici associati a questa categoria non verranno cancellati, ma la categoria non sarà più selezionabile.")) {
          onUpdateCategories(categories.filter(c => c.id !== id));
      }
  };

  const [form, setForm] = useState({
    year: currentYear,
    month: currentMonth,
    
    stocksValue: 0,
    etfValue: 0,
    bondsValue: 0,
    liquidityValue: 0,
    cryptoValue: 0,
    derivativesValue: 0,
    commoditiesValue: 0,
    
    pension1Value: 0,
    pension2Value: 0,
    
    investedStocks: 0,
    investedEtf: 0,
    investedBonds: 0,
    investedLiquidity: 0,
    investedCrypto: 0,
    investedDerivatives: 0,
    investedCommodities: 0,
    
    // Pension 1 (Detailed)
    investedPension1Voluntary: 0,
    investedPension1Employer: 0,
    investedPension1Tfr: 0,

    // Pension 2 (Simple)
    investedPension2Voluntary: 0,
    
    // Dynamic Details
    details: {} as Record<string, number>,

    notes: ''
  });

  // --- LOGICA CAMBIO DATA (POPOLAMENTO AUTOMATICO) ---
  const handleDateChange = (newYear: number, newMonth: number) => {
      const existing = data.find(d => d.year === newYear && d.month === newMonth);
      
      const baseDetails: Record<string, number> = {};
      categories.forEach(c => baseDetails[c.id] = 0);

      if (existing) {
          // MODALITA' MODIFICA
          const mergedDetails = { ...baseDetails };
          if (existing.incomeDetails) Object.entries(existing.incomeDetails).forEach(([k, v]) => { if (categories.some(c => c.id === k)) mergedDetails[k] = v; });
          if (existing.expenseDetails) Object.entries(existing.expenseDetails).forEach(([k, v]) => { if (categories.some(c => c.id === k)) mergedDetails[k] = v; });

          setForm({
              year: newYear,
              month: newMonth,
              // Snapshot
              stocksValue: existing.stocksValue || 0,
              etfValue: existing.etfValue || 0,
              bondsValue: existing.bondsValue || 0,
              liquidityValue: existing.liquidityValue || 0,
              cryptoValue: existing.cryptoValue || 0,
              derivativesValue: existing.derivativesValue || 0,
              commoditiesValue: existing.commoditiesValue || 0,
              pension1Value: existing.pensionFund1Value || 0,
              pension2Value: existing.pensionFund2Value || 0,
              // Flows
              investedStocks: existing.investedStocks || 0,
              investedEtf: existing.investedEtf || 0,
              investedBonds: existing.investedBonds || 0,
              investedLiquidity: existing.investedLiquidity || 0,
              investedCrypto: existing.investedCrypto || 0,
              investedDerivatives: existing.investedDerivatives || 0,
              investedCommodities: existing.investedCommodities || 0,
              
              investedPension1Voluntary: existing.investedPension1Voluntary || 0,
              investedPension1Employer: existing.investedPension1Employer || 0,
              investedPension1Tfr: existing.investedPension1Tfr || 0,

              // Pension 2 (Load Voluntary, ignore others for UI simplicity)
              investedPension2Voluntary: existing.investedPension2Voluntary || 0,

              details: mergedDetails,
              notes: existing.notes || ''
          });

      } else {
          // MODALITA' NUOVO RECORD
          const previous = data
              .filter(d => (d.year < newYear) || (d.year === newYear && d.month < newMonth))
              .sort((a,b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))[0];
          
          setForm({
              year: newYear,
              month: newMonth,
              // Copy Snapshot
              stocksValue: previous?.stocksValue || 0,
              etfValue: previous?.etfValue || 0,
              bondsValue: previous?.bondsValue || 0,
              liquidityValue: previous?.liquidityValue || 0,
              cryptoValue: previous?.cryptoValue || 0,
              derivativesValue: previous?.derivativesValue || 0,
              commoditiesValue: previous?.commoditiesValue || 0,
              pension1Value: previous?.pensionFund1Value || 0,
              pension2Value: previous?.pensionFund2Value || 0,
              
              // Reset Flows
              investedStocks: 0,
              investedEtf: 0,
              investedBonds: 0,
              investedLiquidity: 0,
              investedCrypto: 0,
              investedDerivatives: 0,
              investedCommodities: 0,
              investedPension1Voluntary: 0,
              investedPension1Employer: 0,
              investedPension1Tfr: 0,
              investedPension2Voluntary: 0,
              
              details: baseDetails,
              notes: ''
          });
      }
  };


  const getInitialFormState = (records: MonthlyRecord[]) => {
      const initialDetails: Record<string, number> = {};
      categories.forEach(c => initialDetails[c.id] = 0);

      const sorted = [...records].sort((a,b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
      
      let nextState = {
        year: currentYear,
        month: currentMonth,
        stocksValue: 0, etfValue: 0, bondsValue: 0, liquidityValue: 0, cryptoValue: 0, derivativesValue: 0, commoditiesValue: 0,
        pension1Value: 0, pension2Value: 0,
        investedStocks: 0, investedEtf: 0, investedBonds: 0, investedLiquidity: 0, investedCrypto: 0, investedDerivatives: 0, investedCommodities: 0, 
        investedPension1Voluntary: 0, investedPension1Employer: 0, investedPension1Tfr: 0,
        investedPension2Voluntary: 0,
        details: initialDetails,
        notes: ''
      };

      if (sorted.length > 0) {
          const last = sorted[0];
          const mergedDetails: Record<string, number> = { ...initialDetails };
          if (last.incomeDetails) Object.entries(last.incomeDetails).forEach(([k, v]) => { if (categories.some(c => c.id === k)) mergedDetails[k] = v; });
          if (last.expenseDetails) Object.entries(last.expenseDetails).forEach(([k, v]) => { if (categories.some(c => c.id === k)) mergedDetails[k] = v; });

          nextState = {
              ...nextState,
              year: last.month === 12 ? last.year + 1 : last.year,
              month: last.month === 12 ? 1 : last.month + 1,
              stocksValue: last.stocksValue || 0,
              etfValue: last.etfValue || 0,
              bondsValue: last.bondsValue || 0,
              liquidityValue: last.liquidityValue || 0,
              cryptoValue: last.cryptoValue || 0,
              derivativesValue: last.derivativesValue || 0,
              commoditiesValue: last.commoditiesValue || 0,
              pension1Value: last.pensionFund1Value || 0,
              pension2Value: last.pensionFund2Value || 0,
              details: mergedDetails
          };
      }
      return nextState;
  };

  useState(() => {
      const initial = getInitialFormState(data);
      setForm(initial);
  });

  useEffect(() => {
      const next = getInitialFormState(data);
      setForm(prev => ({ ...next, year: next.year, month: next.month }));
  }, [data, categories]);


  // Auto-calculate totals
  const incomeCats = categories.filter(c => c.type === 'income');
  const expenseCats = categories.filter(c => c.type === 'expense');

  const totalIncome = incomeCats.reduce((acc, c) => acc + (form.details[c.id] || 0), 0);
  const totalExpenses = expenseCats.reduce((acc, c) => acc + (form.details[c.id] || 0), 0);
  
  // Total Invested = All outflows towards assets (Only Voluntary parts count as "Spending" from Net Income)
  const totalInvestedFlow = form.investedStocks + form.investedEtf + form.investedBonds + form.investedLiquidity + form.investedCrypto + form.investedDerivatives + form.investedCommodities + 
                            form.investedPension1Voluntary + form.investedPension1Employer + form.investedPension1Tfr + form.investedPension2Voluntary;

  // Savings = Income - Expenses - Voluntary Pension Contribs
  // We assume other investments come from savings. 
  // Wait, usually "Savings" = Income - Expenses. 
  // Then "Invested" is part of savings.
  // But Pension Voluntary is deducted from paycheck (usually) or paid from net. 
  // Let's stick to: Savings = Income - Expenses. 
  // Pension Voluntary is an investment flow FROM savings.
  const savings = totalIncome - totalExpenses;

  const handleDetailChange = (id: string, val: number) => {
      setForm(prev => ({
          ...prev,
          details: { ...prev.details, [id]: val }
      }));
  };

  const handleResetForm = () => {
    if (window.confirm("Sei sicuro di voler azzerare tutti i campi del modulo?")) {
        const emptyDetails: Record<string, number> = {};
        categories.forEach(c => emptyDetails[c.id] = 0);

        setForm(prev => ({
            ...prev,
            stocksValue: 0, etfValue: 0, bondsValue: 0, liquidityValue: 0,
            cryptoValue: 0, derivativesValue: 0, commoditiesValue: 0,
            pension1Value: 0, pension2Value: 0,
            investedStocks: 0, investedEtf: 0, investedBonds: 0, investedLiquidity: 0,
            investedCrypto: 0, investedDerivatives: 0, investedCommodities: 0,
            investedPension1Voluntary: 0, investedPension1Employer: 0, investedPension1Tfr: 0,
            investedPension2Voluntary: 0,
            details: emptyDetails,
            notes: ''
        }));
    }
  };

  const handleAdd = () => {
      const incDet: Record<string, number> = {};
      const expDet: Record<string, number> = {};
      
      Object.entries(form.details).forEach(([key, val]) => {
          const cat = categories.find(c => c.id === key);
          if (cat) {
              if (cat.type === 'income') incDet[key] = val;
              else expDet[key] = val;
          }
      });

      const newRec: MonthlyRecord = {
          id: Date.now().toString(),
          year: form.year,
          month: form.month,
          
          stocksValue: form.stocksValue,
          etfValue: form.etfValue,
          bondsValue: form.bondsValue,
          liquidityValue: form.liquidityValue,
          cryptoValue: form.cryptoValue,
          derivativesValue: form.derivativesValue,
          commoditiesValue: form.commoditiesValue,

          pensionFund1Value: form.pension1Value,
          pensionFund2Value: form.pension2Value,
          
          investedStocks: form.investedStocks,
          investedEtf: form.investedEtf,
          investedBonds: form.investedBonds,
          investedLiquidity: form.investedLiquidity,
          investedCrypto: form.investedCrypto,
          investedDerivatives: form.investedDerivatives,
          investedCommodities: form.investedCommodities,
          
          investedPension1Voluntary: form.investedPension1Voluntary,
          investedPension1Employer: form.investedPension1Employer,
          investedPension1Tfr: form.investedPension1Tfr,

          investedPension2Voluntary: form.investedPension2Voluntary,
          investedPension2Employer: 0, // Hardcoded 0 for UI simplicity
          investedPension2Tfr: 0,      // Hardcoded 0 for UI simplicity
          
          // Legacy fields for backward compatibility (calculated total)
          investedPension1: form.investedPension1Voluntary + form.investedPension1Employer + form.investedPension1Tfr,
          investedPension2: form.investedPension2Voluntary,

          income: totalIncome,
          expenses: totalExpenses,
          savings: savings,
          
          incomeDetails: incDet,
          expenseDetails: expDet,

          notes: form.notes
      };
      onAddRecord(newRec);
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
          invested: acc.invested + (
              r.investedStocks + (r.investedEtf||0) + r.investedBonds + (r.investedLiquidity||0) +
              (r.investedCrypto||0) + (r.investedDerivatives||0) + (r.investedCommodities||0) + 
              (r.investedPension1Voluntary || 0) + (r.investedPension2Voluntary || 0) 
              // Note: Only counting Voluntary contributions as "Invested from Income" for averages
          )
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

  // Pie Chart Data
  const expensePieData = expenseCats.map(c => ({ name: c.label, value: form.details[c.id] || 0, color: c.color })).filter(d => d.value > 0);
  const allAssets = [
      { id: 'stocks', name: 'Azioni', value: form.stocksValue, color: '#60A5FA' },
      { id: 'etf', name: 'ETF', value: form.etfValue, color: '#93C5FD' },
      { id: 'crypto', name: 'Crypto', value: form.cryptoValue, color: '#C084FC' },
      { id: 'commodities', name: 'Mat. Prime', value: form.commoditiesValue, color: '#FCD34D' },
      { id: 'derivatives', name: 'Derivati', value: form.derivativesValue, color: '#F87171' },
      { id: 'bonds', name: 'Obbligazioni', value: form.bondsValue, color: '#4ADE80' },
      { id: 'liquidity', name: 'Liquidità', value: form.liquidityValue, color: '#2DD4BF' },
      { id: 'pension', name: 'Fondi Pens.', value: form.pension1Value + form.pension2Value, color: '#FDBA74' },
  ];
  const activeAssets = allAssets.filter(a => !excludedAssets.includes(a.id) && a.value > 0);
  const totalActiveAssets = activeAssets.reduce((acc, a) => acc + a.value, 0);
  const assetPieData = activeAssets.map(a => ({ ...a, percent: totalActiveAssets > 0 ? (a.value / totalActiveAssets) * 100 : 0 }));
  const toggleAssetExclusion = (id: string) => {
      setExcludedAssets(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  // Stats
  const thisYearRecords = filteredData.filter(d => d.year === currentYear);
  const totalSavingsYear = thisYearRecords.reduce((acc, curr) => acc + curr.savings, 0);
  const totalIncomeYear = thisYearRecords.reduce((acc, curr) => acc + curr.income, 0);
  const avgSavingsRate = totalIncomeYear > 0 ? (totalSavingsYear / totalIncomeYear) * 100 : 0;
  
  // Market Gain Calculation
  const getPerformance = (current: MonthlyRecord, prev: MonthlyRecord | undefined) => {
      if (!prev) return { abs: 0, pct: 0 };
      
      const assetsCurr = 
        current.stocksValue + (current.etfValue||0) + current.bondsValue + (current.liquidityValue||0) +
        (current.cryptoValue||0) + (current.derivativesValue||0) + (current.commoditiesValue||0) +
        current.pensionFund1Value + current.pensionFund2Value;
        
      const assetsPrev = 
        prev.stocksValue + (prev.etfValue||0) + prev.bondsValue + (prev.liquidityValue||0) +
        (prev.cryptoValue||0) + (prev.derivativesValue||0) + (prev.commoditiesValue||0) +
        prev.pensionFund1Value + prev.pensionFund2Value;
      
      // For performance, we count ALL inflows to pension (Vol+Emp+TFR) as "New Invested Capital"
      const investedCurr = 
        current.investedStocks + (current.investedEtf||0) + current.investedBonds + (current.investedLiquidity||0) +
        (current.investedCrypto||0) + (current.investedDerivatives||0) + (current.investedCommodities||0) +
        (current.investedPension1Voluntary || 0) + (current.investedPension1Employer || 0) + (current.investedPension1Tfr || 0) +
        (current.investedPension2Voluntary || 0) + (current.investedPension2Employer || 0) + (current.investedPension2Tfr || 0);
      
      const gain = assetsCurr - (assetsPrev + investedCurr);
      const returnPct = assetsPrev > 0 ? (gain / assetsPrev) * 100 : 0;
      return { abs: gain, pct: returnPct };
  };
  
  const getTotalWealth = (r: MonthlyRecord) => 
    r.stocksValue + (r.etfValue||0) + r.bondsValue + (r.liquidityValue||0) +
    (r.cryptoValue||0) + (r.derivativesValue||0) + (r.commoditiesValue||0) +
    r.pensionFund1Value + r.pensionFund2Value;

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DashboardCard title="Risparmio Totale (Anno Corr.)" value={formatCurrency(totalSavingsYear)} icon={<PiggyBankIcon />} subtext="Cash Flow positivo" variant="success" />
            <DashboardCard title="Savings Rate Medio (Anno Corr.)" value={`${avgSavingsRate.toFixed(1)}%`} icon={<ArrowUpIcon />} subtext="Obiettivo: >20%" variant={avgSavingsRate > 20 ? 'success' : 'default'} />
             <DashboardCard title="Ultimo Patrimonio Netto" value={filteredData.length > 0 ? formatCurrency(getTotalWealth(filteredData[filteredData.length-1])) : '-'} icon={<ArrowUpIcon />} subtext="Snapshot mensile" />
        </div>
        
        {/* TABELLA MEDIE */}
        <div className="bg-brand-secondary/60 border border-brand-accent/50 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-4 flex items-center gap-2"><ChartBarIcon /> Medie Mensili per Simulazione</h3>
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
                            <td className="py-3 text-left font-medium text-brand-light">Nuovi Investimenti (Miei)</td>
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
            <div className="lg:col-span-2 bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg h-fit">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-brand-text">Nuovo Record Mensile</h3>
                    <div className="flex gap-2">
                        <button onClick={handleResetForm} className="text-xs flex items-center gap-1 bg-orange-900/20 hover:bg-orange-800/40 text-orange-300 border border-orange-500/30 px-3 py-1 rounded transition" title="Azzera tutti i valori numerici">
                            <RefreshIcon /> Azzera Campi
                        </button>
                        <button onClick={() => setShowCatSettings(!showCatSettings)} className="text-xs bg-brand-primary border border-brand-accent hover:text-brand-teal text-brand-light px-3 py-1 rounded transition">
                            {showCatSettings ? 'Chiudi Impostazioni' : 'Configura Categorie'}
                        </button>
                    </div>
                </div>

                {/* CATEGORY SETTINGS PANEL */}
                {showCatSettings && (
                    <div className="mb-6 bg-brand-primary/30 p-4 rounded-lg border border-brand-accent/20">
                        <h4 className="text-sm font-bold text-brand-text mb-3">Gestisci Categorie Spese/Entrate</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4 items-end">
                             <div><label className="text-xs text-brand-light mb-1 block">Nome</label><input type="text" value={newCat.label} onChange={e => setNewCat({...newCat, label: e.target.value})} className="w-full bg-brand-secondary border border-brand-accent rounded p-1.5 text-sm text-brand-text"/></div>
                             <div><label className="text-xs text-brand-light mb-1 block">Tipo</label><select value={newCat.type} onChange={e => setNewCat({...newCat, type: e.target.value as 'income' | 'expense'})} className="w-full bg-brand-secondary border border-brand-accent rounded p-1.5 text-sm text-brand-text"><option value="income">Entrata</option><option value="expense">Uscita</option></select></div>
                             <div><label className="text-xs text-brand-light mb-1 block">Colore</label><input type="color" value={newCat.color} onChange={e => setNewCat({...newCat, color: e.target.value})} className="w-full h-8 bg-transparent border-none cursor-pointer"/></div>
                             <div className="flex gap-2"><button onClick={handleSaveCategory} className="bg-brand-teal hover:bg-brand-teal/80 text-white text-sm font-bold py-1.5 px-3 rounded flex-1">{editingId ? 'Aggiorna' : 'Aggiungi'}</button>{editingId && (<button onClick={handleCancelEdit} className="bg-brand-primary border border-brand-light/20 text-brand-light hover:text-brand-text text-sm font-bold py-1.5 px-3 rounded">&times;</button>)}</div>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                            {categories.map(c => (
                                <div key={c.id} className="flex items-center bg-brand-secondary border border-brand-accent/30 rounded px-2 py-1 text-xs">
                                    <div className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: c.color}}></div><span className="text-brand-text mr-2">{c.label}</span>
                                    <button onClick={() => handleEditClick(c)} className="text-brand-light hover:text-brand-teal mr-2" title="Modifica"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                                    <button onClick={() => handleDeleteCategory(c.id)} className="text-red-400 hover:text-red-300 font-bold" title="Elimina">&times;</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {/* DATE */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col"><label className="text-xs text-brand-light mb-1.5 font-medium uppercase">Anno</label><input type="number" value={form.year} onChange={e => {const y = parseInt(e.target.value); handleDateChange(y, form.month);}} className="bg-brand-primary border border-brand-accent rounded-lg p-2 text-brand-text" /></div>
                        <div className="flex flex-col"><label className="text-xs text-brand-light mb-1.5 font-medium uppercase">Mese</label><select value={form.month} onChange={e => {const m = parseInt(e.target.value); handleDateChange(form.year, m);}} className="bg-brand-primary border border-brand-accent rounded-lg p-2 text-brand-text">{MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}</select></div>
                    </div>
                    
                    {/* ASSETS */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-brand-teal uppercase">1. Valore Asset (Snapshot Fine Mese)</h4>
                        <div className="bg-brand-primary/20 p-4 rounded-lg border border-brand-accent/10">
                            <div className="flex items-center mb-3 gap-2"><div className="w-2 h-2 rounded-full bg-blue-400"></div><h5 className="text-xs font-bold text-blue-200 uppercase">Asset Azionari & Alternativi (Tax 26%)</h5></div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <InputField label="Azioni Singole" value={form.stocksValue} onChange={v => setForm(p => ({...p, stocksValue: v}))} suffix="€" color="#60A5FA" />
                                <InputField label="ETF" value={form.etfValue} onChange={v => setForm(p => ({...p, etfValue: v}))} suffix="€" color="#93C5FD" />
                                <InputField label="Criptovalute" value={form.cryptoValue} onChange={v => setForm(p => ({...p, cryptoValue: v}))} suffix="€" color="#C084FC" />
                                <InputField label="Materie Prime" value={form.commoditiesValue} onChange={v => setForm(p => ({...p, commoditiesValue: v}))} suffix="€" color="#FCD34D" />
                                <InputField label="Derivati" value={form.derivativesValue} onChange={v => setForm(p => ({...p, derivativesValue: v}))} suffix="€" color="#F87171" />
                            </div>
                        </div>
                        <div className="bg-brand-primary/20 p-4 rounded-lg border border-brand-accent/10">
                             <div className="flex items-center mb-3 gap-2"><div className="w-2 h-2 rounded-full bg-green-400"></div><h5 className="text-xs font-bold text-green-200 uppercase">Obbligazioni & Sicurezza</h5></div>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Obblig. White List" value={form.bondsValue} onChange={v => setForm(p => ({...p, bondsValue: v}))} suffix="€" color="#4ADE80" />
                                <InputField label="Liquidità (CC/Contanti)" value={form.liquidityValue} onChange={v => setForm(p => ({...p, liquidityValue: v}))} suffix="€" color="#2DD4BF" />
                            </div>
                        </div>
                         <div className="bg-brand-primary/20 p-4 rounded-lg border border-brand-accent/10">
                             <div className="flex items-center mb-3 gap-2"><div className="w-2 h-2 rounded-full bg-brand-gold"></div><h5 className="text-xs font-bold text-brand-gold uppercase">Fondi Pensione</h5></div>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label="Fondo Pensione 1" value={form.pension1Value} onChange={v => setForm(p => ({...p, pension1Value: v}))} suffix="€" color="#FDBA74" />
                                <InputField label="Fondo Pensione 2" value={form.pension2Value} onChange={v => setForm(p => ({...p, pension2Value: v}))} suffix="€" color="#FDBA74" />
                            </div>
                        </div>
                    </div>

                    {/* INVESTMENTS FLOW - MODIFIED FOR PENSION SPLIT */}
                    <div className="space-y-4 mt-6">
                         <h4 className="text-xs font-bold text-blue-300 uppercase">2. Investimenti (Nuova Cassa Immessa)</h4>
                         
                         <div className="bg-brand-primary/20 p-4 rounded-lg border border-brand-accent/10">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                <InputField label="+ Azioni" value={form.investedStocks} onChange={v => setForm(p => ({...p, investedStocks: v}))} suffix="€" />
                                <InputField label="+ ETF" value={form.investedEtf} onChange={v => setForm(p => ({...p, investedEtf: v}))} suffix="€" />
                                <InputField label="+ Cripto" value={form.investedCrypto} onChange={v => setForm(p => ({...p, investedCrypto: v}))} suffix="€" />
                                <InputField label="+ Mat. Prime" value={form.investedCommodities} onChange={v => setForm(p => ({...p, investedCommodities: v}))} suffix="€" />
                                <InputField label="+ Derivati" value={form.investedDerivatives} onChange={v => setForm(p => ({...p, investedDerivatives: v}))} suffix="€" />
                                <InputField label="+ Obblig." value={form.investedBonds} onChange={v => setForm(p => ({...p, investedBonds: v}))} suffix="€" />
                                <InputField label="+ Liquidità" value={form.investedLiquidity} onChange={v => setForm(p => ({...p, investedLiquidity: v}))} suffix="€" />
                            </div>

                            {/* PENSION FUNDS SPECIAL SECTION */}
                            <div className="grid grid-cols-1 gap-4 border-t border-brand-accent/20 pt-4">
                                {/* FP 1 - Detailed */}
                                <div className="bg-brand-gold/10 p-3 rounded border border-brand-gold/20">
                                    <div className="flex items-center gap-2 mb-2 text-brand-gold text-xs font-bold uppercase">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-gold"></div>
                                        Fondo Pensione 1 (Dettaglio)
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <InputField label="FP1 (Volontario)" value={form.investedPension1Voluntary} onChange={v => setForm(p => ({...p, investedPension1Voluntary: v}))} suffix="€" />
                                        <InputField label="FP1 (Datore)" value={form.investedPension1Employer} onChange={v => setForm(p => ({...p, investedPension1Employer: v}))} suffix="€" color="#A3B18A" />
                                        <InputField label="FP1 (TFR)" value={form.investedPension1Tfr} onChange={v => setForm(p => ({...p, investedPension1Tfr: v}))} suffix="€" color="#A3B18A" />
                                    </div>
                                </div>
                                
                                {/* FP 2 - Simple */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <InputField label="+ FP 2 (Volontario)" value={form.investedPension2Voluntary} onChange={v => setForm(p => ({...p, investedPension2Voluntary: v}))} suffix="€" />
                                </div>
                            </div>
                         </div>
                    </div>
                    
                    {/* DETAILS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="bg-green-900/10 p-4 rounded-lg border border-green-500/20">
                            <div className="flex justify-between mb-3"><h4 className="text-xs font-bold text-green-400 uppercase">3. Entrate</h4><span className="text-xs font-mono font-bold text-green-300">{formatCurrency(totalIncome)}</span></div>
                            <div className="grid grid-cols-2 gap-3">
                                {incomeCats.map(c => (<InputField key={c.id} label={c.label} value={form.details[c.id] || 0} onChange={v => handleDetailChange(c.id, v)} suffix="€" />))}
                                {incomeCats.length === 0 && <p className="text-xs text-brand-light italic col-span-2">Nessuna categoria entrata configurata.</p>}
                            </div>
                        </div>
                         <div className="bg-red-900/10 p-4 rounded-lg border border-red-500/20">
                            <div className="flex justify-between mb-3"><h4 className="text-xs font-bold text-red-400 uppercase">4. Uscite</h4><span className="text-xs font-mono font-bold text-red-300">{formatCurrency(totalExpenses)}</span></div>
                            <div className="grid grid-cols-2 gap-3">
                                {expenseCats.map(c => (<InputField key={c.id} label={c.label} value={form.details[c.id] || 0} onChange={v => handleDetailChange(c.id, v)} suffix="€" />))}
                                {expenseCats.length === 0 && <p className="text-xs text-brand-light italic col-span-2">Nessuna categoria uscita configurata.</p>}
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-brand-primary/30 p-3 rounded-lg text-center flex justify-around items-center mt-4">
                        <div><p className="text-xs text-brand-light uppercase">Risparmio Netto</p><p className={`text-lg font-bold ${savings >= 0 ? 'text-brand-text' : 'text-red-400'}`}>{formatCurrency(savings)}</p></div>
                        <div className="h-8 w-px bg-brand-accent/30"></div>
                        <div><p className="text-xs text-brand-light uppercase">Totale Investito</p><p className="text-lg font-bold text-blue-300">{formatCurrency(totalInvestedFlow)}</p></div>
                    </div>
                    
                    <input type="text" placeholder="Note (opzionale)" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-brand-primary border border-brand-accent rounded-lg p-2 text-sm text-brand-text mt-4"/>
                    <button onClick={handleAdd} className="w-full mt-4 bg-brand-teal hover:bg-brand-teal/80 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg">Registra Mese</button>
                </div>
            </div>

            {/* CHARTS COLUMN */}
            <div className="lg:col-span-1 space-y-6">
                 {/* EXPENSES PIE */}
                 <div className="bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg flex flex-col items-center justify-center min-h-[300px]">
                    <h3 className="text-sm font-bold text-brand-text uppercase mb-2">Distribuzione Spese</h3>
                    {totalExpenses > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={expensePieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                                    {expensePieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p className="text-xs text-brand-light italic my-10">Inserisci spese per vedere il grafico</p>}
                    <div className="w-full text-xs space-y-1 mt-2">
                        {expensePieData.map((entry, index) => {
                            const pct = totalExpenses > 0 ? (entry.value / totalExpenses) * 100 : 0;
                            return (<div key={index} className="flex justify-between items-center border-b border-brand-accent/10 pb-1"><span style={{color: entry.color}}>{entry.name}</span><div className="text-right"><span className="block font-bold">{formatCurrency(entry.value)}</span><span className="block text-[10px] text-brand-light">{pct.toFixed(1)}%</span></div></div>);
                        })}
                    </div>
                </div>

                {/* ASSET ALLOCATION */}
                <div className="bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg flex flex-col items-center justify-center min-h-[300px]">
                    <h3 className="text-sm font-bold text-brand-text uppercase mb-2">Asset Allocation</h3>
                    <div className="flex flex-wrap gap-1 justify-center mb-4">
                        {allAssets.map(asset => (asset.value > 0 && (<button key={asset.id} onClick={() => toggleAssetExclusion(asset.id)} className={`text-[10px] px-2 py-1 rounded border transition-colors ${excludedAssets.includes(asset.id) ? 'bg-transparent text-brand-light border-brand-light/20 opacity-50 line-through' : 'bg-brand-primary text-brand-text border-brand-accent'}`} style={{ borderColor: excludedAssets.includes(asset.id) ? undefined : asset.color }}>{asset.name}</button>)))}
                    </div>
                    {totalActiveAssets > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={assetPieData} cx="50%" cy="50%" innerRadius={0} outerRadius={70} paddingAngle={2} dataKey="value">
                                    {assetPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <p className="text-xs text-brand-light italic my-10">Nessun asset attivo selezionato</p>}
                     <div className="w-full text-xs space-y-1 mt-2">
                         <div className="flex justify-between font-bold border-b border-brand-accent/30 pb-1 mb-1"><span>Totale Selezionato</span><span>{formatCurrency(totalActiveAssets)}</span></div>
                        {assetPieData.map((entry, index) => (<div key={index} className="flex justify-between items-center border-b border-brand-accent/10 pb-1"><div className="flex items-center"><div className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: entry.color}}></div><span>{entry.name}</span></div><div className="text-right"><span className="block font-bold">{formatCurrency(entry.value)}</span><span className="block text-[10px] text-brand-light">{entry.percent.toFixed(1)}%</span></div></div>))}
                    </div>
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
                        <th className="px-4 py-3 text-right text-blue-300" title="Azioni + ETF">Azioni/ETF</th>
                        <th className="px-4 py-3 text-right text-purple-300" title="Cripto + Derivati + Commodities">Alt. Risk</th>
                        <th className="px-4 py-3 text-right text-green-300">Obblig.</th>
                        <th className="px-4 py-3 text-right text-teal-300">Liqu.</th>
                        <th className="px-4 py-3 text-right text-brand-gold">Fondi P.</th>
                        <th className="px-4 py-3 text-right border-l border-brand-accent/20">Rend. Mese</th>
                        <th className="px-4 py-3 text-right">% Mese</th>
                        <th className="px-4 py-3 text-right text-green-400">Risp.</th>
                        <th className="px-4 py-3 text-center">Azioni</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.reverse().map((rec, idx) => {
                        const prevRec = filteredData[idx + 1]; 
                        const totalStocksEtf = rec.stocksValue + (rec.etfValue||0);
                        const totalAltRisk = (rec.cryptoValue||0) + (rec.derivativesValue||0) + (rec.commoditiesValue||0);
                        const totalPension = rec.pensionFund1Value + rec.pensionFund2Value;
                        const netWorth = getTotalWealth(rec);
                        const performance = getPerformance(rec, prevRec);

                        return (
                            <tr key={rec.id} className="border-b border-brand-accent/10 hover:bg-brand-primary/10">
                                <td className="px-4 py-3 font-medium">{MONTHS[rec.month-1].substring(0,3)} {rec.year}</td>
                                <td className="px-4 py-3 text-right font-bold">{formatCurrency(netWorth)}</td>
                                <td className="px-4 py-3 text-right font-mono text-blue-300/80">{formatCurrency(totalStocksEtf)}</td>
                                <td className="px-4 py-3 text-right font-mono text-purple-300/80">{formatCurrency(totalAltRisk)}</td>
                                <td className="px-4 py-3 text-right font-mono text-green-300/80">{formatCurrency(rec.bondsValue)}</td>
                                <td className="px-4 py-3 text-right font-mono text-teal-300/80">{formatCurrency(rec.liquidityValue || 0)}</td>
                                <td className="px-4 py-3 text-right font-mono text-brand-gold/80">{formatCurrency(totalPension)}</td>
                                <td className={`px-4 py-3 text-right font-mono border-l border-brand-accent/20 ${performance.abs >= 0 ? 'text-green-400' : 'text-red-400'}`}>{prevRec ? (performance.abs > 0 ? '+' : '') + formatCurrency(performance.abs) : '-'}</td>
                                <td className={`px-4 py-3 text-right font-mono ${performance.pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>{prevRec ? (performance.pct > 0 ? '+' : '') + performance.pct.toFixed(2) + '%' : '-'}</td>
                                <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(rec.savings)}</td>
                                <td className="px-4 py-3 text-center"><button onClick={() => onDeleteRecord(rec.id)} className="text-red-400 hover:text-red-300"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></td>
                            </tr>
                        );
                    })}
                    {filteredData.length === 0 && (<tr><td colSpan={10} className="text-center py-4 text-brand-light italic">Nessun dato mensile inserito</td></tr>)}
                </tbody>
            </table>
        </div>
    </div>
  );
};

export default MonthlyTrackingView;
