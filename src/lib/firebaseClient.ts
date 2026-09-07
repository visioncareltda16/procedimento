import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasValidConfig = !!firebaseConfig.projectId;

const app = hasValidConfig 
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null;

export const requestForToken = async () => {
  if (!app) return null;
  try {
    const supported = await isSupported();
    if (!supported) return null;

    const messaging = getMessaging(app);
    const currentToken = await getToken(messaging, { 
      // This VAPID key is public, used to authenticate with push services
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY 
    });

    if (currentToken) {
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!app) return;
    isSupported().then((supported) => {
      if (supported) {
        const messaging = getMessaging(app);
        onMessage(messaging, (payload) => {
          resolve(payload);
        });
      }
    });
  });
