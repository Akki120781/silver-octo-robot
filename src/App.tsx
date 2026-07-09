import { useState, useEffect } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'


interface FeedbackEntry {
  id: string
  name: string
  email: string
  category: string
  rating: number
  comments: string
}

interface AttendanceEntry {
  id: string
  studentId: string
  fullName: string
  date: string
  status: string
  reason: string
}

interface SportsEntry {
  id: string
  studentName: string
  age: number
  sport: string
  skillLevel: string
  contact: string
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
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'feedback' | 'attendance' | 'sports'>('dashboard')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [showLogs, setShowLogs] = useState(false)

  // Lists state
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([])
  const [attendanceList, setAttendanceList] = useState<AttendanceEntry[]>([])
  const [sportsList, setSportsList] = useState<SportsEntry[]>([])

  // Feedback Form states
  const [fbName, setFbName] = useState('')
  const [fbEmail, setFbEmail] = useState('')
  const [fbCategory, setFbCategory] = useState('General')
  const [fbRating, setFbRating] = useState(5)
  const [fbComments, setFbComments] = useState('')

  // Attendance Form states
  const [attStudentId, setAttStudentId] = useState('')
  const [attFullName, setAttFullName] = useState('')
  const [attDate, setAttDate] = useState(() => new Date().toISOString().split('T')[0])
  const [attStatus, setAttStatus] = useState('Present')
  const [attReason, setAttReason] = useState('')

  // Sports Form states
  const [spStudentName, setSpStudentName] = useState('')
  const [spAge, setSpAge] = useState('')
  const [spSport, setSpSport] = useState('Football')
  const [spSkillLevel, setSpSkillLevel] = useState('Beginner')
  const [spContact, setSpContact] = useState('')

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')

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

