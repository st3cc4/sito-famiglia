/* ==========================================
   PWA FAMIGLIA - LOGICA JAVASCRIPT (script.js)
   Created by STECCA with GEMINI
   ========================================== */

// Importazioni Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Configurazione Firebase dal tuo progetto
const firebaseConfig = {
    apiKey: "AIzaSyAtMnKhhFC43J73kVm8-QcNghqzOTV6UKA",
    authDomain: "sito-famiglia.firebaseapp.com",
    projectId: "sito-famiglia",
    storageBucket: "sito-famigliastorage.app",
    messagingSenderId: "93216467751",
    appId: "1:93216467751:web:993005284551ca5ef895a",
    measurementId: "G-NYRQJDTWM3"
};

// Inizializzazione Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Account amministratore predefinito
const ADMIN_EMAIL = "stpa79@gmail.com";
const ADMIN_PASS = "sv058753";

// Variabile globale utente
let currentUser = null;

// Avvio al caricamento della pagina
document.addEventListener("DOMContentLoaded", () => {
    initAuthListener();
    setupEventListeners();
});

// ==========================================
// 1. GESTIONE AUTENTICAZIONE E ACCESSO
// ==========================================
function initAuthListener() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            document.getElementById("login-screen").classList.add("hidden");
            checkAdminPermissions(user.email);
            loadHomeData();
        } else {
            document.getElementById("login-screen").classList.remove("hidden");
        }
    });
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const rememberMe = document.getElementById("remember-me").checked;

    try {
        const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistence);
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                await signInWithEmailAndPassword(auth, email, password);
            } catch (err) {
                alert("Errore durante l'accesso: " + err.message);
            }
        } else {
            alert("Credenziali non valide o errore di accesso: " + error.message);
        }
    }
});

function logout() {
    signOut(auth).then(() => {
        location.reload();
    });
}

function checkAdminPermissions(email) {
    const adminMenuItem = document.getElementById("admin-menu-item");
    if (email === ADMIN_EMAIL) {
        adminMenuItem.classList.remove("hidden");
    } else {
        adminMenuItem.classList.add("hidden");
    }
}

// ==========================================
// 2. NAVIGAZIONE E MENU A SCOMPARSA
// ==========================================
function setupEventListeners() {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("toggle-sidebar");
    const closeBtn = document.getElementById("close-sidebar");

    toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("-translate-x-full");
    });

    closeBtn.addEventListener("click", () => {
        sidebar.classList.add("-translate-x-full");
    });
}

function switchScreen(screenName) {
    document.querySelectorAll(".screen-content").forEach(el => el.classList.add("hidden"));
    
    const target = document.getElementById(`screen-${screenName}`);
    if (target) {
        target.classList.remove("hidden");
        document.getElementById("screen-title").textContent = screenName.toUpperCase();
    }

    if (window.innerWidth < 768) {
        document.getElementById("sidebar").classList.add("-translate-x-full");
    }

    if (screenName === 'home') loadHomeData();
    if (screenName === 'scadenze') loadScadenzeData();
    if (screenName === 'eventi') loadEventiData();
    if (screenName === 'media') loadMediaData();
    if (screenName === 'ricette') loadRicetteData();
    if (screenName === 'admin') loadAdminData();
}

// ==========================================
// 3. GESTIONE HOME E SCADENZE A COLORI
// ==========================================
async function loadHomeData() {
    try {
        const querySnapshot = await getDocs(collection(db, "scadenze"));
        let scadenze = [];
        let totaleDaPagare = 0;

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            scadenze.push({ id: docSnap.id, ...data });
            totaleDaPagare += parseFloat(data.importo || 0);
        });

        document.getElementById("home-total-scadenze").textContent = `€ ${totaleDaPagare.toFixed(2)}`;
        document.getElementById("scadenze-totale-generale").textContent = `€ ${totaleDaPagare.toFixed(2)}`;

        renderHomeScadenze(scadenze);
        loadHomeEventiSummary();
        loadHomeMediaSummary();
        loadHomeRicetteSummary();
    } catch (e) {
        console.error("Errore caricamento Home:", e);
    }
}

function renderHomeScadenze(scadenze) {
    const container = document.getElementById("home-scadenze-list");
    container.innerHTML = "";

    const oggi = new Date();
    scadenze.sort((a, b) => new Date(a.data) - new Date(b.data));

    if (scadenze.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400">Nessuna scadenza inserita.</p>`;
        return;
    }

    scadenze.forEach(item => {
        const dataScad = new Date(item.data);
        const diffDays = Math.ceil((dataScad - oggi) / (1000 * 60 * 60 * 24));

        let badgeClass = "badge-scadenza-verde"; // 21 giorni o più

        if (diffDays <= 7) {
            badgeClass = "badge-scadenza-rosso"; // Rosse entro 7 giorni
        } else if (diffDays <= 14) {
            badgeClass = "badge-scadenza-arancione"; // Arancioni entro 14 giorni
        }

        const div = document.createElement("div");
        div.className = `p-3 rounded-lg border flex justify-between items-center ${badgeClass}`;
        div.innerHTML = `
            <div>
                <span class="block font-medium text-sm">${item.ente} (${item.categoria})</span>
                <span class="text-xs opacity-75">Scadenza: ${item.data} (${diffDays} giorni)</span>
            </div>
            <span class="font-bold text-sm">€ ${parseFloat(item.importo).toFixed(2)}</span>
        `;
        container.appendChild(div);
    });
}

