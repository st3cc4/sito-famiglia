// js/app.js - File Principale di Coordinamento Modulare

import { initAuth, getUtenteCorrente } from "./auth.js";
import { initAdmin, applicaPermessiSezioni } from "./admin.js";
import { initNavigation } from "./navigation.js";
import { initImpegni } from "./impegni.js";
import { initScadenze } from "./scadenze.js";
import { initRicette } from "./ricette.js";
import { initMedia } from "./media.js";

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inizializzazione Navigazione (Sidebar + HOME)
    initNavigation();

    // 2. Inizializzazione Autenticazione e Permessi
    initAuth((utente) => {
        if (utente && utente.permessi) {
            applicaPermessiSezioni(utente.permessi);
        }
    });

    // 3. Inizializzazione Gestione Admin
    initAdmin(getUtenteCorrente);

    // 4. Inizializzazione Moduli Sezioni
    initImpegni(getUtenteCorrente);
    initScadenze(getUtenteCorrente);
    initRicette(getUtenteCorrente);
    initMedia(getUtenteCorrente);

    console.log("Sito Famiglia inizializzato con successo in modalità modulare.");
});
