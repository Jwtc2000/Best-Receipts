import { useState } from 'react'
import ReportList from './components/ReportList'
import ReportView from './components/ReportView'
import ExpenseEditor from './components/ExpenseEditor'

export type View =
  | { name: 'reports' }
  | { name: 'report'; reportId: string }
  | { name: 'expense'; reportId: string; expenseId?: string }

export default function App() {
  const [view, setView] = useState<View>({ name: 'reports' })

  return (
    <div className="app">
      {view.name === 'reports' && (
        <ReportList onOpenReport={(reportId) => setView({ name: 'report', reportId })} />
      )}
      {view.name === 'report' && (
        <ReportView
          reportId={view.reportId}
          onBack={() => setView({ name: 'reports' })}
          onAddExpense={() => setView({ name: 'expense', reportId: view.reportId })}
          onEditExpense={(expenseId) =>
            setView({ name: 'expense', reportId: view.reportId, expenseId })
          }
        />
      )}
      {view.name === 'expense' && (
        <ExpenseEditor
          reportId={view.reportId}
          expenseId={view.expenseId}
          onDone={() => setView({ name: 'report', reportId: view.reportId })}
        />
      )}
    </div>
  )
}
