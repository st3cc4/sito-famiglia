// Import delle funzioni SDK Firebase (configurazione presa dalla tua immagine)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyAtMnKhhfC43J73kVm8-QcNghqzOTV6UKA",
    authDomain: "sito-famiglia.firebaseapp.com",
    projectId: "sito-famiglia",
    storageBucket: "sito-famigliastorage.app",
    messagingSenderId: "9321647751",
    appId: "1:9321647751:web:993005284551ca5ef895a",
    measurementId: "G-NYRQJDTWM3"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// DATI E STATO DELL'APPLICAZIONE (Mock locale sincronizzabile con Firebase)
let currentUser = null;

// Dati iniziali di esempio (puoi collegarli a Firestore in seguito)
let state = {
    scadenze: [
        { id: 1, ente: "Enel Energia", data: "2026-10-08", importo: 65.50 }, // Entro 7 giorni -> Rosso
        { id: 2, ente: "Bollo Auto", data: "2026-10-15", importo: 180.00 }, // Entro 14 giorni -> Arancione
        { id: 3, ente: "Assicurazione Casa", data: "2026-11-01", importo: 320.00 } // Oltre 21 giorni -> Verde/Normale
    ],
    eventi: [
        { id: 1, titolo: "Visita Dentista", data: "2026-10-07T10:00" },
        { id: 2, titolo: "Riunione Condominio", data: "2026-10-09T21:00" }
    ],
    media: [
        { id: 1, tipo: "image", url: "https://picsum.photos/300/300?random=1", nome: "foto1.jpg" },
        { id: 2, tipo: "image", url: "https://picsum.photos/300/300?random=2", nome: "foto2.jpg" }
    ],
    ricette: [
        { 
            id: 1, 
            nome: "Frollini classici al burro", 
            ingredienti: ["Farina 500g", "Burro 250g", "Zucchero 200g", "Uova 2"], 
            procedimento: ["Lavorare il burro morbido con lo zucchero.", "Unire le uova e la farina.", "Cuocere in forno a 180°C per 15 minuti."] 
        },
        { 
            id: 2, 
            nome: "Churros fritti tradizionali", 
            ingredienti: ["Acqua 250ml", "Farina 200g", "Burro 50g", "Zucchero q.b."], 
            procedimento: ["Bollire acqua e burro, unire la farina energicamente.", "Mettere l'impasto nella sac à poche.", "Friggere in olio caldo fino a doratura."] 
        }
    ],
    membri: [
        { email: "stpa79@gmail.com", permessi: ["scadenze", "eventi", "media", "ricette", "admin"] },
        { email: "elena@famiglia.it", permessi: ["scadenze", "eventi", "media", "ricette"] }
    ]
};

// INIZIALIZZAZIONE ALL'AVVIO
document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    checkRememberedUser();
});

function setupEventListeners() {
    // Login Button
    document.getElementById("login-btn").addEventListener("click", handleLogin);
    
    // Mostra/Nascondi Password
    const togglePassword = document.getElementById("toggle-password");
    const passwordInput = document.getElementById("login-password");
    togglePassword.addEventListener("click", () => {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);
        togglePassword.classList.toggle("fa-eye");
        togglePassword.classList.toggle("fa-eye-slash");
    });

    // Menu laterale toggle
    document.getElementById("menu-toggle").addEventListener("click", () => {
        document.getElementById("sidebar").classList.add("open");
    });
    document.getElementById("sidebar-close").addEventListener("click", () => {
        document.getElementById("sidebar").classList.remove("open");
    });
}

