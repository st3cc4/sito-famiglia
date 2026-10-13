import { 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { formatCapitalize, isAdminCorrente } from "./auth.js";

const utenteForm = document.getElementById('utente-form');
const userNameInput = document.getElementById('user-name-input');
const userPassInput = document.getElementById('user-pass-input');
const permScadenze = document.getElementById('perm-scadenze');
const permAppuntamenti = document.getElementById('perm-appuntamenti');
const permMedia = document.getElementById('perm-media');
const permRicette = document.getElementById('perm-ricette');
const listaUtenti = document.getElementById('lista-utenti');

export async function caricaUtentiAdmin() {
    if (!isAdminCorrente) return;
    try {
        const querySnapshot = await getDocs(collection(db, "utenti"));
        let utentiHtml = "";
        
        querySnapshot.forEach(docSnap => {
            const u = docSnap.data();
            const nomeId = docSnap.id;
            
            utentiHtml += `
                <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #e2e8f0;">
                    <div>
                        <strong>${nomeId}</strong> 
                        <span style="font-size: 0.85rem; color: #64748b; margin-left: 10px;">(Password: ${u.password || 'N/D'})</span>
                    </div>
                    ${nomeId.toLowerCase() !== 'paolo' ? `
                        <button class="btn-elimina" onclick="eliminaUtente('${nomeId}')" style="padding: 4px 8px; font-size: 0.8rem;">Elimina</button>
                    ` : '<span style="font-size: 0.8rem; color: #3b82f6; font-weight: bold;">Admin Principale</span>'}
                </li>
            `;
        });

        if (listaUtenti) {
            listaUtenti.innerHTML = utentiHtml || `<p class="text-muted">Nessun utente registrato.</p>`;
        }
    } catch (err) {
        console.error("Errore caricamento utenti:", err);
        if (listaUtenti) {
            listaUtenti.innerHTML = `<p class="text-muted">Errore nel caricamento degli utenti.</p>`;
        }
    }
}

if (utenteForm) {
    utenteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = formatCapitalize(userNameInput.value.trim());
        const password = userPassInput.value.trim();

        if (!nome || !password) {
            alert("Inserisci nome utente e password.");
            return;
        }

        const permessi = {
            scadenze: permScadenze ? permScadenze.checked : true,
            appuntamenti: permAppuntamenti ? permAppuntamenti.checked : true,
            media: permMedia ? permMedia.checked : true,
            ricette: permRicette ? permRicette.checked : true
        };

        try {
            await setDoc(doc(db, "utenti", nome), {
                nome: nome,
                password: password,
                permessi: permessi,
                colore: '#3b82f6'
            }, { merge: true });

            alert(`Utente ${nome} salvato con successo!`);
            utenteForm.reset();
            caricaUtentiAdmin();
        } catch (err) {
            console.error("Errore salvataggio utente:", err);
            alert("Errore durante il salvataggio dell'utente.");
        }
    });
}

window.eliminaUtente = async function(nomeUtente) {
    if (confirm(`Vuoi davvero eliminare l'utente ${nomeUtente}?`)) {
        try {
            await deleteDoc(doc(db, "utenti", nomeUtente));
            caricaUtentiAdmin();
        } catch (err) {
            alert("Errore durante l'eliminazione dell'utente.");
        }
    }
}
