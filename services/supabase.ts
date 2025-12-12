import { createClient } from '@supabase/supabase-js';
import { Transaction, Bill } from '../types.ts';

// ⚠️ SOSTITUISCI CON I TUOI DATI DI SUPABASE ⚠️
const SUPABASE_URL = 'https://ofznsslbukmeacrmjwgx.supabase.co'; // es: https://xyz.supabase.co
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mem5zc2xidWttZWFjcm1qd2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDc4OTMsImV4cCI6MjA4MTAyMzg5M30.JxSy7yUSvnxjEmx7ABDL7UaH-ztk2JoC0y0jc7u-EeU'; // es: eyJxh...

// Fallback per evitare crash se l'utente non ha configurato
const isConfigured = SUPABASE_URL.includes('http');

export const supabase = isConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// --- API Methods ---

export const api = {
  // SETTINGS (PIN)
  getPin: async (): Promise<string | undefined> => {
    if (!supabase) return undefined;
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'app_pin')
      .single();
    
    if (error || !data) return undefined;
    return data.value;
  },

  setPin: async (pin: string | undefined): Promise<void> => {
    if (!supabase) return;
    
    if (!pin) {
      // Rimuovi PIN
      await supabase.from('settings').delete().eq('key', 'app_pin');
    } else {
      // Salva/Aggiorna PIN
      await supabase.from('settings').upsert({ key: 'app_pin', value: pin });
    }
  },

  // TRANSACTIONS
  getTransactions: async (): Promise<Transaction[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) { console.error(error); return []; }
    return data.map((t: any) => ({
      ...t,
      receiptImage: t.receipt_image,
      isRecurring: t.is_recurring
    }));
  },

  addTransaction: async (transaction: Transaction): Promise<Transaction | null> => {
    if (!supabase) return null;
    const { id, ...toInsert } = transaction; 
    
    const dbPayload = {
      amount: toInsert.amount,
      type: toInsert.type,
      category: toInsert.category,
      subcategory: toInsert.subcategory,
      date: toInsert.date,
      description: toInsert.description,
      receipt_image: toInsert.receiptImage,
      is_recurring: toInsert.isRecurring
    };

    const { data, error } = await supabase.from('transactions').insert(dbPayload).select().single();
    if (error) { console.error(error); return null; }
    
    return {
      ...data,
      receiptImage: data.receipt_image,
      isRecurring: data.is_recurring
    };
  },

  // BILLS
  getBills: async (): Promise<Bill[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('bills').select('*');
    if (error) { console.error(error); return []; }
    return data.map((b: any) => ({
      ...b,
      dueDate: b.due_date,
      isPaid: b.is_paid
    }));
  },

  addBill: async (bill: Bill): Promise<Bill | null> => {
    if (!supabase) return null;
    const { id, ...toInsert } = bill;
    const dbPayload = {
      name: toInsert.name,
      amount: toInsert.amount,
      category: toInsert.category,
      due_date: toInsert.dueDate,
      is_paid: toInsert.isPaid
    };
    const { data, error } = await supabase.from('bills').insert(dbPayload).select().single();
    if (error) { console.error(error); return null; }
    return { ...data, dueDate: data.due_date, isPaid: data.is_paid };
  },

  updateBill: async (id: string, updates: Partial<Bill>): Promise<void> => {
    if (!supabase) return;
    const payload: any = {};
    if (updates.isPaid !== undefined) payload.is_paid = updates.isPaid;
    await supabase.from('bills').update(payload).eq('id', id);
  },

  deleteBill: async (id: string): Promise<void> => {
    if (!supabase) return;
    await supabase.from('bills').delete().eq('id', id);
  }
};