import React, { useState, useMemo, useEffect } from 'react';
import { Repeat, Ban, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import { PageTransition } from './PageTransition.tsx';
import { Transaction, TransactionType } from '../types.ts';
import { formatCurrency, formatDate, getFrequencyLabel } from '../utils/helpers.ts';

export const RecurringView = ({ transactions, onStopRecurrence }: { transactions: Transaction[], onStopRecurrence: (id: string) => void }) => {
    const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

    const recurringList = useMemo(() => {
        return transactions.filter(t => {
            if (!t.isRecurring) return false;
            if (filter === 'ALL') return true;
            return t.type === filter;
        });
    }, [transactions, filter]);

    useEffect(() => {
        if(recurringList.length > 0) {
            gsap.from(".recurring-item", { y: 20, opacity: 0, stagger: 0.1, duration: 0.4 });
        }
    }, [recurringList, filter]);

    return (
        <PageTransition className="pb-24 space-y-6">
            <div className="flex flex-col gap-4 px-2">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold dark:text-white">Operazioni Ricorrenti</h2>
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Repeat className="w-6 h-6" />
                    </div>
                </div>

                <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                    {(['ALL', 'INCOME', 'EXPENSE'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${filter === t ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400'}`}
                        >
                            {t === 'ALL' ? 'Tutte' : t === 'INCOME' ? 'Entrate' : 'Uscite'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {recurringList.length === 0 ? (
                    <div className="glass-panel bg-white dark:bg-slate-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 shadow-lg border border-slate-100 dark:border-slate-700 min-h-[300px]">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                            <Repeat className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold dark:text-white">
                            {filter === 'ALL' ? 'Nessuna operazione ricorrente' : filter === 'INCOME' ? 'Nessuna entrata ricorrente' : 'Nessuna uscita ricorrente'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs text-sm">
                            Non hai ancora impostato operazioni automatiche per questa categoria.
                        </p>
                    </div>
                ) : (
                    recurringList.map(t => {
                        const isIncome = t.type === TransactionType.INCOME;
                        const themeColor = isIncome ? 'emerald' : 'red';
                        const bgColor = isIncome ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20';
                        const textColor = isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
                        const gradientFrom = isIncome ? 'from-emerald-500/10' : 'from-red-500/10';
                        const gradientTo = isIncome ? 'to-teal-500/10' : 'to-orange-500/10';

                        return (
                            <div key={t.id} className="recurring-item bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150`}></div>
                                
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center ${textColor} shrink-0`}>
                                            {isIncome ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg dark:text-white">{t.description}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} uppercase tracking-wide`}>
                                                    {getFrequencyLabel(t.recurrenceFrequency)}
                                                </span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    Prossimo: {t.nextRecurringDate ? formatDate(t.nextRecurringDate) : 'N/D'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xl font-bold ${textColor}`}>
                                            {isIncome ? '+' : '-'} {formatCurrency(t.amount)}
                                        </p>
                                        <p className="text-xs text-slate-400 font-medium mt-1">{t.category}</p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                                    <button 
                                        onClick={() => onStopRecurrence(t.id)}
                                        className="text-red-500 hover:text-white hover:bg-red-500 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
                                    >
                                        <Ban className="w-3 h-3" /> Interrompi
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </PageTransition>
    );
};
