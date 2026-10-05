import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

// Configurazione Firebase dal tuo progetto
const firebaseConfig = {
  apiKey: "AIzaSyAtMnKhhfC43J73kVm8-QcNghqzOTV6UKA",
  authDomain: "sito-famiglia.firebaseapp.com",
  projectId: "sito-famiglia",
  storageBucket: "sito-famigliastorage.app",
  messagingSenderId: "93216467751",
  appId: "1:93216467751:web:993005284551ca5ef895a",
  measurementId: "G-NYRQJDTWM3"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Account Admin richiesto
const ADMIN_EMAIL = "stpa79@gmail.com";
const ADMIN_PASS = "sv058753";

// Gestione Stato Accesso Istantaneo (LocalStorage)
document.addEventListener("DOMContentLoaded", () => {
  const savedUser = localStorage.getItem("famiglia_logged_user");
  if (savedUser) {
    avviaApp(JSON.parse(savedUser));
  }

  // Mostra/Nascondi password
  document.getElementById("toggle-pass").addEventListener("click", () => {
    const passInput = document.getElementById("login-pass");
    passInput.type = passInput.type === "password" ? "text" : "password";
  });

  // Login click
  document.getElementById("login-btn").addEventListener("click", () => {
    const user = document.getElementById("login-user").value.trim();
    const pass = document.getElementById("login-pass").value.trim();
    const remember = document.getElementById("remember-me").checked;

    if ((user === ADMIN_EMAIL || user === "Stecca" || user === "stpa79") && pass === ADMIN_PASS) {
      const userData = { name: "Stecca", email: ADMIN_EMAIL, isAdmin: true };
      if (remember) localStorage.setItem("famiglia_logged_user", JSON.stringify(userData));
      avviaApp(userData);
    } else {
      alert("Credenziali non valide. Riprova.");
    }
  });

  // Logout
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("famiglia_logged_user");
    location.reload();
  });

  // Navigazione Menu Laterale e Link
  document.getElementById("toggle-sidebar").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });
  document.getElementById("close-sidebar").addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("open");
  });

  // Gestione cambio schermate
  const navLinks = document.querySelectorAll(".sidebar a[data-target], .nav-link-card, .back-home-btn");
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("data-target");
      if (!targetId) return;

      document.querySelectorAll(".section").forEach(sec => sec.classList.add("hidden"));
      document.getElementById(targetId).classList.remove("hidden");
      document.getElementById("sidebar").classList.remove("open");
    });
  });

  // Modali aperture e chiusure
  setupModals();
  caricaDatiDemo();
});

function avviaApp(user) {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("app-screen").classList.remove("hidden");
  document.getElementById("welcome-msg").innerText = `Ciao ${user.name}`;

  if (user.isAdmin) {
    document.getElementById("admin-menu-item").classList.remove("hidden");
  }
}

function setupModals() {
  // Scadenza Modal
  document.getElementById("open-scadenza-modal").addEventListener("click", () => {
    document.getElementById("scadenza-modal").classList.remove("hidden");
  });
  // Evento Modal
  document.getElementById("open-evento-modal").addEventListener("click", () => {
    document.getElementById("evento-modal").classList.remove("hidden");
  });
  // Ricetta Modal
  document.getElementById("open-ricetta-modal").addEventListener("click", () => {
    document.getElementById("ricetta-modal").classList.remove("hidden");
  });

  // Chiudi modali
  document.querySelectorAll(".close-modal-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
    });
  });

  // Dinamicità righe Ricette (Ingredienti e Procedimento)
  document.getElementById("add-ing-row").addEventListener("click", () => {
    const container = document.getElementById("ingredienti-container");
    const row = document.createElement("div");
    row.className = "dyn-row";
    row.innerHTML = `<input type="text" class="ing-nome" placeholder="Ingrediente"><input type="number" class="ing-qta" placeholder="Grammi">`;
    container.appendChild(row);
  });

  document.getElementById("add-proc-row").addEventListener("click", () => {
    const container = document.getElementById("procedimento-container");
    const row = document.createElement("div");
    row.className = "dyn-row";
    row.innerHTML = `<textarea class="proc-step" placeholder="Passaggio successivo"></textarea>`;
    container.appendChild(row);
  });

  // Simulazione OCR Gemini su bolletta
  document.getElementById("run-ocr-btn").addEventListener("click", () => {
    // Qui puoi collegare la foto acquisita all'input per estrazione dati automatica
    document.getElementById("scad-ente").value = "Enel Energia (Estratto OCR)";
    document.getElementById("scad-importo").value = "65.50";
    document.getElementById("scad-data").value = "2026-10-12";
    alert("Dati estratti con successo tramite OCR!");
  });
}

function caricaDatiDemo() {
  // Esempio calcolo scadenze e totali dinamici
  const scadenze = [
    { ente: "Enel Bolletta", importo: 50.00, data: "2026-10-08" }, // 3 giorni -> Rosso
    { ente: "Bollo Auto", importo: 180.00, data: "2026-10-15" }   // 10 giorni -> Arancione
  ];

  let totaleScadenze = scadenze.reduce((acc, curr) => acc + curr.importo, 0);
  document.getElementById("all-scadenze-totale").innerText = `Totale: ${totaleScadenze.toFixed(2)} €`;
  document.getElementById("home-totale-scadenze").innerText = `Totale: ${totaleScadenze.toFixed(2)} €`;

  const scadList = document.getElementById("scadenze-list");
  scadList.innerHTML = "";
  scadenze.forEach(s => {
    const div = document.createElement("div");
    div.className = "scadenza-item colore-rosso";
    div.innerHTML = `<span><strong>${s.ente}</strong> - Scadenza: ${s.data}</span><span><strong>${s.importo.toFixed(2)} €</strong></span>`;
    scadList.appendChild(div);
  });
}
