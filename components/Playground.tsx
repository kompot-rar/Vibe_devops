import React, { useState, useEffect, useCallback } from 'react';
import { Thermometer, RefreshCw, AlertTriangle, Wifi, WifiOff, Server } from 'lucide-react';

interface NodeStatus {
  node: string;
  temp: string;
}

const getNodeIp = (node: string) => node.split(':')[0];

const getTempLevel = (temp: number): 'ok' | 'warm' | 'hot' => {
  if (temp < 55) return 'ok';
  if (temp < 65) return 'warm';
  return 'hot';
};

const tempLevelConfig = {
  ok:   { label: 'OK',   color: 'text-emerald-400', barColor: 'bg-emerald-400', borderColor: 'border-emerald-400/20' },
  warm: { label: 'WARM', color: 'text-yellow-400',  barColor: 'bg-yellow-400',  borderColor: 'border-yellow-400/20' },
  hot:  { label: 'HOT',  color: 'text-thinkpad-red', barColor: 'bg-thinkpad-red', borderColor: 'border-thinkpad-red/30' },
};

const NodeTempCard: React.FC<{ node: NodeStatus; index: number }> = ({ node, index }) => {
  const temp = parseFloat(node.temp);
  const ip = getNodeIp(node.node);
  const level = getTempLevel(temp);
  const cfg = tempLevelConfig[level];
  const barWidth = Math.min(100, temp);

  return (
    <div className={`bg-thinkpad-base border ${cfg.borderColor} p-5 rounded-none transition-all duration-300 hover:border-opacity-60`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server size={13} className="text-thinkpad-muted" />
          <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider">
            node-{String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <span className={`font-mono text-xs ${cfg.color} tracking-widest`}>
          [{cfg.label}]
        </span>
      </div>

      <div className="font-mono text-sm text-neutral-500 mb-4 tracking-tight">
        {ip}
      </div>

      <div className={`font-mono text-4xl font-bold ${cfg.color} mb-4 leading-none`}>
        {temp.toFixed(1)}<span className="text-xl font-normal">°C</span>
      </div>

      <div className="h-px bg-neutral-800 overflow-hidden">
        <div
          className={`h-full ${cfg.barColor} transition-all duration-700`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="font-mono text-xs text-neutral-700">0°</span>
        <span className="font-mono text-xs text-neutral-700">100°</span>
      </div>
    </div>
  );
};

const Playground: React.FC = () => {
  const [nodes, setNodes] = useState<NodeStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: NodeStatus[] = await res.json();
      setNodes(data);
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

  const avgTemp = nodes.length > 0
    ? (nodes.reduce((sum, n) => sum + parseFloat(n.temp), 0) / nodes.length).toFixed(1)
    : null;

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

      {/* Widgets grid */}
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Cluster Thermal widget */}
        <div className="bg-thinkpad-surface border border-neutral-800 shadow-2xl shadow-black/50">
          {/* Widget header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <Thermometer size={15} className="text-thinkpad-red" />
              <span className="font-mono text-sm text-white uppercase tracking-widest">
                Cluster Thermal
              </span>
              <span className="font-mono text-xs text-thinkpad-muted">:: k3s / 3 nodes</span>
            </div>
            <div className="flex items-center gap-4">
              {!loading && (
                error
                  ? <WifiOff size={13} className="text-thinkpad-red" />
                  : <Wifi size={13} className="text-emerald-400" />
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

          {/* Widget body */}
          <div className="p-6">
            {loading && (
              <div className="flex items-center justify-center py-12 gap-3 text-thinkpad-muted font-mono text-sm">
                <RefreshCw size={15} className="animate-spin" />
                Łączenie z klastrem...
              </div>
            )}

            {error && !loading && (
              <div className="flex items-center gap-3 py-8 text-thinkpad-red font-mono text-sm justify-center">
                <AlertTriangle size={15} />
                Błąd połączenia: {error}
              </div>
            )}

            {!loading && !error && (
              <>
                {/* Summary bar */}
                {avgTemp && (
                  <div className="flex items-center gap-3 font-mono text-xs text-thinkpad-muted mb-6">
                    <span className="text-neutral-600">AVG_TEMP</span>
                    <span className="text-white">{avgTemp}°C</span>
                    <span className="text-neutral-700">·</span>
                    <span className="text-neutral-600">NODES</span>
                    <span className="text-white">{nodes.length}</span>
                  </div>
                )}

                {/* Node cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {nodes.map((node, i) => (
                    <NodeTempCard key={node.node} node={node} index={i} />
                  ))}
                </div>

                {/* Footer */}
                {lastUpdated && (
                  <div className="mt-6 text-right font-mono text-xs text-neutral-700">
                    updated: {lastUpdated.toLocaleTimeString('pl-PL')}&nbsp;·&nbsp;auto-refresh: 30s
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Placeholder for future widgets */}
        <div className="border border-dashed border-neutral-800 p-6 text-center">
          <p className="font-mono text-xs text-neutral-700">
            // więcej widgetów wkrótce — CPU, RAM, pods, ...
          </p>
        </div>

      </div>
    </div>
  );
};

export default Playground;
