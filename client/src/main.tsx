import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './store'
import { api } from './services/api'
import App from './App'
import './index.css'

// Sync token to API client after rehydration
const onBeforeLift = () => {
  const state = store.getState()
  const token = state.auth?.token
  if (token) {
    api.setAccessToken(token)
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor} onBeforeLift={onBeforeLift}>
        <App />
      </PersistGate>
    </Provider>
  </React.StrictMode>
)
