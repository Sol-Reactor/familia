import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { useAuthStore } from './stores/authStore'
import './index.css'

// Restore the session synchronously BEFORE the first render so protected
// routes (and deep links) don't bounce through /login.
useAuthStore.getState().initAuth();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
