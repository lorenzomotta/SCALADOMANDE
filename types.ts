export type RispostaLettera = 'A' | 'B' | 'C' | 'D';

export interface Argomento {
  id: string;
  nome: string;
  createdAt: number;
}

export interface Domanda {
  id: string;
  argomentoId: string;
  numero: number;
  testo: string;
  rispostaA: string;
  rispostaB: string;
  rispostaC: string;
  rispostaD: string;
  rispostaCorretta: RispostaLettera;
  createdAt: number;
}

export interface NuovaDomanda {
  argomentoId: string;
  numero: number;
  testo: string;
  rispostaA: string;
  rispostaB: string;
  rispostaC: string;
  rispostaD: string;
  rispostaCorretta: RispostaLettera;
}
