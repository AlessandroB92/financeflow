import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, TrendingDown, Repeat } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { PageTransition } from './PageTransition.tsx';
import { Transaction, TransactionType } from '../types.ts';
import { formatCurrency, formatDate } from '../utils/helpers.ts';

export const AnalyticsView = ({ transactions }: { transactions: Transaction[] }) => {
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
            <div className={`grid gap-3 ${typeFilter === 'ALL' ? 'grid-cols-3' : 'grid-cols-1'}`}>
                 {(typeFilter === 'ALL' || typeFilter === 'INCOME') && (
                     <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                         <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">Entrate</p>
                         <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm md:text-base">{formatCurrency(totalIncome)}</p>
                     </div>
                 )}
                 {(typeFilter === 'ALL' || typeFilter === 'EXPENSE') && (
                     <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl border border-red-100 dark:border-red-800/30">
                         <p className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider mb-1">Uscite</p>
                         <p className="font-bold text-red-700 dark:text-red-300 text-sm md:text-base">{formatCurrency(totalExpense)}</p>
                     </div>
                 )}
                 {typeFilter === 'ALL' && (
                     <div className={`p-3 rounded-2xl border ${net >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800/30'}`}>
                         <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>Netto</p>
                         <p className={`font-bold text-sm md:text-base ${net >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>{formatCurrency(net)}</p>
                     </div>
                 )}
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
                         {t.isRecurring && <Repeat className="w-3 h-3 text-slate-400" />}
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
