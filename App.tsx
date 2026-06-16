import React, { useState, useEffect, useCallback } from 'react';
import { Argomento, Domanda, RispostaLettera } from './types';
import { storageService, StorageStatus } from './services/storageService';

const INSERT_PASSWORD = 'VALHALLA';
const DOMANDE_PER_SERIE = 10;

type GamePhase = 'menu' | 'playing' | 'finished';

const RISPOSTE_LABEL: Record<RispostaLettera, string> = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
};

const App: React.FC = () => {
  const [argomenti, setArgomenti] = useState<Argomento[]>([]);
  const [selectedArgomentoId, setSelectedArgomentoId] = useState('');
  const [domande, setDomande] = useState<Domanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>({ mode: 'local', cloudOk: false });
  const [loadError, setLoadError] = useState('');

  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<RispostaLettera | null>(null);
  const [answerRevealed, setAnswerRevealed] = useState(false);

  const [showAdmin, setShowAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const [nuovoArgomento, setNuovoArgomento] = useState('');
  const [adminArgomentoId, setAdminArgomentoId] = useState('');
  const [numeroDomanda, setNumeroDomanda] = useState(1);
  const [testoDomanda, setTestoDomanda] = useState('');
  const [rispostaA, setRispostaA] = useState('');
  const [rispostaB, setRispostaB] = useState('');
  const [rispostaC, setRispostaC] = useState('');
  const [rispostaD, setRispostaD] = useState('');
  const [rispostaCorretta, setRispostaCorretta] = useState<RispostaLettera>('A');

  const loadArgomenti = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const status = await storageService.getStorageStatus();
      setStorageStatus(status);
      const data = await storageService.getArgomenti();
      setArgomenti(data);
      if (data.length > 0 && !selectedArgomentoId) {
        setSelectedArgomentoId(data[0].id);
      }
    } catch (error) {
      setArgomenti([]);
      setLoadError(error instanceof Error ? error.message : 'Errore durante il caricamento.');
    } finally {
      setLoading(false);
    }
  }, [selectedArgomentoId]);

  useEffect(() => {
    loadArgomenti();
  }, [loadArgomenti]);

  const selectedArgomento = argomenti.find((a) => a.id === selectedArgomentoId);

  const startGame = async () => {
    if (!selectedArgomentoId) return;
    setLoading(true);
    setLoadError('');
    try {
      const data = await storageService.getDomandeByArgomento(selectedArgomentoId);
      if (data.length < DOMANDE_PER_SERIE) {
        setLoadError(`Servono ${DOMANDE_PER_SERIE} domande per giocare. Ce ne sono solo ${data.length} per questo argomento.`);
        setLoading(false);
        return;
      }
      const serie = data.slice(0, DOMANDE_PER_SERIE);
      setDomande(serie);
      setCurrentIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setAnswerRevealed(false);
      setGamePhase('playing');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Errore caricamento domande.');
    } finally {
      setLoading(false);
    }
  };

  const currentDomanda = domande[currentIndex];

  const getRispostaTesto = (domanda: Domanda, lettera: RispostaLettera): string => {
    const map = { A: domanda.rispostaA, B: domanda.rispostaB, C: domanda.rispostaC, D: domanda.rispostaD };
    return map[lettera];
  };

  const handleAnswerClick = (lettera: RispostaLettera) => {
    if (answerRevealed || !currentDomanda) return;
    setSelectedAnswer(lettera);
    setAnswerRevealed(true);
    if (lettera === currentDomanda.rispostaCorretta) {
      setScore((s) => s + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 >= domande.length) {
      setGamePhase('finished');
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedAnswer(null);
    setAnswerRevealed(false);
  };

  const resetToMenu = () => {
    setGamePhase('menu');
    setDomande([]);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnswerRevealed(false);
  };

  const handleShowAdmin = () => {
    setShowPasswordModal(true);
    setPasswordInput('');
    setPasswordError('');
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === INSERT_PASSWORD) {
      setShowPasswordModal(false);
      setShowAdmin(true);
      setPasswordInput('');
      setPasswordError('');
      if (argomenti.length > 0) {
        setAdminArgomentoId(argomenti[0].id);
      }
    } else {
      setPasswordError('Password errata.');
    }
  };

  const handleSaveArgomento = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');
    try {
      const nuovo = await storageService.saveArgomento(nuovoArgomento);
      setNuovoArgomento('');
      setSaveSuccess(`Argomento "${nuovo.nome}" creato!`);
      await loadArgomenti();
      setAdminArgomentoId(nuovo.id);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Errore salvataggio argomento.');
    }
  };

  const handleSaveDomanda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminArgomentoId || !testoDomanda.trim()) return;
    setSaveError('');
    setSaveSuccess('');
    try {
      await storageService.saveDomanda({
        argomentoId: adminArgomentoId,
        numero: numeroDomanda,
        testo: testoDomanda,
        rispostaA,
        rispostaB,
        rispostaC,
        rispostaD,
        rispostaCorretta,
      });
      setTestoDomanda('');
      setRispostaA('');
      setRispostaB('');
      setRispostaC('');
      setRispostaD('');
      setRispostaCorretta('A');
      setSaveSuccess(`Domanda n. ${numeroDomanda} salvata!`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Errore salvataggio domanda.');
    }
  };

  const getStorageBadge = () => {
    if (storageStatus.mode === 'local') {
      return { label: 'Solo questo PC', className: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    }
    if (storageStatus.cloudOk) {
      return { label: 'Cloud OK', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    }
    return { label: 'Cloud errore', className: 'bg-red-500/20 text-red-300 border-red-500/40' };
  };

  const storageBadge = getStorageBadge();

  const getAnswerButtonClass = (lettera: RispostaLettera): string => {
    const base = 'w-full text-left p-4 rounded-xl border-2 font-medium transition-all touch-manipulation min-h-[56px] flex items-center gap-3';
    if (!answerRevealed) {
      return `${base} border-indigo-400/50 bg-indigo-950/60 hover:bg-indigo-800/80 hover:border-amber-400 text-white cursor-pointer`;
    }
    if (lettera === currentDomanda?.rispostaCorretta) {
      return `${base} border-emerald-400 bg-emerald-900/60 text-emerald-100`;
    }
    if (lettera === selectedAnswer && lettera !== currentDomanda?.rispostaCorretta) {
      return `${base} border-red-400 bg-red-900/60 text-red-100`;
    }
    return `${base} border-slate-600 bg-slate-800/40 text-slate-400 opacity-60`;
  };

  return (
    <div className="min-h-screen pb-12 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white">
      <header className="bg-slate-900/80 border-b border-indigo-500/30 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 min-h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2 rounded-lg shadow-lg flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold tracking-tight truncate">SCALA DOMANDE</h1>
              <p className="text-[10px] text-amber-400/80 font-bold uppercase tracking-widest">Chi vuol essere milionario?</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {loading && <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />}
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase border ${storageBadge.className}`}>
              {storageBadge.label}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {loadError && gamePhase === 'menu' && (
          <div className="bg-red-900/40 border border-red-500/50 text-red-200 rounded-xl p-4 text-sm">
            <p className="font-bold mb-1">Attenzione</p>
            <p>{loadError}</p>
            {loadError.includes('Tabella') && (
              <p className="mt-2 text-red-300">Apri Supabase → SQL Editor ed esegui <strong>supabase_setup.sql</strong>.</p>
            )}
          </div>
        )}

        {!loadError && storageStatus.mode === 'local' && gamePhase === 'menu' && (
          <div className="bg-amber-900/30 border border-amber-500/40 text-amber-200 rounded-xl p-4 text-sm">
            Dati solo su questo PC. Configura Supabase in <strong>services/storageService.ts</strong> per condividerli.
          </div>
        )}

        {/* MENU - selezione argomento */}
        {gamePhase === 'menu' && !showAdmin && (
          <div className="space-y-6">
            <div className="bg-slate-800/60 rounded-2xl border border-indigo-500/30 p-6 shadow-xl">
              <h2 className="text-xl font-bold text-amber-400 mb-4">Scegli l&apos;argomento</h2>
              <label className="block text-sm text-slate-300 mb-2">Argomento della serie (10 domande)</label>
              <select
                value={selectedArgomentoId}
                onChange={(e) => setSelectedArgomentoId(e.target.value)}
                disabled={argomenti.length === 0}
                className="w-full bg-slate-900 border border-indigo-400/50 rounded-xl px-4 py-3 text-white text-base focus:ring-2 focus:ring-amber-400 outline-none min-h-[48px]"
              >
                {argomenti.length === 0 ? (
                  <option value="">Nessun argomento disponibile</option>
                ) : (
                  argomenti.map((a) => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))
                )}
              </select>

              {selectedArgomento && (
                <p className="mt-3 text-sm text-slate-400">
                  Serie: <span className="text-amber-300 font-semibold">{selectedArgomento.nome}</span> — 10 domande a risposta multipla
                </p>
              )}

              <button
                onClick={startGame}
                disabled={!selectedArgomentoId || loading}
                className="mt-6 w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-extrabold py-4 rounded-xl shadow-lg transition-all text-lg"
              >
                INIZIA IL GIOCO
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleShowAdmin}
                className="text-sm text-slate-400 hover:text-amber-400 underline transition-colors"
              >
                Gestione domande (admin)
              </button>
            </div>
          </div>
        )}

        {/* GIOCO */}
        {gamePhase === 'playing' && currentDomanda && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-amber-400 font-bold">
                Domanda {currentIndex + 1} di {domande.length}
              </span>
              <span className="text-emerald-400 font-bold">
                Punteggio: {score}
              </span>
            </div>

            {/* Scala punteggi stile milionario */}
            <div className="flex gap-4">
              <div className="hidden sm:flex flex-col-reverse gap-1 w-16 flex-shrink-0">
                {Array.from({ length: DOMANDE_PER_SERIE }, (_, i) => i + 1).map((n) => (
                  <div
                    key={n}
                    className={`text-center text-xs py-1 rounded font-bold ${
                      n === currentIndex + 1
                        ? 'bg-amber-500 text-slate-900'
                        : n <= score
                          ? 'bg-emerald-800/60 text-emerald-300'
                          : 'bg-slate-800/60 text-slate-500'
                    }`}
                  >
                    {n}
                  </div>
                ))}
              </div>

              <div className="flex-1 space-y-4">
                <div className="bg-gradient-to-br from-indigo-900/80 to-slate-900 rounded-2xl border-2 border-amber-500/40 p-6 shadow-2xl">
                  <p className="text-lg sm:text-xl font-semibold leading-relaxed text-center">
                    {currentDomanda.testo}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {(['A', 'B', 'C', 'D'] as RispostaLettera[]).map((lettera) => (
                    <button
                      key={lettera}
                      type="button"
                      onClick={() => handleAnswerClick(lettera)}
                      disabled={answerRevealed}
                      className={getAnswerButtonClass(lettera)}
                    >
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 text-slate-900 font-extrabold flex items-center justify-center text-sm">
                        {RISPOSTE_LABEL[lettera]}
                      </span>
                      <span>{getRispostaTesto(currentDomanda, lettera)}</span>
                    </button>
                  ))}
                </div>

                {answerRevealed && (
                  <div className="text-center space-y-3">
                    <p className={`font-bold text-lg ${selectedAnswer === currentDomanda.rispostaCorretta ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selectedAnswer === currentDomanda.rispostaCorretta ? 'Risposta corretta!' : 'Risposta sbagliata!'}
                    </p>
                    <button
                      onClick={handleNextQuestion}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-colors"
                    >
                      {currentIndex + 1 >= domande.length ? 'Vedi risultato' : 'Prossima domanda'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button onClick={resetToMenu} className="text-sm text-slate-500 hover:text-slate-300 underline">
              Esci dal gioco
            </button>
          </div>
        )}

        {/* FINE GIOCO */}
        {gamePhase === 'finished' && (
          <div className="bg-slate-800/60 rounded-2xl border border-amber-500/40 p-8 text-center shadow-2xl space-y-4">
            <h2 className="text-2xl font-extrabold text-amber-400">Fine della serie!</h2>
            <p className="text-5xl font-black text-white">{score} / {domande.length}</p>
            <p className="text-slate-300">
              {score === domande.length
                ? 'Perfetto! Hai risposto correttamente a tutte le domande!'
                : score >= domande.length / 2
                  ? 'Ottimo risultato! Continua così!'
                  : 'Puoi fare di meglio! Riprova!'}
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <button
                onClick={startGame}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-6 rounded-xl"
              >
                Rigioca
              </button>
              <button
                onClick={resetToMenu}
                className="border border-slate-500 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl"
              >
                Cambia argomento
              </button>
            </div>
          </div>
        )}

        {/* ADMIN */}
        {showAdmin && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-amber-400">Gestione domande</h2>
              <button
                onClick={() => { setShowAdmin(false); setSaveError(''); setSaveSuccess(''); }}
                className="text-sm text-slate-400 hover:text-white"
              >
                Chiudi
              </button>
            </div>

            {saveError && (
              <p className="text-red-300 bg-red-900/40 border border-red-500/50 rounded-lg p-3 text-sm">{saveError}</p>
            )}
            {saveSuccess && (
              <p className="text-emerald-300 bg-emerald-900/40 border border-emerald-500/50 rounded-lg p-3 text-sm">{saveSuccess}</p>
            )}

            <form onSubmit={handleSaveArgomento} className="bg-slate-800/60 rounded-xl border border-indigo-500/30 p-4 space-y-3">
              <h3 className="font-bold text-white">Nuovo argomento</h3>
              <input
                type="text"
                value={nuovoArgomento}
                onChange={(e) => setNuovoArgomento(e.target.value)}
                placeholder="Es. Storia, Geografia, Scienze..."
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg text-sm">
                Crea argomento
              </button>
            </form>

            <form onSubmit={handleSaveDomanda} className="bg-slate-800/60 rounded-xl border border-indigo-500/30 p-4 space-y-4">
              <h3 className="font-bold text-white">Aggiungi domanda (1–10 per argomento)</h3>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Argomento</label>
                <select
                  value={adminArgomentoId}
                  onChange={(e) => setAdminArgomentoId(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Seleziona...</option>
                  {argomenti.map((a) => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Numero domanda (1-10)</label>
                <select
                  value={numeroDomanda}
                  onChange={(e) => setNumeroDomanda(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>Domanda {n}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Testo domanda</label>
                <textarea
                  required
                  value={testoDomanda}
                  onChange={(e) => setTestoDomanda(e.target.value)}
                  rows={3}
                  placeholder="Scrivi qui la domanda..."
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['A', 'B', 'C', 'D'] as RispostaLettera[]).map((lettera, i) => {
                  const setters = [setRispostaA, setRispostaB, setRispostaC, setRispostaD];
                  const values = [rispostaA, rispostaB, rispostaC, rispostaD];
                  return (
                    <div key={lettera}>
                      <label className="block text-sm text-slate-300 mb-1">Risposta {lettera}</label>
                      <input
                        type="text"
                        required
                        value={values[i]}
                        onChange={(e) => setters[i](e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Risposta corretta</label>
                <select
                  value={rispostaCorretta}
                  onChange={(e) => setRispostaCorretta(e.target.value as RispostaLettera)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 font-bold py-3 rounded-xl">
                Salva domanda
              </button>
            </form>
          </div>
        )}
      </main>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-indigo-500/40 w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Accesso admin</h3>
            <p className="text-sm text-slate-400 mb-4">Inserisci la password per gestire argomenti e domande.</p>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 mb-4 text-white outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Password"
              autoFocus
            />
            {passwordError && <p className="text-red-400 text-sm mb-4">{passwordError}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 border border-slate-600 rounded-xl text-slate-300">Annulla</button>
              <button type="button" onClick={handlePasswordSubmit} className="flex-1 py-3 bg-amber-500 text-slate-900 font-bold rounded-xl">Accedi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
