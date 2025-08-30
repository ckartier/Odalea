import { Platform } from 'react-native';

export type TrackingEvent =
  | 'signup_step'
  | 'map_filter_apply'
  | 'booking_confirm';

export type TrackingPayload = Record<string, string | number | boolean | null | undefined>;

export function track(event: TrackingEvent, payload?: TrackingPayload) {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[track] ${event} @ ${timestamp}`, { ...payload, platform: Platform.OS });
  } catch (e) {
    console.log('track error', e);
  }
}
