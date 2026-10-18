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

// Aplica as versões novas logo, sem esperar que todas as janelas fechem.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) { event.waitUntil(self.clients.claim()); });

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

  // A validade é aplicada pelo FCM (cabeçalho TTL); não comparamos com o relógio do aparelho,
  // porque um relógio errado fazia o aviso desaparecer em silêncio.

  const n = montarNotificacao(d);
  return self.registration.showNotification(n.titulo, n.opcoes);
});

// Links de conteúdo (?id=...) têm de apontar para /web.html; se vier só "/", corrige (também serve para avisos antigos).
function normalizarLink(l) {
  try {
    const u = new URL(l);
    if (u.origin === self.location.origin && (u.pathname === '/' || u.pathname === '') && u.searchParams.get('id')) {
      u.pathname = '/web.html';
    }
    return u.href;
  } catch (e) {
    return l;
  }
}

self.addEventListener('notificationclick', function (event) {
  const notif = event.notification;
  const dados = notif.data || {};
  notif.close();
  if (event.action === 'depois') return;

  const destino = normalizarLink(dados.link || (self.location.origin + '/'));

  event.waitUntil((async function () {
    try {
      const lista = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      let mesmaOrigem = false;
      try { mesmaOrigem = new URL(destino).origin === self.location.origin; } catch (e) {}

      if (mesmaOrigem) {
        for (const c of lista) {
          if (new URL(c.url).origin === self.location.origin) {
            // Página já aberta: pede à página para abrir o conteúdo, sem recarregar.
            try { await c.focus(); } catch (e) {}
            const confirmou = await new Promise(function (resolve) {
              const canal = new MessageChannel();
              const espera = setTimeout(function () { resolve(false); }, 700);
              canal.port1.onmessage = function () { clearTimeout(espera); resolve(true); };
              try {
                c.postMessage({ tipo: 'pd-abrir', url: destino }, [canal.port2]);
              } catch (e) {
                clearTimeout(espera);
                resolve(false);
              }
            });
            if (confirmou) return;
            break; // a página não respondeu: abre uma janela nova (abaixo)
          }
        }
      }
      if (clients.openWindow) await clients.openWindow(destino);
    } catch (e) {}
  })());
});
