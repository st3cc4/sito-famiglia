import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  const oggiStr = `${oggi.getFullYear()}-${String(oggi.getMonth() + 1).padStart(2, '0')}-${String(oggi.getDate()).padStart(2, '0')}`;
  const oggiFormatted = `${String(oggi.getDate()).padStart(2, '0')}-${String(oggi.getMonth() + 1).padStart(2, '0')}-${oggi.getFullYear()}`;

  // Imposta data nel titolo impegni
  const impegniHeader = document.getElementById("impegni-header");
  if (impegniHeader) {
    impegniHeader.innerHTML = `<i class="fas fa-calendar-alt"></i> IMPEGNI DI OGGI (${oggiFormatted})`;
  }

  await caricaScadenze(oggi);
  await caricaImpegni(oggiStr);
  await caricaUltimiMedia();
  await caricaTopRicette();
});

// 1. CARICAMENTO SCADENZE GERARCHICO (ROSSO -> GIALLO -> VERDE)
async function caricaScadenze(oggi) {
  const scadenzeList = document.getElementById("scadenze-list");
  if (!scadenzeList) return;

  try {
    const snap = await getDocs(collection(db, "scadenze"));
    scadenzeList.innerHTML = "";

    if (snap.empty) {
      scadenzeList.innerHTML = `<p style="color: #666;">Nessuna scadenza trovata.</p>`;
      return;
    }

    const tutteScadenze = [];

    snap.forEach(docSnap => {
      const data = docSnap.data();
      const dataScadenza = new Date(data.data);
      dataScadenza.setHours(0, 0, 0, 0);
      
      const diffTime = dataScadenza.getTime() - oggi.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      tutteScadenze.push({
        id: docSnap.id,
        ...data,
        diffDays: diffDays
      });
    });

    // Filtro 1: Scadute o entro 7 giorni (ROSSO)
    const rosse = tutteScadenze.filter(s => s.diffDays <= 7);
    
    // Filtro 2: Entro 14 giorni (da 8 a 14 gg) (GIALLO)
    const gialle = tutteScadenze.filter(s => s.diffDays >= 8 && s.diffDays <= 14);

    // Filtro 3: Dal 15° giorno in poi (VERDE)
    const verdi = tutteScadenze.filter(s => s.diffDays >= 15);

    let listaDaMostrare = [];
    let classeColore = "";

    if (rosse.length > 0) {
      listaDaMostrare = rosse;
      classeColore = "scadenza-rosso";
    } else if (gialle.length > 0) {
      listaDaMostrare = gialle;
      classeColore = "scadenza-giallo";
    } else if (verdi.length > 0) {
      listaDaMostrare = verdi;
      classeColore = "scadenza-verde";
    }

    if (listaDaMostrare.length === 0) {
      scadenzeList.innerHTML = `<p style="color: #666;">Nessuna scadenza presente.</p>`;
      return;
    }

    // Ordina per data imminente
    listaDaMostrare.sort((a, b) => a.diffDays - b.diffDays);

    listaDaMostrare.forEach(item => {
      let statoTesto = "";
      if (item.diffDays < 0) {
        statoTesto = "Scaduta";
      } else if (item.diffDays === 0) {
        statoTesto = "Scade Oggi";
      } else {
        statoTesto = `Tra ${item.diffDays} gg`;
      }

      const dataFormattata = item.data ? item.data.split("-").reverse().join("-") : "";
      const importoFormatted = parseFloat(item.importo || 0).toFixed(2);

      const li = document.createElement("li");
      li.className = `scadenza-item ${classeColore}`;
      li.innerHTML = `
        <div class="scadenza-info">
          <span class="scadenza-titolo">${item.titolo} € ${importoFormatted}</span>
          <span class="scadenza-dettaglio">${dataFormattata} (${item.creatore || 'Anonimo'}) ${statoTesto}</span>
        </div>
      `;
      scadenzeList.appendChild(li);
    });

  } catch (err) {
    console.error("Errore scadenze:", err);
    scadenzeList.innerHTML = `<p style="color: #dc3545;">Errore caricamento scadenze.</p>`;
  }
}

