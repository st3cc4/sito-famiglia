import { caricaAppuntamenti } from './impegni/impegni.js';
import { caricaScadenze } from './scadenze/scadenze.js';
import { caricaRicette } from './ricette/ricette.js';
import { caricaMedia } from './media/media.js';
import { caricaUtenti } from './utenti/utenti.js';
import { inizializzaAuth, nomeUtenteCorrente, isAdminCorrente } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inizializzazione Autenticazione e Profilo
    await inizializzaAuth();

    // 2. Caricamento iniziale di tutte le sezioni
    caricaTuttiIContenuti();

    // 3. Gestione della Navigazione tra le tab (Sidebar)
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    function attivaSezione(targetId) {
        navButtons.forEach(b => {
            if (b.getAttribute('data-target') === targetId) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        sections.forEach(s => {
            if (s.id === targetId) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            attivaSezione(targetId);
        });
    });

    // 4. Rendere cliccabili le schede nella Home
    const clickableCards = document.querySelectorAll('.clickable-card');
    clickableCards.forEach(card => {
        card.addEventListener('click', () => {
            const targetId = card.getAttribute('data-target');
            if (targetId) {
                attivaSezione(targetId);
            }
        });
    });
});

async function caricaTuttiIContenuti() {
    try {
        await caricaAppuntamenti();
        await caricaScadenze();
        await caricaRicette();
        await caricaMedia();
        await caricaUtenti();
    } catch (err) {
        console.error("Errore durante il caricamento dei dati:", err);
    }
}
