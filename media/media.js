import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    deleteDoc, 
    updateDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../firebase-config.js";
import { nomeUtenteCorrente, isAdminCorrente } from "../auth.js";

const btnApriModalMedia = document.getElementById('btn-apri-modal-media');
const btnChiudiModalMedia = document.getElementById('btn-chiudi-modal-media');
const modalMedia = document.getElementById('modal-media');
const modalMediaTitle = document.getElementById('modal-media-title');
const mediaForm = document.getElementById('media-form');
const mediaIdInput = document.getElementById('media-id');
const mediaTitoloInput = document.getElementById('media-titolo');
const mediaTipoInput = document.getElementById('media-tipo');
const mediaStatoInput = document.getElementById('media-stato');
const mediaVotoInput = document.getElementById('media-voto');
const listaMedia = document.getElementById('lista-media');
const summaryMedia = document.getElementById('home-summary-media');

if (btnApriModalMedia) {
    btnApriModalMedia.addEventListener('click', () => {
        modalMediaTitle.textContent = "Nuovo Elemento Media";
        mediaForm.reset();
        mediaIdInput.value = "";
        modalMedia.style.display = 'flex';
    });
}

if (btnChiudiModalMedia) {
    btnChiudiModalMedia.addEventListener('click', () => {
        modalMedia.style.display = 'none';
    });
}

if (mediaForm) {
    mediaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titolo = mediaTitoloInput.value.trim();
        const tipo = mediaTipoInput.value;
        const stato = mediaStatoInput.value;
        const voto = parseInt(mediaVotoInput.value) || 0;
        const editId = mediaIdInput.value;

        const datiMedia = {
            titolo,
            tipo,
            stato,
            voto,
            creatore: nomeUtenteCorrente || "Famiglia",
            dataCreazione: new Date().toISOString()
        };

        try {
            if (editId) {
                await updateDoc(doc(db, "media", editId), datiMedia);
            } else {
                await addDoc(collection(db, "media"), datiMedia);
            }
            modalMedia.style.display = 'none';
            mediaForm.reset();
            caricaMedia();
        } catch (err) {
            console.error("Errore salvataggio media:", err);
            alert("Errore nel salvataggio dell'elemento.");
        }
    });
}

export async function caricaMedia() {
    try {
        const querySnapshot = await getDocs(collection(db, "media"));
        let elementiMedia = [];
        querySnapshot.forEach(docSnap => {
            elementiMedia.push({ id: docSnap.id, ...docSnap.data() });
        });

        let mappaColoriUtenti = {};
        try {
            const utentiSnap = await getDocs(collection(db, "utenti"));
            utentiSnap.forEach(uDoc => {
                const uData = uDoc.data();
                mappaColoriUtenti[uDoc.id.toLowerCase()] = uData.colore || '#3b82f6';
            });
        } catch(e) {}

        // 1. Popolamento Home Summary Media: Mostra solo l'ULTIMO elemento caricato
        if (summaryMedia) {
            // Ordiniamo per dataCreazione decrescente (o per ID se manca la data)
            elementiMedia.sort((a, b) => {
                const dataA = a.dataCreazione || "";
                const dataB = b.dataCreazione || "";
                return dataB.localeCompare(dataA);
            });

            let htmlSummary = "";
            if (elementiMedia.length > 0) {
                const m = elementiMedia[0]; // Prende il primo (l'ultimo inserito)
                const creatore = m.creatore || 'Famiglia';
                const coloreUser = mappaColoriUtenti[creatore.toLowerCase()] || '#3b82f6';

                htmlSummary = `
                    <div style="display: flex; justify-content: space-between; align-items: center; background-color: ${coloreUser}15; padding: 12px 16px; border-radius: 8px; border-left: 6px solid ${coloreUser}; border: 1px solid ${coloreUser}40;">
                        <div>
                            <strong style="font-size: 1.1rem; color: #1e293b; display: block;">${m.titolo}</strong>
                            <span style="font-size: 0.95rem; color: #64748b;">Tipo: <strong>${m.tipo}</strong> | Stato: <strong>${m.stato}</strong> | Voto: <strong>${m.voto}/10</strong></span>
                        </div>
                        <span style="font-size: 0.9rem; font-weight: 700; color: #ffffff; background-color: ${coloreUser}; padding: 4px 12px; border-radius: 6px;">${creatore}</span>
                    </div>
                `;
            }
            summaryMedia.innerHTML = htmlSummary || `<p class="text-muted">Nessun elemento media registrato.</p>`;
        }

        // 2. Popolamento Sezione Media Completa
        if (listaMedia) {
            let htmlMedia = "";
            elementiMedia.sort((a, b) => a.titolo.localeCompare(b.titolo));

            elementiMedia.forEach(m => {
                const creatore = m.creatore || 'Famiglia';
                const coloreUser = mappaColoriUtenti[creatore.toLowerCase()] || '#3b82f6';
                const userIsAdmin = typeof isAdminCorrente === 'function' ? isAdminCorrente() : Boolean(isAdminCorrente);
                const puoModificare = userIsAdmin || (creatore.toLowerCase() === (nomeUtenteCorrente || "").toLowerCase());

                htmlMedia += `
                    <div class="media-card-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #ffffff; margin-bottom: 8px; border-radius: 8px; border-left: 5px solid ${coloreUser}; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                        <div>
                            <strong style="font-size: 1.05rem; color: #1e293b; display: block;">${m.titolo}</strong>
                            <span style="font-size: 0.9rem; color: #64748b;">Tipo: <strong>${m.tipo}</strong> | Stato: <strong>${m.stato}</strong> | Voto: <strong>${m.voto}/10</strong></span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 0.85rem; font-weight: 700; color: #ffffff; background-color: ${coloreUser}; padding: 4px 10px; border-radius: 6px;">${creatore}</span>
                            ${puoModificare ? `
                                <button class="btn-modifica" style="font-size: 0.8rem; padding: 4px 8px;" onclick="modificaMedia('${m.id}')">Mod.</button>
                                <button class="btn-elimina" style="font-size: 0.8rem; padding: 4px 8px;" onclick="eliminaMedia('${m.id}')">&times;</button>
                            ` : ''}
                        </div>
                    </div>
                `;
            });

            listaMedia.innerHTML = htmlMedia || `<p class="text-muted">Nessun elemento presente.</p>`;
        }

    } catch (err) {
        console.error("Errore caricaMedia:", err);
    }
}

window.modificaMedia = async function(id) {
    try {
        const docSnap = await getDoc(doc(db, "media", id));
        if (docSnap.exists()) {
            const m = docSnap.data();
            modalMediaTitle.textContent = "Modifica Media";
            mediaIdInput.value = id;
            mediaTitoloInput.value = m.titolo || "";
            mediaTipoInput.value = m.tipo || "Film";
            mediaStatoInput.value = m.stato || "Da vedere";
            mediaVotoInput.value = m.voto || 0;
            modalMedia.style.display = 'flex';
        }
    } catch (err) {
        alert("Errore nel recupero dell'elemento.");
    }
}

window.eliminaMedia = async function(id) {
    if (confirm("Vuoi eliminare questo elemento?")) {
        try {
            await deleteDoc(doc(db, "media", id));
            caricaMedia();
        } catch (err) {
            alert("Errore nell'eliminazione.");
        }
    }
}
