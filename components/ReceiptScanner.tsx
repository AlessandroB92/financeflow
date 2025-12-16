import React, { useState, useRef, useLayoutEffect } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import gsap from 'gsap';
import * as GeminiService from '../services/geminiService.ts';
import { Transaction } from '../types.ts';

export const ReceiptScanner = ({ onClose, onScanComplete }: { onClose: () => void, onScanComplete: (data: Partial<Transaction>) => void }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef(null);

  useLayoutEffect(() => {
    gsap.fromTo(modalRef.current, { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" });
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!GeminiService.hasApiKey()) {
        alert("API Key mancante. Configurala in index.html");
        return;
    }

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      const data = await GeminiService.analyzeReceipt(base64String);
      setIsAnalyzing(false);
      if (data) {
        onScanComplete({ ...data, receiptImage: reader.result as string });
      } else {
        alert("Impossibile leggere lo scontrino. Riprova.");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div ref={modalRef} className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 hover:text-slate-800 transition-colors z-10">
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-2">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
            <Camera className="w-6 h-6" /> 
          </div>
          Scan Scontrino (AI)
        </h3>

        {!GeminiService.hasApiKey() ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
                <p className="font-bold mb-1">Configurazione Richiesta</p>
                Per usare lo scanner AI, inserisci la tua API Key di Gemini nel file <code>index.html</code>.
            </div>
        ) : isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative w-16 h-16 mb-6">
               <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-700"></div>
               <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium animate-pulse">Gemini sta leggendo lo scontrino...</p>
          </div>
        ) : (
          <div className="space-y-4">
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="group border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all duration-300"
             >
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                   <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 text-center">Tocca per caricare o scattare</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
             </div>
             <p className="text-xs text-slate-400 text-center px-4">
               L'intelligenza artificiale estrarrà automaticamente importo, data, categoria e dettagli.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};
