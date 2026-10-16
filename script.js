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

// Funzione di supporto per popolare il riquadro Scadenze nella HOME con i colori a cascata
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

        let htmlSummary = "";
        scadenze.forEach((s) => {
            const dataScadenza = new Date(s.data);
            dataScadenza.setHours(0, 0, 0, 0);
            
            const diffTempo = dataScadenza - oggi;
            const diffGiorni = Math.round(diffTempo / (1000 * 60 * 60 * 24));

            let testoStato = "";
            let coloreBordo = "#cbd5e1";
            let coloreSfondo = "#ffffff";
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
                <div style="display: flex; justify-content: space-between; align-items: center; background-color: ${coloreSfondo}; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border-left: 6px solid ${coloreBordo}; border: 1px solid ${coloreBordo}40;">
                    <div>
                        <strong style="font-size: 1.05rem; color: #1e293b;">${s.titolo}</strong>
                        <span style="font-size: 0.9rem; color: #475569; margin-left: 8px;">(${dataFormatted} - <strong style="color: ${coloreTestoStato};">${testoStato}</strong>)</span>
                    </div>
                    <span style="font-size: 1rem; font-weight: 700; color: #0f172a;">€ ${Number(s.importo).toFixed(2)}</span>
                </div>
            `;
        });

        summaryScadenze.innerHTML = htmlSummary || `<p class="text-muted" style="font-style: italic;">Nessuna scadenza inserita.</p>`;
    } catch (err) {
        console.error("Errore summary scadenze home:", err);
    }
}
