import { PhoneCallIcon, PhoneOffIcon, MicOffIcon, MicIcon, CheckIcon, ClockIcon, BriefcaseIcon, MapPinIcon, CalendarIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { VoiceControlWidget } from "realtime-voice-component";

import { cn } from "@/lib/utils";

import { DemoPageShell } from "../shared/primitives";
import {
  DEFAULT_CANDIDATE_PROFILE,
  HEARING_FIELD_LABELS,
  HEARING_FIELD_ORDER,
  type CallStatus,
  type CandidateProfile,
  type HearingFieldKey,
} from "./config";
import { useCareerAdvisorController } from "./controller";
import {
  getCompletedFieldCount,
  type AdvisorThought,
  type CallEvent,
  type JobSuggestion,
} from "./tools";

// ─── 音声波形 ──────────────────────────────────────────────────────────────

function SoundWave({ active }: { active: boolean }) {
  return (
    <div className="flex items-end justify-center gap-[3px] h-5">
      {[2, 3, 5, 4, 6, 4, 5, 3, 2].map((level, i) => (
        <div
          key={i}
          className={cn(
            "w-[3px] rounded-full transition-all duration-300",
            active ? "bg-orange-400" : "bg-white/20",
          )}
          style={{
            height: active ? `${level * 3}px` : "3px",
            animation: active
              ? `wave ${0.55 + i * 0.07}s ease-in-out infinite alternate`
              : "none",
            animationDelay: `${i * 0.04}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.3); }
          to { transform: scaleY(1.5); }
        }
      `}</style>
    </div>
  );
}

// ─── 通話タイマー ──────────────────────────────────────────────────────────

function CallTimer({ startedAt }: { startedAt: Date | null }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) { setElapsed(0); return; }
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [startedAt]);
  const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const s = String(elapsed % 60).padStart(2, "0");
  return <span className="font-mono text-sm tabular-nums text-white/40">{m}:{s}</span>;
}

// ─── 一護アバター ──────────────────────────────────────────────────────────

function IchigoAvatar({ speaking }: { speaking: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      {speaking && (
        <>
          <div className="absolute inset-0 rounded-full bg-orange-500/25 animate-ping" />
          <div className="absolute -inset-4 rounded-full bg-orange-500/10 animate-pulse" />
        </>
      )}
      <div
        className={cn(
          "relative z-10 size-24 rounded-full overflow-hidden transition-all duration-500",
          speaking
            ? "ring-2 ring-orange-400/70 shadow-[0_0_36px_rgba(251,146,60,0.45)]"
            : "ring-1 ring-white/12",
        )}
      >
        <img
          src="/avatar/ichigo.png"
          alt="黒崎一護"
          className="h-full w-full object-cover object-top"
          draggable={false}
        />
      </div>
    </div>
  );
}

// ─── ヒアリング進捗フィールド ───────────────────────────────────────────────

const FIELD_ICONS: Record<HearingFieldKey, typeof MapPinIcon> = {
  location: MapPinIcon,
  age: ClockIcon,
  jobType: BriefcaseIcon,
  education: CheckIcon,
  transferTiming: CalendarIcon,
  targetSalary: BriefcaseIcon,
};

function HearingField({
  fieldKey,
  value,
  isActive,
}: {
  fieldKey: HearingFieldKey;
  value: string | null;
  isActive: boolean;
}) {
  const Icon = FIELD_ICONS[fieldKey];
  const isDone = value !== null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[10px] px-3 py-2.5 transition-all duration-300",
        isDone
          ? "bg-orange-500/10 ring-1 ring-orange-500/25"
          : isActive
          ? "bg-white/6 ring-1 ring-white/15 animate-pulse"
          : "bg-white/3 ring-1 ring-white/6",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full transition-colors",
          isDone ? "bg-orange-500/30" : isActive ? "bg-white/15" : "bg-white/8",
        )}
      >
        {isDone ? (
          <CheckIcon className="size-3 text-orange-400" />
        ) : (
          <Icon className={cn("size-3", isActive ? "text-white/70" : "text-white/25")} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-xs font-medium leading-none",
            isDone ? "text-orange-300" : isActive ? "text-white/70" : "text-white/25",
          )}
        >
          {HEARING_FIELD_LABELS[fieldKey]}
        </p>
        {value && (
          <p className="mt-1 text-[11px] text-white/55 leading-relaxed truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

// ─── 求人カード ────────────────────────────────────────────────────────────

function JobCard({ job }: { job: JobSuggestion }) {
  return (
    <div className="rounded-[10px] bg-white/4 p-3 ring-1 ring-white/8">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-sm font-semibold text-white leading-snug">{job.title}</p>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums",
            job.match >= 90
              ? "bg-orange-500/25 text-orange-300"
              : job.match >= 80
              ? "bg-sky-500/20 text-sky-300"
              : "bg-white/10 text-white/50",
          )}
        >
          {job.match}%
        </span>
      </div>
      <p className="text-xs text-white/50">{job.company}</p>
      <div className="mt-2 flex gap-3 text-[11px] text-white/40">
        <span>📍 {job.location}</span>
        <span>💴 {job.salary}</span>
      </div>
    </div>
  );
}

// ─── 思考バッジ ────────────────────────────────────────────────────────────

const THOUGHT_COLORS: Record<AdvisorThought, string> = {
  "ラポール形成中": "bg-violet-500/20 text-violet-300 ring-violet-500/20",
  "ヒアリング中": "bg-sky-500/20 text-sky-300 ring-sky-500/20",
  "求人マッチング中": "bg-amber-500/20 text-amber-300 ring-amber-500/20",
  "提案準備中": "bg-orange-500/20 text-orange-300 ring-orange-500/20",
  "フォローアップ調整中": "bg-emerald-500/20 text-emerald-300 ring-emerald-500/20",
  "クロージング": "bg-rose-500/20 text-rose-300 ring-rose-500/20",
};

function ThoughtBadge({ thought }: { thought: AdvisorThought }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1",
        THOUGHT_COLORS[thought],
      )}
    >
      {thought}
    </span>
  );
}

