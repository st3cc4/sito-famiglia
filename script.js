import { 
    collection, 
    getDocs, 
    deleteDoc, 
    doc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { 
    impostaCallbackAvvio, 
    controllaSessioneSalvata, 
    attivaInterfacciaUtente, 
    formatCapitalize 
} from "./auth.js";
import { caricaScadenze } from "./scadenze.js";
import { caricaAppuntamenti } from "./appuntamenti.js";
import { caricaRicette } from "./ricette.js";

// --- GESTIONE INTERFACCIA E NAVIGAZIONE ---
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const navButtons = document.querySelectorAll('.nav-btn');
const pageSections = document.querySelectorAll('.page-section');

const headerIcon = document.getElementById('header-icon');
const headerSectionName = document.getElementById('header-section-name');
const btnTopBackHome = document.getElementById('btn-top-back-home');

toggleSidebarBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));

function mostraSezione(targetId) {
    pageSections.forEach(sec => sec.classList.remove('active'));
    navButtons.forEach(btn => btn.classList.remove('active'));

    const activeSec = document.getElementById(targetId);
    if (activeSec) activeSec.classList.add('active');

    const activeBtn = document.querySelector(`.nav-btn[data-target="${targetId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Mantiene costante la struttura dell'header in qualsiasi pagina
    if (targetId === 'sec-home') {
        headerIcon.style.display = 'inline-block';
        headerIcon.innerHTML = '🏠';
        headerSectionName.style.display = 'inline-block';
        headerSectionName.textContent = 'Home';
        btnTopBackHome.style.display = 'none';
    } else {
        btnTopBackHome.style.display = 'inline-block';
        if (targetId === 'sec-scadenze') {
            headerIcon.style.display = 'inline-block';
            headerIcon.innerHTML = `<img src="icon/icona-scadenze.png" alt="Scadenze" class="header-icon">`;
            headerSectionName.style.display = 'inline-block';
            headerSectionName.textContent = 'Scadenze';
        } else if (targetId === 'sec-appuntamenti') {
            headerIcon.style.display = 'inline-block';
            headerIcon.innerHTML = `<img src="icon/icona-impegni.png" alt="Appuntamenti" class="header-icon">`;
            headerSectionName.style.display = 'inline-block';
            headerSectionName.textContent = 'Appuntamenti';
        } else if (targetId === 'sec-media') {
            headerIcon.style.display = 'inline-block';
            headerIcon.innerHTML = `<img src="icon/icona-media.png" alt="Media" class="header-icon">`;
            headerSectionName.style.display = 'inline-block';
            headerSectionName.textContent = 'Media';
        } else if (targetId === 'sec-ricette') {
            headerIcon.style.display = 'inline-block';
            headerIcon.innerHTML = `<img src="icon/icona-ricette.png" alt="Ricette" class="header-icon">`;
            headerSectionName.style.display = 'inline-block';
            headerSectionName.textContent = 'Ricette';
        } else if (targetId === 'sec-utenti') {
            headerIcon.style.display = 'inline-block';
            headerIcon.innerHTML = '⚙️';
            headerSectionName.style.display = 'inline-block';
            headerSectionName.textContent = 'Gestione Utenti';
        }
    }
}

navButtons.forEach(btn => btn.addEventListener('click', () => mostraSezione(btn.dataset.target)));
document.querySelectorAll('.btn-back-home').forEach(btn => {
    btn.addEventListener('click', () => mostraSezione(btn.dataset.target));
});

document.querySelectorAll('.card-cliccabile').forEach(card => {
    card.addEventListener('click', () => {
        const targetId = card.dataset.target;
        if (targetId) mostraSezione(targetId);
    });
});

// --- CHIUSURA MODALI GENERALE ---
document.getElementById('btn-chiudi-modal').addEventListener('click', () => {
    document.getElementById('modal-scadenza').style.display = 'none';
});

document.getElementById('btn-chiudi-modal-appuntamento').addEventListener('click', () => {
    document.getElementById('modal-appuntamento').style.display = 'none';
});

document.getElementById('btn-apri-modal').addEventListener('click', () => {
    document.getElementById('modal-title').textContent = "Nuova Scadenza";
    const scadenzaForm = document.getElementById('scadenza-form');
    scadenzaForm.reset();
    delete scadenzaForm.dataset.editId;
    document.getElementById('modal-scadenza').style.display = 'flex';
});

document.getElementById('btn-apri-modal-appuntamento').addEventListener('click', () => {
    window.apriModalNuovoAppuntamento();
});

// --- GESTIONE AMMINISTRAZIONE UTENTI ---
const utenteForm = document.getElementById('utente-form');
const userNameInput = document.getElementById('user-name-input');
const userPassInput = document.getElementById('user-pass-input');
const permScadenze = document.getElementById('perm-scadenze');
const permAppuntamenti = document.getElementById('perm-appuntamenti');
const permMedia = document.getElementById('perm-media');
const permRicette = document.getElementById('perm-ricette');
const listaUtenti = document.getElementById('lista-utenti');

if (utenteForm) {
    utenteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = formatCapitalize(userNameInput.value);
        const password = userPassInput.value.trim();
        const colore = "#3b82f6";
        const permessi = {
            scadenze: permScadenze.checked,
            appuntamenti: permAppuntamenti.checked,
            media: permMedia.checked,
            ricette: permRicette.checked
        };

        try {
            await setDoc(doc(db, "utenti", nome), { nome, password, colore, permessi });
            alert("Utente configurato con successo!");
            utenteForm.reset();
            caricaListaUtenti();
        } catch (err) {
            alert("Errore nel salvataggio dell'utente.");
        }
    });
}

async function caricaListaUtenti() {
    if (!listaUtenti) return;
    listaUtenti.innerHTML = `<p class="text-muted">Caricamento utenti...</p>`;
    try {
        const querySnapshot = await getDocs(collection(db, "utenti"));
        let html = "";
        querySnapshot.forEach(docSnap => {
            const u = docSnap.data();
            html += `
                <li class="elemento-lista">
                    <div>
                        <span class="badge-utente" style="background-color: ${u.colore || '#3b82f6'};"></span>
                        <strong>${u.nome}</strong> (Password: ${u.password})
                    </div>
                    <div>
                        <button class="btn-elimina" onclick="eliminaUtente('${docSnap.id}')">Elimina</button>
                    </div>
                </li>`;
        });
        listaUtenti.innerHTML = html || `<p class="text-muted">Nessun utente configurato.</p>`;
    } catch (err) {
        listaUtenti.innerHTML = `<p class="text-muted">Errore caricamento utenti.</p>`;
    }
}

window.eliminaUtente = async function(emailId) {
    if (confirm(`Vuoi rimuovere l'utente ${emailId}?`)) {
        await deleteDoc(doc(db, "utenti", emailId));
        caricaListaUtenti();
    }
}

// --- AVVIO DELL'APPLICAZIONE ---
function avviaApplicazione() {
    attivaInterfacciaUtente(caricaListaUtenti);
    caricaScadenze();
    caricaAppuntamenti();
    caricaRicette();
}

impostaCallbackAvvio(avviaApplicazione);

window.addEventListener('DOMContentLoaded', () => {
    controllaSessioneSalvata();
});
