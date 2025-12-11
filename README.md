# 💸 FinanceFlow AI

**FinanceFlow AI** è un'applicazione web moderna e reattiva per la gestione delle finanze personali. Sfrutta la potenza dell'Intelligenza Artificiale (Google Gemini) per automatizzare l'inserimento dati e fornire consigli finanziari intelligenti.

Progettata con un'architettura leggera (senza build step complessi) e un'interfaccia "Mobile-First" curata nei minimi dettagli.

![FinanceFlow AI Preview](https://via.placeholder.com/800x400.png?text=FinanceFlow+AI+Preview)

## ✨ Funzionalità Principali

### 📊 Gestione Finanziaria Completa
*   **Tracciamento Transazioni**: Registra entrate e uscite con categorie e sottocategorie dinamiche.
*   **Analytics & Trend**: Grafici interattivi (a torta, ad area) con filtri temporali (1M, 3M, 6M, 1Y, Tutto) e per tipologia.
*   **Bollette & Scadenze**: Scadenzario integrato con indicatori visivi per pagamenti imminenti o scaduti.

### 🤖 Intelligenza Artificiale (Powered by Gemini)
*   **Scanner Scontrini OCR**: Scatta una foto e l'AI estrarrà automaticamente importo, data, fornitore e categorizzerà la spesa.
*   **Auto-Categorizzazione**: L'app intuisce la categoria corretta basandosi sulla descrizione inserita.
*   **Financial Advisor**: Analisi periodica delle tue spese per offrirti consigli personalizzati su come risparmiare.

### 🛠️ Utility Avanzate
*   **Divisione Spese (Split)**: Calcolatrice per dividere conti tra amici in modo equo o basato su **percentuali personalizzate**.
*   **Sicurezza PIN**: Protezione dell'app tramite codice PIN a 4 cifre sincronizzato sul cloud.
*   **Tema Scuro**: Supporto nativo Dark Mode e Light Mode persistente.

---

## 🏗️ Stack Tecnologico

Il progetto è costruito utilizzando le più moderne tecnologie web, senza richiedere complessi processi di build (bundler-free development):

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS (via CDN)
*   **Animazioni**: GSAP (GreenSock Animation Platform)
*   **Grafici**: Recharts
*   **Database**: Supabase (PostgreSQL)
*   **AI**: Google GenAI SDK (Gemini 2.5 Flash)
*   **Icone**: Lucide React

---

## 🚀 Guida all'Installazione

Poiché l'app utilizza ES Modules via browser, l'installazione è immediata.

### 1. Prerequisiti
*   Un account [Supabase](https://supabase.com/) (Gratuito).
*   Una API Key di [Google AI Studio](https://aistudio.google.com/) (Gratuita).
*   Un editor di codice (es. VS Code) con l'estensione **Live Server**.

### 2. Configurazione Database (Supabase)
Vai nella sezione **SQL Editor** del tuo progetto Supabase ed esegui questi script per creare le tabelle:

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
  receipt_image text,
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
```

### 3. Collegamento Chiavi API

#### Database (Supabase)
Apri il file `services/supabase.ts` e sostituisci le costanti con i dati del tuo progetto (Project Settings > API):

```typescript
const SUPABASE_URL = 'LA_TUA_URL_SUPABASE'; // es: https://xyz.supabase.co
const SUPABASE_KEY = 'LA_TUA_ANON_KEY';     // Chiave pubblica
```

#### Google AI (Gemini)
Apri il file `index.html` e inserisci la tua chiave API nello script di configurazione:

```html
<script>
  window.process = {
    env: {
      API_KEY: 'LA_TUA_API_KEY_GOOGLE' 
    }
  };
</script>
```

### 4. Avvio Applicazione
1.  Apri la cartella del progetto con **VS Code**.
2.  Clicca con il tasto destro su `index.html`.
3.  Seleziona **"Open with Live Server"**.

L'app si avvierà nel tuo browser predefinito.

---

## 📱 Utilizzo

1.  **Dashboard**: Visione immediata del saldo e accesso rapido alle funzioni AI.
2.  **Nuova Transazione (+)**: Inserimento manuale o tramite scansione scontrino.
3.  **Analisi**: Visualizza i grafici di andamento e filtra per periodo.
4.  **Menu**: Accedi alle impostazioni per configurare il **PIN di sicurezza** o cambiare tema.

---

## 📄 Licenza

Questo progetto è rilasciato sotto licenza **MIT**. Sentiti libero di modificarlo e adattarlo alle tue esigenze personali.
