const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/**
 * POST /api/simulate
 * Simulates a Mealy or Moore machine step by step.
 *
 * Body: { type, states, initialState, transitions, mooreOutputs, inputString }
 * Returns: { steps, finalOutput, finalState }
 */
app.post('/api/simulate', (req, res) => {
  const { type, states, initialState, transitions = [], inputString = '', mooreOutputs = {} } = req.body;

  if (!initialState) {
    return res.status(400).json({ error: 'No initial state defined.' });
  }
  if (!states || states.length === 0) {
    return res.status(400).json({ error: 'No states defined.' });
  }

  let currentState = initialState;
  const steps = [];
  let finalOutput = '';

  // Moore: emit output for initial state before reading any input
  if (type === 'moore') {
    const initOut = mooreOutputs[initialState] ?? '';
    finalOutput += initOut;
    steps.push({
      step: 0,
      currentState: initialState,
      inputSymbol: '',
      nextState: initialState,
      outputSymbol: initOut,
      accumulatedOutput: finalOutput,
      isInitial: true,
    });
  }

  for (let i = 0; i < inputString.length; i++) {
    const sym = inputString[i];
    const transition = transitions.find(t => t.from === currentState && t.input === sym);

    if (!transition) {
      return res.status(400).json({
        error: `No transition from state "${currentState}" on input "${sym}" (step ${i + 1}).`,
      });
    }

    const prev = currentState;
    currentState = transition.to;

    const outSym = type === 'moore'
      ? (mooreOutputs[currentState] ?? '')
      : (transition.output ?? '');

    finalOutput += outSym;

    steps.push({
      step: i + 1,
      currentState: prev,
      inputSymbol: sym,
      nextState: currentState,
      outputSymbol: outSym,
      accumulatedOutput: finalOutput,
    });
  }

  res.json({ steps, finalOutput, finalState: currentState });
});

app.listen(PORT, () => console.log(`✅ AutomataSim backend running on http://localhost:${PORT}`));
