
import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'

const COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
  '#64748b',
]

export default function SpendingCharts({
  transactions = [],
  formatCurrency = (amount) => `₹${amount}`,
}) {
  const { income, expenses, categoryData, monthlyData } = useMemo(() => {
    const incomeTransactions = transactions.filter(
      (transaction) => transaction.type === 'INCOME'
    )

    const expenseTransactions = transactions.filter(
      (transaction) => transaction.type === 'EXPENSE'
    )

    const totalIncome = incomeTransactions.reduce(
      (total, transaction) => total + Number(transaction.amount || 0),
      0
    )

    const totalExpenses = expenseTransactions.reduce(
      (total, transaction) => total + Number(transaction.amount || 0),
      0
    )

    const categories = {}

    expenseTransactions.forEach((transaction) => {
      const category = transaction.category || 'Other'
      categories[category] =
        (categories[category] || 0) + Number(transaction.amount || 0)
    })

    const categoryChartData = Object.entries(categories).map(
      ([name, value]) => ({ name, value })
    )

    const months = {}

    transactions.forEach((transaction) => {
      if (!transaction.date) return

      const monthKey = transaction.date.substring(0, 7)
      const monthLabel = new Date(
        `${monthKey}-01T00:00:00`
      ).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      })

      if (!months[monthKey]) {
        months[monthKey] = {
          monthKey,
          month: monthLabel,
          income: 0,
          expenses: 0,
        }
      }

      const amount = Number(transaction.amount || 0)

      if (transaction.type === 'INCOME') {
        months[monthKey].income += amount
      } else if (transaction.type === 'EXPENSE') {
        months[monthKey].expenses += amount
      }
    })

    const monthChartData = Object.values(months).sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey)
    )

    return {
      income: totalIncome,
      expenses: totalExpenses,
      categoryData: categoryChartData,
      monthlyData: monthChartData,
    }
  }, [transactions])

  const chartCard =
    'rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-md'

  const heading =
    'mb-4 text-lg font-semibold text-white'

  const tooltipStyle = {
    backgroundColor: '#111827',
    border: '1px solid #374151',
    borderRadius: '10px',
    color: '#ffffff',
  }

  if (transactions.length === 0) {
    return (
      <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <h2 className="mb-2 text-xl font-semibold text-white">
          Financial Insights
        </h2>
        <p className="text-sm text-gray-300">
          Add your first income or expense to see your charts here.
        </p>
      </section>
    )
  }

  return (
    <section className="mb-8 space-y-6">
      <div>
        <h2 className="mb-1 text-2xl font-bold text-white">
          Financial Insights
        </h2>
        <p className="text-sm text-gray-300">
          Understand your income, expenses, and monthly spending.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={chartCard}>
          <h3 className={heading}>Income vs Expenses</h3>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Income', amount: income },
                  { name: 'Expenses', amount: expenses },
                ]}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                />
                <XAxis dataKey="name" stroke="#d1d5db" />
                <YAxis
                  stroke="#d1d5db"
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Legend />
                <Bar
                  dataKey="amount"
                  name="Amount"
                  fill="#818cf8"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={chartCard}>
          <h3 className={heading}>Expense Breakdown</h3>

          {categoryData.length === 0 ? (
            <p className="py-16 text-center text-gray-300">
              Add an expense to see category-wise spending.
            </p>
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={48}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 space-y-2">
                {categoryData.map((category, index) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex items-center gap-2 text-gray-200">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            COLORS[index % COLORS.length],
                        }}
                      />
                      {category.name}
                    </span>
                    <span className="font-medium text-white">
                      {formatCurrency(category.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className={chartCard}>
        <h3 className={heading}>Monthly Money Trend</h3>

        {monthlyData.length === 0 ? (
          <p className="py-12 text-center text-gray-300">
            Add transactions with dates to see your monthly trend.
          </p>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                />
                <XAxis dataKey="month" stroke="#d1d5db" />
                <YAxis
                  stroke="#d1d5db"
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#f87171"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-gray-300">Total Income</p>
          <p className="mt-2 text-xl font-bold text-emerald-400">
            {formatCurrency(income)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-gray-300">Total Expenses</p>
          <p className="mt-2 text-xl font-bold text-red-400">
            {formatCurrency(expenses)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-gray-300">Remaining Balance</p>
          <p
            className={`mt-2 text-xl font-bold ${
              income - expenses >= 0
                ? 'text-emerald-400'
                : 'text-red-400'
            }`}
          >
            {formatCurrency(income - expenses)}
          </p>
        </div>
      </div>
    </section>
  )
}
