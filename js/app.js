// js/app.js - File principale di avvio dell'applicazione

import { initAuth, getUtenteCorrente } from "./auth.js";
import { initNavigation } from "./navigation.js";
import { initImpegni } from "./js/impegni.js"; // Nota: se il percorso è locale usa "./impegni.js" o analogo in base alla tua struttura
import { initScadenze } from "./scadenze.js";
import { initRicette } from "./ricette.js";
import { initMedia } from "./media.js";

document.addEventListener('DOMContentLoaded', () => {
    // Inizializza l'autenticazione e i moduli al login riuscito
    initAuth(() => {
        // Callback eseguita quando l'utente è autenticato con successo
        initNavigation();
        initImpegni(getUtenteCorrente);
        initScadenze(getUtenteCorrente);
        initRicette(getUtenteCorrente);
        initMedia(getUtenteCorrente);
        
        // Inizializza la gestione del banner PWA
        initPwaBanner();
    });
});

// Funzione dedicata per gestire la chiusura e l'installazione del Banner PWA
function initPwaBanner() {
    const banner = document.getElementById('pwa-install-banner');
    const btnClose = document.getElementById('pwa-btn-close');
    const btnInstall = document.getElementById('pwa-btn-install');

    // Se l'utente aveva già chiuso il banner in precedenza, assicurati che sia nascosto
    if (localStorage.getItem('pwa_banner_chiuso') === 'true') {
        if (banner) banner.classList.add('hidden');
    }

    // Gestione del click sulla "✕" per chiudere il banner definitivamente
    if (btnClose && banner) {
        btnClose.addEventListener('click', () => {
            banner.classList.add('hidden');
            localStorage.setItem('pwa_banner_chiuso', 'true');
        });
    }

    // Gestione dell'evento di installazione PWA
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (banner && localStorage.getItem('pwa_banner_chiuso') !== 'true') {
            banner.classList.remove('hidden');
        }
    });

    if (btnInstall) {
        btnInstall.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('Utente ha accettato installazione PWA');
                }
                deferredPrompt = null;
            }
            if (banner) banner.classList.add('hidden');
            localStorage.setItem('pwa_banner_chiuso', 'true');
        });
    }
}
