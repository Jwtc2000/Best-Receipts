import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles.css'

registerSW({ immediate: true })

// Ask the OS to mark this app's storage (reports + receipt images in
// IndexedDB) as persistent so it is never evicted under storage pressure.
if (navigator.storage?.persist) {
  navigator.storage.persist().then((granted) => {
    if (!granted) {
      console.info('Persistent storage not granted yet — install the app to your home screen to strengthen the guarantee.')
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
