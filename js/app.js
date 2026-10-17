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
    // Inizializza Gestione Installazione PWA
    initPWA();

    // Inizializza Navigazione e Menu Laterale
    initNavigation();
    initSidebar();
    initModals(getUtenteCorrente);

    // Inizializza Moduli di Sezione
    initImpegni(getUtenteCorrente);
    initScadenze(getUtenteCorrente);
    initRicette(getUtenteCorrente);
    initMedia(getUtenteCorrente);

    // Inizializza Autenticazione Utente
    initAuth();

    console.log("Sito Famiglia inizializzato con successo in modalità modulare PWA.");
});
