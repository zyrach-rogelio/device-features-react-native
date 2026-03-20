import * as Notifications from 'expo-notifications';

export function setupNotificationHandler(): void {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.warn('[Notifications] setNotificationHandler failed:', error);
  }
}

export async function sendEntrySavedNotification(address: string): Promise<void> {
  if (!address || typeof address !== 'string') {
    console.warn('[Notifications] Invalid address provided.');
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📍 Travel Entry Saved!',
        body: `Your memory at "${address}" has been added to your diary.`,
        sound: true,
        data: { type: 'entry_saved' },
      },
      trigger: null,
    });
  } catch (error) {
    console.error('[Notifications] Failed to send notification:', error);
  }
}