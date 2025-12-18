import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, PlusCircle, BarChart3, Settings, 
  TrendingUp, TrendingDown, Bell,
  Calendar, Database, ShieldCheck, Repeat
} from 'lucide-react';
import { Transaction, TransactionType, Category, Bill } from './types.ts';
import { api, supabase } from './services/supabase.ts';
import { calculateNextDate, getDaysUntil } from './utils/helpers.ts';

// Component Imports
import { PageTransition } from './components/PageTransition.tsx';
import { ChatWidget } from './components/ChatWidget.tsx';
import { PinPad } from './components/PinPad.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { TransactionForm } from './components/TransactionForm.tsx';
import { BillsView } from './components/BillsView.tsx';
import { RecurringView } from './components/RecurringView.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';

// --- Main App ---

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'analytics' | 'add' | 'settings' | 'bills' | 'recurring' | 'pin-setup'>('dashboard');
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

            // --- RECURRING TRANSACTIONS CHECK LOGIC ---
            const todayStr = new Date().toISOString().split('T')[0];
            const todayDate = new Date(todayStr);

            // Filtra ricorrenze che hanno una data valida e sono <= oggi
            const recurringDue = txs.filter(t => 
                t.isRecurring && 
                t.nextRecurringDate && 
                t.nextRecurringDate <= todayStr
            );

            if (recurringDue.length > 0) {
                const newTransactions: Transaction[] = [];
                
                for (const parent of recurringDue) {
                     // nextRecurringDate è già YYYY-MM-DD grazie al fix in helpers
                     let nextDateStr = parent.nextRecurringDate!;
                     
                     // Genera transazioni finché la data è nel passato o oggi
                     while (nextDateStr <= todayStr) {
                        // Verifica duplicati usando la data stringa esatta
                        const exists = txs.find(t => t.description === parent.description && t.date === nextDateStr);
                        
                        if (!exists) {
                            const newTx: Transaction = {
                                id: '', 
                                amount: parent.amount,
                                type: parent.type,
                                category: parent.category,
                                subcategory: parent.subcategory,
                                description: parent.description,
                                date: nextDateStr,
                                isRecurring: false, 
                            };

                            const saved = await api.addTransaction(newTx);
                            if (saved) newTransactions.push(saved);
                        }

                        if (parent.recurrenceFrequency) {
                            nextDateStr = calculateNextDate(nextDateStr, parent.recurrenceFrequency);
                        } else {
                            break;
                        }
                     }
                     
                     await api.updateTransactionNextDate(parent.id, nextDateStr);
                }

                if (newTransactions.length > 0) {
                     const updatedTxs = await api.getTransactions();
                     setTransactions(updatedTxs);
                     console.log(`Generated ${newTransactions.length} recurring transactions via backfill`);
                }
            }
        } catch (e) {
            console.error("DB Error", e);
        } finally {
            setIsLoading(false);
        }
    };
    loadData();

    const stored = localStorage.getItem('financeflow_theme');
    if (stored) {
        const data = JSON.parse(stored);
        if (data.darkMode) setIsDarkMode(data.darkMode);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('financeflow_theme', JSON.stringify({ darkMode: isDarkMode }));
  }, [isDarkMode]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleAddTransaction = async (t: Partial<Transaction>) => {
    // Normalizza la data a YYYY-MM-DD se non presente
    const dateToSave = t.date || new Date().toISOString().split('T')[0];

    const newTx: Transaction = {
      id: '',
      amount: t.amount || 0,
      type: t.type || TransactionType.EXPENSE,
      category: t.category || Category.OTHER,
      subcategory: t.subcategory,
      date: dateToSave,
      description: t.description || 'Nuova transazione',
      receiptImage: t.receiptImage,
      isRecurring: t.isRecurring,
      recurrenceFrequency: t.recurrenceFrequency,
      nextRecurringDate: t.nextRecurringDate // Questo arriva già calcolato dal form o undefined
    };
    
    setTransactions(prev => [newTx, ...prev]); 
    setCurrentView('dashboard');
    
    const saved = await api.addTransaction(newTx);
    
    if(saved) {
        setTransactions(prev => [saved, ...prev.filter(x => x !== newTx)]); 

        if (saved.isRecurring && saved.nextRecurringDate) {
            const todayStr = new Date().toISOString().split('T')[0];
            let nextDateStr = saved.nextRecurringDate; // YYYY-MM-DD
            const createdChildren: Transaction[] = [];

            // Se l'utente ha impostato una ricorrenza retroattiva (data nel passato)
            while (nextDateStr <= todayStr) {
                const childTx: Transaction = {
                    ...saved,
                    id: '', 
                    date: nextDateStr,
                    isRecurring: false, 
                    nextRecurringDate: undefined
                };

                const savedChild = await api.addTransaction(childTx);
                if (savedChild) {
                    createdChildren.push(savedChild);
                }

                if (saved.recurrenceFrequency) {
                   nextDateStr = calculateNextDate(nextDateStr, saved.recurrenceFrequency);
                } else {
                    break;
                }
            }

            if (createdChildren.length > 0) {
                setTransactions(prev => [...createdChildren, ...prev]);
                await api.updateTransactionNextDate(saved.id, nextDateStr);
            }
        }
    }
  };

  const handleAddBill = async (b: Bill) => {
      const saved = await api.addBill(b);
      if(saved) setBills([...bills, saved]);
  };

  const handlePayBill = async (id: string) => {
    await api.updateBill(id, { isPaid: true });
    setBills(bills.map(b => b.id === id ? { ...b, isPaid: true } : b));
    
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

  const handleStopRecurrence = async (id: string) => {
      if(window.confirm("Vuoi davvero interrompere questa ricorrenza? Le transazioni passate rimarranno.")) {
          await api.stopRecurrence(id);
          setTransactions(transactions.map(t => t.id === id ? {...t, isRecurring: false, nextRecurringDate: undefined} : t));
      }
  }

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
      case 'recurring':
        return <RecurringView transactions={transactions} onStopRecurrence={handleStopRecurrence} />;
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

      {!isLocked && isDbConfigured && (
        <ChatWidget transactions={transactions} bills={bills} />
      )}

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
        <NavButton id="recurring" icon={Repeat} label="Ricorrenti" />
        <NavButton id="settings" icon={Settings} label="Menu" />
      </nav>
    </div>
  );
};

export default App;