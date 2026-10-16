// js/app.js - Logica principale con Gestione Admin, Permessi e Sidebar Personalizzata

import { db } from "./firebase-config.js";
import { 
    collection, 
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- STATO APPLICAZIONE ---
let utenteCorrente = null;

// --- ELEMENTI DOM LOGIN ---
const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');
const formLogin = document.getElementById('form-login');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginRemember = document.getElementById('login-remember');
const loginError = document.getElementById('login-error');
const btnTogglePassword = document.getElementById('btn-toggle-password');

// --- ELEMENTI DOM SIDEBAR E PROFILO ---
const btnToggleMenu = document.getElementById('btn-toggle-menu');
const btnCloseMenu = document.getElementById('btn-close-menu');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.app-section');
const headerTitle = document.getElementById('header-title');

const sidebarUserCard = document.getElementById('sidebar-user-card');
const sidebarUserName = document.getElementById('sidebar-user-name');
const sidebarUserRole = document.getElementById('sidebar-user-role');
const userBadge = document.getElementById('user-badge');
const userNameDisplay = document.getElementById('user-name-display');

const btnAdminPanel = document.getElementById('btn-admin-panel');
const btnChangePassword = document.getElementById('btn-change-password');
const btnChangeColor = document.getElementById('btn-change-color');
const btnLogout = document.getElementById('btn-logout');

// Nav Items Sezioni
const navItemImpegni = document.getElementById('nav-item-impegni');
const navItemScadenze = document.getElementById('nav-item-scadenze');
const navItemRicette = document.getElementById('nav-item-ricette');
const navItemMedia = document.getElementById('nav-item-media');

// Modali Profilo/Admin
const modalPassword = document.getElementById('modal-password');
const modalColore = document.getElementById('modal-colore');
const modalAdmin = document.getElementById('modal-admin');

const btnCloseModalPassword = document.getElementById('btn-close-modal-password');
const btnCloseModalColore = document.getElementById('btn-close-modal-colore');
const btnCloseModalAdmin = document.getElementById('btn-close-modal-admin');

const formPassword = document.getElementById('form-password');
const formColore = document.getElementById('form-colore');
const formAdminUser = document.getElementById('form-admin-user');
const btnAdminReset = document.getElementById('btn-admin-reset');
const adminUsersList = document.getElementById('admin-users-list');

// Modali Inserimento Dati
const modalImpegno = document.getElementById('modal-impegno');
const modalScadenza = document.getElementById('modal-scadenza');
const modalRicetta = document.getElementById('modal-ricetta');

const btnAddImpegno = document.getElementById('btn-add-impegno');
const btnAddScadenza = document.getElementById('btn-add-scadenza');
const btnAddRicetta = document.getElementById('btn-add-ricetta');

const btnCloseModalImpegno = document.getElementById('btn-close-modal-impegno');
const btnCloseModalScadenza = document.getElementById('btn-close-modal-scadenza');
const btnCloseModalRicetta = document.getElementById('btn-close-modal-ricetta');

// Form Dati
const formImpegno = document.getElementById('form-impegno');
const formScadenza = document.getElementById('form-scadenza');
const formRicetta = document.getElementById('form-ricetta');

// Contenitori Cards
const containerImpegni = document.getElementById('container-impegni');
const containerScadenze = document.getElementById('container-scadenze');
const containerRicette = document.getElementById('container-ricette');

// --- MOSTRA / NASCONDI PASSWORD LOGIN ---
btnTogglePassword.addEventListener('click', () => {
    const isPassword = loginPassword.getAttribute('type') === 'password';
    loginPassword.setAttribute('type', isPassword ? 'text' : 'password');
    btnTogglePassword.textContent = isPassword ? '🙈' : '👁️';
});

// --- AUTENTICAZIONE E ACCESSO ---
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = "";

    const usernameDigitato = loginUsername.value.trim();
    const passwordDigitata = loginPassword.value.trim();

    try {
        const utentiRef = collection(db, "utenti");
        const querySnapshot = await getDocs(utentiRef);

        let utenteTrovato = null;

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const nomeUtente = data.nome || docSnap.id;

            if (nomeUtente.toLowerCase() === usernameDigitato.toLowerCase() && data.password === passwordDigitata) {
                utenteTrovato = {
                    id: docSnap.id,
                    nome: nomeUtente,
                    password: data.password,
                    colore: data.colore || "#4A90E2",
                    ruolo: data.ruolo || (nomeUtente.toLowerCase() === 'paolo' ? 'admin' : 'utente'),
                    permessi: data.permessi || { impegni: true, scadenze: true, ricette: true, media: true }
                };
            }
        });

        if (utenteTrovato) {
            autenticaUtente(utenteTrovato, loginRemember.checked);
        } else {
            loginError.textContent = "Nome utente o password non corretti.";
        }
    } catch (error) {
        console.error("Errore durante il login:", error);
        loginError.textContent = "Errore di connessione durante la verifica.";
    }
});

