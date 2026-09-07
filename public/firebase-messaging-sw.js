importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// O Firebase Config será injetado pelo app na inicialização, ou você pode colocar fixo aqui se não houver problemas de segurança para essas chaves públicas
// Se preferir dinâmico, pode usar os mesmos valores do cliente
const firebaseConfig = {
  apiKey: "SERA_INJETADO_OU_COLADO_AQUI", // Dica: para o SW funcionar stand-alone as chaves precisam estar aqui ou injetadas via URL search params
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

// firebase.initializeApp(firebaseConfig);
// const messaging = firebase.messaging();
// 
// messaging.onBackgroundMessage(function(payload) {
//   console.log('[firebase-messaging-sw.js] Received background message ', payload);
//   const notificationTitle = payload.notification.title;
//   const notificationOptions = {
//     body: payload.notification.body,
//     icon: '/icon-192x192.png'
//   };
// 
//   self.registration.showNotification(notificationTitle,
//     notificationOptions);
// });
