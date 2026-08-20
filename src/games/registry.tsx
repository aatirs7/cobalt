import type { ComponentType } from 'react';
import type { GameKey } from '@/engine/types';
import type { GameProps } from './types';
import { Clusters } from './Clusters';
import { Five } from './Five';
import { Pattern } from './Pattern';
import { Recall } from './Recall';
import { Reckon } from './Reckon';
import { Sequence } from './Sequence';

/**
 * Which games are playable.
 *
 * A key absent from here falls back to the payload inspector, so an unbuilt
 * game never blocks the set. All six of the launch lineup are now present;
 * Crossword is standalone and lives outside the set entirely.
 */
type AnyGame = ComponentType<GameProps<never>>;
const as = (g: unknown) => g as AnyGame;

export const PLAYABLE: Partial<Record<GameKey, AnyGame>> = {
  five: as(Five),
  clusters: as(Clusters),
  recall: as(Recall),
  sequence: as(Sequence),
  reckon: as(Reckon),
  pattern: as(Pattern),
};

export function isPlayable(key: GameKey): boolean {
  return key in PLAYABLE;
}
