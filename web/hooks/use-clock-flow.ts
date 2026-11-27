import { useState } from "react";
import { useAttendancePolicy, useClockInOut } from "@/hooks/use-attendance";
import { describeClockError, type ClockProblem } from "@/lib/clock-problems";
import { getErrorCode } from "@/lib/errors";
import { requestPosition, type DeviceLocation } from "@/lib/geolocation";

export type ClockPhase = "idle" | "locating" | "submitting";

const CHECK_OUT_LOCATION_TIMEOUT_MS = 5_000;

async function optionalPosition() {
  try {
    return await requestPosition({ timeout: CHECK_OUT_LOCATION_TIMEOUT_MS });
  } catch {
    return undefined;
  }
}

export function useClockFlow(checkedIn: boolean) {
  const policy = useAttendancePolicy();
  const clock = useClockInOut();
  const [phase, setPhase] = useState<ClockPhase>("idle");
  const [problem, setProblem] = useState<ClockProblem | null>(null);
  const locationRequired = policy.data?.locationRequired ?? false;

  const submit = async (location?: DeviceLocation) => {
    try {
      await clock.mutateAsync(location);
    } catch (error) {
      if (location || getErrorCode(error) !== "LOCATION_REQUIRED") throw error;

      setPhase("locating");
      const found = await requestPosition();
      setPhase("submitting");
      await clock.mutateAsync(found);
    }
  };

  const run = async () => {
    setProblem(null);
    try {
      let location: DeviceLocation | undefined;
      if (locationRequired) {
        setPhase("locating");
        location = checkedIn
          ? await optionalPosition()
          : await requestPosition();
      }
      setPhase("submitting");
      await submit(location);
    } catch (error) {
      setProblem(describeClockError(error));
    } finally {
      setPhase("idle");
    }
  };

  return {
    run,
    phase,
    problem,
    locationRequired,
    workplaces: policy.data?.workplaces ?? [],
  };
}
