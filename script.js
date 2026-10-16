import { db } from "./firebase-config.js";
import { caricaUtenti } from "./utenti/utenti.js";
import { caricaRicette } from "./ricette/ricette.js";
import { idUtenteCorrenteId, nomeUtenteCorrente } from "./auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    inizializzaNavigazione();
    inizializzaSidebarToggle();
    caricaDatiHome();
});

// Gestione della navigazione tra le sezioni del menu
function inizializzaNavigazione() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');

            // Rimuovi la classe active da tutti i link e sezioni
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Aggiungi la classe active al link selezionato e alla sezione corrispondente
            link.classList.add('active');
            const sezioneCorrente = document.getElementById(`${targetSection}-section`);
            if (sezioneCorrente) {
                sezioneCorrente.classList.add('active');
            }

            // Carica dati specifici in base alla sezione aperta
            if (targetSection === 'utenti') {
                caricaUtenti();
            } else if (targetSection === 'ricette') {
                caricaRicette();
            } else if (targetSection === 'home') {
                caricaDatiHome();
            }
        });
    });
}

// Gestione dell'apertura e chiusura della barra laterale (Sidebar)
function inizializzaSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const appContainer = document.querySelector('.app-container');

    if (sidebarToggle && appContainer) {
        sidebarToggle.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
            }
        });
    }
}

// Caricamento dei riepiloghi nella Home
async function caricaDatiHome() {
    const summaryScadenze = document.getElementById('home-summary-scadenze');
    const summaryImpegni = document.getElementById('home-summary-impegni');

    if (summaryScadenze) {
        summaryScadenze.innerHTML = `<p style="color: #64748b; font-size: 0.9rem;">Nessuna scadenza recente.</p>`;
    }

    if (summaryImpegni) {
        summaryImpegni.innerHTML = `<p style="color: #64748b; font-size: 0.9rem;">Nessun impegno imminente.</p>`;
    }
}

// Funzione globale per aggiornare i riepiloghi delle ricette dalla home se necessario
window.caricaSummaryRicetteHome = function() {
    // Eventuale logica di aggiornamento riepilogo ricette
};
