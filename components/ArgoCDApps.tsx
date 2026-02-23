import React, { useState, useEffect, useCallback } from 'react';
import {
  GitBranch, RefreshCw, AlertTriangle, Wifi, WifiOff,
  Activity, Clock, CheckCircle2, XCircle, Loader2, PauseCircle,
} from 'lucide-react';

// ---- Types ----

interface ArgoCDApp {
  name: string;
  namespace: string;
  sync_status: 'Synced' | 'OutOfSync' | string;
  health_status: 'Healthy' | 'Progressing' | 'Degraded' | 'Suspended' | 'Missing' | 'Unknown' | string;
  revision: string;
  last_deployed: string;
}

// ---- Helpers ----

const shortSha = (rev: string) =>
  rev && rev.length > 8 ? rev.slice(0, 7) : rev || '—';

const timeAgo = (iso: string): string => {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch { return '—'; }
};

const formatTimestamp = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('pl-PL', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
};

// ---- Status configs ----

const syncCfg: Record<string, { label: string; color: string; border: string; dot: string }> = {
  Synced:    { label: 'Synced',     color: 'text-[#5a9e85]', border: 'border-[#2a6654]/60', dot: 'bg-[#5a9e85]' },
  OutOfSync: { label: 'Out of Sync',color: 'text-[#b8864e]', border: 'border-[#7a5530]/60', dot: 'bg-[#b8864e]' },
};
const getSyncCfg = (s: string) => syncCfg[s] ?? { label: s, color: 'text-neutral-500', border: 'border-neutral-700', dot: 'bg-neutral-500' };

const healthCfg: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  Healthy:    { label: 'Healthy',    color: 'text-[#5a9e85]',    Icon: CheckCircle2 },
  Progressing:{ label: 'Progressing',color: 'text-[#6a9fbf]',    Icon: Loader2 },
  Degraded:   { label: 'Degraded',   color: 'text-thinkpad-red', Icon: XCircle },
  Suspended:  { label: 'Suspended',  color: 'text-[#b8864e]',    Icon: PauseCircle },
  Missing:    { label: 'Missing',    color: 'text-neutral-500',  Icon: AlertTriangle },
  Unknown:    { label: 'Unknown',    color: 'text-neutral-500',  Icon: AlertTriangle },
};
const getHealthCfg = (h: string) => healthCfg[h] ?? { label: h, color: 'text-neutral-500', Icon: AlertTriangle };

// ---- App Card ----

