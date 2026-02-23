import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  GitBranch, Box, Package, RefreshCw, Server,
  Terminal, Wifi, WifiOff, AlertTriangle, ExternalLink,
} from 'lucide-react';

// ---- Types ----

interface JobStep {
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'skipped' | 'cancelled' | null;
  number: number;
  started_at: string | null;
  completed_at: string | null;
}

interface StepWithJob extends JobStep {
  jobId: number;
}

interface WorkflowJob {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  steps: JobStep[];
  html_url: string;
}

interface WorkflowRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  head_sha: string;
  head_commit: { message: string; author: { name: string }; timestamp: string };
  created_at: string;
  updated_at: string;
  html_url: string;
}

interface PipelineResponse { run: WorkflowRun; jobs: WorkflowJob[] }

type StageStatus = 'pending' | 'queued' | 'in_progress' | 'success' | 'failure' | 'skipped';

interface Stage {
  id: string;
  label: string;
  Icon: React.ElementType;
  keywords: string[];
  matchedSteps: StepWithJob[];
  jobId: number | null;
  status: StageStatus;
}

// ---- Stage definitions ----

const STAGE_DEFS = [
  { id: 'source',   label: 'SOURCE',   Icon: GitBranch, keywords: ['checkout', 'clone'] },
  { id: 'forge',    label: 'FORGE',    Icon: Box,       keywords: ['build', 'compile', 'setup', 'install', 'dependencies', 'buildx'] },
  { id: 'registry', label: 'REGISTRY', Icon: Package,   keywords: ['push', 'registry', 'ghcr', 'docker', 'login'] },
  { id: 'gitops',   label: 'GITOPS',   Icon: RefreshCw, keywords: ['sync', 'argo', 'manifest', 'gitops', 'update', 'tag'] },
  { id: 'cluster',  label: 'CLUSTER',  Icon: Server,    keywords: ['k3s', 'kubectl', 'deploy', 'verify', 'health', 'rollout'] },
];

// ---- Helpers ----

const shortSha = (sha: string) => sha.slice(0, 7);
const firstLine = (msg: string) => msg.split('\n')[0].slice(0, 55);

const leadTime = (start: string, end: string): string => {
  const s = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (s < 0) return '—';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `T+${pad(h)}:${pad(m)}:${pad(sec)}` : `T+${pad(m)}:${pad(sec)}`;
};

