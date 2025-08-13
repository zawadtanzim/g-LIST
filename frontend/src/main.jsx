import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import './index.css' // ensure this path matches your project

const root = document.getElementById('root')
createRoot(root).render(<App />)

