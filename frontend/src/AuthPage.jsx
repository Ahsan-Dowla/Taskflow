import { useState } from 'react'
import { login, register } from './auth'

function AuthPage({ onAuth }) {
    const [mode, setMode] = useState('login') // 'login' | 'register'
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const isLogin = mode === 'login'

    async function handleSubmit(event) {
        event.preventDefault()
        setError('')

        if (!isLogin && password.length < 8) {
            setError('Password must be at least 8 characters.')
            return
        }

        setSubmitting(true)
        try {
            const session = isLogin
                ? await login(email.trim(), password)
                : await register(name.trim(), email.trim(), password)
            onAuth(session)
        } catch (err) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    function switchMode() {
        setMode(isLogin ? 'register' : 'login')
        setError('')
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="brand">
                    <div className="brand-icon">✓</div>
                    <span>Taskflow</span>
                </div>

                <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
                <p className="auth-sub">
                    {isLogin ? 'Log in to see your tasks.' : 'Your tasks stay private to you.'}
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <label>
                            Name
                            <input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                autoComplete="name"
                                required
                            />
                        </label>
                    )}

                    <label>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </label>

                    <label>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete={isLogin ? 'current-password' : 'new-password'}
                            required
                        />
                    </label>

                    {error && <div className="auth-error">{error}</div>}

                    <button className="auth-submit" disabled={submitting}>
                        {submitting ? 'Please wait...' : isLogin ? 'Log in' : 'Sign up'}
                    </button>
                </form>

                <p className="auth-switch">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button type="button" onClick={switchMode}>
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    )
}

export default AuthPage