import { Platform } from 'react-native';

/**
 * The daily reminder. The only notification this app ever sends.
 *
 * Base spec section 1: one notification per day, maximum, and it is opt in.
 * Section 8 excludes push notifications beyond that single daily reminder, so
 * everything here is a local scheduled notification. No push token, no server,
 * nothing to opt out of later.
 *
 * The only module that imports expo-notifications, for the same reason haptics
 * has one: a single choke point is how a constraint like this survives.
 *
 * expo-notifications is a native module, so it is loaded lazily and defensively.
 * A JS-only update can reach a build whose binary predates this dependency, and
 * in that case every function here degrades to "not scheduled" instead of
 * crashing the settings screen.
 *
 * The expo-notifications config plugin is deliberately not enabled. It adds the
 * aps-environment entitlement, which requires the Push Notifications capability
 * on the provisioning profile and fails the build without it. Local scheduled
 * notifications need none of that, and section 8 excludes push outright, so the
 * Android channel is created here at runtime instead.
 */
const IDENTIFIER = 'cobalt-daily-reminder';

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null | undefined;

function load(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-notifications') as NotificationsModule;
  } catch {
    cached = null;
  }
  return cached;
}

/** True when the binary actually contains the native module. */
export function remindersAvailable(): boolean {
  return load() !== null;
}

/**
 * Asks for permission and reports whether it was granted.
 *
 * Only ever call this from an explicit user action that turns the reminder on.
 * Requesting on screen entry, before the user has opted in, is how apps get
 * permanently denied, and iOS gives exactly one chance.
 */
export async function requestPermission(): Promise<boolean> {
  const N = load();
  if (!N) return false;
  try {
    const existing = await N.getPermissionsAsync();
    if (existing.granted) return true;
    // Already refused once. Asking again does nothing except fail silently.
    if (!existing.canAskAgain) return false;

    const asked = await N.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

/**
 * Android requires a channel before anything can be delivered. Created at
 * runtime rather than by the config plugin, so no push entitlement is needed.
 */
const CHANNEL = 'daily';

async function ensureChannel(N: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await N.setNotificationChannelAsync(CHANNEL, {
      name: 'Daily reminder',
      importance: N.AndroidImportance.DEFAULT,
      sound: null,
    });
  } catch {
    // A failed channel only means the notification will not appear on Android.
  }
}

/** Cancels any existing reminder. Safe to call when none is scheduled. */
export async function cancelReminder(): Promise<void> {
  const N = load();
  if (!N) return;
  try {
    await N.cancelScheduledNotificationAsync(IDENTIFIER);
  } catch {
    // No such notification, which is the normal case when turning it off twice.
  }
}

/**
 * Schedules the daily reminder at a local "HH:MM", replacing any existing one.
 *
 * Returns false when the module is missing or permission was refused, so the
 * caller can keep the stored setting honest rather than showing a reminder that
 * will never arrive.
 */
export async function scheduleReminder(time: string): Promise<boolean> {
  const N = load();
  if (!N) return false;

  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return false;

  const granted = await requestPermission();
  if (!granted) return false;

  await cancelReminder();
  await ensureChannel(N);

  try {
    await N.scheduleNotificationAsync({
      identifier: IDENTIFIER,
      content: {
        title: 'Cobalt',
        // Copy rules, section 6: no exclamation marks, no superlatives, second
        // person, and nothing that claims a cognitive benefit.
        body: 'Today’s set is ready.',
        sound: false,
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DAILY,
        hour: h,
        minute: m,
        channelId: Platform.OS === 'android' ? CHANNEL : undefined,
      },
    });
    return true;
  } catch {
    return false;
  }
}

/** Reconciles the scheduled notification with the stored setting. */
export async function syncReminder(time: string | null): Promise<boolean> {
  if (time === null) {
    await cancelReminder();
    return true;
  }
  return scheduleReminder(time);
}
