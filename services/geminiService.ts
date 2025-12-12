import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Transaction, EXPENSE_CATEGORIES, MarketAnalysis, Bill } from "../types.ts";

// Helper sicuro per leggere le variabili d'ambiente nel browser
const getEnvVar = (key: string): string | undefined => {
  try {
    // 0. Fallback diretto per Gemini (per evitare problemi con oggetti process non standard)
    if (key === 'API_KEY' && (window as any).GEMINI_API_KEY) {
      return (window as any).GEMINI_API_KEY.trim();
    }

    // 1. Prova window.process (definito in index.html)
    if (typeof window !== "undefined" && (window as any).process?.env?.[key]) {
      return (window as any).process.env[key].trim();
    }
    // 2. Prova process globale (se disponibile)
    if (typeof process !== "undefined" && process.env?.[key]) {
      return process.env[key].trim();
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
};

// Verifica se la chiave API è presente
export const hasApiKey = (): boolean => {
  return !!getEnvVar('API_KEY');
};

const getAI = () => {
  const apiKey = getEnvVar('API_KEY');

  if (!apiKey) {
    console.warn("API Key di Gemini mancante. Configurala in index.html");
  }

  return new GoogleGenAI({ apiKey: apiKey || '' });
};

/**
 * Creates a chat session aware of user's financial data
 */
export const createFinancialChat = (transactions: Transaction[], bills: Bill[]) => {
  if (!hasApiKey()) return null;

  const ai = getAI();
  
  // Prepare context data (limit to recent items to save context window if needed, though 2.5 Flash has huge context)
  const contextData = {
    transactions: transactions.slice(0, 100).map(t => ({
      date: t.date,
      amount: t.amount,
      type: t.type,
      category: t.category,
      description: t.description
    })),
    upcoming_bills: bills.filter(b => !b.isPaid).map(b => ({
      name: b.name,
      amount: b.amount,
      due: b.dueDate
    }))
  };

  const systemInstruction = `
    Sei "Fin", l'assistente virtuale intelligente dell'app FinanceFlow AI.
    Il tuo obiettivo è aiutare l'utente a capire le sue finanze, rispondere a domande sulle sue spese e dare consigli.
    
    Ecco i dati finanziari attuali dell'utente in formato JSON:
    ${JSON.stringify(contextData)}

    REGOLE:
    1. Rispondi in modo conciso, amichevole e professionale.
    2. Usa la formattazione Markdown (grassetto per i numeri, elenchi puntati) per rendere la risposta leggibile.
    3. Se l'utente chiede qualcosa che non puoi calcolare dai dati, dillo chiaramente o offri consigli generali.
    4. La valuta è Euro (€).
    5. Parla sempre in Italiano.
    6. Se ti chiedono un riassunto, analizza le categorie principali di spesa.
  `;

  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemInstruction,
    }
  });
};

/**
 * Sends a message to the chat session
 */
export const sendMessageToChat = async (chat: Chat, message: string): Promise<string> => {
  try {
    const response = await chat.sendMessage({ message });
    return response.text || "Scusa, non ho capito.";
  } catch (e) {
    console.error("Chat error", e);
    return "Si è verificato un errore di connessione con l'AI.";
  }
};

/**
 * Analyzes a receipt image to extract transaction details.
 */
export const analyzeReceipt = async (base64Image: string): Promise<Partial<Transaction> | null> => {
  if (!hasApiKey()) return null;
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: `Analizza questo scontrino. Estrai:
            1. Total (amount)
            2. Date (ISO YYYY-MM-DD)
            3. Vendor as description
            4. Category. Choose strictly from this list: ${EXPENSE_CATEGORIES.join(', ')}.
            5. Subcategory (e.g. Pasta, Meat, Electricity).
            Return JSON.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            subcategory: { type: Type.STRING, nullable: true },
          },
          required: ["amount", "description", "category"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing receipt:", error);
    return null;
  }
};

/**
 * Provides financial advice based on recent transactions.
 */
export const getFinancialAdvice = async (transactions: Transaction[]): Promise<string> => {
  if (!hasApiKey()) return "API Key non configurata. Inseriscila nel file index.html.";
  
  const summary = transactions.slice(0, 50).map(t => ({
    date: t.date,
    amount: t.amount,
    type: t.type,
    cat: t.category,
    sub: t.subcategory
  }));

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Sei un consulente finanziario. Analizza queste transazioni (max 50 recenti).
      Dammi 3 consigli brevi (max 2 frasi l'uno) su come risparmiare, notando eventuali trend negativi o spese ricorrenti inutili.
      Usa un tono incoraggiante.
      Dati: ${JSON.stringify(summary)}`,
    });

    return response.text || "Non sono riuscito a generare consigli al momento.";
  } catch (error) {
    console.error("Error getting advice:", error);
    return "Errore di connessione con l'AI. Verifica la tua chiave API.";
  }
};

/**
 * Auto-categorizes a transaction description.
 */
export const predictCategory = async (description: string): Promise<string | null> => {
    if (!hasApiKey()) return null;
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Categorizza la spesa "${description}" ESATTAMENTE in una di queste categorie: ${EXPENSE_CATEGORIES.join(', ')}. Rispondi SOLO con il nome della categoria senza punteggiatura.`,
        });
        return response.text?.trim() || null;
    } catch (error) {
        console.error("Error predicting category", error);
        return null;
    }
}

/**
 * Generates market analysis and investment tips.
 */
export const getMarketAnalysis = async (): Promise<MarketAnalysis | null> => {
    if (!hasApiKey()) return null;
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Agisci come un analista di mercato senior. Genera un report fittizio ma realistico sullo stato attuale del mercato finanziario globale.
            Fornisci:
            1. Sentiment generale (Bullish, Bearish, Neutral)
            2. Uno score da 0 a 100 (dove 100 è massima euforia/crescita).
            3. Un breve riassunto (2 frasi) sulla situazione macroeconomica.
            4. 3 Settori da tenere d'occhio (es. AI, Green Energy, BioTech) con trend (up/down) e motivo.
            Rispondi in JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        sentiment: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral"] },
                        score: { type: Type.NUMBER },
                        summary: { type: Type.STRING },
                        trends: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    sector: { type: Type.STRING },
                                    trend: { type: Type.STRING, enum: ["up", "down", "neutral"] },
                                    change: { type: Type.NUMBER },
                                    reason: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("Market analysis error:", error);
        return null;
    }
}