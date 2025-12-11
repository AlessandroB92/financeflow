import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, EXPENSE_CATEGORIES, MarketAnalysis } from "../types";

// Verifica se la chiave API è presente
export const hasApiKey = (): boolean => {
  try {
    return typeof process !== "undefined" && !!process.env?.API_KEY;
  } catch {
    return false;
  }
};

const getAI = () => {
  let apiKey = "";
  try {
    if (typeof process !== "undefined" && process.env && process.env.API_KEY) {
      apiKey = process.env.API_KEY;
    }
  } catch (e) {
    console.error("Errore lettura env:", e);
  }

  if (!apiKey) {
    console.warn("API Key di Gemini mancante. Configurala in index.html");
  }

  return new GoogleGenAI({ apiKey });
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