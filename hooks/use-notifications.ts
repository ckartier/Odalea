import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  registerForPushNotificationsAsync,
  savePushTokenToFirestore,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
} from '@/services/notifications';
import { useFirebaseUser } from './firebase-user-store';

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>();
  const [notification, setNotification] = useState<Notifications.Notification>();
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const firebaseUserContext = useFirebaseUser();
  const user = firebaseUserContext?.user;

  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('⚠️ Push notifications are not fully supported on web');
      return;
    }

    registerForPushNotificationsAsync()
      .then(token => {
        if (token) {
          setExpoPushToken(token);
          if (user?.id) {
            savePushTokenToFirestore(user.id, token);
          }
        }
      })
      .catch(error => console.error('❌ Error registering for push notifications:', error));

    notificationListener.current = addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', notification);
      setNotification(notification);
    });

    responseListener.current = addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user?.id]);

  return {
    expoPushToken,
    notification,
  };
}
