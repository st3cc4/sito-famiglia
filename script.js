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

    // 3. Gestione della Navigazione tra le tab
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');

            navButtons.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
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