// 2. IMPEGNI DI OGGI
async function caricaImpegni(oggiStr) {
  const impegniList = document.getElementById("impegni-list");
  if (!impegniList) return;

  try {
    const snap = await getDocs(collection(db, "appuntamenti"));
    impegniList.innerHTML = "";

    const impegniOggi = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.data === oggiStr) {
        impegniOggi.push(data);
      }
    });

    if (impegniOggi.length === 0) {
      impegniList.innerHTML = `<p style="color: #666;">Nessun impegno previsto per oggi.</p>`;
      return;
    }

    // Ordina per ora d'inizio
    impegniOggi.sort((a, b) => (a.oraInizio || "").localeCompare(b.oraInizio || ""));

    impegniOggi.forEach(data => {
      const div = document.createElement("div");
      div.className = "impegno-item";
      div.innerHTML = `
        <span><strong>${data.titolo}</strong> <small style="opacity: 0.75;">(${data.creatore})</small></span>
        <span class="impegno-ora"><i class="far fa-clock"></i> ${data.oraInizio || ''}</span>
      `;
      impegniList.appendChild(div);
    });

  } catch (err) {
    console.error("Errore impegni:", err);
    impegniList.innerHTML = `<p style="color: #dc3545;">Errore caricamento impegni.</p>`;
  }
}

// 3. ULTIME 5 FOTO & VIDEO COMPATTI
async function caricaUltimiMedia() {
  const mediaGrid = document.getElementById("media-grid");
  if (!mediaGrid) return;

  try {
    const q = query(collection(db, "media"), orderBy("dataCreazione", "desc"), limit(5));
    const snap = await getDocs(q);
    mediaGrid.innerHTML = "";

    if (snap.empty) {
      mediaGrid.innerHTML = `<p style="color: #666;">Nessun media presente.</p>`;
      return;
    }

    snap.forEach(docSnap => {
      const data = docSnap.data();
      const div = document.createElement("div");
      div.className = "media-thumb";

      if (data.tipo === "video") {
        div.innerHTML = `
          <video src="${data.url}"></video>
          <span class="media-badge"><i class="fas fa-play"></i></span>
        `;
      } else {
        div.innerHTML = `
          <img src="${data.url}" alt="${data.categoria || 'Media'}">
          <span class="media-badge"><i class="fas fa-image"></i></span>
        `;
      }
      mediaGrid.appendChild(div);
    });

  } catch (err) {
    console.error("Errore media:", err);
    mediaGrid.innerHTML = `<p style="color: #dc3545;">Errore caricamento media.</p>`;
  }
}

// 4. TOP 5 RICETTE PER PUNTEGGIO
async function caricaTopRicette() {
  const ricetteList = document.getElementById("ricette-list");
  if (!ricetteList) return;

  try {
    const snap = await getDocs(collection(db, "ricette"));
    ricetteList.innerHTML = "";

    if (snap.empty) {
      ricetteList.innerHTML = `<p style="color: #666;">Nessuna ricetta presente.</p>`;
      return;
    }

    const ricette = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      ricette.push({
        id: docSnap.id,
        ...data,
        punteggio: parseFloat(data.punteggio || 0)
      });
    });

    // Ordina per punteggio decrescente e prende le prime 5
    ricette.sort((a, b) => b.punteggio - a.punteggio);
    const top5 = ricette.slice(0, 5);

    top5.forEach(ricetta => {
      const li = document.createElement("li");
      li.className = "ricetta-item";
      li.innerHTML = `
        <span class="ricetta-nome">${ricetta.titolo || ricetta.nome || 'Ricetta senza titolo'}</span>
        <span class="ricetta-punteggio"><i class="fas fa-star"></i> ${ricetta.punteggio.toFixed(1)}</span>
      `;
      ricetteList.appendChild(li);
    });

  } catch (err) {
    console.error("Errore ricette:", err);
    ricetteList.innerHTML = `<p style="color: #dc3545;">Errore caricamento ricette.</p>`;
  }
}
