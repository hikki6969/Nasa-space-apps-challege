import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ApiProvider, createApiClient } from './api'

const apiHandle = createApiClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApiProvider handle={apiHandle}>
      <App />
    </ApiProvider>
  </StrictMode>,
)