// ─── メインコンポーネント ───────────────────────────────────────────────────

export function PhoneDemoPage() {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState<Date | null>(null);
  const [profile, setProfile] = useState<CandidateProfile>(DEFAULT_CANDIDATE_PROFILE);
  const [events, setEvents] = useState<CallEvent[]>([]);
  const [currentThought, setCurrentThought] = useState<AdvisorThought>("ラポール形成中");
  const [activeField, setActiveField] = useState<HearingFieldKey | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  const updateProfile = useCallback((field: HearingFieldKey, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setActiveField(field);
    setTimeout(() => setActiveField(null), 3000);
  }, []);

  const addEvent = useCallback((event: CallEvent) => {
    if (event.type === "profile_update" || event.type === "job_suggestion" || event.type === "followup_scheduled") {
      setCurrentThought(event.thought);
    }
    setEvents((prev) => [...prev, event]);
  }, []);

  const handleSetCallStatus = useCallback((status: CallStatus) => {
    setCallStatus(status);
  }, []);

  const { controller, runtime } = useCareerAdvisorController({
    setCallStatus: handleSetCallStatus,
    updateProfile,
    addEvent,
  });

  const isSpeaking = runtime.activity === "processing";
  const isConnected = runtime.connected;

  useEffect(() => {
    if (isConnected && callStatus === "connecting") {
      setCallStatus("active");
      setCallStartedAt(new Date());
    }
    if (!isConnected && callStatus === "active") {
      setCallStatus("ended");
    }
  }, [isConnected, callStatus]);

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const handleStartCall = useCallback(() => {
    setCallStatus("incoming");
    setProfile(DEFAULT_CANDIDATE_PROFILE);
    setEvents([]);
    setCurrentThought("ラポール形成中");
    setTimeout(() => {
      setCallStatus("connecting");
      void controller.connect();
    }, 1000);
  }, [controller]);

  const handleEndCall = useCallback(() => {
    controller.disconnect();
    setCallStatus("ended");
    setCallStartedAt(null);
  }, [controller]);

  const handleReset = useCallback(() => {
    setCallStatus("idle");
    setProfile(DEFAULT_CANDIDATE_PROFILE);
    setEvents([]);
    setCallStartedAt(null);
    setIsMuted(false);
    setCurrentThought("ラポール形成中");
  }, []);

  const completedCount = getCompletedFieldCount(profile);
  const progressPct = Math.round((completedCount / 6) * 100);

  const jobSuggestionEvents = events.filter((e) => e.type === "job_suggestion");
  const latestJobs =
    jobSuggestionEvents.length > 0
      ? (jobSuggestionEvents[jobSuggestionEvents.length - 1] as Extract<CallEvent, { type: "job_suggestion" }>).jobs
      : null;

  const statusLabel: Record<CallStatus, string> = {
    idle: "通話前",
    incoming: "着信中...",
    connecting: "接続中...",
    active: "通話中",
    ended: "通話終了",
  };

  const statusDotColor: Record<CallStatus, string> = {
    idle: "bg-white/20",
    incoming: "bg-amber-400 animate-pulse",
    connecting: "bg-sky-400 animate-pulse",
    active: "bg-orange-400 animate-pulse",
    ended: "bg-rose-400",
  };

  return (
    <DemoPageShell theme="dark">
      <main className="grid gap-4">
        <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[#0d0d10]">
          <div className="flex flex-col md:flex-row min-h-[580px]">

            {/* ── 左パネル：コール画面 ── */}
            <div className="flex flex-col items-center justify-between p-8 md:w-72 md:border-r md:border-white/8">
              {/* ステータス */}
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("size-2 rounded-full transition-colors", statusDotColor[callStatus])} />
                  <span className="text-sm text-white/50">{statusLabel[callStatus]}</span>
                </div>
                {callStatus === "active" && <CallTimer startedAt={callStartedAt} />}
              </div>

              {/* アバター */}
              <div className="flex flex-col items-center gap-4 py-4">
                <IchigoAvatar speaking={isSpeaking && isConnected} />
                <div className="text-center">
                  <p className="text-lg font-bold tracking-tight text-white">黒崎 一護</p>
                  <p className="text-xs text-white/35 mt-0.5">キャリアアドバイザー</p>
                  <p className="text-xs text-white/25">ソウルソサエティキャリア</p>
                </div>
                <SoundWave active={isSpeaking && isConnected} />
              </div>

              {/* 思考状態バッジ */}
              {callStatus === "active" && (
                <div className="flex w-full flex-col items-center gap-2 pb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20">
                    一護の対応フェーズ
                  </p>
                  <ThoughtBadge thought={currentThought} />
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex flex-col items-center gap-3 w-full">
                {callStatus === "idle" && (
                  <button
                    onClick={handleStartCall}
                    className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-orange-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_28px_rgba(249,115,22,0.4)] transition-all hover:bg-orange-400 hover:shadow-[0_0_36px_rgba(249,115,22,0.55)] active:scale-95"
                  >
                    <PhoneCallIcon className="size-4" />
                    転職相談を始める
                  </button>
                )}

                {callStatus === "active" && (
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setIsMuted((m) => !m)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-[14px] px-4 py-3 text-xs font-medium transition-all hover:scale-105 active:scale-95",
                        isMuted
                          ? "bg-white/15 text-white ring-1 ring-white/20"
                          : "bg-white/6 text-white/50 ring-1 ring-white/10 hover:bg-white/10",
                      )}
                    >
                      {isMuted ? <MicOffIcon className="size-3.5" /> : <MicIcon className="size-3.5" />}
                      {isMuted ? "ミュート中" : "ミュート"}
                    </button>
                    <button
                      onClick={handleEndCall}
                      className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-rose-500/85 px-4 py-3 text-xs font-semibold text-white shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all hover:bg-rose-500 active:scale-95"
                    >
                      <PhoneOffIcon className="size-3.5" />
                      終了
                    </button>
                  </div>
                )}

                {(callStatus === "incoming" || callStatus === "connecting") && (
                  <div className="flex items-center gap-1.5 py-3">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="size-1.5 rounded-full bg-orange-400 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                )}

                {callStatus === "ended" && (
                  <button
                    onClick={handleReset}
                    className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-white/8 px-6 py-3.5 text-sm font-medium text-white/60 ring-1 ring-white/10 transition-all hover:bg-white/12 hover:text-white active:scale-95"
                  >
                    もう一度かける
                  </button>
                )}
              </div>
            </div>

            {/* ── 右パネル ── */}
            <div className="flex flex-1 flex-col min-w-0">

              {/* ヘッダー：ヒアリング進捗 */}
              <div className="border-b border-white/8 px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
                    ヒアリング進捗
                  </p>
                  <span className="text-xs text-white/35 font-mono">
                    {completedCount} / 6
                  </span>
                </div>
                {/* プログレスバー */}
                <div className="h-1 w-full rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* ヒアリング6項目 */}
              <div className="border-b border-white/8 p-4">
                <div className="grid grid-cols-2 gap-2">
                  {HEARING_FIELD_ORDER.map((key) => (
                    <HearingField
                      key={key}
                      fieldKey={key}
                      value={profile[key]}
                      isActive={activeField === key}
                    />
                  ))}
                </div>
              </div>

              {/* 求人提案エリア */}
              <div className="flex-1 overflow-y-auto p-4">
                {latestJobs ? (
                  <>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25 mb-3">
                      マッチした求人
                    </p>
                    <div className="grid gap-2">
                      {latestJobs.map((job, i) => (
                        <JobCard key={i} job={job} />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-center py-8">
                    <div>
                      <p className="text-2xl mb-2">⚔️</p>
                      <p className="text-sm text-white/20 leading-relaxed">
                        {callStatus === "idle"
                          ? "通話を開始すると\n一護がヒアリングを開始します"
                          : "ヒアリングが完了すると\n最適な求人を提案します"}
                      </p>
                    </div>
                  </div>
                )}

                {/* フォローアップ予定 */}
                {events.filter((e) => e.type === "followup_scheduled").length > 0 && (
                  <div className="mt-3 rounded-[10px] bg-emerald-500/10 p-3 ring-1 ring-emerald-500/20">
                    <p className="text-xs font-semibold text-emerald-400 mb-1">📅 次回面談予定</p>
                    {events
                      .filter((e): e is Extract<CallEvent, { type: "followup_scheduled" }> => e.type === "followup_scheduled")
                      .map((e, i) => (
                        <p key={i} className="text-xs text-emerald-300/70">{e.datetime}</p>
                      ))}
                  </div>
                )}

                <div ref={eventsEndRef} />
              </div>

              {/* トランスクリプト */}
              {runtime.transcript && isConnected && (
                <div className="border-t border-white/8 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20 mb-1">
                    文字起こし
                  </p>
                  <p className="text-xs text-white/40 leading-relaxed line-clamp-2">
                    {runtime.transcript}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 説明 */}
        <div className="rounded-[16px] border border-white/8 bg-white/3 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 mb-3">
            このデモについて
          </p>
          <p className="text-sm leading-relaxed text-white/40">
            人材紹介会社のCA「黒崎一護」との転職相談デモです。直球で頼りになるスタイルで、自然な会話の中から
            <strong className="text-white/60 font-medium">希望勤務地・年齢・希望職種・学歴・転職時期・希望年収</strong>
            を聞き出し、最適な求人を提案します。話し終わったら「ありがとうございました」と言うと通話が終了します。
          </p>
        </div>

        {/* 非表示の接続管理ウィジェット */}
        <div className="hidden">
          <VoiceControlWidget controller={controller} />
        </div>
      </main>
    </DemoPageShell>
  );
}
