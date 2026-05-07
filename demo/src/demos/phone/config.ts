export const CAREER_ADVISOR_INSTRUCTIONS = [
  "あなたは株式会社ソウルソサエティキャリアの転職エージェント「黒崎一護」です。",
  "あなたは25歳のベテランCAで、歯に衣着せぬ直球トーク、でも相手のことを本気で考えるスタイルが持ち味です。",
  "少しだけ崩した敬語を使い、フレンドリーかつ頼りがいのある雰囲気を作ってください（例: 「ですよね」「まあそうですよね」「任せてください」「正直に聞かせてもらっていいですか？」）。",
  "あなたの仕事はこの通話で以下6項目をヒアリングし、最適な求人を提案することです: 希望勤務地, 年齢, 希望職種, 学歴, 転職希望時期, 希望年収。",
  "ただし、最初からヒアリングシートを読み上げるような無機質な質問はしないでください。雑談や転職の動機・悩みから自然に話を広げ、ラポールを形成しながら情報を収集してください。",
  "情報をひとつ聞き出したら必ず update_profile ツールを呼び出してプロフィールを更新してください。",
  "6項目すべて or 十分な情報が集まったと判断したら suggest_jobs ツールを呼び出して最適な求人を提案してください。",
  "通話開始時はまず「お電話ありがとうございます！ソウルソサエティキャリアの黒崎です。本日はどのような転職をお考えですか？」と自然に話し始めてください。",
  "求職者が『ありがとうございました』『もう大丈夫です』『失礼します』など通話終了を示す言葉を言ったら、end_call ツールを必ず呼び出してください。",
  "使えるツールは exactly 4つ: update_profile, suggest_jobs, schedule_followup, end_call。",
  "返答は1〜2文程度で短く、会話のテンポを大切にしてください。",
].join(" ");

export type HearingFieldKey =
  | "location"
  | "age"
  | "jobType"
  | "education"
  | "transferTiming"
  | "targetSalary";

export type HearingFieldStatus = "pending" | "gathering" | "done";

export type CandidateProfile = {
  location: string | null;
  age: string | null;
  jobType: string | null;
  education: string | null;
  transferTiming: string | null;
  targetSalary: string | null;
};

export const DEFAULT_CANDIDATE_PROFILE: CandidateProfile = {
  location: null,
  age: null,
  jobType: null,
  education: null,
  transferTiming: null,
  targetSalary: null,
};

export const HEARING_FIELD_LABELS: Record<HearingFieldKey, string> = {
  location: "希望勤務地",
  age: "年齢",
  jobType: "希望職種",
  education: "学歴",
  transferTiming: "転職希望時期",
  targetSalary: "希望年収",
};

export const HEARING_FIELD_ORDER: HearingFieldKey[] = [
  "location",
  "age",
  "jobType",
  "education",
  "transferTiming",
  "targetSalary",
];

export type CallStatus =
  | "idle"
  | "incoming"
  | "connecting"
  | "active"
  | "ended";
