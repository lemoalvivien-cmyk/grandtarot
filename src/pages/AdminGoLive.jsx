import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Copy, Check, Edit2, Loader2, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminGoLive() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    paywallEnabled: false,
    stripeLink: '',
    pendingRequests: 0,
    activeUsers: 0,
    recentLogs: []
  });
  const [copied, setCopied] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editLink, setEditLink] = useState('');
  const [slaHours, setSlaHours] = useState(48);
  const [supportEmail, setSupportEmail] = useState('');
  const [editSlaModal, setEditSlaModal] = useState(false);
  const [editSlaValue, setEditSlaValue] = useState(48);
  const [editSupportEmail, setEditSupportEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [templateCopied, setTemplateCopied] = useState(false);
  const [pendingOver48h, setPendingOver48h] = useState(0);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [paySettings, stripeSettings, pending, users, logs, slaSetting, emailSetting] = await Promise.all([
        base44.entities.AppSettings.filter({ setting_key: 'paywall_enabled' }, null, 1),
        base44.entities.AppSettings.filter({ setting_key: 'stripe_payment_link' }, null, 1),
        base44.entities.BillingRequest.filter({ status: 'pending' }, '-created_date', 50),
        base44.entities.AccountPrivate.filter({ plan_status: 'active' }, null, 50),
        base44.entities.AuditLog.filter({}, '-created_date', 20),
        base44.entities.AppSettings.filter({ setting_key: 'billing_review_sla_hours' }, null, 1),
        base44.entities.AppSettings.filter({ setting_key: 'support_email' }, null, 1)
      ]);

      setData({
        paywallEnabled: paySettings.length > 0 ? paySettings[0].value_boolean : false,
        stripeLink: stripeSettings.length > 0 ? stripeSettings[0].value_string : '',
        pendingRequests: pending.length >= 50 ? '50+' : pending.length,
        activeUsers: users.length >= 50 ? '50+' : users.length,
        recentLogs: logs
      });
      setEditLink(stripeSettings.length > 0 ? stripeSettings[0].value_string : '');
      
      const slhVal = slaSetting.length > 0 ? slaSetting[0].value_number : 48;
      setSlaHours(slhVal);
      setEditSlaValue(slhVal);
      
      const emailVal = emailSetting.length > 0 ? emailSetting[0].value_string : '';
      setSupportEmail(emailVal);
      setEditSupportEmail(emailVal);

      // Load health metrics
      const allPending = await base44.entities.BillingRequest.filter(
        { status: 'pending' },
        '-created_date',
        50
      );
      
      const now48h = new Date();
      now48h.setHours(now48h.getHours() - 48);
      const over48h = allPending.filter(r => new Date(r.created_date) < now48h).length;
      setPendingOver48h(over48h);

      setRecentLogs(logs);
    } catch (error) {
      console.error('Error loading go-live data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePaywall = async () => {
    setSaving(true);
    try {
      const settings = await base44.entities.AppSettings.filter({ setting_key: 'paywall_enabled' }, null, 1);
      if (settings.length > 0) {
        await base44.entities.AppSettings.update(settings[0].id, {
          value_boolean: !data.paywallEnabled
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: 'paywall_enabled',
          value_boolean: !data.paywallEnabled,
          category: 'system'
        });
      }
      await loadData();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLink = async () => {
    if (!editLink.trim()) {
      alert('Link cannot be empty');
      return;
    }
    setSaving(true);
    try {
      const settings = await base44.entities.AppSettings.filter({ setting_key: 'stripe_payment_link' }, null, 1);
      if (settings.length > 0) {
        await base44.entities.AppSettings.update(settings[0].id, {
          value_string: editLink.trim()
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: 'stripe_payment_link',
          value_string: editLink.trim(),
          category: 'payment'
        });
      }
      setEditModal(false);
      await loadData();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSla = async () => {
    if (!editSlaValue || editSlaValue < 1) {
      alert('SLA must be at least 1 hour');
      return;
    }
    setSaving(true);
    try {
      const settings = await base44.entities.AppSettings.filter({ setting_key: 'billing_review_sla_hours' }, null, 1);
      if (settings.length > 0) {
        await base44.entities.AppSettings.update(settings[0].id, {
          value_number: editSlaValue
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: 'billing_review_sla_hours',
          value_number: editSlaValue,
          category: 'payment'
        });
      }
      setEditSlaModal(false);
      await loadData();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSupportEmail = async () => {
    if (!editSupportEmail.trim()) {
      alert('Email cannot be empty');
      return;
    }
    setSaving(true);
    try {
      const settings = await base44.entities.AppSettings.filter({ setting_key: 'support_email' }, null, 1);
      if (settings.length > 0) {
        await base44.entities.AppSettings.update(settings[0].id, {
          value_string: editSupportEmail.trim()
        });
      } else {
        await base44.entities.AppSettings.create({
          setting_key: 'support_email',
          value_string: editSupportEmail.trim(),
          category: 'system'
        });
      }
      await loadData();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const copyServiceMessage = () => {
    const msg = `Support Contact:
Email: ${supportEmail || 'support@grandtarot.com'}
Billing Verification SLA: ${slaHours} hours (business days)

Payment issues? Contact support with your order details.`;
    navigator.clipboard.writeText(msg);
    setTemplateCopied(true);
    setTimeout(() => setTemplateCopied(false), 2000);
  };

  const copySummary = () => {
    const summary = `
  === HEALTH SUMMARY ===
  Billing Requests Pending >48h: ${pendingOver48h}
  Recent Actions: ${recentLogs.length}
  Last Action: ${recentLogs[0]?.action || 'N/A'} at ${recentLogs[0]?.created_date || 'N/A'}

  Support Email: ${supportEmail || 'not set'}
  SLA: ${slaHours}h

  === RECENT AUDIT LOG ===
  ${recentLogs.slice(0, 10).map(log => 
  `${log.created_date} | ${log.action} | ${log.payload_summary}`
  ).join('\n')}
    `.trim();
    navigator.clipboard.writeText(summary);
    setTemplateCopied(true);
    setTimeout(() => setTemplateCopied(false), 2000);
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 flex items-center gap-3">
            <Power className="w-8 h-8 text-green-500" />
            <h1 className="text-4xl font-bold">GO-LIVE PANEL</h1>
            <span className="text-sm text-green-400">Ready</span>
          </div>

          {/* Configuration Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Paywall Toggle */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-amber-100 mb-4 flex items-center gap-2">
                <Power className="w-5 h-5" />
                Paywall Status
              </h3>
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
              <div>
                <p className="text-xs text-slate-500">SLA (Billing Review)</p>
                <p className="text-lg font-semibold text-amber-100">{slaHours}h</p>
              </div>
              <Button
                onClick={() => setEditSlaModal(true)}
                size="sm"
                variant="outline"
                className="border-slate-600 h-8 text-xs"
              >
                Edit
              </Button>
            </div>

            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-300">Paywall Enabled:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  data.paywallEnabled 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-slate-500/20 text-slate-300'
                }`}>
                  {data.paywallEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <Button
                onClick={handleTogglePaywall}
                disabled={saving}
                className={`w-full ${
                  data.paywallEnabled
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Turn {data.paywallEnabled ? 'OFF' : 'ON'}
              </Button>
            </div>

            {/* Stripe Link */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-amber-100 mb-4 flex items-center gap-2">
                <Edit2 className="w-5 h-5" />
                Stripe Payment Link
              </h3>
              <div className="mb-4">
                <p className="text-sm text-slate-400 mb-2">Status:</p>
                <span className={`px-3 py-1 rounded text-xs font-medium ${
                  data.stripeLink ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  {data.stripeLink ? '✓ Configured' : '✗ Missing'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setEditModal(true)}
                  variant="outline"
                  className="flex-1 border-slate-600 h-8 text-xs"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Link
                </Button>
                <Button
                  onClick={copyServiceMessage}
                  variant="outline"
                  className="flex-1 border-slate-600 h-8 text-xs"
                >
                  {templateCopied ? 'Copied!' : 'Message'}
                </Button>
              </div>
            </div>
          </div>

          {/* Metrics Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <p className="text-slate-400 text-sm mb-2">Pending Billing Requests</p>
              <p className="text-4xl font-bold text-amber-200">{data.pendingRequests}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <p className="text-slate-400 text-sm mb-2">Active Subscribers</p>
              <p className="text-4xl font-bold text-green-200">{data.activeUsers}</p>
            </div>
          </div>

          {/* Recent Audit Logs */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-amber-100 mb-4">Recent Audit Logs ({data.recentLogs.length})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.recentLogs.length === 0 ? (
                <p className="text-slate-500 text-sm">No logs yet</p>
              ) : (
                data.recentLogs.map((log, i) => (
                  <div key={i} className="text-xs text-slate-400 border-b border-slate-700/50 pb-2">
                    <p className="font-mono">
                      {new Date(log.created_date).toISOString()} — 
                      <span className="text-amber-300 ml-1">{log.action}</span>
                      {log.actor_user_id && <span className="text-slate-500 ml-1">({log.actor_user_id})</span>}
                    </p>
                    {log.payload_summary && <p className="text-slate-500 mt-1">{log.payload_summary}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Support Email */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-amber-100 mb-4">Support Email</h3>
            <p className="text-sm text-slate-400 mb-4">
              {supportEmail ? `${supportEmail}` : 'Not set'}
            </p>
            <input
              type="email"
              value={editSupportEmail}
              onChange={(e) => setEditSupportEmail(e.target.value)}
              placeholder="support@example.com"
              className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm mb-3"
            />
            <Button
              onClick={handleSaveSupportEmail}
              size="sm"
              className="w-full border-slate-600 bg-blue-600 hover:bg-blue-700 h-8 text-xs"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : 'Save Email'}
            </Button>
          </div>

          {/* Health Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <p className="text-xs text-slate-500 mb-1">Billing Requests Pending >48h</p>
              <p className="text-4xl font-bold text-amber-100">{pendingOver48h}</p>
              <p className="text-xs text-slate-400 mt-2">⚠️ Action needed</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <p className="text-xs text-slate-500 mb-1">Recent Audit Actions</p>
              <p className="text-4xl font-bold text-green-100">{recentLogs.length}</p>
              <p className="text-xs text-slate-400 mt-2">Last 20</p>
            </div>
          </div>

          {/* Recent Logs */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-amber-100 mb-4">Recent Audit Logs (top 10)</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentLogs.slice(0, 10).map((log, i) => (
                <div key={i} className="text-xs border-l-2 border-slate-600 pl-3 py-1">
                  <p className="text-slate-300">{log.action}</p>
                  <p className="text-slate-500">{log.payload_summary}</p>
                  <p className="text-slate-600 text-xs">{log.created_date}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Copy Summary */}
          <div className="text-center">
            <Button
              onClick={copySummary}
              className="bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 px-8"
            >
              {templateCopied ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Copy Health Summary
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Edit SLA Modal */}
        <Dialog open={editSlaModal} onOpenChange={setEditSlaModal}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-amber-100">Edit Billing Review SLA (hours)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <input
                type="number"
                value={editSlaValue}
                onChange={(e) => setEditSlaValue(parseInt(e.target.value) || 48)}
                min="1"
                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-2"
              />
              <div className="flex gap-3">
                <Button
                  onClick={() => setEditSlaModal(false)}
                  variant="outline"
                  className="flex-1 border-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSla}
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Link Modal */}
        <Dialog open={editModal} onOpenChange={setEditModal}>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-amber-100">Edit Stripe Payment Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <input
                type="text"
                value={editLink}
                onChange={(e) => setEditLink(e.target.value)}
                placeholder="https://buy.stripe.com/..."
                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg px-4 py-2"
              />
              <div className="flex gap-3">
                <Button
                  onClick={() => setEditModal(false)}
                  variant="outline"
                  className="flex-1 border-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveLink}
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminGuard>
  );
}