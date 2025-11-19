
import React from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ChartDataPoint } from '../types';

interface ChartProps {
  data: ChartDataPoint[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-brand-secondary/95 backdrop-blur-sm p-4 border border-brand-accent rounded-lg shadow-xl z-50">
        <p className="text-brand-text mb-2 font-bold border-b border-brand-light/20 pb-1">{`Età: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} style={{ color: entry.color }} className="mb-1 text-sm flex justify-between space-x-4">
            <span className="font-medium">{entry.name}:</span>
            <span className="font-mono">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const BalanceChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg h-full flex flex-col">
      <h2 className="text-2xl font-bold text-brand-text mb-6">Proiezione Patrimonio Totale</h2>
      <div className="flex-grow w-full min-h-[400px]">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
                <linearGradient id="gradPersonal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFC107" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FFC107" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="gradP1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="gradP2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#A78BFA" stopOpacity={0.1}/>
                </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(119, 141, 169, 0.15)" vertical={false} />
            
            <XAxis 
              dataKey="eta" 
              stroke="#778DA9" 
              tick={{ fill: '#778DA9', fontSize: 12 }} 
              type="number"
              domain={['auto', 'auto']}
            />
            
            {/* Left Axis for Wealth (Stacked) */}
            <YAxis 
              yAxisId="left"
              