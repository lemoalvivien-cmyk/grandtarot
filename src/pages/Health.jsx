import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, Database, Zap, CheckCircle, XCircle, Clock } from 'lucide-react';

/**
 * /health endpoint - Public health check
 * Used by: monitoring, uptime checks, load balancers
 */
export default function Health() {
  const [status, setStatus] = useState('checking');
  const [checks, setChecks] = useState({});
  const [startTime] = useState(Date.now());

  useEffect(() => {
    runHealthChecks();
  }, []);

  const runHealthChecks = async () => {
    const results = {};

    // 1. Database connectivity
    try {
      await base44.entities.AppSettings.filter({ setting_key: 'paywall_enabled' }, null, 1);
      results.database = { status: 'ok', latency: Date.now() - startTime };
    } catch (error) {
      results.database = { status: 'error', error: error.message };
    }

    // 2. Auth service
    try {
      const isAuth = await base44.auth.isAuthenticated();
      results.auth = { status: 'ok', authenticated: isAuth };
    } catch (error) {
      results.auth = { status: 'error', error: error.message };
    }

    // 3. Entity access (sample)
    try {
      await base44.entities.TarotCard.filter({ is_active: true }, null, 1);
      results.entities = { status: 'ok' };
    } catch (error) {
      results.entities = { status: 'error', error: error.message };
    }

    setChecks(results);
    
    const allOk = Object.values(results).every(r => r.status === 'ok');
    setStatus(allOk ? 'healthy' : 'degraded');
  };

  const overallStatus = status === 'healthy' ? 'ok' : 'degraded';

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Activity className={`w-8 h-8 ${status === 'healthy' ? 'text-green-400' : 'text-orange-400'}`} />
          <div>
            <h1 className="text-2xl font-bold">System Health</h1>
            <p className="text-sm text-slate-400">Status: {overallStatus}</p>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(checks).map(([service, data]) => {
            const Icon = data.status === 'ok' ? CheckCircle : XCircle;
            return (
              <div
                key={service}
                className={`p-4 rounded-lg border ${
                  data.status === 'ok'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${data.status === 'ok' ? 'text-green-400' : 'text-red-400'}`} />
                    <span className="font-medium capitalize">{service}</span>
                  </div>
                  {data.latency && (
                    <span className="text-xs text-slate-400">{data.latency}ms</span>
                  )}
                </div>
                {data.error && (
                  <p className="text-xs text-red-300 mt-2">{data.error}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-xs text-slate-500 text-center">
          Response time: {Date.now() - startTime}ms
        </div>
      </div>
    </div>
  );
}