function autenticaUtente(utente, ricorda) {
    utenteCorrente = utente;

    // Aggiorna interfaccia utente
    userNameDisplay.textContent = utente.nome;
    sidebarUserName.textContent = utente.nome;
    sidebarUserRole.textContent = utente.ruolo === 'admin' ? '(Admin)' : '(Utente)';
    
    // Imposta colore dinamico
    sidebarUserCard.style.backgroundColor = utente.colore;
    userBadge.style.backgroundColor = utente.colore;

    // Mostra/Nascondi Pulsante Admin
    if (utente.ruolo === 'admin') {
        btnAdminPanel.classList.remove('hidden');
    } else {
        btnAdminPanel.classList.add('hidden');
    }

    // Filtra voci di menu in base ai permessi
    applicaPermessiSezioni(utente.permessi);

    if (ricorda) {
        localStorage.setItem('sito_famiglia_user', JSON.stringify(utente));
    } else {
        localStorage.removeItem('sito_famiglia_user');
    }

    loginScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');

    // Carica i dati Firestore
    ascoltaImpegni();
    ascoltaScadenze();
    ascoltaRicette();
}

function applicaPermessiSezioni(permessi) {
    const p = permessi || { impegni: true, scadenze: true, ricette: true, media: true };

    if (p.impegni) navItemImpegni.classList.remove('hidden'); else navItemImpegni.classList.add('hidden');
    if (p.scadenze) navItemScadenze.classList.remove('hidden'); else navItemScadenze.classList.add('hidden');
    if (p.ricette) navItemRicette.classList.remove('hidden'); else navItemRicette.classList.add('hidden');
    if (p.media) navItemMedia.classList.remove('hidden'); else navItemMedia.classList.add('hidden');

    // Seleziona la prima sezione visibile disponibile
    if (p.impegni) attivaSezione('impegni');
    else if (p.scadenze) attivaSezione('scadenze');
    else if (p.ricette) attivaSezione('ricette');
    else if (p.media) attivaSezione('media');
}

function attivaSezione(targetSection) {
    navLinks.forEach(l => {
        if (l.getAttribute('data-section') === targetSection) l.classList.add('active');
        else l.classList.remove('active');
    });

    sections.forEach(section => {
        if (section.id === `section-${targetSection}`) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });

    switch(targetSection) {
        case 'impegni': headerTitle.textContent = "📅 Appuntamenti"; break;
        case 'scadenze': headerTitle.textContent = "⏰ Scadenze"; break;
        case 'ricette': headerTitle.textContent = "🍳 Ricette"; break;
        case 'media': headerTitle.textContent = "🖼️ Foto e Video"; break;
    }
}

function controllaSessioneSalvata() {
    const salvato = localStorage.getItem('sito_famiglia_user');
    if (salvato) {
        try {
            const utente = JSON.parse(salvato);
            autenticaUtente(utente, true);
        } catch (e) {
            localStorage.removeItem('sito_famiglia_user');
        }
    }
}

