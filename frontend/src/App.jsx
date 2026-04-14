import { useState, useCallback } from 'react';
import ConfigPanel from './components/ConfigPanel';
import MachineCanvas from './components/MachineCanvas';
import SimulatorPanel from './components/SimulatorPanel';
import { MEALY_EXAMPLE, MOORE_EXAMPLE } from './lib/machines';

export default function App() {
  const [machine, setMachine] = useState(MEALY_EXAMPLE);
  const [activeState, setActiveState] = useState(MEALY_EXAMPLE.initialState);
  const [highlightEdge, setHighlightEdge] = useState(null);

  // Stable callback — must not change reference to avoid infinite useEffect loops
  const handleStepChange = useCallback(({ state, edge }) => {
    setActiveState(state);
    setHighlightEdge(edge);
  }, []);

  const handleSetMachine = (def) => {
    setMachine(def);
    if (!def.states?.includes(activeState)) {
      setActiveState(def.initialState || null);
      setHighlightEdge(null);
    }
  };

  const loadExample = (type) => {
    const def = type === 'mealy' ? MEALY_EXAMPLE : MOORE_EXAMPLE;
    setMachine(def);
    setActiveState(def.initialState);
    setHighlightEdge(null);
  };

  const isMealy = machine.type === 'mealy';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ═══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3 z-20"
        style={{
          background: 'linear-gradient(90deg, #020817 0%, #0a1628 100%)',
          borderBottom: '1px solid #0f2044',
        }}>

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            ⚙
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none"
              style={{ background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #34d399)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              AutomataSim
            </h1>
            <p className="text-xs text-slate-600 leading-none mt-0.5">Mealy vs Moore Machine Simulator</p>
          </div>
        </div>

        {/* Centre: machine type badge */}
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold
          ${isMealy
            ? 'border-blue-800 bg-blue-950/50 text-blue-300'
            : 'border-emerald-800 bg-emerald-950/50 text-emerald-300'}`}>
          <span className="text-base">{isMealy ? '⚡' : '🔵'}</span>
          {isMealy ? 'Mealy Machine' : 'Moore Machine'} Active
        </div>

        {/* Examples */}
        <div className="flex gap-2">
          <button onClick={() => loadExample('mealy')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border transition-all
              border-blue-800 bg-blue-950/40 text-blue-300 hover:bg-blue-900/60 hover:border-blue-600">
            ⚡ Mealy Example
          </button>
          <button onClick={() => loadExample('moore')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border transition-all
              border-emerald-800 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 hover:border-emerald-600">
            🔵 Moore Example
          </button>
        </div>
      </header>

      {/* ═══ BODY ════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden" style={{ background: '#05081a' }}>

        {/* ── Left: Config Panel ───────────────────────────────────────────── */}
        <aside className="shrink-0 flex flex-col overflow-hidden"
          style={{ width: 280, borderRight: '1px solid #0f2044', background: '#030712' }}>

          {/* Panel header */}
          <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid #0f2044' }}>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Machine Definition</h2>
          </div>

          {/* Scrollable config area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <ConfigPanel machineDef={machine} setMachineDef={handleSetMachine} />
          </div>
        </aside>

        {/* ── Centre: Canvas + simulation ──────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Canvas legend */}
          <div className="shrink-0 flex items-center gap-4 px-4 py-2"
            style={{ borderBottom: '1px solid #0a1628', background: '#03060e' }}>
            <span className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 inline-block" />
              Start state
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-blue-400 inline-block" style={{ boxShadow:'0 0 6px #60a5fa' }} />
              Active state
            </span>
            {isMealy
              ? <span className="text-xs text-slate-600">Edge labels: <span className="font-mono text-blue-400">input</span>/<span className="font-mono text-yellow-400">output</span></span>
              : <span className="text-xs text-slate-600">Edge labels: <span className="font-mono text-violet-400">input</span> | State output: <span className="font-mono text-yellow-400">λ=value</span></span>}
            <span className="ml-auto text-xs text-slate-700 font-mono">{machine.states.length} states · {machine.transitions.length} transitions</span>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden">
            {machine.states.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-700">
                <div className="text-5xl opacity-30">⚙️</div>
                <p className="text-sm">Add states to get started, or load an example.</p>
              </div>
            ) : (
              <MachineCanvas
                machineDef={machine}
                activeState={activeState}
                highlightEdge={highlightEdge}
              />
            )}
          </div>

          {/* Simulation Panel */}
          <SimulatorPanel machineDef={machine} onStepChange={handleStepChange} />
        </div>

        {/* ── Right: Theory Panel ─────────────────────────────────────────── */}
        <aside className="shrink-0 overflow-y-auto p-4 flex flex-col gap-4 text-xs"
          style={{ width: 220, borderLeft: '1px solid #0f2044', background: '#03060e' }}>
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Theory</h3>

            <div className={`p-3 rounded-xl border mb-3 ${isMealy ? 'border-blue-800/60 bg-blue-950/20' : 'border-slate-800 bg-slate-900/20'}`}>
              <p className="font-bold text-blue-400 mb-1">⚡ Mealy Machine</p>
              <p className="text-slate-500 leading-relaxed">Output is a function of the <em>current state</em> and the <em>current input</em>.</p>
              <code className="block mt-2 text-blue-300 bg-slate-900 px-2 py-1 rounded">λ = f(q, σ)</code>
              <p className="text-slate-600 mt-2">Output length = input length.</p>
            </div>

            <div className={`p-3 rounded-xl border ${!isMealy ? 'border-emerald-800/60 bg-emerald-950/20' : 'border-slate-800 bg-slate-900/20'}`}>
              <p className="font-bold text-emerald-400 mb-1">🔵 Moore Machine</p>
              <p className="text-slate-500 leading-relaxed">Output is a function of the <em>current state only</em>.</p>
              <code className="block mt-2 text-emerald-300 bg-slate-900 px-2 py-1 rounded">λ = f(q)</code>
              <p className="text-slate-600 mt-2">Output length = input length + 1.</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Guide</h3>
            <ol className="text-slate-600 flex flex-col gap-2 leading-relaxed list-none">
              {['Select Mealy or Moore', 'Add states (set one as start)', 'Add transitions', 'Type input → auto-simulates', 'Use timeline to step through'].map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center font-bold" style={{ fontSize:9 }}>{i+1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