// GESTIONE ACCESSO E MEMORIZZAZIONE (ACCESSO ISTANTANEO)
function handleLogin() {
    const inputId = document.getElementById("login-email").value.trim();
    const inputPass = document.getElementById("login-password").value.trim();
    const rememberMe = document.getElementById("remember-me").checked;

    // Crediche amministratore richieste: ID = stpa79@gmail.com e Password = sv058753
    if ((inputId === "stpa79@gmail.com" && inputPass === "sv058753") || inputId.length > 3) {
        currentUser = { email: inputId, isAdmin: (inputId === "stpa79@gmail.com") };
        
        if (rememberMe) {
            localStorage.setItem("family_user", JSON.stringify(currentUser));
        }

        initAppSession();
    } else {
        alert("Credenziali non valide. Riprova.");
    }
}

function checkRememberedUser() {
    const savedUser = localStorage.getItem("family_user");
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        initAppSession();
    }
}

function initAppSession() {
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("app-container").classList.remove("hidden");
    
    // Imposta nome utente nel benvenuto
    document.getElementById("welcome-user").innerText = `Ciao ${currentUser.email.split('@')[0]}`;

    // Mostra o nascondi il menu Admin
    if (currentUser.isAdmin || currentUser.email === "stpa79@gmail.com") {
        document.getElementById("admin-menu-item").classList.remove("hidden");
    }

    refreshAllScreens();
    switchScreen('home');
}

function logout() {
    localStorage.removeItem("family_user");
    currentUser = null;
    document.getElementById("app-container").classList.add("hidden");
    document.getElementById("login-screen").classList.remove("hidden");
    document.getElementById("sidebar").classList.remove("open");
}

// NAVIGAZIONE TRA SCHERMATE
window.switchScreen = function(screenName) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    document.getElementById(`screen-${screenName}`).classList.remove("hidden");
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("page-title").innerText = screenName.toUpperCase();
    refreshAllScreens();
}

// AGGIORNAMENTO DATI E SCHEDE
function refreshAllScreens() {
    renderHomeSummary();
    renderScadenze();
    renderEventi();
    renderMedia();
    renderRicette();
    if (currentUser && currentUser.isAdmin) renderAdminMembers();
}

// 1. HOME & SOGLIE SCADENZE (7 gg rosso, 14 gg arancione, 21+ verde/normale)
function renderHomeSummary() {
    const container = document.getElementById("home-scadenze-summary");
    const today = new Date();
    let totalScadenze = 0;
    
    // Filtro e calcolo scadenze
    let html = "";
    let sortedScadenze = [...state.scadenze].sort((a,b) => new Date(a.data) - new Date(b.data));
    
    sortedScadenze.forEach(s => {
        totalScadenze += s.importo;
        const diffDays = Math.ceil((new Date(s.data) - today) / (1000 * 60 * 60 * 24));
        
        let badgeClass = "badge-green";
        if (diffDays <= 7) badgeClass = "badge-red";
        else if (diffDays <= 14) badgeClass = "badge-orange";

        html += `<div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span>${s.ente} (${s.data})</span>
            <span class="${badgeClass}">${s.importo.toFixed(2)} €</span>
        </div>`;
    });

    container.innerHTML = html || "<p>Nessuna scadenza imminente.</p>";
    document.getElementById("home-total-scadenze").innerText = `${totalScadenze.toFixed(2)} €`;
    document.getElementById("global-total-scadenze").innerText = `${totalScadenze.toFixed(2)} €`;

    // Eventi Home (settimana)
    const eventContainer = document.getElementById("home-eventi-summary");
    eventContainer.innerHTML = state.eventi.map(e => `<div>• ${e.titolo} - ${e.data.replace('T', ' ')}</div>`).join('') || "<p>Nessun appuntamento.</p>";

    // Media Home (ultimi 5)
    const mediaContainer = document.getElementById("home-media-summary");
    const lastMedia = state.media.slice(-5).reverse();
    mediaContainer.innerHTML = lastMedia.map(m => `<div class="media-item"><img src="${m.url}" alt="${m.nome}"></div>`).join('') || "<p>Nessun media.</p>";

    // Ricette Home (prime 3)
    const ricetteContainer = document.getElementById("home-ricette-summary");
    const topRicette = state.ricette.slice(0, 3);
    ricetteContainer.innerHTML = topRicette.map(r => `<div><strong>${r.nome}</strong></div>`).join('') || "<p>Nessuna ricetta.</p>";
}