// LOGOUT
btnLogout.addEventListener('click', () => {
    localStorage.removeItem('sito_famiglia_user');
    utenteCorrente = null;
    appContainer.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    formLogin.reset();
    closeMenu();
});

// --- GESTIONE SIDEBAR MENU ---
function openMenu() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
}

function closeMenu() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
}

btnToggleMenu.addEventListener('click', openMenu);
btnCloseMenu.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSection = link.getAttribute('data-section');
        attivaSezione(targetSection);
        closeMenu();
    });
});

// --- GESTIONE MODALI ---
function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

btnChangePassword.addEventListener('click', () => { closeMenu(); openModal(modalPassword); });
btnCloseModalPassword.addEventListener('click', () => closeModal(modalPassword));

btnChangeColor.addEventListener('click', () => { 
    closeMenu(); 
    document.getElementById('user-color-picker').value = utenteCorrente.colore || "#4A90E2";
    openModal(modalColore); 
});
btnCloseModalColore.addEventListener('click', () => closeModal(modalColore));

btnAdminPanel.addEventListener('click', () => { 
    closeMenu(); 
    caricaGestioneUtentiAdmin();
    openModal(modalAdmin); 
});
btnCloseModalAdmin.addEventListener('click', () => closeModal(modalAdmin));

btnAddImpegno.addEventListener('click', () => openModal(modalImpegno));
btnCloseModalImpegno.addEventListener('click', () => closeModal(modalImpegno));

btnAddScadenza.addEventListener('click', () => openModal(modalScadenza));
btnCloseModalScadenza.addEventListener('click', () => closeModal(modalScadenza));

btnAddRicetta.addEventListener('click', () => openModal(modalRicetta));
btnCloseModalRicetta.addEventListener('click', () => closeModal(modalRicetta));

// --- CAMBIO PASSWORD E COLORE UTENTE CORRENTE ---
formPassword.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuovaPwd = document.getElementById('new-password').value.trim();

    if (!utenteCorrente || !nuovaPwd) return;

    try {
        const utenteRef = doc(db, "utenti", utenteCorrente.id);
        await updateDoc(utenteRef, { password: nuovaPwd });

        utenteCorrente.password = nuovaPwd;
        if (localStorage.getItem('sito_famiglia_user')) {
            localStorage.setItem('sito_famiglia_user', JSON.stringify(utenteCorrente));
        }

        alert("Password aggiornata con successo!");
        formPassword.reset();
        closeModal(modalPassword);
    } catch (err) {
        console.error("Errore aggiornamento password:", err);
        alert("Errore durante l'aggiornamento della password.");
    }
});

formColore.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuovoColore = document.getElementById('user-color-picker').value;

    if (!utenteCorrente || !nuovoColore) return;

    try {
        const utenteRef = doc(db, "utenti", utenteCorrente.id);
        await updateDoc(utenteRef, { colore: nuovoColore });

        utenteCorrente.colore = nuovoColore;
        sidebarUserCard.style.backgroundColor = nuovoColore;
        userBadge.style.backgroundColor = nuovoColore;

        if (localStorage.getItem('sito_famiglia_user')) {
            localStorage.setItem('sito_famiglia_user', JSON.stringify(utenteCorrente));
        }

        alert("Colore personalizzato aggiornato!");
        closeModal(modalColore);
    } catch (err) {
        console.error("Errore aggiornamento colore:", err);
        alert("Errore durante l'aggiornamento del colore.");
    }
});

