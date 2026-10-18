// --- 1. Controllo Autenticazione e Permessi all'avvio ---
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('famiglia_pwa_user') || sessionStorage.getItem('famiglia_pwa_user');
    
    if (!savedUser) {
        // Se non c'è nessun utente loggato, torna al login
        window.location.href = '../index.html';
        return;
    }

    const userData = JSON.parse(savedUser);
    
    // Mostra il nome dell'utente e il colore nell'header
    const userDisplayName = document.getElementById('user-display-name');
    if (userDisplayName) {
        userDisplayName.textContent = userData.nome;
        if (userData.colore) {
            userDisplayName.style.backgroundColor = userData.colore;
        }
    }

    // Compila il box utente in basso nella sidebar
    const sidebarUsername = document.getElementById('sidebar-username');
    const sidebarUserRole = document.getElementById('sidebar-user-role');
    
    if (sidebarUsername) sidebarUsername.textContent = userData.nome;
    
    const isAdmin = (userData.ruolo === 'admin' || (userData.nome && userData.nome.toLowerCase() === 'paolo'));
    if (sidebarUserRole) sidebarUserRole.textContent = isAdmin ? 'Admin' : 'Utente';

    // Se l'utente è Admin, mostra la voce "GESTIONE UTENTI"
    if (isAdmin) {
        const adminMenuItem = document.getElementById('admin-menu-item');
        if (adminMenuItem) {
            adminMenuItem.style.display = 'block';
        }
    }

    // Inizializza la navigazione dinamica
    initNavigation();
});

// --- 2. Gestione Sidebar (Espandi / Contrai) ---
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function toggleSidebar() {
    if (window.innerWidth <= 768) {
        // Su dispositivi mobili apre e chiude il drawer con overlay
        if (sidebar) sidebar.classList.toggle('open');
        if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
    } else {
        // Su Desktop commuta tra contratta (solo icone) ed espansa
        if (sidebar) sidebar.classList.toggle('collapsed');
    }
}

if (btnToggleSidebar) btnToggleSidebar.addEventListener('click', toggleSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

// --- 3. Gestione Logout ---
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('famiglia_pwa_user');
        sessionStorage.removeItem('famiglia_pwa_user');
        window.location.href = '../index.html';
    });
}

// --- 4. Navigazione Dinamica (La Tela Centrale) ---
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const contentArea = document.getElementById('content-area');
    const pageTitle = document.getElementById('page-title');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Rimuovi active da tutti i bottoni e imposta quello selezionato
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const target = button.getAttribute('data-target');
            const navTextSpan = button.querySelector('.nav-text');
            const navText = navTextSpan ? navTextSpan.textContent.trim() : 'HOME';
            
            // Imposta RIGOROSAMENTE l'intestazione nel formato: FAMIGLIA - [NOME SCHEDA]
            if (pageTitle) {
                pageTitle.textContent = `FAMIGLIA - ${navText.toUpperCase()}`;
            }

            // Aggiorna anche il titolo del documento del browser
            document.title = `FAMIGLIA - ${navText.toUpperCase()}`;

            // Carica la schermata selezionata sulla tela centrale
            loadSectionContent(target, contentArea);

            // Su mobile chiudi la sidebar al clic
            if (window.innerWidth <= 768) {
                if (sidebar) sidebar.classList.remove('open');
                if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            }
        });
    });

    // Imposta il titolo iniziale all'avvio
    if (pageTitle) {
        pageTitle.textContent = 'FAMIGLIA - HOME';
    }

    // Carica la dashboard iniziale
    loadSectionContent('dashboard', contentArea);
}

// Funzione per caricare le differenti schermate nella tela centrale
function loadSectionContent(target, container) {
    if (!container) return;

    switch (target) {
        case 'dashboard':
            container.innerHTML = `
                <h2>Benvenuto nella Famiglia</h2>
                <p>Questa è la tua dashboard principale. Da qui puoi accedere a tutte le funzionalità riservate alla famiglia.</p>
            `;
            break;
        case 'scadenze':
            container.innerHTML = `
                <h2>Gestione Scadenze</h2>
                <p>Sezione per le scadenze e le bollette.</p>
            `;
            break;
        case 'impegni':
            container.innerHTML = `
                <h2>Gestione Impegni</h2>
                <p>Sezione dedicata agli impegni e appuntamenti di famiglia.</p>
            `;
            break;
        case 'media':
            container.innerHTML = `
                <h2>Foto & Video</h2>
                <p>Raccolta multimediale della famiglia.</p>
            `;
            break;
        case 'ricette':
            container.innerHTML = `
                <h2>Ricettario di Famiglia</h2>
                <p>Sezione per visualizzare e salvare le ricette preferite.</p>
            `;
            break;
        case 'gestione-utenti':
            container.innerHTML = `
                <h2>Gestione Utenti (Pannello Admin)</h2>
                <p>Qui l'amministratore può gestire gli utenti, i ruoli e i permessi.</p>
            `;
            break;
        case 'cambia-password':
            container.innerHTML = `
                <h2>Cambia Password</h2>
                <p>Pannello per aggiornare la propria password di accesso.</p>
            `;
            break;
        case 'cambia-colore':
            container.innerHTML = `
                <h2>Cambia Colore</h2>
                <p>Pannello per personalizzare il proprio colore utente.</p>
            `;
            break;
        default:
            container.innerHTML = `<h2>Sezione non trovata</h2>`;
    }
}