const AppCard: React.FC<{ app: ArgoCDApp }> = ({ app }) => {
  const sync   = getSyncCfg(app.sync_status);
  const health = getHealthCfg(app.health_status);
  const HealthIcon = health.Icon;
  const isProgressing = app.health_status === 'Progressing';

  return (
    <div className="bg-thinkpad-base border border-neutral-800/50 border-l-2 px-5 py-4 transition-colors duration-300"
      style={{ borderLeftColor: app.health_status === 'Healthy' ? '#2a6654' : app.health_status === 'Degraded' ? '#7a0014' : '#3a6678' }}
    >
      {/* Name row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <span className="font-mono text-sm font-semibold text-white truncate block">
            {app.name}
          </span>
          <span className="font-mono text-xs text-neutral-600">
            ns: {app.namespace}
          </span>
        </div>

        {/* Sync badge */}
        <span
          className={`font-mono text-xs border px-2 py-0.5 flex items-center gap-1.5 shrink-0 ${sync.color} ${sync.border}`}
          title="Czy stan live cluster zgadza się ze stanem w Git."
        >
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${sync.dot} ${app.sync_status === 'OutOfSync' ? 'animate-pulse' : ''}`} />
          {sync.label}
        </span>
      </div>

      {/* Health + revision + last deployed */}
      <div className="grid grid-cols-3 gap-3 border-t border-neutral-800/50 pt-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1">
            <Activity size={9} /> Health
          </span>
          <span className={`font-mono text-xs font-semibold flex items-center gap-1 ${health.color}`}>
            <HealthIcon size={11} className={isProgressing ? 'animate-spin' : ''} />
            {health.label}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1">
            <GitBranch size={9} /> Revision
          </span>
          <span className="font-mono text-xs text-neutral-300 tabular-nums">
            {shortSha(app.revision)}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1">
            <Clock size={9} /> Deployed
          </span>
          <span
            className="font-mono text-xs text-neutral-300 tabular-nums"
            title={formatTimestamp(app.last_deployed)}
          >
            {timeAgo(app.last_deployed)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ---- Summary badges ----

const SummaryBadge: React.FC<{ count: number; label: string; color: string }> = ({ count, label, color }) => (
  <span className={`font-mono text-xs tabular-nums ${color}`}>
    {count}<span className="text-thinkpad-muted ml-1">{label}</span>
  </span>
);

// ---- Main component ----

const ArgoCDApps: React.FC = () => {
  const [apps, setApps]           = useState<ArgoCDApp[] | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchApps = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/argocd/apps');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ArgoCDApp[] = await res.json();
      setApps(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
    const interval = setInterval(fetchApps, 30000);
    return () => clearInterval(interval);
  }, [fetchApps]);

  const synced    = apps?.filter(a => a.sync_status === 'Synced').length    ?? 0;
  const outOfSync = apps?.filter(a => a.sync_status === 'OutOfSync').length ?? 0;
  const degraded  = apps?.filter(a => a.health_status === 'Degraded').length ?? 0;
  const total     = apps?.length ?? 0;

  return (
    <div className="bg-thinkpad-surface border border-neutral-800 shadow-2xl shadow-black/50">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <GitBranch size={15} className="text-thinkpad-red" />
          <span className="font-mono text-sm text-white uppercase tracking-widest">ArgoCD Apps</span>
          {apps !== null && (
            <span className="font-mono text-xs text-thinkpad-muted">:: {total} aplikacji</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!loading && (
            error
              ? <WifiOff size={13} className="text-thinkpad-red" />
              : <Wifi    size={13} className="text-[#5a9e85]" />
          )}
          <button
            onClick={fetchApps}
            disabled={refreshing}
            className="text-thinkpad-muted hover:text-white transition-colors duration-200 disabled:opacity-30 cursor-pointer"
            aria-label="Odśwież listę aplikacji"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="p-6">

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 gap-3 text-thinkpad-muted font-mono text-sm">
            <RefreshCw size={15} className="animate-spin" /> Łączenie z ArgoCD...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-2 py-8 font-mono text-sm">
            <div className="flex items-center gap-2 text-thinkpad-red">
              <AlertTriangle size={15} /> Brak odpowiedzi od ArgoCD
            </div>
            <p className="text-xs text-thinkpad-muted">{error}</p>
          </div>
        )}

        {/* Data */}
        {!loading && !error && apps !== null && (
          <>
            {/* Summary strip */}
            {total > 0 && (
              <div className="flex items-center gap-4 mb-4 px-1">
                <SummaryBadge count={synced}    label="synced"      color="text-[#5a9e85]" />
                <span className="text-neutral-800">·</span>
                <SummaryBadge count={outOfSync} label="out of sync" color={outOfSync > 0 ? 'text-[#b8864e]' : 'text-neutral-600'} />
                <span className="text-neutral-800">·</span>
                <SummaryBadge count={degraded}  label="degraded"    color={degraded > 0  ? 'text-thinkpad-red' : 'text-neutral-600'} />
              </div>
            )}

            {/* App cards */}
            {total === 0
              ? (
                <div className="flex items-center gap-2 py-4 font-mono text-xs text-thinkpad-muted">
                  <AlertTriangle size={13} /> Brak zarejestrowanych aplikacji w ArgoCD
                </div>
              )
              : (
                <div className="flex flex-col gap-3">
                  {[...apps]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(app => (
                      <AppCard key={app.name} app={app} />
                    ))}
                </div>
              )
            }

            {lastUpdated && (
              <div className="mt-5 text-right font-mono text-xs text-neutral-700">
                updated: {lastUpdated.toLocaleTimeString('pl-PL')}&nbsp;·&nbsp;auto-refresh: 30s
              </div>
            )}
          </>
        )}

      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-neutral-800/60 flex justify-end">
        <a
          href="https://github.com/kompot-rar/kubernetes/tree/master/manifests/argocd"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-neutral-700 hover:text-neutral-400 transition-colors duration-200 flex items-center gap-1.5 group"
        >
          <span className="text-neutral-700 group-hover:text-thinkpad-red transition-colors duration-200">{'</>'}</span>
          View Source: ArgoCD Application Manifests
          <span className="text-neutral-700">↗</span>
        </a>
      </div>

    </div>
  );
};

export default ArgoCDApps;
