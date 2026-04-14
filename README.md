# Mealy vs Moore Machine Simulator

An interactive web-based simulator for visualizing, configuring, and executing Mealy and Moore automata. Built as a dual-tier full-stack application (React front-end + Node.js backend).

## Features
- **Configurable States & Transitions**: Interactive configuration panel to build any custom Mealy or Moore machine. Toggle effortlessly between machine types.
- **Real-time Canvas**: Graph-based node and edge visualization utilizing React Flow. State transitions and outputs are dynamically animated.
- **Trace Simulator**: Input a sequence string to see a step-by-step trace of state changes and outputs. Includes playback controls (Play, Pause, Step backward, Step forward).
- **Backend Node.js SDK**: Handles simulation logic in a decoupled Express backend (`/api/simulate`). Allows theoretical computer science environments to rely strictly on backend evaluation.

## Project Structure
- `/frontend`: Vite + React + TailwindCSS + React Flow application.
- `/backend`: Node.js + Express backend application.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm

### 1. Starting the Backend Server
```bash
cd backend
npm install
node index.js
```
The backend server runs strictly on port `3001`.

### 2. Starting the Frontend App
```bash
cd frontend
npm install
npm run dev
```
Vite will launch the local development server (typically `http://localhost:5173`).

## Theory: Mealy vs Moore
**Mealy Machine**: The output is determined by its current state *and* its current input. The output sequence length is equal to the input sequence length.
**Moore Machine**: The output is determined solely by its current state. The output sequence is inherently 1 step longer than the input sequence due to the initial state generating an associated trace character before reading sequence input.
