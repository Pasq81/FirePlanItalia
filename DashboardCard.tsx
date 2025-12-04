
import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | React.ReactNode;
  icon: React.ReactNode;
  subtext?: string;
  variant?: 'default' | 'danger' | 'success';
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, subtext, variant = 'default' }) => {
  const baseClasses = "rounded-xl p-6 shadow-lg border transition-all duration-300";
  
  let variantClasses = "bg-brand-secondary border-brand-accent";
  let textClass = "text-brand-text";
  let iconClass = "text-brand-teal";

  if (variant === 'danger') {
    variantClasses = "bg-red-900/20 border-red-500/50";
    textClass = "text-red-100";
    iconClass = "text-red-500";
  } else if (variant === 'success') {
    variantClasses = "bg-green-900/20 border-green-500/50";
    textClass = "text-green-100";
    iconClass = "text-green-500";
  }

  return (
    <div className={`${baseClasses} ${variantClasses}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-brand-light text-sm font-medium uppercase tracking-wider">{title}</h3>
        <div className={iconClass}>{icon}</div>
      </div>
      <div className={`text-3xl font-bold ${textClass} mb-1`}>{value}</div>
      {subtext && <p className="text-xs text-brand-light opacity-80">{subtext}</p>}
    </div>
  );
};

export default DashboardCard;
