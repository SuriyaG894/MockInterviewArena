import { useEffect } from 'react';
import { useGame } from './context/GameContext.jsx'
import StartScreen from './screens/StartScreen.jsx'
import ArenaScreen from './screens/ArenaScreen.jsx'

function App() {
  const { gameState } = useGame()

  useEffect(() => {
    if (gameState.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [gameState.theme]);

  if (gameState.gameStatus === 'SELECT') {
    return <StartScreen />
  }

  return <ArenaScreen />
}

export default App