// --- PANNELLO ADMIN: GESTIONE UTENTI E PERMESSI ---
function caricaGestioneUtentiAdmin() {
    onSnapshot(collection(db, "utenti"), (snapshot) => {
        adminUsersList.innerHTML = '';
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            const nome = data.nome || id;

            const item = document.createElement('div');
            item.className = 'admin-user-item';
            item.innerHTML = `
                <div>
                    <strong style="color: ${data.colore || '#333'}">${nome}</strong> 
                    <small>(${data.ruolo || 'utente'})</small>
                </div>
                <div class="admin-user-actions">
                    <button class="sm-btn edit-btn" data-id="${id}">Modifica</button>
                    <button class="sm-btn del-btn" data-id="${id}" data-nome="${nome}">Elimina</button>
                </div>
            `;

            // Pulsante Modifica
            item.querySelector('.edit-btn').addEventListener('click', () => {
                document.getElementById('admin-user-id').value = id;
                document.getElementById('admin-user-name').value = nome;
                document.getElementById('admin-user-pwd').value = data.password || '';
                document.getElementById('admin-user-color').value = data.colore || '#4A90E2';
                document.getElementById('admin-user-role').value = data.ruolo || 'utente';

                const p = data.permessi || { impegni: true, scadenze: true, ricette: true, media: true };
                document.getElementById('perm-impegni').checked = !!p.impegni;
                document.getElementById('perm-scadenze').checked = !!p.scadenze;
                document.getElementById('perm-ricette').checked = !!p.ricette;
                document.getElementById('perm-media').checked = !!p.media;
            });

            // Pulsante Elimina
            item.querySelector('.del-btn').addEventListener('click', async () => {
                if (confirm(`Sei sicuro di voler eliminare l'utente "${nome}"?`)) {
                    try {
                        await deleteDoc(doc(db, "utenti", id));
                    } catch (err) {
                        console.error("Errore eliminazione utente:", err);
                    }
                }
            });

            adminUsersList.appendChild(item);
        });
    });
}

btnAdminReset.addEventListener('click', () => {
    formAdminUser.reset();
    document.getElementById('admin-user-id').value = '';
    document.getElementById('perm-impegni').checked = true;
    document.getElementById('perm-scadenze').checked = true;
    document.getElementById('perm-ricette').checked = true;
    document.getElementById('perm-media').checked = true;
});

formAdminUser.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('admin-user-id').value;
    const nome = document.getElementById('admin-user-name').value.trim();
    const password = document.getElementById('admin-user-pwd').value.trim();
    const colore = document.getElementById('admin-user-color').value;
    const ruolo = document.getElementById('admin-user-role').value;

    const permessi = {
        impegni: document.getElementById('perm-impegni').checked,
        scadenze: document.getElementById('perm-scadenze').checked,
        ricette: document.getElementById('perm-ricette').checked,
        media: document.getElementById('perm-media').checked
    };

    const userData = { nome, password, colore, ruolo, permessi };

    try {
        if (id) {
            await updateDoc(doc(db, "utenti", id), userData);
        } else {
            await addDoc(collection(db, "utenti"), userData);
        }

        btnAdminReset.click();
        alert("Utente salvato con successo!");
    } catch (err) {
        console.error("Errore salvataggio utente Admin:", err);
        alert("Errore durante il salvataggio dell'utente.");
    }
});

// --- SALVATAGGIO NUOVI DATI SU FIRESTORE ---
formImpegno.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titolo = document.getElementById('impegno-titolo').value;
    const data = document.getElementById('impegno-data').value;
    const oraInizio = document.getElementById('impegno-ora-inizio').value;
    const oraFine = document.getElementById('impegno-ora-fine').value;

    try {
        await addDoc(collection(db, "appuntamenti"), {
            titolo: titolo,
            data: data,
            oraInizio: oraInizio,
            oraFine: oraFine,
            creatore: utenteCorrente ? utenteCorrente.nome : "Sconosciuto"
        });
        formImpegno.reset();
        closeModal(modalImpegno);
    } catch (error) {
        console.error("Errore salvataggio impegno:", error);
    }
});

formScadenza.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titolo = document.getElementById('scadenza-titolo').value;
    const data = document.getElementById('scadenza-data').value;
    const importo = parseFloat(document.getElementById('scadenza-importo').value) || 0;

    try {
        await addDoc(collection(db, "scadenze"), {
            titolo: titolo,
            data: data,
            importo: importo,
            creatore: utenteCorrente ? utenteCorrente.nome : "Sconosciuto"
        });
        formScadenza.reset();
        closeModal(modalScadenza);
    } catch (error) {
        console.error("Errore salvataggio scadenza:", error);
    }
});

