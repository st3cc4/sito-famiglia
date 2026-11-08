// Funzione per calcolare il colore dello sfondo in base ai giorni
export function getClasseColoreScadenza(dataScadenzaStr) {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  let dataScadenza;
  if (dataScadenzaStr.includes('-')) {
    const parti = dataScadenzaStr.split('-');
    if (parti[0].length === 4) {
      dataScadenza = new Date(parti[0], parti[1] - 1, parti[2]);
    } else {
      dataScadenza = new Date(parti[2], parti[1] - 1, parti[0]);
    }
  } else {
    dataScadenza = new Date(dataScadenzaStr);
  }
  
  dataScadenza.setHours(0, 0, 0, 0);

  const diffTempo = dataScadenza.getTime() - oggi.getTime();
  const diffGiorni = Math.ceil(diffTempo / (1000 * 60 * 60 * 24));

  // Regola: <= 7 rosso, 8..14 giallo, >= 15 verde
  if (diffGiorni <= 7) {
    return {
      classe: 'scadenza-rosso',
      testo: diffGiorni < 0 ? 'Scaduta' : (diffGiorni === 0 ? 'Oggi' : `Tra ${diffGiorni} gg`)
    };
  } else if (diffGiorni <= 14) {
    return {
      classe: 'scadenza-giallo',
      testo: `Tra ${diffGiorni} gg`
    };
  } else {
    return {
      classe: 'scadenza-verde',
      testo: `Tra ${diffGiorni} gg`
    };
  }
}

// Funzione di rendering per Firebase se carichi le scadenze dinamicamente
export function renderScadenze(listaScadenze) {
  const ul = document.getElementById('scadenze-list');
  if (!ul || !listaScadenze) return;

  ul.innerHTML = '';

  listaScadenze.forEach(item => {
    const info = getClasseColoreScadenza(item.data);
    const li = document.createElement('li');
    li.className = `scadenza-item ${info.classe}`;
    
    li.innerHTML = `
      <div class="scadenza-info">
        <span class="scadenza-titolo">${item.titolo} € ${parseFloat(item.importo).toFixed(2)}</span>
        <span class="scadenza-dettaglio">${item.data} (${item.persona}) ${info.testo}</span>
      </div>
    `;
    ul.appendChild(li);
  });
}
