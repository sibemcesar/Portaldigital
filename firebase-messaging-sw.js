importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBgEfuLNpU5j9EIcvQ9Qs_reEvtXGPIbO0",
  authDomain: "gameplus-59458.firebaseapp.com",
  projectId: "gameplus-59458",
  storageBucket: "gameplus-59458.firebasestorage.app",
  messagingSenderId: "450449493424",
  appId: "1:450449493424:web:c8ffa9fee810330761da75"
});

// Com payload "notification", o próprio FCM mostra a notificação em segundo plano.
firebase.messaging();
