import React from 'react';
import {
    Clock, Activity,
    TrendingUp, Timer,
} from 'lucide-react';

// ---- Types (lustro tego co w Playground.tsx ApiResponse.sla) ----

interface SLADay {
    date: string;            // ISO date "2026-01-27"
    uptime_pct: number;      // 0-100, np. 99.95
    avg_response_ms: number; // średni czas odpowiedzi tego dnia
}

interface SLAData {
    uptime_30d_pct: number;
    current_streak_hours: number;
    total_downtime_minutes_30d: number;
    response_time_p95_ms: number;
    daily: SLADay[];
}

// ---- Props ----

interface SLATrackerProps {
    sla: SLAData;
}

// ---- Paleta kolorów ----

// Kolor kwadratu w kalendarzu — zależy od % uptime danego dnia
const dayColorCfg = (pct: number) => {
    // 100% → pełna zieleń (dzień bez żadnych problemów)
    if (pct >= 100) return { bg: '#5a9e85', glow: 'rgba(90,158,133,0.25)' };
    // 99-99.99% → przygaszona zieleń (krótki blip, ale w normie SLA)
    if (pct >= 99) return { bg: '#3a7a60', glow: 'rgba(90,158,133,0.12)' };
    // 98-99% → bursztyn (zauważalne degradacje, bliski granicy SLA)
    if (pct >= 98) return { bg: '#b8864e', glow: 'rgba(184,134,78,0.20)' };
    // <98% → czerwień (SLA violation, real incident)
    return { bg: '#ff002b', glow: 'rgba(255,0,43,0.25)' };
};

// Kolor dużego headline uptime %
const uptimeHeadlineColor = (pct: number): string => {
    if (pct >= 99) return 'text-[#5a9e85]';   // zielony — SLA OK
    if (pct >= 98) return 'text-[#b8864e]';   // bursztyn — bliski granicy
    return 'text-thinkpad-red';                // czerwony — SLA naruszony
};

// Kolor p95 response time
const latencyColor = (ms: number): string => {
    if (ms < 200) return 'text-[#5a9e85]';
    if (ms < 500) return 'text-[#b8864e]';
    return 'text-thinkpad-red';
};

// ---- Helpers ----

// Formatowanie streak: minuty → godziny → dni
const formatStreak = (hours: number): string => {
    const totalMinutes = Math.floor(hours * 60);
    if (totalMinutes < 60) return `${totalMinutes}min`;
    const days = Math.floor(hours / 24);
    const h = Math.floor(hours % 24);
    if (days === 0) return `${h}h`;
    if (h === 0) return `${days}d`;
    return `${days}d ${h}h`;
};

// Formatowanie minut downtime → "18.7 min" / "2h 14min"
const formatDowntime = (minutes: number): string => {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${minutes.toFixed(1)} min`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m}min`;
};

// Formatowanie daty "2026-01-27" → "27 sty"
const formatDayLabel = (iso: string): string => {
    try {
        const d = new Date(iso + 'T00:00:00');
        return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
    } catch { return iso; }
};

// Data jako string YYYY-MM-DD w lokalnej strefie czasowej
const toLocalDateStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// ---- Sub-components ----

// Pasek postępu (identyczny pattern co w Playground)
const Bar: React.FC<{ value: number; colorClass: string; max?: number }> = ({
    value, colorClass, max = 100,
}) => (
    <div className="h-[4px] bg-[#1e2028] rounded-sm overflow-hidden">
        <div
            className={`h-full ${colorClass} rounded-sm transition-all duration-700`}
            style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        />
    </div>
);

// Pojedynczy kwadrat dnia w kalendarzu heatmap
const DayCell: React.FC<{ day: SLADay }> = ({ day }) => {
    const cfg = dayColorCfg(day.uptime_pct);
    const isIncident = day.uptime_pct < 100;

    return (
        <div
            className="relative group cursor-help"
            title={`${formatDayLabel(day.date)}\nUptime: ${day.uptime_pct.toFixed(2)}%\nResponse: ${day.avg_response_ms.toFixed(0)}ms`}
        >
            {/* Kwadrat */}
            <div
                className={`w-full aspect-square rounded-[2px] transition-all duration-300 
          ${isIncident ? 'ring-1 ring-inset' : ''}`}
                style={{
                    backgroundColor: cfg.bg,
                    boxShadow: `0 0 4px ${cfg.glow}`,
                    ...(isIncident ? { '--tw-ring-color': cfg.bg + '60' } as React.CSSProperties : {}),
                }}
            />

            {/* Hover glow */}
            <div
                className="absolute inset-0 rounded-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ boxShadow: `0 0 8px ${cfg.glow}, 0 0 2px ${cfg.bg}` }}
            />
        </div>
    );
};

