/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useCallback } from 'react';

const GameContext = createContext(null);

export const initialState = {
  playerHP: 100,
  bossHP: 100,
  gameStatus: 'SELECT',
  selectedBoss: null,
  battleLog: [],
  isProcessing: false,
  currentChallenge: null,
};

export function gameReducer(state, action) {
  switch (action.type) {
    case 'START_TURN':
      return {
        ...state,
        isProcessing: true,
        battleLog: [...state.battleLog, action.payload],
      };

    case 'COMPLETE_TURN': {
      const dialogue = action.payload?.dialogue ?? '';
      const damageTo = action.payload?.damageTo ?? null;
      const damageAmount = Math.max(0, action.payload?.damageAmount ?? 0);

      let playerHP = state.playerHP;
      let bossHP = state.bossHP;

      if (damageTo === 'player') {
        playerHP = Math.max(0, playerHP - damageAmount);
      } else if (damageTo === 'boss') {
        bossHP = Math.max(0, bossHP - damageAmount);
      }

      const gameOver = playerHP <= 0 || bossHP <= 0;

      return {
        ...state,
        playerHP,
        bossHP,
        gameStatus: gameOver ? 'GAMEOVER' : state.gameStatus,
        battleLog: [...state.battleLog, { sender: 'boss', text: dialogue }],
        isProcessing: false,
      };
    }

    case 'SET_BOSS': {
      const welcomeEntry = action.welcomeMessage
        ? { sender: 'boss', text: action.welcomeMessage }
        : null;
      return {
        ...state,
        selectedBoss: action.payload ?? null,
        gameStatus: action.payload ? 'COMBAT' : 'SELECT',
        currentChallenge: action.challenge ?? null,
        battleLog: welcomeEntry
          ? [...state.battleLog, welcomeEntry]
          : state.battleLog,
      };
    }

    case 'RESET':
      return { ...initialState };

    case 'SET_ERROR':
      return {
        ...state,
        isProcessing: false,
        battleLog: action.errorLogEntry
          ? [...state.battleLog, action.errorLogEntry]
          : state.battleLog,
      };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [gameState, dispatch] = useReducer(gameReducer, initialState);

  const dispatchTurn = useCallback(async (userAnswer) => {
    if (!userAnswer || typeof userAnswer !== 'string') {
      dispatch({
        type: 'SET_ERROR',
        errorLogEntry: {
          sender: 'boss',
          text: '[System Connection Error: The arena communication array fluctuated. Re-submit your answer.]',
        },
      });
      return;
    }

    dispatch({
      type: 'START_TURN',
      payload: { sender: 'player', text: userAnswer },
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('http://localhost:5000/api/battle/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bossId: gameState.selectedBoss,
          userResponse: userAnswer,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      dispatch({
        type: 'COMPLETE_TURN',
        payload: {
          dialogue: data.dialogue,
          damageTo: data.damageTo,
          damageAmount: data.damageAmount,
        },
      });
    } catch {
      dispatch({
        type: 'SET_ERROR',
        errorLogEntry: {
          sender: 'boss',
          text: '[System Connection Error: The arena communication array fluctuated. Re-submit your answer.]',
        },
      });
    }
  }, [gameState.selectedBoss]);

  const value = { gameState, dispatchTurn, dispatch };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return ctx;
}
