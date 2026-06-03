import { describe, it, expect } from 'vitest';
import { gameReducer, initialState } from './GameContext.jsx';

describe('GameContext - gameReducer State Transitions', () => {
  it('should initialize with initial state', () => {
    expect(initialState).toEqual({
      playerHP: 100,
      bossHP: 100,
      gameStatus: 'SELECT',
      selectedBoss: null,
      battleLog: [],
      isProcessing: false,
      currentChallenge: null,
      difficulty: 'medium',
    });
  });

  it('should transition to combat and set boss and challenge (SET_BOSS)', () => {
    const action = {
      type: 'SET_BOSS',
      payload: 'qa',
      welcomeMessage: 'Welcome to QA testing...',
      challenge: 'Design a load test...',
    };

    const nextState = gameReducer(initialState, action);

    expect(nextState.selectedBoss).toBe('qa');
    expect(nextState.gameStatus).toBe('COMBAT');
    expect(nextState.currentChallenge).toBe('Design a load test...');
    expect(nextState.battleLog).toEqual([
      { sender: 'boss', text: 'Welcome to QA testing...' },
    ]);
  });

  it('should start turn and enable processing spinner (START_TURN)', () => {
    const state = {
      ...initialState,
      selectedBoss: 'qa',
      gameStatus: 'COMBAT',
    };

    const action = {
      type: 'START_TURN',
      payload: { sender: 'player', text: 'My response' },
    };

    const nextState = gameReducer(state, action);

    expect(nextState.isProcessing).toBe(true);
    expect(nextState.battleLog).toEqual([
      { sender: 'player', text: 'My response' },
    ]);
  });

  it('should deduct player HP when damageTo is player (COMPLETE_TURN) [TC-FN-10]', () => {
    const state = {
      ...initialState,
      playerHP: 100,
      bossHP: 100,
      isProcessing: true,
      gameStatus: 'COMBAT',
    };

    const action = {
      type: 'COMPLETE_TURN',
      payload: {
        dialogue: 'You missed security checks.',
        damageTo: 'player',
        damageAmount: 20,
      },
    };

    const nextState = gameReducer(state, action);

    expect(nextState.playerHP).toBe(80);
    expect(nextState.bossHP).toBe(100);
    expect(nextState.isProcessing).toBe(false);
    expect(nextState.battleLog).toEqual([
      { sender: 'boss', text: 'You missed security checks.' },
    ]);
  });

  it('should deduct boss HP when damageTo is boss (COMPLETE_TURN) [TC-FN-11]', () => {
    const state = {
      ...initialState,
      playerHP: 100,
      bossHP: 100,
      isProcessing: true,
      gameStatus: 'COMBAT',
    };

    const action = {
      type: 'COMPLETE_TURN',
      payload: {
        dialogue: 'Outstanding work.',
        damageTo: 'boss',
        damageAmount: 30,
      },
    };

    const nextState = gameReducer(state, action);

    expect(nextState.bossHP).toBe(70);
    expect(nextState.playerHP).toBe(100);
    expect(nextState.gameStatus).toBe('COMBAT');
  });

  it('should keep scores unchanged on neutral response (COMPLETE_TURN) [TC-FN-12]', () => {
    const state = {
      ...initialState,
      playerHP: 100,
      bossHP: 100,
      isProcessing: true,
      gameStatus: 'COMBAT',
    };

    const action = {
      type: 'COMPLETE_TURN',
      payload: {
        dialogue: 'Keep going.',
        damageTo: 'none',
        damageAmount: 0,
      },
    };

    const nextState = gameReducer(state, action);

    expect(nextState.playerHP).toBe(100);
    expect(nextState.bossHP).toBe(100);
  });

  it('should trigger GAMEOVER when boss HP reaches 0 (COMPLETE_TURN) [TC-FN-13]', () => {
    const state = {
      ...initialState,
      playerHP: 85,
      bossHP: 15,
      isProcessing: true,
      gameStatus: 'COMBAT',
    };

    const action = {
      type: 'COMPLETE_TURN',
      payload: {
        dialogue: 'You defeated me!',
        damageTo: 'boss',
        damageAmount: 15,
      },
    };

    const nextState = gameReducer(state, action);

    expect(nextState.bossHP).toBe(0);
    expect(nextState.gameStatus).toBe('GAMEOVER');
  });

  it('should trigger GAMEOVER when player HP reaches 0 (COMPLETE_TURN) [TC-FN-14]', () => {
    const state = {
      ...initialState,
      playerHP: 20,
      bossHP: 100,
      isProcessing: true,
      gameStatus: 'COMBAT',
    };

    const action = {
      type: 'COMPLETE_TURN',
      payload: {
        dialogue: 'You failed the interview.',
        damageTo: 'player',
        damageAmount: 20,
      },
    };

    const nextState = gameReducer(state, action);

    expect(nextState.playerHP).toBe(0);
    expect(nextState.gameStatus).toBe('GAMEOVER');
  });

  it('should reset back to initial state (RESET) [TC-FN-16]', () => {
    const state = {
      playerHP: 0,
      bossHP: 50,
      gameStatus: 'GAMEOVER',
      selectedBoss: 'qa',
      battleLog: [{ sender: 'player', text: 'response' }],
      isProcessing: false,
      currentChallenge: 'A challenge',
    };

    const nextState = gameReducer(state, { type: 'RESET' });

    expect(nextState).toEqual(initialState);
  });

  it('should set difficulty level (SET_DIFFICULTY)', () => {
    const action = { type: 'SET_DIFFICULTY', payload: 'hard' };
    const nextState = gameReducer(initialState, action);
    expect(nextState.difficulty).toBe('hard');
  });
});
