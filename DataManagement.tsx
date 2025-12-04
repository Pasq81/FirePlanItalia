
import React, { useRef } from 'react';
import type { BackupData } from '../types';

interface DataManagementProps {
  onExport: () => BackupData;
  onImport: (data: BackupData) => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ onExport, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = () => {
    const data = onExport();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = href;
    link.download = `finjourney_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadClick = () => {
    // Reset the value to ensure onChange fires even if the same file is selected again
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json) as BackupData;
        
        // Simple validation check
        if (data.profile && data.financials) {
            if (window.confirm("Sei sicuro di voler sovrascrivere i dati attuali con questo backup? Questa azione è irreversibile.")) {
                onImport(data);
                alert("Dati importati con successo!");
            }
        } else {
            alert("Il file non sembra essere un backup valido di FinJourney.");
        }
      } catch (err) {
        alert("Errore durante la lettura del file JSON.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mt-12 border-t border-brand-accent/20 pt-8 pb-4">
      <h3 className="text-lg font-bold text-brand-text mb-4">Gestione Dati & Backup</h3>
      <div className="bg-brand-secondary/50 p-4 rounded-lg border border-brand-accent/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
            <p className="text-sm text-brand-light">
                I tuoi dati sono salvati solo nel browser. Scarica regolarmente un backup per evitare di perderli se cancelli la cache.
            </p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-brand-primary border border-brand-accent hover:bg-brand-accent hover:text-white text-brand-text rounded-md transition-colors text-sm font-medium"
            >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Esporta Backup (JSON)
            </button>
            <button 
                onClick={handleUploadClick}
                className="flex items-center px-4 py-2 bg-brand-primary border border-brand-accent hover:bg-brand-teal hover:text-white hover:border-brand-teal text-brand-text rounded-md transition-colors text-sm font-medium"
            >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                Importa Backup
            </button>
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
            />
        </div>
      </div>
    </div>
  );
};

export default DataManagement;