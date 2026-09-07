import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

if (!getApps().length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (serviceAccount.projectId && serviceAccount.privateKey) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const messaging = getApps().length ? getMessaging() : null;

export async function sendPushNotification(token: string, payload: { title: string, body: string, url?: string }) {
  if (!messaging) return false;
  
  try {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      webpush: {
        fcmOptions: {
          link: payload.url || '/',
        }
      },
      token: token,
    };
    
    await messaging.send(message);
    return true;
  } catch (error) {
    console.error('Error sending push notification', error);
    return false;
  }
}
