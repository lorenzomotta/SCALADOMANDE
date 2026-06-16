import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Argomento, Domanda, NuovaDomanda, RispostaLettera } from '../types';

// Stesso progetto Supabase di Quattro Parole (puoi usare lo stesso database)
const SUPABASE_URL = "https://ghhalunaiqtyoxryygje.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoaGFsdW5haXF0eW94cnl5Z2plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTY4NDMsImV4cCI6MjA5NzEzMjg0M30.HUb24RUkqO08LPtAFJTs5MmjnUudx5l6fVCe8vTOcGs";

const isConfigured = SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes("INSERISCI_QUI");

let supabase: SupabaseClient | null = null;
if (isConfigured) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.warn("Configurazione Supabase non valida.");
  }
}

const LOCAL_ARGOMENTI_KEY = 'scala_domande_argomenti_local';
const LOCAL_DOMANDE_KEY = 'scala_domande_domande_local';

export type StorageStatus = {
  mode: 'cloud' | 'local';
  cloudOk: boolean;
  cloudError?: string;
};

type RowArgomento = {
  id: string;
  nome: string;
  created_at?: number;
};

type RowDomanda = {
  id: string;
  argomento_id: string;
  numero: number;
  testo: string;
  risposta_a: string;
  risposta_b: string;
  risposta_c: string;
  risposta_d: string;
  risposta_corretta: string;
  created_at?: number;
};

function rowToArgomento(row: RowArgomento): Argomento {
  return {
    id: row.id,
    nome: row.nome,
    createdAt: row.created_at ?? 0,
  };
}

function rowToDomanda(row: RowDomanda): Domanda {
  return {
    id: row.id,
    argomentoId: row.argomento_id,
    numero: row.numero,
    testo: row.testo,
    rispostaA: row.risposta_a,
    rispostaB: row.risposta_b,
    rispostaC: row.risposta_c,
    rispostaD: row.risposta_d,
    rispostaCorretta: row.risposta_corretta as RispostaLettera,
    createdAt: row.created_at ?? 0,
  };
}

