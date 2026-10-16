// js/app.js - File Principale di Coordinamento Modulare

import { initAuth, utenteCorrente } from "./auth.js";
import { initAdmin, applicaPermessiSezioni } from "./admin.js";
import { initNavigation } from "./navigation.js";
import { initImpegni } from "./impegni.js";
import { initScadenze } from "./scadenze.js";
import { initRicette } from "./ricette.js";
import { initMedia } from "./media.js";

// Funzione di utilità per passare l'utente corrente ai moduli dati
const getUtente = () => utenteCorrente;

// Inizializzazione al caricamento del DOM
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Inizializza Autenticazione (gestisce login, sessione, cambio password/colore e logout)
    initAuth((utente) => {
        // Callback eseguita al login avvenuto con successo
        applicaPermessiSezioni(utente.permessi);
    });

    // 2. Inizializza Pannello Admin e Gestione Utenti/Permessi
    initAdmin(getUtente);

    // 3. Inizializza Navigazione e Sidebar
    initNavigation((sectionName) => {
        // Eventuali azioni extra al cambio sezione
    });

    // 4. Inizializza i moduli delle sezioni dati (Firestore)
    initImpegni(getUtente);
    initScadenze(getUtente);
    initRicette(getUtente);
    initMedia(getUtente);

    console.log("Sito Famiglia inizializzato con successo in modalità modulare.");
});
