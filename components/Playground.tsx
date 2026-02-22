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
  ok:   { label: 'OK',   color: 'text-emerald-400', barColor: 'bg-emerald-400', border: 'border-emerald-400/20' },
  warm: { label: 'WARM', color: 'text-yellow-400',  barColor: 'bg-yellow-400',  border: 'border-yellow-400/20' },
  hot:  { label: 'HOT',  color: 'text-thinkpad-red', barColor: 'bg-thinkpad-red', border: 'border-thinkpad-red/30' },
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

const MetricRow: React.FC<{
  label: string;
  value: string;
  unit: string;
  barWidth: number;
  barColor: string;
}> = ({ label, value, unit, barWidth, barColor }) => (
  <div>
    <div className="flex justify-between items-baseline mb-1">
      <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider">{label}</span>
      <span className="font-mono text-sm text-white">
        {value}<span className="text-xs text-thinkpad-muted">{unit}</span>
      </span>
    </div>
    <div className="h-px bg-neutral-800">
      <div
        className={`h-full ${barColor} transition-all duration-700`}
        style={{ width: `${Math.min(100, barWidth)}%` }}
      />
    </div>
  </div>
);

const NodeCard: React.FC<{ node: NodeInfo; index: number }> = ({ node, index }) => {
  const temp = parseFloat(node.temp);
  const cpu  = parseFloat(node.cpu);
  const ram  = parseFloat(node.ram);
  const level = getTempLevel(temp);
  const cfg   = tempCfg[level];

  return (
    <div className={`bg-thinkpad-base border ${cfg.border} p-5 rounded-none`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server size={13} className="text-thinkpad-muted" />
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider">
            node-{String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <span className={`font-mono text-xs ${cfg.color} tracking-widest`}>[{cfg.label}]</span>
      </div>

      <div className="font-mono text-sm text-neutral-500 mb-5 tracking-tight">{node.name}</div>

      {/* Metrics */}
      <div className="space-y-4">
        {/* Temp */}
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1">
              <Thermometer size={11} /> temp
            </span>
            <span className={`font-mono text-lg font-bold ${cfg.color} leading-none`}>
              {temp.toFixed(1)}<span className="text-xs font-normal">°C</span>
            </span>
          </div>
          <div className="h-px bg-neutral-800">
            <div
              className={`h-full ${cfg.barColor} transition-all duration-700`}
              style={{ width: `${Math.min(100, temp)}%` }}
            />
          </div>
        </div>

        <MetricRow
          label="cpu"
          value={cpu.toFixed(1)}
          unit="%"
          barWidth={cpu}
          barColor="bg-neon-blue"
        />
        <MetricRow
          label="ram"
          value={ram.toFixed(1)}
          unit="%"
          barWidth={ram}
          barColor="bg-violet-500"
        />

        {/* Uptime */}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-800">
          <span className="font-mono text-xs text-thinkpad-muted flex items-center gap-1">
            <Clock size={11} /> uptime
          </span>
          <span className="font-mono text-xs text-neutral-400">{formatUptime(node.uptime)}</span>
        </div>
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

  const bodyContent = (children: React.ReactNode) => {
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
            {bodyContent(data && (
              <div className="flex flex-wrap items-center gap-6 font-mono text-sm">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      data.cluster.status === 'Healthy' ? 'bg-emerald-400' : 'bg-thinkpad-red'
                    }`}
                  />
                  <span className={data.cluster.status === 'Healthy' ? 'text-emerald-400' : 'text-thinkpad-red'}>
                    {data.cluster.status}
                  </span>
                </div>

                <div className="text-neutral-700">|</div>

                {/* Pods */}
                <div className="flex items-center gap-2 text-thinkpad-muted">
                  <Box size={13} />
                  <span>Pods:</span>
                  <span className="text-white">{data.cluster.totalPods}</span>
                </div>

                <div className="text-neutral-700">|</div>

                {/* Last update from cluster */}
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
            {bodyContent(data && (
              <>
                <div className="flex flex-col gap-4">
                  {data.nodes.map((node, i) => (
                    <NodeCard key={node.name} node={node} index={i} />
                  ))}
                </div>
                {lastUpdated && (
                  <div className="mt-6 text-right font-mono text-xs text-neutral-700">
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
