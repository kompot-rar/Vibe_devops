import React, { useState, useEffect, useCallback } from 'react';
import {
  Thermometer, RefreshCw, AlertTriangle,
  Wifi, WifiOff, Server, Cpu, MemoryStick, Clock, Box,
} from 'lucide-react';

// --- Types ---

interface ClusterInfo {
  totalPods: string;
  status: string;
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

// --- Helpers ---

const getTempLevel = (temp: number): 'ok' | 'warm' | 'hot' => {
  if (temp < 70) return 'ok';
  if (temp < 85) return 'warm';
  return 'hot';
};

const tempCfg = {
  ok:   { label: 'OK',   color: 'text-emerald-400', barColor: 'bg-emerald-400', accentBorder: '#34d399' },
  warm: { label: 'WARM', color: 'text-yellow-400',  barColor: 'bg-yellow-400',  accentBorder: '#facc15' },
  hot:  { label: 'HOT',  color: 'text-thinkpad-red', barColor: 'bg-thinkpad-red', accentBorder: '#ff002b' },
};

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
    return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
};

// --- Sub-components ---

const Bar: React.FC<{ value: number; colorClass: string; max?: number }> = ({
  value,
  colorClass,
  max = 100,
}) => (
  <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
    <div
      className={`h-full ${colorClass} rounded-full transition-all duration-700`}
      style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
    />
  </div>
);

const MetricRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  barValue: number;
  barMax?: number;
  barColor: string;
  valueColor?: string;
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

const NodeCard: React.FC<{ node: NodeInfo; index: number }> = ({ node, index }) => {
  const temp  = parseFloat(node.temp);
  const cpu   = parseFloat(node.cpu);
  const ram   = parseFloat(node.ram);
  const level = getTempLevel(temp);
  const cfg   = tempCfg[level];

  return (
    <div
      className="bg-thinkpad-base border-l-2 border border-neutral-800/60 px-5 py-4 transition-colors duration-300"
      style={{ borderLeftColor: cfg.accentBorder }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server size={12} className="text-thinkpad-muted" />
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-widest">
            node-{String(index + 1).padStart(2, '0')}
          </span>
          <span className="font-mono text-xs text-neutral-700">/</span>
          <span className="font-mono text-sm text-neutral-400">{node.name}</span>
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

      {/* Metrics */}
      <div className="space-y-3">
        <MetricRow
          icon={<Thermometer size={11} />}
          label="temp"
          value={temp.toFixed(1)}
          unit="°C"
          barValue={temp}
          barMax={100}
          barColor={cfg.barColor}
          valueColor={cfg.color}
        />
        <MetricRow
          icon={<Cpu size={11} />}
          label="cpu"
          value={cpu.toFixed(1)}
          unit="%"
          barValue={cpu}
          barColor="bg-thinkpad-red"
        />
        <MetricRow
          icon={<MemoryStick size={11} />}
          label="ram"
          value={ram.toFixed(1)}
          unit="%"
          barValue={ram}
          barColor="bg-neon-blue"
        />
      </div>
    </div>
  );
};

// --- Main component ---

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
            : <Wifi    size={13} className="text-emerald-400" />
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
      <div className="flex items-center gap-3 py-8 text-thinkpad-red font-mono text-sm justify-center">
        <AlertTriangle size={15} /> Błąd połączenia: {error}
      </div>
    );
    return children;
  };

  return (
    <div className="animate-fade-in">
      {/* Page header */}
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
          <div className="px-6 py-5">
            {bodyState(data && (
              <div className="flex flex-wrap items-center gap-6 font-mono text-sm">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    data.cluster.status === 'Healthy' ? 'bg-emerald-400' : 'bg-thinkpad-red'
                  }`} />
                  <span className={data.cluster.status === 'Healthy' ? 'text-emerald-400' : 'text-thinkpad-red'}>
                    {data.cluster.status}
                  </span>
                </div>

                <span className="text-neutral-700">|</span>

                <div className="flex items-center gap-2 text-thinkpad-muted">
                  <Box size={13} />
                  <span>Pods:</span>
                  <span className="text-white">{data.cluster.totalPods}</span>
                </div>

                <span className="text-neutral-700">|</span>

                <div className="flex items-center gap-2 text-thinkpad-muted">
                  <Clock size={13} />
                  <span>Last update:</span>
                  <span className="text-white">{formatTimestamp(data.cluster.lastUpdate)}</span>
                </div>
              </div>
            ))}
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
