import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function AdminAiPrompts() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <MessageSquare className="w-16 h-16 text-violet-400 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-slate-200">AI Prompts</h1>
        <p className="text-slate-400 mt-2">Admin panel - Coming soon</p>
      </div>
    </div>
  );
}