// js/app.js - Punto di Ingresso Principale dell'Applicazione

import { initAuth, getUtenteCorrente } from "./auth.js";
import { initNavigation } from "./navigation.js";
import { initSidebar } from "./sidebar.js";
import { initModals } from "./modals.js";
import { initImpegni } from "./impegni.js";
import { initScadenze } from "./scadenze.js";
import { initRicette } from "./ricette.js";
import { initMedia } from "./media.js";
import { initPWA } from "./pwa.js";

document.addEventListener('DOMContentLoaded', () => {
    try {
        // 1. Inizializza Gestione Installazione PWA
        initPWA();

        // 2. Inizializza Navigazione e Sidebar
        initNavigation();
        initSidebar();

        // 3. Inizializza Modali
        if (typeof initModals === 'function') {
            initModals(getUtenteCorrente);
        }

        // 4. Inizializza Moduli delle Sezioni
        if (typeof initImpegni === 'function') initImpegni(getUtenteCorrente);
        if (typeof initScadenze === 'function') initScadenze(getUtenteCorrente);
        if (typeof initRicette === 'function') initRicette(getUtenteCorrente);
        if (typeof initMedia === 'function') initMedia(getUtenteCorrente);

        // 5. Inizializza Autenticazione Utente
        if (typeof initAuth === 'function') initAuth();

        console.log("Sito Famiglia inizializzato con successo in modalità modulare PWA.");
    } catch (err) {
        console.error("Errore durante l'inizializzazione dell'app:", err);
    }
});
