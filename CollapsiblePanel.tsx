import React, { useState } from 'react';
import { ChevronDownIcon } from './Icons';

interface CollapsiblePanelProps {
  title: string;
  children: React.ReactNode;
  initialOpen?: boolean;
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({ title, children, initialOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div className="bg-brand-secondary border border-brand-accent rounded-xl shadow-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <h2 className="text-xl font-bold text-brand-text">{title}</h2>
        <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDownIcon />
        </div>
      </button>
      <div
        className={`transition-all duration-500 ease-in-out grid ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
            <div className="p-4 pt-0">
                {children}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsiblePanel;
