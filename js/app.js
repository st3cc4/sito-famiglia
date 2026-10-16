// js/app.js - Logica principale dell'applicazione con Login e Firestore

import { db } from "./firebase-config.js";
import { 
    collection, 
    onSnapshot,
    addDoc,
    getDocs,
    query,
    where
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

// --- ELEMENTI DOM PRINCIPALI ---
const btnToggleMenu = document.getElementById('btn-toggle-menu');
const btnCloseMenu = document.getElementById('btn-close-menu');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.app-section');
const headerTitle = document.getElementById('header-title');

const userBadge = document.getElementById('user-badge');
const userNameDisplay = document.getElementById('user-name-display');
const btnLogout = document.getElementById('btn-logout');

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

// Forms Dati
const formImpegno = document.getElementById('form-impegno');
const formScadenza = document.getElementById('form-scadenza');
const formRicetta = document.getElementById('form-ricetta');

// Contenitori Cards
const containerImpegni = document.getElementById('container-impegni');
const containerScadenze = document.getElementById('container-scadenze');
const containerRicette = document.getElementById('container-ricette');

// --- MOSTRA / NASCONDI PASSWORD ---
btnTogglePassword.addEventListener('click', () => {
    const isPassword = loginPassword.getAttribute('type') === 'password';
    loginPassword.setAttribute('type', isPassword ? 'text' : 'password');
    btnTogglePassword.textContent = isPassword ? '🙈' : '👁️';
});

// --- GESTIONE LOGICA LOGIN ---
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = "";

    const usernameDigitato = loginUsername.value.trim();
    const passwordDigitata = loginPassword.value.trim();

    try {
        // Cerca l'utente nella collezione 'utenti'
        const utentiRef = collection(db, "utenti");
        const querySnapshot = await getDocs(utentiRef);

        let utenteTrovato = null;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const nomeUtente = data.nome || doc.id;

            // Confronto case-insensitive per il nome utente e esatto per la password
            if (nomeUtente.toLowerCase() === usernameDigitato.toLowerCase() && data.password === passwordDigitata) {
                utenteTrovato = {
                    id: doc.id,
                    nome: nomeUtente,
                    colore: data.colore || "#4A90E2"
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
    userNameDisplay.textContent = utente.nome;
    if (utente.colore) {
        userBadge.style.backgroundColor = utente.colore;
    }

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

// --- NAVIGAZIONE TRA LE SEZIONI ---
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSection = link.getAttribute('data-section');

        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

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

btnAddImpegno.addEventListener('click', () => openModal(modalImpegno));
btnCloseModalImpegno.addEventListener('click', () => closeModal(modalImpegno));

btnAddScadenza.addEventListener('click', () => openModal(modalScadenza));
btnCloseModalScadenza.addEventListener('click', () => closeModal(modalScadenza));

btnAddRicetta.addEventListener('click', () => openModal(modalRicetta));
btnCloseModalRicetta.addEventListener('click', () => closeModal(modalRicetta));

// --- SALVATAGGIO NUOVI DATI SU FIRESTORE ---

// 1. Salvataggio Nuovo Impegno
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
        console.error("Errore nel salvataggio dell'impegno:", error);
        alert("Errore durante il salvataggio!");
    }
});

// 2. Salvataggio Nuova Scadenza
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
        console.error("Errore nel salvataggio della scadenza:", error);
        alert("Errore durante il salvataggio!");
    }
});

// 3. Salvataggio Nuova Ricetta
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
        console.error("Errore nel salvataggio della ricetta:", error);
        alert("Errore durante il salvataggio!");
    }
});

// --- CARICAMENTO DATI REALTIME DA FIRESTORE ---

// 1. Lettura Appuntamenti / Impegni
function ascoltaImpegni() {
    onSnapshot(collection(db, "appuntamenti"), (snapshot) => {
        containerImpegni.innerHTML = '';
        if (snapshot.empty) {
            containerImpegni.innerHTML = '<p class="card-meta">Nessun impegno trovato.</p>';
            return;
        }
        snapshot.forEach((doc) => {
            const item = doc.data();
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

// 2. Lettura Scadenze
function ascoltaScadenze() {
    onSnapshot(collection(db, "scadenze"), (snapshot) => {
        containerScadenze.innerHTML = '';
        if (snapshot.empty) {
            containerScadenze.innerHTML = '<p class="card-meta">Nessuna scadenza trovata.</p>';
            return;
        }
        snapshot.forEach((doc) => {
            const item = doc.data();
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

// 3. Lettura Ricette
function ascoltaRicette() {
    onSnapshot(collection(db, "ricette"), (snapshot) => {
        containerRicette.innerHTML = '';
        if (snapshot.empty) {
            containerRicette.innerHTML = '<p class="card-meta">Nessuna ricetta trovata.</p>';
            return;
        }
        snapshot.forEach((doc) => {
            const item = doc.data();
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