// Parse GitHub Actions log: extract lines belonging to given step names via ##[group] markers.
// Falls back to last 80 lines of the whole log if no groups match.
function extractStepLogs(allLines: string[], stepNames: string[]): string[] {
  const result: string[] = [];
  let inSection = false;

  for (const line of allLines) {
    if (line.startsWith('##[group]')) {
      const groupName = line.slice(9).trim();
      inSection = stepNames.some(n =>
        groupName.toLowerCase() === n.toLowerCase() ||
        groupName.toLowerCase().includes(n.toLowerCase()) ||
        n.toLowerCase().includes(groupName.toLowerCase())
      );
      if (inSection) result.push(`\x00group\x00${groupName}`); // marker for rendering
    } else if (line.startsWith('##[endgroup]')) {
      inSection = false;
    } else if (inSection) {
      const clean = line
        .replace(/^##\[command\]/, '$ ')
        .replace(/^##\[warning\]/, '⚠ ')
        .replace(/^##\[error\]/, '✗ ')
        .replace(/^##\[debug\].*/, '');
      if (clean.trim()) result.push(clean);
    }
  }

  return result.length > 0 ? result : allLines.slice(-80).filter(l => !l.startsWith('##[debug]'));
}

function resolveStages(jobs: WorkflowJob[], run: WorkflowRun): Stage[] {
  const allSteps: StepWithJob[] = jobs.flatMap(j =>
    (j.steps ?? []).map(s => ({ ...s, jobId: j.id }))
  );
  const used = new Set<number>();

  const stages: Stage[] = STAGE_DEFS.map(def => {
    const matched = allSteps.filter(s => {
      if (used.has(s.number)) return false;
      return def.keywords.some(kw => s.name.toLowerCase().includes(kw));
    });
    matched.forEach(s => used.add(s.number));

    let status: StageStatus = 'pending';
    if (matched.length > 0) {
      if (matched.some(s => s.status === 'in_progress'))                                    status = 'in_progress';
      else if (matched.some(s => s.conclusion === 'failure'))                               status = 'failure';
      else if (matched.some(s => s.status === 'queued'))                                    status = 'queued';
      else if (matched.every(s => s.conclusion === 'success' || s.conclusion === 'skipped')) status = 'success';
    } else if (run.status === 'completed') {
      status = run.conclusion === 'success' ? 'success'
             : run.conclusion === 'failure' ? 'failure'
             : 'skipped';
    }

    return {
      ...def,
      matchedSteps: matched,
      jobId: matched[0]?.jobId ?? jobs[0]?.id ?? null,
      status,
    };
  });

  const unmatched = allSteps.filter(s => !used.has(s.number));
  if (unmatched.length > 0) {
    const forge = stages.find(s => s.id === 'forge');
    if (forge) forge.matchedSteps.push(...unmatched);
  }

  return stages;
}

const runStatusLabel = (run: WorkflowRun): string => {
  if (run.status === 'in_progress')   return 'DEPLOYING';
  if (run.status === 'queued')        return 'QUEUED';
  if (run.conclusion === 'success')   return 'SUCCESS';
  if (run.conclusion === 'failure')   return 'FAILED';
  if (run.conclusion === 'cancelled') return 'CANCELLED';
  return 'UNKNOWN';
};

// ---- Status palette ----

const statusCfg: Record<StageStatus, { nodeColor: string; dot: string; pulse: boolean }> = {
  success:     { nodeColor: 'text-[#5a9e85]',    dot: 'bg-[#5a9e85]',    pulse: false },
  failure:     { nodeColor: 'text-thinkpad-red',  dot: 'bg-thinkpad-red', pulse: false },
  in_progress: { nodeColor: 'text-[#6a9fbf]',    dot: 'bg-[#6a9fbf]',   pulse: true  },
  queued:      { nodeColor: 'text-thinkpad-muted', dot: 'bg-neutral-600', pulse: true  },
  pending:     { nodeColor: 'text-neutral-700',   dot: 'bg-neutral-800', pulse: false },
  skipped:     { nodeColor: 'text-neutral-700',   dot: 'bg-neutral-800', pulse: false },
};

// ---- Stage Node ----

const StageNode: React.FC<{
  stage: Stage;
  active: boolean;
  isLast: boolean;
  onClick: () => void;
}> = ({ stage, active, isLast, onClick }) => {
  const cfg = statusCfg[stage.status];
  const { Icon } = stage;

  return (
    <div className="flex items-center flex-1 min-w-0">
      <div className="flex flex-col items-center gap-2" style={{ flex: '0 0 auto' }}>
        <button
          onClick={onClick}
          className={`relative w-12 h-12 border-2 flex items-center justify-center transition-all duration-300 cursor-pointer ${
            active
              ? 'border-thinkpad-red bg-thinkpad-red/10'
              : 'border-neutral-700 bg-thinkpad-surface hover:border-neutral-500'
          }`}
          title={`${stage.label} · ${stage.status}`}
        >
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            {cfg.pulse && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-40`} />
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cfg.dot}`} />
          </span>
          <Icon size={18} className={cfg.nodeColor} />
        </button>
        <span className={`font-mono text-[10px] uppercase tracking-widest ${active ? 'text-white' : 'text-thinkpad-muted'}`}>
          {stage.label}
        </span>
      </div>

      {!isLast && (
        <div className={`flex-1 h-px mx-2 transition-colors duration-500 ${
          stage.status === 'success'     ? 'bg-[#2a6654]' :
          stage.status === 'failure'     ? 'bg-thinkpad-red/40' :
          stage.status === 'in_progress' ? 'bg-[#2e5f80]/60' :
          'bg-neutral-800'
        }`} />
      )}
    </div>
  );
};

// ---- Log line coloring ----

const logLineClass = (line: string): string => {
  if (line.startsWith('\x00group\x00'))    return 'text-[#6a9fbf] font-semibold';
  if (line.startsWith('✗') || line.includes('error') || line.includes('Error') || line.includes('ERROR'))
                                           return 'text-thinkpad-red';
  if (line.startsWith('⚠') || line.includes('warning') || line.includes('Warning'))
                                           return 'text-[#b8864e]';
  if (line.startsWith('$ '))               return 'text-[#5a9e85]';
  return 'text-neutral-500';
};

const logLineText = (line: string): string =>
  line.startsWith('\x00group\x00') ? `▶ ${line.slice(8)}` : line;

// ---- Terminal ----

const TerminalView: React.FC<{
  lines: string[];
  loading: boolean;
  failed: boolean;
  stageLabel: string;
}> = ({ lines, loading, failed, stageLabel }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(0);
    if (lines.length === 0) return;
    const delay = lines.length > 60 ? 12 : 40;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(i);
      if (i >= lines.length) clearInterval(id);
    }, delay);
    return () => clearInterval(id);
  }, [lines]);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [shown]);

  return (
    <div className={`border transition-colors duration-300 ${failed ? 'border-thinkpad-red/50' : 'border-neutral-800'}`}>
      <div className={`px-4 py-2 border-b flex items-center gap-2 ${
        failed ? 'border-thinkpad-red/30 bg-thinkpad-red/5' : 'border-neutral-800'
      }`}>
        <Terminal size={11} className={failed ? 'text-thinkpad-red' : 'text-thinkpad-muted'} />
        <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider">
          {stageLabel}
        </span>
        {loading && (
          <span className="ml-auto font-mono text-xs text-[#6a9fbf] animate-pulse flex items-center gap-1.5">
            <RefreshCw size={10} className="animate-spin" /> fetching logs
          </span>
        )}
        {failed && !loading && (
          <span className="ml-auto font-mono text-xs text-thinkpad-red animate-pulse">FAILED</span>
        )}
      </div>
      <div
        ref={ref}
        className="bg-thinkpad-base p-4 h-64 overflow-y-auto font-mono text-xs leading-relaxed space-y-0.5"
      >
        {loading ? (
          <div className="text-thinkpad-muted animate-pulse">// ładowanie logów...</div>
        ) : lines.length === 0 ? (
          <div className="text-neutral-700">// brak logów dla tego etapu</div>
        ) : (
          <>
            {lines.slice(0, shown).map((line, i) => (
              <div key={i} className={logLineClass(line)}>
                {logLineText(line)}
              </div>
            ))}
            {shown < lines.length && <div className="text-thinkpad-muted">_</div>}
            {shown >= lines.length && <div className="text-neutral-700 animate-blink">█</div>}
          </>
        )}
      </div>
    </div>
  );
};

