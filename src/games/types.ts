import type { PuzzlePayload } from '@/engine/types';

/**
 * The contract every playable game implements.
 *
 * A game receives a generated payload and reports one result. It knows nothing
 * about ratings, streaks, storage or navigation, so the completion pipeline can
 * change without touching a single game.
 */
export type GameResult = {
  /** Game specific, scored per the formula in games spec section 2. */
  rawScore: number;
  /** 0 to 1, used for progress copy only. Never shown as a percentage. */
  accuracy: number;
};

export type GameProps<P extends PuzzlePayload = PuzzlePayload> = {
  payload: P;
  onFinish: (result: GameResult) => void;
  /** True when the user has motion sensitivity, so stimulus timing still runs but nothing animates. */
  reduced: boolean;
};
