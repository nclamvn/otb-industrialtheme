'use client';
// ═══════════════════════════════════════════════════════════════════════════
// Error Message Component
// ═══════════════════════════════════════════════════════════════════════════
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorMessage = ({ darkMode = true, message = 'Something went wrong', onRetry }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${
      darkMode ? 'text-slate-300' : 'text-slate-700'
    }`}>
      <div className={`p-4 rounded-full ${darkMode ? 'bg-red-500/10' : 'bg-red-50'} mb-4`}>
        <AlertCircle size={32} className="text-red-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Error</h3>
      <p className={`text-sm text-center max-w-md ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className={`mt-4 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            darkMode
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
