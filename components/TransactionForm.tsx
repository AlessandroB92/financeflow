import React, { useState, useEffect } from 'react';
import { Camera, TrendingDown, X } from 'lucide-react';
import { PageTransition } from './PageTransition.tsx';
import { ReceiptScanner } from './ReceiptScanner.tsx';
import { Transaction, TransactionType, Category, EXPENSE_CATEGORIES, INCOME_CATEGORIES, RecurrenceFrequency } from '../types.ts';
import { calculateNextDate } from '../utils/helpers.ts';
import * as GeminiService from '../services/geminiService.ts';

export const TransactionForm = ({ onSave, onCancel }: { onSave: (t: Partial<Transaction>) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: TransactionType.EXPENSE,
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: Category.FOOD,
    description: '',
    subcategory: '',
    isRecurring: false,
    recurrenceFrequency: 'MONTHLY'
  });
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);

  const availableCategories = formData.type === TransactionType.INCOME 
      ? INCOME_CATEGORIES 
      : EXPENSE_CATEGORIES;

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
           if(predicted && availableCategories.includes(predicted as any)) {
               setFormData(prev => ({...prev, category: predicted}));
           }
       }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData.description, availableCategories]);

  const handleSave = async () => {
    setLoading(true);
    let nextDate = undefined;
    if (formData.isRecurring && formData.recurrenceFrequency && formData.date) {
        nextDate = calculateNextDate(formData.date, formData.recurrenceFrequency);
    }
    
    await onSave({ ...formData, nextRecurringDate: nextDate });
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
            <div className="flex flex-col justify-center gap-2 pt-2">
                <div className="flex items-center px-2">
                    <input 
                    type="checkbox" 
                    id="recurring" 
                    checked={formData.isRecurring}
                    onChange={e => setFormData({...formData, isRecurring: e.target.checked})}
                    className="w-6 h-6 accent-emerald-500 rounded-md cursor-pointer"
                    />
                    <label htmlFor="recurring" className="ml-3 text-sm text-slate-600 dark:text-slate-300 font-medium cursor-pointer select-none">Ricorrente</label>
                </div>
                {formData.isRecurring && (
                    <div className="animate-in slide-in-from-top-2 fade-in pl-2">
                        <select 
                            value={formData.recurrenceFrequency}
                            onChange={(e) => setFormData({...formData, recurrenceFrequency: e.target.value as RecurrenceFrequency})}
                            className="w-full p-2 bg-slate-100 dark:bg-slate-900 dark:text-white rounded-lg text-sm border-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="WEEKLY">Ogni Settimana</option>
                            <option value="MONTHLY">Ogni Mese</option>
                            <option value="YEARLY">Ogni Anno</option>
                        </select>
                    </div>
                )}
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
