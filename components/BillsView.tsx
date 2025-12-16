import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Trash2, CheckCircle, Calendar } from 'lucide-react';
import gsap from 'gsap';
import { PageTransition } from './PageTransition.tsx';
import { Bill, Category } from '../types.ts';
import { formatCurrency, formatDate, getDaysUntil } from '../utils/helpers.ts';

export const BillsView = ({ bills, onAddBill, onPayBill, onDeleteBill }: { bills: Bill[], onAddBill: (b: Bill) => void, onPayBill: (id: string) => void, onDeleteBill: (id: string) => void }) => {
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
};