// ---- Main Component (props-based, dane z GET /api/status) ----

const SLATracker: React.FC<SLATrackerProps> = ({ sla }) => {
    const uptimeColor = uptimeHeadlineColor(sla.uptime_30d_pct);
    const latColor = latencyColor(sla.response_time_p95_ms);

    // Zlicz dni z incydentami vs perfekcyjne
    const incidentDays = sla.daily.filter(d => d.uptime_pct < 100).length;
    const perfectDays = sla.daily.filter(d => d.uptime_pct >= 100).length;

    // SLA target — Two Nines
    const slaTarget = 99;
    const slaMet = sla.uptime_30d_pct >= slaTarget;

    // Stałe etykiety okna 30 dni — zawsze obliczane od dziś, niezależnie od danych API
    const todayDate = new Date();
    const windowStartDate = new Date(todayDate);
    windowStartDate.setDate(todayDate.getDate() - 29);
    const leftLabel = formatDayLabel(toLocalDateStr(todayDate));
    const rightLabel = formatDayLabel(toLocalDateStr(windowStartDate));

    return (
        <div className="border border-[#5a9e85]/20 bg-[#5a9e85]/[0.02]">

                    {/* ===== Sekcja 1: Headline — 30-Day Availability ===== */}
                    <div className="px-5 py-5 border-b border-neutral-800/60">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                    <TrendingUp size={10} />
                                    30-Day Availability
                                    <span className="text-neutral-700 ml-1">// Blackbox Exporter · Prometheus</span>
                                </span>
                                <div className="flex items-baseline gap-3">
                                    <span className={`font-mono text-5xl font-bold tabular-nums ${uptimeColor}`}>
                                        {sla.uptime_30d_pct.toFixed(2)}
                                    </span>
                                    <span className="font-mono text-lg text-thinkpad-muted">%</span>
                                </div>
                                {/* SLA target bar z markerem 99% */}
                                <div className="mt-2 relative">
                                    <Bar
                                        value={sla.uptime_30d_pct}
                                        colorClass={slaMet ? 'bg-[#2a6654]' : 'bg-thinkpad-red/60'}
                                        max={100}
                                    />
                                    {/* Marker docelowy SLA na pozycji 99% */}
                                    <div
                                        className="absolute top-0 h-full w-px bg-neutral-500/60 pointer-events-none"
                                        style={{ left: '99%' }}
                                        title="SLA target: 99%"
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`font-mono text-xs ${slaMet ? 'text-[#5a9e85]' : 'text-thinkpad-red'}`}>
                                        {slaMet ? '✓' : '✗'} SLA Target: {slaTarget}%
                                    </span>
                                    <span className="font-mono text-xs text-neutral-700">
                                        ({slaMet ? 'met' : 'violated'})
                                    </span>
                                </div>
                            </div>

                            {/* Badge — SLA status */}
                            <span className={`font-mono text-xs border px-2.5 py-1 shrink-0 flex items-center gap-1.5 ${slaMet
                                    ? 'text-[#5a9e85] border-[#5a9e85]/30'
                                    : 'text-thinkpad-red border-thinkpad-red/30'
                                }`}>
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${slaMet ? 'bg-[#5a9e85] animate-pulse' : 'bg-thinkpad-red animate-pulse'
                                    }`} />
                                {slaMet ? 'SLA OK' : 'SLA BREACH'}
                            </span>
                        </div>
                    </div>

                    {/* ===== Sekcja 2: Streak + Downtime ===== */}
                    <div className="grid grid-cols-2 gap-px border-b border-neutral-800/60 bg-neutral-800/30">

                        {/* Current streak — ile godzin/dni od ostatniego incydentu */}
                        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-1"
                            title="Czas od ostatniego incydentu (probe failure). Dłuższy streak = stabilniejsza infra.">
                            <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
                                <Clock size={10} /> Current streak
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-mono text-2xl font-bold tabular-nums text-white">
                                    {formatStreak(sla.current_streak_hours)}
                                </span>
                                <span className="font-mono text-xs text-neutral-600">without incident</span>
                            </div>
                        </div>

                        {/* Total downtime */}
                        <div className="bg-thinkpad-surface px-4 py-3 flex flex-col gap-1"
                            title="Łączny czas niedostępności w ciągu 30 dni.">
                            <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
                                <Timer size={10} /> Total downtime
                                <span className="text-neutral-700">/ 30d</span>
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className={`font-mono text-2xl font-bold tabular-nums ${sla.total_downtime_minutes_30d === 0 ? 'text-[#5a9e85]' : 'text-[#b8864e]'
                                    }`}>
                                    {formatDowntime(sla.total_downtime_minutes_30d)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ===== Sekcja 3: Kalendarz heatmap — 30 dni ===== */}
                    <div className="border-b border-neutral-800/60 px-5 py-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5">
                                <Activity size={10} />
                                Daily availability
                                <span className="text-neutral-700">// 30d heatmap</span>
                            </span>
                            <span className="font-mono text-xs text-neutral-600 tabular-nums">
                                {perfectDays}/{sla.daily.length} perfect days
                            </span>
                        </div>

                        {/* Heatmap grid — zawsze 30 kolumn, dane wyrównane do lewej (dziś = pozycja 0) */}
                        <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(30, 1fr)` }}>
                            {Array.from({ length: 30 }, (_, i) => {
                                const dataIndex = sla.daily.length - 1 - i;
                                const day = dataIndex >= 0 ? sla.daily[dataIndex] : null;
                                return day
                                    ? <DayCell key={day.date} day={day} />
                                    : <div key={i} className="w-full aspect-square rounded-[2px] bg-[#1e2028]" />;
                            })}
                        </div>

                        {/* Labels — 29 dni temu → dziś */}
                        <div className="flex justify-between mt-2">
                            <span className="font-mono text-[10px] text-neutral-700">
                                {leftLabel}
                            </span>
                            <span className="font-mono text-[10px] text-neutral-700">
                                {rightLabel}
                            </span>
                        </div>

                        {/* Legenda */}
                        <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1.5">
                                <span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-[#5a9e85]" />
                                <span className="font-mono text-[10px] text-neutral-600">100%</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-[#3a7a60]" />
                                <span className="font-mono text-[10px] text-neutral-600">≥99%</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-[#b8864e]" />
                                <span className="font-mono text-[10px] text-neutral-600">≥98%</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-[#ff002b]" />
                                <span className="font-mono text-[10px] text-neutral-600">&lt;98%</span>
                            </div>
                            {incidentDays > 0 && (
                                <span className="font-mono text-[10px] text-neutral-700 ml-auto">
                                    {incidentDays} incident day{incidentDays !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* ===== Sekcja 4: Response Time p95 ===== */}
                    <div className="px-5 py-4"
                        title="95. percentyl czasu odpowiedzi. Poniżej 200ms = świetna. Powyżej 500ms = problem.">
                        <span className="font-mono text-xs text-thinkpad-muted uppercase tracking-wider flex items-center gap-1.5 mb-2">
                            <Activity size={10} />
                            Response time p95
                            <span className="text-neutral-700">// probe_duration_seconds</span>
                        </span>
                        <div className="flex items-baseline gap-1.5 leading-none">
                            <span className={`font-mono text-2xl font-bold tabular-nums ${latColor}`}>
                                {sla.response_time_p95_ms.toFixed(0)}
                            </span>
                            <span className="font-mono text-sm text-thinkpad-muted">ms</span>
                        </div>
                        <div className="mt-2">
                            <Bar value={sla.response_time_p95_ms} colorClass="bg-[#2e5f80]" max={500} />
                        </div>
                        <span className="font-mono text-xs text-neutral-700 mt-1 block">
                            {sla.response_time_p95_ms < 200 ? 'Excellent' : sla.response_time_p95_ms < 500 ? 'Acceptable' : 'Degraded'}
                            {' '}· target &lt;200ms
                        </span>
                    </div>

                </div>
    );
};

export default SLATracker;