formRicetta.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('ricetta-nome').value;
    const ingredientiRaw = document.getElementById('ricetta-ingredienti').value;
    const procedimentoRaw = document.getElementById('ricetta-procedimento').value;
    const note = document.getElementById('ricetta-note').value;

    const ingredienti = ingredientiRaw.split('\n').filter(line => line.trim() !== '');
    const procedimento = procedimentoRaw.split('\n').filter(line => line.trim() !== '');

    try {
        await addDoc(collection(db, "ricette"), {
            nome: nome,
            ingredienti: ingredienti,
            procedimento: procedimento,
            note: note,
            creatore: utenteCorrente ? utenteCorrente.nome : "Sconosciuto"
        });
        formRicetta.reset();
        closeModal(modalRicetta);
    } catch (error) {
        console.error("Errore salvataggio ricetta:", error);
    }
});

// --- CARICAMENTO DATI REALTIME DA FIRESTORE ---
function ascoltaImpegni() {
    onSnapshot(collection(db, "appuntamenti"), (snapshot) => {
        containerImpegni.innerHTML = '';
        if (snapshot.empty) {
            containerImpegni.innerHTML = '<p class="card-meta">Nessun impegno trovato.</p>';
            return;
        }
        snapshot.forEach((docSnap) => {
            const item = docSnap.data();
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-title">${item.titolo || 'Senza Titolo'}</div>
                <div class="card-meta">📅 Data: ${item.data || 'N/D'} (${item.oraInizio || ''} - ${item.oraFine || ''})</div>
                <div class="card-meta">👤 Creato da: ${item.creatore || 'Sconosciuto'}</div>
            `;
            containerImpegni.appendChild(card);
        });
    });
}

function ascoltaScadenze() {
    onSnapshot(collection(db, "scadenze"), (snapshot) => {
        containerScadenze.innerHTML = '';
        if (snapshot.empty) {
            containerScadenze.innerHTML = '<p class="card-meta">Nessuna scadenza trovata.</p>';
            return;
        }
        snapshot.forEach((docSnap) => {
            const item = docSnap.data();
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-title">${item.titolo || 'Senza Titolo'}</div>
                <div class="card-meta">📅 Data Scadenza: ${item.data || 'N/D'}</div>
                <div class="card-meta">💰 Importo: € ${item.importo !== undefined ? item.importo : '0.00'}</div>
                <div class="card-meta">👤 Creato da: ${item.creatore || 'Sconosciuto'}</div>
            `;
            containerScadenze.appendChild(card);
        });
    });
}

function ascoltaRicette() {
    onSnapshot(collection(db, "ricette"), (snapshot) => {
        containerRicette.innerHTML = '';
        if (snapshot.empty) {
            containerRicette.innerHTML = '<p class="card-meta">Nessuna ricetta trovata.</p>';
            return;
        }
        snapshot.forEach((docSnap) => {
            const item = docSnap.data();
            const ingredientiLista = item.ingredienti && Array.isArray(item.ingredienti) 
                ? item.ingredienti.join(', ') 
                : 'Nessun ingrediente';

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-title">${item.nome || 'Ricetta Senza Nome'}</div>
                <div class="card-meta">🛒 <strong>Ingredienti:</strong> ${ingredientiLista}</div>
                <div class="card-meta">📝 <strong>Note:</strong> ${item.note || 'Nessuna nota'}</div>
                <div class="card-meta">👤 Creato da: ${item.creatore || 'Sconosciuto'}</div>
            `;
            containerRicette.appendChild(card);
        });
    });
}

// --- INIZIALIZZAZIONE APP ---
document.addEventListener('DOMContentLoaded', () => {
    controllaSessioneSalvata();
});
