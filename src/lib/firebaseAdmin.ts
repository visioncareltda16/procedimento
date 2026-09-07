// @ts-ignore
import admin from 'firebase-admin';

// @ts-ignore
if (!admin.apps.length) {
  try {
// @ts-ignore
    admin.initializeApp({
// @ts-ignore
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key needs to have newlines properly formatted
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

// @ts-ignore
export const messaging = admin.messaging();

export async function sendPushNotification(token: string, payload: { title: string, body: string, url?: string }) {
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
