/**
 * Public surface of the puzzle engine.
 *
 * Everything under src/engine is pure. Nothing in here imports react, react
 * native or expo, which is what lets this whole directory move into the Vercel
 * cron unchanged when generation goes server side. The lint config enforces it,
 * so the constraint survives contact with future edits.
 */

export * from './dateKey';
export * from './difficulty';
export * from './generateDailySet';
export * from './prng';
export * from './streak';
export * from './types';
