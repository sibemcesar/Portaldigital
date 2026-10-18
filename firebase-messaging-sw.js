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

  // A validade é aplicada pelo FCM (cabeçalho TTL); não comparamos com o relógio do aparelho,
  // porque um relógio errado fazia o aviso desaparecer em silêncio.

  const n = montarNotificacao(d);
  return self.registration.showNotification(n.titulo, n.opcoes);
});

// DEBUG TEMPORÁRIO: mostra uma notificação "🔧 Teste de clique" com o que aconteceu (remover depois de testar).
function dbg(msg) {
  return self.registration.showNotification('🔧 Teste de clique', {
    body: msg,
    tag: 'debug-clique',
    icon: ICONE
  });
}

self.addEventListener('notificationclick', function (event) {
  const notif = event.notification;
  const dados = notif.data || {};
  const acao = event.action || 'corpo';
  notif.close();

  if (event.action === 'depois') {
    event.waitUntil(dbg('recebi o clique: ação=depois (só fecha)')); // DEBUG
    return;
  }

  const destino = dados.link || (self.location.origin + '/');

  event.waitUntil((async function () {
    let via = '';
    let resultado = '';
    let janelas = 0;
    try {
      const lista = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      janelas = lista.length;
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
            if (confirmou) { via = 'pagina respondeu'; return await dbg('ação=' + acao + ' | janelas=' + janelas + ' | via=' + via); } // DEBUG
            via = 'pagina nao respondeu -> janela nova';
            break;
          }
        }
      }
      if (!via) via = 'sem pagina aberta -> janela nova';
      if (clients.openWindow) {
        const w = await clients.openWindow(destino);
        resultado = w ? 'openWindow ok' : 'openWindow devolveu null';
      } else {
        resultado = 'openWindow indisponivel';
      }
    } catch (e) {
      resultado = 'ERRO: ' + (e && e.message ? e.message : e);
    }
    await dbg('ação=' + acao + ' | janelas=' + janelas + ' | via=' + via + ' | ' + resultado); // DEBUG
  })());
});
