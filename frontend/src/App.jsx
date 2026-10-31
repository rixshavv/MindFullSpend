import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from "recharts";
import {
  ArrowUpRight, CalendarDays, Check, CircleDollarSign, CreditCard,
  LayoutDashboard, LogOut, Pencil, Plus, Search, ShieldCheck, Sparkles,
  Target, Trash2, TrendingUp,
  Wallet, X
} from "lucide-react";
import api from "./api";

const CATEGORIES = [
  ["FOOD_DINING", "Food & dining", "#F59E0B"],
  ["TRANSPORT", "Transport", "#3B82F6"],
  ["SHOPPING", "Shopping", "#8B5CF6"],
  ["BILLS_UTILITIES", "Bills & utilities", "#14B8A6"],
  ["HEALTH", "Health", "#EC4899"],
  ["ENTERTAINMENT", "Entertainment", "#F97316"],
  ["EDUCATION", "Education", "#6366F1"],
  ["TRAVEL", "Travel", "#06B6D4"],
  ["OTHER", "Other", "#94A3B8"]
];

const categoryName = (value) =>
  CATEGORIES.find(([key]) => key === value)?.[1] || value || "Other";

const categoryColor = (value) =>
  CATEGORIES.find(([key]) => key === value)?.[2] || "#94A3B8";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0
  }).format(Number(value || 0));

const localMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const monthBounds = (value) => {
  const [year, month] = value.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    year, month,
    from: `${value}-01`,
    to: `${value}-${String(lastDay).padStart(2, "0")}`
  };
};

function getError(error) {
  return error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong. Please try again.";
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("spendwise_token");
    if (!token) {
      setCheckingSession(false);
      return;
    }
    api.get("/auth/me")
      .then(({ data }) => setUser(data))
      .catch(() => localStorage.removeItem("spendwise_token"))
      .finally(() => setCheckingSession(false));
  }, []);

  const handleAuthenticated = (authData) => {
    localStorage.setItem("spendwise_token", authData.accessToken);
    setUser(authData.user);
  };

  const logout = () => {
    localStorage.removeItem("spendwise_token");
    setUser(null);
  };

  if (checkingSession) {
    return <div className="screen-loader"><div className="loader-ring" /><span>Preparing your workspace…</span></div>;
  }

  return user
    ? <Dashboard user={user} onLogout={logout} />
    : <AuthScreen onAuthenticated={handleAuthenticated} />;
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload = mode === "login"
        ? { email: form.email, password: form.password }
        : form;
      const { data } = await api.post(endpoint, payload);
      onAuthenticated(data);
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-decoration decoration-one" />
      <div className="auth-decoration decoration-two" />
      <section className="auth-card">
        <div className="auth-brand"><div className="brand-mark"><Wallet size={21} /></div><span>spendwise</span></div>
        <div className="auth-copy">
          <div className="eyebrow"><Sparkles size={13} /> YOUR MONEY, IN FOCUS</div>
          <h1>{mode === "login" ? "Welcome back." : "Make money feel simple."}</h1>
          <p>{mode === "login" ? "Sign in to see where your money is going." : "Create an account and start building better money habits."}</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && (
            <label>Full name<input name="fullName" value={form.fullName} onChange={change} placeholder="Your name" autoComplete="name" required maxLength={100} /></label>
          )}
          <label>Email address<input name="email" type="email" value={form.email} onChange={change} placeholder="you@example.com" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" value={form.password} onChange={change} placeholder="At least 8 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required /></label>
          {error && <div className="form-error">{error}</div>}
          <button className="button button-primary auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"} <ArrowUpRight size={16} /></button>
        </form>
        <p className="auth-switch">
          {mode === "login" ? "New to SpendWise?" : "Already have an account?"}
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
        <div className="auth-foot"><ShieldCheck size={14} /> Your account is protected with encrypted passwords and JWT authentication.</div>
      </section>
      <aside className="auth-promo">
        <div className="promo-orb orb-a" /><div className="promo-orb orb-b" />
        <div className="promo-content">
          <span className="promo-kicker">A clearer view of your finances</span>
          <h2>Small insights.<br />Smarter money<br /><em>decisions.</em></h2>
          <p>Track everyday spending, set monthly limits and build a financial picture that makes sense.</p>
          <div className="promo-mini">
            <div className="promo-mini-icon"><TrendingUp size={18} /></div>
            <div><b>Make progress visible</b><span>Understand your spending patterns month by month.</span></div>
          </div>
        </div>
        <div className="promo-bottom"><span>SPENDWISE PERSONAL FINANCE</span><span>01 / 01</span></div>
      </aside>
    </main>
  );
}

function Dashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState("Overview");
  const [selectedMonth, setSelectedMonth] = useState(localMonth());
  const [dashboard, setDashboard] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [budgetInput, setBudgetInput] = useState("");
  const [budgetBusy, setBudgetBusy] = useState(false);

  const bounds = useMemo(() => monthBounds(selectedMonth), [selectedMonth]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardResult, expensesResult] = await Promise.all([
        api.get("/dashboard", { params: { year: bounds.year, month: bounds.month } }),
        api.get("/expenses", { params: { from: bounds.from, to: bounds.to } })
      ]);
      setDashboard(dashboardResult.data);
      setExpenses(expensesResult.data);
      setBudgetInput(Number(dashboardResult.data.monthlyBudget || 0) || "");
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }, [bounds.year, bounds.month, bounds.from, bounds.to]);

  useEffect(() => { refresh(); }, [refresh]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const saveBudget = async (event) => {
    event.preventDefault();
    const amount = Number(budgetInput);
    if (!Number.isFinite(amount) || amount <= 0) {
      notify("Enter a budget greater than zero.");
      return;
    }
    setBudgetBusy(true);
    try {
      await api.put("/budgets", {
        year: bounds.year, month: bounds.month, amount
      });
      await refresh();
      notify("Monthly budget saved.");
    } catch (err) {
      notify(getError(err));
    } finally {
      setBudgetBusy(false);
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm("Delete this expense? This action cannot be undone.")) return;
    try {
      await api.delete(`/expenses/${id}`);
      await refresh();
      notify("Expense deleted.");
    } catch (err) {
      notify(getError(err));
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesText = `${expense.description} ${expense.notes || ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || expense.category === categoryFilter;
    return matchesText && matchesCategory;
  });

  const budget = Number(dashboard?.monthlyBudget || 0);
  const spent = Number(dashboard?.totalSpent || 0);
  const budgetPercent = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const initials = user.fullName.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="side-brand"><div className="brand-mark"><Wallet size={20} /></div><span>spendwise</span></div>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav">
          <button className={activePage === "Overview" ? "nav-link active" : "nav-link"} onClick={() => setActivePage("Overview")}><LayoutDashboard size={18} /> Overview</button>
          <button className={activePage === "Transactions" ? "nav-link active" : "nav-link"} onClick={() => setActivePage("Transactions")}><CreditCard size={18} /> Transactions</button>
          <button className={activePage === "Budgets" ? "nav-link active" : "nav-link"} onClick={() => setActivePage("Budgets")}><Target size={18} /> Budgets</button>
        </nav>
        <div className="side-tip">
          <div className="tip-icon"><Sparkles size={16} /></div>
          <b>Build a better habit</b>
          <p>A quick review of your spending each week can help you stay intentional.</p>
        </div>
        <div className="side-account">
          <div className="avatar">{initials}</div>
          <div className="account-copy"><b>{user.fullName}</b><span>Personal account</span></div>
          <button className="icon-button logout-button" title="Sign out" onClick={onLogout}><LogOut size={16} /></button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="page-heading">
            <div className="breadcrumb">PERSONAL FINANCE <span>/</span> {activePage.toUpperCase()}</div>
            <h1>{activePage === "Overview" ? "Good to see you" : activePage}</h1>
            <p>{activePage === "Overview" ? "Here’s your financial snapshot for the month." : activePage === "Transactions" ? "Review and manage your spending activity." : "Set a monthly target and keep your spending on track."}</p>
          </div>
          <div className="topbar-actions">
            <label className="month-picker"><CalendarDays size={16} /><input type="month" value={selectedMonth} onChange={event => setSelectedMonth(event.target.value)} /></label>
            <button className="button button-primary add-button" onClick={() => setModal({ mode: "create" })}><Plus size={17} /> Add expense</button>
            <div className="avatar top-avatar" title={user.fullName}>{initials}</div>
          </div>
        </header>

        {error && <div className="page-error">{error}<button onClick={refresh}>Retry</button></div>}
        {loading && !dashboard ? (
          <div className="loading-panel"><div className="loader-ring" /> Loading your financial overview…</div>
        ) : (
          <>
            {activePage === "Overview" && dashboard && (
              <Overview
                dashboard={dashboard}
                budget={budget}
                spent={spent}
                budgetPercent={budgetPercent}
                onEditBudget={() => setActivePage("Budgets")}
                onAddExpense={() => setModal({ mode: "create" })}
                onViewTransactions={() => setActivePage("Transactions")}
                onEdit={(expense) => setModal({ mode: "edit", expense })}
                onDelete={deleteExpense}
              />
            )}

            {activePage === "Transactions" && (
              <section className="panel transactions-panel">
                <div className="section-title-row">
                  <div><span className="eyebrow">YOUR ACTIVITY</span><h2>All transactions</h2><p>{filteredExpenses.length} transactions for the selected month</p></div>
                  <button className="button button-primary" onClick={() => setModal({ mode: "create" })}><Plus size={16} /> Add expense</button>
                </div>
                <div className="table-controls">
                  <div className="search-box"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search expenses…" /></div>
                  <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}><option value="ALL">All categories</option>{CATEGORIES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
                </div>
                <ExpenseTable expenses={filteredExpenses} onEdit={expense => setModal({ mode: "edit", expense })} onDelete={deleteExpense} />
              </section>
            )}

            {activePage === "Budgets" && dashboard && (
              <BudgetPage
                dashboard={dashboard}
                budget={budget}
                spent={spent}
                budgetPercent={budgetPercent}
                value={budgetInput}
                onChange={setBudgetInput}
                onSubmit={saveBudget}
                busy={budgetBusy}
              />
            )}
          </>
        )}

        <footer className="app-footer"><span>SPENDWISE</span><span>Make every rupee count.</span><span>Personal finance workspace</span></footer>
      </main>

      {modal && <ExpenseModal
        mode={modal.mode}
        expense={modal.expense}
        onClose={() => setModal(null)}
        onSaved={async () => { setModal(null); await refresh(); notify(modal.mode === "create" ? "Expense added successfully." : "Expense updated."); }}
      />}
      {toast && <div className="toast"><Check size={16} /> {toast}</div>}
    </div>
  );
}

function Overview({ dashboard, budget, spent, budgetPercent, onEditBudget, onAddExpense, onViewTransactions, onEdit, onDelete }) {
  const categoryData = dashboard.categoryBreakdown || [];
  const dailyData = dashboard.dailySpending || [];
  const remaining = Number(dashboard.remainingBudget || 0);
  const change = Number(dashboard.monthOverMonthChangePercent || 0);

  return (
    <>
      <section className="stats-grid">
        <StatCard label="Total spent" value={currency(spent)} icon={<Wallet size={18} />} tone="blue" footnote="Across recorded expenses" />
        <StatCard label="Monthly budget" value={budget > 0 ? currency(budget) : "Not set"} icon={<Target size={18} />} tone="purple" footnote={budget > 0 ? `${Math.round(budgetPercent)}% of budget used` : "Set a target for this month"} />
        <StatCard label="Budget remaining" value={budget > 0 ? currency(remaining) : "—"} icon={<CircleDollarSign size={18} />} tone={remaining < 0 ? "red" : "green"} footnote={budget > 0 ? remaining < 0 ? "You are over your budget" : "Available to spend" : "Add a monthly budget"} />
        <StatCard label="Transactions" value={dashboard.transactionCount || 0} icon={<CreditCard size={18} />} tone="amber" footnote="This month" />
      </section>

      <section className="charts-grid">
        <article className="panel chart-panel">
          <div className="panel-heading"><div><span className="eyebrow">SPENDING TREND</span><h2>Daily spending</h2><p>How your expenses are adding up this month</p></div><span className="period-pill">DAILY</span></div>
          <div className="chart-area">
            {dailyData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs><linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6D7EF5" stopOpacity={0.22} /><stop offset="95%" stopColor="#6D7EF5" stopOpacity={0.01} /></linearGradient></defs>
                  <CartesianGrid stroke="#edf0f6" strokeDasharray="4 5" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={value => value.slice(-2)} tickLine={false} axisLine={false} tick={{ fill: "#9aa3b5", fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#9aa3b5", fontSize: 10 }} tickFormatter={value => `₹${value}`} />
                  <Tooltip formatter={value => [currency(value), "Spent"]} labelFormatter={value => `Date: ${value}`} contentStyle={{ border: "1px solid #edf0f6", borderRadius: 10, fontSize: 12 }} />
                  <Area type="monotone" dataKey="amount" stroke="#6678ed" strokeWidth={2.5} fill="url(#spendFill)" activeDot={{ r: 5, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyState icon={<TrendingUp size={22} />} title="No spending trend yet" text="Add an expense to see your daily spending chart." />}
          </div>
          <div className="chart-foot"><span><i className="dot dot-blue" /> Daily total</span><span>{dailyData.length} days with activity</span></div>
        </article>

        <article className="panel category-panel">
          <div className="panel-heading"><div><span className="eyebrow">WHERE IT GOES</span><h2>Spending by category</h2><p>Monthly category breakdown</p></div></div>
          {categoryData.length ? (
            <>
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart><Pie data={categoryData} dataKey="amount" nameKey="category" innerRadius={61} outerRadius={85} paddingAngle={3} stroke="none">
                    {categoryData.map(item => <Cell key={item.category} fill={categoryColor(item.category)} />)}
                  </Pie><Tooltip formatter={value => currency(value)} /></PieChart>
                </ResponsiveContainer>
                <div className="donut-label"><b>{currency(spent)}</b><span>TOTAL SPENT</span></div>
              </div>
              <div className="category-legend">
                {categoryData.slice(0, 5).map(item => <div className="legend-row" key={item.category}><i style={{ background: categoryColor(item.category) }} /><span>{categoryName(item.category)}</span><b>{Math.round(Number(item.percentage))}%</b></div>)}
              </div>
            </>
          ) : <EmptyState icon={<CircleDollarSign size={22} />} title="Nothing to break down" text="Your category insights will appear after your first expense." />}
        </article>
      </section>

      <section className="lower-grid">
        <article className="panel recent-panel">
          <div className="panel-heading"><div><span className="eyebrow">LATEST ACTIVITY</span><h2>Recent transactions</h2><p>Your latest recorded expenses</p></div><button className="text-button" onClick={onViewTransactions}>View all <ArrowUpRight size={14} /></button></div>
          <ExpenseTable expenses={dashboard.recentExpenses || []} onEdit={onEdit} onDelete={onDelete} compact />
        </article>
        <article className="panel budget-panel">
          <div className="panel-heading"><div><span className="eyebrow">MONTHLY PLAN</span><h2>Budget progress</h2><p>Keep your month in balance</p></div><button className="icon-button soft" onClick={onEditBudget}><Pencil size={15} /></button></div>
          {budget > 0 ? (
            <>
              <div className="budget-amounts"><div><strong>{currency(spent)}</strong><span>spent</span></div><div className="amount-right"><strong>{currency(budget)}</strong><span>monthly limit</span></div></div>
              <div className="progress-track"><div className={remaining < 0 ? "progress-fill over" : "progress-fill"} style={{ width: `${Math.min(100, budgetPercent)}%` }} /></div>
              <div className="progress-caption"><span>{Math.round(budgetPercent)}% used</span><span>{currency(Math.max(0, remaining))} left</span></div>
              <div className={remaining < 0 ? "budget-callout warning" : "budget-callout"}><Sparkles size={16} /><span>{remaining < 0 ? `You are ${currency(Math.abs(remaining))} over your budget.` : `${currency(remaining)} remaining. Keep it steady.`}</span></div>
            </>
          ) : (
            <div className="budget-empty"><div className="budget-empty-icon"><Target size={24} /></div><b>Your budget, your boundaries.</b><p>Set a monthly spending limit and make your progress visible.</p><button className="button button-primary" onClick={onEditBudget}>Set monthly budget <ArrowUpRight size={15} /></button></div>
          )}
          <div className="insights-list">
            {(dashboard.insights || []).slice(0, 3).map((insight, index) => <div className="insight-row" key={index}><span className="insight-spark"><Sparkles size={13} /></span><p>{insight}</p></div>)}
          </div>
        </article>
      </section>
    </>
  );
}

function StatCard({ label, value, icon, tone, footnote }) {
  return <article className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}>{icon}</span></div><strong>{value}</strong><small>{footnote}</small></article>;
}

function ExpenseTable({ expenses = [], onEdit, onDelete, compact = false }) {
  if (!expenses.length) {
    return <EmptyState icon={<CreditCard size={22} />} title="No transactions found" text="Your expenses will show up here when you add them." />;
  }
  return (
    <div className="table-scroll"><table className="expense-table">
      <thead><tr><th>DESCRIPTION</th><th>CATEGORY</th><th>DATE</th><th>AMOUNT</th><th className="actions-heading">ACTIONS</th></tr></thead>
      <tbody>{expenses.map(expense => <tr key={expense.id}>
        <td><div className="expense-description"><span className="category-icon" style={{ color: categoryColor(expense.category), background: `${categoryColor(expense.category)}18` }}>{categoryName(expense.category).slice(0, 1)}</span><div><b>{expense.description}</b>{!compact && expense.notes && <small>{expense.notes}</small>}</div></div></td>
        <td><span className="category-text">{categoryName(expense.category)}</span></td>
        <td className="date-cell">{expense.date}</td>
        <td className="amount-cell">{currency(expense.amount)}</td>
        <td><div className="row-actions"><button className="icon-button" title="Edit expense" onClick={() => onEdit(expense)}><Pencil size={14} /></button><button className="icon-button danger-hover" title="Delete expense" onClick={() => onDelete(expense.id)}><Trash2 size={14} /></button></div></td>
      </tr>)}</tbody>
    </table></div>
  );
}

function BudgetPage({ dashboard, budget, spent, budgetPercent, value, onChange, onSubmit, busy }) {
  const remaining = budget - spent;
  return (
    <section className="budget-page-grid">
      <article className="panel budget-editor">
        <div className="panel-heading"><div><span className="eyebrow">PLAN WITH PURPOSE</span><h2>Monthly budget</h2><p>Choose a spending limit for the selected month.</p></div><span className="period-pill">{String(dashboard.month).padStart(2, "0")} / {dashboard.year}</span></div>
        <form onSubmit={onSubmit} className="budget-form">
          <label>MONTHLY SPENDING LIMIT <div className="currency-input"><span>₹</span><input type="number" min="1" step="0.01" value={value} onChange={event => onChange(event.target.value)} placeholder="e.g. 30000" required /></div></label>
          <button className="button button-primary" disabled={busy}>{busy ? "Saving…" : "Save monthly budget"} <Check size={16} /></button>
        </form>
        <div className="budget-note"><ShieldCheck size={17} /><p>Your budget is private to your account. You can update it any time during the month.</p></div>
      </article>
      <article className="panel budget-summary">
        <div className="panel-heading"><div><span className="eyebrow">CURRENT POSITION</span><h2>Budget summary</h2><p>Based on saved transactions</p></div></div>
        <div className="summary-big"><span>Spent so far</span><strong>{currency(spent)}</strong></div>
        <div className="summary-line"><span>Budget limit</span><b>{budget > 0 ? currency(budget) : "Not set"}</b></div>
        <div className="summary-line"><span>Remaining</span><b className={remaining < 0 ? "negative-text" : "positive-text"}>{budget > 0 ? currency(remaining) : "—"}</b></div>
        <div className="progress-track large"><div className={remaining < 0 ? "progress-fill over" : "progress-fill"} style={{ width: `${Math.min(100, budgetPercent)}%` }} /></div>
        <div className="progress-caption"><span>{budget > 0 ? `${Math.round(budgetPercent)}% of budget used` : "Set a budget to begin tracking"}</span></div>
        <div className="insights-list">{(dashboard.insights || []).map((text, index) => <div className="insight-row" key={index}><span className="insight-spark"><Sparkles size={13} /></span><p>{text}</p></div>)}</div>
      </article>
    </section>
  );
}

function ExpenseModal({ mode, expense, onClose, onSaved }) {
  const [form, setForm] = useState({
    description: expense?.description || "",
    amount: expense?.amount || "",
    category: expense?.category || "FOOD_DINING",
    date: expense?.date || new Date().toLocaleDateString("en-CA"),
    notes: expense?.notes || ""
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = event => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = { ...form, amount: Number(form.amount) };
    try {
      if (mode === "edit") await api.put(`/expenses/${expense.id}`, payload);
      else await api.post("/expenses", payload);
      await onSaved();
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="modal-card">
        <div className="modal-heading"><div><span className="eyebrow">{mode === "edit" ? "UPDATE RECORD" : "NEW TRANSACTION"}</span><h2>{mode === "edit" ? "Edit expense" : "Add an expense"}</h2><p>Capture the details so your spending stays organized.</p></div><button className="icon-button" onClick={onClose}><X size={19} /></button></div>
        <form className="expense-form" onSubmit={submit}>
          <label>DESCRIPTION<input name="description" value={form.description} onChange={update} placeholder="e.g. Grocery shopping" minLength={2} maxLength={160} required /></label>
          <div className="form-two-col">
            <label>AMOUNT (₹)<input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={update} placeholder="0.00" required /></label>
            <label>DATE<input name="date" type="date" value={form.date} onChange={update} required /></label>
          </div>
          <label>CATEGORY<select name="category" value={form.category} onChange={update}>{CATEGORIES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label>NOTES <span className="optional-label">OPTIONAL</span><textarea name="notes" value={form.notes} onChange={update} maxLength={500} rows={3} placeholder="Add a note about this expense…" /></label>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : mode === "edit" ? "Save changes" : "Add expense"} <ArrowUpRight size={16} /></button></div>
        </form>
      </section>
    </div>
  );
}

function EmptyState({ icon, title, text }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><b>{title}</b><p>{text}</p></div>;
}
