import { inizializzaAuth } from "./auth.js";
import { caricaScadenze } from "./scadenze/scadenze.js";
import { caricaAppuntamenti } from "./impegni/impegni.js";
import { caricaMedia } from "./media/media.js";
import { caricaRicette } from "./ricette/ricette.js";
import { caricaUtenti } from "./utenti/utenti.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", async () => {
    // Inizializza l'autenticazione e i login
    await inizializzaAuth();

    // Caricamento iniziale dei dati per tutte le sezioni
    caricaScadenze();
    caricaAppuntamenti();
    caricaMedia();
    caricaRicette();
    caricaUtenti();
    caricaSummaryScadenzeHome();

    // Gestione Sidebar (apertura/chiusura)
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const sidebar = document.getElementById('sidebar');

    if (btnToggleSidebar && sidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('closed');
            sidebar.classList.toggle('open');
        });
    }

    // Navigazione tra le sezioni tramite i bottoni della Sidebar e le card della Home
    const navButtons = document.querySelectorAll('.nav-btn, .clickable-card');
    const sections = document.querySelectorAll('.section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            if (!targetId) return;

            // Rimuovi la classe active da tutte le sezioni e bottoni
            sections.forEach(sec => sec.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

            // Attiva la sezione desiderata
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // Evidenzia il pulsante corrispondente nella sidebar
            const matchingNavBtn = document.querySelector(`.nav-btn[data-target="${targetId}"]`);
            if (matchingNavBtn) {
                matchingNavBtn.classList.add('active');
            }

            // Su mobile chiudiamo la sidebar dopo il click
            if (window.innerWidth <= 768 && sidebar) {
                sidebar.classList.add('closed');
                sidebar.classList.remove('open');
            }

            // Ricarica i dati specifici della sezione aperta
            if (targetId === 'scadenze-section') {
                caricaScadenze();
                caricaSummaryScadenzeHome();
            } else if (targetId === 'impegni-section') {
                caricaAppuntamenti();
            } else if (targetId === 'media-section') {
                caricaMedia();
            } else if (targetId === 'ricette-section') {
                caricaRicette();
            } else if (targetId === 'utenti-section') {
                caricaUtenti();
            }
        });
    });
});

// Funzione di supporto per popolare il riquadro Scadenze nella HOME con la regola di priorità a cascata
async function caricaSummaryScadenzeHome() {
    const summaryScadenze = document.getElementById('home-summary-scadenze');
    if (!summaryScadenze) return;

    try {
        const querySnapshot = await getDocs(collection(db, "scadenze"));
        let scadenze = [];
        querySnapshot.forEach((docSnap) => {
            scadenze.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Ordinamento per data
        scadenze.sort((a, b) => new Date(a.data) - new Date(b.data));

        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);

        // Classifichiamo le scadenze per fasce di priorità
        let fasce = {
            urgenti: [], // <= 7 giorni (o scadute)
            medie: [],   // tra 8 e 14 giorni
            future: []   // >= 15 giorni
        };

        scadenze.forEach((s) => {
            const dataScadenza = new Date(s.data);
            dataScadenza.setHours(0, 0, 0, 0);
            
            const diffTempo = dataScadenza - oggi;
            const diffGiorni = Math.round(diffTempo / (1000 * 60 * 60 * 24));

            s.diffGiorni = diffGiorni;

            if (diffGiorni <= 7) {
                fasce.urgenti.push(s);
            } else if (diffGiorni >= 8 && diffGiorni <= 14) {
                fasce.medie.push(s);
            } else {
                fasce.future.push(s);
            }
        });

        // Regola di priorità a cascata: se ci sono urgenti, mostra solo quelle; altrimenti medie; altrimenti future.
        let scadenzeDaMostrare = [];
        if (fasce.urgenti.length > 0) {
            scadenzeDaMostrare = fasce.urgenti;
        } else if (fasce.medie.length > 0) {
            scadenzeDaMostrare = fasce.medie;
        } else {
            scadenzeDaMostrare = fasce.future;
        }

        let htmlSummary = "";
        scadenzeDaMostrare.forEach((s) => {
            const dataScadenza = new Date(s.data);
            dataScadenza.setHours(0, 0, 0, 0);
            const diffGiorni = s.diffGiorni;

            let testoStato = "";
            let coloreBordo = "#cbd5e1";
            let coloreSfondo = "#f8fafc";
            let coloreTestoStato = "#1e293b";

            if (diffGiorni <= 7) {
                if (diffGiorni < 0) {
                    const giorniRitardo = Math.abs(diffGiorni);
                    testoStato = `Scaduta da ${giorniRitardo} ${giorniRitardo === 1 ? 'giorno' : 'giorni'}`;
                } else if (diffGiorni === 0) {
                    testoStato = "Scade oggi!";
                } else {
                    testoStato = `Mancano ${diffGiorni} giorni`;
                }
                coloreBordo = "#ef4444";
                coloreSfondo = "#fef2f2";
                coloreTestoStato = "#991b1b";
            } else if (diffGiorni >= 8 && diffGiorni <= 14) {
                testoStato = `Mancano ${diffGiorni} giorni`;
                coloreBordo = "#f97316";
                coloreSfondo = "#fff7ed";
                coloreTestoStato = "#c2410c";
            } else {
                testoStato = `Mancano ${diffGiorni} giorni`;
                coloreBordo = "#22c55e";
                coloreSfondo = "#f0fdf4";
                coloreTestoStato = "#15803d";
            }

            const dataFormatted = `${dataScadenza.getDate().toString().padStart(2, '0')}/${(dataScadenza.getMonth()+1).toString().padStart(2, '0')}/${dataScadenza.getFullYear()}`;

            htmlSummary += `
                <div style="background-color: ${coloreSfondo}; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border: 1px solid ${coloreBordo}40; border-left: 6px solid ${coloreBordo}; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                    <div>
                        <strong style="font-size: 1rem; color: #1e293b; display: block;">${escapeHtml(s.titolo)}</strong>
                        <span style="font-size: 0.85rem; color: #475569;">${dataFormatted} - <strong style="color: ${coloreTestoStato};">${testoStato}</strong></span>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 1.05rem; font-weight: 700; color: #0f172a;">€ ${Number(s.importo).toFixed(2)}</span>
                    </div>
                </div>
            `;
        });

        summaryScadenze.innerHTML = htmlSummary || `<p class="text-muted" style="font-style: italic; color: #64748b;">Nessuna scadenza inserita.</p>`;
    } catch (err) {
        console.error("Errore summary scadenze home:", err);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