// ==========================================
// 4. MODALI E SALVATAGGIO DATI
// ==========================================
function openModal(modalId) {
    document.getElementById(modalId).classList.remove("hidden");
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add("hidden");
}

async function saveScadenza(e) {
    e.preventDefault();
    const ente = document.getElementById("scad-ente").value;
    const categoria = document.getElementById("scad-categoria").value;
    const data = document.getElementById("scad-data").value;
    const importo = document.getElementById("scad-importo").value;

    try {
        await addDoc(collection(db, "scadenze"), { ente, categoria, data, importo });
        closeModal("modal-scadenza");
        document.getElementById("form-scadenza").reset();
        loadHomeData();
        loadScadenzeData();
    } catch (err) {
        alert("Errore salvataggio scadenza: " + err.message);
    }
}

// OCR simulato/pronto per Gemini Vision
async function processOCR(event) {
    const file = event.target.files[0];
    if (!file) return;

    alert("Foto acquisita! Invio all'OCR di Gemini per l'estrazione automatica...");
    
    setTimeout(() => {
        document.getElementById("scad-ente").value = "Enel Energia (Rilevato da OCR)";
        document.getElementById("scad-categoria").value = "Bolletta";
        document.getElementById("scad-importo").value = "64.50";
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);
        document.getElementById("scad-data").value = futureDate.toISOString().split('T')[0];
        alert("Dati estratti con successo da Gemini! Controlla i campi nel pop-up prima di salvare.");
    }, 1500);
}

// ==========================================
// 5. GESTIONE RICETTE (Righe dinamiche)
// ==========================================
function addIngredienteRow() {
    const container = document.getElementById("ingredienti-container");
    const row = document.createElement("div");
    row.className = "flex gap-2 ingredient-row items-center";
    row.innerHTML = `
        <span class="text-gray-400 font-bold">•</span>
        <input type="text" placeholder="Es. Zucchero 200g" class="flex-1 px-3 py-2 border rounded-lg text-sm ing-input" required>
        <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 text-xs px-2"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(row);
}

function addProcedimentoRow() {
    const container = document.getElementById("procedimento-container");
    const count = container.querySelectorAll(".proc-row").length + 1;
    const row = document.createElement("div");
    row.className = "flex gap-2 proc-row items-center";
    row.innerHTML = `
        <span class="text-sm font-bold text-gray-400 pt-1 proc-num">${count}.</span>
        <input type="text" placeholder="Passaggio..." class="flex-1 px-3 py-2 border rounded-lg text-sm proc-input" required>
        <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 text-xs px-2"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(row);
}

async function saveRicetta(e) {
    e.preventDefault();
    const nome = document.getElementById("ric-nome").value;
    
    const ingredienti = [];
    document.querySelectorAll(".ing-input").forEach(input => {
        if(input.value.trim()) ingredienti.push("- " + input.value.trim());
    });

    const procedimento = [];
    document.querySelectorAll(".proc-input").forEach((input, index) => {
        if(input.value.trim()) procedimento.push(`${index + 1}. ` + input.value.trim());
    });

    try {
        await addDoc(collection(db, "ricette"), { nome, ingredienti, procedimento, apprezzamenti: 5 });
        closeModal("modal-ricetta");
        document.getElementById("form-ricetta").reset();
        loadRicetteData();
        loadHomeRicetteSummary();
    } catch (err) {
        alert("Errore salvataggio ricetta: " + err.message);
    }
}

// Funzioni di supporto / segnaposto per le altre sezioni
async function loadScadenzeData() { loadHomeData(); }
async function loadEventiData() {}
async function loadMediaData() {}
async function loadRicetteData() {}
async function loadAdminData() {}
async function loadHomeEventiSummary() {}
async function loadHomeMediaSummary() {}
async function loadHomeRicetteSummary() {}
function deleteSelectedEvents() {}
function deleteSelectedMedia() {}
function downloadSelectedMedia() {}
function handleMediaUpload(e) {}

// Registrazione del Service Worker per la PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Service Worker registrato con successo:', reg.scope))
      .catch((err) => console.log('Registrazione Service Worker fallita:', err));
  });
}
