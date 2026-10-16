// js/media.js - Gestione Foto e Video

export function initMedia(getUtenteCorrente) {
    const btnAddMedia = document.getElementById('btn-add-media');
    const containerMedia = document.getElementById('container-media');

    if (btnAddMedia) {
        btnAddMedia.addEventListener('click', () => {
            alert("Funzionalità Foto e Video in arrivo nella prossima implementazione!");
        });
    }

    if (containerMedia) {
        containerMedia.innerHTML = '<p class="card-meta">Nessun media caricato al momento.</p>';
    }
}
