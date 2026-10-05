document.addEventListener('DOMContentLoaded', () => {
    // Riferimenti agli elementi DOM
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const togglePassword = document.getElementById('toggle-password');
    const logoutBtn = document.getElementById('logout-btn');

    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');

    // Gestione visibilità password nel login
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
            loginPassword.setAttribute('type', type);
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        });
    }

    // Toggle menu laterale
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('closed');
            sidebar.classList.toggle('open');
        });
    }

    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.add('closed');
            sidebar.classList.remove('open');
        });
    }

    // Navigazione tra le schermate
    const menuLinks = document.querySelectorAll('.sidebar-menu a');
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            switchScreen(targetId);
            if (window.innerWidth <= 768) {
                sidebar.classList.add('closed');
                sidebar.classList.remove('open');
            }
        });
    });

    // Controllo Autenticazione Firebase e Accesso Istantaneo
    if (window.auth) {
        window.auth.onAuthStateChanged((user) => {
            if (user) {
                loginScreen.classList.add('hidden');
                appContainer.classList.remove('hidden');
                setupUserSession(user);
            } else {
                // Controlla se c'è un accesso salvato in localStorage per renderlo istantaneo
                const savedUserEmail = localStorage.getItem('family_user_email');
                if (savedUserEmail) {
                    loginEmail.value = savedUserEmail;
                }
            }
        });
    }

    // Gestione Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginEmail.value.trim();
            const password = loginPassword.value;
            const rememberMe = document.getElementById('remember-me').checked;

            // Credenziali Admin fisse richieste da te
            if (email === 'stpa79@gmail.com' && password === 'sv058753') {
                if (rememberMe) {
                    localStorage.setItem('family_user_email', email);
                }
                loginScreen.classList.add('hidden');
                appContainer.classList.remove('hidden');
                setupAdminSession(email);
                return;
            }

            // Tentativo Firebase Authentication
            try {
                const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase/auth.js");
                await signInWithEmailAndPassword(window.auth, email, password);
                if (rememberMe) {
                    localStorage.setItem('family_user_email', email);
                }
            } catch (error) {
                alert("Errore di accesso: controlla username/email e password. " + error.message);
            }
        });
    }

    // Gestione Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                if (window.auth) {
                    const { signOut } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase/auth.js");
                    await signOut(window.auth);
                }
                localStorage.removeItem('family_user_email');
                appContainer.classList.add('hidden');
                loginScreen.classList.remove('hidden');
                loginPassword.value = '';
            } catch (error) {
                console.error("Errore durante il logout", error);
            }
        });
    }

    // Funzioni di sessione utente / admin
    function setupUserSession(user) {
        const email = user ? user.email : 'Utente';
        document.getElementById('welcome-message').textContent = `Ciao ${email.split('@')[0]}`;
        
        // Mostra pannello admin solo per l'amministratore
        const adminMenuItem = document.getElementById('admin-menu-item');
        if (email === 'stpa79@gmail.com') {
            if (adminMenuItem) adminMenuItem.classList.remove('hidden');
        } else {
            if (adminMenuItem) adminMenuItem.classList.add('hidden');
        }
        loadHomeData();
    }

    function setupAdminSession(email) {
        document.getElementById('welcome-message').textContent = `Ciao Stecca (Amministratore)`;
        const adminMenuItem = document.getElementById('admin-menu-item');
        if (adminMenuItem) adminMenuItem.classList.remove('hidden');
        loadHomeData();
    }

    // Funzione globale per cambiare schermata
    window.navigateTo = function(screenId) {
        document.querySelectorAll('.content-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.add('active');
            if (screenId === 'scadenze-screen') loadScadenze();
            if (screenId === 'eventi-screen') loadEventi();
            if (screenId === 'media-screen') loadMedia();
            if (screenId === 'ricette-screen') loadRicette();
            if (screenId === 'admin-screen') loadAdminPanel();
        }
    };

    function switchScreen(screenId) {
        window.navigateTo(screenId);
    }

    // --- LOGICA HOME E SCADENZE CON COLORI ---
    function loadHomeData() {
        // Dati di esempio per popolare la Home (in seguito collegabili a Firestore)
        const sampleBills = [
            id = 1, ente: "Enel Energia", data: "2026-10-10", importo: 75.50, // Scade tra 5 giorni (Rossa)
            id = 2, ente: "Bollo Auto", data: "2026-10-18", importo: 180.00,  // Scade tra 13 giorni (Arancione)
            id = 3, ente: "Assicurazione", data: "2026-11-05", importo: 450.00 // Scade tra 31 giorni (Verde/Normale)
        ];

        renderHomeBills(sampleBills);
        renderHomeEvents();
        renderHomeMedia();
        renderHomeRecipes();
    }

    function renderHomeBills(bills) {
        const container = document.getElementById('home-bills-summary');
        const totalSpan = document.getElementById('home-bills-total');
        if (!container) return;

        let total = 0;
        let html = '';
        const today = new Date();

        bills.forEach(bill => {
            total += bill.importo;
            const dueDate = new Date(bill.data);
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let colorClass = "color-normal";
            if (diffDays <= 7) {
                colorClass = "color-red"; // Scadenza entro 7 giorni -> Rosso
            } else if (diffDays <= 14) {
                colorClass = "color-orange"; // Scadenza entro 14 giorni -> Arancione
            } else {
                colorClass = "color-green"; // 21 giorni o più
            }

            html += `<div class="summary-item ${colorClass}">
                <span>${bill.ente} (${bill.data})</span>
                <strong>${bill.importo.toFixed(2)} €</strong>
            </div>`;
        });

        container.innerHTML = html;
        if (totalSpan) totalSpan.textContent = total.toFixed(2) + ' €';
        const scadenzeTotalAmount = document.getElementById('scadenze-total-amount');
        if (scadenzeTotalAmount) scadenzeTotalAmount.textContent = total.toFixed(2) + ' €';
    }

    function renderHomeEvents() {
        const container = document.getElementById('home-events-summary');
        if (container) {
            container.innerHTML = `<p>Nessun appuntamento imminente questa settimana.</p>`;
        }
    }

    function renderHomeMedia() {
        const container = document.getElementById('home-media-summary');
        if (container) {
            container.innerHTML = `<p style="font-size:12px; color:#70757a;">Nessun media recente.</p>`;
        }
    }

    function renderHomeRecipes() {
        const container = document.getElementById('home-recipes-summary');
        if (container) {
            container.innerHTML = `<p>1. Frollini della Nonna<br>2. Churros Tradizionali Fritti<br>3. Torta di Mele</p>`;
        }
    }

    // --- GESTIONE MODALI E PULSANTI ---
    const scadenzaModal = document.getElementById('scadenza-modal');
    const openScadenzaBtn = document.getElementById('open-new-scadenza-modal');
    const closeModalBtn = document.querySelector('.close-modal');

    if (openScadenzaBtn && scadenzaModal) {
        openScadenzaBtn.addEventListener('click', () => {
            scadenzaModal.classList.remove('hidden');
        });
    }

    if (closeModalBtn && scadenzaModal) {
        closeModalBtn.addEventListener('click', () => {
            scadenzaModal.classList.add('hidden');
        });
    }

    // Simulazione OCR Gemini tramite foto scattata o importata
    const takePhotoOcrBtn = document.getElementById('take-photo-ocr');
    const uploadPhotoOcrBtn = document.getElementById('upload-photo-ocr');
    const ocrFileInput = document.getElementById('ocr-file-input');

    if (takePhotoOcrBtn && ocrFileInput) {
        takePhotoOcrBtn.addEventListener('click', () => {
            ocrFileInput.setAttribute('capture', 'environment');
            ocrFileInput.click();
        });
    }

    if (uploadPhotoOcrBtn && ocrFileInput) {
        uploadPhotoOcrBtn.addEventListener('click', () => {
            ocrFileInput.removeAttribute('capture');
            ocrFileInput.click();
        });
    }

    if (ocrFileInput) {
        ocrFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                // Simulazione estrazione dati tramite OCR di Gemini
                alert("Foto acquisita! Invio all'OCR di Gemini per l'estrazione automatica di Ente, Scadenza e Importo...");
                setTimeout(() => {
                    document.getElementById('scadenza-ente').value = "Bolletta Esempio OCR";
                    document.getElementById('scadenza-data').value = "2026-10-25";
                    document.getElementById('scadenza-importo').value = "45.00";
                }, 1000);
            }
        });
    }

    // Funzioni segnaposto per le altre schermate
    function loadScadenze() { console.log("Caricamento schermata Scadenze"); }
    function loadEventi() { console.log("Caricamento schermata Eventi"); }
    function loadMedia() { console.log("Caricamento schermata Media"); }
    function loadRicette() { console.log("Caricamento schermata Ricette"); }
    function loadAdminPanel() { console.log("Caricamento pannello Admin"); }
});
