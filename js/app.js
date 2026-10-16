// js/app.js - Logica principale dell'applicazione con inserimento dati

import { db } from "./firebase-config.js";
import { 
    collection, 
    onSnapshot,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- STATO APPLICAZIONE ---
let utenteCorrente = { nome: "Ospite", colore: "#4A90E2" };

// --- ELEMENTI DOM ---
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

// Modali Selezione Utente
const modalUtenti = document.getElementById('modal-utenti');
const utentiList = document.getElementById('utenti-list');
const btnCloseModalUtenti = document.getElementById('btn-close-modal-utenti');

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

// Forms
const formImpegno = document.getElementById('form-impegno');
const formScadenza = document.getElementById('form-scadenza');
const formRicetta = document.getElementById('form-ricetta');

// Contenitori Cards
const containerImpegni = document.getElementById('container-impegni');
const containerScadenze = document.getElementById('container-scadenze');
const containerRicette = document.getElementById('container-ricette');

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

userBadge.addEventListener('click', () => openModal(modalUtenti));
btnLogout.addEventListener('click', () => {
    closeMenu();
    openModal(modalUtenti);
});
btnCloseModalUtenti.addEventListener('click', () => closeModal(modalUtenti));

// Modali Aggiunta Dati
btnAddImpegno.addEventListener('click', () => openModal(modalImpegno));
btnCloseModalImpegno.addEventListener('click', () => closeModal(modalImpegno));

btnAddScadenza.addEventListener('click', () => openModal(modalScadenza));
btnCloseModalScadenza.addEventListener('click', () => closeModal(modalScadenza));

btnAddRicetta.addEventListener('click', () => openModal(modalRicetta));
btnCloseModalRicetta.addEventListener('click', () => closeModal(modalRicetta));

// --- CARICAMENTO UTENTI DA FIRESTORE ---
function caricaUtenti() {
    onSnapshot(collection(db, "utenti"), (snapshot) => {
        utentiList.innerHTML = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const btn = document.createElement('button');
            btn.className = 'utente-btn';
            btn.textContent = data.nome || doc.id;
            
            if (data.colore) {
                btn.style.borderLeft = `6px solid ${data.colore}`;
            }

            btn.addEventListener('click', () => {
                selezionaUtente(data.nome || doc.id, data.colore);
                closeModal(modalUtenti);
            });

            utentiList.appendChild(btn);
        });
    });
}

function selezionaUtente(nome, colore) {
    utenteCorrente = { nome, colore };
    userNameDisplay.textContent = nome;
    if (colore) {
        userBadge.style.backgroundColor = colore;
    }
}

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
            creatore: utenteCorrente.nome
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
            creatore: utenteCorrente.nome
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

    // Converti il testo in array dividendo per riga
    const ingredienti = ingredientiRaw.split('\n').filter(line => line.trim() !== '');
    const procedimento = procedimentoRaw.split('\n').filter(line => line.trim() !== '');

    try {
        await addDoc(collection(db, "ricette"), {
            nome: nome,
            ingredienti: ingredienti,
            procedimento: procedimento,
            note: note,
            creatore: utenteCorrente.nome
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
    caricaUtenti();
    ascoltaImpegni();
    ascoltaScadenze();
    ascoltaRicette();
});
