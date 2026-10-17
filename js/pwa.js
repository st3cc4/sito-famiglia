// js/pwa.js - Gestione Prompt Installazione PWA e Registrazione Service Worker

let deferredPrompt = null;

export function initPWA() {
    // 1. Registrazione Service Worker se supportato dal browser
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('Service Worker registrato con successo:', reg.scope))
                .catch(err => console.error('Errore registrazione Service Worker:', err));
        });
    }

    const pwaBanner = document.getElementById('pwa-install-banner');
    const btnInstall = document.getElementById('btn-pwa-install');
    const btnClose = document.getElementById('btn-pwa-close');

    // 2. Intercetta l'evento di installazione del browser
    window.addEventListener('beforeinstallprompt', (e) => {
        // Previene il banner nativo automatico per mostrare il nostro personalizzato
        e.preventDefault();
        deferredPrompt = e;

        // Mostra il banner in alto
        if (pwaBanner) {
            pwaBanner.classList.remove('hidden');
        }
    });

    // 3. Azione pulsante "Installa"
    if (btnInstall) {
        btnInstall.addEventListener('click', async () => {
            if (!deferredPrompt) return;

            // Mostra il prompt nativo di installazione
            deferredPrompt.prompt();

            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Risposta installazione utente: ${outcome}`);

            deferredPrompt = null;
            if (pwaBanner) pwaBanner.classList.add('hidden');
        });
    }

    // 4. Azione pulsante "✕" Chiudi
    if (btnClose) {
        btnClose.addEventListener('click', () => {
            if (pwaBanner) pwaBanner.classList.add('hidden');
        });
    }

    // 5. Nascondi banner se l'app è già stata installata
    window.addEventListener('appinstalled', () => {
        console.log('Sito Famiglia è stato installato con successo!');
        if (pwaBanner) pwaBanner.classList.add('hidden');
        deferredPrompt = null;
    });
}
