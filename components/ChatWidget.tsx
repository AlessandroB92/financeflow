import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import * as GeminiService from '../services/geminiService.ts';
import { Transaction, Bill } from '../types.ts';

export const ChatWidget = ({ transactions, bills }: { transactions: Transaction[], bills: Bill[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: 'Ciao! Sono Fin, il tuo assistente finanziario. Come posso aiutarti oggi?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatSession) {
      const session = GeminiService.createFinancialChat(transactions, bills);
      if (session) setChatSession(session);
    }
  }, [isOpen, transactions, bills]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useLayoutEffect(() => {
    if (isOpen) {
      gsap.fromTo(chatContainerRef.current, 
        { opacity: 0, y: 20, scale: 0.9 }, 
        { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(1.2)" }
      );
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    const responseText = await GeminiService.sendMessageToChat(chatSession, userMsg);
    
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
      if(e.key === 'Enter') handleSend();
  }

  const formatMessage = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${isOpen ? 'bg-slate-200 text-slate-800 rotate-90' : 'bg-indigo-600 text-white'}`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
        </button>
      </div>

      {isOpen && (
        <div ref={chatContainerRef} className="fixed bottom-40 right-4 md:bottom-24 md:right-8 w-[90vw] md:w-[380px] h-[500px] glass-panel bg-white/95 dark:bg-slate-900/95 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 z-40 flex flex-col overflow-hidden">
           <div className="p-4 bg-indigo-600 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                 </div>
                 <div>
                    <h3 className="font-bold text-sm">Fin Assistant</h3>
                    <p className="text-[10px] text-indigo-200 flex items-center gap-1">
                       <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
                    </p>
                 </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                 <Minimize2 className="w-5 h-5" />
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
              {messages.map((m, i) => (
                 <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                      m.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700'
                    }`}>
                       {formatMessage(m.text)}
                    </div>
                 </div>
              ))}
              {isLoading && (
                 <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-700">
                       <div className="flex gap-1">
                          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
                       </div>
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
           </div>

           <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
             {!GeminiService.hasApiKey() ? (
                <div className="text-center text-xs text-red-500 py-2">API Key mancante in index.html</div>
             ) : (
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-full pr-2 focus-within:ring-2 ring-indigo-500/50 transition-all">
                  <input 
                    className="flex-1 bg-transparent border-none focus:outline-none px-3 py-2 text-sm dark:text-white placeholder-slate-400"
                    placeholder="Chiedi a Fin..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isLoading}
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-90"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
             )}
           </div>
        </div>
      )}
    </>
  );
};
