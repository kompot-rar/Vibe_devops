import React, { useState, useEffect, useCallback } from 'react';
import {
  Thermometer, RefreshCw, AlertTriangle,
  Wifi, WifiOff, Server, Cpu, MemoryStick, Clock, Box, ShieldCheck, Activity, GitBranch,
  HardDrive, Skull, Gauge,
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

interface ChaosMonkeyMetrics {
  reported_uncorrectable_ecc: number;
  reallocated_sectors: number;
  reallocated_events: number;
  offline_uncorrectable: number;
  ssd_wear_cycles: number;
  avg_write_lat_sec: number;
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

interface ApiResponse {
  cluster: ClusterInfo;
  nodes: NodeInfo[];
  chaos_monkey_audit?: ChaosMonkeyAudit;
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

const alertLevelCfg: Record<string, {
  color: string; dotColor: string; bg: string; border: string;
}> = {
  Radioactive: { color: 'text-[#a855f7]',      dotColor: 'bg-[#a855f7]',      bg: 'bg-[#4c1d95]/10',   border: 'border-[#7c3aed]/40'  },
  Critical:    { color: 'text-thinkpad-red',    dotColor: 'bg-thinkpad-red',    bg: 'bg-thinkpad-red/5', border: 'border-thinkpad-red/40' },
  Warning:     { color: 'text-[#b8864e]',       dotColor: 'bg-[#b8864e]',       bg: 'bg-[#7a5530]/10',   border: 'border-[#7a5530]/50'  },
  Nominal:     { color: 'text-[#5a9e85]',       dotColor: 'bg-[#5a9e85]',       bg: 'bg-[#5a9e85]/5',    border: 'border-[#2a6654]/50'  },
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
              {/* ArgoCD GitOps badge */}
              <span
                className={`font-mono text-xs border px-2 py-0.5 flex items-center gap-1.5 cursor-default ${
                  cluster.gitops === 'Synced'
                    ? 'text-[#5a9e85] border-[#2a6654]/60'
                    : 'text-[#b8864e] border-[#7a5530]/60'
                }`}
                title="ArgoCD continuously reconciles the live Kubernetes cluster against the declarative state in the GitHub repository. Changes go through Git — never applied manually."
              >
                <GitBranch size={11} />
                <span className="text-neutral-500">ArgoCD</span>
                <span className="text-neutral-700">·</span>
                <span className={cluster.gitops !== 'Synced' ? 'animate-pulse' : ''}>
                  {cluster.gitops === 'Synced' ? 'Synced' : 'Out of Sync'}
                </span>
              </span>
            </div>
            <p className="font-mono text-xs text-thinkpad-muted mt-1 leading-relaxed">
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
                ? 'brak zdarzeń'
                : cluster.restarts24h === 1
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

// --- Chaos Monkey Disk Audit widget ---

const ChaosMonkeyWidget: React.FC<{ audit: ChaosMonkeyAudit }> = ({ audit }) => {
  const { metrics } = audit;
  const s           = getAlertLevelCfg(audit.alert_level);
  const isCritical  = audit.alert_level === 'Radioactive' || audit.alert_level === 'Critical';

  const latMs    = metrics.avg_write_lat_sec * 1000;
  const latLabel = latMs < 10 ? latMs.toFixed(2) : latMs.toFixed(1);
  const latColor = latMs > 100 ? 'text-thinkpad-red' : latMs > 50 ? 'text-[#b8864e]' : 'text-[#5a9e85]';

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
          <span className={`font-mono text-xs border px-2 py-0.5 shrink-0 flex items-center gap-1.5 animate-pulse ${
            audit.alert_level === 'Radioactive'
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

      {/* Secondary counters — reallocated + offline */}
      <div className="grid grid-cols-3 gap-px border-t border-neutral-800/60 bg-neutral-800/30">

        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-1"
          title="Fizycznie uszkodzone sektory zastąpione rezerwowymi. Rosnący licznik = degradacja nośnika.">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle size={10} /> Realok. sektory
          </span>
          <span className={`font-mono text-2xl font-bold tabular-nums ${
            metrics.reallocated_sectors > 0 ? 'text-thinkpad-red' : 'text-[#5a9e85]'
          }`}>
            {metrics.reallocated_sectors}
          </span>
          <span className="font-mono text-xs text-neutral-600">reallocated_sectors</span>
        </div>

        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-1"
          title="Liczba zdarzeń relokacji — ile razy kontroler przeniósł dane z uszkodzonego sektora do rezerwowego.">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
            <RefreshCw size={10} /> Incydenty
          </span>
          <span className={`font-mono text-2xl font-bold tabular-nums ${
            metrics.reallocated_events > 0 ? 'text-[#b8864e]' : 'text-[#5a9e85]'
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
          <span className={`font-mono text-2xl font-bold tabular-nums ${
            metrics.offline_uncorrectable > 0 ? 'text-thinkpad-red' : 'text-[#5a9e85]'
          }`}>
            {metrics.offline_uncorrectable}
          </span>
          <span className="font-mono text-xs text-neutral-600">offline_uncorrectable</span>
        </div>

      </div>

      {/* Tertiary — wear + latency */}
      <div className="grid grid-cols-2 gap-px border-t border-neutral-800/60 bg-neutral-800/30">

        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-1"
          title="Wear leveling count — łączna liczba cykli zapisu (P/E). Im wyższa, tym bliżej kresu żywotności nośnika flash.">
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
            <Gauge size={10} /> Przebieg
          </span>
          <span className="font-mono text-2xl font-bold tabular-nums text-[#b8864e]">
            {metrics.ssd_wear_cycles.toLocaleString('pl-PL')}
          </span>
          <span className="font-mono text-xs text-neutral-600">wear cycles (P/E)</span>
        </div>

        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-1"
          title="Średnie opóźnienie zapisu. Zdrowy SSD: &lt;1ms. Powyżej 100ms dysk zaczyna 'mulić'.">
          <span className={`font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5 ${
            isCritical ? 'animate-pulse' : ''
          }`}>
            <Activity size={10} /> Tętno
          </span>
          <span className={`font-mono text-2xl font-bold tabular-nums ${latColor}`}>
            {latLabel}
          </span>
          <span className="font-mono text-xs text-neutral-600">ms avg write lat</span>
        </div>

      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-neutral-800/60 flex justify-between items-center">
        <span className="font-mono text-xs text-neutral-700 italic">
          // chaos engineering · deliberate failure source · k8s self-healing on real hardware
        </span>
        <a
          href="/blog/homelab-20-architektura-totalna-od-druku-3d-po-kubernetes"
          className="font-mono text-xs text-neutral-700 hover:text-neutral-400 transition-colors duration-200 flex items-center gap-1.5 group"
        >
          <span className="text-neutral-700 group-hover:text-thinkpad-red transition-colors duration-200">{'</>'}</span>
          origin story ↗
        </a>
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

        {/* Widget 3 — Chaos Monkey Disk Audit */}
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

      </div>
    </div>
  );
};

export default Playground;
