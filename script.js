import { inizializzaAuth } from "./auth.js";
import { caricaScadenze } from "./scadenze/scadenze.js";
import { caricaAppuntamenti } from "./impegni/impegni.js";
import { caricaMedia } from "./media/media.js";
import { caricaRicette } from "./ricette/ricette.js";
import { caricaUtenti } from "./utenti/utenti.js";

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inizializzazione Autenticazione
    await inizializzaAuth();

    // 2. Caricamento iniziale di tutti i dati per popolare la Home e le sezioni
    caricaScadenze();
    caricaAppuntamenti();
    caricaMedia();
    caricaRicette();
    caricaUtenti();

    // 3. Elementi della Sidebar e Navigazione
    const sidebar = document.getElementById('sidebar');
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');
    const clickableCards = document.querySelectorAll('.clickable-card');

    // Gestione Apertura/Chiusura Sidebar (Toggle tra aperta e chiusa a icone)
    if (btnToggleSidebar && sidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('closed');
        });
    }

    // Funzione principale per cambiare Sezione
    function cambiaSezione(targetId) {
        // Disattiva tutti i pulsanti nav e le sezioni
        navButtons.forEach(btn => {
            if (btn.getAttribute('data-target') === targetId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        sections.forEach(sec => {
            if (sec.id === targetId) {
                sec.classList.add('active');
            } else {
                sec.classList.remove('active');
            }
        });

        // Ricarica i dati della sezione corrispondente per sicurezza
        if (targetId === 'home-section' || targetId === 'scadenze-section') {
            caricaScadenze();
        }
        if (targetId === 'home-section' || targetId === 'impegni-section') {
            caricaAppuntamenti();
        }
        if (targetId === 'home-section' || targetId === 'media-section') {
            caricaMedia();
        }
        if (targetId === 'home-section' || targetId === 'ricette-section') {
            caricaRicette();
        }
        if (targetId === 'utenti-section') {
            caricaUtenti();
        }

        // Scorri in alto la pagina
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Event listener per i pulsanti del menu sidebar
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            if (target) {
                cambiaSezione(target);
                // Sui telefoni o schermi piccoli chiudiamo la sidebar dopo la selezione
                if (window.innerWidth <= 768 && sidebar) {
                    sidebar.classList.add('closed');
                }
            }
        });
    });

    // Event listener per i pulsanti "&larr; Torna alla Home"
    const tornaHomeButtons = document.querySelectorAll('.btn-torna-home');
    tornaHomeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target') || 'home-section';
            cambiaSezione(target);
        });
    });

    // Event listener per le schede cliccabili nella HOME
    clickableCards.forEach(card => {
        card.addEventListener('click', () => {
            const target = card.getAttribute('data-target');
            if (target) {
                cambiaSezione(target);
            }
        });
    });
});
