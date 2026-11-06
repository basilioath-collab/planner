import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import V5 from './V5.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <V5 />
  </StrictMode>,
)
