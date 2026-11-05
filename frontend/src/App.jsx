import { useEffect, useState } from 'react'
import { getSession, clearSession } from './auth'
import AuthPage from './AuthPage'
import Dashboard from './Dashboard'

function App() {
    // reads localStorage once on load, so refresh keeps you logged in
    const [session, setSession] = useState(getSession)

    useEffect(() => {
        const onForcedLogout = () => setSession(null)
        window.addEventListener('taskflow:logout', onForcedLogout)
        return () => window.removeEventListener('taskflow:logout', onForcedLogout)
    }, [])

    function logout() {
        clearSession()
        setSession(null)
    }

    if (!session) return <AuthPage onAuth={setSession} />

    return <Dashboard user={session} onLogout={logout} />
}

export default App