# Frontend Architecture

The frontend is a single-page application built using React, Vite, and TailwindCSS.

## Core Components
- **Game Context (`GameContext.jsx`):** Manages the global state of the simulation, including player stats, active interviewer, current turn, log history, and victory/defeat criteria.
- **Start Screen (`StartScreen.jsx`):** Allows the player to select their interviewer (Architect, CTO, PM, QA Lead).
- **Arena Screen (`ArenaScreen.jsx`):** The battle dashboard where the interview takes place, featuring HP bars, status indicators, dialog logs, and proposal inputs.

## Key Relationships
- Links to [[index|Overview]]
- Queries the [[backend-architecture|Backend System Architecture]] endpoints.
