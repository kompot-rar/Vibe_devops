import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Github, Box, Package, RefreshCw, Server,
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

interface DORAMetrics {
  deployment_frequency_per_week: number;
  lead_time_avg_minutes: number;
  change_failure_rate_pct: number;
  deploys_30d: number;
  failed_deploys_30d: number;
}

interface PipelineResponse { run: WorkflowRun; jobs: WorkflowJob[]; dora?: DORAMetrics }

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
  { id: 'source',   label: 'SOURCE',   Icon: Github,    keywords: ['checkout', 'clone'] },
  { id: 'forge',    label: 'FORGE',    Icon: Box,       keywords: ['build', 'compile', 'setup', 'install', 'dependencies', 'buildx'] },
  { id: 'registry', label: 'REGISTRY', Icon: Package,   keywords: ['push', 'registry', 'ghcr', 'docker', 'login'] },
  { id: 'gitops',   label: 'GITOPS',   Icon: RefreshCw, keywords: ['sync', 'argo', 'manifest', 'gitops', 'update', 'tag'] },
  { id: 'cluster',  label: 'CLUSTER',  Icon: Server,    keywords: ['k3s', 'kubectl', 'deploy', 'verify', 'health', 'rollout'] },
];

// ---- Helpers ----

const shortSha = (sha: string) => sha.slice(0, 7);
const firstLine = (msg: string) => msg.split('\n')[0].slice(0, 60);
const timeAgo = (iso: string): string => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const leadTime = (start: string, end: string): string => {
  const s = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (s < 0) return '—';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `T+${pad(h)}:${pad(m)}:${pad(sec)}` : `T+${pad(m)}:${pad(sec)}`;
};

