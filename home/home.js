import { db } from "../firebase-config.js";
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  const oggiStr = `${oggi.getFullYear()}-${String(oggi.getMonth() + 1).padStart(2, '0')}-${String(oggi.getDate()).padStart(2, '0')}`;
  const oggiFormatted = `${String(oggi.getDate()).padStart(2, '0')}-${String(oggi.getMonth() + 1).padStart(2, '0')}-${oggi.getFullYear()}`;

  const impegniHeader = document.getElementById("impegni-header");
  if (impegniHeader) {
    impegniHeader.innerHTML = `<i class="fas fa-calendar-alt"></i> IMPEGNI DI OGGI (${oggiFormatted}) <i class="fas fa-chevron-right" style="margin-left: auto; font-size: 0.8rem;"></i>`;
  }

  await caricaScadenze(oggi);
  await caricaImpegni(oggiStr);
  await caricaUltimiMedia();
  await caricaTopRicette();

  // Gestione click sulle card per aprire la sezione correlata
  const clickableCards = document.querySelectorAll(".clickable-card");
  clickableCards.forEach(card => {
    card.addEventListener("click", () => {
      const target = card.getAttribute("data-target");
      if (window.parent && window.parent.cambiaPagina) {
        window.parent.cambiaPagina(target);
      }
    });
  });
});

function hexToRgba(hex, alpha = 0.22) {
  if (!hex || !hex.startsWith('#')) return 'rgba(241, 245, 249, 0.8)';
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(char => char + char).join('');
  }
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

// 1. SCADENZE (Trasformate in quadratini orizzontali a scorrimento)
async function caricaScadenze(oggi) {
  const scadenzeList = document.getElementById("scadenze-list");
  if (!scadenzeList) return;

  try {
    const snap = await getDocs(collection(db, "scadenze"));
    scadenzeList.innerHTML = "";

    if (snap.empty) {
      scadenzeList.innerHTML = `<p style="color: #666; padding: 10px;">Nessuna scadenza trovata.</p>`;
      return;
    }

    const tutteScadenze = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      const dataScadenza = new Date(data.data);
      dataScadenza.setHours(0, 0, 0, 0);
      
      const diffTime = dataScadenza.getTime() - oggi.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      tutteScadenze.push({ id: docSnap.id, ...data, diffDays });
    });

    tutteScadenze.sort((a, b) => a.diffDays - b.diffDays);

    tutteScadenze.forEach(item => {
      let statoTesto = "";
      let classeColore = "scadenza-verde-orizzontale";
      let bordoColore = "#22c55e";

      if (item.diffDays < 0) {
        statoTesto = "Scaduta";
        classeColore = "scadenza-rosso-orizzontale";
        bordoColore = "#ef4444";
      } else if (item.diffDays === 0) {
        statoTesto = "Scade Oggi";
        classeColore = "scadenza-rosso-orizzontale";
        bordoColore = "#ef4444";
      } else if (item.diffDays <= 7) {
        statoTesto = `Tra ${item.diffDays} gg`;
        classeColore = "scadenza-giallo-orizzontale";
        bordoColore = "#f59e0b";
      } else {
        statoTesto = `Tra ${item.diffDays} gg`;
      }

      const dataFormattata = item.data ? item.data.split("-").reverse().join("-") : "";
      const importoFormatted = parseFloat(item.importo || 0).toFixed(2);

      const div = document.createElement("div");
      div.className = `scadenza-item-orizzontale ${classeColore}`;
      div.style.borderLeft = `4px solid ${bordoColore}`;
      div.innerHTML = `
        <span class="scadenza-titolo" style="font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.titolo}</span>
        <span class="scadenza-importo" style="font-weight: bold; color: ${bordoColore};">€ ${importoFormatted}</span>
        <span class="scadenza-dettaglio" style="font-size: 0.75rem; opacity: 0.85;">${dataFormattata} (${item.creatore || 'Anonimo'})</span>
        <span class="scadenza-stato" style="font-size: 0.75rem; font-weight: 600; margin-top: 2px;">${statoTesto}</span>
      `;
      scadenzeList.appendChild(div);
    });

  } catch (err) {
    console.error("Errore scadenze:", err);
    scadenzeList.innerHTML = `<p style="color: #dc3545; padding: 10px;">Errore caricamento scadenze.</p>`;
  }
}

