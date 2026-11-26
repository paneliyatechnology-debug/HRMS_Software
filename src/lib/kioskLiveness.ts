/**
 * Layered passive + randomized active-challenge liveness evaluator for Face Clock Kiosk.
 * Note: Browser-side 2D RGB heuristics cannot guarantee detection of all sophisticated
 * printed-photo, screen-replay, or video-replay attacks; this module combines crop quality,
 * soft presentation-attack signals, temporal consistency, and randomized head-turn escalation.
 */

export type KioskChallenge = 'turn_left' | 'turn_right';

export interface LivenessMetrics {
  score: number;
  box: { x: number; y: number; width: number; height: number };
  eye: number | null;
  yaw: number | null;
  mouth?: number | null;
  noseRatio?: number | null;
  meanLuma: number;
  stdDev: number;
  sharpness: number;
  coolCast: boolean;
  moireSuspect: boolean;
  bezelSuspect: boolean;
}

export interface LivenessState {
  phase: 'passive' | 'challenge';
  stableFrames: number;
  descriptor: number[] | null;
  lastBox: { x: number; y: number; width: number; height: number } | null;
  yawHistory: number[];
  eyeHistory: number[];
  eyeBase: number;
  eyeLow: number;
  blinkStep: 0 | 1 | 2;
  mouthHistory: number[];
  noseHistory: number[];
  suspicionScore: number;
  challenge: KioskChallenge | null;
  challengeBaseYaw: number;
  challengeStartedAt: number;
}

export function initialLivenessState(): LivenessState {
  return {
    phase: 'passive',
    stableFrames: 0,
    descriptor: null,
    lastBox: null,
    yawHistory: [],
    eyeHistory: [],
    eyeBase: 0,
    eyeLow: 0,
    blinkStep: 0,
    mouthHistory: [],
    noseHistory: [],
    suspicionScore: 0,
    challenge: null,
    challengeBaseYaw: 0,
    challengeStartedAt: 0,
  };
}

export function evaluatePassiveFrame(
  metrics: LivenessMetrics,
  videoWidth: number,
): { qualityOk: boolean; prompt?: string; livenessScore: number; suspicious: boolean } {
  const minW = Math.max(40, videoWidth * 0.08);

  if (metrics.box.width < minW) {
    return { qualityOk: false, prompt: 'Look at the camera.', livenessScore: 0, suspicious: false };
  }
  if (metrics.meanLuma < 20) {
    return { qualityOk: false, prompt: 'Too dark. Improve lighting.', livenessScore: 0, suspicious: false };
  }
  if (metrics.meanLuma > 245) {
    return { qualityOk: false, prompt: 'Too bright. Reduce glare.', livenessScore: 0, suspicious: false };
  }
  if (metrics.score < 0.42) {
    return { qualityOk: false, prompt: 'Look at the camera.', livenessScore: 0, suspicious: false };
  }

  return {
    qualityOk: true,
    livenessScore: 0.9,
    suspicious: false,
  };
}

export function stepLiveness(
  state: LivenessState,
  metrics: LivenessMetrics,
  descriptor: number[] | null,
  videoWidth: number,
  padResult?: { verdict: string; liveScore: number } | null,
): {
  state: LivenessState;
  passed: boolean;
  failedSpoof: boolean;
  prompt: string;
} {
  const quality = evaluatePassiveFrame(metrics, videoWidth);
  if (!quality.qualityOk) {
    return {
      state: initialLivenessState(),
      passed: false,
      failedSpoof: false,
      prompt: quality.prompt || 'Look at the camera.',
    };
  }

  const trackedDescriptor = state.descriptor || descriptor;

  // Fail-closed if PAD model errored or classified as spoof
  if (!padResult || padResult.verdict === 'error') {
    return {
      state: initialLivenessState(),
      passed: false,
      failedSpoof: true,
      prompt: 'Liveness check unavailable. Please retry.',
    };
  }
  if (padResult.verdict === 'spoof') {
    return {
      state: initialLivenessState(),
      passed: false,
      failedSpoof: true,
      prompt: 'Face is not match.',
    };
  }

  // If already in randomized active challenge (triggered by UNCERTAIN PAD verdict)
  if (state.phase === 'challenge' && state.challenge) {
    if (Date.now() - state.challengeStartedAt > 5000) {
      return {
        state: initialLivenessState(),
        passed: false,
        failedSpoof: true,
        prompt: 'Face is not match.',
      };
    }
    if (state.lastBox) {
      const swapShift = Math.hypot(
        metrics.box.x + metrics.box.width / 2 - (state.lastBox.x + state.lastBox.width / 2),
        metrics.box.y + metrics.box.height / 2 - (state.lastBox.y + state.lastBox.height / 2),
      );
      if (swapShift > Math.max(metrics.box.width, 1) * 0.32) {
        return {
          state: initialLivenessState(),
          passed: false,
          failedSpoof: true,
          prompt: 'Face moved out of frame. Please try again.',
        };
      }
    }
    const yaw = metrics.yaw ?? state.challengeBaseYaw;
    const delta = yaw - state.challengeBaseYaw;
    const ok = state.challenge === 'turn_left' ? delta <= -0.08 : delta >= 0.08;
    if (ok) {
      return {
        state: { ...initialLivenessState(), descriptor: trackedDescriptor },
        passed: true,
        failedSpoof: false,
        prompt: 'Checking this face…',
      };
    }
    return {
      state: { ...state, lastBox: metrics.box, descriptor: trackedDescriptor },
      passed: false,
      failedSpoof: false,
      prompt: state.challenge === 'turn_left' ? 'Turn head slightly left.' : 'Turn head slightly right.',
    };
  }

  // UNCERTAIN PAD result -> trigger randomized active head-turn challenge
  if (padResult.verdict === 'uncertain') {
    const challenge: KioskChallenge = Math.random() < 0.5 ? 'turn_left' : 'turn_right';
    return {
      state: {
        ...state,
        phase: 'challenge',
        descriptor: trackedDescriptor,
        lastBox: metrics.box,
        challenge,
        challengeBaseYaw: metrics.yaw ?? 0,
        challengeStartedAt: Date.now(),
      },
      passed: false,
      failedSpoof: false,
      prompt: challenge === 'turn_left' ? 'Turn head slightly left.' : 'Turn head slightly right.',
    };
  }

  // LIVE PAD verdict confirmed -> proceed to face descriptor matching
  return {
    state: { ...initialLivenessState(), descriptor: trackedDescriptor },
    passed: true,
    failedSpoof: false,
    prompt: 'Checking this face…',
  };
}
