import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './App'
import { AuthProvider } from './context/AuthContext'
import { HouseholdProvider } from './context/HouseholdContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <HouseholdProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </HouseholdProvider>
    </AuthProvider>
  </StrictMode>,
)
