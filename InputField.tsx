
import React, { useState, useRef, useEffect } from 'react';
import { CalculatorIcon } from './Icons';

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  suffix?: string;
  step?: string;
  color?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, suffix, step = "1", color }) => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [expression, setExpression] = useState('');
  const [calcResult, setCalcResult] = useState<number | null>(null);
  const calcRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close calculator when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calcRef.current && !calcRef.current.contains(event.target as Node)) {
        setShowCalculator(false);
      }
    };
    if (showCalculator) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalculator]);

  // Focus input when calculator opens
  useEffect(() => {
      if (showCalculator && inputRef.current) {
          inputRef.current.focus();
      }
  }, [showCalculator]);

  const handleCalculate = (expr: string) => {
    // Only allow numbers, +, -, *, /, ., (, ) and spaces
    if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
      setCalcResult(null);
      return;
    }
    try {
      // eslint-disable-next-line no-new-func
      const res = new Function('return ' + expr)();
      if (isFinite(res)) {
        setCalcResult(res);
      } else {
        setCalcResult(null);
      }
    } catch {
      setCalcResult(null);
    }
  };

  const handleChangeExpression = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setExpression(val);
    handleCalculate(val);
  };

  const applyResult = () => {
    if (calcResult !== null) {
      onChange(calcResult);
      setShowCalculator(false);
      setExpression('');
      setCalcResult(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          applyResult();
      } else if (e.key === 'Escape') {
          setShowCalculator(false);
      }
  };

  return (
    <div className="flex flex-col relative">
      <label 
        className={`text-xs mb-1.5 font-medium uppercase truncate ${color ? '' : 'text-brand-light'}`} 
        style={{ color: color }}
      >
        {label}
      </label>
      <div className="relative group">
        <input 
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-brand-primary border border-brand-accent rounded-lg p-2.5 text-brand-text focus:ring-2 focus:ring-brand-teal focus:border-transparent transition font-mono"
        />
        
        <div className="absolute right-2 top-0 bottom-0 flex items-center gap-2">
            {suffix && (
                <span className="text-brand-light text-sm select-none">{suffix}</span>
            )}
            <button 
                onClick={() => setShowCalculator(!showCalculator)}
                className="text-brand-light hover:text-brand-teal p-1 rounded transition-colors"
                title="Calcolatrice rapida"
            >
                <CalculatorIcon />
            </button>
        </div>
      </div>

      {/* Calculator Popover */}
      {showCalculator && (
        <div 
            ref={calcRef}
            className="absolute z-50 top-full mt-1 right-0 w-64 bg-brand-secondary border border-brand-accent rounded-lg shadow-2xl p-3"
        >
            <div className="text-xs text-brand-light mb-2">Inserisci operazione (es. 1000 + 500)</div>
            <input 
                ref={inputRef}
                type="text" 
                placeholder="100 + 200..."
                value={expression}
                onChange={handleChangeExpression}
                onKeyDown={handleKeyDown}
                className="w-full bg-brand-primary border border-brand-accent rounded p-2 text-brand-text font-mono text-sm mb-2 focus:ring-1 focus:ring-brand-teal"
            />
            <div className="flex justify-between items-center bg-brand-primary/50 p-2 rounded mb-2">
                <span className="text-xs text-brand-light">Risultato:</span>
                <span className="font-bold text-brand-teal font-mono">
                    {calcResult !== null ? new Intl.NumberFormat('it-IT').format(calcResult) : '-'}
                </span>
            </div>
            <button 
                onClick={applyResult}
                disabled={calcResult === null}
                className="w-full bg-brand-teal hover:bg-brand-teal/80 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-2 rounded transition-colors"
            >
                Usa Risultato
            </button>
        </div>
      )}
    </div>
  );
};

export default InputField;
