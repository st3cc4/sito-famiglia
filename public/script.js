// Import delle funzioni SDK Firebase (configurazione presa dai tuoi dati)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut, 
    setPersistence, 
    browserLocalPersistence, 
    browserSessionPersistence 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addTimestamp, 
    getDocs, 
    addDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configurazione Firebase fornita da te
const firebaseConfig = {
    apiKey: "AIzaSyAtMnKhhfC43J73kVm8-QCNghqzOTV6UKA",
    authDomain: "sito-famiglia.firebaseapp.com",
    projectId: "sito-famiglia",
    storageBucket: "sito-famiglia.appspot.com",
    messagingSenderId: "9321647751",
    appId: "1:9321647751:web:993005284551ca5ef895a",
    measurementId: "G-NYRQJDTWM3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Utente Admin predefinito richiesto
const ADMIN_EMAIL = "stpa79@gmail.com";
const ADMIN_PASS = "sv058753";

document.addEventListener("DOMContentLoaded", () => {

    // --- GESTIONE VISIBILITA PASSWORD ---
    const togglePwd = document.getElementById("toggle-pwd");
    const pwdInput = document.getElementById("login-password");
    if(togglePwd) {
        togglePwd.addEventListener("click", () => {
            if (pwdInput.type === "password") {
                pwdInput.type = "text";
                togglePwd.classList.replace("fa-eye-slash", "fa-eye");
            } else {
                pwdInput.type = "password";
                togglePwd.classList.replace("fa-eye", "fa-eye-slash");
            }
        });
    }

    // --- ACCESSO E PERSISTENZA ---
    const loginBtn = document.getElementById("login-btn");
    if(loginBtn) {
        loginBtn.addEventListener("click", async () => {
            const email = document.getElementById("login-email").value.trim();
            const password = pwdInput.value;
            const rememberMe = document.getElementById("remember-me").checked;

            try {
                // Imposta persistenza in base a "Ricordami"
                const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
                await setPersistence(auth, persistence);

                // Controllo accesso admin diretto o Firebase Auth
                if(email === ADMIN_EMAIL && password === ADMIN_PASS) {
                    // Accesso amministratore simulato/effettivo
                    initAppSession({ email: ADMIN_EMAIL, displayName: "Stecca" });
                } else {
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    initAppSession(userCredential.user);
                }
            } catch (error) {
                alert("Errore di accesso: " + error.message);
            }
        });
    }

    // Controllo automatico accesso (Accesso istantaneo dal secondo accesso in poi se ricordato)
    onAuthStateChanged(auth, (user) => {
        if (user) {
            initAppSession(user);
        }
    });

    function initAppSession(user) {
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("app-container").classList.remove("hidden");
        
        const userName = user.email === ADMIN_EMAIL ? "Stecca" : (user.displayName || user.email.split('@')[0]);
        document.getElementById("welcome-msg").textContent = `Ciao ${userName}`;

        // Mostra menu Admin se è l'amministratore
        if(user.email === ADMIN_EMAIL) {
            document.getElementById("admin-menu-item").classList.remove("hidden");
        }

        loadDashboardData();
    }

    // Logout
    const logoutBtn = document.getElementById("logout-btn");
    if(logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await signOut(auth);
            location.reload();
        });
    }

    // --- MENU LATERALE ---
    const sidebar = document.getElementById("sidebar");
    document.getElementById("toggle-sidebar").addEventListener("click", () => sidebar.classList.add("open"));
    document.getElementByIdCertamente Stecca! È assolutamente possibile creare un'applicazione web progressiva (PWA) per la famiglia con tutte le caratteristiche che hai descritto. 

Rispondendo prima alle tue domande preliminari:
1. **Nomi dei file**: I nomi corretti e standard sono al singolare, ovvero **`index.html`**, **`style.css`** e **`script.js`**.
2. **Codice completo**: Visto che hai bisogno di tutto il codice dall'inizio alla fine, ti fornirò i tre file completi e pronti da caricare su GitHub e Firebase.

Ecco tutto il codice strutturato appositamente per adattarsi ai telefoni con schede verticali, un menu laterale a scomparsa, il login persistente, la gestione delle scadenze con colori condizionali, i popup per le ricette e gli eventi, la gestione amministrativa e la firma finale come richiesto.

---

### 1. `index.html`
Crea un file chiamato `index.html` e incolla questo codice:

```html
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portale Famiglia</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="[https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css](https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css)">
    <link rel="manifest" href="manifest.json">
</head>
<body>

    <!-- SCHERMATA LOGIN -->
    <div id="login-screen" class="screen active">
        <div class="login-container">
            <h2>Accesso Portale Famiglia</h2>
            <form id="login-form">
                <div class="input-group">
                    <label for="login-user">Username o email</label>
                    <input type="text" id="login-user" required autocomplete="username">
                </div>
                <div class="input-group password-group">
                    <label for="login-pass">Password</label>
                    <div class="password-wrapper">
                        <input type="password" id="login-pass" required autocomplete="current-password">
                        <button type="button" id="toggle-password" class="icon-btn"><i class="fa-solid fa-eye-slash"></i></button>
                    </div>
                </div>
                <div class="remember-group">
                    <input type="checkbox" id="remember-me" checked>
                    <label for="remember-me">Ricordami</label>
                </div>
                <button type="submit" class="btn-primary">Accedi</button>
            </form>
        </div>
    </div>

    <!-- APP PRINCIPALE -->
    <div id="app-container" class="hidden">
        
        <!-- HEADER -->
        <header class="app-header">
            <button id="menu-toggle" class="icon-btn"><i class="fa-solid fa-bars"></i></button>
            <h1 id="app-title">HOME</h1>
            <div class="header-right">
                <a href="[https://gemini.google.com](https://gemini.google.com)" target="_blank" class="ai-link" title="Parla con Gemini"><i class="fa-solid fa-wand-magic-sparkles"></i></a>
            </div>
        </header>

        <!-- MENU LATERALE -->
        <nav id="sidebar" class="sidebar">
            <div class="sidebar-header">
                <h3>Menu</h3>
                <button id="sidebar-close" class="icon-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <ul class="sidebar-menu">
                <li data-target="home" class="active"><i class="fa-solid fa-house"></i> Home</li>
                <li data-target="scadenze"><i class="fa-solid fa-file-invoice-dollar"></i> Scadenze</li>
                <li data-target="eventi"><i class="fa-solid fa-calendar-days"></i> Eventi</li>
                <li data-target="media"><i class="fa-solid fa-photo-film"></i> Media</li>
                <li data-target="ricette"><i class="fa-solid fa-utensils"></i> Ricette</li>
                <li id="admin-menu-item" data-target="admin" class="hidden"><i class="fa-solid fa-user-shield"></i> Admin</li>
                <li id="logout-btn"><i class="fa-solid fa-right-from-bracket"></i> Esci</li>
            </ul>
        </nav>
        <div id="sidebar-overlay" class="overlay"></div>

        <!-- CONTENUTO DELLE SCHERMATE -->
        <main class="main-content">

            <!-- SCHERMATA HOME -->
            <section id="screen-home" class="page-section active">
                <div class="welcome-box">
                    <h2 id="welcome-msg">Ciao</h2>
                </div>
                
                <div class="cards-container">
                    <!-- Scheda Scadenze -->
                    <div class="card vertical-card">
                        <div class="card-header">
                            <h3>Scadenze</h3>
                            <a href="#" class="nav-link-shortcut" data-target="scadenze">Vai <i class="fa-solid fa-arrow-right"></i></a>
                        </div>
                        <div id="home-scadenze-content" class="card-body"></div>
                        <div class="card-footer-right">
                            <span id="home-total-scadenze">Totale: 0,00 €</span>
                        </div>
                    </div>

                    <!-- Scheda Eventi -->
                    <div class="card vertical-card">
                        <div class="card-header">
                            <h3>Appuntamenti della settimana</h3>
                            <a href="#" class="nav-link-shortcut" data-target="eventi">Vai <i class="fa-solid fa-arrow-right"></i></a>
                        </div>
                        <div id="home-eventi-content" class="card-body"></div>
                    </div>

                    <!-- Scheda Media -->
                    <div class="card vertical-card">
                        <div class="card-header">
                            <h3>Ultimi Media</h3>
                            <a href="#" class="nav-link-shortcut" data-target="media">Vai <i class="fa-solid fa-arrow-right"></i></a>
                        </div>
                        <div id="home-media-content" class="card-body media-grid-preview"></div>
                    </div>

                    <!-- Scheda Ricette -->
                    <div class="card vertical-card">
                        <div class="card-header">
                            <h3>Ricette più apprezzate</h3>
                            <a href="#" class="nav-link-shortcut" data-target="ricette">Vai <i class="fa-solid fa-arrow-right"></i></a>
                        </div>
                        <div id="home-ricette-content" class="card-body"></div>
                    </div>
                </div>
            </section>

            <!-- SCHERMATA SCADENZE -->
            <section id="screen-scadenze" class="page-section">
                <div class="section-top-bar">
                    <button class="btn-secondary btn-home"><i class="fa-solid fa-house"></i> Home</button>
                    <div class="total-badge">Totale: <span id="scadenze-totale-generale">0,00 €</span></div>
                    <button id="open-new-scadenza" class="btn-primary">Nuova scadenza</button>
                </div>
                <div id="scadenze-list" class="list-container"></div>
            </section>

            <!-- SCHERMATA EVENTI -->
            <section id="screen-eventi" class="page-section">
                <div class="section-top-bar">
                    <button class="btn-secondary btn-home"><i class="fa-solid fa-house"></i> Home</button>
                    <button id="open-new-evento" class="btn-primary">Aggiungi evento</button>
                    <button id="delete-selected-eventi" class="btn-danger">Cancella selezionati</button>
                </div>
                <div id="eventi-list" class="list-container"></div>
            </section>

            <!-- SCHERMATA MEDIA -->
            <section id="screen-media" class="page-section">
                <div class="section-top-bar">
                    <button class="btn-secondary btn-home"><i class="fa-solid fa-house"></i> Home</button>
                    <input type="file" id="media-file-input" multiple accept="image/*,video/*" class="hidden">
                    <button id="import-media-btn" class="btn-primary">Importa foto/video</button>
                    <button id="download-selected-media" class="btn-secondary">Scarica selezionati</button>
                    <button id="delete-selected-media" class="btn-danger">Cancella selezionati</button>
                </div>
                <div id="media-grid" class="media-grid"></div>
            </section>

            <!-- SCHERMATA RICETTE -->
            <section id="screen-ricette" class="page-section">
                <div class="section-top-bar">
                    <button class="btn-secondary btn-home"><i class="fa-solid fa-house"></i> Home</button>
                    <button id="open-new-ricetta" class="btn-primary">Nuova Ricetta</button>
                </div>
                <div id="ricette-list" class="list-container"></div>
            </section>

            <!-- SCHERMATA ADMIN -->
            <section id="screen-admin" class="page-section">
                <div class="section-top-bar">
                    <button class="btn-secondary btn-home"><i class="fa-solid fa-house"></i> Home</button>
                </div>
                <div class="admin-container">
                    <h2>Gestione Membri Famiglia</h2>
                    <form id="add-member-form">
                        <div class="input-group">
                            <label>Email / ID</label>
                            <input type="email" id="new-member-email" required>
                        </div>
                        <div class="input-group">
                            <label>Password</label>
                            <input type="password" id="new-member-pass" required>
                        </div>
                        <div class="input-group">
                            <label>Permessi di visualizzazione</label>
                            <div class="checkbox-group">
                                <label><input type="checkbox" name="perm" value="scadenze" checked> Scadenze</label>
                                <label><input type="checkbox" name="perm" value="eventi" checked> Eventi</label>
                                <label><input type="checkbox" name="perm" value="media" checked> Media</label>
                                <label><input type="checkbox" name="perm" value="ricette" checked> Ricette</label>
                            </div>
                        </div>
                        <button type="submit" class="btn-primary">Aggiungi membro</button>
                    </form>
                    <div id="members-list" class="list-container"></div>
                </div>
            </section>

        </main>

        <!-- FOOTER FIRMA -->
        <footer class="app-footer">
            <span>Created by STECCA with GEMINI</span>
        </footer>
    </div>

    <!-- POPUP NUOVA SCADENZA -->
    <div id="modal-scadenza" class="modal">
        <div class="modal-content">
            <h3>Nuova Scadenza</h3>
            <form id="form-scadenza">
                <div class="input-group">
                    <label>Ente / Titolo</label>
                    <input type="text" id="scad-ente" required>
                </div>
                <div class="input-group">
                    <label>Data Scadenza</label>
                    <input type="date" id="scad-data" required>
                </div>
                <div class="input-group">
                    <label>Importo (€)</label>
                    <input type="number" step="0.01" id="scad-importo" required>
                </div>
                <div class="input-group">
                    <label>Fotografa / Importa bolletta per OCR</label>
                    <div class="ocr-buttons">
                        <input type="file" id="ocr-camera" accept="image/*" capture="environment" class="hidden">
                        <input type="file" id="ocr-gallery" accept="image/*" class="hidden">
                        <button type="button" id="btn-shoot-ocr" class="btn-secondary"><i class="fa-solid fa-camera"></i> Scatta foto</button>
                        <button type="button" id="btn-upload-ocr" class="btn-secondary"><i class="fa-solid fa-upload"></i> Importa foto</button>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary close-modal">Annulla</button>
                    <button type="submit" class="btn-primary">Salva</button>
                </div>
            </form>
        </div>
    </div>

    <!-- POPUP NUOVO EVENTO -->
    <div id="modal-evento" class="modal">
        <div class="modal-content">
            <h3>Nuovo Evento</h3>
            <form id="form-evento">
                <div class="input-group">
                    <label>Titolo Evento</label>
                    <input type="text" id="ev-titolo" required>
                </div>
                <div class="input-group">
                    <label>Data e Ora</label>
                    <input type="datetime-local" id="ev-data" required>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary close-modal">Annulla</button>
                    <button type="submit" class="btn-primary">Salva</button>
                </div>
            </form>
        </div>
    </div>

    <!-- POPUP NUOVA RICETTA -->
    <div id="modal-ricetta" class="modal">
        <div class="modal-content large-modal">
            <h3>Nuova Ricetta</h3>
            <form id="form-ricetta">
                <div class="input-group">
                    <label>Nome Ricetta</label>
                    <input type="text" id="ric-nome" required>
                </div>
                
                <div class="input-group">
                    <label>Ingredienti (con quantità in grammi)</label>
                    <div id="ingredienti-container">
                        <div class="dynamic-row">
                            <input type="text" placeholder="es. Farina - 500g" class="ing-input" required>
                        </div>
                    </div>
                    <button type="button" id="add-ing-row" class="btn-text">Aggiungi un altro ingrediente</button>
                </div>

                <div class="input-group">
                    <label>Procedimento</label>
                    <div id="procedimento-container">
                        <div class="dynamic-row num-row">
                            <span class="step-number">1.</span>
                            <input type="text" placeholder="Descrivi il passaggio..." class="proc-input" required>
                        </div>
                    </div>
                    <button type="button" id="add-proc-row" class="btn-text">Aggiungi un altro passaggio</button>
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn-secondary close-modal">Annulla</button>
                    <button type="submit" class="btn-primary">Salva</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Script Firebase e App -->
    <script type="module" src="script.js"></script>
</body>
</html>
