import React, { useState, useEffect, useCallback } from 'react';
import {
  Thermometer, RefreshCw, AlertTriangle,
  Wifi, WifiOff, Server, Cpu, MemoryStick, Clock, Box, ShieldCheck, Activity,
  HardDrive, Skull, Gauge, Download, Upload,
  Shield, ShieldAlert, Zap, Users, Globe, Network,
} from 'lucide-react';
import PipelineVisualizer from './PipelineVisualizer';
import ArgoCDApps from './ArgoCDApps';
import SLATracker from './SLATracker';

declare global {
  interface Window { MY_POD_NAME?: string; }
}

// --- Types ---

interface ClusterStats {
  cpu_pressure: string;
  memory_pressure: string;
  network_rx_mbps: string;
  network_tx_mbps: string;
}

interface Incident {
  object: string; // "Pod/blog-devops-dev-59787c997b-g9dml"
  type: string;
  reason: string;
  message: string;
  namespace: string;
  count: number;
  last_timestamp: string;
}

interface RestartReasonEvent {
  reason: string;
  message: string;
  lastTimestamp: string;
}

interface RestartReason {
  podName: string;
  terminated?: {
    reason: string;
    exitCode: number;
    finishedAt?: string;
  };
  events?: RestartReasonEvent[];
}

interface ClusterInfo {
  totalPods: string;
  status: 'Healthy' | 'Warning' | 'Observed' | string;
  message: string;
  restarts_24h: number;
  gitops: 'Synced' | 'Out of Sync' | string;
  lastUpdate: string;
  stats?: ClusterStats;
  incidents?: Incident[];
}

interface NodeInfo {
  name: string;
  temp: string;
  cpu: string;
  ram: string;
  uptime: string;
}

interface ChaosMonkeyMetrics {
  reported_uncorrectable_ecc: number;
  reallocated_events: number;
  offline_uncorrectable: number;
  avg_write_lat_sec: number;
  lifetime_remain_pct: number;
  power_on_hours: number;
}

interface ChaosMonkeyAudit {
  target: string;
  serial: string;
  node: string;
  health_status: string;
  alert_level: 'Radioactive' | 'Critical' | 'Warning' | 'Nominal' | string;
  firmware_verdict: string;
  sre_message: string;
  metrics: ChaosMonkeyMetrics;
}

interface ArgoCDApp {
  name: string;
  status: string;
  sync: string;
  revision: string;
  last_deploy: string;
  repo: string;
  path?: string;
}

interface TopologyPod {
  name: string;
  namespace: string;
  status: string;
}

interface TopologyNode {
  name: string;
  status: string; // 'True' = Ready
  pods: TopologyPod[];
}

interface TopologyData {
  nodes: TopologyNode[];
  whoami?: { pod: string; node: string };
}

interface CloudflareData {
  security: {
    threats_blocked: number;
  };
  performance: {
    cache_hit_ratio_pct: string;
    saved_transfer_gb: string;
  };
  traffic: {
    unique_visitors_7d: number;
    top_countries?: string[];
    bot_management?: {
      human: number;
      bot_good: number;
      bot_bad: number;
      other: number;
    } | null;
  };
  reliability: {
    edge_error_rate_pct: string;
    synthetic_uptime_pct: string;
  };
}

interface SLADay {
  date: string;            // "2026-01-27"
  uptime_pct: number;      // 0-100
  avg_response_ms: number;
}

interface SLAData {
  uptime_30d_pct: number;
  current_streak_hours: number;
  total_downtime_minutes_30d: number;
  response_time_p95_ms: number;
  daily: SLADay[];
}

interface ApiResponse {
  cluster: ClusterInfo;
  nodes: NodeInfo[];
  chaos_monkey_audit?: ChaosMonkeyAudit;
  argocd_apps?: ArgoCDApp[];
  cloudflare?: CloudflareData | null;
  topology?: TopologyData | null;
  sla?: SLAData | null;
}

// --- Paleta ---

const getTempLevel = (temp: number): 'ok' | 'warm' | 'hot' => {
  if (temp < 70) return 'ok';
  if (temp < 85) return 'warm';
  return 'hot';
};

const tempCfg = {
  ok:   { label: 'OK',   color: 'text-[#7a9fad]', barColor: 'bg-[#3a6678]', accentBorder: '#2a4a58', dotClass: 'bg-[#7a9fad]' },
  warm: { label: 'WARM', color: 'text-[#b8864e]', barColor: 'bg-[#7a5530]', accentBorder: '#5a3c1e', dotClass: 'bg-[#b8864e]' },
  hot:  { label: 'HOT',  color: 'text-thinkpad-red', barColor: 'bg-thinkpad-red', accentBorder: '#7a0014', dotClass: 'bg-thinkpad-red' },
};

const clusterStatusCfg: Record<string, {
  color: string; dotColor: string; bg: string; border: string;
}> = {
  Healthy: { color: 'text-[#5a9e85]', dotColor: 'bg-[#5a9e85]', bg: 'bg-[#5a9e85]/5', border: 'border-[#2a6654]/50' },
  Warning: { color: 'text-[#b8864e]', dotColor: 'bg-[#b8864e]', bg: 'bg-[#7a5530]/10', border: 'border-[#7a5530]/50' },
  Observed: { color: 'text-[#6a9fbf]', dotColor: 'bg-[#6a9fbf]', bg: 'bg-[#2e5f80]/10', border: 'border-[#2e5f80]/50' },
};

const getStatusCfg = (status: string) =>
  clusterStatusCfg[status] ?? clusterStatusCfg['Observed'];

const alertLevelCfg: Record<string, {
  color: string; dotColor: string; bg: string; border: string;
}> = {
  Radioactive: { color: 'text-[#a855f7]', dotColor: 'bg-[#a855f7]', bg: 'bg-[#4c1d95]/10', border: 'border-[#7c3aed]/40' },
  Critical: { color: 'text-thinkpad-red', dotColor: 'bg-thinkpad-red', bg: 'bg-thinkpad-red/5', border: 'border-thinkpad-red/40' },
  Warning: { color: 'text-[#b8864e]', dotColor: 'bg-[#b8864e]', bg: 'bg-[#7a5530]/10', border: 'border-[#7a5530]/50' },
  Nominal: { color: 'text-[#5a9e85]', dotColor: 'bg-[#5a9e85]', bg: 'bg-[#5a9e85]/5', border: 'border-[#2a6654]/50' },
};

