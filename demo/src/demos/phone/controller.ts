import { useCallback, useMemo } from "react";

import { useSharedDemoController } from "../shared/session";
import {
  CAREER_ADVISOR_INSTRUCTIONS,
  type CallStatus,
  type HearingFieldKey,
} from "./config";
import {
  createEndCallTool,
  createScheduleFollowupTool,
  createSuggestJobsTool,
  createUpdateProfileTool,
  type CallEvent,
} from "./tools";

type UseCareerAdvisorControllerOptions = {
  setCallStatus: (status: CallStatus) => void;
  updateProfile: (field: HearingFieldKey, value: string) => void;
  addEvent: (event: CallEvent) => void;
};

export function useCareerAdvisorController({
  setCallStatus,
  updateProfile,
  addEvent,
}: UseCareerAdvisorControllerOptions) {
  const stableUpdateProfile = useCallback(updateProfile, [updateProfile]);
  const stableAddEvent = useCallback(addEvent, [addEvent]);
  const stableSetCallStatus = useCallback(setCallStatus, [setCallStatus]);

  const toolContext = useMemo(
    () => ({
      setCallStatus: stableSetCallStatus,
      updateProfile: stableUpdateProfile,
      addEvent: stableAddEvent,
    }),
    [stableSetCallStatus, stableUpdateProfile, stableAddEvent],
  );

  const tools = useMemo(
    () => [
      createUpdateProfileTool(toolContext),
      createSuggestJobsTool(toolContext),
      createScheduleFollowupTool(toolContext),
      createEndCallTool(toolContext),
    ],
    [toolContext],
  );

  return useSharedDemoController({
    demoId: "phone",
    instructions: CAREER_ADVISOR_INSTRUCTIONS,
    postToolResponse: true,
    tools,
    outputMode: "audio",
    voice: "echo",
  });
}
