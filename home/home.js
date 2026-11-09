import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", async () => {
  const oggi = new Date();
  const oggiStr = oggi.toISOString().split("T")[0]; // YYYY-MM-DD
  const oggiFormatted = `${String(oggi.getDate()).padStart(2, '0')}-${String(oggi.getMonth() + 1).padStart(2, '0')}-${oggi.getFullYear()}`;

  // Imposta data nel titolo impegni
  const impegniHeader = document.getElementById("impegni-header");
  if (impegniHeader) {
    impegniHeader.innerHTML = `<i class="fas fa-calendar-alt"></i> IMPEGNI DI OGGI (${oggiFormatted})`;
  }

  await caricaScadenze(oggi);
  await caricaImpegni(oggiStr);
  await caricaUltimoMedia();
});

// 1. CARICAMENTO SCADENZE DA FIRESTORE
async function caricaScadenze(oggi) {
  const scadenzeList = document.getElementById("scadenze-list");
  if (!scadenzeList) return;

  try {
    const snap = await getDocs(collection(db, "scadenze"));
    scadenzeList.innerHTML = "";

    if (snap.empty) {
      scadenzeList.innerHTML = `<li>Nessuna scadenza trovata.</li>`;
      return;
    }

    snap.forEach(docSnap => {
      const data = docSnap.data();
      const dataScadenza = new Date(data.data);
      
      // Calcolo differenza giorni
      const diffTime = dataScadenza.getTime() - oggi.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

      let classeColore = "scadenza-verde";
      let statoTesto = `Tra ${diffDays} gg`;

      if (diffDays < 0) {
        classeColore = "scadenza-rosso";
        statoTesto = "Scaduta";
      } else if (diffDays <= 7) {
        classeColore = "scadenza-rosso";
      } else if (diffDays <= 15) {
        classeColore = "scadenza-giallo";
      }

      const dataFormattata = data.data.split("-").reverse().join("-");
      const li = document.createElement("li");
      li.className = `scadenza-item ${classeColore}`;
      li.innerHTML = `
        <div class="scadenza-info">
          <span class="scadenza-titolo">${data.titolo} € ${parseFloat(data.importo).toFixed(2)}</span>
          <span class="scadenza-dettaglio">${dataFormattata} (${data.creatore}) ${statoTesto}</span>
        </div>
      `;
      scadenzeList.appendChild(li);
    });
  } catch (err) {
    console.error("Errore scadenze:", err);
    scadenzeList.innerHTML = `<li>Errore nel caricamento delle scadenze.</li>`;
  }
}

// 2. CARICAMENTO IMPEGNI DI OGGI DA FIRESTORE
async function caricaImpegni(oggiStr) {
  const impegniList = document.getElementById("impegni-list");
  if (!impegniList) return;

  try {
    const snap = await getDocs(collection(db, "appuntamenti"));
    impegniList.innerHTML = "";

    let trovati = 0;
    snap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.data === oggiStr) {
        trovati++;
        const div = document.createElement("div");
        div.className = "impegno-item";
        div.innerHTML = `
          <span><strong>${data.titolo}</strong> <small style="opacity: 0.75;">(${data.creatore})</small></span>
          <span class="impegno-ora"><i class="far fa-clock"></i> ${data.oraInizio}</span>
        `;
        impegniList.appendChild(div);
      }
    });

    if (trovati === 0) {
      impegniList.innerHTML = `<p style="color: #666;">Nessun impegno previsto per oggi.</p>`;
    }
  } catch (err) {
    console.error("Errore impegni:", err);
    impegniList.innerHTML = `<p>Errore nel caricamento impegni.</p>`;
  }
}

// 3. CARICAMENTO ULTIMO MEDIA DA FIRESTORE
async function caricaUltimoMedia() {
  const fotoContainer = document.getElementById("foto-container");
  if (!fotoContainer) return;

  try {
    const q = query(collection(db, "media"), orderBy("dataCreazione", "desc"), limit(1));
    const snap = await getDocs(q);

    if (snap.empty) {
      fotoContainer.innerHTML = `<p style="color: #888; padding: 20px;">Nessun media presente.</p>`;
      return;
    }

    const data = snap.docs[0].data();
    if (data.url) {
      fotoContainer.innerHTML = `<img src="${data.url}" alt="${data.categoria || 'Foto'}">`;
    }
  } catch (err) {
    console.error("Errore media:", err);
    fotoContainer.innerHTML = `<p style="color: #888; padding: 20px;">Impossibile caricare l'immagine.</p>`;
  }
}
