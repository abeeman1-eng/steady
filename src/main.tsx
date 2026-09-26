import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { ensureExerciseSeed } from './data/repositories/exerciseRepo'
import './index.css'

const root = createRoot(document.getElementById('root')!)

ensureExerciseSeed()
  .then(() =>
    root.render(
      <StrictMode>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
        </BrowserRouter>
      </StrictMode>,
    ),
  )
  .catch((err: unknown) => {
    console.error(err)
    root.render(
      <main style={{ padding: 24, fontFamily: 'system-ui', color: '#eef0f3' }}>
        <h1>Steady can’t open its storage</h1>
        <p>This browser may be blocking site storage (for example in some private modes). Try a regular window.</p>
      </main>,
    )
  })
