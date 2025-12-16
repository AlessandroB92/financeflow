import React, { useState } from 'react';
import { Lock, X, ArrowLeft, Trash2 } from 'lucide-react';
import gsap from 'gsap';

export const PinPad = ({ title, subTitle, onComplete, onCancel, variant = 'fullscreen' }: { title: string, subTitle: string, onComplete: (pin: string) => void, onCancel?: () => void, variant?: 'fullscreen' | 'inline' }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  
  const handleDigit = (d: number) => {
    const next = input + d;
    if (next.length <= 4) {
      setInput(next);
      gsap.fromTo(`#digit-${d}`, { scale: 0.9 }, { scale: 1, duration: 0.2, ease: "back.out(1.7)" });
    }

    if (next.length === 4) {
      setTimeout(() => {
        onComplete(next);
        if (variant === 'inline') setInput(''); 
      }, 300);
    }
  };

  const handleClear = () => {
      setInput('');
  }

  // Styles based on variant
  const containerClass = variant === 'fullscreen' 
    ? "fixed inset-0 bg-slate-900 text-white z-[100] flex flex-col items-center justify-center p-4" 
    : "w-full flex flex-col items-center justify-center py-8";
    
  const cardClass = variant === 'fullscreen'
    ? "flex flex-col items-center w-full max-w-sm"
    : "bg-white dark:bg-slate-800 w-full max-w-[340px] rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 relative";

  return (
    <div className={containerClass}>
      
      <div className={cardClass}>
        
        {onCancel && (
            <button onClick={onCancel} className={`absolute p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-800 dark:hover:text-white ${variant === 'fullscreen' ? 'top-6 right-6 fixed' : 'top-4 left-4'}`}>
                {variant === 'inline' ? <ArrowLeft className="w-6 h-6" /> : <X className="w-6 h-6" />}
            </button>
        )}

        <div className={`flex flex-col items-center animate-in fade-in zoom-in duration-500 mb-8 ${variant === 'inline' ? 'mt-4' : ''}`}>
            <div className={`rounded-full flex items-center justify-center ring-4 ${variant === 'inline' ? 'w-16 h-16 mb-4 bg-emerald-100 dark:bg-emerald-500/20 ring-emerald-50 dark:ring-emerald-500/10' : 'w-24 h-24 mb-8 bg-emerald-500/20 ring-emerald-500/10'}`}>
               <Lock className={`${variant === 'inline' ? 'w-8 h-8' : 'w-12 h-12'} text-emerald-600 dark:text-emerald-500`} />
            </div>
            <h2 className={`${variant === 'inline' ? 'text-2xl' : 'text-3xl'} font-bold tracking-tight text-slate-900 dark:text-white text-center`}>{title}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-center text-sm">{subTitle}</p>
        </div>
        
        <div className="flex gap-4 justify-center h-4 mb-10">
            {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-all duration-300 ${input.length > i ? 'bg-emerald-500 scale-125 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-200 dark:bg-slate-700'} ${error ? 'bg-red-500' : ''}`} />
            ))}
        </div>

        <div className={`grid grid-cols-3 w-full mx-auto gap-x-6 gap-y-4 ${variant === 'inline' ? 'max-w-[260px]' : 'max-w-[280px]'}`}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
                key={num}
                id={`digit-${num}`}
                onClick={() => handleDigit(num)}
                className={`rounded-full flex items-center justify-center font-medium transition-all active:scale-95 ${
                    variant === 'inline'
                    ? 'w-16 h-16 text-2xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm' 
                    : 'w-16 h-16 text-2xl glass-panel bg-white/5 hover:bg-white/10 text-white border-white/5'
                }`}
            >
                {num}
            </button>
            ))}
            <div />
            <button
            id="digit-0"
            onClick={() => handleDigit(0)}
            className={`rounded-full flex items-center justify-center font-medium transition-all active:scale-95 ${
                variant === 'inline'
                ? 'w-16 h-16 text-2xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm' 
                : 'w-16 h-16 text-2xl glass-panel bg-white/5 hover:bg-white/10 text-white border-white/5'
            }`}
            >
            0
            </button>
            <button
            onClick={handleClear}
            className={`rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors w-16 h-16`}
            >
            <Trash2 className="w-7 h-7" />
            </button>
        </div>
      </div>
    </div>
  );
};
