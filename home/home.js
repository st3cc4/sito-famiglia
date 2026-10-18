// --- 1. Controllo Autenticazione e Permessi all'avvio ---
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('famiglia_pwa_user') || sessionStorage.getItem('famiglia_pwa_user');
    
    if (!savedUser) {
        window.location.href = '../index.html';
        return;
    }

    const userData = JSON.parse(savedUser);
    
    const userDisplayName = document.getElementById('user-display-name');
    if (userDisplayName) {
        userDisplayName.textContent = userData.nome;
        if (userData.colore) {
            userDisplayName.style.backgroundColor = userData.colore;
        }
    }

    const sidebarUsername = document.getElementById('sidebar-username');
    const sidebarUserRole = document.getElementById('sidebar-user-role');
    
    if (sidebarUsername) sidebarUsername.textContent = userData.nome;
    
    const isAdmin = (userData.ruolo === 'admin' || (userData.nome && userData.nome.toLowerCase() === 'paolo'));
    if (sidebarUserRole) sidebarUserRole.textContent = isAdmin ? 'Admin' : 'Utente';

    if (isAdmin) {
        const adminMenuItem = document.getElementById('admin-menu-item');
        if (adminMenuItem) {
            adminMenuItem.style.display = 'block';
        }
    }

    initNavigation();
});

// --- 2. Gestione Sidebar (Espandi / Contrai) ---
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function toggleSidebar() {
    if (window.innerWidth <= 768) {
        if (sidebar) sidebar.classList.toggle('open');
        if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
    } else {
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
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const target = button.getAttribute('data-target');
            const navTextSpan = button.querySelector('.nav-text');
            const navText = navTextSpan ? navTextSpan.textContent.trim() : 'HOME';
            
            if (pageTitle) {
                pageTitle.textContent = `FAMIGLIA - ${navText.toUpperCase()}`;
            }
            document.title = `FAMIGLIA - ${navText.toUpperCase()}`;

            loadSectionContent(target, contentArea);

            if (window.innerWidth <= 768) {
                if (sidebar) sidebar.classList.remove('open');
                if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            }
        });
    });

    if (pageTitle) {
        pageTitle.textContent = 'FAMIGLIA - HOME';
    }

    loadSectionContent('dashboard', contentArea);
}

// Funzione per caricare le differenti schermate nella tela centrale
function loadSectionContent(target, container) {
    if (!container) return;

    switch (target) {
        case 'dashboard':
            renderDashboard(container);
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

// --- 5. Logica di Rendering della DASHBOARD con le Card Riassuntive ---
function renderDashboard(container) {
    // Dati di esempio (mock) per le card - in seguito collegati a Firestore
    const scadenzeData = [
        { titolo: 'Bolletta Enel', giorniMancanti: 4 }, // Rosso (<= 7)
        { titolo: 'Assicurazione Auto', giorniMancanti: 12 }, // Arancione (8-14)
        { titolo: 'Revisione caldaia', giorniMancanti: 20 }  // Verde (>= 15)
    ];

    const impegniData = [
        { titolo: 'Visita Medica', data: 'Questa settimana', coloreUtente: '#3498db' },
        { titolo: 'Riunione Scuola', data: 'Questa settimana', coloreUtente: '#e67e22' }
    ];

    const mediaData = [
        'https://picsum.photos/seed/fam1/200',
        'https://picsum.photos/seed/fam2/200',
        'https://picsum.photos/seed/fam3/200',
        'https://picsum.photos/seed/fam4/200',
        'https://picsum.photos/seed/fam5/200'
    ];

    const ricetteData = [
        { titolo: 'Torta di Mele della Nonna', stelle: '★★★★★' },
        { titolo: 'Lasagne alla Bolognese', stelle: '★★★★★' },
        { titolo: 'Pizza Fatta in Casa', stelle: '★★★★☆' }
    ];

    // Calcolo Scadenze con priorità (Rosso <= 7, Arancione 8-14, Verde >= 15)
    let scadenzeFiltrate = scadenzeData.filter(s => s.giorniMancanti <= 7);
    let coloreScadenza = 'red';
    
    if (scadenzeFiltrate.length === 0) {
        scadenzeFiltrate = scadenzeData.filter(s => s.giorniMancanti >= 8 && s.giorniMancanti <= 14);
        coloreScadenza = 'orange';
    }
    if (scadenzeFiltrate.length === 0) {
        scadenzeFiltrate = scadenzeData.filter(s => s.giorniMancanti >= 15);
        coloreScadenza = 'green';
    }

    container.innerHTML = `
        <h2>Benvenuto nella Famiglia</h2>
        <p style="margin-bottom: 20px; color: var(--text-muted);">Panoramica rapida delle attività di famiglia.</p>
        
        <div class="dashboard-grid">
            <!-- 1. CARD SCADENZE -->
            <div class="card">
                <div class="card-header">
                    <h3><i class="fa-solid fa-file-invoice-dollar"></i> SCADENZE</h3>
                </div>
                <div class="card-body">
                    ${scadenzeFiltrate.length > 0 ? `
                        <ul class="scadenze-list">
                            ${scadenzeFiltrate.map(s => `
                                <li class="scadenza-item ${coloreScadenza}">
                                    <span>${s.titolo}</span>
                                    <span>Tra ${s.giorniMancanti} gg</span>
                                </li>
                            `).join('')}
                        </ul>
                    ` : `<p class="card-empty">Nessuna scadenza in evidenza</p>`}
                </div>
            </div>

            <!-- 2. CARD IMPEGNI -->
            <div class="card">
                <div class="card-header">
                    <h3><i class="fa-solid fa-calendar-days"></i> IMPEGNI</h3>
                </div>
                <div class="card-body">
                    ${impegniData.length > 0 ? `
                        <ul class="impegni-list">
                            ${impegniData.map(i => `
                                <li class="impegno-item" style="background-color: ${i.coloreUtente};">
                                    <span>${i.titolo}</span>
                                    <span style="font-size: 0.75rem; opacity: 0.9;">${i.data}</span>
                                </li>
                            `).join('')}
                        </ul>
                    ` : `<p class="card-empty">Nessun impegno per questa settimana</p>`}
                </div>
            </div>

            <!-- 3. CARD FOTO & VIDEO -->
            <div class="card">
                <div class="card-header">
                    <h3><i class="fa-solid fa-photo-film"></i> FOTO & VIDEO</h3>
                </div>
                <div class="card-body">
                    ${mediaData.length > 0 ? `
                        <div class="media-grid-preview">
                            ${mediaData.map(img => `<img src="${img}" class="media-thumb" alt="Anteprima media">`).join('')}
                        </div>
                    ` : `<p class="card-empty">Nessun contenuto multimediale recente</p>`}
                </div>
            </div>

            <!-- 4. CARD RICETTE -->
            <div class="card">
                <div class="card-header">
                    <h3><i class="fa-solid fa-utensils"></i> RICETTE</h3>
                </div>
                <div class="card-body">
                    ${ricetteData.length > 0 ? `
                        <ul class="ricette-list">
                            ${ricetteData.map(r => `
                                <li class="ricetta-item">
                                    <span>${r.titolo}</span>
                                    <span class="ricetta-rating">${r.stelle}</span>
                                </li>
                            `).join('')}
                        </ul>
                    ` : `<p class="card-empty">Nessuna ricetta salvata</p>`}
                </div>
            </div>
        </div>
    `;
}
