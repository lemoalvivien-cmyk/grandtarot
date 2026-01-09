import React from 'react';
import { Calendar } from 'lucide-react';

export default function AdminDailyCardManager() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Calendar className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-slate-200">Carte du jour</h1>
        <p className="text-slate-400 mt-2">Admin panel - Coming soon</p>
      </div>
    </div>
  );
}