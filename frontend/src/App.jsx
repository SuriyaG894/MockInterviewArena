import { useGame } from './context/GameContext.jsx'
import StartScreen from './screens/StartScreen.jsx'
import ArenaScreen from './screens/ArenaScreen.jsx'

function App() {
  const { gameState } = useGame()

  if (gameState.gameStatus === 'SELECT') {
    return <StartScreen />
  }

  return <ArenaScreen />
}

export default App