const getAlertLevelCfg = (level: string) =>
  alertLevelCfg[level] ?? alertLevelCfg['Warning'];

// --- Helpers ---

const formatUptime = (days: string) => {
  const d = parseFloat(days);
  const fullDays = Math.floor(d);
  const hours = Math.round((d - fullDays) * 24);
  if (fullDays === 0) return `${hours}h`;
  if (hours === 0) return `${fullDays}d`;
  return `${fullDays}d ${hours}h`;
};

const formatTimestamp = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString('pl-PL', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch { return iso; }
};

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

// --- Sub-components ---

const Bar: React.FC<{ value: number; colorClass: string; max?: number }> = ({
  value, colorClass, max = 100,
}) => (
  <div className="h-[5px] bg-[#1e2028] rounded-sm overflow-hidden">
    <div
      className={`h-full ${colorClass} rounded-sm transition-all duration-700`}
      style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
    />
  </div>
);

const MetricCell: React.FC<{
  icon: React.ReactNode; label: string; value: string; unit: string;
  barValue: number; barMax?: number; barColor: string; valueColor?: string;
  withSeparator?: boolean;
}> = ({ icon, label, value, unit, barValue, barMax, barColor, valueColor = 'text-white', withSeparator }) => (
  <div className={`flex flex-col gap-3 ${withSeparator ? 'border-l border-neutral-800/60 pl-4' : ''}`}>
    <div className="flex flex-col gap-1.5">
      <span className={`font-mono text-xl font-semibold ${valueColor} tabular-nums leading-none`}>
        {value}<span className="text-[11px] font-normal text-thinkpad-muted ml-0.5">{unit}</span>
      </span>
      <div className="flex items-center gap-1.5 text-thinkpad-muted">
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
      </div>
    </div>
    <Bar value={barValue} colorClass={barColor} max={barMax} />
  </div>
);

// --- Cluster Overview widget (vibe-refresh-trigger) ---
const podBaseName = (name: string) => {
  const parts = name.split('-');
  return parts.length > 2 ? parts.slice(0, -2).join('-') : name;
};

const exitCodeColor = (code: number) => {
  if (code === 0) return 'text-thinkpad-muted';
  if (code === 137 || code === 143) return 'text-[#b8864e]';
  return 'text-thinkpad-red';
};

