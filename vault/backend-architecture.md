# Backend Architecture

The backend of the Mock Interview Arena serves as the orchestrator for the AI interviewer.

## Core Components
- **Express Server (`index.js`):** Exposes REST API endpoints for starting the simulation, executing turns, and retrieving final evaluations.
- **Interviewer Agent (`agent.js`):** Holds the prompt templates, manages conversation state, assesses player responses, and computes HP damage based on answer quality.
- **LLM Provider (`llmProvider.js`):** Integrates with Google's Gemini models (via Google Gen AI SDK) to feed prompts and return structured evaluation responses.

## Key Relationships
- Links to [[index|Overview]]
- Interacts with [[frontend-architecture|Frontend App]] to exchange user proposals and turn evaluations.
