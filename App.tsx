import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';
import { 
  LayoutDashboard, PlusCircle, BarChart3, Wallet, Settings, 
  TrendingUp, TrendingDown, Receipt,
  Menu, X, Search, Camera, Upload, Lock, Share2, LogOut, Bell,
  Calendar, Users, Download, FileJson, CheckCircle, AlertCircle, BrainCircuit, Trash2, ArrowUpRight, Database, Pencil, Save, Filter, Globe, Zap, KeyRound, ShieldCheck, ShieldAlert, Percent, UserPlus, UserMinus, ArrowLeft
} from 'lucide-react';
import { Transaction, TransactionType, Category, Bill, EXPENSE_CATEGORIES, INCOME_CATEGORIES, MarketAnalysis } from './types';
import * as GeminiService from './services/geminiService';
import { api, supabase } from './services/supabase'; // Import DB
import gsap from 'gsap';

// --- Constants & Helpers ---
const CURRENCY = '€';
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#64748B'];

const formatDate = (isoString: string) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
};

const getDaysUntil = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// --- Animations Helper ---
const PageTransition = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const compRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(compRef.current, 
        { opacity: 0, y: 15, scale: 0.98 }, 
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power2.out" }
      );
    }, compRef);
    return () => ctx.revert();
  }, []);

  return <div ref={compRef} className={`w-full ${className}`}>{children}</div>;
};

// --- Sub-Components ---

