import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function MessageBubble({ message, isOwn, lang }) {
  const isFlagged = message.moderation_status === 'flagged' || 
                    message.flagged_scam || 
                    message.flagged_harassment || 
                    message.flagged_inappropriate;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-2 ${
          isOwn 
            ? 'bg-gradient-to-r from-amber-500 to-violet-600 text-white' 
            : 'bg-slate-800/50 border border-amber-500/10 text-slate-200'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.body}
          </p>
        </div>
        
        <div className="flex items-center gap-2 mt-1 px-2">
          <span className="text-xs text-slate-500">
            {new Date(message.created_date).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
          
          {isFlagged && (
            <div className="flex items-center gap-1 text-xs text-orange-400">
              <AlertTriangle className="w-3 h-3" />
              <span>{lang === 'fr' ? 'Signalé' : 'Flagged'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}