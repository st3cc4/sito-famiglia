import { 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../firebase-config.js";
import { isAdminCorrente } from "../auth.js";

const listaUtentiContainer = document.getElementById('lista-utenti');
const formNuovoUtente = document.getElementById('form-nuovo-utente');
const inputNomeUtente = document.getElementById('nuovo-utente-nome');
const inputColoreUtente = document.getElementById('nuovo-utente-colore');
const inputRuoloUtente = document.getElementById('nuovo-utente-ruolo');

if (formNuovoUtente) {
    formNuovoUtente.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userIsAdmin = typeof isAdminCorrente === 'function' ? isAdminCorrente() : Boolean(isAdminCorrente);
        if (!userIsAdmin) {
            alert("Solo l'amministratore può aggiungere nuovi utenti.");
            return;
        }

        const nome = inputNomeUtente.value.trim();
        const colore = inputColoreUtente.value;
        const ruolo = inputRuoloUtente.value;

        if (!nome) return;

        try {
            await setDoc(doc(db, "utenti", nome.toLowerCase()), {
                nome: nome,
                colore: colore,
                ruolo: ruolo
            });

            formNuovoUtente.reset();
            caricaUtenti();
        } catch (err) {
            console.error("Errore salvataggio utente:", err);
            alert("Errore nel salvataggio dell'utente.");
        }
    });
}

export async function caricaUtenti() {
    if (!listaUtentiContainer) return;

    try {
        const querySnapshot = await getDocs(collection(db, "utenti"));
        let htmlUtenti = "";
        const userIsAdmin = typeof isAdminCorrente === 'function' ? isAdminCorrente() : Boolean(isAdminCorrente);

        querySnapshot.forEach(docSnap => {
            const u = docSnap.data();
            const idUtente = docSnap.id;
            const nomeMostrato = u.nome || idUtente;
            const colore = u.colore || '#3b82f6';
            const ruolo = u.ruolo || 'membro';

            htmlUtenti += `
                <div class="utente-row-item" style="border-left: 5px solid ${colore};">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="width: 16px; height: 16px; border-radius: 50%; background-color: ${colore}; display: inline-block;"></span>
                        <strong style="font-size: 1.05rem; color: #1e293b;">${nomeMostrato}</strong>
                        <span style="font-size: 0.85rem; color: #64748b; background: #e2e8f0; padding: 2px 8px; border-radius: 4px;">${ruolo}</span>
                    </div>
                    ${userIsAdmin ? `
                        <button class="btn-elimina" style="font-size: 0.8rem; padding: 4px 8px;" onclick="eliminaUtente('${idUtente}')">&times;</button>
                    ` : ''}
                </div>
            `;
        });

        listaUtentiContainer.innerHTML = htmlUtenti || `<p class="text-muted">Nessun utente trovato.</p>`;

    } catch (err) {
        console.error("Errore caricaUtenti:", err);
    }
}

window.eliminaUtente = async function(idUtente) {
    const userIsAdmin = typeof isAdminCorrente === 'function' ? isAdminCorrente() : Boolean(isAdminCorrente);
    if (!userIsAdmin) {
        alert("Solo l'amministratore può eliminare gli utenti.");
        return;
    }

    if (confirm(`Vuoi eliminare l'utente ${idUtente}?`)) {
        try {
            await deleteDoc(doc(db, "utenti", idUtente));
            caricaUtenti();
        } catch (err) {
            console.error("Errore eliminazione utente:", err);
            alert("Errore durante l'eliminazione dell'utente.");
        }
    }
}
