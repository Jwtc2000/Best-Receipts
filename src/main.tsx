import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import UpdateBanner from './components/UpdateBanner'
import StorageWarning from './components/StorageWarning'
import GlobalErrorToast from './components/GlobalErrorToast'
import './styles.css'

// StorageWarning requests durable storage (navigator.storage.persist) on mount
// and, if it isn't granted and the user has data, warns about the eviction risk.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <StorageWarning />
    <UpdateBanner />
    <GlobalErrorToast />
  </React.StrictMode>,
)