function getLocalArgomenti(): Argomento[] {
  const data = localStorage.getItem(LOCAL_ARGOMENTI_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalArgomenti(argomenti: Argomento[]): void {
  localStorage.setItem(LOCAL_ARGOMENTI_KEY, JSON.stringify(argomenti));
}

function getLocalDomande(): Domanda[] {
  const data = localStorage.getItem(LOCAL_DOMANDE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalDomande(domande: Domanda[]): void {
  localStorage.setItem(LOCAL_DOMANDE_KEY, JSON.stringify(domande));
}

async function fetchArgomentiFromCloud(): Promise<{ argomenti: Argomento[]; error?: string }> {
  if (!supabase) {
    return { argomenti: [], error: 'Client Supabase non disponibile.' };
  }

  const result = await supabase
    .from('argomenti')
    .select('*')
    .order('nome', { ascending: true });

  if (result.error) {
    if (result.error.message?.includes('not find the table') || result.error.code === 'PGRST116') {
      return { argomenti: [], error: 'Tabella "argomenti" non trovata. Esegui supabase_setup.sql nel SQL Editor.' };
    }
    return { argomenti: [], error: result.error.message };
  }

  return { argomenti: (result.data as RowArgomento[]).map(rowToArgomento) };
}

async function fetchDomandeFromCloud(argomentoId: string): Promise<{ domande: Domanda[]; error?: string }> {
  if (!supabase) {
    return { domande: [], error: 'Client Supabase non disponibile.' };
  }

  const result = await supabase
    .from('domande')
    .select('*')
    .eq('argomento_id', argomentoId)
    .order('numero', { ascending: true });

  if (result.error) {
    if (result.error.message?.includes('not find the table') || result.error.code === 'PGRST116') {
      return { domande: [], error: 'Tabella "domande" non trovata. Esegui supabase_setup.sql nel SQL Editor.' };
    }
    return { domande: [], error: result.error.message };
  }

  return { domande: (result.data as RowDomanda[]).map(rowToDomanda) };
}

export const storageService = {
  isConfigured: () => isConfigured && supabase !== null,

  getStorageStatus: async (): Promise<StorageStatus> => {
    if (!isConfigured || !supabase) {
      return { mode: 'local', cloudOk: false };
    }

    const { error } = await fetchArgomentiFromCloud();
    if (error) {
      return { mode: 'cloud', cloudOk: false, cloudError: error };
    }

    return { mode: 'cloud', cloudOk: true };
  },

  getArgomenti: async (): Promise<Argomento[]> => {
    if (supabase) {
      const { argomenti, error } = await fetchArgomentiFromCloud();
      if (error) throw new Error(error);
      return argomenti;
    }
    return getLocalArgomenti().sort((a, b) => a.nome.localeCompare(b.nome));
  },

  getDomandeByArgomento: async (argomentoId: string): Promise<Domanda[]> => {
    if (supabase) {
      const { domande, error } = await fetchDomandeFromCloud(argomentoId);
      if (error) throw new Error(error);
      return domande;
    }
    return getLocalDomande()
      .filter((d) => d.argomentoId === argomentoId)
      .sort((a, b) => a.numero - b.numero);
  },

  saveArgomento: async (nome: string): Promise<Argomento> => {
    const trimmed = nome.trim();
    if (!trimmed) throw new Error('Il nome argomento è obbligatorio.');

    if (supabase) {
      const result = await supabase
        .from('argomenti')
        .insert([{ nome: trimmed }])
        .select()
        .single();

      if (result.error) {
        if (result.error.message?.includes('duplicate') || result.error.code === '23505') {
          throw new Error('Questo argomento esiste già.');
        }
        throw new Error(result.error.message);
      }

      return rowToArgomento(result.data as RowArgomento);
    }

    const argomenti = getLocalArgomenti();
    if (argomenti.some((a) => a.nome.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error('Questo argomento esiste già.');
    }

    const nuovo: Argomento = {
      id: crypto.randomUUID(),
      nome: trimmed,
      createdAt: Date.now(),
    };
    saveLocalArgomenti([...argomenti, nuovo]);
    return nuovo;
  },

  saveDomanda: async (domanda: NuovaDomanda): Promise<void> => {
    if (domanda.numero < 1 || domanda.numero > 10) {
      throw new Error('Il numero domanda deve essere tra 1 e 10.');
    }

    if (supabase) {
      const result = await supabase.from('domande').insert([{
        argomento_id: domanda.argomentoId,
        numero: domanda.numero,
        testo: domanda.testo.trim(),
        risposta_a: domanda.rispostaA.trim(),
        risposta_b: domanda.rispostaB.trim(),
        risposta_c: domanda.rispostaC.trim(),
        risposta_d: domanda.rispostaD.trim(),
        risposta_corretta: domanda.rispostaCorretta,
        created_at: Date.now(),
      }]);

      if (result.error) {
        if (result.error.message?.includes('duplicate') || result.error.code === '23505') {
          throw new Error(`La domanda n. ${domanda.numero} esiste già per questo argomento.`);
        }
        throw new Error(result.error.message);
      }
      return;
    }

    const domande = getLocalDomande();
    if (domande.some((d) => d.argomentoId === domanda.argomentoId && d.numero === domanda.numero)) {
      throw new Error(`La domanda n. ${domanda.numero} esiste già per questo argomento.`);
    }

    const nuova: Domanda = {
      id: crypto.randomUUID(),
      argomentoId: domanda.argomentoId,
      numero: domanda.numero,
      testo: domanda.testo.trim(),
      rispostaA: domanda.rispostaA.trim(),
      rispostaB: domanda.rispostaB.trim(),
      rispostaC: domanda.rispostaC.trim(),
      rispostaD: domanda.rispostaD.trim(),
      rispostaCorretta: domanda.rispostaCorretta,
      createdAt: Date.now(),
    };
    saveLocalDomande([...domande, nuova]);
  },
};
