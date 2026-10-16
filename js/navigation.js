// js/navigation.js - Gestione Sidebar e Navigazione tra Sezioni

export function initNavigation(onSectionChange) {
    const btnToggleMenu = document.getElementById('btn-toggle-menu');
    const btnCloseMenu = document.getElementById('btn-close-menu');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.app-section');
    const headerTitle = document.getElementById('header-title');

    function openMenu() {
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.classList.add('active');
    }

    function closeMenu() {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }

    if (btnToggleMenu) btnToggleMenu.addEventListener('click', openMenu);
    if (btnCloseMenu) btnCloseMenu.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

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

            if (headerTitle) {
                switch(targetSection) {
                    case 'impegni': headerTitle.textContent = "📅 Appuntamenti"; break;
                    case 'scadenze': headerTitle.textContent = "⏰ Scadenze"; break;
                    case 'ricette': headerTitle.textContent = "🍳 Ricette"; break;
                    case 'media': headerTitle.textContent = "🖼️ Foto e Video"; break;
                }
            }

            closeMenu();

            if (onSectionChange) {
                onSectionChange(targetSection);
            }
        });
    });
}
