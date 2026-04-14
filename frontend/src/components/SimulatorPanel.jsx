import { useState, useEffect, useRef } from 'react';
import { simulateMachine } from '../lib/machines';
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw,
  ChevronRight, CheckCircle, AlertCircle, Zap,
} from 'lucide-react';

export default function SimulatorPanel({ machineDef, onStepChange }) {
  const [inputStr, setInputStr] = useState('');
  const [result, setResult]     = useState(null);   // { steps, finalOutput }
  const [error, setError]       = useState('');
  const [stepIdx, setStepIdx]   = useState(-1);
  const [playing, setPlaying]   = useState(false);
  const [speed, setSpeed]       = useState(900);     // ms per step
  const inputRef = useRef(null);
  const timelineRef = useRef(null);

  // ── Auto-simulate whenever input string changes (debounced 400 ms) ──────────
  useEffect(() => {
    setError('');
    setResult(null);
    setStepIdx(-1);
    setPlaying(false);
    onStepChange({ state: machineDef.initialState, edge: null });

    if (!inputStr.trim()) return;
    if (!machineDef.states?.length || !machineDef.initialState) return;

    const timer = setTimeout(async () => {
      try {
        const data = await simulateMachine(machineDef, inputStr.trim());
        setResult(data);
        setStepIdx(0);
      } catch (e) {
        setError(e.message);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [inputStr, machineDef]); // eslint-disable-line

  // ── Reset when machine definiton changes ─────────────────────────────────────
  useEffect(() => {
    setInputStr('');
    setResult(null);
    setStepIdx(-1);
    setPlaying(false);
    setError('');
  }, [machineDef.type, machineDef.initialState]);

  // ── Notify canvas of current step ────────────────────────────────────────────
  useEffect(() => {
    if (!result || stepIdx < 0) {
      onStepChange({ state: machineDef.initialState, edge: null });
      return;
    }
    const step = result.steps[stepIdx];
    if (!step) return;
    if (step.isInitial) {
      onStepChange({ state: step.currentState, edge: null });
    } else {
      onStepChange({
        state: step.nextState,
        edge: { from: step.currentState, to: step.nextState, input: step.inputSymbol },
      });
    }
  }, [stepIdx, result]); // eslint-disable-line

  // ── Auto-scroll timeline to active step ──────────────────────────────────────
  useEffect(() => {
    if (!timelineRef.current || stepIdx < 0) return;
    const el = timelineRef.current.querySelector(`[data-step="${stepIdx}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [stepIdx]);

  // ── Playback ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing || !result) return;
    if (stepIdx >= result.steps.length - 1) { setPlaying(false); return; }
    const id = setTimeout(() => setStepIdx(p => p + 1), speed);
    return () => clearTimeout(id);
  }, [playing, stepIdx, result, speed]);

  const totalSteps = result?.steps.length ?? 0;
  const isLast = stepIdx === totalSteps - 1;
  const curStep = result?.steps[stepIdx];

  const reset = () => {
    setStepIdx(result ? 0 : -1);
    setPlaying(false);
    onStepChange({ state: machineDef.initialState, edge: null });
  };

  return (
    <div className="flex flex-col border-t border-slate-800 bg-slate-950" style={{ minHeight: 220, maxHeight: 260 }}>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 flex-wrap">

        {/* Input field */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs font-semibold tracking-widest uppercase shrink-0">Input Σ*</span>
          <div className="relative">
            <input
              ref={inputRef}
              value={inputStr}
              onChange={e => setInputStr(e.target.value)}
              placeholder="Type sequence… (e.g. 1010)"
              className="font-mono bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 pr-10 text-violet-300
                placeholder-slate-700 outline-none focus:border-violet-500 transition-all w-52 text-sm"
            />
            {inputStr && (
              <button onClick={() => setInputStr('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors text-xs">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Auto badge */}
        {result && (
          <div className="flex items-center gap-1.5 bg-violet-950/50 border border-violet-800 rounded-lg px-3 py-1.5 text-xs text-violet-300">
            <Zap size={11} />
            Auto-simulated
          </div>
        )}

        {/* Playback controls */}
        {result && (
          <div className="flex items-center gap-1.5">
            <button onClick={reset} title="Restart"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all">
              <RotateCcw size={13} className="text-slate-400" />
            </button>
            <button onClick={() => setStepIdx(p => Math.max(0, p - 1))} disabled={stepIdx <= 0}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all disabled:opacity-30">
              <SkipBack size={13} className="text-slate-300" />
            </button>
            <button onClick={() => setPlaying(p => !p)}
              className={`px-4 py-1.5 rounded-lg font-bold text-sm flex items-center gap-1.5 transition-all
                ${playing ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-green-600 hover:bg-green-500'}`}>
              {playing ? <><Pause size={13} />Pause</> : <><Play size={13} fill="white" />Play</>}
            </button>
            <button onClick={() => setStepIdx(p => Math.min(totalSteps - 1, p + 1))} disabled={isLast}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all disabled:opacity-30">
              <SkipForward size={13} className="text-slate-300" />
            </button>

            {/* Speed */}
            <select value={speed} onChange={e => setSpeed(+e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 text-xs outline-none">
              <option value={1800}>0.5×</option>
              <option value={900}>1×</option>
              <option value={450}>2×</option>
              <option value={200}>4×</option>
            </select>
          </div>
        )}

        {/* Output display */}
        {result && (
          <>
            <div className="h-5 w-px bg-slate-800 mx-1" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 uppercase tracking-widest">Output so far</span>
              <span className="font-mono font-black text-yellow-400 text-xl tracking-widest">
                {curStep?.accumulatedOutput || '—'}
              </span>
            </div>
            {isLast && (
              <div className="flex items-center gap-1.5 animate-fade-in">
                <CheckCircle size={14} className="text-green-400" />
                <span className="text-xs text-green-400 font-semibold">Final:</span>
                <span className="font-mono font-black text-yellow-300 text-lg">{result.finalOutput}</span>
              </div>
            )}
            <span className="ml-auto text-xs text-slate-600 shrink-0">Step {stepIdx + 1} / {totalSteps}</span>
          </>
        )}
      </div>

      {/* ── Error ───────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2 mx-4 mt-3 p-3 bg-red-950/60 border border-red-900/60 rounded-xl text-xs text-red-300 animate-slide-up">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* ── Step Timeline ────────────────────────────────────────── */}
      {result && (
        <div ref={timelineRef}
          className="flex-1 overflow-x-auto px-4 py-2 flex items-center gap-2 animate-fade-in">
          {result.steps.map((step, idx) => {
            const isCurrent = idx === stepIdx;
            const isPast    = idx < stepIdx;
            return (
              <button
                key={idx}
                data-step={idx}
                onClick={() => { setStepIdx(idx); setPlaying(false); }}
                className={`flex flex-col items-center justify-center shrink-0 rounded-xl border px-3 py-2
                  min-w-[88px] text-xs cursor-pointer transition-all
                  ${isCurrent
                    ? 'bg-violet-900/50 border-violet-500 text-violet-100 scale-105 shadow-lg shadow-violet-900/40'
                    : isPast
                      ? 'bg-slate-900/80 border-slate-700 text-slate-500 hover:border-slate-600'
                      : 'bg-slate-950 border-slate-800 text-slate-700 hover:border-slate-700'}`}
              >
                {step.isInitial ? (
                  <>
                    <span className={`font-bold ${isCurrent ? 'text-emerald-300' : 'text-slate-600'}`}>START</span>
                    <span className="text-yellow-400 font-mono">λ={step.outputSymbol}</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1 font-mono">
                      <span className={isCurrent ? 'text-blue-300' : 'text-slate-500'}>{step.currentState}</span>
                      <ChevronRight size={10} className="text-slate-600" />
                      <span className={isCurrent ? 'text-blue-300' : 'text-slate-500'}>{step.nextState}</span>
                    </div>
                    <span className={`text-xl font-black font-mono leading-none ${isCurrent ? 'text-violet-200' : 'text-slate-600'}`}>
                      {step.inputSymbol}
                    </span>
                    <span className="text-yellow-400 font-mono">λ={step.outputSymbol}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Empty hint ────────────────────────────────────────────── */}
      {!result && !error && (
        <div className="flex-1 flex items-center justify-center text-slate-700 text-sm italic">
          {machineDef.states.length === 0
            ? 'Add states and transitions in the panel, then type an input string.'
            : 'Type an input string above — simulation runs automatically.'}
        </div>
      )}
    </div>
  );
}
