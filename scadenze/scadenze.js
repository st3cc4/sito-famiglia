import { 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../firebase-config.js";
import { isAdminCorrente } from "../auth.js";

let idScadenzaInModifica = null;

export async function caricaScadenze() {
    const listaScadenze = document.getElementById('lista-scadenze');
    const totaleGenerale = document.getElementById('totale-generale-scadenze');
    const summaryHome = document.getElementById('home-summary-scadenze');

    if (!listaScadenze) return;

    try {
        const querySnapshot = await getDocs(collection(db, "scadenze"));
        let scadenze = [];
        let totale = 0;

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            scadenze.push({
                id: docSnap.id,
                ...data
            });
        });

        // Ordina le scadenze per data crescente
        scadenze.sort((a, b) => new Date(a.data) - new Date(b.data));

        listaScadenze.innerHTML = '';
        if (summaryHome) summaryHome.innerHTML = '';

        if (scadenze.length === 0) {
            listaScadenze.innerHTML = '<li class="text-muted" style="padding: 10px;">Nessuna scadenza presente.</li>';
            if (summaryHome) summaryHome.innerHTML = '<p class="text-muted">Nessuna scadenza da saldare.</p>';
            if (totaleGenerale) totaleGenerale.textContent = 'Totale da pagare: € 0.00';
            return;
        }

        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);

        scadenze.forEach((s) => {
            const importoVal = parseFloat(s.importo) || 0;
            totale += importoVal;

            const dataScadenza = new Date(s.data);
            dataScadenza.setHours(0, 0, 0, 0);

            // Calcolo giorni di differenza
            const diffTempo = dataScadenza.getTime() - oggi.getTime();
            const diffGiorni = Math.ceil(diffTempo / (1000 * 3600 * 24));

            let classeColore = 'scadenza-verde';
            let classeMancano = 'mancano-verde';
            let testoMancano = '';

            if (diffGiorni < 0) {
                classeColore = 'scadenza-rossa';
                classeMancano = 'mancano-rosso';
                testoMancano = `Scaduta da ${Math.abs(diffGiorni)} giorn${Math.abs(diffGiorni) === 1 ? 'o' : 'i'}`;
            } else if (diffGiorni === 0) {
                classeColore = 'scadenza-rossa';
                classeMancano = 'mancano-rosso';
                testoMancano = 'Scade oggi!';
            } else if (diffGiorni <= 7) {
                classeColore = 'scadenza-rossa';
                classeMancano = 'mancano-rosso';
                testoMancano = `Mancano ${diffGiorni} giorn${diffGiorni === 1 ? 'o' : 'i'}`;
            } else if (diffGiorni <= 14) {
                classeColore = 'scadenza-arancione';
                classeMancano = 'mancano-arancione';
                testoMancano = `Mancano ${diffGiorni} giorni`;
            } else {
                classeColore = 'scadenza-verde';
                classeMancano = 'mancano-verde';
                testoMancano = `Mancano ${diffGiorni} giorni`;
            }

            // Formattazione data GG/MM/AAAA
            const dataFormattata = dataScadenza.toLocaleDateString('it-IT');

            // 1. Creazione elemento della lista Scadenze
            const li = document.createElement('li');
            li.className = `scadenza-item ${classeColore}`;

            li.innerHTML = `
                <div class="scadenza-info">
                    <span class="scadenza-titolo">${escapeHtml(s.titolo)}</span>
                    <span class="scadenza-data">${dataFormattata}</span>
                    <span class="scadenza-mancano ${classeMancano}">- ${testoMancano}</span>
                </div>
                <div class="scadenza-azioni">
                    <span class="scadenza-importo">€ ${importoVal.toFixed(2)}</span>
                    <button class="btn-segna-pagata" data-id="${s.id}">Segna Pagata</button>
                    <button class="btn-modifica-scadenza" data-id="${s.id}">Mod.</button>
                    <button class="btn-elimina-scadenza" data-id="${s.id}" title="Elimina">🗑️</button>
                </div>
            `;

            listaScadenze.appendChild(li);

            // 2. Aggiunta alla vista di riepilogo della HOME (se visibile)
            if (summaryHome) {
                const homeRow = document.createElement('div');
                homeRow.className = `scadenza-item ${classeColore}`;
                homeRow.style.marginBottom = '8px';
                homeRow.style.padding = '12px 16px';
                homeRow.innerHTML = `
                    <div class="scadenza-info">
                        <span class="scadenza-titolo">${escapeHtml(s.titolo)}</span>
                        <span class="scadenza-data">(${dataFormattata})</span>
                        <span class="scadenza-mancano ${classeMancano}">- ${testoMancano}</span>
                    </div>
                    <span class="scadenza-importo" style="margin-right:0;">€ ${importoVal.toFixed(2)}</span>
                `;
                summaryHome.appendChild(homeRow);
            }
        });

        if (totaleGenerale) {
            totaleGenerale.textContent = `Totale da pagare: € ${totale.toFixed(2)}`;
        }

        // Collegamento eventi ai pulsanti
        collegaEventiScadenze();

    } catch (err) {
        console.error("Errore nel caricamento delle scadenze:", err);
    }
}

