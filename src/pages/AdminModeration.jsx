import React from 'react';
import { Shield } from 'lucide-react';

export default function AdminModeration() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Shield className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-slate-200">Modération</h1>
        <p className="text-slate-400 mt-2">Admin panel - Coming soon</p>
      </div>
    </div>
  );
}