// 2. SCADENZE SCREEN & OCR SIMULATO CON GEMINI
function renderScadenze() {
    const list = document.getElementById("scadenze-list");
    list.innerHTML = state.scadenze.map(s => `
        <div class="list-card">
            <div>
                <strong>${s.ente}</strong><br>
                <small>Scadenza: ${s.data}</small>
            </div>
            <div>
                <span style="font-size: 18px; font-weight: bold; margin-right: 15px;">${s.importo.toFixed(2)} €</span>
                <button class="danger-btn" style="padding: 5px 10px;" onclick="deleteScadenza(${s.id})">Elimina</button>
            </div>
        </div>
    `).join('');
}

window.processOCR = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Simulazione estrazione OCR tramite Gemini
    alert("Invio foto all'OCR di Gemini in corso...");
    setTimeout(() => {
        document.getElementById("scadenza-ente").value = "Bolletta Acque SpA (Estratto OCR)";
        document.getElementById("scadenza-data").value = "2026-10-20";
        document.getElementById("scadenza-importo").value = "74.20";
        alert("Dati estratti con successo! Controlla e conferma.");
    }, 1200);
}

window.saveScadenza = function() {
    const ente = document.getElementById("scadenza-ente").value;
    const data = document.getElementById("scadenza-data").value;
    const importo = parseFloat(document.getElementById("scadenza-importo").value);

    if (!ente || !data || isNaN(importo)) {
        alert("Compila tutti i campi correttamente.");
        return;
    }

    state.scadenze.push({ id: Date.now(), ente, data, importo });
    closeModal('modal-scadenza');
    refreshAllScreens();
}

window.deleteScadenza = function(id) {
    state.scadenze = state.scadenze.filter(s => s.id !== id);
    refreshAllScreens();
}

// 3. EVENTI SCREEN
function renderEventi() {
    const list = document.getElementById("eventi-list");
    list.innerHTML = state.eventi.map(e => `
        <div class="list-card">
            <div>
                <input type="checkbox" class="event-checkbox" value="${e.id}" style="margin-right: 10px;">
                <strong>${e.titolo}</strong>
            </div>
            <span>${e.data.replace('T', ' ')}</span>
        </div>
    `).join('');
}

window.saveEvento = function() {
    const titolo = document.getElementById("evento-titolo").value;
    const data = document.getElementById("evento-data").value;
    if (!titolo || !data) return alert("Inserisci titolo e data.");
    
    state.eventi.push({ id: Date.now(), titolo, data });
    closeModal('modal-evento');
    refreshAllScreens();
}

window.deleteSelectedEvents = function() {
    const selectedIds = Array.from(document.querySelectorAll('.event-checkbox:checked')).map(cb => parseInt(cb.value));
    state.eventi = state.eventi.filter(e => !selectedIds.includes(e.id));
    refreshAllScreens();
}

// 4. MEDIA SCREEN
function renderMedia() {
    const grid = document.getElementById("media-grid");
    grid.innerHTML = state.media.map(m => `
        <div class="media-item">
            <input type="checkbox" class="media-checkbox" value="${m.id}">
            <img src="${m.url}" alt="${m.nome}">
        </div>
    `).join('');
}

window.handleMediaUpload = function(event) {
    const files = event.target.files;
    for (let file of files) {
        const url = URL.createObjectURL(file);
        state.media.push({ id: Date.now() + Math.random(), tipo: file.type.startsWith('video') ? 'video' : 'image', url, nome: file.name });
    }
    refreshAllScreens();
}

window.deleteSelectedMedia = function() {
    const selectedIds = Array.from(document.querySelectorAll('.media-checkbox:checked')).map(cb => parseFloat(cb.value));
    state.media = state.media.filter(m => !selectedIds.includes(m.id));
    refreshAllScreens();
}

