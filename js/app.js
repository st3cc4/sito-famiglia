// js/app.js - Punto di Ingresso Principale dell'Applicazione

import { initAuth, getUtenteCorrente } from "./auth.js";
import { initNavigation } from "./navigation.js";
import { initSidebar } from "./sidebar.js";
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

        // 3. Inizializza Modali direttamente
        initModals(getUtenteCorrente);

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

// Gestione centralizzata delle modali generali (Cambio Password, Colore, Admin)
function initModals(getUtenteCorrente) {
    // Modale Cambio Password
    const modalPassword = document.getElementById('modal-password');
    const btnChangePassword = document.getElementById('btn-change-password');
    const btnCloseModalPassword = document.getElementById('btn-close-modal-password');

    if (btnChangePassword && modalPassword) {
        btnChangePassword.addEventListener('click', () => {
            modalPassword.classList.add('active');
        });
    }
    if (btnCloseModalPassword && modalPassword) {
        btnCloseModalPassword.addEventListener('click', () => {
            modalPassword.classList.remove('active');
        });
    }

    // Modale Cambio Colore
    const modalColore = document.getElementById('modal-colore');
    const btnChangeColor = document.getElementById('btn-change-color');
    const btnCloseModalColore = document.getElementById('btn-close-modal-colore');

    if (btnChangeColor && modalColore) {
        btnChangeColor.addEventListener('click', () => {
            modalColore.classList.add('active');
        });
    }
    if (btnCloseModalColore && modalColore) {
        btnCloseModalColore.addEventListener('click', () => {
            modalColore.classList.remove('active');
        });
    }

    // Modale Admin
    const modalAdmin = document.getElementById('modal-admin');
    const btnAdminPanel = document.getElementById('btn-admin-panel');
    const btnCloseModalAdmin = document.getElementById('btn-close-modal-admin');

    if (btnAdminPanel && modalAdmin) {
        btnAdminPanel.addEventListener('click', () => {
            modalAdmin.classList.add('active');
        });
    }
    if (btnCloseModalAdmin && modalAdmin) {
        btnCloseModalAdmin.addEventListener('click', () => {
            modalAdmin.classList.remove('active');
        });
    }
}
