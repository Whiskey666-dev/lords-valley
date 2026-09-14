import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App'

/**
 * Sello del bundle (diagnóstico): si el panel no refleja saciedad, ejecuta
 * `window.__LV_BUILD__` en la consola del navegador (F12). Debe responder
 * "satiety-panel-v3". Si falta o es otro valor, la pestaña corre un bundle
 * viejo: recarga con Ctrl+Shift+R.
 */
(window as any).__LV_BUILD__ = 'satiety-panel-v3';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