  const fetchData = async (page: 'feedback' | 'attendance' | 'sports', keyToUse = apiKey) => {
    if (!keyToUse) return
    setIsLoading(true)
    setError(null)
    const url = `${API_BASE_URL}/${page}`
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
      if (page === 'feedback') setFeedbackList(data)
      if (page === 'attendance') setAttendanceList(data)
      if (page === 'sports') setSportsList(data)
      addLog('GET', url, res.status, null, data)
    } catch (err: any) {
      setError(err.message || `Failed to fetch ${page} data`)
      addLog('GET', url, 'ERROR', null, err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data on initial load if key is saved
  useEffect(() => {
    const savedKey = localStorage.getItem('portal_api_key')
    if (savedKey) {
      setApiKey(savedKey)
      setIsKeySaved(true)
    }
  }, [])

  // Fetch page data when user navigates to it
  useEffect(() => {
    if (isKeySaved && currentPage !== 'dashboard') {
      fetchData(currentPage)
    }
  }, [currentPage, isKeySaved])

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedKey = apiKey.trim()
    if (trimmedKey) {
      localStorage.setItem('portal_api_key', trimmedKey)
      setIsKeySaved(true)
      setCurrentPage('dashboard')
    }
  }

  const handleDisconnect = () => {
    localStorage.removeItem('portal_api_key')
    setApiKey('')
    setIsKeySaved(false)
    setFeedbackList([])
    setAttendanceList([])
    setSportsList([])
    setLogs([])
    setCurrentPage('dashboard')
  }

  // Handle Form Submissions
  const handleCreateFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fbName || !fbEmail || !fbCategory || !fbComments) return
    setIsLoading(true)
    setError(null)
    const url = `${API_BASE_URL}/feedback`
    const payload = { name: fbName, email: fbEmail, category: fbCategory, rating: fbRating, comments: fbComments }
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
      // Reset form
      setFbName('')
      setFbEmail('')
      setFbCategory('General')
      setFbRating(5)
      setFbComments('')
      // Refresh list
      fetchData('feedback')
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback')
      addLog('POST', url, 'ERROR', payload, err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!attStudentId || !attFullName || !attDate || !attStatus) return
    setIsLoading(true)
    setError(null)
    const url = `${API_BASE_URL}/attendance`
    const payload = { studentId: attStudentId, fullName: attFullName, date: attDate, status: attStatus, reason: attReason }
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
      // Reset form
      setAttStudentId('')
      setAttFullName('')
      setAttDate(new Date().toISOString().split('T')[0])
      setAttStatus('Present')
      setAttReason('')
      // Refresh list
      fetchData('attendance')
    } catch (err: any) {
      setError(err.message || 'Failed to submit attendance')
      addLog('POST', url, 'ERROR', payload, err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSports = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!spStudentName || !spAge || !spSport || !spSkillLevel || !spContact) return
    setIsLoading(true)
    setError(null)
    const url = `${API_BASE_URL}/sports`
    const payload = { studentName: spStudentName, age: spAge, sport: spSport, skillLevel: spSkillLevel, contact: spContact }
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
      // Reset form
      setSpStudentName('')
      setSpAge('')
      setSpSport('Football')
      setSpSkillLevel('Beginner')
      setSpContact('')
      // Refresh list
      fetchData('sports')
    } catch (err: any) {
      setError(err.message || 'Failed to submit enrollment')
      addLog('POST', url, 'ERROR', payload, err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Filtering lists based on search query
  const filteredFeedback = feedbackList.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.comments?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredAttendance = attendanceList.filter(item => 
    item.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.status?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSports = sportsList.filter(item => 
    item.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sport?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.skillLevel?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="portal-container">
      <header className="portal-header">
        <h1>Campus Hub Portal</h1>
        {isKeySaved && (
          <div className="api-badge">
            <span className="api-status">Connected</span>
            <button onClick={handleDisconnect} className="btn-disconnect">Disconnect</button>
          </div>
        )}
      </header>

      {!isKeySaved ? (
        <div className="key-setup-card">
          <p>Please enter your API Key (`secret123`) to connect to the campus databases.</p>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {currentPage === 'dashboard' ? (
            <div>
              <p style={{ color: '#666', fontSize: '15px', marginBottom: '20px' }}>
                Select one of the modules below to enter details and view submissions.
              </p>
              <div className="dashboard-grid">
                <div className="dashboard-card" onClick={() => setCurrentPage('feedback')}>
                  <div>
                    <h3>Feedback & Reviews</h3>
                    <p>Submit campus course ratings, review facilities, and share general feedback about student life.</p>
                  </div>
                  <div className="card-footer">
                    <span>Open Form</span>
                    <span>→</span>
                  </div>
                </div>

                <div className="dashboard-card" onClick={() => setCurrentPage('attendance')}>
                  <div>
                    <h3>Daily Attendance</h3>
                    <p>Log student check-ins, record absences, and track excuses with custom status indicators.</p>
                  </div>
                  <div className="card-footer">
                    <span>Open Form</span>
                    <span>→</span>
                  </div>
                </div>

                <div className="dashboard-card" onClick={() => setCurrentPage('sports')}>
                  <div>
                    <h3>Sports Enrollment</h3>
                    <p>Enroll in campus sport programs, select skill tiers, and manage participant contact details.</p>
                  </div>
                  <div className="card-footer">
                    <span>Open Form</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="subpage-header">
                <button className="btn-back" onClick={() => { setCurrentPage('dashboard'); setSearchQuery(''); setError(null); }}>
                  ← Dashboard
                </button>
                <h2>
                  {currentPage === 'feedback' && 'Feedback & Ratings'}
                  {currentPage === 'attendance' && 'Attendance Registry'}
                  {currentPage === 'sports' && 'Sports Enrollment'}
                </h2>
              </div>
              <div className="portal-grid">
                {/* LEFT PANEL: Form */}
                <div className="left-panel">
                  {currentPage === 'feedback' && (
                    <div className="card">
                      <h2>Feedback Form</h2>
                      <form onSubmit={handleCreateFeedback} className="form-container">
                        <div className="form-group">
                          <label>Full Name</label>
                          <input
                            type="text"
                            placeholder="John Doe"
                            value={fbName}
                            onChange={(e) => setFbName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Email Address</label>
                          <input
                            type="email"
                            placeholder="john@example.com"
                            value={fbEmail}
                            onChange={(e) => setFbEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Category</label>
                          <select value={fbCategory} onChange={(e) => setFbCategory(e.target.value)}>
                            <option value="General">General feedback</option>
                            <option value="Course">Course curriculum</option>
                            <option value="Facilities">Campus Facilities</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Rating</label>
                          <div className="rating-selector">
                            {[1, 2, 3, 4, 5].map((stars) => (
                              <button
                                key={stars}
                                type="button"
                                className={`btn-rating ${fbRating === stars ? 'selected' : ''}`}
                                onClick={() => setFbRating(stars)}
                              >
                                {stars}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Comments</label>
                          <textarea
                            placeholder="Share your detailed feedback here..."
                            value={fbComments}
                            onChange={(e) => setFbComments(e.target.value)}
                            required
                          />
                        </div>
                        <button type="submit" className="btn-primary" disabled={isLoading}>
                          {isLoading ? 'Submitting...' : 'Submit'}
                        </button>
                      </form>
                    </div>
                  )}

                  {currentPage === 'attendance' && (
                    <div className="card">
                      <h2>Log Attendance</h2>
                      <form onSubmit={handleCreateAttendance} className="form-container">
                        <div className="form-group">
                          <label>Student ID</label>
                          <input
                            type="text"
                            placeholder="S101"
                            value={attStudentId}
                            onChange={(e) => setAttStudentId(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Student Full Name</label>
                          <input
                            type="text"
                            placeholder="Jane Smith"
                            value={attFullName}
                            onChange={(e) => setAttFullName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Date</label>
                          <input
                            type="date"
                            value={attDate}
                            onChange={(e) => setAttDate(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Status</label>
                          <div className="option-selector-group">
                            {['Present', 'Absent', 'Late'].map((statusOption) => (
                              <button
                                key={statusOption}
                                type="button"
                                className={`btn-option ${attStatus === statusOption ? 'selected' : ''}`}
                                onClick={() => setAttStatus(statusOption)}
                              >
                                {statusOption}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Reason / Note</label>
                          <textarea
                            placeholder={attStatus === 'Present' ? 'Optional comments...' : 'Provide excuse/reason...'}
                            value={attReason}
                            onChange={(e) => setAttReason(e.target.value)}
                            required={attStatus !== 'Present'}
                          />
                        </div>
                        <button type="submit" className="btn-primary" disabled={isLoading}>
                          {isLoading ? 'Submitting...' : 'Submit Log'}
                        </button>
                      </form>
                    </div>
                  )}

                  {currentPage === 'sports' && (
                    <div className="card">
                      <h2>Sports Enrollment Form</h2>
                      <form onSubmit={handleCreateSports} className="form-container">
                        <div className="form-group">
                          <label>Student Full Name</label>
                          <input
                            type="text"
                            placeholder="Bob Johnson"
                            value={spStudentName}
                            onChange={(e) => setSpStudentName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Age</label>
                          <input
                            type="number"
                            placeholder="19"
                            value={spAge}
                            onChange={(e) => setSpAge(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Select Sport</label>
                          <select value={spSport} onChange={(e) => setSpSport(e.target.value)}>
                            <option value="Football">Football</option>
                            <option value="Basketball">Basketball</option>
                            <option value="Tennis">Tennis</option>
                            <option value="Swimming">Swimming</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Skill Level</label>
                          <div className="option-selector-group">
                            {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                              <button
                                key={level}
                                type="button"
                                className={`btn-option ${spSkillLevel === level ? 'selected' : ''}`}
                                onClick={() => setSpSkillLevel(level)}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Contact Phone</label>
                          <input
                            type="tel"
                            placeholder="+1-555-0199"
                            value={spContact}
                            onChange={(e) => setSpContact(e.target.value)}
                            required
                          />
                        </div>
                        <button type="submit" className="btn-primary" disabled={isLoading}>
                          {isLoading ? 'Enrolling...' : 'Submit Enrollment'}
                        </button>
                      </form>
                    </div>
                  )}

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
                <h2>
                  Submissions ({currentPage === 'feedback' && filteredFeedback.length}
                  {currentPage === 'attendance' && filteredAttendance.length}
                  {currentPage === 'sports' && filteredSports.length})
                </h2>
                <button onClick={() => fetchData(currentPage)} className="btn-secondary" disabled={isLoading}>
                  Refresh
                </button>
              </div>

              <input
                type="text"
                placeholder="Search submissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />

              {error && <div className="error-message">{error}</div>}

              {isLoading && (
                <div className="loading-state">Loading...</div>
              )}

              {!isLoading && (
                <div className="table-wrapper">
                  {currentPage === 'feedback' && (
                    <table className="user-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Rating</th>
                          <th>Comments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFeedback.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="no-users">No feedback submissions found.</td>
                          </tr>
                        ) : (
                          filteredFeedback.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <strong>{item.name}</strong>
                                <br />
                                <span style={{ fontSize: '11px', color: '#666' }}>{item.email}</span>
                              </td>
                              <td>{item.category}</td>
                              <td>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</td>
                              <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>{item.comments}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {currentPage === 'attendance' && (
                    <table className="user-table">
                      <thead>
                        <tr>
                          <th>ID & Name</th>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAttendance.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="no-users">No attendance records found.</td>
                          </tr>
                        ) : (
                          filteredAttendance.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <strong>{item.studentId}</strong> - {item.fullName}
                              </td>
                              <td>{item.date}</td>
                              <td>
                                <span style={{
                                  fontWeight: 'bold',
                                  color: item.status === 'Present' ? 'green' : item.status === 'Late' ? 'orange' : 'red'
                                }}>
                                  {item.status}
                                </span>
                              </td>
                              <td>{item.reason || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {currentPage === 'sports' && (
                    <table className="user-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Sport</th>
                          <th>Level</th>
                          <th>Contact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSports.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="no-users">No enrollments found.</td>
                          </tr>
                        ) : (
                          filteredSports.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <strong>{item.studentName}</strong> ({item.age} yrs)
                              </td>
                              <td>{item.sport}</td>
                              <td>{item.skillLevel}</td>
                              <td>{item.contact}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

          {/* Collapsible API log console */}
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
      )}
    </div>
  )
}

export default App
