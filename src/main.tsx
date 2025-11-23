import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './components/AuthProvider.tsx'
import App from './App.tsx'
import './main.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster />
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