const ClusterOverview: React.FC<{ cluster: ClusterInfo }> = ({ cluster }) => {
  const s = getStatusCfg(cluster.status);
  const [restartReason, setRestartReason] = useState<RestartReason | null>(null);

  const firstPodName = cluster.incidents?.[0]?.object?.replace(/^Pod\//, '') ?? null;

  useEffect(() => {
    if (!firstPodName) { setRestartReason(null); return; }
    fetch(`/api/status/restart-reason/${firstPodName}`)
      .then(r => r.json())
      .then(d => { if (d?.podName) setRestartReason(d); })
      .catch(() => { });
  }, [firstPodName]);

  return (
    <div className={`border ${s.border} ${s.bg}`}>
      {/* Główny status + message */}
      <div className="px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${s.dotColor} opacity-40`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${s.dotColor}`} />
          </span>
          <span className={`font-mono text-sm font-bold uppercase tracking-widest shrink-0 ${s.color}`}>
            {cluster.status}
          </span>
          <span className="text-neutral-800 shrink-0">—</span>
          <span className="font-mono text-xs text-thinkpad-muted truncate">
            {cluster.message}
          </span>
        </div>
        <span className="font-mono text-xs text-thinkpad-muted border border-neutral-800 px-2 py-0.5 shrink-0 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#5a9e85] animate-pulse" />
          LIVE
        </span>
      </div>

      {/* Trzy metryki klastra */}
      <div className="grid grid-cols-3 gap-px border-t border-neutral-800/60 bg-neutral-800/30">

        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-1">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
            <Box size={10} /> Pody aktywne
          </span>
          <span className="font-mono text-2xl font-bold text-white tabular-nums">
            {cluster.totalPods}
          </span>
        </div>

        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-1">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={10} /> Self-healing (24h)
          </span>
          <div
            className="flex items-baseline gap-2"
            title={
              cluster.restarts_24h > 0
                ? `W ciągu ostatnich 24h klaster wykrył i automatycznie naprawił ${cluster.restarts_24h} incydent${cluster.restarts_24h === 1 ? '' : cluster.restarts_24h < 5 ? 'y' : 'ów'} bez ingerencji człowieka.`
                : 'Zero incydentów w ciągu ostatnich 24h. Klaster operuje w pełnej stabilności.'
            }
          >
            <span className={`font-mono text-2xl font-bold tabular-nums ${cluster.restarts_24h === 0 ? 'text-white' : 'text-[#b8864e]'
              }`}>
              {cluster.restarts_24h}
            </span>
            <span className="font-mono text-xs text-thinkpad-muted">
              {cluster.restarts_24h === 0
                ? 'brak zdarzeń'
                : cluster.restarts_24h === 1
                  ? 'event · recovered'
                  : 'events · recovered'}
            </span>
          </div>
        </div>

        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-1">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={10} /> Ostatni sync
          </span>
          <span className="font-mono text-base font-semibold text-white tabular-nums">
            {timeAgo(cluster.lastUpdate)}
          </span>
          <span className="font-mono text-xs text-neutral-700 tabular-nums">
            {formatTimestamp(cluster.lastUpdate)}
          </span>
        </div>

      </div>

      {/* Cluster Stats */}
      {cluster.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px border-t border-neutral-800/60 bg-neutral-800/30">

          <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-2"
            title="CPU Requests vs total cluster capacity">
            <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
              <Cpu size={10} /> CPU req
            </span>
            <span className="font-mono text-2xl font-bold text-[#6a9fbf] tabular-nums leading-none">
              {parseFloat(cluster.stats.cpu_pressure).toFixed(1)}
              <span className="text-sm font-normal text-thinkpad-muted">%</span>
            </span>
            <Bar value={parseFloat(cluster.stats.cpu_pressure)} colorClass="bg-[#2e5f80]" />
          </div>

          <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-2"
            title="Memory Requests vs total cluster capacity">
            <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
              <MemoryStick size={10} /> Mem req
            </span>
            <span className="font-mono text-2xl font-bold text-[#5a9e85] tabular-nums leading-none">
              {parseFloat(cluster.stats.memory_pressure).toFixed(1)}
              <span className="text-sm font-normal text-thinkpad-muted">%</span>
            </span>
            <Bar value={parseFloat(cluster.stats.memory_pressure)} colorClass="bg-[#2a6654]" />
          </div>

          <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-2"
            title="Network ingress — cluster-wide download">
            <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
              <Download size={10} /> Net RX
            </span>
            <div className="flex items-baseline gap-1 leading-none">
              <span className="font-mono text-2xl font-bold text-[#7a9fbf] tabular-nums">
                {parseFloat(cluster.stats.network_rx_mbps).toFixed(1)}
              </span>
              <span className="font-mono text-xs text-thinkpad-muted">Mbps</span>
            </div>
            <Bar value={parseFloat(cluster.stats.network_rx_mbps)} colorClass="bg-[#2a4a6a]" max={100} />
          </div>

          <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-2"
            title="Network egress — cluster-wide upload">
            <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
              <Upload size={10} /> Net TX
            </span>
            <div className="flex items-baseline gap-1 leading-none">
              <span className="font-mono text-2xl font-bold text-[#6a8fbf] tabular-nums">
                {parseFloat(cluster.stats.network_tx_mbps).toFixed(1)}
              </span>
              <span className="font-mono text-xs text-thinkpad-muted">Mbps</span>
            </div>
            <Bar value={parseFloat(cluster.stats.network_tx_mbps)} colorClass="bg-[#2a3f5a]" max={100} />
          </div>

        </div>
      )}

      {/* Incidents */}
      {cluster.incidents && cluster.incidents.length > 0 && (
        <div className="border-t border-neutral-800/60">
          <div className="px-5 py-2 flex items-center gap-1.5">
            <RefreshCw size={9} className="text-neutral-600" />
            <span className="font-mono text-xs text-neutral-600 uppercase tracking-wider">last events</span>
          </div>

          {/* Alert summary row — first position when cluster is not Healthy */}
          {cluster.status !== 'Healthy' && (() => {
            const inc0 = cluster.incidents[0];
            const pod0 = inc0.object.replace(/^Pod\//, '');
            return (
              <div className="px-5 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 border-b border-[#b8864e]/40 bg-[#b8864e]/[0.06]">
                <AlertTriangle size={10} className="text-[#b8864e] shrink-0" />
                <span className="font-mono text-xs font-bold text-[#b8864e] uppercase tracking-widest shrink-0">{cluster.status}</span>
                <span className="font-mono text-xs text-neutral-600 shrink-0">·</span>
                <span className="font-mono text-xs font-semibold text-white shrink-0">{podBaseName(pod0)}</span>
                <span className="font-mono text-xs text-thinkpad-muted shrink-0">{inc0.namespace}</span>
                <span className="font-mono text-xs text-[#b8864e] shrink-0">{inc0.reason}</span>
                <span className="font-mono text-xs text-neutral-500 truncate">{cluster.message}</span>
                <span className="font-mono text-xs text-neutral-600 shrink-0 ml-auto">{timeAgo(inc0.last_timestamp)}</span>
              </div>
            );
          })()}

          {cluster.incidents.slice(0, 2).map((inc, i) => {
            const podName = inc.object.replace(/^Pod\//, '');
            const isFirst = i === 0;
            const detail = isFirst && restartReason;
            return (
              <div
                key={`${inc.object}-${i}`}
                className="px-5 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 border-b border-neutral-800/40 last:border-b-0 bg-thinkpad-base/30"
              >
                <span className="font-mono text-xs text-neutral-600 shrink-0">·</span>
                <span className="font-mono text-xs text-white shrink-0">{podBaseName(podName)}</span>
                <span className="font-mono text-xs text-thinkpad-muted shrink-0">{inc.namespace}</span>
                {detail?.terminated ? (
                  <>
                    <span className={`font-mono text-xs font-bold shrink-0 ${exitCodeColor(detail.terminated.exitCode)}`}>
                      {detail.terminated.reason}
                    </span>
                    <span className="font-mono text-xs text-neutral-600 shrink-0">exit {detail.terminated.exitCode}</span>
                  </>
                ) : (
                  <span className="font-mono text-xs text-thinkpad-muted shrink-0">{inc.reason}</span>
                )}
                <span className="font-mono text-xs text-neutral-700 truncate">{inc.message}</span>
                <span className="font-mono text-xs text-neutral-600 shrink-0 ml-auto">{timeAgo(inc.last_timestamp)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* View Source */}
      <div className="px-5 py-3 border-t border-neutral-800/60 flex justify-end">
        <a
          href="https://github.com/kompot-rar/kubernetes/blob/master/manifests/monitoring/status-proxy.yaml"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-neutral-700 hover:text-neutral-400 transition-colors duration-200 flex items-center gap-1.5 group"
        >
          <span className="text-neutral-700 group-hover:text-thinkpad-red transition-colors duration-200">{'</>'}</span>
          View Source: GitOps Manifest &amp; PromQL Logic
          <span className="text-neutral-700">↗</span>
        </a>
      </div>

    </div>
  );
};

// --- Node Card ---

const NodeCard: React.FC<{ node: NodeInfo; index: number }> = ({ node, index }) => {
  const temp = parseFloat(node.temp);
  const cpu = parseFloat(node.cpu);
  const ram = parseFloat(node.ram);
  const level = getTempLevel(temp);
  const cfg = tempCfg[level];

  return (
    <div
      className="bg-thinkpad-base border-l-2 border border-neutral-800/50 px-5 py-5 transition-colors duration-300"
      style={{
        borderLeftColor: cfg.accentBorder,
        backgroundImage: `linear-gradient(to bottom, ${cfg.accentBorder}0f 0px, transparent 40px)`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server size={14} className="text-thinkpad-muted" />
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-widest">
            node-{String(index + 1).padStart(2, '0')}
          </span>
          <span className="font-mono text-xs text-neutral-700">/</span>
          <span className="font-mono text-sm text-neutral-300 font-semibold">{node.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-neutral-500 flex items-center gap-1.5">
            <Clock size={12} />
            {formatUptime(node.uptime)}
          </span>
          <span
            className={`font-mono text-[10px] font-semibold ${cfg.color} tracking-widest flex items-center gap-1.5 px-2 py-0.5 border`}
            style={{ borderColor: cfg.accentBorder + 'cc', backgroundColor: cfg.accentBorder + '30' }}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="-mx-5 border-t border-neutral-800/40 mb-4" />

      <div className="grid grid-cols-3 gap-0">
        <MetricCell
          icon={<Thermometer size={11} />} label="temp"
          value={temp.toFixed(1)} unit="°C"
          barValue={temp} barMax={100}
          barColor={cfg.barColor} valueColor={cfg.color}
        />
        <MetricCell withSeparator
          icon={<Cpu size={11} />} label="cpu"
          value={cpu.toFixed(1)} unit="%"
          barValue={cpu} barColor="bg-[#2e5f80]" valueColor="text-[#6a9fbf]"
        />
        <MetricCell withSeparator
          icon={<MemoryStick size={11} />} label="ram"
          value={ram.toFixed(1)} unit="%"
          barValue={ram} barColor="bg-[#2a6654]" valueColor="text-[#5a9e85]"
        />
      </div>
    </div>
  );
};

// --- Chaos Monkey Disk Audit widget ---

const CircularProgress: React.FC<{
  pct: number; stroke: string; textColor: string;
}> = ({ pct, stroke, textColor }) => {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: 48, height: 48 }}>
      <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="24" cy="24" r={r} fill="none" stroke="#1e2028" strokeWidth="3.5" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke={stroke} strokeWidth="3.5"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute font-mono text-[11px] font-bold tabular-nums ${textColor}`}>
        {pct}%
      </span>
    </div>
  );
};

const ChaosMonkeyWidget: React.FC<{ audit: ChaosMonkeyAudit }> = ({ audit }) => {
  const { metrics } = audit;
  const s = getAlertLevelCfg(audit.alert_level);
  const isCritical = audit.alert_level === 'Radioactive' || audit.alert_level === 'Critical';

  const latMs = metrics.avg_write_lat_sec * 1000;
  const latLabel = latMs < 10 ? latMs.toFixed(2) : latMs.toFixed(1);
  const latColor = latMs > 100 ? 'text-thinkpad-red' : latMs > 50 ? 'text-[#b8864e]' : 'text-[#5a9e85]';

  const lifeRemain = metrics.lifetime_remain_pct;
  const lifeStroke = lifeRemain < 20 ? '#ff002b' : lifeRemain < 50 ? '#b8864e' : '#5a9e85';
  const lifeColor = lifeRemain < 20 ? 'text-thinkpad-red' : lifeRemain < 50 ? 'text-[#b8864e]' : 'text-[#5a9e85]';

  const poDays = Math.floor(metrics.power_on_hours / 24);
  const poSub = poDays >= 365
    ? `≈ ${poDays.toLocaleString('pl-PL')} dni · ${(poDays / 365).toFixed(1)} lat`
    : `≈ ${poDays.toLocaleString('pl-PL')} dni · power_on_hours`;

  return (
    <div className={`border ${s.border} ${s.bg}`}>

      {/* Hardware identity strip */}
      <div className="px-5 py-2.5 border-b border-neutral-800/40 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0">
          <HardDrive size={10} className="text-thinkpad-muted shrink-0" />
          <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider truncate">
            {audit.target}
          </span>
        </div>
        <span className="text-neutral-800 shrink-0">·</span>
        <span className="font-mono text-xs text-neutral-600 shrink-0">
          S/N:&nbsp;{audit.serial}
        </span>
        <span className="text-neutral-800 shrink-0">·</span>
        <span className="font-mono text-xs text-neutral-600 flex items-center gap-1.5 shrink-0">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2e5f80]" />
          {audit.node}
        </span>
      </div>

      {/* Status header */}
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="relative flex h-3 w-3 shrink-0 mt-1">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${s.dotColor} opacity-40`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${s.dotColor}`} />
          </span>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`font-mono text-sm font-bold uppercase tracking-widest ${s.color} ${isCritical ? 'animate-pulse' : ''}`}>
                {audit.health_status}
              </span>
              <span className="font-mono text-xs border border-neutral-700 px-2 py-0.5 text-neutral-500 flex items-center gap-1.5"
                title="Self-Monitoring, Analysis and Reporting Technology — dane wprost z dysku, bez pośredników.">
                <HardDrive size={10} />
                S.M.A.R.T. monitor
              </span>
            </div>
            <p className="font-mono text-xs text-thinkpad-muted mt-1.5 leading-relaxed">
              {audit.sre_message}
            </p>
            <p className="font-mono text-xs text-neutral-700 mt-1 italic"
              title="Oficjalna diagnoza sprzętowa. Przymknij oko na te kilkanaście tysięcy błędów.">
              self-diagnosis:&nbsp;{audit.firmware_verdict}
            </p>
          </div>
        </div>
        {isCritical && (
          <span className={`font-mono text-xs border px-2 py-0.5 shrink-0 flex items-center gap-1.5 animate-pulse ${audit.alert_level === 'Radioactive'
            ? 'text-[#a855f7] border-[#7c3aed]/40'
            : 'text-thinkpad-red border-thinkpad-red/30'
            }`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${s.dotColor}`} />
            {audit.alert_level.toUpperCase()}
          </span>
        )}
      </div>

      {/* Primary counter — reported_uncorrectable_ecc */}
      <div className="border-t border-neutral-800/60 px-5 py-4"
        title="Błędy ECC, których sprzętowy korektor nie zdołał naprawić. Każdy to potencjalna trwała utrata danych.">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Skull size={10} /> Błędy ECC bez korekcji
            </span>
            <span className={`font-mono text-4xl font-bold tabular-nums leading-none ${s.color}`}>
              {metrics.reported_uncorrectable_ecc.toLocaleString('pl-PL')}
            </span>
          </div>
          <span className="font-mono text-xs text-neutral-800 text-right mt-1 shrink-0 leading-relaxed">
            reported_<br />uncorrectable_ecc
          </span>
        </div>
      </div>

      {/* Life Remaining + Combat Experience */}
      <div className="grid grid-cols-2 gap-px border-t border-neutral-800/60 bg-neutral-800/30">

        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-2"
          title="Pozostała żywotność nośnika NAND. Poniżej 30% — strefa niebezpieczna. Zero = koniec.">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
            <Gauge size={10} /> Life Remaining
          </span>
          <div className="flex items-center gap-3">
            <CircularProgress pct={lifeRemain} stroke={lifeStroke} textColor={lifeColor} />
            <div className="flex flex-col gap-0.5">
              <span className={`font-mono text-xs leading-tight ${lifeColor}`}>
                {100 - lifeRemain}% wear level
              </span>
              <span className="font-mono text-xs text-neutral-600 leading-tight">
                lifetime_remain_pct
              </span>
            </div>
          </div>
        </div>

        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-1"
          title="Łączny czas pracy dysku. Dłuższy staż = wyższe zużycie. Ten dysk walczył.">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={10} /> Czas w służbie
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tabular-nums text-white">
              {metrics.power_on_hours.toLocaleString('pl-PL')}
            </span>
            <span className="font-mono text-sm text-thinkpad-muted">h</span>
          </div>
          <span className="font-mono text-xs text-neutral-600 leading-relaxed">{poSub}</span>
        </div>

      </div>

      {/* Incydenty + Nieczytelne + Tętno */}
      <div className="grid grid-cols-3 gap-px border-t border-neutral-800/60 bg-neutral-800/30">

        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-1"
          title="Liczba zdarzeń relokacji — ile razy kontroler przeniósł dane z uszkodzonego sektora do rezerwowego.">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
            <RefreshCw size={10} /> Incydenty
          </span>
          <span className={`font-mono text-2xl font-bold tabular-nums ${metrics.reallocated_events > 0 ? 'text-[#b8864e]' : 'text-[#5a9e85]'
            }`}>
            {metrics.reallocated_events}
          </span>
          <span className="font-mono text-xs text-neutral-600">reallocated_events</span>
        </div>

        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-1"
          title="Sektory nieczytelne podczas offline scan — dane bezpowrotnie utracone lub niedostępne.">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
            <Skull size={10} /> Nieczytelne
          </span>
          <span className={`font-mono text-2xl font-bold tabular-nums ${metrics.offline_uncorrectable > 0 ? 'text-thinkpad-red' : 'text-[#5a9e85]'
            }`}>
            {metrics.offline_uncorrectable}
          </span>
          <span className="font-mono text-xs text-neutral-600">offline_uncorrectable</span>
        </div>

        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-1"
          title="Średnie opóźnienie zapisu. Zdrowy SSD: &lt;1ms. Powyżej 100ms dysk zaczyna 'mulić'.">
          <span className={`font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5 ${isCritical ? 'animate-pulse' : ''
            }`}>
            <Activity size={10} /> Tętno
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono text-2xl font-bold tabular-nums ${latColor}`}>
              {latLabel}
            </span>
            <span className="font-mono text-sm text-thinkpad-muted">ms</span>
          </div>
          <span className="font-mono text-xs text-neutral-600">avg write lat</span>
        </div>

      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-neutral-800/60">
        <a
          href="/blog/homelab-20-architektura-totalna-od-druku-3d-po-kubernetes"
          className="font-mono text-xs text-neutral-700 hover:text-neutral-400 transition-colors duration-200 flex items-center gap-1.5 group"
        >
          // chaos engineering · k8s self-healing on real hardware ·
          <span className="text-neutral-700 group-hover:text-thinkpad-red transition-colors duration-200">{'</>'}</span>
          origin story ↗
        </a>
      </div>

    </div>
  );
};

// --- Cloudflare Edge widget ---

const CloudflareWidget: React.FC<{ data: CloudflareData }> = ({ data }) => {
  const cacheHit = parseFloat(data.performance.cache_hit_ratio_pct);
  const savedGb = parseFloat(data.performance.saved_transfer_gb);
  const uptime = parseFloat(data.reliability.synthetic_uptime_pct);
  const errorRate = parseFloat(data.reliability.edge_error_rate_pct);
  const visitors = data.traffic.unique_visitors_7d;
  const threats = data.security.threats_blocked;

  const bm = data.traffic.bot_management ?? null;
  const botTotal = bm ? (bm.human + bm.bot_good + bm.bot_bad + bm.other || 1) : 1;

  const uptimeColor = uptime >= 99.9 ? 'text-[#5a9e85]' : uptime >= 99 ? 'text-[#b8864e]' : 'text-thinkpad-red';
  const errorColor = errorRate < 0.5 ? 'text-[#5a9e85]' : errorRate < 2 ? 'text-[#b8864e]' : 'text-thinkpad-red';

  return (
    <div className="border border-[#f6821f]/25 bg-[#f6821f]/[0.015]">

      {/* Hero — threats blocked */}
      <div className="px-5 py-5 border-b border-neutral-800/60">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <ShieldAlert size={10} />
              Threats blocked
              <span className="text-neutral-700 ml-1">// WAF · Bot Fight Mode · DDoS mitigation</span>
            </span>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-5xl font-bold tabular-nums text-[#f6821f]">
                {threats.toLocaleString('pl-PL')}
              </span>
              <span className="font-mono text-sm text-thinkpad-muted">attacks / 7d</span>
            </div>
            <div className="mt-3">
              <Bar value={threats} max={500} colorClass="bg-[#f6821f]/60" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 border border-[#f6821f]/25 px-2.5 py-1 shrink-0 self-start mt-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f6821f] animate-pulse" />
            <span className="font-mono text-xs text-[#f6821f]/60 uppercase tracking-wider">edge active</span>
          </div>
        </div>
      </div>

      {/* Performance row */}
      <div className="grid grid-cols-2 gap-px border-b border-neutral-800/60 bg-neutral-800/30">

        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-2"
          title="Procent żądań obsłużony z cache Cloudflare — bez dotykania serwera domowego">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
            <Zap size={10} /> Cache hit ratio
          </span>
          <div className="flex items-baseline gap-1 leading-none">
            <span className="font-mono text-2xl font-bold tabular-nums text-[#f6821f]">
              {cacheHit.toFixed(1)}
            </span>
            <span className="font-mono text-sm text-thinkpad-muted">%</span>
          </div>
          <Bar value={cacheHit} colorClass="bg-[#f6821f]/45" />
        </div>

        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-2"
          title="Transfer zaoszczędzony przez CDN — GB, które nie obciążyły serwera domowego">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
            <Download size={10} /> Saved transfer
          </span>
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className="font-mono text-2xl font-bold tabular-nums text-[#f6821f]">
              {savedGb.toFixed(2)}
            </span>
            <span className="font-mono text-sm text-thinkpad-muted">GB</span>
          </div>
          <span className="font-mono text-xs text-neutral-600">spared from origin server</span>
        </div>

      </div>

      {/* Bot classification — full width (only when bot_management data available) */}
      {bm && (
        <div className="border-b border-neutral-800/60">
          <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-3"
            title="Klasyfikacja ruchu przez Cloudflare Bot Management — każde żądanie dostaje score 1-99">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
                <Users size={10} /> Traffic classification
                <span className="text-neutral-700 ml-1">// bot management · 7d</span>
              </span>
              <span className="font-mono text-xs text-thinkpad-muted tabular-nums">
                {botTotal.toLocaleString('pl-PL')} req total
              </span>
            </div>

            {/* Segmented bar */}
            <div className="h-[6px] w-full flex rounded-sm overflow-hidden gap-px bg-[#1e2028]">
              <div className="bg-[#5a9e85] transition-all duration-700" style={{ width: `${(bm.human / botTotal) * 100}%` }} />
              <div className="bg-[#6a9fbf] transition-all duration-700" style={{ width: `${(bm.bot_good / botTotal) * 100}%` }} />
              <div className="bg-thinkpad-red transition-all duration-700" style={{ width: `${(bm.bot_bad / botTotal) * 100}%` }} />
              <div className="bg-[#3a4050] transition-all duration-700" style={{ width: `${(bm.other / botTotal) * 100}%` }} />
            </div>

            {/* Legend row */}
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-sm bg-[#5a9e85] shrink-0" />
                  <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider">Human</span>
                </div>
                <span className="font-mono text-base font-bold tabular-nums text-[#5a9e85]">
                  {bm.human.toLocaleString('pl-PL')}
                </span>
                <span className="font-mono text-xs text-neutral-700">{((bm.human / botTotal) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-sm bg-[#6a9fbf] shrink-0" />
                  <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider">Crawlers</span>
                </div>
                <span className="font-mono text-base font-bold tabular-nums text-[#6a9fbf]">
                  {bm.bot_good.toLocaleString('pl-PL')}
                </span>
                <span className="font-mono text-xs text-neutral-700">{((bm.bot_good / botTotal) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-sm bg-thinkpad-red shrink-0" />
                  <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider">Threats</span>
                </div>
                <span className="font-mono text-base font-bold tabular-nums text-thinkpad-red">
                  {bm.bot_bad.toLocaleString('pl-PL')}
                </span>
                <span className="font-mono text-xs text-neutral-700">{((bm.bot_bad / botTotal) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-sm bg-[#3a4050] shrink-0" />
                  <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider">Other</span>
                </div>
                <span className="font-mono text-base font-bold tabular-nums text-neutral-500">
                  {bm.other.toLocaleString('pl-PL')}
                </span>
                <span className="font-mono text-xs text-neutral-700">{((bm.other / botTotal) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unique visitors + Edge uptime */}
      <div className="grid grid-cols-2 gap-px border-b border-neutral-800/60 bg-neutral-800/30">

        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-2"
          title="Unikalni odwiedzający z ostatnich 7 dni — distinct IP + fingerprint">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
            <Users size={10} /> Unique visitors
          </span>
          <div className="flex items-baseline gap-1 leading-none">
            <span className="font-mono text-2xl font-bold tabular-nums text-white">
              {visitors.toLocaleString('pl-PL')}
            </span>
            <span className="font-mono text-xs text-thinkpad-muted ml-0.5">/7d</span>
          </div>
          {data.traffic.top_countries && !bm && (
            <div className="flex gap-1.5 mt-0.5 flex-wrap">
              {data.traffic.top_countries.map(cc => (
                <span key={cc} className="font-mono text-xs border border-[#f6821f]/20 px-1.5 py-0.5 text-[#f6821f]/60 bg-[#f6821f]/[0.04]">
                  {cc}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-2"
          title="Uptime mierzony z perspektywy sieci Cloudflare — edge_error_rate jako dopełnienie do 100%">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
            <Globe size={10} /> Edge uptime
          </span>
          <div className="flex items-baseline gap-1 leading-none">
            <span className={`font-mono text-2xl font-bold tabular-nums ${uptimeColor}`}>
              {uptime.toFixed(2)}
            </span>
            <span className="font-mono text-sm text-thinkpad-muted">%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-mono text-xs tabular-nums ${errorColor}`}>
              err: {errorRate}%
            </span>
            <span className="font-mono text-xs text-neutral-700">edge_error_rate</span>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="px-5 py-3 flex justify-end">
        <a
          href="https://developers.cloudflare.com/api/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-neutral-700 hover:text-neutral-400 transition-colors duration-200 flex items-center gap-1.5 group"
        >
          <span className="text-neutral-700 group-hover:text-[#f6821f] transition-colors duration-200">{'</>'}</span>
          Cloudflare Analytics API · 7-day window
          <span className="text-neutral-700">↗</span>
        </a>
      </div>

    </div>
  );
};

// --- Cluster Topology widget ---

const PodTopologyView: React.FC<{
  pod: TopologyPod;
  isMyPod: boolean;
  isLast: boolean;
}> = ({ pod, isMyPod, isLast }) => {
  const parts = pod.name.split('-');
  // Nazwa deploymentu = wszystko poza ostatnimi 2 losowymi segmentami (hash poda)
  const deployName = parts.length > 2 ? parts.slice(0, -2).join('-') : pod.name;
  const hash = parts.length > 1 ? parts[parts.length - 1].slice(0, 6) : '';

  const isRunning = pod.status === 'Running';

  return (
    <div className="flex items-center gap-0">
      {/* Tree connector */}
      <span
        className="font-mono text-xs w-5 shrink-0 select-none"
        style={{ color: isMyPod ? 'rgba(90,158,133,0.5)' : '#404040' }}
      >
        {isLast ? '└' : '├'}
      </span>

      {/* Pod chip */}
      <div
        className={`flex-1 flex items-center gap-3 px-3 border font-mono text-xs min-w-0 transition-all duration-300 relative overflow-hidden ${isMyPod
          ? 'py-2 cursor-default'
          : 'py-1.5 border-neutral-800 bg-thinkpad-base cursor-help hover:border-neutral-700 opacity-60 hover:opacity-90'
          }`}
        style={isMyPod ? {
          borderColor: 'rgba(90,158,133,0.55)',
          background: 'linear-gradient(90deg, rgba(90,158,133,0.09) 0%, rgba(90,158,133,0.04) 60%, transparent 100%)',
          boxShadow: '0 0 0 1px rgba(90,158,133,0.15)',
        } : {}}
        title={`${pod.name}\nns: ${pod.namespace}\n${pod.status}`}
      >
        {/* Shimmer — tylko dla aktywnego */}
        {isMyPod && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(90,158,133,0.08) 50%, transparent 100%)',
              animation: 'shimmer 3s ease-in-out infinite',
            }}
          />
        )}

        {/* Status dot */}
        {isMyPod ? (
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5a9e85] opacity-40" />
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5a9e85] opacity-20" style={{ animationDelay: '0.5s' }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#5a9e85]" style={{ boxShadow: '0 0 5px rgba(90,158,133,0.6)' }} />
          </span>
        ) : isRunning ? (
          <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0 bg-[#5a9e85]" />
        ) : (
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b8864e] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#b8864e]" />
          </span>
        )}

        {/* Nazwa deploymentu */}
        <span
          className="truncate flex-1 min-w-0"
          style={isMyPod
            ? { color: '#5a9e85', fontWeight: 600, textShadow: '0 0 8px rgba(90,158,133,0.28)' }
            : { color: '#a3a3a3' }
          }
        >
          {deployName}
        </span>

        {/* Hash */}
        {hash && (
          <span
            className="shrink-0 text-[10px] tabular-nums"
            style={{ color: isMyPod ? 'rgba(90,158,133,0.4)' : '#404040' }}
          >
            #{hash}
          </span>
        )}

        {/* Namespace */}
        <span
          className="shrink-0 text-[10px] hidden sm:block"
          style={{ color: isMyPod ? 'rgba(90,158,133,0.5)' : '#404040' }}
        >
          {pod.namespace}
        </span>

        {/* SERVING badge */}
        {isMyPod && (
          <span
            className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold"
            style={{
              color: 'rgba(90,158,133,0.8)',
              border: '1px solid rgba(90,158,133,0.35)',
              background: 'rgba(90,158,133,0.08)',
            }}
          >
            ◉ serving
          </span>
        )}
      </div>
    </div>
  );
};

