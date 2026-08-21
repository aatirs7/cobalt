import type { GameKey } from '@/engine/types';

/**
 * How to play, per game.
 *
 * Copy rules from the onboarding spec section 6 apply here too: sentence case,
 * second person, no exclamation marks, no superlatives, and no claim that any
 * of this improves your brain.
 *
 * Deliberately no numbers. Games spec section 3.3 keeps ratings and tiers out
 * of sight, so these describe what to do rather than what anything is worth.
 */
export type Instructions = {
  /** One line on what the game is asking of you. */
  summary: string;
  /** How to actually play it. */
  steps: string[];
  /** What the game is training, stated plainly and without claims. */
  trains: string;
};

export const INSTRUCTIONS: Record<GameKey, Instructions> = {
  five: {
    summary: 'Find the hidden five letter word in six guesses.',
    steps: [
      'Type any real five letter word and press Enter.',
      'A filled tile means that letter is in the right place.',
      'A pale tile means the letter is in the word but somewhere else.',
      'An empty tile means the letter is not in the word at all.',
      'The keyboard remembers what you have learned as you go.',
    ],
    trains: 'Vocabulary retrieval, and working within a constraint.',
  },

  clusters: {
    summary: 'Sort sixteen words into four groups of four.',
    steps: [
      'Tap four words that belong together, then Submit.',
      'A correct group lifts out of the grid and shows what connected it.',
      'You are told when you are one word away from a group.',
      'Four mistakes end the round.',
      'Some words look like they fit two groups. That is the puzzle.',
    ],
    trains: 'Spotting categories, and resisting the connection that is not there.',
  },

  recall: {
    summary: 'Watch a grid of symbols, then reproduce what was there.',
    steps: [
      'Symbols appear briefly, then hide.',
      'Round one asks where the symbols were.',
      'Round two asks which symbols you saw.',
      'Round three asks where one specific symbol was, which is the hard one.',
      'Tap your answer, then Confirm.',
    ],
    trains: 'Holding what something is and where it was at the same time.',
  },

  sequence: {
    summary: 'Repeat the order the tiles light up in.',
    steps: [
      'Watch the tiles light one at a time.',
      'Tap them back in the same order.',
      'Some rounds ask for the order in reverse. Those are worth more.',
      'Each success adds one to the length.',
      'Two misses at the same length end the round.',
    ],
    trains: 'How much you can hold in order at once.',
  },

  reckon: {
    summary: 'Answer as much arithmetic as you can in sixty seconds.',
    steps: [
      'Use the number pad. Your answer submits itself once it is long enough.',
      'The problems get harder as you keep getting them right.',
      'Wrong answers cost you, so speed alone is not enough.',
      'The line at the top is the time running down.',
    ],
    trains: 'Arithmetic fluency under time pressure.',
  },

  pattern: {
    summary: 'Work out the rule, then pick the figure that completes it.',
    steps: [
      'Each grid follows rules that run across the rows and down the columns.',
      'Shape, how many, and whether it is filled can each be part of the rule.',
      'Pick the figure that belongs in the empty cell.',
      'You are not told whether you were right, because that would give away the next one.',
      'There are five grids.',
    ],
    trains: 'Finding a rule from examples, with nothing explained to you.',
  },
};

/** Crossword is standalone and has no generated payload, so it is separate. */
export const CROSSWORD_INSTRUCTIONS: Instructions = {
  summary: 'A small daily crossword, outside the daily set.',
  steps: [
    'Crossword does not count toward finishing your set.',
    'It does not affect your streak either.',
    'Relaxed mode has no timer and lets you check your work.',
    'Timed mode records your time and is the one that can post a score.',
  ],
  trains: 'Vocabulary, general knowledge, and lateral thinking.',
};
