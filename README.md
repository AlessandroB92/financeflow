# 💸 FinanceFlow AI

FinanceFlow AI è un'applicazione web moderna per la gestione delle finanze personali, potenziata dall'Intelligenza Artificiale.  
Progettata con un approccio "Mobile-First", offre un'esperienza fluida per tracciare spese, entrate, bollette e ottenere consigli finanziari personalizzati grazie all'integrazione con Google Gemini.

---

## ✨ Funzionalità Principali

### 📊 Gestione e Analisi
- **Tracciamento Transazioni**: Registra entrate e uscite con categorie dinamiche e sottocategorie.
- **Analytics Avanzati**: Grafici interattivi (a torta, ad area) per monitorare i trend di spesa su periodi personalizzati (1 mese, 6 mesi, 1 anno).
- **Filtri Intelligenti**: Analizza solo le entrate, solo le uscite o il saldo netto.

### 🤖 Intelligenza Artificiale (Powered by Gemini)
- **Scanner Scontrini OCR**: Scatta una foto a uno scontrino e l'AI estrarrà automaticamente importo, data, descrizione e categoria.
- **Financial Advisor**: Ottieni consigli personalizzati su come risparmiare basati sull'analisi delle tue ultime 50 transazioni.
- **Auto-Categorizzazione**: L'app suggerisce la categoria corretta mentre digiti la descrizione della spesa.

### 🧾 Utility Avanzate
- **Gestione Bollette**: Scadenzario con indicatori visivi per bollette in scadenza o scadute. Pagamento rapido con un click.
- **Divisione Spese (Split)**: Calcolatrice integrata per dividere conti tra amici in modo equo o basato su percentuali personalizzate.

### 🔒 Sicurezza e Cloud
- **Database Cloud**: Tutti i dati sono sincronizzati in tempo reale su Supabase.
- **Protezione PIN**: Blocca l'accesso all'app con un PIN a 4 cifre (salvato in modo sicuro nel database).
- **Tema Scuro**: Supporto nativo per Light e Dark mode.

---

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript  
- **Styling**: Tailwind CSS  
- **Animazioni**: GSAP (GreenSock)  
- **Grafici**: Recharts  
- **Database**: Supabase (PostgreSQL)  
- **AI**: Google Gemini Pro & Flash  
- **Icone**: Lucide React  

---

## 🚀 Installazione e Configurazione

Attualmente l'applicazione è strutturata per funzionare direttamente nel browser tramite moduli ES6 (senza build step complesso), ma richiede una configurazione delle chiavi API.

---

### 1. Prerequisiti
- Un account Supabase (Gratuito).
- Una API Key di Google AI Studio (Gratuita).
- Un server web locale (es. estensione "Live Server" di VS Code).

---

### 2. Configurazione Database (Supabase)

Vai nel pannello SQL Editor del tuo progetto Supabase ed incolla questo script per creare le tabelle necessarie:

```sql
-- 1. Tabella Transazioni
create table transactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  amount numeric not null,
  type text not null, -- 'INCOME' o 'EXPENSE'
  category text not null,
  subcategory text,
  date text not null,
  description text not null,
  receipt_image text, -- Base64 (o URL se usi Storage)
  is_recurring boolean default false
);

-- 2. Tabella Bollette
create table bills (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  amount numeric not null,
  due_date text not null,
  is_paid boolean default false,
  category text not null
);

-- 3. Tabella Impostazioni (per il PIN)
create table settings (
  key text primary key,
  value text not null
);
