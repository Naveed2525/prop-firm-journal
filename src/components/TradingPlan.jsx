import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTradingPlan } from '../hooks/useData';
import MyPlanTab from './MyPlanTab';
import DailyChecklistTab from './DailyChecklistTab';

export default function TradingPlan() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('plan'); // 'plan' | 'checklist'
  const { doc, loading, updateSection, logTrade, addRule, updateRule, deleteRule } = useTradingPlan();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white pb-safe">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-4 pt-safe">
        <div className="flex items-center gap-3 py-3">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold tracking-tight">Trading Plan</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 pb-3">
          <TabButton active={tab === 'plan'} onClick={() => setTab('plan')}>My Plan</TabButton>
          <TabButton active={tab === 'checklist'} onClick={() => setTab('checklist')}>Daily Checklist</TabButton>
        </div>
      </div>

      <div className="px-4 py-4 pb-safe">
        {tab === 'plan' ? (
          <MyPlanTab
            progress={doc.progress}
            rules={doc.personalRules}
            onAddRule={addRule}
            onUpdateRule={updateRule}
            onDeleteRule={deleteRule}
          />
        ) : (
          <DailyChecklistTab doc={doc} loading={loading} updateSection={updateSection} logTrade={logTrade} />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
