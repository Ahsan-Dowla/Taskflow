import { authFetch } from './auth'
import { useEffect, useState } from 'react'
import './App.css'

const API_URL = '/api/tasks'

function validateTitle(value) {
    const clean = value.trim()

    if (!clean) return 'Task title cannot be empty.'
    if (clean.length < 3) return 'Title must contain at least 3 characters.'
    if (clean.length > 100) return 'Title cannot exceed 100 characters.'

    return ''
}

async function getErrorMessage(response, fallback) {
    try {
        const data = await response.json()
        const fieldError = data.errors
            ? Object.values(data.errors)[0]
            : null

        return fieldError || data.message || fallback
    } catch {
        return fallback
    }
}

function Dashboard({ user, onLogout }) {
    const [tasks, setTasks] = useState([])
    const [title, setTitle] = useState('')
    const [filter, setFilter] = useState('all')

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [deletingCompleted, setDeletingCompleted] = useState(false)

    const [editingId, setEditingId] = useState(null)
    const [editTitle, setEditTitle] = useState('')

    const [error, setError] = useState('')
    const [titleError, setTitleError] = useState('')
    const [editError, setEditError] = useState('')

    // READ: Load tasks
    async function loadTasks() {
        setLoading(true)
        setError('')

        try {
            const response = await authFetch(API_URL)

            if (!response.ok) {
                throw new Error('Could not load tasks.')
            }

            setTasks(await response.json())
        } catch (err) {
            setError(err.message || 'Unable to connect to backend.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadTasks()
    }, [])

    // CREATE: Add task
    async function addTask(event) {
        event.preventDefault()

        const validationMessage = validateTitle(title)
        setTitleError(validationMessage)

        if (validationMessage) return

        setSaving(true)
        setError('')

        try {
            const response = await authFetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title.trim(),
                    completed: false,
                }),
            })

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(response, 'Could not create task.')
                )
            }

            const newTask = await response.json()

            setTasks(current => [newTask, ...current])
            setTitle('')
            setTitleError('')
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    // EDIT: Open inline editor
    function startEditing(task) {
        setEditingId(task.id)
        setEditTitle(task.title)
        setEditError('')
        setError('')
    }

    // EDIT: Cancel
    function cancelEditing() {
        setEditingId(null)
        setEditTitle('')
        setEditError('')
    }

    // UPDATE: Save edited task
    async function saveEdit(event, task) {
        event.preventDefault()

        const validationMessage = validateTitle(editTitle)
        setEditError(validationMessage)

        if (validationMessage) return

        setUpdating(true)
        setError('')

        try {
            const response = await authFetch(`${API_URL}/${task.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: editTitle.trim(),
                    completed: task.completed,
                }),
            })

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(response, 'Could not update task.')
                )
            }

            const updatedTask = await response.json()

            setTasks(current =>
                current.map(item =>
                    item.id === updatedTask.id ? updatedTask : item
                )
            )

            cancelEditing()
        } catch (err) {
            setError(err.message)
        } finally {
            setUpdating(false)
        }
    }

    // UPDATE: Toggle completed status
    async function toggleTask(task) {
        setError('')

        try {
            const response = await authFetch(`${API_URL}/${task.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: task.title,
                    completed: !task.completed,
                }),
            })

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(response, 'Could not update task.')
                )
            }

            const updatedTask = await response.json()

            setTasks(current =>
                current.map(item =>
                    item.id === updatedTask.id ? updatedTask : item
                )
            )
        } catch (err) {
            setError(err.message)
        }
    }

    // DELETE: Delete one task
    async function deleteTask(id) {
        const confirmed = window.confirm(
            'Are you sure you want to permanently delete this task?'
        )

        if (!confirmed) return

        setDeletingId(id)
        setError('')

        try {
            const response = await authFetch(`${API_URL}/${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(response, 'Could not delete task.')
                )
            }

            setTasks(current => current.filter(task => task.id !== id))

            if (editingId === id) {
                cancelEditing()
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setDeletingId(null)
        }
    }

    // DELETE: Delete all completed tasks
    async function deleteCompletedTasks() {
        if (completedCount === 0) return

        const confirmed = window.confirm(
            `Delete all ${completedCount} completed tasks? This cannot be undone.`
        )

        if (!confirmed) return

        setDeletingCompleted(true)
        setError('')

        try {
            const response = await authFetch(`${API_URL}/completed`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Could not delete completed tasks.')
            }

            setTasks(current => current.filter(task => !task.completed))

            if (editingId !== null) {
                const editingTask = tasks.find(task => task.id === editingId)

                if (editingTask?.completed) {
                    cancelEditing()
                }
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setDeletingCompleted(false)
        }
    }

    // Dashboard calculations
    const completedCount = tasks.filter(task => task.completed).length
    const activeCount = tasks.length - completedCount

    const filteredTasks = tasks.filter(task => {
        if (filter === 'active') return !task.completed
        if (filter === 'completed') return task.completed
        return true
    })

    return (
        <div className="app-shell">

            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-icon">✓</div>
                    <span>Taskflow</span>
                </div>

                <div className="sidebar-label">WORKSPACE</div>

                <div className="nav-item selected">
                    <span>▦</span>
                    My Tasks
                </div>

                <div className="sidebar-footer">
                    <div className="avatar">{user.name[0].toUpperCase()}</div>
                    <div>
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="main-content">

                <header className="topbar">
                    <span>Workspace / My Tasks</span>

                    <span className="system-status">
            <span className="status-dot"></span>
            Local development
          </span>
                    <button className="logout-btn" onClick={onLogout}>Log out</button>
                </header>

                <section className="dashboard">

                    <div className="page-heading">
                        <div>
                            <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
                            <h1>My Tasks</h1>
                            <p className="subtitle">
                                Stay organized. Get things done.
                            </p>
                        </div>
                    </div>

                    {/* STATISTICS */}
                    <div className="stats-grid">

                        <div className="stat-card">
                            <div className="stat-icon purple">▦</div>
                            <p>Total tasks</p>
                            <h2>{tasks.length}</h2>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon orange">◷</div>
                            <p>In progress</p>
                            <h2>{activeCount}</h2>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon green">✓</div>
                            <p>Completed</p>
                            <h2>{completedCount}</h2>
                        </div>

                    </div>

                    {/* CREATE TASK */}
                    <section className="task-panel">

                        <div className="panel-heading">
                            <div>
                                <h2>Create a task</h2>
                                <p>What would you like to accomplish?</p>
                            </div>
                        </div>

                        <form className="add-form" onSubmit={addTask}>

                            <input
                                type="text"
                                placeholder="Enter your next task..."
                                value={title}
                                onChange={event => {
                                    setTitle(event.target.value)
                                    if (titleError) setTitleError('')
                                }}
                                maxLength={100}
                                aria-label="New task title"
                            />

                            <button
                                type="submit"
                                disabled={saving || !title.trim()}
                            >
                                {saving ? 'Adding...' : '+ Add task'}
                            </button>

                        </form>

                        <div className="form-hint">
                            {titleError || 'Task title must contain 3–100 characters.'}
                        </div>

                        {/* TASK LIST */}
                        <div className="list-heading">

                            <div>
                                <h2>Your tasks</h2>
                                <span>{tasks.length} total</span>
                            </div>

                            <div className="list-actions">

                                {completedCount > 0 && (
                                    <button
                                        className="bulk-delete-button"
                                        type="button"
                                        onClick={deleteCompletedTasks}
                                        disabled={deletingCompleted}
                                    >
                                        {deletingCompleted
                                            ? 'Deleting...'
                                            : `Delete completed (${completedCount})`}
                                    </button>
                                )}

                                <div className="filters">
                                    {['all', 'active', 'completed'].map(option => (
                                        <button
                                            key={option}
                                            className={
                                                filter === option ? 'filter active' : 'filter'
                                            }
                                            onClick={() => setFilter(option)}
                                            type="button"
                                        >
                                            {option.charAt(0).toUpperCase() + option.slice(1)}
                                        </button>
                                    ))}
                                </div>

                            </div>

                        </div>

                        {error && (
                            <div className="error-message" role="alert">
                                {error}

                                <button type="button" onClick={loadTasks}>
                                    Retry
                                </button>
                            </div>
                        )}

                        <div className="task-list">

                            {loading ? (
                                <p className="empty-message">
                                    Loading your tasks...
                                </p>
                            ) : filteredTasks.length === 0 ? (
                                <div className="empty-state">
                                    <div>✧</div>

                                    <h3>
                                        {tasks.length === 0
                                            ? 'No tasks yet'
                                            : 'Nothing here'}
                                    </h3>

                                    <p>
                                        {tasks.length === 0
                                            ? 'Add your first task and get started.'
                                            : 'Try switching to another filter.'}
                                    </p>
                                </div>
                            ) : (

                                filteredTasks.map(task => (

                                    <div className="task-item" key={task.id}>

                                        <input
                                            type="checkbox"
                                            checked={task.completed}
                                            onChange={() => toggleTask(task)}
                                            disabled={editingId === task.id}
                                            aria-label={`Mark ${task.title} as ${
                                                task.completed ? 'incomplete' : 'completed'
                                            }`}
                                        />

                                        {editingId === task.id ? (

                                            <form
                                                className="edit-form"
                                                onSubmit={event => saveEdit(event, task)}
                                            >

                                                <input
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={event => {
                                                        setEditTitle(event.target.value)
                                                        if (editError) setEditError('')
                                                    }}
                                                    maxLength={100}
                                                    autoFocus
                                                    aria-label="Edit task title"
                                                />

                                                <button
                                                    className="save-button"
                                                    type="submit"
                                                    disabled={updating}
                                                >
                                                    {updating ? 'Saving...' : 'Save'}
                                                </button>

                                                <button
                                                    className="cancel-button"
                                                    type="button"
                                                    onClick={cancelEditing}
                                                    disabled={updating}
                                                >
                                                    Cancel
                                                </button>

                                                {editError && (
                                                    <small className="field-error">
                                                        {editError}
                                                    </small>
                                                )}

                                            </form>

                                        ) : (

                                            <div className="task-details">
                        <span
                            className={
                                task.completed
                                    ? 'task-title done'
                                    : 'task-title'
                            }
                        >
                          {task.title}
                        </span>

                                                <small>Task #{task.id}</small>
                                            </div>

                                        )}

                                        {editingId !== task.id && (
                                            <>
                        <span
                            className={
                                task.completed
                                    ? 'task-status done-status'
                                    : 'task-status'
                            }
                        >
                          {task.completed ? 'Completed' : 'In progress'}
                        </span>

                                                <div className="task-actions">

                                                    <button
                                                        className="edit-button"
                                                        type="button"
                                                        onClick={() => startEditing(task)}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="delete-button"
                                                        type="button"
                                                        onClick={() => deleteTask(task.id)}
                                                        disabled={deletingId === task.id}
                                                    >
                                                        {deletingId === task.id
                                                            ? 'Deleting...'
                                                            : 'Delete'}
                                                    </button>

                                                </div>
                                            </>
                                        )}

                                    </div>

                                ))
                            )}

                        </div>

                        <div className="panel-footer">
                            <span>✓</span>
                            Your tasks are saved in PostgreSQL.
                        </div>

                    </section>
                </section>
            </main>
        </div>
    )
}

export default Dashboard
