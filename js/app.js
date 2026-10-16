// js/app.js - File Principale di Coordinamento Modulare

import { initAuth, utenteCorrente } from "./auth.js";
import { initAdmin, applicaPermessiSezioni } from "./admin.js";
import { initNavigation } from "./navigation.js";
import { initImpegni } from "./impegni.js";
import { initScadenze } from "./scadenze.js";
import { initRicette } from "./ricette.js";
import { initMedia } from "./media.js";

const getUtente = () => utenteCorrente;

document.addEventListener('DOMContentLoaded', () => {
    initAuth((utente) => {
        applicaPermessiSezioni(utente.permessi);
    });

    initAdmin(getUtente);

    initNavigation((sectionName) => {
        // Azioni extra al cambio sezione se necessarie
    });

    initImpegni(getUtente);
    initScadenze(getUtente);
    initRicette(getUtente);
    initMedia(getUtente);

    console.log("Sito Famiglia inizializzato con successo in modalità modulare.");
});