const NodeTopologyRow: React.FC<{
  node: TopologyNode;
  isMyNode: boolean;
  myPodName: string;
}> = ({ node, isMyNode, myPodName }) => {
  const isReady = node.status === 'True';

  return (
    <div
      className={`border transition-all duration-500 ${isMyNode ? 'border-[#5a9e85]/60' : 'border-neutral-800'}`}
      style={isMyNode ? { boxShadow: '0 0 0 1px rgba(90,158,133,0.18), 0 0 16px rgba(90,158,133,0.1)' } : {}}
    >
      {/* Node header */}
      <div className={`px-4 py-2.5 flex items-center gap-3 ${isMyNode ? 'bg-[#5a9e85]/10' : 'bg-thinkpad-base'
        }`}>
        {isMyNode ? (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5a9e85] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5a9e85]" style={{ boxShadow: '0 0 5px rgba(90,158,133,0.7)' }} />
          </span>
        ) : (
          <Server size={11} className="text-thinkpad-muted shrink-0" />
        )}
        <span className="font-mono text-xs text-white font-semibold">{node.name}</span>
        <span className={`font-mono text-[10px] uppercase tracking-wider ml-auto ${isReady ? 'text-[#5a9e85]' : 'text-thinkpad-red'
          }`}>
          {isReady ? (isMyNode ? '● READY & SERVING' : '● Ready') : '● Not Ready'}
        </span>
        <span className="font-mono text-[10px] text-neutral-700 tabular-nums">
          {node.pods.length}p
        </span>
      </div>

      {/* Pods */}
      {node.pods.length > 0 && (
        <div className="px-4 py-2 border-t border-neutral-800/50 space-y-1">
          {node.pods.map((pod, idx) => (
            <PodTopologyView
              key={pod.name}
              pod={pod}
              isMyPod={pod.name === myPodName}
              isLast={idx === node.pods.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ClusterTopologyWidget: React.FC<{ topology: TopologyData }> = ({ topology }) => {
  // Priorytet: window.MY_POD_NAME (InitContainer) → topology.whoami (backend fallback)
  const myPodName = window.MY_POD_NAME || topology.whoami?.pod || '';
  const myNode = topology.nodes.find(n => n.pods.some(p => p.name === myPodName));
  const myNodeName = myNode?.name ?? topology.whoami?.node ?? '';

  return (
    <div className="space-y-3">
      {[...topology.nodes]
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
        .map(node => (
          <NodeTopologyRow
            key={node.name}
            node={node}
            isMyNode={myNodeName === node.name}
            myPodName={myPodName}
          />
        ))}

      {/* Whoami footer */}
      <div className="pt-3 mt-1 border-t border-neutral-800/60 flex items-center gap-2 font-mono text-xs text-thinkpad-muted flex-wrap">
        {myPodName ? (
          <>
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5a9e85] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#5a9e85]" />
            </span>
            stronę serwuje:&nbsp;<span className="text-white">{myPodName}</span>
            {myNodeName && <>&nbsp;·&nbsp;node:&nbsp;<span className="text-white">{myNodeName}</span></>}
          </>
        ) : (
          <span className="text-neutral-700 italic">MY_POD_NAME nie wstrzyknięty</span>
        )}
      </div>
    </div>
  );
};

// --- Main ---

const Playground: React.FC = () => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const normalized: ApiResponse = {
        ...json,
        sla: (json.sla ?? (json.uptime_30d_pct !== undefined && json.daily !== undefined ? {
          uptime_30d_pct: json.uptime_30d_pct,
          current_streak_hours: json.current_streak_hours,
          total_downtime_minutes_30d: json.total_downtime_minutes_30d,
          response_time_p95_ms: json.response_time_p95_ms,
          daily: json.daily,
        } : null)),
      };
      setData(normalized);
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
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const widgetHeader = (icon: React.ReactNode, title: string, subtitle?: string) => (
    <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-mono text-sm text-white uppercase tracking-widest">{title}</span>
        {subtitle && <span className="font-mono text-xs text-thinkpad-muted">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-4">
        {!loading && (
          error
            ? <WifiOff size={13} className="text-thinkpad-red" />
            : <Wifi size={13} className="text-[#5a9e85]" />
        )}
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="text-thinkpad-muted hover:text-white transition-colors duration-200 disabled:opacity-30 cursor-pointer"
          aria-label="Odśwież dane"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );

  const bodyState = (children: React.ReactNode) => {
    if (loading) return (
      <div className="flex items-center justify-center py-12 gap-3 text-thinkpad-muted font-mono text-sm">
        <RefreshCw size={15} className="animate-spin" /> Łączenie z klastrem...
      </div>
    );
    if (error) return (
      <div className="flex flex-col items-center gap-2 py-8 font-mono text-sm">
        <div className="flex items-center gap-2 text-thinkpad-red">
          <AlertTriangle size={15} /> Brak połączenia z klastrem
        </div>
        <p className="text-xs text-thinkpad-muted">{error}</p>
      </div>
    );
    return children;
  };

  return (
    <div className="animate-fade-in">
      <div className="relative text-center mb-16 max-w-4xl mx-auto">
        <h1
          className="text-4xl sm:text-6xl font-extrabold text-white mb-6 tracking-tight font-mono"
          style={{ textShadow: '0 0 40px #0a0b10, 0 0 20px #0a0b10, 0 0 8px #0a0b10' }}
        >
          Home<span className="text-thinkpad-red">lab</span>
        </h1>
        <p
          className="text-lg text-thinkpad-muted max-w-2xl mx-auto font-mono border-l-2 border-thinkpad-red pl-4"
          style={{ textShadow: '0 0 30px #0a0b10, 0 0 15px #0a0b10' }}
        >
          Live status klastra K3s. Trzy nody, jeden cel.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-10">

        {/* Widget 1 — Cluster Overview */}
        <div className="bg-thinkpad-surface border border-neutral-800 shadow-2xl shadow-black/50">
          {widgetHeader(
            <Box size={15} className="text-thinkpad-red" />,
            'Cluster Overview',
            ':: k3s',
          )}
          <div className="p-6">
            {bodyState(data && <ClusterOverview cluster={data.cluster} />)}
          </div>
        </div>

        {/* Widget 2 — Cluster Topology */}
        <div className="bg-thinkpad-surface border border-neutral-800 shadow-2xl shadow-black/50">
          {widgetHeader(
            <Network size={15} className="text-thinkpad-red" />,
            'Cluster Topology',
            ':: nodes + pods',
          )}
          <div className="p-6">
            {bodyState(data && (
              data.topology
                ? <ClusterTopologyWidget topology={data.topology} />
                : <div className="flex items-center gap-2 py-4 font-mono text-xs text-thinkpad-muted">
                  <AlertTriangle size={13} /> Topology data not available
                </div>
            ))}
          </div>
        </div>

        {/* Widget 3 — SLA Tracker */}
        <div className="bg-thinkpad-surface border border-neutral-800 shadow-2xl shadow-black/50">
          {widgetHeader(
            <Shield size={15} className="text-[#5a9e85]" />,
            'SLA Tracker',
            ':: uptime · 30d',
          )}
          <div className="p-6">
            {bodyState(data && (
              data.sla
                ? <SLATracker sla={data.sla} />
                : <div className="flex items-center gap-2 py-8 font-mono text-xs text-thinkpad-muted">
                  <AlertTriangle size={13} /> SLA data not available — Blackbox Exporter not configured
                </div>
            ))}
          </div>
        </div>

        {/* Widget 3 — Cloudflare Edge */}
        <div className="bg-thinkpad-surface border border-neutral-800 shadow-2xl shadow-black/50">
          {widgetHeader(
            <Shield size={15} className="text-[#f6821f]" />,
            'Cloudflare Edge',
            ':: WAF + CDN + Analytics',
          )}
          <div className="p-6">
            {bodyState(data && (
              data.cloudflare?.security
                ? <CloudflareWidget data={data.cloudflare} />
                : <div className="flex items-center gap-2 py-4 font-mono text-xs text-thinkpad-muted">
                  <AlertTriangle size={13} /> Cloudflare API token not configured
                </div>
            ))}
          </div>
        </div>

        {/* Widget 4 — Node Metrics */}
        <div className="bg-thinkpad-surface border border-neutral-800 shadow-2xl shadow-black/50">
          {widgetHeader(
            <Cpu size={15} className="text-thinkpad-red" />,
            'Node Metrics',
            `:: ${data?.nodes.length ?? '—'} nodes`,
          )}
          <div className="p-6">
            {bodyState(data && (
              <>
                <div className="flex flex-col gap-3">
                  {[...data.nodes]
                    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
                    .map((node, i) => (
                      <NodeCard key={node.name} node={node} index={i} />
                    ))}
                </div>
                {lastUpdated && (
                  <div className="mt-5 text-right font-mono text-xs text-neutral-700">
                    updated: {lastUpdated.toLocaleTimeString('pl-PL')}&nbsp;·&nbsp;auto-refresh: 30s
                  </div>
                )}
              </>
            ))}
          </div>
        </div>

        {/* Widget 5 — Chaos Monkey Disk Audit */}
        <div className="bg-thinkpad-surface border border-neutral-800 shadow-2xl shadow-black/50">
          {widgetHeader(
            <HardDrive size={15} className="text-thinkpad-red" />,
            'Chaos Monkey Audit',
            ':: /dev/haos_monkey',
          )}
          <div className="p-6">
            {bodyState(data && (
              data.chaos_monkey_audit
                ? <ChaosMonkeyWidget audit={data.chaos_monkey_audit} />
                : <div className="flex items-center gap-2 py-4 font-mono text-xs text-thinkpad-muted">
                  <AlertTriangle size={13} /> Chaos Monkey offline — node niedostępny
                </div>
            ))}
          </div>
        </div>

        {/* Widget 6 — CI/CD Pipeline (The Forge) */}
        <PipelineVisualizer />

        {/* Widget 7 — ArgoCD Apps */}
        <ArgoCDApps
          apps={data?.argocd_apps ?? null}
          loading={loading}
          error={error}
          refreshing={refreshing}
          onRefresh={fetchData}
        />

      </div>
    </div>
  );
};

export default Playground;

// Production-ready dashboard: three nodes, one purpose.
