import { useState } from 'react';
import { Trash2, Plus, Pencil, Check, X, ChevronRight } from 'lucide-react';

// ─── Shared input component ───────────────────────────────────────────────────
function Inp({ value, onChange, placeholder, mono, color = 'blue', onEnter, onEscape, autoFocus, className = '' }) {
  const ring = { blue: 'focus:border-blue-500', violet: 'focus:border-violet-500', yellow: 'focus:border-yellow-500', emerald: 'focus:border-emerald-500' }[color] ?? 'focus:border-blue-500';
  return (
    <input
      autoFocus={autoFocus}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') onEnter?.(); if (e.key === 'Escape') onEscape?.(); }}
      placeholder={placeholder}
      className={`bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors ${ring} ${mono ? "font-['JetBrains_Mono']" : ''} ${className}`}
    />
  );
}

function Sel({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-blue-500 transition-colors">
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function SectionLabel({ icon, title }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="text-sm leading-none">{icon}</span>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
    </div>
  );
}

// ─── Main ConfigPanel ─────────────────────────────────────────────────────────
// All editing state lives HERE so commitEdit always has fresh machineDef
export default function ConfigPanel({ machineDef, setMachineDef }) {
  const isMealy = machineDef.type === 'mealy';

  // ── "Add state" form state ────────────────────────────────────────────────
  const [newStateName, setNewStateName] = useState('');
  const [newStateLambda, setNewStateLambda] = useState('');

  // ── "Edit state" state   (null = not editing, else the state name string) ─
  const [editingState, setEditingState] = useState(null);
  const [editStateName, setEditStateName] = useState('');
  const [editStateLambda, setEditStateLambda] = useState('');

  // ── "Add transition" form state ───────────────────────────────────────────
  const [tFrom, setTFrom] = useState('');
  const [tTo, setTTo] = useState('');
  const [tIn, setTIn] = useState('');
  const [tOut, setTOut] = useState('');

  // ── "Edit transition" state  (null = not editing, else the index number) ──
  const [editingTIdx, setEditingTIdx] = useState(null);
  const [etFrom, setEtFrom] = useState('');
  const [etTo, setEtTo] = useState('');
  const [etIn, setEtIn] = useState('');
  const [etOut, setEtOut] = useState('');

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const setType = (type) => setMachineDef({ ...machineDef, type });

  // ── State operations ──────────────────────────────────────────────────────
  const addState = () => {
    const s = newStateName.trim();
    if (!s || machineDef.states.includes(s)) return;
    setMachineDef({
      ...machineDef,
      states: [...machineDef.states, s],
      initialState: machineDef.initialState || s,
      mooreOutputs: { ...(machineDef.mooreOutputs ?? {}), [s]: newStateLambda },
    });
    setNewStateName(''); setNewStateLambda('');
  };

  const removeState = (s) => {
    if (editingState === s) setEditingState(null);
    setMachineDef({
      ...machineDef,
      states: machineDef.states.filter(x => x !== s),
      initialState: machineDef.initialState === s ? (machineDef.states.filter(x => x !== s)[0] ?? '') : machineDef.initialState,
      transitions: machineDef.transitions.filter(t => t.from !== s && t.to !== s),
      mooreOutputs: Object.fromEntries(Object.entries(machineDef.mooreOutputs ?? {}).filter(([k]) => k !== s)),
    });
  };

  const beginEditState = (s) => {
    setEditingState(s);
    setEditStateName(s);
    setEditStateLambda(machineDef.mooreOutputs?.[s] ?? '');
    // cancel any transition edit
    setEditingTIdx(null);
  };

  const commitEditState = () => {
    const trimName = editStateName.trim();
    if (!trimName) { setEditingState(null); return; }
    // Duplicate check (but allow same name = just updating lambda)
    if (trimName !== editingState && machineDef.states.includes(trimName)) return;
    const oldName = editingState;
    const rename = s => (s === oldName ? trimName : s);
    setMachineDef({
      ...machineDef,
      states: machineDef.states.map(rename),
      initialState: machineDef.initialState === oldName ? trimName : machineDef.initialState,
      transitions: machineDef.transitions.map(t => ({ ...t, from: rename(t.from), to: rename(t.to) })),
      mooreOutputs: Object.fromEntries(
        Object.entries({ ...(machineDef.mooreOutputs ?? {}), [oldName]: editStateLambda })
          .map(([k, v]) => [rename(k), v])
      ),
    });
    setEditingState(null);
  };

  // ── Transition operations ─────────────────────────────────────────────────
  const addTransition = () => {
    if (!tFrom || !tTo || !tIn) return;
    const t = { from: tFrom, to: tTo, input: tIn };
    if (isMealy) t.output = tOut;
    setMachineDef({ ...machineDef, transitions: [...machineDef.transitions, t] });
    setTIn(''); setTOut('');
  };

  const removeTransition = (i) => {
    if (editingTIdx === i) setEditingTIdx(null);
    const ts = machineDef.transitions.filter((_, idx) => idx !== i);
    setMachineDef({ ...machineDef, transitions: ts });
  };

  const beginEditTransition = (i) => {
    const t = machineDef.transitions[i];
    setEditingTIdx(i);
    setEtFrom(t.from); setEtTo(t.to);
    setEtIn(t.input); setEtOut(t.output ?? '');
    // cancel any state edit
    setEditingState(null);
  };

  const commitEditTransition = () => {
    if (!etFrom || !etTo || !etIn) { setEditingTIdx(null); return; }
    const updated = machineDef.transitions.map((t, i) => {
      if (i !== editingTIdx) return t;
      const nt = { from: etFrom, to: etTo, input: etIn };
      if (isMealy) nt.output = etOut;
      return nt;
    });
    setMachineDef({ ...machineDef, transitions: updated });
    setEditingTIdx(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 p-3 pb-8">

      {/* ── Machine Type ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <SectionLabel icon="⚙️" title="Machine Type" />
        <div className="grid grid-cols-2 gap-2">
          {['mealy', 'moore'].map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`py-2 rounded-xl font-bold border transition-all text-sm
                ${machineDef.type === t
                  ? t === 'mealy' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
              {t === 'mealy' ? '⚡ Mealy' : '🔵 Moore'}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-600 px-1">
          {isMealy ? 'λ = f(state, input) — output on transitions' : 'λ = f(state) — output on states'}
        </p>
      </div>

      <div className="border-t border-slate-800" />

      {/* ── States ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <SectionLabel icon="○" title={`States (${machineDef.states.length})`} />

        {/* State list */}
        <div className="flex flex-col gap-1">
          {machineDef.states.map(s => {
            const isEditing = editingState === s;
            const isStart   = machineDef.initialState === s;

            if (isEditing) {
              return (
                <div key={s} className="flex flex-col gap-1.5 p-2 rounded-lg border border-blue-700/60 bg-blue-950/20">
                  <div className={`flex gap-1.5 ${!isMealy ? 'grid grid-cols-2' : ''}`}>
                    <Inp autoFocus value={editStateName} onChange={setEditStateName}
                      placeholder="State name" mono color="blue"
                      onEnter={commitEditState} onEscape={() => setEditingState(null)}
                      className="w-full" />
                    {!isMealy && (
                      <Inp value={editStateLambda} onChange={setEditStateLambda}
                        placeholder="λ output" mono color="yellow"
                        onEnter={commitEditState} onEscape={() => setEditingState(null)}
                        className="w-full" />
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={commitEditState}
                      className="flex-1 flex items-center justify-center gap-1 py-1 bg-blue-700 hover:bg-blue-600 rounded text-white text-xs font-semibold transition-colors">
                      <Check size={11} /> Save
                    </button>
                    <button onClick={() => setEditingState(null)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-xs font-semibold transition-colors">
                      <X size={11} /> Cancel
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={s}
                className={`group flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs
                  ${isStart ? 'border-emerald-800/70 bg-emerald-950/30' : 'border-slate-800 bg-slate-900'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <button onClick={() => setMachineDef({ ...machineDef, initialState: s })}
                    title="Set as start"
                    className={`shrink-0 w-3.5 h-3.5 rounded-full border-2 transition-all
                      ${isStart ? 'border-emerald-400 bg-emerald-400' : 'border-slate-600 hover:border-emerald-500'}`} />
                  <span className="font-mono font-bold text-blue-400">{s}</span>
                  {isStart && <span className="text-emerald-500">▶ start</span>}
                  {!isMealy && <span className="font-mono text-yellow-500">λ={machineDef.mooreOutputs?.[s] ?? '-'}</span>}
                </div>
                <div className="flex gap-1.5 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => beginEditState(s)} title="Edit state"
                    className="text-slate-500 hover:text-blue-400 transition-colors">
                    <Pencil size={11} />
                  </button>
                  <button onClick={() => removeState(s)} title="Remove"
                    className="text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })}
          {!machineDef.states.length && <p className="text-xs text-slate-700 italic px-1">No states yet.</p>}
        </div>

        {/* Add state form */}
        <div className={`grid gap-2 ${!isMealy ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <Inp value={newStateName} onChange={setNewStateName} placeholder="State name (e.g. q0)"
            mono color="blue" onEnter={addState} className="w-full" />
          {!isMealy && (
            <Inp value={newStateLambda} onChange={setNewStateLambda} placeholder="Output λ"
              mono color="yellow" onEnter={addState} className="w-full" />
          )}
        </div>
        <button onClick={addState}
          className="flex items-center justify-center gap-1.5 py-2 w-full bg-blue-700 hover:bg-blue-600 rounded-xl font-semibold text-white text-xs transition-all">
          <Plus size={13} /> Add State
        </button>
      </div>

      <div className="border-t border-slate-800" />

      {/* ── Transitions ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <SectionLabel icon="→" title={`Transitions (${machineDef.transitions.length})`} />

        {/* Transition list */}
        <div className="flex flex-col gap-1">
          {machineDef.transitions.map((t, i) => {
            const isEditing = editingTIdx === i;

            if (isEditing) {
              return (
                <div key={i} className="flex flex-col gap-1.5 p-2 rounded-lg border border-violet-700/60 bg-violet-950/20">
                  <div className="grid grid-cols-2 gap-1.5">
                    <Sel value={etFrom} onChange={setEtFrom} options={machineDef.states} placeholder="From…" />
                    <Sel value={etTo}   onChange={setEtTo}   options={machineDef.states} placeholder="To…" />
                    <Inp value={etIn}  onChange={setEtIn}  placeholder="Input" mono color="violet"
                      onEnter={commitEditTransition} onEscape={() => setEditingTIdx(null)} className="w-full" />
                    {isMealy && (
                      <Inp value={etOut} onChange={setEtOut} placeholder="Output" mono color="yellow"
                        onEnter={commitEditTransition} onEscape={() => setEditingTIdx(null)} className="w-full" />
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={commitEditTransition}
                      className="flex-1 flex items-center justify-center gap-1 py-1 bg-violet-700 hover:bg-violet-600 rounded text-white text-xs font-semibold transition-colors">
                      <Check size={11} /> Save
                    </button>
                    <button onClick={() => setEditingTIdx(null)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-xs font-semibold transition-colors">
                      <X size={11} /> Cancel
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={i} className="group flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-mono">
                <span className="flex items-center gap-1 min-w-0">
                  <span className="text-blue-400">{t.from}</span>
                  <ChevronRight size={10} className="text-slate-600 shrink-0" />
                  <span className="text-violet-400">{t.input}</span>
                  {isMealy && <><span className="text-slate-600">/</span><span className="text-yellow-400">{t.output}</span></>}
                  <ChevronRight size={10} className="text-slate-600 shrink-0" />
                  <span className="text-blue-400">{t.to}</span>
                </span>
                <div className="flex gap-1.5 items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                  <button onClick={() => beginEditTransition(i)} title="Edit transition"
                    className="text-slate-500 hover:text-violet-400 transition-colors">
                    <Pencil size={11} />
                  </button>
                  <button onClick={() => removeTransition(i)} title="Remove"
                    className="text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })}
          {!machineDef.transitions.length && <p className="text-xs text-slate-700 italic px-1">No transitions yet.</p>}
        </div>

        {/* Add transition form */}
        <div className="grid grid-cols-2 gap-2">
          <Sel value={tFrom} onChange={setTFrom} options={machineDef.states} placeholder="From…" />
          <Sel value={tTo}   onChange={setTTo}   options={machineDef.states} placeholder="To…" />
          <Inp value={tIn}  onChange={setTIn}  placeholder="Input (e.g. 0)"  mono color="violet"
            onEnter={addTransition} className="w-full" />
          {isMealy && (
            <Inp value={tOut} onChange={setTOut} placeholder="Output (e.g. 1)" mono color="yellow"
              onEnter={addTransition} className="w-full" />
          )}
        </div>
        <button onClick={addTransition}
          className={`flex items-center justify-center gap-1.5 py-2 w-full rounded-xl font-semibold text-white text-xs transition-all
            ${isMealy ? 'bg-blue-700 hover:bg-blue-600' : 'bg-emerald-700 hover:bg-emerald-600'}`}>
          <Plus size={13} /> Add Transition
        </button>
      </div>
    </div>
  );
}
