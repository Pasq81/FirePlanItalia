
import React from 'react';
import type { WealthRecord, WealthType } from '../types';
import { WalletIcon } from './Icons';

interface TransactionListProps {
  transactions: WealthRecord[];
}

const getTypeLabel = (type: WealthType) => {
    switch(type) {
        case 'pension1': return 'Fondo P. 1';
        case 'pension2': return 'Fondo P. 2';
        default: return 'Investimenti';
    }
}

const getTypeColor = (type: WealthType) => {
    switch(type) {
        case 'pension1': return 'text-blue-400 bg-blue-400/10';
        case 'pension2': return 'text-purple-400 bg-purple-400/10';
        default: return 'text-brand-gold bg-brand-gold/10';
    }
}

const WealthItem: React.FC<{ record: WealthRecord }> = ({ record }) => {
  const typeLabel = getTypeLabel(record.type);
  const typeClass = getTypeColor(record.type);

  return (
    <li className="flex items-center justify-between p-4 bg-brand-secondary/50 hover:bg-brand-secondary rounded-lg transition-colors duration-200">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-full ${typeClass}`}>
          <WalletIcon />
        </div>
        <div>
          <div className="flex items-center space-x-2">
             <p className="font-semibold text-brand-text">{record.year}</p>
             <span className={`text-xs px-2 py-0.5 rounded-full border border-white/10 ${typeClass}`}>
                {typeLabel}
             </span>
          </div>
          {record.note && <p className="text-sm text-brand-light">{record.note}</p>}
        </div>
      </div>
      <p className="font-bold text-lg text-brand-text">
        {record.amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
      </p>
    </li>
  );
};


const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  return (
    <div className="bg-brand-secondary border border-brand-accent rounded-xl p-6 shadow-lg h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-text">Storico Annuale</h2>
      </div>
      
      {transactions.length === 0 ? (
        <p className="text-brand-light text-center italic">Nessun dato registrato.</p>
      ) : (
        <ul className="space-y-4 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-brand-accent">
          {transactions
            .sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return a.type.localeCompare(b.type);
            })
            .map((record) => (
              <WealthItem key={record.id} record={record} />
            ))}
        </ul>
      )}
    </div>
  );
};

export default TransactionList;
