import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { SolanaProviders } from './solana/context'
import '@solana/wallet-adapter-react-ui/styles.css'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SolanaProviders>
      <App />
    </SolanaProviders>
  </React.StrictMode>,
)