function collegaEventiScadenze() {
    // Gestione pulsante "Segna Pagata"
    document.querySelectorAll('.btn-segna-pagata').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (confirm("Confermi di voler segnare questa scadenza come pagata? Verrà rimossa dall'elenco.")) {
                try {
                    await deleteDoc(doc(db, "scadenze", id));
                    await caricaScadenze();
                } catch (err) {
                    console.error("Errore durante la cancellazione:", err);
                    alert("Errore nell'operazione.");
                }
            }
        });
    });

    // Gestione pulsante "Modifica"
    document.querySelectorAll('.btn-modifica-scadenza').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            idScadenzaInModifica = id;

            try {
                const querySnapshot = await getDocs(collection(db, "scadenze"));
                querySnapshot.forEach((docSnap) => {
                    if (docSnap.id === id) {
                        const data = docSnap.data();
                        document.getElementById('titolo').value = data.titolo || '';
                        document.getElementById('data').value = data.data || '';
                        document.getElementById('importo').value = data.importo || '';
                        document.getElementById('modal-title').textContent = 'Modifica Scadenza';
                        document.getElementById('modal-scadenza').style.display = 'flex';
                    }
                });
            } catch (err) {
                console.error("Errore durante il recupero per modifica:", err);
            }
        });
    });

    // Gestione pulsante "Elimina" (Cestino)
    document.querySelectorAll('.btn-elimina-scadenza').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (confirm("Vuoi eliminare definitivamente questa scadenza?")) {
                try {
                    await deleteDoc(doc(db, "scadenze", id));
                    await caricaScadenze();
                } catch (err) {
                    console.error("Errore durante l'eliminazione:", err);
                    alert("Errore nell'eliminazione.");
                }
            }
        });
    });
}

// Gestione Modale per Nuova/Modifica Scadenza
document.addEventListener('DOMContentLoaded', () => {
    const btnApriModal = document.getElementById('btn-apri-modal');
    const btnChiudiModal = document.getElementById('btn-chiudi-modal');
    const modalScadenza = document.getElementById('modal-scadenza');
    const scadenzaForm = document.getElementById('scadenza-form');

    if (btnApriModal && modalScadenza) {
        btnApriModal.addEventListener('click', () => {
            idScadenzaInModifica = null;
            if (scadenzaForm) scadenzaForm.reset();
            document.getElementById('modal-title').textContent = 'Nuova Scadenza';
            modalScadenza.style.display = 'flex';
        });
    }

    if (btnChiudiModal && modalScadenza) {
        btnChiudiModal.addEventListener('click', () => {
            modalScadenza.style.display = 'none';
        });
    }

    if (scadenzaForm) {
        scadenzaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titolo = document.getElementById('titolo').value.trim();
            const data = document.getElementById('data').value;
            const importo = parseFloat(document.getElementById('importo').value) || 0;

            if (!titolo || !data) return;

            try {
                if (idScadenzaInModifica) {
                    const docRef = doc(db, "scadenze", idScadenzaInModifica);
                    await updateDoc(docRef, { titolo, data, importo });
                } else {
                    await addDoc(collection(db, "scadenze"), { titolo, data, importo });
                }

                modalScadenza.style.display = 'none';
                scadenzaForm.reset();
                idScadenzaInModifica = null;
                await caricaScadenze();

            } catch (err) {
                console.error("Errore durante il salvataggio della scadenza:", err);
                alert("Errore nel salvataggio.");
            }
        });
    }
});

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
