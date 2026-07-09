import { useState, useEffect } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'


interface User {
  id: string
  name: string
  email: string
  password?: string
}

interface LogEntry {
  id: string
  time: string
  method: string
  url: string
  status: number | string
  payload?: string
  response?: string
}

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('portal_api_key') || '')
  const [isKeySaved, setIsKeySaved] = useState(() => !!localStorage.getItem('portal_api_key'))
  const [users, setUsers] = useState<User[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [showLogs, setShowLogs] = useState(false)

  const addLog = (method: string, url: string, status: number | string, payload?: any, response?: any) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString(),
      method,
      url,
      status,
      payload: payload ? JSON.stringify(payload, null, 2) : undefined,
      response: response ? JSON.stringify(response, null, 2) : undefined,
    }
    setLogs((prev) => [newLog, ...prev])
  }

  const fetchUsers = async (keyToUse = apiKey) => {
    if (!keyToUse) return
    setIsLoading(true)
    setError(null)
    const url = `${API_BASE_URL}/users`
    try {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${keyToUse}`,
          'Accept': 'application/json',
        }
      })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      setUsers(data)
      addLog('GET', url, res.status, null, data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users')
      addLog('GET', url, 'ERROR', null, err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const savedKey = localStorage.getItem('portal_api_key')
    if (savedKey) {
      setApiKey(savedKey)
      setIsKeySaved(true)
      fetchUsers(savedKey)
    }
  }, [])

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedKey = apiKey.trim()
    if (trimmedKey) {
      localStorage.setItem('portal_api_key', trimmedKey)
      setIsKeySaved(true)
      fetchUsers(trimmedKey)
    }
  }

  const handleDisconnect = () => {
    localStorage.removeItem('portal_api_key')
    setApiKey('')
    setIsKeySaved(false)
    setUsers([])
    setLogs([])
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) return
    setIsLoading(true)
    setError(null)
    const url = `${API_BASE_URL}/users`
    const payload = { name, email, password }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      addLog('POST', url, res.status, payload, data)
      setName('')
      setEmail('')
      setPassword('')
      fetchUsers()
    } catch (err: any) {
      setError(err.message || 'Failed to create user')
      addLog('POST', url, 'ERROR', payload, err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    setIsLoading(true)
    setError(null)
    const url = `${API_BASE_URL}/users/${id}`
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const data = await res.json()
      addLog('DELETE', url, res.status, null, data)
      fetchUsers()
    } catch (err: any) {
      setError(err.message || 'Failed to delete user')
      addLog('DELETE', url, 'ERROR', null, err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const nameMatch = user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const emailMatch = user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    return nameMatch || emailMatch
  })

  return (
    <div className="portal-container">
      <header className="portal-header">
        <h1>User Portal</h1>
        {isKeySaved && (
          <div className="api-badge">
            <span className="api-status">Connected</span>
            <button onClick={handleDisconnect} className="btn-disconnect">Disconnect</button>
          </div>
        )}
      </header>

      {!isKeySaved ? (
        <div className="key-setup-card">
          <p>Please enter an API Key to connect to the user database.</p>
          <form onSubmit={handleSaveKey} className="key-form">
            <input
              type="text"
              placeholder="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary">Connect</button>
          </form>
        </div>
      ) : (
        <div className="portal-grid">
          <div className="left-panel">
            <div className="card">
              <h2>Create User</h2>
              <form onSubmit={handleCreateUser} className="form-container">
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Create'}
                </button>
              </form>
            </div>

            <div className="console-toggle-container">
              {!showLogs ? (
                <button
                  onClick={() => setShowLogs(true)}
                  className="btn-secondary toggle-logs-btn"
                  style={{ width: '100%' }}
                >
                  Show API Logs
                </button>
              ) : (
                <div className="card console-card">
                  <div className="card-header-row">
                    <h2>API Logs</h2>
                    <button
                      onClick={() => setShowLogs(false)}
                      className="btn-secondary"
                    >
                      Hide Logs
                    </button>
                  </div>
                  <div className="console-log-list">
                    {logs.length === 0 ? (
                      <p className="no-logs">No API logs yet.</p>
                    ) : (
                      logs.map((log) => (
                        <div key={log.id} className="log-entry">
                          <div className="log-summary">
                            <span className="log-time">[{log.time}]</span>
                            <span className="log-method">{log.method}</span>
                            <span className="log-url">{log.url}</span>
                            <span className="log-status">({log.status})</span>
                          </div>
                          {log.payload && (
                            <details className="log-details">
                              <summary>Payload</summary>
                              <pre>{log.payload}</pre>
                            </details>
                          )}
                          {log.response && (
                            <details className="log-details">
                              <summary>Response</summary>
                              <pre>{log.response}</pre>
                            </details>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="right-panel">
            <div className="card user-list-card">
              <div className="card-header-row">
                <h2>Users ({filteredUsers.length})</h2>
                <button onClick={() => fetchUsers()} className="btn-secondary" disabled={isLoading}>
                  Refresh
                </button>
              </div>

              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />

              {error && <div className="error-message">{error}</div>}

              {isLoading && users.length === 0 ? (
                <div className="loading-state">Loading...</div>
              ) : (
                <div className="table-wrapper">
                  <table className="user-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="no-users">No users found.</td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="btn-danger"
                                disabled={isLoading}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