// ---- Main ----

const PipelineVisualizer: React.FC = () => {
  const [run, setRun]         = useState<WorkflowRun | null>(null);
  const [jobs, setJobs]       = useState<WorkflowJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeStage, setActiveStage] = useState(0);

  // jobId → raw log lines from backend
  const [logCache, setLogCache]       = useState<Record<number, string[]>>({});
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PipelineResponse = await res.json();
      setRun(data.run);
      setJobs(data.jobs);
      setLogCache({});   // invalidate log cache on new run data
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (run?.status !== 'in_progress') return;
    const id = setInterval(fetchData, 15000);
    return () => clearInterval(id);
  }, [run?.status, fetchData]);

  const stages = useMemo(
    () => run && jobs.length > 0 ? resolveStages(jobs, run) : [],
    [run, jobs],
  );

  const fetchLogs = useCallback(async (jobId: number) => {
    if (logCache[jobId] !== undefined) return;
    try {
      setLogsLoading(true);
      const res = await fetch(`/api/status/logs/${jobId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { lines: string[] } = await res.json();
      setLogCache(prev => ({ ...prev, [jobId]: data.lines }));
    } catch {
      setLogCache(prev => ({ ...prev, [jobId]: ['✗ Nie udało się pobrać logów'] }));
    } finally {
      setLogsLoading(false);
    }
  }, [logCache]);

  const handleStageClick = useCallback((idx: number) => {
    setActiveStage(idx);
    const stage = stages[idx];
    if (stage?.jobId) fetchLogs(stage.jobId);
  }, [stages, fetchLogs]);

  // Auto-fetch logs for first stage on load
  useEffect(() => {
    if (stages.length > 0 && stages[0].jobId) {
      fetchLogs(stages[0].jobId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stages.length > 0 ? stages[0]?.jobId : null]);

  const failed = run?.conclusion === 'failure';

  const lt = run
    ? run.status === 'completed'
      ? leadTime(run.head_commit.timestamp, run.updated_at)
      : leadTime(run.head_commit.timestamp, new Date().toISOString())
    : '—';

  const activeStageData = stages[activeStage];

  const terminalLines = useMemo(() => {
    if (!activeStageData) return [];
    const { jobId, matchedSteps } = activeStageData;
    if (!jobId || !logCache[jobId]) return [];
    return extractStepLogs(logCache[jobId], matchedSteps.map(s => s.name));
  }, [activeStage, activeStageData, logCache]);

  const isLogsLoading = logsLoading &&
    activeStageData?.jobId != null &&
    logCache[activeStageData.jobId!] === undefined;

  return (
    <div className="bg-thinkpad-surface border border-neutral-800 shadow-2xl shadow-black/50">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <GitBranch size={15} className="text-thinkpad-red" />
          <span className="font-mono text-sm text-white uppercase tracking-widest">The Forge</span>
          <span className="font-mono text-xs text-thinkpad-muted">:: CI/CD Pipeline</span>
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
            aria-label="Odśwież pipeline"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3 text-thinkpad-muted font-mono text-sm">
            <RefreshCw size={15} className="animate-spin" /> Łączenie z GitHub Actions...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-8 font-mono text-sm">
            <div className="flex items-center gap-2 text-thinkpad-red">
              <AlertTriangle size={15} /> Brak danych z pipeline
            </div>
            <p className="text-xs text-thinkpad-muted">{error}</p>
          </div>
        ) : run ? (
          <div className="space-y-6">

            {/* Stats bar */}
            <div className={`border px-5 py-3 transition-colors duration-300 ${
              failed ? 'border-thinkpad-red/40 bg-thinkpad-red/5' : 'border-neutral-800'
            }`}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">

                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] text-thinkpad-muted uppercase tracking-widest">HOST</span>
                  <span className="font-mono text-xs text-neutral-300">KUŹNIA-LXC</span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] text-thinkpad-muted uppercase tracking-widest">STATUS</span>
                  <span className={`font-mono text-xs font-bold ${
                    failed                       ? 'text-thinkpad-red' :
                    run.status === 'in_progress' ? 'text-[#6a9fbf] animate-pulse' :
                    run.conclusion === 'success' ? 'text-[#5a9e85]' :
                    'text-thinkpad-muted'
                  }`}>
                    {runStatusLabel(run)}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[10px] text-thinkpad-muted uppercase tracking-widest">LEAD_TIME</span>
                  <span className="font-mono text-xs text-neutral-300 tabular-nums">{lt}</span>
                </div>

                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-mono text-[10px] text-thinkpad-muted uppercase tracking-widest">LAST_COMMIT</span>
                  <span className="font-mono text-xs text-neutral-400 truncate" title={run.head_commit.message}>
                    <span className="text-thinkpad-muted">[{shortSha(run.head_sha)}]</span>
                    {' '}{firstLine(run.head_commit.message)}
                  </span>
                </div>

              </div>
            </div>

            {/* Pipeline */}
            <div className="flex items-start px-2 py-4">
              {stages.map((stage, i) => (
                <StageNode
                  key={stage.id}
                  stage={stage}
                  active={activeStage === i}
                  isLast={i === stages.length - 1}
                  onClick={() => handleStageClick(i)}
                />
              ))}
            </div>

            {/* Terminal */}
            {activeStageData && (
              <TerminalView
                key={`${activeStage}-${activeStageData.jobId}-${run.updated_at}`}
                lines={terminalLines}
                loading={isLogsLoading}
                failed={failed && activeStageData.status === 'failure'}
                stageLabel={`${activeStageData.label} · ${jobs.find(j => j.id === activeStageData.jobId)?.name ?? 'pipeline'}`}
              />
            )}

            {/* Footer */}
            <div className="flex justify-end">
              <a
                href={run.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-neutral-700 hover:text-neutral-400 transition-colors duration-200 flex items-center gap-1.5 group"
              >
                <span className="text-neutral-700 group-hover:text-thinkpad-red transition-colors duration-200">{'</>'}</span>
                View on GitHub Actions
                <ExternalLink size={10} />
              </a>
            </div>

          </div>
        ) : (
          <div className="text-center font-mono text-xs text-thinkpad-muted py-8">
            // brak workflow runs
          </div>
        )}
      </div>

    </div>
  );
};

export default PipelineVisualizer;
