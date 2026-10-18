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

const messaging = firebase.messaging();

const ICONE = '/logo.png';
const BADGE = '/badge.png';

// O servidor envia só dados; aqui montamos a notificação.
function montarNotificacao(d) {
  d = d || {};
  const opcoes = {
    body: d.corpo || '',
    icon: ICONE,
    badge: BADGE,
    tag: d.tag || 'geral',
    renotify: true, // a mais recente substitui a anterior do mesmo grupo e volta a avisar
    data: { link: d.link || '', tipo: d.tipo || '' }
  };
  if (d.imagem) opcoes.image = d.imagem;
  if (d.acoes === '1') {
    opcoes.actions = [
      { action: 'ver', title: 'Ver agora' },
      { action: 'depois', title: 'Mais tarde' }
    ];
  }
  return { titulo: d.titulo || 'Portal Digital', opcoes: opcoes };
}

messaging.onBackgroundMessage(function (payload) {
  // Se vier com "notification", o próprio FCM já mostra; evitamos duplicar.
  if (payload.notification) return;
  const d = payload.data || {};

  // Validade: se o aparelho estava desligado e a mensagem chegou tarde, não mostra.
  const expira = Number(d.expira) || 0;
  if (expira && Date.now() > expira) {
    // O navegador exige mostrar algo a cada push; mostramos em silêncio e fechamos logo.
    return self.registration.showNotification('Portal Digital', {
      tag: 'expirada',
      silent: true,
      icon: ICONE
    }).then(function () {
      return self.registration.getNotifications({ tag: 'expirada' });
    }).then(function (lista) {
      lista.forEach(function (n) { n.close(); });
    });
  }

  const n = montarNotificacao(d);
  return self.registration.showNotification(n.titulo, n.opcoes);
});

self.addEventListener('notificationclick', function (event) {
  const notif = event.notification;
  const dados = notif.data || {};
  notif.close();

  if (event.action === 'depois') return;

  const destino = dados.link || (self.location.origin + '/');

  event.waitUntil((async function () {
    const lista = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    let mesmaOrigem = false;
    try { mesmaOrigem = new URL(destino).origin === self.location.origin; } catch (e) {}

    if (mesmaOrigem) {
      for (const c of lista) {
        if (new URL(c.url).origin === self.location.origin) {
          // Página já aberta: pede à página para abrir o conteúdo, sem recarregar.
          try { await c.focus(); } catch (e) {}
          c.postMessage({ tipo: 'pd-abrir', url: destino });
          return;
        }
      }
    }
    if (clients.openWindow) return clients.openWindow(destino);
  })());
});
