import type { GameKey } from '@/engine/types';

/**
 * How to play, as a few cards you tap through.
 *
 * One idea per card, which is the same discipline the onboarding spec applies
 * to its own screens. Nobody reads a numbered list of rules before a two minute
 * puzzle, and a wall of bullets is the opposite of the product this is.
 *
 * Copy rules from the onboarding spec section 6 hold: sentence case, second
 * person, no exclamation marks, no superlatives, no cognitive claims, and short
 * enough to take in at a glance. Games spec 3.3 also means no tiers, ratings or
 * rank names appear anywhere here.
 */
export type Instructions = readonly string[];

/** Three is the ceiling. If a game needs four, the game needs simplifying. */
export const INSTRUCTIONS: Record<GameKey, Instructions> = {
  five: [
    'Guess the five letter word.',
    'Filled means right place. Pale means right letter, wrong place.',
    'You get six tries.',
  ],

  clusters: [
    'Find the four groups of four.',
    'Some words look like they belong to two groups.',
    'Four mistakes ends the round.',
  ],

  recall: [
    'Symbols appear, then vanish.',
    'Tap where they were, or which ones you saw.',
    'The last round asks for both at once.',
  ],

  sequence: [
    'Watch the tiles light up.',
    'Tap them back in the same order.',
    'Some rounds ask for reverse.',
  ],

  reckon: [
    'Sixty seconds of arithmetic.',
    'Answers submit themselves once they are long enough.',
    'Wrong answers cost you, so accuracy still counts.',
  ],

  pattern: [
    'Each grid follows a rule.',
    'Shape, how many, and fill can all be part of it.',
    'Pick the figure that completes it.',
  ],
};

/** Crossword is standalone and has no generated payload, so it sits apart. */
export const CROSSWORD_INSTRUCTIONS: Instructions = [
  'A small crossword, every day.',
  'It sits outside your set and does not touch your streak.',
  'Relaxed has no timer. Timed does.',
];
