// ─── Default Example Machines ─────────────────────────────────────────────────

export const MEALY_EXAMPLE = {
  type: 'mealy',
  states: ['q0', 'q1', 'q2'],
  initialState: 'q0',
  mooreOutputs: {},
  transitions: [
    { from: 'q0', to: 'q0', input: '0', output: '0' },
    { from: 'q0', to: 'q1', input: '1', output: '0' },
    { from: 'q1', to: 'q2', input: '0', output: '1' },
    { from: 'q1', to: 'q1', input: '1', output: '0' },
    { from: 'q2', to: 'q0', input: '0', output: '0' },
    { from: 'q2', to: 'q1', input: '1', output: '0' },
  ],
};

export const MOORE_EXAMPLE = {
  type: 'moore',
  states: ['q0', 'q1', 'q2'],
  initialState: 'q0',
  mooreOutputs: { q0: '0', q1: '0', q2: '1' },
  transitions: [
    { from: 'q0', to: 'q0', input: '0' },
    { from: 'q0', to: 'q1', input: '1' },
    { from: 'q1', to: 'q2', input: '0' },
    { from: 'q1', to: 'q1', input: '1' },
    { from: 'q2', to: 'q0', input: '0' },
    { from: 'q2', to: 'q1', input: '1' },
  ],
};

export const EMPTY_MACHINE = {
  type: 'mealy',
  states: [],
  initialState: '',
  mooreOutputs: {},
  transitions: [],
};

// ─── API helpers ───────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:3001';

export async function simulateMachine(machineDef, inputString) {
  const res = await fetch(`${API_BASE}/api/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...machineDef, inputString }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Simulation failed');
  return data;
}
