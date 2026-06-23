import React from 'react'

import ReactDOM from 'react-dom/client'

import App from './App.jsx'

import { TooltipProvider } from '@/components/ui/tooltip'

import { applyUiVariant } from './constants/uiVariant'

import './index.css'

applyUiVariant()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </React.StrictMode>,
)
