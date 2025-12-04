
import React from 'react';
import { 
  ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine 
} from 'recharts';
import type { SimulationYear, ActualRecord } from '../types';

interface ChartProps {
  data: SimulationYear[];
}

interface ComparisonProps {
    simulated: SimulationYear[];
    actual: ActualRecord[];
}

const formatCurrency = (val: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

export const WealthEvolutionChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#26A69A" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#26A69A" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorPension1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFC107" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#FFC107" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorPension2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF8A65" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#FF8A65" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#415A77" opacity={0.3} />
          <XAxis dataKey="age" stroke="#778DA9" label={{ value: 'Età', position: 'insideBottomRight', offset: -10, fill: '#778DA9' }} />
          <YAxis stroke="#778DA9" tickFormatter={(val) => `€${(val/1000).toFixed(0)}k`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1B263B', borderColor: '#415A77', color: '#E0E1DD' }}
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label) => `Età: ${label}`}
          />
          <Legend />
          <Area type="monotone" dataKey="portfolioValue" name="Portafoglio Personale" stackId="1" stroke="#26A69A" fill="url(#colorPortfolio)" />
          <Area type="monotone" dataKey="pensionFund1Value" name="Fondo Pensione 1" stackId="1" stroke="#FFC107" fill="url(#colorPension1)" />
          <Area type="monotone" dataKey="pensionFund2Value" name="Fondo Pensione 2" stackId="1" stroke="#FF8A65" fill="url(#colorPension2)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export const IncomeStackChart: React.FC<ChartProps> = ({ data }) => {
  // Filter only from FIRE age onwards for better visibility
  const fireData = data.filter(d => d.phase !== 'accumulation');

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={fireData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#415A77" opacity={0.3} />
          <XAxis dataKey="age" stroke="#778DA9" />
          <YAxis stroke="#778DA9" tickFormatter={(val) => `€${(val/1000).toFixed(0)}k`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1B263B', borderColor: '#415A77', color: '#E0E1DD' }}
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label) => `Età: ${label}`}
          />
          <Legend />
          <Bar dataKey="incomeInps" name="Pensione INPS" stackId="a" fill="#415A77" />
          <Bar dataKey="incomeRita" name="RITA (Fondi P.)" stackId="a" fill="#FFC107" />
          <Bar dataKey="incomeNaspi" name="NASpI" stackId="a" fill="#E57373" />
          <Bar dataKey="withdrawalPortfolioNet" name="Prelievo Portafoglio" stackId="a" fill="#26A69A" />
          
          <Line type="monotone" dataKey="totalExpenses" name="Spese Necessarie" stroke="#EF4444" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ComparisonChart: React.FC<ComparisonProps> = ({ simulated, actual }) => {
    // Merge data based on year/age
    const mergedData = simulated.map(sim => {
        const act = actual.find(a => a.year === sim.year);
        return {
            ...sim,
            simulatedTotal: sim.portfolioValue + sim.pensionFund1Value + sim.pensionFund2Value,
            actualTotal: act ? act.totalWealth : null
        };
    });

    return (
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mergedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSim" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#415A77" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#415A77" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#415A77" opacity={0.3} />
              <XAxis dataKey="year" stroke="#778DA9" />
              <YAxis stroke="#778DA9" tickFormatter={(val) => `€${(val/1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1B263B', borderColor: '#415A77', color: '#E0E1DD' }}
                formatter={(value: any, name: string) => {
                    if (value === null) return ['-', name];
                    return [formatCurrency(value), name];
                }}
                labelFormatter={(label) => `Anno: ${label}`}
              />
              <Legend />
              
              <Area 
                type="monotone" 
                dataKey="simulatedTotal" 
                name="Patrimonio Simulato" 
                stroke="#415A77" 
                fill="url(#gradSim)" 
                strokeDasharray="5 5"
              />
              
              <Line 
                type="monotone" 
                dataKey="actualTotal" 
                name="Patrimonio Reale" 
                stroke="#FFC107" 
                strokeWidth={3}
                dot={{ r: 4, fill: "#FFC107", strokeWidth: 2, stroke: "#1B263B" }}
                connectNulls={true}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      );
}
