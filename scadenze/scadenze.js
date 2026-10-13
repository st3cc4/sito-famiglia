import { 
    collection, 
    getDocs, 
    deleteDoc, 
    doc, 
    updateDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const btnApriModal = document.getElementById('btn-apri-modal');
const btnChiudiModal = document.getElementById('btn-chiudi-modal');
const modalScadenza = document.getElementById('modal-scadenza');
const modalTitle = document.getElementById('modal-title');
const scadenzaForm = document.getElementById('scadenza-form');
const titoloInput = document.getElementById('titolo');
const dataInput = document.getElementById('data');
const importoInput = document.getElementById('importo');
const listaScadenze = document.getElementById('lista-scadenze');
const totaleGeneraleEl = document.getElementById('totale-generale-scadenze');
const summaryScadenze = document.getElementById('home-summary-scadenze');

let scadenzaInModificaId = null;

if (btnApriModal) {
    btnApriModal.addEventListener('click', () => {
        modalTitle.textContent = "Nuova Scadenza";
        scadenzaForm.reset();
        scadenzaInModificaId = null;
        modalScadenza.style.display = 'flex';
    });
}

if (btnChiudiModal) {
    btnChiudiModal.addEventListener('click', () => {
        modalScadenza.style.display = 'none';
    });
}

export async function caricaScadenze() {
    try {
        const querySnapshot = await getDocs(collection(db, "scadenze"));
        let scadenze = [];
        querySnapshot.forEach(docSnap => {
            scadenze.push({ id: docSnap.id, ...docSnap.data() });
        });

        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);

        // 1. Popolamento Home Summary con le tue regole di fasce
        if (summaryScadenze) {
            const daPagare = scadenze.filter(s => !s.pagato);

            // Fascia 1: <= 7 giorni (o già scadute)
            let fascia1 = daPagare.filter(s => {
                const diffDias = Math.ceil((new Date(s.data) - oggi) / (1000 * 60 * 60 * 24));
                return diffDias <= 7;
            });

            let scadenzeDaMostrare = [];
            let coloreBordo = "#ef4444"; // Rosso
            let coloreSfondo = "#fef2f2";

            if (fascia1.length > 0) {
                scadenzeDaMostrare = fascia1;
            } else {
                // Fascia 2: tra 8 e 14 giorni
                let fascia2 = daPagare.filter(s => {
                    const diffDias = Math.ceil((new Date(s.data) - oggi) / (1000 * 60 * 60 * 24));
                    return diffDias >= 8 && diffDias <= 14;
                });

                if (fascia2.length > 0) {
                    scadenzeDaMostrare = fascia2;
                    coloreBordo = "#f59e0b"; // Arancione
                    coloreSfondo = "#fffbeb";
                } else {
                    // Fascia 3: superiori a 15 giorni
                    let fascia3 = daPagare.filter(s => {
                        const diffDias = Math.ceil((new Date(s.data) - oggi) / (1000 * 60 * 60 * 24));
                        return diffDias >= 15;
                    });
                    scadenzeDaMostrare = fascia3;
                    coloreBordo = "#3b82f6"; // Blu standard
                    coloreSfondo = "#eff6ff";
                }
            }

            scadenzeDaMostrare.sort((a, b) => a.data.localeCompare(b.data));

            let htmlSummary = "";
            scadenzeDaMostrare.slice(0, 3).forEach(s => {
                const [yyyy, mm, dd] = s.data.split('-');
                const dataFormattata = `${dd}/${mm}/${yyyy}`;
                const diffGiorni = Math.ceil((new Date(s.data) - oggi) / (1000 * 60 * 60 * 24));
                
                let infoGiorni = "";
                if (diffGiorni < 0) infoGiorni = `Scaduta da ${Math.abs(diffGiorni)} giorni`;
                else if (diffGiorni === 0) infoGiorni = `Scade Oggi!`;
                else infoGiorni = `Mancano ${diffGiorni} giorni`;

                htmlSummary += `
                    <div style="display: flex; justify-content: space-between; align-items: center; background-color: ${coloreSfondo}; padding: 10px 14px; border-radius: 8px; margin-bottom: 8px; border-left: 5px solid ${coloreBordo};">
                        <div>
                            <strong style="font-size: 1.05rem; color: #1e293b;">${s.titolo}</strong>
                            <span style="font-size: 0.95rem; color: #475569; margin-left: 8px;">(${dataFormattata}) - ${infoGiorni}</span>
                        </div>
                        <strong style="font-size: 1.1rem; color: #1e293b;">€ ${s.importo.toFixed(2)}</strong>
                    </div>
                `;
            });

            summaryScadenze.innerHTML = htmlSummary || `<p class="text-muted">Nessuna scadenza in arrivo.</p>`;
        }

        // 2. Popolamento Sezione Scadenze completa
        if (listaScadenze) {
            let htmlScadenze = "";
            let totaleDaPagare = 0;
            scadenze.sort((a, b) => a.data.localeCompare(b.data));

            scadenze.forEach(s => {
                if (!s.pagato) totaleDaPagare += s.importo;
                const [yyyy, mm, dd] = s.data.split('-');
                const dataFormattata = `${dd}/${mm}/${yyyy}`;

                htmlScadenze += `
                    <li class="badge-item ${s.pagato ? 'pagato' : ''}" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: white; margin-bottom: 8px; border-radius: 8px; border-left: 5px solid ${s.pagato ? '#22c55e' : '#ef4444'};">
                        <div>
                            <strong style="font-size: 1.05rem;">${s.titolo}</strong>
                            <span style="font-size: 0.9rem; color: #64748b; margin-left: 10px;">${dataFormattata}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <strong style="font-size: 1.1rem;">€ ${s.importo.toFixed(2)}</strong>
                            <button class="btn-secondary" style="font-size: 0.8rem; padding: 4px 8px;" onclick="toggleStatoPagamento('${s.id}', ${s.pagato})">${s.pagato ? 'Segna Da Pagare' : 'Segna Pagata'}</button>
                            <button class="btn-modifica" style="font-size: 0.8rem; padding: 4px 8px;" onclick="modificaScadenza('${s.id}')">Mod.</button>
                            <button class="btn-elimina" style="font-size: 0.8rem; padding: 4px 8px;" onclick="eliminaScadenza('${s.id}')">&times;</button>
                        </div>
                    </li>
                `;
            });

            listaScadenze.innerHTML = htmlScadenze || `<p class="text-muted">Nessuna scadenza inserita.</p>`;
            if (totaleGeneraleEl) totaleGeneraleEl.textContent = `Totale da pagare: € ${totaleDaPagare.toFixed(2)}`;
        }

    } catch (err) {
        console.error("Errore caricaScadenze:", err);
    }
}

window.toggleStatoPagamento = async function(id, statoAttuale) {
    await updateDoc(doc(db, "scadenze", id), { pagato: !statoAttuale });
    caricaScadenze();
}

window.modificaScadenza = async function(id) {
    const docSnap = await getDoc(doc(db, "scadenze", id));
    if (docSnap.exists()) {
        const s = docSnap.data();
        modalTitle.textContent = "Modifica Scadenza";
        scadenzaInModificaId = id;
        titoloInput.value = s.titolo || "";
        dataInput.value = s.data || "";
        importoInput.value = s.importo || "";
        modalScadenza.style.display = 'flex';
    }
}

window.eliminaScadenza = async function(id) {
    if (confirm("Vuoi eliminare questa scadenza?")) {
        await deleteDoc(doc(db, "scadenze", id));
        caricaScadenze();
    }
}
