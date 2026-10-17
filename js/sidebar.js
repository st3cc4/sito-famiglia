// js/sidebar.js - Gestione Apertura/Chiusura Sidebar

const sidebar = document.getElementById('sidebar');
const btnToggleMenu = document.getElementById('btn-toggle-menu');
const overlay = document.getElementById('overlay');

export function initSidebar() {
    if (btnToggleMenu) {
        btnToggleMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            chiudiSidebar();
        });
    }
}

export function toggleSidebar() {
    if (!sidebar) return;
    sidebar.classList.toggle('open');
    if (overlay) {
        if (sidebar.classList.contains('open')) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
}

export function chiudiSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
}
