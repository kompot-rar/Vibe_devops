import React, { useState, useEffect, useCallback } from 'react';
import {
  Thermometer, RefreshCw, AlertTriangle,
  Wifi, WifiOff, Server, Cpu, MemoryStick, Clock, Box, ShieldCheck, Activity,
} from 'lucide-react';

// --- Types ---

interface ClusterInfo {
  totalPods: string;
  status: 'Healthy' | 'Warning' | 'Observed' | string;
  message: string;
  restarts24h: number;
  gitops: 'Synced' | 'Out of Sync' | string;
  lastUpdate: string;
}

interface NodeInfo {
  name: string;
  temp: string;
  cpu: string;
  ram: string;
  uptime: string;
}

interface ApiResponse {
  cluster: ClusterInfo;
  nodes: NodeInfo[];
}

// --- Paleta ---

const getTempLevel = (temp: number): 'ok' | 'warm' | 'hot' => {
  if (temp < 70) return 'ok';
  if (temp < 85) return 'warm';
  return 'hot';
};

const tempCfg = {
  ok:   { label: 'OK',   color: 'text-[#7a9fad]',    barColor: 'bg-[#3a6678]',    accentBorder: '#2a4a58' },
  warm: { label: 'WARM', color: 'text-[#b8864e]',    barColor: 'bg-[#7a5530]',    accentBorder: '#5a3c1e' },
  hot:  { label: 'HOT',  color: 'text-thinkpad-red',  barColor: 'bg-thinkpad-red', accentBorder: '#7a0014' },
};

const clusterStatusCfg: Record<string, {
  color: string; dotColor: string; bg: string; border: string;
}> = {
  Healthy:  { color: 'text-[#5a9e85]', dotColor: 'bg-[#5a9e85]', bg: 'bg-[#5a9e85]/5',   border: 'border-[#2a6654]/50' },
  Warning:  { color: 'text-[#b8864e]', dotColor: 'bg-[#b8864e]', bg: 'bg-[#7a5530]/10',  border: 'border-[#7a5530]/50' },
  Observed: { color: 'text-[#6a9fbf]', dotColor: 'bg-[#6a9fbf]', bg: 'bg-[#2e5f80]/10',  border: 'border-[#2e5f80]/50' },
};

const getStatusCfg = (status: string) =>
  clusterStatusCfg[status] ?? clusterStatusCfg['Observed'];

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
  <div className="h-[3px] bg-[#1e2028] rounded-sm overflow-hidden">
    <div
      className={`h-full ${colorClass} rounded-sm transition-all duration-700`}
      style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
    />
  </div>
);

const MetricRow: React.FC<{
  icon: React.ReactNode; label: string; value: string; unit: string;
  barValue: number; barMax?: number; barColor: string; valueColor?: string;
}> = ({ icon, label, value, unit, barValue, barMax, barColor, valueColor = 'text-white' }) => (
  <div className="grid grid-cols-[6rem_4rem_1fr] items-center gap-3">
    <div className="flex items-center gap-1.5 text-thinkpad-muted">
      {icon}
      <span className="font-mono text-xs uppercase tracking-wider">{label}</span>
    </div>
    <span className={`font-mono text-sm font-semibold ${valueColor} text-right tabular-nums`}>
      {value}<span className="text-xs font-normal text-thinkpad-muted">{unit}</span>
    </span>
    <Bar value={barValue} colorClass={barColor} max={barMax} />
  </div>
);

// --- Cluster Overview widget ---

