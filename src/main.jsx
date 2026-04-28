import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'system-ui', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Une erreur est survenue</div>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>{this.state.error.message}</div>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ccc', cursor: 'pointer', fontWeight: 600 }}>
            Recharger l'app
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const root = createRoot(document.getElementById('root'))
root.render(<ErrorBoundary><App/></ErrorBoundary>)
