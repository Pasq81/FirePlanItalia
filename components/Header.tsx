
import React from 'react';
import { LogoIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="bg-brand-secondary/50 backdrop-blur-sm sticky top-0 z-10 border-b border-brand-accent/20">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-center md:justify-between">
        <div className="flex items-center space-x-3">
          <LogoIcon />
          <h1 className="text-2xl font-bold text-brand-text tracking-wider">
            FinJourney
          </h1>
        </div>
        {/* Placeholder for potential future navigation or user profile */}
        <div className="hidden md:block"></div>
      </div>
    </header>
  );
};

export default Header;