const ClusterOverview: React.FC<{ cluster: ClusterInfo }> = ({ cluster }) => {
  const s = getStatusCfg(cluster.status);

  return (
    <div className={`border ${s.border} ${s.bg}`}>
      {/* Główny status + message */}
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="relative flex h-3 w-3 shrink-0 mt-1">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${s.dotColor} opacity-40`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${s.dotColor}`} />
          </span>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`font-mono text-sm font-bold uppercase tracking-widest ${s.color}`}>
                {cluster.status}
              </span>
              {/* GitOps badge */}
              <span
                className={`font-mono text-xs border px-2 py-0.5 flex items-center gap-1.5 cursor-default ${
                  cluster.gitops === 'Synced'
                    ? 'text-[#5a9e85] border-[#2a6654]/60'
                    : 'text-[#b8864e] border-[#7a5530]/60'
                }`}
                title="Live Kubernetes cluster is in 100% synchronization with the declarative state defined in the GitHub repository via ArgoCD. Changes go through Git — never applied manually."
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                  cluster.gitops === 'Synced'
                    ? 'bg-[#5a9e85]'
                    : 'bg-[#b8864e] animate-pulse'
                }`} />
                {cluster.gitops === 'Synced'
                  ? 'Infrastructure: code-complete'
                  : 'Manual drift detected — syncing...'}
              </span>
            </div>
            <p className="font-mono text-xs text-thinkpad-muted mt-1 max-w-md leading-relaxed flex items-start gap-1.5">
              <span className="inline-block w-1 h-1 rounded-full bg-thinkpad-muted/50 animate-pulse mt-1.5 shrink-0" />
              {cluster.message}
            </p>
          </div>
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
            <Box size={10} /> Pods running
          </span>
          <span className="font-mono text-2xl font-bold text-white tabular-nums">
            {cluster.totalPods}
          </span>
        </div>

        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-1">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={10} /> Recovery events (24h)
          </span>
          <div
            className="flex items-baseline gap-2"
            title={
              cluster.restarts24h > 0
                ? `W ciągu ostatnich 24h klaster wykrył i automatycznie naprawił ${cluster.restarts24h} incydent${cluster.restarts24h === 1 ? '' : cluster.restarts24h < 5 ? 'y' : 'ów'} bez ingerencji człowieka.`
                : 'Zero incydentów w ciągu ostatnich 24h. Klaster operuje w pełnej stabilności.'
            }
          >
            <span className={`font-mono text-2xl font-bold tabular-nums ${
              cluster.restarts24h === 0 ? 'text-white' : 'text-[#b8864e]'
            }`}>
              {cluster.restarts24h}
            </span>
            <span className="font-mono text-xs text-thinkpad-muted">
              {cluster.restarts24h === 0
                ? 'no events'
                : cluster.restarts24h === 1
                  ? 'event · recovered'
                  : 'events · recovered'}
            </span>
          </div>
        </div>

        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-1">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={10} /> Last sync
          </span>
          <span className="font-mono text-base font-semibold text-white tabular-nums">
            {timeAgo(cluster.lastUpdate)}
          </span>
          <span className="font-mono text-xs text-neutral-700 tabular-nums">
            {formatTimestamp(cluster.lastUpdate)}
          </span>
        </div>

      </div>

      {/* View Source */}
      <div className="px-5 py-3 border-t border-neutral-800/60 flex justify-end">
        <a
          href="https://github.com/kompot-rar/kubernetes/blob/master/manifests/monitoring/status-proxy.yaml"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-thinkpad-muted hover:text-white transition-colors duration-200 flex items-center gap-1.5 group"
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
  const temp  = parseFloat(node.temp);
  const cpu   = parseFloat(node.cpu);
  const ram   = parseFloat(node.ram);
  const level = getTempLevel(temp);
  const cfg   = tempCfg[level];

  return (
    <div
      className="bg-thinkpad-base border-l-2 border border-neutral-800/50 px-5 py-4 transition-colors duration-300"
      style={{
        borderLeftColor: cfg.accentBorder,
        backgroundImage: `linear-gradient(to bottom, ${cfg.accentBorder}0f 0px, transparent 40px)`,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server size={12} className="text-thinkpad-muted" />
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-widest">
            node-{String(index + 1).padStart(2, '0')}
          </span>
          <span className="font-mono text-xs text-neutral-700">/</span>
          <span className="font-mono text-sm text-neutral-300 font-semibold">{node.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-neutral-600 flex items-center gap-1">
            <Clock size={10} />
            {formatUptime(node.uptime)}
          </span>
          <span className={`font-mono text-xs ${cfg.color} tracking-widest`}>
            [{cfg.label}]
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <MetricRow
          icon={<Thermometer size={11} />} label="temp"
          value={temp.toFixed(1)} unit="°C"
          barValue={temp} barMax={100}
          barColor={cfg.barColor} valueColor={cfg.color}
        />
        <MetricRow
          icon={<Cpu size={11} />} label="cpu"
          value={cpu.toFixed(1)} unit="%"
          barValue={cpu} barColor="bg-[#2e5f80]" valueColor="text-[#6a9fbf]"
        />
        <MetricRow
          icon={<MemoryStick size={11} />} label="ram"
          value={ram.toFixed(1)} unit="%"
          barValue={ram} barColor="bg-[#2a6654]" valueColor="text-[#5a9e85]"
        />
      </div>
    </div>
  );
};

// --- Main ---

const Playground: React.FC = () => {
  const [data, setData]               = useState<ApiResponse | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing]   = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse = await res.json();
      setData(json);
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
            : <Wifi    size={13} className="text-[#5a9e85]" />
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
        <div
          className="absolute -inset-16 -z-10 backdrop-blur-xl"
          style={{
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 90%)',
          }}
        />
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-6 tracking-tight font-mono">
          Home<span className="text-thinkpad-red">lab</span>
        </h1>
        <p className="text-lg text-thinkpad-muted max-w-2xl mx-auto font-mono border-l-2 border-thinkpad-red pl-4">
          Live status klastra K3s. Trzy nody, jeden cel.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">

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

        {/* Widget 2 — Node Metrics */}
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
                  {data.nodes.map((node, i) => (
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

        {/* Placeholder */}
        <div className="border border-dashed border-neutral-800 p-6 text-center">
          <p className="font-mono text-xs text-neutral-700">
            // więcej widgetów wkrótce — network, storage, ArgoCD apps...
          </p>
        </div>

      </div>
    </div>
  );
};

export default Playground;