// 2. IMPEGNI DI OGGI (Quadratini orizzontali a scorrimento)
async function caricaImpegni(oggiStr) {
  const impegniList = document.getElementById("impegni-list");
  if (!impegniList) return;

  try {
    const snap = await getDocs(collection(db, "impegni"));
    impegniList.innerHTML = "";

    const impegniOggi = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.data === oggiStr) impegniOggi.push(data);
    });

    if (impegniOggi.length === 0) {
      impegniList.innerHTML = `<p style="color: #666; padding: 10px;">Nessun impegno previsto per oggi.</p>`;
      return;
    }

    impegniOggi.sort((a, b) => (a.oraInizio || "").localeCompare(b.oraInizio || ""));

    impegniOggi.forEach(data => {
      const div = document.createElement("div");
      div.className = "impegno-item-orizzontale";
      div.innerHTML = `
        <span class="impegno-ora"><i class="far fa-clock"></i> ${data.oraInizio || ''}</span>
        <span class="impegno-titolo-orizzontale" style="font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${data.titolo}</span>
        <small class="impegno-autore" style="font-size: 0.75rem; opacity: 0.7;">(${data.creatore || ''})</small>
      `;
      impegniList.appendChild(div);
    });

  } catch (err) {
    console.error("Errore impegni:", err);
    impegniList.innerHTML = `<p style="color: #dc3545; padding: 10px;">Errore caricamento impegni.</p>`;
  }
}

// 3. ULTIMI MEDIA (Striscia orizzontale a scorrimento)
async function caricaUltimiMedia() {
  const mediaGrid = document.getElementById("media-grid");
  if (!mediaGrid) return;

  try {
    const q = query(collection(db, "media"), orderBy("dataCreazione", "desc"), limit(6));
    const snap = await getDocs(q);
    mediaGrid.innerHTML = "";

    if (snap.empty) {
      mediaGrid.innerHTML = `<p style="color: #666; padding: 10px;">Nessun media presente.</p>`;
      return;
    }

    snap.forEach(docSnap => {
      const data = docSnap.data();
      const div = document.createElement("div");
      div.className = "media-thumb-orizzontale";

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
    mediaGrid.innerHTML = `<p style="color: #dc3545; padding: 10px;">Errore caricamento media.</p>`;
  }
}

// 4. TOP 5 RICETTE (Quadratini orizzontali a scorrimento)
async function caricaTopRicette() {
  const ricetteList = document.getElementById("ricette-list");
  if (!ricetteList) return;

  try {
    const utentiSnap = await getDocs(collection(db, "utenti"));
    const mappaColori = {};
    utentiSnap.forEach(uDoc => {
      const uData = uDoc.data();
      mappaColori[uDoc.id.toLowerCase()] = uData.colore || "#2563eb";
    });

    const snap = await getDocs(collection(db, "ricette"));
    ricetteList.innerHTML = "";

    if (snap.empty) {
      ricetteList.innerHTML = `<p style="color: #666; padding: 10px;">Nessuna ricetta presente.</p>`;
      return;
    }

    const ricette = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      ricette.push({ id: docSnap.id, ...data, punteggio: parseFloat(data.punteggio || 0) });
    });

    ricette.sort((a, b) => b.punteggio - a.punteggio);
    const top5 = ricette.slice(0, 5);

    top5.forEach(ricetta => {
      const creatore = (ricetta.creatore || "").toLowerCase();
      const coloreBase = mappaColori[creatore] || "#2563eb";
      const coloreSfondoAlpha = hexToRgba(coloreBase, 0.22);

      const div = document.createElement("div");
      div.className = "ricetta-item-orizzontale";
      div.style.backgroundColor = coloreSfondoAlpha;
      div.style.borderLeft = `4px solid ${coloreBase}`;
      div.style.color = "#1e293b";

      div.innerHTML = `
        <div class="ricetta-info">
          <span class="ricetta-nome" style="font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;">${ricetta.titolo || ricetta.nome || 'Senza titolo'}</span>
          <span class="ricetta-autore" style="font-size: 0.75rem; opacity: 0.8;">Da: ${ricetta.creatore || 'Anonimo'}</span>
        </div>
        <span class="ricetta-punteggio" style="font-size: 0.85rem;"><i class="fas fa-star" style="color: #f59e0b;"></i> ${ricetta.punteggio.toFixed(1)}</span>
      `;
      ricetteList.appendChild(div);
    });

  } catch (err) {
    console.error("Errore ricette:", err);
    ricetteList.innerHTML = `<p style="color: #dc3545; padding: 10px;">Errore caricamento ricette.</p>`;
  }
}
