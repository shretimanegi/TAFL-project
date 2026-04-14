import {
  Handle, Position,
  BaseEdge, EdgeLabelRenderer, getBezierPath,
  ReactFlow, useNodesState, useEdgesState,
  Controls, Background, MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useCallback } from 'react';

// ─── State Node (circle) ──────────────────────────────────────────────────────
function StateNode({ data }) {
  const { stateName, isStart, isActive, mooreOutput } = data;

  return (
    <div style={{ position: 'relative', width: 88, height: 88 }}>
      {/* Invisible handles so React Flow can route edges */}
      {['top','bottom','left','right'].map(pos => (
        ['source','target'].map(type => (
          <Handle key={`${pos}-${type}`} type={type} position={Position[pos.charAt(0).toUpperCase() + pos.slice(1)]} style={{ opacity: 0, width: 1, height: 1 }} />
        ))
      ))}

      {/* Start arrow */}
      {isStart && (
        <div style={{ position:'absolute', top:-28, left:'50%', transform:'translateX(-50%)', color:'#34d399', fontSize:20 }}>
          ▼
        </div>
      )}

      {/* Circle */}
      <div
        className={isActive ? 'glow-active' : ''}
        style={{
          width: 88, height: 88, borderRadius: '50%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 15, fontWeight: 700,
          background: isActive
            ? 'radial-gradient(circle at 38% 32%, #1d4ed8 0%, #0f172a 70%)'
            : isStart
              ? 'radial-gradient(circle at 38% 32%, #064e3b 0%, #0f172a 70%)'
              : '#0f172a',
          border: isActive
            ? '2.5px solid #60a5fa'
            : isStart
              ? '2.5px solid #34d399'
              : '2px solid #334155',
          color: isActive ? '#bfdbfe' : '#e2e8f0',
          transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        <span>{stateName}</span>
        {mooreOutput !== undefined && (
          <span style={{ fontSize:10, color:'#fbbf24', marginTop:3,
            background:'rgba(251,191,36,0.1)', borderRadius: 4, padding:'1px 5px' }}>
            λ={mooreOutput}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Self-loop Edge ────────────────────────────────────────────────────────────
function SelfLoopEdge({ id, sourceX, sourceY, label, style, markerEnd, data }) {
  const r = 52;
  const d = `M ${sourceX} ${sourceY-44} C ${sourceX-r*1.7} ${sourceY-44-r*2.1}, ${sourceX+r*1.7} ${sourceY-44-r*2.1}, ${sourceX} ${sourceY-44}`;
  const ly = sourceY - 44 - r*2.1 - 14;
  return (
    <>
      <path id={id} d={d} style={style} markerEnd={markerEnd} fill="none" strokeLinecap="round" />
      <EdgeLabelRenderer>
        <EdgeLabel x={sourceX} y={ly} label={label} isActive={data?.isActive} />
      </EdgeLabelRenderer>
    </>
  );
}

// ─── Bezier Edge ───────────────────────────────────────────────────────────────
function LabeledEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, style, markerEnd, data }) {
  const [path, lx, ly] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, curvature: data?.curvature ?? 0.25 });
  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <EdgeLabel x={lx} y={ly} label={label} isActive={data?.isActive} />
      </EdgeLabelRenderer>
    </>
  );
}

function EdgeLabel({ x, y, label, isActive }) {
  return (
    <div className="nodrag nopan" style={{
      position:'absolute',
      transform: `translate(-50%,-50%) translate(${x}px,${y}px)`,
      background: isActive ? 'rgba(239,68,68,0.15)' : 'rgba(2,6,23,0.9)',
      border: `1px solid ${isActive ? '#ef4444' : '#1e3a5f'}`,
      color: isActive ? '#f87171' : '#7dd3fc',
      padding: '2px 8px', borderRadius: 6,
      fontSize: 11, fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace",
      pointerEvents: 'none', whiteSpace:'nowrap',
    }}>
      {label}
    </div>
  );
}

// ─── Module-level types (must not be inside component) ────────────────────────
const NODE_TYPES = { stateNode: StateNode };
const EDGE_TYPES = { selfLoop: SelfLoopEdge, labeled: LabeledEdge };

// ─── Layout: arrange states in a circle ───────────────────────────────────────
function circleLayout(states) {
  if (!states.length) return {};
  if (states.length === 1) return { [states[0]]: { x: 200, y: 160 } };
  const cx = 250, cy = 200, r = Math.max(110, states.length * 55);
  return Object.fromEntries(states.map((s, i) => {
    const a = (2 * Math.PI * i) / states.length - Math.PI / 2;
    return [s, { x: cx + r * Math.cos(a) - 44, y: cy + r * Math.sin(a) - 44 }];
  }));
}

// ─── Canvas Component ─────────────────────────────────────────────────────────
export default function MachineCanvas({ machineDef, activeState, highlightEdge }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const buildGraph = useCallback(() => {
    if (!machineDef?.states?.length) { setNodes([]); setEdges([]); return; }
    const pos = circleLayout(machineDef.states);

    setNodes(machineDef.states.map(s => ({
      id: s, type: 'stateNode', position: pos[s],
      data: {
        stateName: s,
        isStart: s === machineDef.initialState,
        isActive: s === activeState,
        mooreOutput: machineDef.type === 'moore' ? (machineDef.mooreOutputs?.[s] ?? '-') : undefined,
      },
    })));

    // Group transitions by from→to
    const pairs = {};
    machineDef.transitions.forEach(t => {
      const k = `${t.from}|||${t.to}`;
      (pairs[k] ||= []).push(t);
    });

    setEdges(Object.entries(pairs).map(([key, trans]) => {
      const [from, to] = key.split('|||');
      const isSelf = from === to;
      const isActive = !!highlightEdge && highlightEdge.from === from && highlightEdge.to === to && trans.some(t => t.input === highlightEdge.input);
      const label = trans.map(t => machineDef.type === 'mealy' ? `${t.input}/${t.output}` : t.input).join(', ');
      const stroke = isActive ? '#ef4444' : '#334155';
      return {
        id: `e-${from}-${to}`,
        source: from, target: to,
        type: isSelf ? 'selfLoop' : 'labeled',
        label,
        animated: isActive,
        style: { stroke, strokeWidth: isActive ? 2.5 : 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 16, height: 16 },
        // All regular edges use a gentle 0.2 curvature—no bidirectional exaggeration
        data: { isActive, curvature: 0.2 },
      };
    }));
  }, [machineDef, activeState, highlightEdge, setNodes, setEdges]);

  useEffect(() => { buildGraph(); }, [buildGraph]);

  return (
    <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
      nodeTypes={NODE_TYPES} edgeTypes={EDGE_TYPES}
      fitView fitViewOptions={{ padding: 0.3, maxZoom: 1.4 }}
      proOptions={{ hideAttribution: true }} minZoom={0.2} maxZoom={2.5}
    >
      <Controls style={{ background:'#0f172a', border:'1px solid #1e293b', borderRadius:8 }} />
      <Background color="#0a1628" gap={28} size={1.2} variant="dots" />
    </ReactFlow>
  );
}