// 1. PIN Lock Screen & Setup
const PinPad = ({ title, subTitle, onComplete, onCancel, variant = 'fullscreen' }: { title: string, subTitle: string, onComplete: (pin: string) => void, onCancel?: () => void, variant?: 'fullscreen' | 'inline' }) => {
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

// 2. Receipt Scanner Modal
const ReceiptScanner = ({ onClose, onScanComplete }: { onClose: () => void, onScanComplete: (data: Partial<Transaction>) => void }) => {
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

// 3. Bills View
const BillsView = ({ bills, onAddBill, onPayBill, onDeleteBill }: { bills: Bill[], onAddBill: (b: Bill) => void, onPayBill: (id: string) => void, onDeleteBill: (id: string) => void }) => {
  const [showForm, setShowForm] = useState(false);
  const [newBill, setNewBill] = useState<Partial<Bill>>({
     name: '', amount: 0, dueDate: '', category: Category.HOUSING
  });
  
  const formRef = useRef(null);

  useEffect(() => {
    if (showForm) {
      gsap.fromTo(formRef.current, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.3, ease: "power2.out" });
    }
  }, [showForm]);

  useEffect(() => {
    gsap.from(".bill-item", { x: -20, opacity: 0, stagger: 0.05, duration: 0.3 });
  }, [bills]);

  const handleSubmit = () => {
    if(!newBill.name || !newBill.amount || !newBill.dueDate) return;
    onAddBill({
      id: 'temp', // Sarà sovrascritto dal DB
      name: newBill.name,
      amount: newBill.amount,
      dueDate: newBill.dueDate,
      category: newBill.category as Category,
      isPaid: false
    });
    setShowForm(false);
    setNewBill({ name: '', amount: 0, dueDate: '', category: Category.HOUSING });
  };

  const sortedBills = [...bills].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <PageTransition className="pb-24 space-y-6">
       <div className="flex justify-between items-center px-2">
         <h2 className="text-2xl font-bold dark:text-white">Bollette & Scadenze</h2>
         <button onClick={() => setShowForm(!showForm)} className="text-white bg-emerald-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 transition-transform">
           <PlusCircle className={`w-6 h-6 transition-transform duration-300 ${showForm ? 'rotate-45' : ''}`} />
         </button>
       </div>

       {showForm && (
         <div ref={formRef} className="glass-panel overflow-hidden bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm space-y-3">
            <h3 className="font-bold dark:text-white text-sm uppercase tracking-wider text-slate-500">Nuova Scadenza</h3>
            <input 
              placeholder="Nome (es. Luce, Affitto)" 
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 dark:text-white border-none focus:ring-2 focus:ring-emerald-500"
              value={newBill.name}
              onChange={e => setNewBill({...newBill, name: e.target.value})}
            />
            <div className="flex gap-2">
               <input 
                type="number" 
                placeholder="Importo" 
                className="w-1/2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 dark:text-white border-none focus:ring-2 focus:ring-emerald-500"
                value={newBill.amount || ''}
                onChange={e => setNewBill({...newBill, amount: parseFloat(e.target.value)})}
               />
               <input 
                type="date" 
                className="w-1/2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 dark:text-white border-none focus:ring-2 focus:ring-emerald-500"
                value={newBill.dueDate}
                onChange={e => setNewBill({...newBill, dueDate: e.target.value})}
               />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={handleSubmit} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-medium shadow-lg shadow-emerald-500/20 active:scale-95 transition-all w-full">Salva</button>
            </div>
         </div>
       )}

       <div className="space-y-3">
         {sortedBills.map(bill => {
           const daysLeft = getDaysUntil(bill.dueDate);
           const isUrgent = daysLeft >= 0 && daysLeft <= 3 && !bill.isPaid;
           const isLate = daysLeft < 0 && !bill.isPaid;

           return (
             <div key={bill.id} className={`bill-item relative bg-white dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden`}>
                {isUrgent && <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>}
                {isLate && <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>}
                
                <div className="pl-3">
                   <h3 className={`font-bold text-lg ${bill.isPaid ? 'text-emerald-600 dark:text-emerald-400 line-through decoration-2 opacity-50' : 'dark:text-white'}`}>{bill.name}</h3>
                   <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                     <span>{formatDate(bill.dueDate)}</span>
                     {!bill.isPaid && (
                       <span className={`px-2 py-0.5 rounded-md ${isLate ? 'bg-red-100 text-red-600' : isUrgent ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 dark:bg-slate-700'}`}>
                         {isLate ? 'Scaduta' : isUrgent ? 'In scadenza' : `${daysLeft} giorni`}
                       </span>
                     )}
                   </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-lg ${bill.isPaid ? 'opacity-50' : ''} dark:text-white`}>{formatCurrency(bill.amount)}</span>
                  {bill.isPaid ? (
                    <button onClick={() => onDeleteBill(bill.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  ) : (
                    <button onClick={() => onPayBill(bill.id)} className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full hover:bg-emerald-500 hover:text-white transition-all active:scale-90">
                      <CheckCircle className="w-6 h-6" />
                    </button>
                  )}
                </div>
             </div>
           );
         })}
         {bills.length === 0 && (
           <div className="text-center py-16 opacity-50 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-400">Nessuna bolletta trovata.</p>
           </div>
          )}
       </div>
    </PageTransition>
  );
}

// 4. Split View (Updated for Percentage)
const SplitView = () => {
  const [mode, setMode] = useState<'EQUAL' | 'PERCENTAGE'>('EQUAL');
  const [amount, setAmount] = useState<number>(0);
  
  // Equal Mode State
  const [people, setPeople] = useState<number>(2);

  // Percentage Mode State
  const [participants, setParticipants] = useState<{id: number, name: string, percentage: number}[]>([
      { id: 1, name: 'Persona 1', percentage: 50 },
      { id: 2, name: 'Persona 2', percentage: 50 }
  ]);

  const resultRef = useRef(null);
  const containerRef = useRef(null);
  
  // Animations
  useEffect(() => {
    if(amount > 0) {
      gsap.fromTo(resultRef.current, { scale: 0.95 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
    }
  }, [amount, people, participants]);

  useLayoutEffect(() => {
      // Animate transition between modes
      const ctx = gsap.context(() => {
          gsap.from(containerRef.current, { opacity: 0, y: 10, duration: 0.4 });
      });
      return () => ctx.revert();
  }, [mode]);

  // Handlers for Percentage Mode
  const handleAddParticipant = () => {
      const newId = participants.length > 0 ? Math.max(...participants.map(p => p.id)) + 1 : 1;
      setParticipants([...participants, { id: newId, name: `Persona ${newId}`, percentage: 0 }]);
  };

  const handleRemoveParticipant = (id: number) => {
      if (participants.length > 1) {
          setParticipants(participants.filter(p => p.id !== id));
      }
  };

  const handlePercentageChange = (id: number, val: number) => {
      setParticipants(participants.map(p => p.id === id ? { ...p, percentage: val } : p));
  };

  const totalPercentage = participants.reduce((acc, p) => acc + p.percentage, 0);
  const isValidTotal = totalPercentage === 100;

  return (
    <PageTransition className="pb-24 space-y-6">
       <div className="flex justify-between items-center px-2">
            <h2 className="text-2xl font-bold dark:text-white">Divisione Spese</h2>
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                <button 
                    onClick={() => setMode('EQUAL')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'EQUAL' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-400'}`}
                >
                    Equa
                </button>
                <button 
                    onClick={() => setMode('PERCENTAGE')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'PERCENTAGE' ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white' : 'text-slate-400'}`}
                >
                    % Custom
                </button>
            </div>
       </div>
       
       <div ref={containerRef} className="glass-panel bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-xl space-y-8 relative overflow-hidden">
          {/* Decorative Blobs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

          {/* Amount Input (Common) */}
          <div className="relative z-10">
            <label className="text-slate-500 font-medium text-xs mb-2 block uppercase tracking-wider">Importo Totale</label>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-emerald-500">€</span>
              <input 
                type="number" 
                value={amount || ''} 
                onChange={e => setAmount(parseFloat(e.target.value))}
                className="w-full text-4xl font-bold bg-transparent border-b-2 border-slate-100 dark:border-slate-700 focus:outline-none focus:border-emerald-500 dark:text-white transition-colors py-2 placeholder-slate-200"
                placeholder="0.00"
              />
            </div>
          </div>

          {mode === 'EQUAL' ? (
              /* EQUAL MODE */
              <div className="relative z-10 space-y-8 animate-in fade-in duration-300">
                <div>
                    <div className="flex justify-between items-center mb-4">
                    <label className="text-slate-500 font-medium text-xs uppercase tracking-wider">Persone</label>
                    <span className="text-2xl font-bold dark:text-white bg-slate-100 dark:bg-slate-700 w-10 h-10 flex items-center justify-center rounded-xl">{people}</span>
                    </div>
                    
                    <input 
                    type="range" 
                    min="2" 
                    max="10" 
                    value={people} 
                    onChange={e => setPeople(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between mt-3 px-1">
                        {[2, 10].map(n => (
                        <span key={n} className="text-xs text-slate-400 font-medium">{n}</span>
                        ))}
                    </div>
                </div>

                <div ref={resultRef} className="bg-emerald-50 dark:bg-slate-700/50 border border-emerald-100 dark:border-slate-600 p-6 rounded-2xl flex flex-col items-center shadow-inner relative z-10">
                    <span className="text-slate-500 font-medium text-sm uppercase tracking-wider mb-2">A testa</span>
                    <span className="text-5xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                    {formatCurrency(amount > 0 ? amount / people : 0)}
                    </span>
                </div>
              </div>
          ) : (
              /* PERCENTAGE MODE */
              <div className="relative z-10 space-y-6 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center mb-2">
                       <label className="text-slate-500 font-medium text-xs uppercase tracking-wider">Partecipanti</label>
                       <button onClick={handleAddParticipant} className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors">
                           <UserPlus className="w-3 h-3" /> Aggiungi
                       </button>
                  </div>

                  <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                      {participants.map((p) => (
                          <div key={p.id} className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                              <div className="flex justify-between items-center mb-3">
                                  <input 
                                    value={p.name}
                                    onChange={(e) => setParticipants(participants.map(par => par.id === p.id ? {...par, name: e.target.value} : par))}
                                    className="bg-transparent font-bold text-slate-700 dark:text-white border-b border-transparent focus:border-slate-300 outline-none w-1/2"
                                  />
                                  <div className="flex items-center gap-2">
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                          {formatCurrency((amount * p.percentage) / 100)}
                                      </span>
                                      {participants.length > 1 && (
                                        <button onClick={() => handleRemoveParticipant(p.id)} className="text-slate-400 hover:text-red-500 p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                  </div>
                              </div>
                              <div className="flex items-center gap-4">
                                  <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={p.percentage} 
                                    onChange={(e) => handlePercentageChange(p.id, parseInt(e.target.value))}
                                    className="flex-1 accent-indigo-500 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
                                  />
                                  <span className="w-12 text-right text-xs font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600">
                                      {p.percentage}%
                                  </span>
                              </div>
                          </div>
                      ))}
                  </div>

                  {/* Summary Footer */}
                  <div className={`p-4 rounded-xl border flex justify-between items-center transition-colors duration-300 ${isValidTotal ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800'}`}>
                      <div className="flex items-center gap-2">
                          {isValidTotal ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                          <span className={`text-sm font-bold ${isValidTotal ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                              Totale: {totalPercentage}%
                          </span>
                      </div>
                      {!isValidTotal && (
                          <span className="text-xs text-red-500 font-medium">Devi raggiungere 100%</span>
                      )}
                  </div>
              </div>
          )}
       </div>
    </PageTransition>
  )
}

// 6. Dashboard
const Dashboard = ({ transactions, bills }: { transactions: Transaction[], bills: Bill[] }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const balanceRef = useRef<HTMLHeadingElement>(null);
  const hasKey = GeminiService.hasApiKey();

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const currentTransactions = useMemo(() => {
    return transactions.filter(t => new Date(t.date) <= today);
  }, [transactions]);

  const totalIncome = currentTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = currentTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  useEffect(() => {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: balance,
      duration: 1.5,
      ease: "power3.out",
      onUpdate: () => {
        if (balanceRef.current) {
          balanceRef.current.innerText = formatCurrency(obj.val);
        }
      }
    });
  }, [balance]);

  const unpaidBills = bills.filter(b => !b.isPaid && getDaysUntil(b.dueDate) <= 5).length;

  const expensesByCategory = currentTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.keys(expensesByCategory).map(key => ({ name: key, value: expensesByCategory[key] }));

  const getGeminiAdvice = async () => {
    if (!hasKey) return;
    setLoadingAdvice(true);
    const text = await GeminiService.getFinancialAdvice(currentTransactions);
    setAdvice(text);
    setLoadingAdvice(false);
  };

  return (
    <PageTransition className="space-y-6 pb-24">
      {/* Header Card */}
      <div className="relative rounded-[2rem] p-8 text-white shadow-2xl shadow-emerald-500/20 overflow-hidden transform transition-transform hover:scale-[1.01] duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl mix-blend-overlay"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-900/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>
        
        <div className="relative z-10">
          <p className="text-emerald-100 text-sm font-medium tracking-wider uppercase mb-1">Saldo Disponibile</p>
          <h1 ref={balanceRef} className="text-5xl font-bold tracking-tight mb-8">
            {formatCurrency(0)}
          </h1>
          
          <div className="flex gap-4">
            <div className="bg-black/10 rounded-2xl p-4 flex-1 backdrop-blur-md border border-white/10 hover:bg-black/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-white/20 rounded-full"><TrendingDown className="w-3 h-3 text-white" /></div>
                <span className="text-xs text-emerald-100 font-medium uppercase">Entrate</span>
              </div>
              <p className="font-bold text-xl">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-black/10 rounded-2xl p-4 flex-1 backdrop-blur-md border border-white/10 hover:bg-black/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-white/20 rounded-full"><TrendingUp className="w-3 h-3 text-white" /></div>
                <span className="text-xs text-emerald-100 font-medium uppercase">Uscite</span>
              </div>
              <p className="font-bold text-xl">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </div>
      </div>

      {unpaidBills > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
          <div className="bg-orange-100 dark:bg-orange-800 p-2 rounded-xl">
             <AlertCircle className="w-6 h-6 text-orange-500 dark:text-orange-300" />
          </div>
          <div>
            <p className="font-bold text-orange-800 dark:text-orange-200 text-lg">Scadenze in arrivo</p>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1 leading-relaxed">Hai <span className="font-bold">{unpaidBills}</span> bollette da pagare nei prossimi 5 giorni.</p>
          </div>
        </div>
      )}

      {/* AI Widget */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg shadow-indigo-500/5 border border-indigo-50 dark:border-slate-700 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-colors"></div>
        <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 text-lg">
                <BrainCircuit className="w-6 h-6 text-indigo-500" /> Gemini Insights
            </h3>
            <button 
                onClick={getGeminiAdvice}
                disabled={loadingAdvice || !hasKey}
                className="text-xs font-semibold bg-indigo-100 text-indigo-600 px-4 py-2 rounded-full hover:bg-indigo-200 transition-colors flex items-center gap-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loadingAdvice ? 'Analizzando...' : <>Genera Analisi <ArrowUpRight className="w-3 h-3" /></>}
            </button>
            </div>
            <div className="bg-indigo-50/50 dark:bg-slate-900/50 rounded-xl p-4">
                <p className="text-sm text-indigo-900 dark:text-indigo-100 leading-relaxed whitespace-pre-line font-medium">
                {!hasKey 
                  ? "⚠️ API Key mancante. Configurala in index.html per attivare l'AI." 
                  : advice || "Tocca 'Genera Analisi' per ricevere consigli basati sulle tue spese recenti dall'AI."}
                </p>
            </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-lg mb-4 dark:text-white">Spese per Categoria</h3>
        <div className="h-64">
        {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                data={chartData}
                innerRadius={65}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
                cornerRadius={5}
                >
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                ))}
                </Pie>
                <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
            </PieChart>
            </ResponsiveContainer>
        ) : (
            <div className="h-full flex items-center justify-center text-slate-400">Nessun dato disponibile</div>
        )}
        </div>
      </div>
    </PageTransition>
  );
};

// 7. Transaction Form
const TransactionForm = ({ onSave, onCancel }: { onSave: (t: Partial<Transaction>) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: TransactionType.EXPENSE,
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: Category.FOOD,
    description: '',
    subcategory: '',
    isRecurring: false
  });
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);

  // Determine which categories to show based on transaction type
  const availableCategories = formData.type === TransactionType.INCOME 
      ? INCOME_CATEGORIES 
      : EXPENSE_CATEGORIES;

  // Reset category when switching types if the current category isn't valid for the new type
  useEffect(() => {
      if (!availableCategories.includes(formData.category as any)) {
          setFormData(prev => ({ ...prev, category: availableCategories[0] }));
      }
  }, [formData.type, availableCategories]);

  const handleScan = (data: Partial<Transaction>) => {
    setFormData(prev => ({
      ...prev,
      amount: data.amount,
      date: data.date || prev.date,
      description: data.description,
      category: data.category || prev.category,
      receiptImage: data.receiptImage
    }));
    setShowScanner(false);
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
       if(formData.description && formData.description.length > 3 && !formData.receiptImage) {
           const predicted = await GeminiService.predictCategory(formData.description);
           // Validate predicted category exists in current list
           if(predicted && availableCategories.includes(predicted as any)) {
               setFormData(prev => ({...prev, category: predicted}));
           }
       }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData.description, availableCategories]);

  const handleSave = async () => {
    setLoading(true);
    await onSave(formData);
    setLoading(false);
  }

  return (
    <PageTransition className="pb-24">
      <div className="flex justify-between items-center mb-8 px-2">
         <h2 className="text-2xl font-bold dark:text-white">Nuova Transazione</h2>
         <button onClick={() => setShowScanner(true)} className="bg-slate-900 text-white dark:bg-slate-700 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium shadow-lg active:scale-95 transition-transform">
            <Camera className="w-4 h-4" /> Scan
         </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6 border border-slate-100 dark:border-slate-700">
        
        <div className="grid grid-cols-2 gap-4 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl">
          <button 
            type="button"
            onClick={() => setFormData({ ...formData, type: TransactionType.EXPENSE })}
            className={`p-3 rounded-xl font-bold text-sm transition-all duration-300 ${formData.type === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 text-red-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Spesa
          </button>
          <button 
            type="button"
            onClick={() => setFormData({ ...formData, type: TransactionType.INCOME })}
            className={`p-3 rounded-xl font-bold text-sm transition-all duration-300 ${formData.type === TransactionType.INCOME ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Entrata
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Importo</label>
          <div className="relative group">
             <span className="absolute left-4 top-4 text-slate-400 font-bold text-xl group-focus-within:text-emerald-500 transition-colors">€</span>
             <input 
              type="number"
              value={formData.amount || ''}
              onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
              className="w-full pl-10 p-4 bg-slate-50 dark:bg-slate-900/50 dark:text-white rounded-2xl text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descrizione</label>
          <input 
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 dark:text-white rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            placeholder="Es. Spesa Carrefour"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoria</label>
              <div className="relative">
                <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 dark:text-white rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                >
                    {availableCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <TrendingDown className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sottocategoria</label>
               <input 
                type="text"
                value={formData.subcategory || ''}
                onChange={(e) => setFormData({...formData, subcategory: e.target.value})}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 dark:text-white rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Opzionale"
              />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Data</label>
              <input 
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 dark:text-white rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center pt-8 px-2">
                <input 
                  type="checkbox" 
                  id="recurring" 
                  checked={formData.isRecurring}
                  onChange={e => setFormData({...formData, isRecurring: e.target.checked})}
                  className="w-6 h-6 accent-emerald-500 rounded-md cursor-pointer"
                />
                <label htmlFor="recurring" className="ml-3 text-sm text-slate-600 dark:text-slate-300 font-medium cursor-pointer select-none">Ricorrente</label>
            </div>
        </div>

        {formData.receiptImage && (
          <div className="mt-2 relative rounded-2xl overflow-hidden group">
             <p className="text-xs text-slate-500 mb-2 absolute top-2 left-2 bg-white/80 px-2 py-1 rounded backdrop-blur">Scontrino allegato</p>
             <img src={formData.receiptImage} alt="Receipt" className="w-full h-40 object-cover" />
             <button 
               onClick={() => setFormData({...formData, receiptImage: undefined})}
               className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
             >
               <X className="w-4 h-4" />
             </button>
          </div>
        )}

        <div className="pt-6 flex gap-4">
          <button 
            onClick={onCancel}
            disabled={loading}
            className="flex-1 p-4 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Annulla
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex-1 p-4 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/30 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>

      {showScanner && (
        <ReceiptScanner onClose={() => setShowScanner(false)} onScanComplete={handleScan} />
      )}
    </PageTransition>
  );
};

// 8. Analytics & History View (Replaced old HistoryView)
const AnalyticsView = ({ transactions }: { transactions: Transaction[] }) => {
    const [range, setRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('1M');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const [customStart, setCustomStart] = useState<string>('');
    const [customEnd, setCustomEnd] = useState<string>('');
    const [showCustomDates, setShowCustomDates] = useState(false);

    // Calculate Date Range
    const { startDate, endDate } = useMemo(() => {
        const end = new Date();
        const start = new Date();
        
        if (showCustomDates && customStart && customEnd) {
            return { startDate: new Date(customStart), endDate: new Date(customEnd) };
        }

        switch(range) {
            case '1M': start.setMonth(end.getMonth() - 1); break;
            case '3M': start.setMonth(end.getMonth() - 3); break;
            case '6M': start.setMonth(end.getMonth() - 6); break;
            case '1Y': start.setFullYear(end.getFullYear() - 1); break;
            case 'ALL': start.setFullYear(2000); break; // Far past
        }
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
        return { startDate: start, endDate: end };
    }, [range, customStart, customEnd, showCustomDates]);

    // Filter Transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const d = new Date(t.date);
            const inDate = d >= startDate && d <= endDate;
            const inType = typeFilter === 'ALL' 
                ? true 
                : typeFilter === 'INCOME' 
                    ? t.type === TransactionType.INCOME 
                    : t.type === TransactionType.EXPENSE;
            return inDate && inType;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, startDate, endDate, typeFilter]);

    // Prepare Chart Data
    const chartData = useMemo(() => {
        const dayMap = new Map<string, number>();
        const ascTransactions = [...filteredTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let runningBalance = 0; 
        
        ascTransactions.forEach(t => {
            const dateKey = t.date.split('T')[0];
            const amount = t.amount;
            
            if (typeFilter === 'ALL') {
                runningBalance += (t.type === TransactionType.INCOME ? amount : -amount);
                dayMap.set(dateKey, runningBalance);
            } else {
                const current = dayMap.get(dateKey) || 0;
                dayMap.set(dateKey, current + amount);
            }
        });

        return Array.from(dayMap.entries()).map(([date, value]) => ({
            date: new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
            fullDate: date,
            value
        }));
    }, [filteredTransactions, typeFilter]);

    const totalIncome = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    const net = totalIncome - totalExpense;

    return (
        <PageTransition className="pb-24 space-y-6">
            <div className="flex justify-between items-center px-2">
                <h2 className="text-2xl font-bold dark:text-white">Analisi e Trend</h2>
                <button 
                  onClick={() => setShowCustomDates(!showCustomDates)}
                  className={`p-2 rounded-full transition-colors ${showCustomDates ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}
                >
                    <Calendar className="w-5 h-5" />
                </button>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
                {showCustomDates && (
                    <div className="flex gap-2 mb-4 animate-in fade-in slide-in-from-top-2">
                        <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white" />
                        <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white" />
                    </div>
                )}
                
                <div className="flex justify-between items-center overflow-x-auto no-scrollbar gap-2">
                    {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map(r => (
                        <button 
                            key={r}
                            onClick={() => { setRange(r); setShowCustomDates(false); }}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${range === r && !showCustomDates ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-lg' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>

                <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                    {(['ALL', 'INCOME', 'EXPENSE'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${typeFilter === t ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400'}`}
                        >
                            {t === 'ALL' ? 'Saldo' : t === 'INCOME' ? 'Entrate' : 'Uscite'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
                 <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                     <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">Entrate</p>
                     <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm md:text-base">{formatCurrency(totalIncome)}</p>
                 </div>
                 <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl border border-red-100 dark:border-red-800/30">
                     <p className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider mb-1">Uscite</p>
                     <p className="font-bold text-red-700 dark:text-red-300 text-sm md:text-base">{formatCurrency(totalExpense)}</p>
                 </div>
                 <div className={`p-3 rounded-2xl border ${net >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800/30'}`}>
                     <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>Netto</p>
                     <p className={`font-bold text-sm md:text-base ${net >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>{formatCurrency(net)}</p>
                 </div>
            </div>

            {/* Chart */}
            <div className="h-64 bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 relative">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 absolute top-4 left-6">
                    {typeFilter === 'ALL' ? 'Andamento Saldo' : typeFilter === 'INCOME' ? 'Trend Entrate' : 'Trend Uscite'}
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 30, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={typeFilter === 'EXPENSE' ? '#EF4444' : '#10B981'} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={typeFilter === 'EXPENSE' ? '#EF4444' : '#10B981'} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fill: '#94A3B8'}} 
                            interval="preserveStartEnd"
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fill: '#94A3B8'}} 
                        />
                        <RechartsTooltip 
                             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                             formatter={(value: number) => [formatCurrency(value), typeFilter === 'ALL' ? 'Saldo' : 'Importo']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={typeFilter === 'EXPENSE' ? '#EF4444' : '#10B981'} 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorValue)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
                {chartData.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl">
                        <p className="text-slate-400 text-sm">Nessun dato nel periodo</p>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="space-y-3">
                <h3 className="text-lg font-bold dark:text-white px-2">Dettaglio Movimenti</h3>
                {filteredTransactions.map((t) => (
                <div key={t.id} className="history-item bg-white dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm border border-slate-50 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {t.type === TransactionType.INCOME ? <TrendingDown className="w-5 h-5 rotate-180" /> : <TrendingUp className="w-5 h-5" />}
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                        {t.description}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                        <span>{formatDate(t.date)}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span>{t.category}</span>
                        </div>
                    </div>
                    </div>
                    <p className={`font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}`}>
                    {t.type === TransactionType.INCOME ? '+' : ''}{formatCurrency(t.amount)}
                    </p>
                </div>
                ))}
            </div>
        </PageTransition>
    );
};

// --- Main App ---

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'analytics' | 'add' | 'settings' | 'bills' | 'split' | 'pin-setup'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [pin, setPin] = useState<string | undefined>(undefined);
  const [isLocked, setIsLocked] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDbConfigured, setIsDbConfigured] = useState(true);

  // Load Data from DB
  useEffect(() => {
    if (!supabase) {
        setIsDbConfigured(false);
        setIsLoading(false);
        return;
    }

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [txs, bls, dbPin] = await Promise.all([
                api.getTransactions(),
                api.getBills(),
                api.getPin()
            ]);
            setTransactions(txs);
            setBills(bls);
            
            if (dbPin) {
                setPin(dbPin);
                setIsLocked(true);
            }
        } catch (e) {
            console.error("DB Error", e);
        } finally {
            setIsLoading(false);
        }
    };
    loadData();

    // LocalStorage for Theme Only
    const stored = localStorage.getItem('financeflow_theme');
    if (stored) {
        const data = JSON.parse(stored);
        if (data.darkMode) setIsDarkMode(data.darkMode);
    }
  }, []);

  // Save Theme Locally
  useEffect(() => {
    localStorage.setItem('financeflow_theme', JSON.stringify({ darkMode: isDarkMode }));
  }, [isDarkMode]);

  // Dark Mode
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleAddTransaction = async (t: Partial<Transaction>) => {
    const newTx: Transaction = {
      id: '', // DB genererà UUID
      amount: t.amount || 0,
      type: t.type || TransactionType.EXPENSE,
      category: t.category || Category.OTHER,
      subcategory: t.subcategory,
      date: t.date || new Date().toISOString(),
      description: t.description || 'Nuova transazione',
      receiptImage: t.receiptImage,
      isRecurring: t.isRecurring
    };
    
    // Optimistic Update
    setTransactions(prev => [newTx, ...prev]); 
    setCurrentView('dashboard');
    
    const saved = await api.addTransaction(newTx);
    if(saved) {
        // Replace temp optimistic with real data
        setTransactions(prev => [saved, ...prev.filter(x => x !== newTx)]); 
    }
  };

  const handleAddBill = async (b: Bill) => {
      const saved = await api.addBill(b);
      if(saved) setBills([...bills, saved]);
  };

  const handlePayBill = async (id: string) => {
    await api.updateBill(id, { isPaid: true });
    setBills(bills.map(b => b.id === id ? { ...b, isPaid: true } : b));
    
    // Add Expense Transaction automatically
    const bill = bills.find(b => b.id === id);
    if(bill) {
      await handleAddTransaction({
        amount: bill.amount,
        type: TransactionType.EXPENSE,
        category: bill.category,
        description: `Pagamento Bolletta: ${bill.name}`,
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleDeleteBill = async (id: string) => {
      await api.deleteBill(id);
      setBills(bills.filter(b => b.id !== id));
  };

  const handleSetPin = async (newPin: string) => {
      await api.setPin(newPin);
      setPin(newPin);
      setCurrentView('settings');
      alert("PIN salvato con successo.");
  };

  const handleRemovePin = async () => {
      await api.setPin(undefined);
      setPin(undefined);
  };


  if (isLocked && pin) return <PinPad title="Bentornato" subTitle="Inserisci il PIN per accedere" onComplete={(input) => {
      if(input === pin) setIsLocked(false);
  }} />;

  if (!isDbConfigured) {
      return (
          <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
              <Database className="w-16 h-16 text-red-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Configurazione Database Richiesta</h1>
              <p className="text-slate-400 mb-6">Apri il file <code>services/supabase.ts</code> e inserisci la URL e la API Key del tuo progetto Supabase.</p>
              <div className="bg-slate-800 p-4 rounded text-left text-xs font-mono text-emerald-400 w-full max-w-lg">
                  const SUPABASE_URL = '...';<br/>
                  const SUPABASE_KEY = '...';
              </div>
          </div>
      )
  }

  if (isLoading) {
      return (
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  // --- Render View Logic ---
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard transactions={transactions} bills={bills} />;
      case 'analytics':
        return <AnalyticsView transactions={transactions} />;
      case 'add':
        return <TransactionForm onSave={handleAddTransaction} onCancel={() => setCurrentView('dashboard')} />;
      case 'bills':
        return <BillsView bills={bills} onAddBill={handleAddBill} onPayBill={handlePayBill} onDeleteBill={handleDeleteBill} />;
      case 'split':
        return <SplitView />;
      case 'pin-setup':
        return (
          <PageTransition>
             <PinPad 
                title={pin ? "Cambia PIN" : "Nuovo PIN"} 
                subTitle="Inserisci 4 cifre per proteggere i tuoi dati" 
                variant="inline"
                onComplete={handleSetPin}
                onCancel={() => setCurrentView('settings')}
             />
          </PageTransition>
        );
      case 'settings':
        return (
          <PageTransition className="pb-24 space-y-4">
             <h2 className="text-2xl font-bold dark:text-white mb-6 px-2">Impostazioni</h2>
             
             {/* Security Card */}
             <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-10 -mt-10"></div>
                <div className="flex items-start justify-between relative z-10 mb-6">
                    <div>
                        <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                           <ShieldCheck className="w-5 h-5 text-emerald-500" /> Sicurezza
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">Gestisci l'accesso all'applicazione.</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${pin ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {pin ? 'ATTIVO' : 'DISATTIVATO'}
                    </div>
                </div>

                <div className="flex gap-3">
                    {pin ? (
                        <>
                            <button 
                                onClick={() => setCurrentView('pin-setup')}
                                className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                            >
                                Cambia PIN
                            </button>
                            <button 
                                onClick={handleRemovePin}
                                className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                            >
                                Rimuovi
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => setCurrentView('pin-setup')}
                            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
                        >
                            Imposta PIN di Sicurezza
                        </button>
                    )}
                </div>
             </div>

             {/* Appearance Card */}
             <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
                    {isDarkMode ? <TrendingUp className="w-5 h-5 text-slate-500 dark:text-slate-300" /> : <TrendingDown className="w-5 h-5 text-slate-500" />} 
                  </div>
                  <span className="dark:text-white font-medium">Modalità Scura</span>
                </div>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)} 
                  className={`w-14 h-8 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-slate-600' : 'bg-slate-200'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : ''}`} />
                </button>
             </div>

             <div className="text-center text-xs text-slate-400 mt-10">
                 Database Connected • v1.2.0
             </div>
          </PageTransition>
        );
      default:
        return <Dashboard transactions={transactions} bills={bills} />;
    }
  };

  const NavButton = ({ id, icon: Icon, label }: { id: typeof currentView, icon: any, label: string }) => {
    const isActive = currentView === id;
    return (
    <button 
      onClick={() => setCurrentView(id)}
      className={`group flex flex-col items-center justify-center w-16 h-full transition-all duration-300 relative`}
    >
      <div className={`absolute -top-1 w-8 h-1 bg-emerald-500 rounded-b-full transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}></div>
      <Icon className={`w-6 h-6 transition-colors duration-300 ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-500'}`} />
      <span className={`text-[10px] mt-1 font-bold transition-all duration-300 ${isActive ? 'text-emerald-700 opacity-100 translate-y-0' : 'text-slate-400 opacity-0 translate-y-2'}`}>{label}</span>
    </button>
  )};

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
      <div className="md:hidden flex justify-between items-center p-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md sticky top-0 z-30 shadow-sm border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
           <div className="w-9 h-9 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">F</div>
           <span className="font-bold text-lg dark:text-white tracking-tight">FinanceFlow</span>
        </div>
        <button className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <Bell className="w-6 h-6 text-slate-500" />
          {(bills.some(b => !b.isPaid && getDaysUntil(b.dueDate) <= 3)) && 
             <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
          }
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 pt-6">
        {renderView()}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 h-20 flex justify-evenly items-center z-40 md:w-auto md:max-w-xl md:left-1/2 md:-translate-x-1/2 md:bottom-6 md:rounded-full md:shadow-2xl md:border md:px-6">
        <NavButton id="dashboard" icon={LayoutDashboard} label="Home" />
        <NavButton id="analytics" icon={BarChart3} label="Analisi" />
        <div className="relative -top-6 mx-2">
          <button 
             onClick={() => setCurrentView('add')}
             className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-500/40 hover:scale-110 hover:-translate-y-1 transition-all duration-300 group"
          >
             <PlusCircle className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
        <NavButton id="split" icon={Users} label="Divisione" />
        <NavButton id="settings" icon={Settings} label="Menu" />
      </nav>
    </div>
  );
};

export default App;