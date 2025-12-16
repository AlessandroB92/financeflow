import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, BrainCircuit, ArrowUpRight } from 'lucide-react';
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
