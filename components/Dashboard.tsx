import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, BrainCircuit, ArrowUpRight, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { PageTransition } from './PageTransition.tsx';
import { Transaction, Bill, TransactionType } from '../types.ts';
import { formatCurrency, getDaysUntil, COLORS } from '../utils/helpers.ts';
import * as GeminiService from '../services/geminiService.ts';

export const Dashboard = ({ transactions, bills }: { transactions: Transaction[], bills: Bill[] }) => {
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
  const isNegative = balance < 0;

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

  // Sort data by value descending for better visualization
  const chartData = Object.keys(expensesByCategory)
    .map(key => ({ name: key, value: expensesByCategory[key] }))
    .sort((a, b) => b.value - a.value);

  const getGeminiAdvice = async () => {
    if (!hasKey) return;
    setLoadingAdvice(true);
    const text = await GeminiService.getFinancialAdvice(currentTransactions);
    setAdvice(text);
    setLoadingAdvice(false);
  };

  return (
    <PageTransition className="space-y-6 pb-24">
      {/* Header Card - Dynamic Color (Red if negative) */}
      <div className={`relative rounded-[2rem] p-8 text-white shadow-2xl overflow-hidden transform transition-all hover:scale-[1.01] duration-500 ${
          isNegative ? 'shadow-red-500/30' : 'shadow-emerald-500/20'
      }`}>
        <div className={`absolute inset-0 bg-gradient-to-br transition-colors duration-500 ${
            isNegative 
            ? 'from-red-600 via-red-500 to-orange-500' 
            : 'from-emerald-600 via-emerald-500 to-teal-400'
        }`}></div>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl mix-blend-overlay"></div>
        <div className={`absolute bottom-0 left-0 w-48 h-48 rounded-full -ml-10 -mb-10 blur-2xl ${isNegative ? 'bg-red-900/30' : 'bg-emerald-900/20'}`}></div>
        
        <div className="relative z-10">
          <p className={`${isNegative ? 'text-red-100' : 'text-emerald-100'} text-sm font-medium tracking-wider uppercase mb-1`}>Saldo Disponibile</p>
          <h1 ref={balanceRef} className="text-5xl font-bold tracking-tight mb-8">
            {formatCurrency(0)}
          </h1>
          
          <div className="flex gap-4">
            <div className="bg-black/10 rounded-2xl p-4 flex-1 backdrop-blur-md border border-white/10 hover:bg-black/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-white/20 rounded-full"><TrendingDown className="w-3 h-3 text-white" /></div>
                <span className={`text-xs font-medium uppercase ${isNegative ? 'text-red-100' : 'text-emerald-100'}`}>Entrate</span>
              </div>
              <p className="font-bold text-xl">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-black/10 rounded-2xl p-4 flex-1 backdrop-blur-md border border-white/10 hover:bg-black/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-white/20 rounded-full"><TrendingUp className="w-3 h-3 text-white" /></div>
                <span className={`text-xs font-medium uppercase ${isNegative ? 'text-red-100' : 'text-emerald-100'}`}>Uscite</span>
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

      {/* Enhanced Category Breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-lg mb-6 dark:text-white">Ripartizione Spese</h3>
        
        {chartData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Chart Column */}
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    cornerRadius={6}
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)} 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                      itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Totale</span>
                <span className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(totalExpense)}</span>
              </div>
            </div>

            {/* List Column */}
            <div className="space-y-4 max-h-72 overflow-y-auto pr-2 no-scrollbar">
               {chartData.map((item, index) => {
                 const percentage = ((item.value / totalExpense) * 100).toFixed(1);
                 return (
                   <div key={item.name} className="group flex items-center gap-4 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      {/* Color Indicator */}
                      <div 
                        className="w-3 h-10 rounded-full shrink-0" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      
                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.name}</span>
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{formatCurrency(item.value)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                           <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mr-3">
                              <div 
                                className="h-full rounded-full" 
                                style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                              ></div>
                           </div>
                           <span className="text-slate-400 font-medium w-10 text-right">{percentage}%</span>
                        </div>
                      </div>
                   </div>
                 );
               })}
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-3xl">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center">
               <TrendingUp className="w-6 h-6 text-slate-300" />
            </div>
            <p className="font-medium text-sm">Nessuna spesa registrata</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
};
