// Gestione Banner PWA (Chiusura e Installazione)
export function initPwaBanner() {
    const banner = document.getElementById('pwa-install-banner');
    const btnClose = document.getElementById('pwa-btn-close');
    const btnInstall = document.getElementById('pwa-btn-install');

    // Controlla se l'utente aveva già chiuso il banner in precedenza
    if (localStorage.getItem('pwa_banner_chiuso') === 'true') {
        if (banner) banner.classList.add('hidden');
    }

    if (btnClose && banner) {
        btnClose.addEventListener('click', () => {
            banner.classList.add('hidden');
            localStorage.setItem('pwa_banner_chiuso', 'true');
        });
    }

    // Gestione evento installazione PWA standard
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (banner) banner.classList.remove('hidden');
    });

    if (btnInstall) {
        btnInstall.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('Utente ha accettato installazione PWA');
                }
                deferredPrompt = null;
            }
            if (banner) banner.classList.add('hidden');
        });
    }
}
