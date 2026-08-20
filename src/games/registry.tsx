import type { ComponentType } from 'react';
import type { GameKey } from '@/engine/types';
import type { GameProps } from './types';
import { Recall } from './Recall';
import { Sequence } from './Sequence';

/**
 * Which games are actually playable.
 *
 * A key absent from here falls back to the payload inspector, so unimplemented
 * games still exercise the full completion pipeline rather than blocking the
 * set. That is what lets games ship one at a time instead of all at once.
 */
export const PLAYABLE: Partial<Record<GameKey, ComponentType<GameProps<never>>>> = {
  recall: Recall as unknown as ComponentType<GameProps<never>>,
  sequence: Sequence as unknown as ComponentType<GameProps<never>>,
};

export function isPlayable(key: GameKey): boolean {
  return key in PLAYABLE;
}
