import SpendingCharts from './components/SpendingCharts'
import { useEffect, useState } from 'react'
import './App.css'
import AnimatedBackground from './components/AnimatedBackground'

const API_URL = 'http://localhost:8080'

function getCurrentMonth() {
  const now = new Date()
  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  )
  return localDate.toISOString().slice(0, 7)
}

function getToday() {
  const now = new Date()
  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  )
  return localDate.toISOString().slice(0, 10)
}

function App() {
  // Authentication state
  const [mode, setMode] = useState('login')
  const [authenticated, setAuthenticated] = useState(false)
  const [authChecking, setAuthChecking] = useState(
    () => Boolean(sessionStorage.getItem('smartspendToken'))
  )

  const [name, setName] = useState(
    () => sessionStorage.getItem('smartspendName') || ''
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [loading, setLoading] = useState(false)

  // Transaction state
  const [transactions, setTransactions] = useState([])
  const [transactionLoading, setTransactionLoading] = useState(false)
  const [savingTransaction, setSavingTransaction] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Edit transaction state
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editType, setEditType] = useState('EXPENSE')
  const [editCategory, setEditCategory] = useState('Food')
  const [editDate, setEditDate] = useState('')
  const [updatingTransaction, setUpdatingTransaction] = useState(false)

  const [transactionError, setTransactionError] = useState('')
  const [transactionMessage, setTransactionMessage] = useState('')

  // Monthly budget state
  const [budgets, setBudgets] = useState([])
  const [budgetMonth, setBudgetMonth] = useState(getCurrentMonth())
  const [budgetCategory, setBudgetCategory] = useState('OVERALL')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [budgetLoading, setBudgetLoading] = useState(false)
  const [savingBudget, setSavingBudget] = useState(false)
  const [deletingBudgetId, setDeletingBudgetId] = useState(null)
  const [budgetError, setBudgetError] = useState('')
  const [budgetMessage, setBudgetMessage] = useState('')

  // Toast notification state
  const [toast, setToast] = useState(null)

  // Display a toast notification.
  function showToast(message, type = 'success') {
    setToast({
      message,
      type,
      id: Date.now(),
    })
  }

  // Automatically hide toast after 3.5 seconds.
  useEffect(() => {
    if (!toast) return

    const timer = setTimeout(() => {
      setToast(null)
    }, 3500)

    return () => clearTimeout(timer)
  }, [toast])

  // Transaction form state
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('EXPENSE')
  const [category, setCategory] = useState('Food')
  const [date, setDate] = useState(getToday())

  // Transaction filter state
  const [filterType, setFilterType] = useState('ALL')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [filterDate, setFilterDate] = useState('')

  // Restore the saved login session after a page refresh.
  useEffect(() => {
    const token = sessionStorage.getItem('smartspendToken')

    if (!token) {
      setAuthenticated(false)
      setAuthChecking(false)
      return
    }

    let cancelled = false

    async function verifyToken() {
      try {
        const response = await fetch(`${API_URL}/test-mongodb`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (cancelled) return

        if (response.ok) {
          setName(sessionStorage.getItem('smartspendName') || '')
          setAuthenticated(true)
        } else if (
          response.status === 401 ||
          response.status === 403
        ) {
          sessionStorage.removeItem('smartspendToken')
          sessionStorage.removeItem('smartspendName')
          setAuthenticated(false)
          setMessageType('error')
          setMessage('Your session has expired. Please sign in again.')
        } else {
          setAuthenticated(false)
          setMessageType('error')
          setMessage('Could not verify your session. Please try again.')
        }
      } catch {
        if (!cancelled) {
          setAuthenticated(false)
          setMessageType('error')
          setMessage(
            'Cannot connect to the backend. Make sure Spring Boot is running, then refresh the page.'
          )
        }
      } finally {
        if (!cancelled) {
          setAuthChecking(false)
        }
      }
    }

    verifyToken()

    return () => {
      cancelled = true
    }
  }, [])

  // Register a new account or log in.
  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const endpoint = mode === 'login' ? 'login' : 'register'

      const body =
        mode === 'login'
          ? { email: email.trim(), password }
          : { name: name.trim(), email: email.trim(), password }

      const response = await fetch(
        `${API_URL}/api/auth/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            (response.status === 409
              ? 'This email is already registered.'
              : response.status === 401
                ? 'Invalid email or password.'
                : `Request failed (${response.status}).`)
        )
      }

      if (mode === 'register') {
        setMode('login')
        setPassword('')
        setMessageType('success')
        setMessage('Account created successfully! Please sign in.')
      } else {
        if (!data.token) {
          throw new Error(
            'Login succeeded but the server did not return a token.'
          )
        }

        sessionStorage.setItem('smartspendToken', data.token)
        sessionStorage.setItem('smartspendName', data.name || '')

        setName(data.name || '')
        setAuthenticated(true)
        setMessage('')
        setPassword('')
      }
    } catch (error) {
      setMessageType('error')
      setMessage(
        error.message === 'Failed to fetch'
          ? 'Cannot connect to the backend. Check that Spring Boot is running and CORS is configured.'
          : error.message
      )
    } finally {
      setLoading(false)
    }
  }

  // Load transactions belonging to the authenticated user.
  async function loadTransactions() {
    const token = sessionStorage.getItem('smartspendToken')

    if (!token) {
      setTransactionError('Please sign in again.')
      return
    }

    setTransactionLoading(true)
    setTransactionError('')

    try {
      const response = await fetch(`${API_URL}/api/transactions`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.status === 401 || response.status === 403) {
        handleSessionExpired()
        return
      }

      if (!response.ok) {
        throw new Error(
          `Could not load transactions (${response.status}).`
        )
      }

      const data = await response.json()
      setTransactions(Array.isArray(data) ? data : [])
    } catch (error) {
      setTransactionError(
        error.message === 'Failed to fetch'
          ? 'Cannot connect to the backend. Check that Spring Boot is running.'
          : error.message
      )
    } finally {
      setTransactionLoading(false)
    }
  }

  // Fetch transactions after successful authentication.
  useEffect(() => {
    if (authenticated) {
      loadTransactions()
    }
  }, [authenticated])

  // Load budgets for the selected month.
  async function loadBudgets() {
    const token = sessionStorage.getItem('smartspendToken')

    if (!token || !budgetMonth) return

    setBudgetLoading(true)
    setBudgetError('')

    try {
      const response = await fetch(
        `${API_URL}/api/budgets?month=${encodeURIComponent(budgetMonth)}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.status === 401 || response.status === 403) {
        handleSessionExpired()
        return
      }

      if (!response.ok) {
        throw new Error(`Could not load budgets (${response.status}).`)
      }

      const data = await response.json()
      setBudgets(Array.isArray(data) ? data : [])
    } catch (error) {
      setBudgetError(
        error.message === 'Failed to fetch'
          ? 'Cannot connect to the backend. Check that Spring Boot is running.'
          : error.message
      )
    } finally {
      setBudgetLoading(false)
    }
  }

  // Refresh budgets when the user signs in or changes the selected month.
  useEffect(() => {
    if (authenticated) {
      loadBudgets()
    }
  }, [authenticated, budgetMonth])

  // Create a budget or update the existing category budget.
  async function handleSaveBudget(event) {
    event.preventDefault()
    setBudgetError('')
    setBudgetMessage('')

    if (
      !budgetMonth ||
      !budgetCategory ||
      !budgetAmount ||
      !Number.isFinite(Number(budgetAmount)) ||
      Number(budgetAmount) <= 0
    ) {
      setBudgetError(
        'Enter a valid month and a budget amount greater than zero.'
      )
      return
    }

    setSavingBudget(true)

    try {
      const token = sessionStorage.getItem('smartspendToken')
      const response = await fetch(`${API_URL}/api/budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          month: budgetMonth,
          category: budgetCategory,
          amount: Number(budgetAmount),
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.status === 401 || response.status === 403) {
        handleSessionExpired()
        return
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Could not save budget (${response.status}).`
        )
      }

      setBudgetAmount('')
      setBudgetMessage(
        budgetCategory === 'OVERALL'
          ? 'Monthly budget saved successfully!'
          : `${budgetCategory} budget saved successfully!`
      )
      showToast(
        budgetCategory === 'OVERALL'
          ? 'Monthly budget saved successfully!'
          : `${budgetCategory} budget saved successfully!`,
        'success'
      )
      await loadBudgets()
    } catch (error) {
      setBudgetError(
        error.message === 'Failed to fetch'
          ? 'Cannot connect to the backend.'
          : error.message
      )
      showToast(
        error.message === 'Failed to fetch'
          ? 'Cannot connect to the backend.'
          : error.message,
        'error'
      )
    } finally {
      setSavingBudget(false)
    }
  }

  // Delete a budget.
  async function handleDeleteBudget(id) {
    if (!id || deletingBudgetId) return

    if (!window.confirm('Delete this budget?')) return

    setDeletingBudgetId(id)
    setBudgetError('')
    setBudgetMessage('')

    try {
      const token = sessionStorage.getItem('smartspendToken')
      const response = await fetch(
        `${API_URL}/api/budgets/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.status === 401 || response.status === 403) {
        handleSessionExpired()
        return
      }

      if (!response.ok) {
        throw new Error(`Could not delete budget (${response.status}).`)
      }

      setBudgets((current) =>
        current.filter((budget) => budget.id !== id)
      )
      setBudgetMessage('Budget deleted successfully!')
      showToast('Budget deleted successfully!', 'success')
    } catch (error) {
      setBudgetError(
        error.message === 'Failed to fetch'
          ? 'Cannot connect to the backend.'
          : error.message
      )
      showToast(
        error.message === 'Failed to fetch'
          ? 'Cannot connect to the backend.'
          : error.message,
        'error'
      )
    } finally {
      setDeletingBudgetId(null)
    }
  }

  // Format currency in Indian Rupees.
  function formatCurrency(value) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(value) || 0)
  }

  // Get spending for a category and month.
  function getSpentForCategory(selectedCategory, selectedMonth) {
    return transactions
      .filter((transaction) => {
        if (transaction.type !== 'EXPENSE') return false
        if (
          !transaction.date ||
          !transaction.date.startsWith(selectedMonth)
        ) {
          return false
        }

        if (selectedCategory === 'OVERALL') return true

        return (
          (transaction.category || '').toLowerCase() ===
          selectedCategory.toLowerCase()
        )
      })
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0
      )
  }

  // Calculate budget progress.
  function getBudgetProgress(budget) {
    const spent = getSpentForCategory(budget.category, budgetMonth)
    const limit = Number(budget.amount) || 0
    const remaining = limit - spent
    const percentage = limit > 0 ? (spent / limit) * 100 : 0

    return {
      spent,
      limit,
      remaining,
      percentage: Math.min(percentage, 100),
      exceeded: spent > limit,
      warning: percentage >= 80 && percentage <= 100,
    }
  }
    // Calculate spending for a budget using this user's transactions.

function getBudgetSpent(budget) {
  return transactions.reduce((total, transaction) => {
    const isExpense =
      transaction.type?.toUpperCase() === 'EXPENSE'

    const transactionMonth =
      typeof transaction.date === 'string'
        ? transaction.date.slice(0, 7)
        : ''

    const isInBudgetMonth =
      transactionMonth === budget.month

    const matchesCategory =
      budget.category?.toUpperCase() === 'OVERALL' ||
      (transaction.category || '').trim().toLowerCase() ===
        (budget.category || '').trim().toLowerCase()

    return isExpense && isInBudgetMonth && matchesCategory
      ? total + Number(transaction.amount || 0)
      : total
  }, 0)
}


  // Add a transaction.
  async function handleAddTransaction(event) {
    event.preventDefault()
    setTransactionError('')
    setTransactionMessage('')

    if (!title.trim() || !amount || Number(amount) <= 0 || !date) {
      setTransactionError(
        'Enter a title, a positive amount, and a valid date.'
      )
      return
    }

    setSavingTransaction(true)

    try {
      const token = sessionStorage.getItem('smartspendToken')

      const response = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          amount: Number(amount),
          type,
          category,
          date,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.status === 401 || response.status === 403) {
        handleSessionExpired()
        return
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Could not save transaction (${response.status}).`
        )
      }

      setTitle('')
      setAmount('')
      setType('EXPENSE')
      setCategory('Food')
      setDate(getToday())
      setTransactionMessage('Transaction added successfully!')
      showToast('Transaction added successfully!', 'success')

      await loadTransactions()
    } catch (error) {
      setTransactionError(
        error.message === 'Failed to fetch'
          ? 'Cannot connect to the backend.'
          : error.message
      )
      showToast(
        error.message === 'Failed to fetch'
          ? 'Cannot connect to the backend.'
          : error.message,
        'error'
      )
    } finally {
      setSavingTransaction(false)
    }
  }

  // Delete a transaction.
  async function handleDeleteTransaction(id) {
    if (!id || deletingId) return

    const confirmed = window.confirm(
      'Are you sure you want to delete this transaction?'
    )

    if (!confirmed) return

    setTransactionError('')
    setTransactionMessage('')
    setDeletingId(id)

    try {
      const token = sessionStorage.getItem('smartspendToken')

      const response = await fetch(
        `${API_URL}/api/transactions/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.status === 401 || response.status === 403) {
        handleSessionExpired()
        return
      }

      if (!response.ok) {
        throw new Error(
          `Could not delete transaction (${response.status}).`
        )
      }

      setTransactions((current) =>
        current.filter((transaction) => transaction.id !== id)
      )

      setTransactionMessage('Transaction deleted successfully!')
      showToast('Transaction deleted successfully!', 'success')
    } catch (error) {
      setTransactionError(
        error.message === 'Failed to fetch'
          ? 'Cannot connect to the backend.'
          : error.message
      )
      showToast(
        error.message === 'Failed to fetch'
          ? 'Cannot connect to the backend.'
          : error.message,
        'error'
      )
    } finally {
      setDeletingId(null)
    }
  }

  // Open a transaction in the edit form.
  function handleEditTransaction(transaction) {
    setEditingId(transaction.id)
    setEditTitle(transaction.title || '')
    setEditAmount(String(transaction.amount ?? ''))
    setEditType(transaction.type?.toUpperCase() || 'EXPENSE')
    setEditCategory(transaction.category || 'Other')
    setEditDate(
      typeof transaction.date === 'string'
        ? transaction.date.slice(0, 10)
        : ''
    )
    setTransactionError('')
    setTransactionMessage('')
  }

  // Close the edit form without saving.
  function handleCancelEdit() {
    setEditingId(null)
    setEditTitle('')
    setEditAmount('')
    setEditType('EXPENSE')
    setEditCategory('Food')
    setEditDate('')
    setTransactionError('')
  }

  // Send the updated transaction to the backend.
  async function handleUpdateTransaction(event) {
    event.preventDefault()

    if (!editingId) return

    if (
      !editTitle.trim() ||
      !editAmount ||
      !Number.isFinite(Number(editAmount)) ||
      Number(editAmount) <= 0 ||
      !editDate
    ) {
      setTransactionError(
        'Enter a title, a positive amount, and a valid date.'
      )
      return
    }

    setUpdatingTransaction(true)
    setTransactionError('')
    setTransactionMessage('')

    try {
      const token = sessionStorage.getItem('smartspendToken')

      const response = await fetch(
        `${API_URL}/api/transactions/${encodeURIComponent(editingId)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editTitle.trim(),
            amount: Number(editAmount),
            type: editType,
            category: editCategory,
            date: editDate,
          }),
        }
      )

      const data = await response.json().catch(() => ({}))

      if (response.status === 401 || response.status === 403) {
        handleSessionExpired()
        return
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Could not update transaction (${response.status}).`
        )
      }

      setEditingId(null)
      setEditTitle('')
      setEditAmount('')
      setEditDate('')
      setTransactionMessage('Transaction updated successfully!')
      showToast('Transaction updated successfully!', 'success')

      await loadTransactions()
    } catch (error) {
      setTransactionError(
        error.message === 'Failed to fetch'
          ? 'Cannot connect to the backend. Check that Spring Boot is running.'
          : error.message
      )
      showToast(
        error.message === 'Failed to fetch'
          ? 'Cannot connect to the backend. Check that Spring Boot is running.'
          : error.message,
        'error'
      )
    } finally {
      setUpdatingTransaction(false)
    }
  }

  // Clear the session if the backend rejects the token.
  function handleSessionExpired() {
    sessionStorage.removeItem('smartspendToken')
    sessionStorage.removeItem('smartspendName')
    setAuthenticated(false)
    setTransactions([])
    setBudgets([])
    setEditingId(null)
    setMessageType('error')
    setMessage('Your session has expired. Please sign in again.')
  }

  // Sign out.
  function handleLogout() {
    sessionStorage.removeItem('smartspendToken')
    sessionStorage.removeItem('smartspendName')

    setAuthenticated(false)
    setTransactions([])
    setBudgets([])
    setEditingId(null)
    setPassword('')
    setMessage('')
    setTransactionError('')
    setTransactionMessage('')
    setMode('login')
  }

  // Calculate totals from all transactions, regardless of filters.
  const incomeTotal = transactions.reduce(
    (total, transaction) =>
      transaction.type?.toUpperCase() === 'INCOME'
        ? total + Number(transaction.amount || 0)
        : total,
    0
  )

  const expenseTotal = transactions.reduce(
    (total, transaction) =>
      transaction.type?.toUpperCase() === 'EXPENSE'
        ? total + Number(transaction.amount || 0)
        : total,
    0
  )

  const balance = incomeTotal - expenseTotal

  // Filter transactions by type, category, and date.
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesType =
      filterType === 'ALL' ||
      transaction.type?.toUpperCase() === filterType

    const matchesCategory =
      filterCategory === 'ALL' ||
      transaction.category === filterCategory

    const matchesDate =
      !filterDate || transaction.date === filterDate

    return matchesType && matchesCategory && matchesDate
  })
  // Get the five most recent transactions.
  const recentTransactions = [...transactions]
    .sort((a, b) => {
      const dateA = new Date(
        `${String(a.date || '').slice(0, 10)}T00:00:00`
      ).getTime()

      const dateB = new Date(
        `${String(b.date || '').slice(0, 10)}T00:00:00`
      ).getTime()

      return dateB - dateA
    })
    .slice(0, 5)

  // Reset filters.
  function resetFilters() {
    setFilterType('ALL')
    setFilterCategory('ALL')
    setFilterDate('')
  }

  // Loading screen while restoring the session.
  if (authChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-emerald-50 px-5 text-slate-700">
        <p className="rounded-xl bg-white px-6 py-4 shadow-sm">
          Checking your SmartSpend session...
        </p>
      </main>
    )
  }

  // Login and registration page.
  if (!authenticated) {
    return (
      <main className="auth-page">
        <AnimatedBackground />

        <section
          className="auth-card auth-card-single"
          aria-label="SmartSpend authentication"
        >
          <div className="auth-form-panel">
            <div className="auth-form">
              <div className="brand-logo auth-logo">
                <span className="brand-icon" aria-hidden="true">
                  S
                </span>
                <span>SmartSpend</span>
              </div>

              <p className="auth-eyebrow">
                SmartSpend · Personal finance
              </p>

              <h2>
                {mode === 'login'
                  ? 'Welcome back'
                  : 'Create your account'}
              </h2>

              <p className="auth-subtitle">
                {mode === 'login'
                  ? 'Sign in to see your workspace.'
                  : 'Start your journey to better money habits.'}
              </p>

              <form onSubmit={handleSubmit}>
                {mode === 'register' && (
                  <div className="auth-field">
                    <label htmlFor="name">Full name</label>
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      required
                      minLength={2}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                )}

                <div className="auth-field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    autoComplete={
                      mode === 'login'
                        ? 'current-password'
                        : 'new-password'
                    }
                    required
                    minLength={mode === 'register' ? 8 : undefined}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={
                      mode === 'register'
                        ? 'At least 8 characters'
                        : 'Enter your password'
                    }
                  />

                  {mode === 'register' && (
                    <p className="auth-help">
                      Use at least 8 characters.
                    </p>
                  )}
                </div>

                {message && (
                  <p
                    role="alert"
                    className={`auth-message ${messageType}`}
                  >
                    {message}
                  </p>
                )}

                <button
                  className="auth-submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? 'Please wait...'
                    : mode === 'login'
                      ? 'Sign in'
                      : 'Create account'}
                  {!loading && <span aria-hidden="true">&nbsp; →</span>}
                </button>
              </form>

              <p className="auth-switch">
                {mode === 'login'
                  ? 'New to SmartSpend?'
                  : 'Already have an account?'}{' '}

                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login')
                    setMessage('')
                    setMessageType('success')
                  }}
                >
                  {mode === 'login'
                    ? 'Create an account'
                    : 'Sign in'}
                </button>
              </p>

              <p className="auth-note">
                Your money, in perspective.
              </p>
            </div>
          </div>
        </section>
      </main>
    )
  }

  // SmartSpend dashboard.
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-emerald-50 to-green-100 px-4 py-8 text-slate-800 sm:px-8">
      <AnimatedBackground />

      {/* Toast notification */}
{toast && (
  <div
    role="status"
    aria-live="polite"
    className={`fixed right-4 top-4 z-50 flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-xl ${
      toast.type === 'success'
        ? 'border-emerald-200 bg-white text-emerald-800'
        : 'border-rose-200 bg-white text-rose-800'
    }`}
  >
    <span className="text-xl">
      {toast.type === 'success' ? '✓' : '⚠'}
    </span>

    <p className="flex-1 text-sm font-semibold">
      {toast.message}
    </p>

    <button
      type="button"
      onClick={() => setToast(null)}
      aria-label="Close notification"
      className="text-lg opacity-60 hover:opacity-100"
    >
      ×
    </button>
  </div>
)}

      <div className="relative z-10 mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/70 bg-white/85 p-5 shadow-lg backdrop-blur-md">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              PERSONAL FINANCE
            </p>

            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              SmartSpend 🌱
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Welcome, {name || 'there'}!
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Logout
          </button>
        </header>
                {/* Summary cards */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-md backdrop-blur-md">
            <p className="text-sm font-medium text-slate-500">
              Total income
            </p>
            <p className="mt-2 break-words text-2xl font-bold text-emerald-700">
              {formatCurrency(incomeTotal)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-md backdrop-blur-md">
            <p className="text-sm font-medium text-slate-500">
              Total expenses
            </p>
            <p className="mt-2 break-words text-2xl font-bold text-rose-700">
              {formatCurrency(expenseTotal)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-md backdrop-blur-md">
            <p className="text-sm font-medium text-slate-500">
              Remaining balance
            </p>
            <p className="mt-2 break-words text-2xl font-bold text-slate-800">
              {formatCurrency(balance)}
            </p>
          </div>
        </section>

        {/* Financial charts and spending insights */}
        <SpendingCharts
          transactions={transactions}
          formatCurrency={formatCurrency}
        />

        {/* Recent transactions */}
        <section className="mb-8 rounded-2xl border border-white/70 bg-white/90 p-5 shadow-lg backdrop-blur-md sm:p-7">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Your latest activity
            </p>

            <h2 className="mt-1 text-xl font-bold sm:text-2xl">
              Recent transactions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your five most recent income and expense records.
            </p>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">
              <p className="text-3xl">📒</p>

              <p className="mt-2 font-semibold text-slate-700">
                No recent transactions
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Your latest transactions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <article
                  key={transaction.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-4"
                >
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-slate-800">
                      {transaction.title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {transaction.category || 'Other'} ·{' '}
                      {transaction.date
                        ? new Date(
                            `${String(transaction.date).slice(0, 10)}T00:00:00`
                          ).toLocaleDateString('en-IN')
                        : 'No date'}
                    </p>
                  </div>

                  <p
                    className={`font-bold ${
                      transaction.type?.toUpperCase() === 'INCOME'
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {transaction.type?.toUpperCase() === 'INCOME'
                      ? '+ '
                      : '- '}
                    {formatCurrency(transaction.amount)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Monthly budget management */}


        <section className="mb-8 rounded-2xl border border-white/70 bg-white/90 p-5 shadow-lg backdrop-blur-md sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Plan your spending
              </p>
              <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                Monthly budget
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Set an overall limit and separate limits for spending categories.
              </p>
            </div>

            <div className="w-full sm:w-auto">
              <label
                htmlFor="budget-month"
                className="mb-1 block text-sm font-medium"
              >
                Select month
              </label>

              <input
                id="budget-month"
                type="month"
                value={budgetMonth}
                onChange={(event) => {
                  setBudgetMonth(event.target.value)
                  setBudgetMessage('')
                  setBudgetError('')
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-emerald-500 sm:w-48"
              />
            </div>
          </div>

          {/* Add budget form */}
          <form
            onSubmit={handleSaveBudget}
            className="mt-6 grid grid-cols-1 gap-4 rounded-xl bg-emerald-50/70 p-4 sm:grid-cols-3"
          >
            <div>
              <label
                htmlFor="budget-category"
                className="mb-1 block text-sm font-medium"
              >
                Budget category
              </label>

              <select
                id="budget-category"
                value={budgetCategory}
                onChange={(event) => setBudgetCategory(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-emerald-500"
              >
                <option value="OVERALL">
                  Overall monthly budget
                </option>
                <option value="Food">Food</option>
                <option value="Shopping">Shopping</option>
                <option value="Transport">Transport</option>
                <option value="Bills">Bills</option>
                <option value="Health">Health</option>
                <option value="Education">Education</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="budget-amount"
                className="mb-1 block text-sm font-medium"
              >
                Budget amount (₹)
              </label>

              <input
                id="budget-amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={budgetAmount}
                onChange={(event) => setBudgetAmount(event.target.value)}
                placeholder="e.g. 15000"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={savingBudget}
                className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingBudget ? 'Saving...' : 'Save budget'}
              </button>
            </div>
          </form>

          {/* Budget messages */}
          {budgetError && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {budgetError}
            </p>
          )}

          {budgetMessage && (
            <p
              role="status"
              className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              {budgetMessage}
            </p>
          )}

          {/* Budget cards */}
          <div className="mt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold">Your budgets</h3>

              <button
                type="button"
                onClick={loadBudgets}
                disabled={budgetLoading}
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
              >
                {budgetLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {budgetLoading ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Loading budgets...
              </p>
            ) : budgets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">
                <p className="text-3xl">🎯</p>
                <p className="mt-2 font-semibold">
                  No budgets for this month yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Create an overall or category budget using the form above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {budgets.map((budget) => {
                  const spent = getBudgetSpent(budget)
                  const limit = Number(budget.amount || 0)
                  const percentage =
                    limit > 0 ? (spent / limit) * 100 : 0

                  const progressWidth = Math.min(percentage, 100)
                  const isOverBudget = percentage > 100
                  const isNearLimit =
                    percentage >= 80 && !isOverBudget

                  return (
                    <article
                      key={budget.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">
                            {budget.category === 'OVERALL'
                              ? 'Overall monthly budget'
                              : budget.category}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {budget.month}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteBudget(budget.id)}
                          disabled={deletingBudgetId !== null}
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          {deletingBudgetId === budget.id
                            ? 'Deleting...'
                            : 'Delete'}
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
                        <div>
                          <p className="text-xs text-slate-500">
                            Spent
                          </p>

                          <p className="mt-1 text-lg font-bold text-slate-800">
                            {formatCurrency(spent)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-slate-500">
                            Budget limit
                          </p>

                          <p className="mt-1 font-semibold">
                            {formatCurrency(limit)}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOverBudget
                              ? 'bg-rose-600'
                              : isNearLimit
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                          }`}
                          style={{
                            width: `${progressWidth}%`,
                          }}
                        />
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span
                          className={
                            isOverBudget
                              ? 'font-semibold text-rose-700'
                              : isNearLimit
                                ? 'font-semibold text-amber-700'
                                : 'text-slate-500'
                          }
                        >
                          {percentage.toFixed(1)}% used
                        </span>

                        <span
                          className={`font-semibold ${
                            isOverBudget
                              ? 'text-rose-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {isOverBudget
                            ? `${formatCurrency(spent - limit)} over budget`
                            : `${formatCurrency(limit - spent)} remaining`}
                        </span>
                      </div>

                      {isOverBudget && (
                        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                          You've exceeded this budget.
                        </p>
                      )}

                      {isNearLimit && (
                        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                          You've used at least 80% of this budget.
                        </p>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Add transaction form */}
        <section className="mb-8 rounded-2xl border border-white/70 bg-white/90 p-5 shadow-lg backdrop-blur-md sm:p-7">
          <h2 className="text-xl font-bold">
            Add a transaction
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Record your income or expenses.
          </p>

          <form
            onSubmit={handleAddTransaction}
            className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <label
                htmlFor="transaction-title"
                className="mb-1 block text-sm font-medium"
              >
                Transaction title
              </label>

              <input
                id="transaction-title"
                type="text"
                required
                maxLength={100}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Groceries"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="transaction-amount"
                className="mb-1 block text-sm font-medium"
              >
                Amount (₹)
              </label>

              <input
                id="transaction-amount"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="e.g. 500"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label
                htmlFor="transaction-type"
                className="mb-1 block text-sm font-medium"
              >
                Type
              </label>

              <select
                id="transaction-type"
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="transaction-category"
                className="mb-1 block text-sm font-medium"
              >
                Category
              </label>

              <select
                id="transaction-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
              >
                <option value="Food">Food</option>
                <option value="Salary">Salary</option>
                <option value="Shopping">Shopping</option>
                <option value="Transport">Transport</option>
                <option value="Bills">Bills</option>
                <option value="Health">Health</option>
                <option value="Education">Education</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="transaction-date"
                className="mb-1 block text-sm font-medium"
              >
                Date
              </label>

              <input
                id="transaction-date"
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500 sm:max-w-xs"
              />
            </div>

            <button
              type="submit"
              disabled={savingTransaction}
              className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
            >
              {savingTransaction
                ? 'Saving...'
                : '+ Add transaction'}
            </button>
          </form>

          {transactionMessage && (
            <p
              role="status"
              className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
            >
              {transactionMessage}
            </p>
          )}

          {transactionError && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
            >
              {transactionError}
            </p>
          )}
        </section>
                {/* Transaction history */}
        <section className="mb-8 rounded-2xl border border-white/70 bg-white/90 p-5 shadow-lg backdrop-blur-md sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Your records
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Transaction history
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage and review your income and expenses.
              </p>
            </div>

            <button
              type="button"
              onClick={loadTransactions}
              disabled={transactionLoading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {transactionLoading ? 'Refreshing...' : '↻ Refresh'}
            </button>
          </div>

          {/* Filters */}
          <div className="mt-6 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="filter-type"
                className="mb-1 block text-sm font-medium"
              >
                Filter by type
              </label>

              <select
                id="filter-type"
                value={filterType}
                onChange={(event) => setFilterType(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-500"
              >
                <option value="ALL">All types</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-category"
                className="mb-1 block text-sm font-medium"
              >
                Filter by category
              </label>

              <select
                id="filter-category"
                value={filterCategory}
                onChange={(event) =>
                  setFilterCategory(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-500"
              >
                <option value="ALL">All categories</option>
                <option value="Food">Food</option>
                <option value="Salary">Salary</option>
                <option value="Shopping">Shopping</option>
                <option value="Transport">Transport</option>
                <option value="Bills">Bills</option>
                <option value="Health">Health</option>
                <option value="Education">Education</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-date"
                className="mb-1 block text-sm font-medium"
              >
                Filter by date
              </label>

              <input
                id="filter-date"
                type="date"
                value={filterDate}
                onChange={(event) => setFilterDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-3">
              <p className="text-sm text-slate-500">
                Showing{' '}
                <strong>{filteredTransactions.length}</strong> of{' '}
                <strong>{transactions.length}</strong> transactions
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Clear filters
              </button>
            </div>
          </div>

          {/* Transaction loading and error messages */}
          {transactionError && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
            >
              {transactionError}
            </p>
          )}

          {transactionMessage && (
            <p
              role="status"
              className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"
            >
              {transactionMessage}
            </p>
          )}

          {/* Transaction list */}
          <div className="mt-5 space-y-3">
            {transactionLoading && transactions.length === 0 ? (
              <p className="py-8 text-center text-slate-500">
                Loading transactions...
              </p>
            ) : filteredTransactions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center">
                <p className="text-3xl">📒</p>

                <p className="mt-2 font-semibold text-slate-700">
                  No transactions found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Add a transaction or change your filters.
                </p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <article
                  key={transaction.id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  {editingId === transaction.id ? (
                    /* Edit transaction form */
                    <form
                      onSubmit={handleUpdateTransaction}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-emerald-800">
                          Edit transaction
                        </h3>

                        <span className="text-xs text-slate-500">
                          Editing record
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor={`edit-title-${transaction.id}`}
                            className="mb-1 block text-sm font-medium"
                          >
                            Title
                          </label>

                          <input
                            id={`edit-title-${transaction.id}`}
                            type="text"
                            required
                            value={editTitle}
                            onChange={(event) =>
                              setEditTitle(event.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`edit-amount-${transaction.id}`}
                            className="mb-1 block text-sm font-medium"
                          >
                            Amount (₹)
                          </label>

                          <input
                            id={`edit-amount-${transaction.id}`}
                            type="number"
                            required
                            min="0.01"
                            step="0.01"
                            value={editAmount}
                            onChange={(event) =>
                              setEditAmount(event.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`edit-type-${transaction.id}`}
                            className="mb-1 block text-sm font-medium"
                          >
                            Type
                          </label>

                          <select
                            id={`edit-type-${transaction.id}`}
                            value={editType}
                            onChange={(event) =>
                              setEditType(event.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500"
                          >
                            <option value="INCOME">Income</option>
                            <option value="EXPENSE">Expense</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor={`edit-category-${transaction.id}`}
                            className="mb-1 block text-sm font-medium"
                          >
                            Category
                          </label>

                          <select
                            id={`edit-category-${transaction.id}`}
                            value={editCategory}
                            onChange={(event) =>
                              setEditCategory(event.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500"
                          >
                            <option value="Food">Food</option>
                            <option value="Salary">Salary</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Transport">Transport</option>
                            <option value="Bills">Bills</option>
                            <option value="Health">Health</option>
                            <option value="Education">Education</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor={`edit-date-${transaction.id}`}
                            className="mb-1 block text-sm font-medium"
                          >
                            Date
                          </label>

                          <input
                            id={`edit-date-${transaction.id}`}
                            type="date"
                            required
                            value={editDate}
                            onChange={(event) =>
                              setEditDate(event.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {transactionError && (
                        <p
                          role="alert"
                          className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
                        >
                          {transactionError}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={updatingTransaction}
                          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                        >
                          {updatingTransaction
                            ? 'Saving...'
                            : 'Save changes'}
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={updatingTransaction}
                          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Normal transaction display */
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words font-semibold text-slate-800">
                            {transaction.title}
                          </h3>

                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              transaction.type?.toUpperCase() === 'INCOME'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {transaction.type}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {transaction.category || 'Other'} ·{' '}
                          {transaction.date
                            ? new Date(
                                `${transaction.date.slice(0, 10)}T00:00:00`
                              ).toLocaleDateString('en-IN')
                            : 'No date'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                        <p
                          className={`text-lg font-bold ${
                            transaction.type?.toUpperCase() === 'INCOME'
                              ? 'text-emerald-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {transaction.type?.toUpperCase() === 'INCOME'
                            ? '+ '
                            : '- '}
                          {formatCurrency(transaction.amount)}
                        </p>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleEditTransaction(transaction)
                            }
                            disabled={editingId !== null}
                            className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-40"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteTransaction(transaction.id)
                            }
                            disabled={deletingId !== null}
                            className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-40"
                          >
                            {deletingId === transaction.id
                              ? 'Deleting...'
                              : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="pb-5 text-center text-sm text-slate-500">
          <p>SmartSpend · Take control of your finances 🌱</p>
        </footer>
      </div>
    </main>
  )
}

export default App
