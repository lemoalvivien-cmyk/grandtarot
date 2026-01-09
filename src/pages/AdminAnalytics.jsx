import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function AdminAnalytics() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <BarChart3 className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-slate-200">Analytics</h1>
        <p className="text-slate-400 mt-2">Admin panel - Coming soon</p>
      </div>
    </div>
  );
}