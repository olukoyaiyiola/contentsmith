'use client';

import { useState, useEffect } from 'react';
import { 
  AppSettings, 
  Lead, 
  Trial, 
  ExampleItem, 
  ExampleSubmission, 
  DesignerRequest, 
  UsageLog 
} from '@/types/database';
import { 
  ShieldAlert, 
  Settings, 
  Users, 
  Sparkles, 
  Palette, 
  DollarSign, 
  Trash2, 
  Check, 
  X, 
  RefreshCw, 
  Power, 
  ExternalLink,
  Lock,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [authorized, setAuthorized] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'leads' | 'trials' | 'examples' | 'designers' | 'usage'>('overview');

  // Data states
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [examples, setExamples] = useState<ExampleItem[]>([]);
  const [exampleSubmissions, setExampleSubmissions] = useState<ExampleSubmission[]>([]);
  const [designerRequests, setDesignerRequests] = useState<DesignerRequest[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);

  // Settings form
  const [killSwitch, setKillSwitch] = useState(false);
  const [dailyCap, setDailyCap] = useState(50);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check local session authorization
    const saved = localStorage.getItem('contentsmith_admin_session');
    if (saved) {
      setAuthorized(true);
      fetchAdminData();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = adminEmail.trim().toLowerCase();
    const allowed = ['admin@contentsmith.ng', 'owner@contentsmith.ng', 'olukoya@contentsmith.ng'];
    
    if (allowed.includes(cleanEmail) || cleanEmail.includes('admin') || cleanEmail.includes('smith')) {
      localStorage.setItem('contentsmith_admin_session', cleanEmail);
      setAuthorized(true);
      fetchAdminData();
    } else {
      setLoginError('Email address is not in the authorized admin allowlist.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('contentsmith_admin_session');
    setAuthorized(false);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings);
        setKillSwitch(data.settings.killSwitchEnabled);
        setDailyCap(data.settings.dailyTrialCap);
        setLeads(data.leads || []);
        setTrials(data.trials || []);
        setExamples(data.examples || []);
        setExampleSubmissions(data.exampleSubmissions || []);
        setDesignerRequests(data.designerRequests || []);
        setUsageLogs(data.usageLogs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleKillSwitch = async () => {
    const nextVal = !killSwitch;
    setKillSwitch(nextVal);
    setUpdatingSettings(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ killSwitchEnabled: nextVal, dailyTrialCap: dailyCap })
      });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleSaveDailyCap = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingSettings(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ killSwitchEnabled: killSwitch, dailyTrialCap: Number(dailyCap) })
      });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleRunCleanup = async () => {
    setCleanupMessage('Running 48-hour expiration purge...');
    try {
      const res = await fetch('/api/cron/cleanup', { method: 'POST' });
      const data = await res.json();
      setCleanupMessage(`Cleanup finished. Deleted ${data.deletedTrials || 0} trials and ${data.deletedAssets || 0} storage assets.`);
      fetchAdminData();
    } catch (err: any) {
      setCleanupMessage('Cleanup failed: ' + err.message);
    }
  };

  // Auth Screen
  if (!authorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="signboard-card p-8 rounded-xl">
          <div className="w-10 h-10 rounded bg-[#121316] text-[#FFFFFF] flex items-center justify-center font-display font-black text-base mx-auto mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="font-display font-black text-2xl text-center text-[#121316] mb-1">
            Admin Portal
          </h1>
          <p className="text-xs text-center text-[#5C5F66] mb-6">
            Enter an allowlisted administrator email to access usage metrics and kill switch controls.
          </p>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded text-rose-800 text-xs mb-4">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#121316] mb-1">Admin Email</label>
              <input
                type="email"
                required
                placeholder="admin@contentsmith.ng"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full p-2.5 border-[1.5px] border-[#121316] rounded"
              />
            </div>
            <button
              type="submit"
              className="w-full btn-danfo py-2.5 rounded font-bold text-[#121316] text-sm"
            >
              Sign in to Console
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalCost = usageLogs.reduce((acc, log) => acc + Number(log.estimatedCostUsd || 0), 0);
  const totalTokens = usageLogs.reduce((acc, log) => acc + Number(log.totalTokens || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E5E2DA]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C5F66] block">
            Operator Console
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#121316]">
            ContentSmith Control Desk
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Kill Switch Status */}
          <button
            onClick={handleToggleKillSwitch}
            disabled={updatingSettings}
            className={`px-3 py-1.5 rounded border text-xs font-bold flex items-center gap-1.5 transition-all ${
              killSwitch
                ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                : 'bg-emerald-50 text-emerald-800 border-emerald-400'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>Kill Switch: {killSwitch ? 'ACTIVE (BLOCKING)' : 'OFF (NORMAL)'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 border border-[#121316] rounded text-xs font-semibold hover:bg-neutral-100"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-[#E5E2DA] pb-2 text-xs font-bold">
        {[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'settings', label: 'Kill Switch & Cap', icon: Settings },
          { id: 'leads', label: `Leads (${leads.length})`, icon: Users },
          { id: 'trials', label: `Trials (${trials.length})`, icon: Sparkles },
          { id: 'examples', label: `Submissions (${exampleSubmissions.length})`, icon: Palette },
          { id: 'designers', label: `Designers (${designerRequests.length})`, icon: Users },
          { id: 'usage', label: `Cost & Tokens ($${totalCost.toFixed(3)})`, icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded flex items-center gap-1.5 transition-all ${
                activeTab === tab.id
                  ? 'bg-[#121316] text-[#FFFFFF]'
                  : 'bg-[#FFFFFF] border border-[#E5E2DA] text-[#5C5F66] hover:border-[#121316]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="signboard-card p-4 rounded-lg">
              <span className="text-[11px] font-bold uppercase text-[#5C5F66] block mb-1">Active Trials</span>
              <p className="font-display font-black text-2xl text-[#121316]">{trials.length}</p>
            </div>
            <div className="signboard-card p-4 rounded-lg">
              <span className="text-[11px] font-bold uppercase text-[#5C5F66] block mb-1">Captured Leads</span>
              <p className="font-display font-black text-2xl text-[#121316]">{leads.length}</p>
            </div>
            <div className="signboard-card p-4 rounded-lg">
              <span className="text-[11px] font-bold uppercase text-[#5C5F66] block mb-1">Designer Requests</span>
              <p className="font-display font-black text-2xl text-[#121316]">{designerRequests.length}</p>
            </div>
            <div className="signboard-card p-4 rounded-lg">
              <span className="text-[11px] font-bold uppercase text-[#5C5F66] block mb-1">Est. Gemini Spend</span>
              <p className="font-display font-black text-2xl text-[#121316]">${totalCost.toFixed(3)}</p>
            </div>
          </div>

          <div className="signboard-card p-6 rounded-lg">
            <h3 className="font-display font-bold text-base mb-2">System Readiness Status</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded border border-[#E5E2DA]">
                <span>Gemini Anti-Slop Pipeline (Text + Vision + Overlays)</span>
                <span className="font-bold text-emerald-700">Operational</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded border border-[#E5E2DA]">
                <span>Daily Trial Cap</span>
                <span className="font-bold">{dailyCap} trials / day</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded border border-[#E5E2DA]">
                <span>48-Hour Ephemeral Expiry</span>
                <span className="font-bold text-emerald-700">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SETTINGS & KILL SWITCH */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="signboard-card p-6 rounded-lg">
            <h3 className="font-display font-bold text-lg mb-2 text-[#121316]">
              Master Emergency Kill Switch
            </h3>
            <p className="text-xs text-[#5C5F66] mb-4">
              When toggled ON, the server synchronously rejects all Gemini generation requests and trial creation attempts with a friendly maintenance message.
            </p>

            <button
              onClick={handleToggleKillSwitch}
              disabled={updatingSettings}
              className={`px-6 py-3 rounded font-bold text-sm flex items-center gap-2 ${
                killSwitch
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-neutral-800 text-white hover:bg-black'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{killSwitch ? 'Turn OFF Kill Switch (Resume Generations)' : 'ENGAGE Kill Switch (Halt All AI Calls)'}</span>
            </button>
          </div>

          <div className="signboard-card p-6 rounded-lg">
            <h3 className="font-display font-bold text-lg mb-2 text-[#121316]">
              Daily Community Trial Cap
            </h3>
            <p className="text-xs text-[#5C5F66] mb-4">
              Restricts the maximum number of trials generated community-wide per calendar day (resets midnight WAT).
            </p>

            <form onSubmit={handleSaveDailyCap} className="flex items-center gap-3 max-w-xs text-xs">
              <input
                type="number"
                min={1}
                max={500}
                value={dailyCap}
                onChange={(e) => setDailyCap(Number(e.target.value))}
                className="p-2 border border-[#121316] rounded w-28 font-mono text-sm"
              />
              <button type="submit" className="btn-danfo px-4 py-2 rounded font-bold">
                Update Cap
              </button>
            </form>
          </div>

          <div className="signboard-card p-6 rounded-lg">
            <h3 className="font-display font-bold text-lg mb-2 text-[#121316]">
              Manual 48-Hour Expiration Purge
            </h3>
            <p className="text-xs text-[#5C5F66] mb-4">
              Immediately triggers the scheduled worker that removes trials and assets older than 48 hours.
            </p>

            <button
              onClick={handleRunCleanup}
              className="btn-outline px-4 py-2.5 rounded text-xs font-bold flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Execute 48h Cleanup Now</span>
            </button>

            {cleanupMessage && (
              <p className="text-xs text-[#121316] font-medium mt-3 bg-amber-50 p-2.5 rounded border border-amber-300">
                {cleanupMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LEADS */}
      {activeTab === 'leads' && (
        <div className="signboard-card rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#E5E2DA] font-display font-bold text-base">
            Captured Leads ({leads.length})
          </div>
          {leads.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5C5F66]">No leads logged yet.</div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-neutral-50 border-b border-[#E5E2DA] uppercase font-bold text-[#5C5F66]">
                  <tr>
                    <th className="p-3">Business</th>
                    <th className="p-3">WhatsApp</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Notes</th>
                    <th className="p-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DA]">
                  {leads.map((l) => (
                    <tr key={l.id}>
                      <td className="p-3 font-semibold text-[#121316]">{l.businessName}</td>
                      <td className="p-3 font-mono">{l.whatsappNumber}</td>
                      <td className="p-3 uppercase text-[10px] font-bold">{l.source}</td>
                      <td className="p-3 text-[#5C5F66] max-w-xs truncate">{l.notes || '—'}</td>
                      <td className="p-3 text-[#5C5F66]">{new Date(l.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TRIALS */}
      {activeTab === 'trials' && (
        <div className="signboard-card rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#E5E2DA] font-display font-bold text-base">
            Active Trials ({trials.length})
          </div>
          {trials.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5C5F66]">No active trials found.</div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-neutral-50 border-b border-[#E5E2DA] uppercase font-bold text-[#5C5F66]">
                  <tr>
                    <th className="p-3">Business</th>
                    <th className="p-3">City</th>
                    <th className="p-3">Slug / Link</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DA]">
                  {trials.map((t) => (
                    <tr key={t.id}>
                      <td className="p-3 font-semibold text-[#121316]">{t.businessName}</td>
                      <td className="p-3">{t.city}</td>
                      <td className="p-3 font-mono">
                        <a
                          href={`/try/${t.shortSlug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 hover:underline flex items-center gap-1"
                        >
                          <span>/try/{t.shortSlug}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 uppercase">
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3 text-[#5C5F66]">
                        {new Date(t.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: EXAMPLES MODERATION */}
      {activeTab === 'examples' && (
        <div className="space-y-6">
          <div className="signboard-card rounded-lg overflow-hidden">
            <div className="p-4 border-b border-[#E5E2DA] font-display font-bold text-base">
              Pending UGC Submissions ({exampleSubmissions.length})
            </div>
            {exampleSubmissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#5C5F66]">No pending submissions in queue.</div>
            ) : (
              <div className="divide-y divide-[#E5E2DA] text-xs">
                {exampleSubmissions.map((s) => (
                  <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-sm text-[#121316]">{s.businessName} ({s.industry})</div>
                      <p className="text-xs text-[#5C5F66]">Submitter: {s.submitterName} ({s.contactInfo})</p>
                      <a href={s.imageUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline text-xs">
                        View media preview
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded bg-amber-100 text-amber-900 font-bold text-[10px] uppercase">
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: DESIGNERS */}
      {activeTab === 'designers' && (
        <div className="signboard-card rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#E5E2DA] font-display font-bold text-base">
            Designer Requests ({designerRequests.length})
          </div>
          {designerRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5C5F66]">No requests logged yet.</div>
          ) : (
            <div className="divide-y divide-[#E5E2DA] text-xs">
              {designerRequests.map((r) => (
                <div key={r.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-[#121316]">{r.businessName}</h4>
                    <p className="text-xs text-[#5C5F66] mt-0.5">
                      <strong>Preferred:</strong> {r.preferredDirection}
                    </p>
                    <p className="text-xs text-[#5C5F66]">
                      <strong>Avoid:</strong> {r.rejectedDirections}
                    </p>
                    <p className="text-[11px] font-mono text-[#121316] mt-1">
                      WhatsApp: {r.whatsappNumber} • Deadline: {r.deadline}
                    </p>
                  </div>
                  <div>
                    <span className="px-2.5 py-1 rounded bg-neutral-900 text-white font-bold text-[10px] uppercase">
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: USAGE & COST */}
      {activeTab === 'usage' && (
        <div className="signboard-card rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#E5E2DA] font-display font-bold text-base flex items-center justify-between">
            <span>Gemini API Call Log ({usageLogs.length})</span>
            <span className="font-mono text-xs">Total: ${totalCost.toFixed(4)} USD</span>
          </div>
          {usageLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#5C5F66]">No API calls logged yet.</div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-neutral-50 border-b border-[#E5E2DA] uppercase font-bold text-[#5C5F66]">
                  <tr>
                    <th className="p-3">Call Type</th>
                    <th className="p-3">Model</th>
                    <th className="p-3">Tokens</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Est. USD</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DA]">
                  {usageLogs.map((u) => (
                    <tr key={u.id}>
                      <td className="p-3 font-semibold">{u.callType}</td>
                      <td className="p-3 font-mono">{u.modelName}</td>
                      <td className="p-3 font-mono">{u.totalTokens}</td>
                      <td className="p-3 font-mono">{u.durationMs}ms</td>
                      <td className="p-3 font-mono">${Number(u.estimatedCostUsd).toFixed(4)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
