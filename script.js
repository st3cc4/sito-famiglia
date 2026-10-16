import { inizializzaAuth } from "./auth.js";
import { caricaScadenze } from "./scadenze/scadenze.js";
import { caricaAppuntamenti } from "./impegni/impegni.js";
import { caricaMedia } from "./media/media.js";
import { caricaRicette } from "./ricette/ricette.js";
import { caricaUtenti } from "./utenti/utenti.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", async () => {
    await inizializzaAuth();

    caricaScadenze();
    caricaAppuntamenti();
    caricaMedia();
    caricaRicette();
    caricaUtenti();
    caricaSummaryScadenzeHome();
    caricaSummaryImpegniHome();
    caricaSummaryMediaHome();
    caricaSummaryRicetteHome();

    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const sidebar = document.getElementById('sidebar');

    if (btnToggleSidebar && sidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('closed');
            sidebar.classList.toggle('open');
        });
    }

    const navButtons = document.querySelectorAll('.nav-btn, .clickable-card');
    const sections = document.querySelectorAll('.section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            if (!targetId) return;

            sections.forEach(sec => sec.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            const matchingNavBtn = document.querySelector(`.nav-btn[data-target="${targetId}"]`);
            if (matchingNavBtn) {
                matchingNavBtn.classList.add('active');
            }

            if (window.innerWidth <= 768 && sidebar) {
                sidebar.classList.add('closed');
                sidebar.classList.remove('open');
            }

            if (targetId === 'scadenze-section') {
                caricaScadenze();
                caricaSummaryScadenzeHome();
            } else if (targetId === 'impegni-section') {
                caricaAppuntamenti();
                caricaSummaryImpegniHome();
            } else if (targetId === 'media-section') {
                caricaMedia();
                caricaSummaryMediaHome();
            } else if (targetId === 'ricette-section') {
                caricaRicette();
                caricaSummaryRicetteHome();
            } else if (targetId === 'utenti-section') {
                caricaUtenti();
            }
        });
    });
});

// 1. SCADENZE HOME
async function caricaSummaryScadenzeHome() {
    const summaryScadenze = document.getElementById('home-summary-scadenze');
    if (!summaryScadenze) return;

    try {
        const querySnapshot = await getDocs(collection(db, "scadenze"));
        let scadenze = [];
        querySnapshot.forEach((docSnap) => {
            scadenze.push({ id: docSnap.id, ...docSnap.data() });
        });

        scadenze.sort((a, b) => new Date(a.data) - new Date(b.data));

        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);

        let fasce = { urgenti: [], medie: [], future: [] };

        scadenze.forEach((s) => {
            const dataScadenza = new Date(s.data);
            dataScadenza.setHours(0, 0, 0, 0);
            const diffTempo = dataScadenza - oggi;
            const diffGiorni = Math.round(diffTempo / (1000 * 60 * 60 * 24));
            s.diffGiorni = diffGiorni;

            if (diffGiorni <= 7) fasce.urgenti.push(s);
            else if (diffGiorni >= 8 && diffGiorni <= 14) fasce.medie.push(s);
            else fasce.future.push(s);
        });

        let scadenzeDaMostrare = fasce.urgenti.length > 0 ? fasce.urgenti : (fasce.medie.length > 0 ? fasce.medie : fasce.future);

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
                testoStrato = `Mancano ${diffGiorni} giorni`;
                testoStato = `Mancano ${diffGiorni} giorni`;
                coloreBordo = "#22c55e";
                coloreSfondo = "#f0fdf4";
                coloreTestoStato = "#15803d";
            }

            const dataFormatted = `${dataScadenza.getDate().toString().padStart(2, '0')}/${(dataScadenza.getMonth()+1).toString().padStart(2, '0')}/${dataScadenza.getFullYear()}`;

            htmlSummary += `
                <div style="background-color: ${coloreSfondo}; padding: 12px 16px; border-radius: 8px; margin-bottom: 10px; border: 1px solid ${coloreBordo}40; border-left: 6px solid ${coloreBordo}; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <div>
                        <strong style="font-size: 1.05rem; color: #1e293b; display: block; margin-bottom: 2px;">${escapeHtml(s.titolo)}</strong>
                        <div style="font-size: 0.9rem; color: #475569;">${dataFormatted} - <strong style="color: ${coloreTestoStato};">${testoStato}</strong></div>
                    </div>
                    <div style="text-align: right; white-space: nowrap;">
                        <span style="font-size: 1.1rem; font-weight: 700; color: #0f172a;">€ ${Number(s.importo).toFixed(2)}</span>
                    </div>
                </div>
            `;
        });

        summaryScadenze.innerHTML = htmlSummary || `<p class="text-muted" style="font-style: italic; color: #64748b;">Nessuna scadenza inserita.</p>`;
    } catch (err) {
        console.error("Errore summary scadenze home:", err);
    }
}

