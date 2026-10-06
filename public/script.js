// Seleziona gli elementi dal documento HTML
const scadenzaForm = document.getElementById('scadenza-form');
const titoloScadenzaInput = document.getElementById('titolo-scadenza');
const dataScadenzaInput = document.getElementById('data-scadenza');
const listaScadenze = document.getElementById('lista-scadenze');

const ricettaForm = document.getElementById('ricetta-form');
const titoloRicettaInput = document.getElementById('titolo-ricetta');
const testoRicettaInput = document.getElementById('testo-ricetta');
const grigliaRicette = document.getElementById('griglia-ricette');

// Carica i dati salvati in precedenza (se esistono)
let scadenze = JSON.parse(localStorage.getItem('scadenze')) || [];
let ricette = JSON.parse(localStorage.getItem('ricette')) || [];

// Funzione per mostrare scadenze e ricette a schermo
function aggiornaInterfaccia() {
    // Aggiorna scadenze
    listaScadenze.innerHTML = '';
    scadenze.forEach((s, indice) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span><strong>${s.titolo}</strong> (${s.data})</span>
            <button onclick="rimuoviScadenza(${indice})">Elimina</button>
        `;
        listaScadenze.appendChild(li);
    });

    // Aggiorna ricette
    grigliaRicette.innerHTML = '';
    ricette.forEach((r, indice) => {
        const div = document.createElement('div');
        div.className = 'ricetta-item';
        div.innerHTML = `
            <h3>${r.titolo}</h3>
            <p>${r.testo}</p>
            <button onclick="rimuoviRicetta(${indice})">Elimina</button>
        `;
        grigliaRicette.appendChild(div);
    });
}

// Aggiungi Scadenza
scadenzaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    scadenze.push({
        titolo: titoloScadenzaInput.value,
        data: dataScadenzaInput.value
    });
    localStorage.setItem('scadenze', JSON.stringify(scadenze));
    titoloScadenzaInput.value = '';
    dataScadenzaInput.value = '';
    aggiornaInterfaccia();
});

// Aggiungi Ricetta
ricettaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    ricette.push({
        titolo: titoloRicettaInput.value,
        testo: testoRicettaInput.value
    });
    localStorage.setItem('ricette', JSON.stringify(ricette));
    titoloRicettaInput.value = '';
    testoRicettaInput.value = '';
    aggiornaInterfaccia();
});

// Funzioni per eliminare gli elementi
window.rimuoviScadenza = function(indice) {
    scadenze.splice(indice, 1);
    localStorage.setItem('scadenze', JSON.stringify(scadenze));
    aggiornaInterfaccia();
}

window.rimuoviRicetta = function(indice) {
    ricette.splice(indice, 1);
    localStorage.setItem('ricette', JSON.stringify(ricette));
    aggiornaInterfaccia();
}

// Avvia l'interfaccia all'apertura
aggiornaInterfaccia();