// Parse GitHub Actions log: keyword-based section matching.
// The log is a flat sequence of ##[group]...##[endgroup] blocks — actions/checkout alone
// creates 5+ separate flat sections (Cleaning, Removing refs, Setting up auth, etc.)
// so index-based lookup (sections[num-1]) is unreliable.
//
// Strategy:
//   1. Forward scan — match section names to step-name keywords (advances searchFrom so
//      earlier steps don't steal sections that belong to later steps).
//   2. Backwards fallback — when step-name keywords yield nothing (e.g. "Trigger Rollout"
//      whose section is "Run kubectl set image..."), search from the END using both
//      step-name keywords AND stageKeywords (e.g. 'kubectl' from CLUSTER STAGE_DEFS).
//      Backwards search finds the LAST matching section, which is the correct one when
//      a keyword like 'kubectl' also appears in earlier setup sections.
function extractStepLogs(
  allLines: string[],
  steps: StepWithJob[],
  stageKeywords?: string[],
): string[] {
  if (steps.length === 0) return [];

  // Parse flat sections
  const sections: { name: string; lines: string[] }[] = [];
  let current: { name: string; lines: string[] } | null = null;
  for (const line of allLines) {
    if (line.startsWith('##[group]')) {
      if (current) sections.push(current);
      current = { name: line.slice(9).trim(), lines: [] };
    } else if (line.startsWith('##[endgroup]')) {
      if (current) { sections.push(current); current = null; }
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);

  const cleanLine = (l: string) =>
    l.replace(/^##\[command\]/, '$ ')
     .replace(/^##\[warning\]/, '⚠ ')
     .replace(/^##\[error\]/, '✗ ')
     .replace(/^##\[debug\].*/, '');

  // Platform-generic words that appear in GHA section names but carry no stage signal.
  // "github" is the key offender: "GITHUB_TOKEN Permissions" matches "Login to GitHub Container Registry".
  const GHA_STOP = new Set(['github', 'actions', 'token', 'runner', 'workflow', 'permissions']);

  const toKeywords = (name: string): string[] =>
    name.toLowerCase()
      .replace(/[&()\[\]/]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 5 && !GHA_STOP.has(w));

  const pushSection = (idx: number, out: string[]) => {
    out.push(`\x00group\x00${sections[idx].name}`);
    sections[idx].lines.map(cleanLine).filter(l => l.trim()).forEach(l => out.push(l));
  };

  const result: string[] = [];
  const usedIdx = new Set<number>();
  let searchFrom = 0;

  for (const step of [...steps].sort((a, b) => a.number - b.number)) {
    const kws = toKeywords(step.name);
    if (kws.length === 0) continue;

    // Forward search: prevents earlier steps from being stolen by later stages
    for (let i = searchFrom; i < sections.length; i++) {
      if (usedIdx.has(i)) continue;
      if (kws.some(kw => sections[i].name.toLowerCase().includes(kw))) {
        usedIdx.add(i);
        searchFrom = i + 1;
        pushSection(i, result);
        break;
      }
    }
  }

  // Backwards fallback: used when step-name keywords don't appear in any section name
  // (e.g. "Trigger Rollout" → section is "Run kubectl set image..." which has no
  // overlap with "trigger"/"rollout"/"devops"/"magic" but IS caught by stage keyword "kubectl").
  // Searching backwards ensures we find the LAST "kubectl" occurrence (the rollout trigger),
  // not the earlier "setup-kubectl" section.
  if (result.length === 0 && stageKeywords && stageKeywords.length > 0) {
    const fallbackKws = [
      ...new Set([
        ...steps.flatMap(s => toKeywords(s.name)),
        ...stageKeywords.filter(k => k.length >= 4 && !GHA_STOP.has(k)),
      ]),
    ];
    for (let i = sections.length - 1; i >= 0; i--) {
      if (fallbackKws.some(kw => sections[i].name.toLowerCase().includes(kw))) {
        pushSection(i, result);
        break;
      }
    }
  }

  // Ultimate fallback
  if (result.length === 0) {
    return allLines.slice(-60).map(cleanLine).filter(l => l.trim());
  }
  return result;
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
  line.startsWith('\x00group\x00') ? `▶ ${line.slice(7)}` : line;

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

// ---- DORA helpers ----

type DORALevel = 'ELITE' | 'HIGH' | 'MEDIUM' | 'LOW';

const doraFreqLevel = (v: number): DORALevel =>
  v >= 7 ? 'ELITE' : v >= 1 ? 'HIGH' : v >= 0.23 ? 'MEDIUM' : 'LOW';

const doraLeadLevel = (v: number): DORALevel =>
  v < 60 ? 'ELITE' : v < 1440 ? 'HIGH' : v < 10080 ? 'MEDIUM' : 'LOW';

const doraCFRLevel = (v: number): DORALevel =>
  v < 5 ? 'ELITE' : v < 15 ? 'HIGH' : v < 45 ? 'MEDIUM' : 'LOW';

const doraLevelColor = (l: DORALevel): string =>
  l === 'ELITE' || l === 'HIGH' ? 'text-[#5a9e85]'
  : l === 'MEDIUM' ? 'text-[#b8864e]'
  : 'text-thinkpad-red';

const fmtLeadTime = (minutes: number): string => {
  if (minutes < 60)   return `${minutes.toFixed(1)} min`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)} h`;
  return `${(minutes / 1440).toFixed(1)} d`;
};

// ---- DORA Section ----

const DORASection: React.FC<{ dora: DORAMetrics }> = ({ dora }) => {
  const freqLevel = doraFreqLevel(dora.deployment_frequency_per_week);
  const leadLevel = doraLeadLevel(dora.lead_time_avg_minutes);
  const cfrLevel  = doraCFRLevel(dora.change_failure_rate_pct);

  return (
    <div className="grid grid-cols-3 gap-px bg-neutral-800/40 border-b border-neutral-800">
      {/* Deploy Frequency */}
      <div className="bg-thinkpad-surface px-5 py-3 flex flex-col gap-0.5">
        <span className="font-mono text-[10px] text-thinkpad-muted uppercase tracking-wider">DEPLOY_FREQ</span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="font-mono text-xl font-bold tabular-nums text-white">
            {dora.deployment_frequency_per_week.toFixed(1)}
          </span>
          <span className="font-mono text-xs text-neutral-600">/week</span>
        </div>
        <span className="font-mono text-[10px] text-neutral-700">{dora.deploys_30d} deploys · 30d</span>
      </div>

      {/* Lead Time */}
      <div className="bg-thinkpad-surface px-5 py-3 flex flex-col gap-0.5">
        <span className="font-mono text-[10px] text-thinkpad-muted uppercase tracking-wider">LEAD_TIME_AVG</span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="font-mono text-xl font-bold tabular-nums text-white">
            {fmtLeadTime(dora.lead_time_avg_minutes)}
          </span>
        </div>
        <span className="font-mono text-[10px] text-neutral-700">commit → deploy</span>
      </div>

      {/* Change Failure Rate */}
      <div className="bg-thinkpad-surface px-5 py-3 flex flex-col gap-0.5">
        <span className="font-mono text-[10px] text-thinkpad-muted uppercase tracking-wider">CHANGE_FAIL_RATE</span>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="font-mono text-xl font-bold tabular-nums text-white">
            {dora.change_failure_rate_pct.toFixed(1)}
          </span>
          <span className="font-mono text-xs text-neutral-600">%</span>
        </div>
        <span className="font-mono text-[10px] text-neutral-700">{dora.failed_deploys_30d} failed · 30d</span>
      </div>
    </div>
  );
};

// ---- Main ----

const PipelineVisualizer: React.FC = () => {
  const [run, setRun]         = useState<WorkflowRun | null>(null);
  const [jobs, setJobs]       = useState<WorkflowJob[]>([]);
  const [dora, setDora]       = useState<DORAMetrics | null>(null);
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
      setDora(data.dora ?? null);
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
    const stageDef = STAGE_DEFS.find(d => d.id === activeStageData.id);
    return extractStepLogs(logCache[jobId], matchedSteps, stageDef?.keywords);
  }, [activeStage, activeStageData, logCache]);

  const isLogsLoading = logsLoading &&
    activeStageData?.jobId != null &&
    logCache[activeStageData.jobId!] === undefined;

  return (
    <div className="bg-thinkpad-surface border border-neutral-800 shadow-2xl shadow-black/50">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <Github size={15} className="text-[#6a9fbf]" />
          <span className="font-mono text-sm text-white uppercase tracking-widest">The Forge</span>
          <span className="font-mono text-xs text-thinkpad-muted">:: CI/CD Pipeline</span>
        </div>
        <div className="flex items-center gap-3">
          {!loading && (
            error
              ? <WifiOff size={12} className="text-thinkpad-red" />
              : <Wifi    size={12} className="text-[#5a9e85]" />
          )}
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="text-thinkpad-muted hover:text-white transition-colors duration-200 disabled:opacity-30 cursor-pointer"
            aria-label="Odśwież pipeline"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* States */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-3 text-thinkpad-muted font-mono text-sm">
          <RefreshCw size={14} className="animate-spin" /> Łączenie z GitHub Actions...
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-8 font-mono text-sm">
          <div className="flex items-center gap-2 text-thinkpad-red">
            <AlertTriangle size={14} /> Brak danych z pipeline
          </div>
          <p className="text-xs text-thinkpad-muted">{error}</p>
        </div>
      ) : !run ? (
        <div className="text-center font-mono text-xs text-thinkpad-muted py-8">
          // brak workflow runs
        </div>
      ) : (
        <>
          {/* DORA strip — nad run-barem */}
          {dora && <DORASection dora={dora} />}

          {/* Run bar — 4 karty w stylu DORA */}
          <div className={`grid grid-cols-4 gap-px border-b transition-colors duration-300 ${
            failed ? 'bg-thinkpad-red/20 border-thinkpad-red/30' : 'bg-neutral-800/40 border-neutral-800'
          }`}>

            {/* HOST */}
            <div className={`px-5 py-3 flex flex-col gap-0.5 ${failed ? 'bg-thinkpad-red/5' : 'bg-thinkpad-surface'}`}>
              <span className="font-mono text-[10px] text-thinkpad-muted uppercase tracking-wider">HOST</span>
              <span className="font-mono text-base font-bold text-white">KUŹNIA-LXC</span>
              <span className="font-mono text-[10px] text-neutral-700">runner · lxc container</span>
            </div>

            {/* LAST_COMMIT — spans 2 cols */}
            <div className={`col-span-2 px-5 py-3 flex flex-col gap-0.5 min-w-0 ${failed ? 'bg-thinkpad-red/5' : 'bg-thinkpad-surface'}`}>
              <span className="font-mono text-[10px] text-thinkpad-muted uppercase tracking-wider">LAST_COMMIT</span>
              <span className="font-mono text-sm text-neutral-300 truncate" title={run.head_commit.message}>
                <span className="text-neutral-600">[{shortSha(run.head_sha)}]</span>
                {' '}{firstLine(run.head_commit.message)}
              </span>
              <span className="font-mono text-[10px] text-neutral-700">
                by {run.head_commit.author.name} · {timeAgo(run.created_at)}
              </span>
            </div>

            {/* LEAD_TIME + STATUS badge */}
            <div className={`px-5 py-3 flex flex-col gap-0.5 min-w-0 ${failed ? 'bg-thinkpad-red/5' : 'bg-thinkpad-surface'}`}>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="font-mono text-[10px] text-thinkpad-muted uppercase tracking-wider truncate">LEAD_TIME</span>
                <span className={`font-mono text-[10px] font-bold border px-1.5 py-px shrink-0 ${
                  failed                       ? 'text-thinkpad-red border-thinkpad-red/40' :
                  run.status === 'in_progress' ? 'text-[#6a9fbf] border-[#6a9fbf]/40 animate-pulse' :
                  run.conclusion === 'success' ? 'text-[#5a9e85] border-[#5a9e85]/30' :
                  'text-thinkpad-muted border-neutral-700'
                }`}>
                  {runStatusLabel(run)}
                </span>
              </div>
              <span className="font-mono text-xl font-bold tabular-nums text-white">{lt}</span>
              <span className="font-mono text-[10px] text-neutral-700">commit → deploy</span>
            </div>

          </div>

          {/* Pipeline stages */}
          <div className="px-5 py-5 border-b border-neutral-800">
            <div className="flex items-start">
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
          </div>

          {/* Terminal */}
          {activeStageData && (
            <div className="px-5 py-4 border-b border-neutral-800">
              <TerminalView
                key={`${activeStage}-${activeStageData.jobId}-${run.updated_at}`}
                lines={terminalLines}
                loading={isLogsLoading}
                failed={failed && activeStageData.status === 'failure'}
                stageLabel={`${activeStageData.label} · ${jobs.find(j => j.id === activeStageData.jobId)?.name ?? 'pipeline'}`}
              />
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-2.5 flex justify-end">
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
        </>
      )}

    </div>
  );
};

export default PipelineVisualizer;