// 2. IMPEGNI HOME (corretto con confronto stringhe data)
window.caricaSummaryImpegniHome = async function() {
    const summaryImpegni = document.getElementById('home-summary-impegni');
    if (!summaryImpegni) return;

    try {
        const querySnapshot = await getDocs(collection(db, "appuntamenti"));
        let impegni = [];
        querySnapshot.forEach((docSnap) => {
            impegni.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Ordinamento sicuro per data e ora
        impegni.sort((a, b) => (a.data + (a.ora || '00:00')).localeCompare(b.data + (b.ora || '00:00')));

        // Data odierna in formato YYYY-MM-DD locale
        const oraLocale = new Date();
        const anno = oraLocale.getFullYear();
        const mese = String(oraLocale.getMonth() + 1).padStart(2, '0');
        const giorno = String(oraLocale.getDate()).padStart(2, '0');
        const oggiStr = `${anno}-${mese}-${giorno}`;

        // Filtriamo gli impegni da oggi in poi
        let impegniFiltrati = impegni.filter(i => i.data >= oggiStr);

        let htmlSummary = "";
        impegniFiltrati.forEach((i) => {
            const parti = i.data.split('-');
            const dataFormatted = parti.length === 3 ? `${parti[2]}/${parti[1]}/${parti[0]}` : i.data;
            const creatoreNome = i.creatore || i.utente || '';

            htmlSummary += `
                <div style="background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e2e8f0; border-left: 6px solid #3b82f6; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <div>
                        <strong style="font-size: 1.05rem; color: #1e293b; display: block; margin-bottom: 2px;">${escapeHtml(i.titolo)}</strong>
                        <div style="font-size: 0.9rem; color: #475569;">Data: ${dataFormatted} | Orario: ${escapeHtml(i.ora || '00:00')}</div>
                    </div>
                    ${creatoreNome ? `<span style="font-size: 0.9rem; font-weight: 600; color: #334155;">${escapeHtml(creatoreNome)}</span>` : ''}
                </div>
            `;
        });

        summaryImpegni.innerHTML = htmlSummary || `<p class="text-muted" style="font-style: italic; color: #64748b;">Nessun impegno in programma.</p>`;
    } catch (err) {
        console.error("Errore summary impegni home:", err);
    }
}

// 3. FOTO E VIDEO HOME
async function caricaSummaryMediaHome() {
    const summaryMedia = document.getElementById('home-summary-media');
    if (!summaryMedia) return;

    try {
        const querySnapshot = await getDocs(collection(db, "media"));
        let mediaItems = [];
        querySnapshot.forEach((docSnap) => {
            mediaItems.push({ id: docSnap.id, ...docSnap.data() });
        });

        let htmlSummary = "";
        mediaItems.slice(0, 3).forEach((item) => {
            htmlSummary += `
                <div style="background-color: #f8fafc; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                    <strong style="font-size: 0.95rem; color: #1e293b;">${escapeHtml(item.titolo || 'Media')}</strong>
                    <span style="font-size: 0.85rem; color: #64748b;">${escapeHtml(item.creatore || '')}</span>
                </div>
            `;
        });

        summaryMedia.innerHTML = htmlSummary || `<p class="text-muted" style="font-style: italic; color: #64748b;">Nessun elemento media registrato.</p>`;
    } catch (err) {
        console.error("Errore summary media home:", err);
    }
}

// 4. RICETTE HOME
async function caricaSummaryRicetteHome() {
    const summaryRicette = document.getElementById('home-summary-ricette');
    if (!summaryRicette) return;

    try {
        const querySnapshot = await getDocs(collection(db, "ricette"));
        let ricette = [];
        querySnapshot.forEach((docSnap) => {
            ricette.push({ id: docSnap.id, ...docSnap.data() });
        });

        let htmlSummary = "";
        ricette.slice(0, 3).forEach((r) => {
            htmlSummary += `
                <div style="background-color: #f8fafc; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                    <strong style="font-size: 0.95rem; color: #1e293b;">${escapeHtml(r.nome || r.titolo || 'Ricetta')}</strong>
                    <span style="font-size: 0.85rem; color: #64748b;">${escapeHtml(r.creatore || '')}</span>
                </div>
            `;
        });

        summaryRicette.innerHTML = htmlSummary || `<p class="text-muted" style="font-style: italic; color: #64748b;">Nessuna ricetta inserita.</p>`;
    } catch (err) {
        console.error("Errore summary ricette home:", err);
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
