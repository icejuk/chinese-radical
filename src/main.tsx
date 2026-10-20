import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PwaUpdate } from './features/bloom/PwaUpdate'
import { ExperienceRoot } from './ExperienceRoot'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/screens.css'
import './styles/v2.css'
import './features/bloom/bloom.css'
import './features/bloom/orbit.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ExperienceRoot />
    <PwaUpdate />
  </StrictMode>,
)