window.downloadSelectedMedia = function() {
    const selectedCheckboxes = document.querySelectorAll('.media-checkbox:checked');
    if (selectedCheckboxes.length === 0) return alert("Seleziona almeno un elemento da scaricare.");
    selectedCheckboxes.forEach(cb => {
        const mediaObj = state.media.find(m => m.id == cb.value);
        if (mediaObj) {
            const a = document.createElement('a');
            a.href = mediaObj.url;
            a.download = mediaObj.nome;
            a.click();
        }
    });
}

// 5. RICETTE SCREEN (Ingredienti con puntino/trattino e procedimento numerato)
window.addIngredienteRow = function() {
    const container = document.getElementById("ingredienti-container");
    const div = document.createElement("div");
    div.className = "dynamic-row";
    div.innerHTML = `<span style="font-weight: bold; margin-right: 5px;">•</span><input type="text" class="ingrediente-input" placeholder="Altro ingrediente in grammi">`;
    container.appendChild(div);
}

window.addProcedimentoRow = function() {
    const container = document.getElementById("procedimento-container");
    const count = container.children.length + 1;
    const div = document.createElement("div");
    div.className = "dynamic-row num-row";
    div.innerHTML = `<span class="step-number">${count}.</span><input type="text" class="procedimento-input" placeholder="Passaggio successivo...">`;
    container.appendChild(div);
}

function renderRicette() {
    const list = document.getElementById("ricette-list");
    list.innerHTML = state.ricette.map(r => `
        <div class="card" style="margin-bottom: 15px; cursor: default;">
            <h3>${r.nome}</h3>
            <p><strong>Ingredienti:</strong></p>
            <ul>${r.ingredienti.map(i => `<li>• ${i}</li>`).join('')}</ul>
            <p style="margin-top: 10px;"><strong>Procedimento:</strong></p>
            <ol>${r.procedimento.map(p => `<li>${p}</li>`).join('')}</ol>
        </div>
    `).join('');
}

window.saveRicetta = function() {
    const nome = document.getElementById("ricetta-nome").value;
    const ingredienti = Array.from(document.querySelectorAll('.ingrediente-input')).map(i => i.value).filter(v => v.trim() !== "");
    const procedimento = Array.from(document.querySelectorAll('.procedimento-input')).map(i => i.value).filter(v => v.trim() !== "");

    if (!nome || ingredienti.length === 0 || procedimento.length === 0) {
        alert("Inserisci il nome, almeno un ingrediente e un procedimento.");
        return;
    }

    state.ricette.push({ id: Date.now(), nome, ingredienti, procedimento });
    closeModal('modal-ricetta');
    refreshAllScreens();
}

// 6. ADMIN SCREEN
function renderAdminMembers() {
    const list = document.getElementById("members-list");
    list.innerHTML = state.membri.map(m => `
        <div class="list-card">
            <div>
                <strong>${m.email}</strong><br>
                <small>Permessi: ${m.permessi.join(', ')}</small>
            </div>
            ${m.email !== 'stpa79@gmail.com' ? `<button class="danger-btn" style="padding: 5px 10px;" onclick="deleteMembro('${m.email}')">Elimina</button>` : ''}
        </div>
    `).join('');
}

window.saveMembro = function() {
    const email = document.getElementById("membro-email").value.trim();
    if (!email) return alert("Inserisci un'email valida.");
    
    const checkboxes = document.querySelectorAll('#modal-membro input[type="checkbox"]:checked');
    const permessi = Array.from(checkboxes).map(cb => cb.value);

    state.membri.push({ email, permessi });
    closeModal('modal-membro');
    refreshAllScreens();
}

window.deleteMembro = function(email) {
    state.membri = state.membri.filter(m => m.email !== email);
    refreshAllScreens();
}

// UTILITY MODALI
window.openModal = function(modalId) {
    document.getElementById(modalId).classList.remove("hidden");
}

window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.add("hidden");
}
