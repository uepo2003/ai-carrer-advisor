import { defineVoiceTool } from "realtime-voice-component";
import { z } from "zod";

import {
  type CallStatus,
  type CandidateProfile,
  type HearingFieldKey,
} from "./config";

export type AdvisorThought =
  | "ラポール形成中"
  | "ヒアリング中"
  | "求人マッチング中"
  | "提案準備中"
  | "フォローアップ調整中"
  | "クロージング";

export type CallEvent =
  | { type: "profile_update"; field: HearingFieldKey; value: string; thought: AdvisorThought }
  | { type: "job_suggestion"; jobs: JobSuggestion[]; thought: AdvisorThought }
  | { type: "followup_scheduled"; datetime: string; thought: AdvisorThought }
  | { type: "end"; message: string };

export type JobSuggestion = {
  title: string;
  company: string;
  salary: string;
  location: string;
  match: number;
};

type PhoneToolContext = {
  setCallStatus: (status: CallStatus) => void;
  updateProfile: (field: HearingFieldKey, value: string) => void;
  addEvent: (event: CallEvent) => void;
};

export function createUpdateProfileTool({ updateProfile, addEvent }: PhoneToolContext) {
  return defineVoiceTool({
    name: "update_profile",
    description:
      "求職者からヒアリングできた情報をプロフィールに記録します。情報が得られたら必ず呼び出してください。",
    parameters: z.object({
      field: z.enum([
        "location",
        "age",
        "jobType",
        "education",
        "transferTiming",
        "targetSalary",
      ]),
      value: z.string().max(80),
      current_thought: z
        .enum([
          "ラポール形成中",
          "ヒアリング中",
          "求人マッチング中",
          "提案準備中",
          "フォローアップ調整中",
          "クロージング",
        ])
        .describe("現在の対応フェーズ"),
    }),
    async execute({ field, value, current_thought }) {
      updateProfile(field as HearingFieldKey, value);
      addEvent({
        type: "profile_update",
        field: field as HearingFieldKey,
        value,
        thought: current_thought as AdvisorThought,
      });
      return { ok: true, field, value };
    },
  });
}

export function createSuggestJobsTool({ addEvent }: PhoneToolContext) {
  return defineVoiceTool({
    name: "suggest_jobs",
    description:
      "ヒアリング内容をもとに最適な求人を提案します。十分な情報が集まったら呼び出してください。",
    parameters: z.object({
      jobs: z
        .array(
          z.object({
            title: z.string(),
            company: z.string(),
            salary: z.string(),
            location: z.string(),
            match: z.number().int().min(60).max(99),
          }),
        )
        .min(1)
        .max(3),
      current_thought: z
        .enum([
          "ラポール形成中",
          "ヒアリング中",
          "求人マッチング中",
          "提案準備中",
          "フォローアップ調整中",
          "クロージング",
        ]),
    }),
    async execute({ jobs, current_thought }) {
      addEvent({
        type: "job_suggestion",
        jobs,
        thought: current_thought as AdvisorThought,
      });
      return { ok: true, suggested_count: jobs.length };
    },
  });
}

export function createScheduleFollowupTool({ addEvent }: PhoneToolContext) {
  return defineVoiceTool({
    name: "schedule_followup",
    description: "次回の面談や求人紹介の日程を調整します。",
    parameters: z.object({
      datetime: z.string().describe("希望日時（例: 明日の14時、来週火曜日の午前中）"),
      current_thought: z
        .enum([
          "ラポール形成中",
          "ヒアリング中",
          "求人マッチング中",
          "提案準備中",
          "フォローアップ調整中",
          "クロージング",
        ]),
    }),
    async execute({ datetime, current_thought }) {
      addEvent({
        type: "followup_scheduled",
        datetime,
        thought: current_thought as AdvisorThought,
      });
      return { ok: true, scheduled: true, datetime };
    },
  });
}

export function createEndCallTool({
  setCallStatus,
  addEvent,
}: PhoneToolContext) {
  return defineVoiceTool({
    name: "end_call",
    description:
      "求職者が通話終了の意思を示したときに通話を終了します。必ず丁寧な締めの言葉をかけた後に呼び出してください。",
    parameters: z.object({
      closing_message: z.string().max(80),
    }),
    async execute({ closing_message }) {
      addEvent({ type: "end", message: closing_message });
      await new Promise((resolve) => setTimeout(resolve, 600));
      setCallStatus("ended");
      return { ok: true, ended: true };
    },
  });
}

export function getCompletedFieldCount(profile: CandidateProfile): number {
  return Object.values(profile).filter(Boolean).length;
}

export type { CandidateProfile };
