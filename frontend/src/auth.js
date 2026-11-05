const KEY = 'taskflow_session'

export function getSession() {
    try {
        return JSON.parse(localStorage.getItem(KEY))
    } catch {
        return null
    }
}

export function saveSession(session) {
    localStorage.setItem(KEY, JSON.stringify(session))
}

export function clearSession() {
    localStorage.removeItem(KEY)
}

export async function getErrorMessage(response, fallback) {
    try {
        const data = await response.json()
        const fieldError = data.errors ? Object.values(data.errors)[0] : null
        return fieldError || data.message || fallback
    } catch {
        return fallback
    }
}

// fetch() that automatically attaches the JWT
export async function authFetch(url, options = {}) {
    const session = getSession()

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
        },
    })

    // expired or invalid token -> log out everywhere
    if (response.status === 401) {
        console.warn('401 on', url, '| token sent:', session?.token?.slice(0, 20), '| body:', await response.clone().text())

        clearSession()
        window.dispatchEvent(new Event('taskflow:logout'))
    }

    return response
}

export async function login(email, password) {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Invalid email or password.'))
    }

    const session = await response.json() // { token, tokenType, name, email }
    saveSession(session)
    return session
}

export async function register(name, email, password) {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    })

    if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Could not create account.'))
    }

    // register succeeded -> log in right away
    return login(email, password)
}