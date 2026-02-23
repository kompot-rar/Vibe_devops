import React from 'react';
import {
  GitBranch, AlertTriangle, Activity, Clock,
  CheckCircle2, XCircle, Loader2, PauseCircle, HelpCircle,
} from 'lucide-react';

// ---- Types ----

export interface ArgoCDApp {
  name: string;
  status: string;       // health: 'Healthy' | 'Degraded' | 'Progressing' | ...
  sync: string;         // 'Synced' | 'OutOfSync' | 'Unknown'
  revision: string;     // short SHA or semver
  last_deploy: string;  // ISO timestamp
  repo: string;
  path?: string;
}

// ---- Helpers ----

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

const repoLabel = (repo: string, path?: string): string => {
  if (repo.startsWith('https://github.com/')) {
    const base = repo.replace('https://github.com/', '').replace('.git', '');
    return path ? `${base}/${path}` : base;
  }
  // helm chart repo — just the hostname
  try { return new URL(repo).hostname; } catch { return repo; }
};

// ---- Status configs ----

const syncCfg: Record<string, { label: string; color: string; border: string; dot: string; pulse: boolean }> = {
  Synced:    { label: 'Synced',      color: 'text-[#5a9e85]', border: 'border-[#2a6654]/60', dot: 'bg-[#5a9e85]', pulse: false },
  OutOfSync: { label: 'Out of Sync', color: 'text-[#b8864e]', border: 'border-[#7a5530]/60', dot: 'bg-[#b8864e]', pulse: true  },
  Unknown:   { label: 'Unknown',     color: 'text-neutral-500', border: 'border-neutral-700', dot: 'bg-neutral-500', pulse: false },
};
const getSyncCfg = (s: string) =>
  syncCfg[s] ?? { label: s, color: 'text-neutral-500', border: 'border-neutral-700', dot: 'bg-neutral-500', pulse: false };

const healthCfg: Record<string, { color: string; Icon: React.ElementType; spin: boolean }> = {
  Healthy:     { color: 'text-[#5a9e85]',    Icon: CheckCircle2, spin: false },
  Progressing: { color: 'text-[#6a9fbf]',    Icon: Loader2,      spin: true  },
  Degraded:    { color: 'text-thinkpad-red',  Icon: XCircle,      spin: false },
  Suspended:   { color: 'text-[#b8864e]',     Icon: PauseCircle,  spin: false },
  Missing:     { color: 'text-neutral-500',   Icon: AlertTriangle,spin: false },
  Unknown:     { color: 'text-neutral-500',   Icon: HelpCircle,   spin: false },
};
const getHealthCfg = (h: string) =>
  healthCfg[h] ?? { color: 'text-neutral-500', Icon: HelpCircle, spin: false };

const accentColor = (health: string): string => {
  if (health === 'Healthy')  return '#2a6654';
  if (health === 'Degraded') return '#7a0014';
  return '#3a6678';
};

// ---- App Card ----

const AppCard: React.FC<{ app: ArgoCDApp }> = ({ app }) => {
  const sync   = getSyncCfg(app.sync);
  const health = getHealthCfg(app.status);
  const HealthIcon = health.Icon;

  return (
    <div
      className="bg-thinkpad-base border border-neutral-800/50 border-l-2 px-5 py-4 transition-colors duration-300"
      style={{
        borderLeftColor: accentColor(app.status),
        backgroundImage: `linear-gradient(to bottom, ${accentColor(app.status)}0f 0px, transparent 40px)`,
      }}
    >
      {/* Name + sync badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <span className="font-mono text-sm font-semibold text-white truncate block">
            {app.name}
          </span>
          <span
            className="font-mono text-xs text-neutral-600 truncate block"
            title={app.path ? `${app.repo}/${app.path}` : app.repo}
          >
            {repoLabel(app.repo, app.path)}
          </span>
        </div>

        <span
          className={`font-mono text-xs border px-2 py-0.5 flex items-center gap-1.5 shrink-0 ${sync.color} ${sync.border}`}
          title="Czy stan live cluster zgadza się ze stanem w Git."
        >
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${sync.dot} ${sync.pulse ? 'animate-pulse' : ''}`} />
          {sync.label}
        </span>
      </div>

      {/* Health · Revision · Deployed */}
      <div className="grid grid-cols-3 gap-3 border-t border-neutral-800/50 pt-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1">
            <Activity size={9} /> Health
          </span>
          <span className={`font-mono text-xs font-semibold flex items-center gap-1 ${health.color}`}>
            <HealthIcon size={11} className={health.spin ? 'animate-spin' : ''} />
            {app.status}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1">
            <GitBranch size={9} /> Revision
          </span>
          <span className="font-mono text-xs text-neutral-300 tabular-nums">
            {app.revision !== 'N/A' ? app.revision : '—'}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1">
            <Clock size={9} /> Deployed
          </span>
          <span
            className="font-mono text-xs text-neutral-300 tabular-nums"
            title={formatTimestamp(app.last_deploy)}
          >
            {timeAgo(app.last_deploy)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ---- Main component ----

const ArgoCDApps: React.FC<{ apps: ArgoCDApp[] }> = ({ apps }) => {
  const synced    = apps.filter(a => a.sync === 'Synced').length;
  const outOfSync = apps.filter(a => a.sync === 'OutOfSync').length;
  const degraded  = apps.filter(a => a.status === 'Degraded').length;

  return (
    <div className="bg-thinkpad-surface border border-neutral-800 shadow-2xl shadow-black/50">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <GitBranch size={15} className="text-thinkpad-red" />
          <span className="font-mono text-sm text-white uppercase tracking-widest">ArgoCD Apps</span>
          <span className="font-mono text-xs text-thinkpad-muted">:: {apps.length} aplikacji</span>
        </div>
        {/* Summary inline */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-[#5a9e85] tabular-nums">
            {synced}<span className="text-thinkpad-muted ml-1">synced</span>
          </span>
          {outOfSync > 0 && (
            <>
              <span className="text-neutral-800">·</span>
              <span className="text-[#b8864e] tabular-nums">
                {outOfSync}<span className="text-thinkpad-muted ml-1">out of sync</span>
              </span>
            </>
          )}
          {degraded > 0 && (
            <>
              <span className="text-neutral-800">·</span>
              <span className="text-thinkpad-red tabular-nums">
                {degraded}<span className="text-thinkpad-muted ml-1">degraded</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="p-6">
        <div className="flex flex-col gap-3">
          {[...apps]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(app => (
              <AppCard key={app.name} app={app} />
            ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-neutral-800/60 flex justify-end">
        <a
          href="https://github.com/kompot-rar/kubernetes/tree/master/argocd/apps"
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
