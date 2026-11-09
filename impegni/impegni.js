import { db } from "../firebase-config.js";
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentStartDate = new Date();

document.addEventListener("DOMContentLoaded", async () => {
  // Posiziona currentStartDate sul Lunedì della settimana corrente
  impostaLunediCorrente();

  await caricaImpegniSettimana();

  // Pulsanti navigazione settimana
  const prevBtn = document.getElementById("prev-week-btn");
  const nextBtn = document.getElementById("next-week-btn");

  if (prevBtn) {
    prevBtn.addEventListener("click", async () => {
      currentStartDate.setDate(currentStartDate.getDate() - 7);
      await caricaImpegniSettimana();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", async () => {
      currentStartDate.setDate(currentStartDate.getDate() + 7);
      await caricaImpegniSettimana();
    });
  }
});

function impostaLunediCorrente() {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  const giorno = oggi.getDay();
  const diff = oggi.getDate() - giorno + (giorno === 0 ? -6 : 1); // Lunedì
  currentStartDate = new Date(oggi.setDate(diff));
}

async function caricaImpegniSettimana() {
  const container = document.getElementById("days-container");
  const weekLabel = document.getElementById("week-range-label");
  if (!container) return;

  try {
    // 1. Calcola i 7 giorni della settimana (da Lunedì a Domenica)
    const giorniSettimana = [];
    let iterDate = new Date(currentStartDate);

    for (let i = 0; i < 7; i++) {
      const yyyy = iterDate.getFullYear();
      const mm = String(iterDate.getMonth() + 1).padStart(2, '0');
      const dd = String(iterDate.getDate()).padStart(2, '0');
      const dataIso = `${yyyy}-${mm}-${dd}`;
      
      giorniSettimana.push({
        dataIso,
        dataObj: new Date(iterDate),
        nomeGiorno: iterDate.toLocaleDateString('it-IT', { weekday: 'long' }),
        giornoMese: `${dd}/${mm}`,
        isDomenica: iterDate.getDay() === 0
      });

      iterDate.setDate(iterDate.getDate() + 1);
    }

    // Aggiorna etichetta in alto (es. 09/11 - 15/11)
    const primoGiornoStr = giorniSettimana[0].giornoMese;
    const ultimoGiornoStr = giorniSettimana[6].giornoMese;
    if (weekLabel) {
      weekLabel.textContent = `${primoGiornoStr} - ${ultimoGiornoStr}`;
    }

    // 2. Carica i colori degli utenti da Firestore
    const utentiSnap = await getDocs(collection(db, "utenti"));
    const mappaColori = {};
    utentiSnap.forEach(uDoc => {
      const uData = uDoc.data();
      mappaColori[uDoc.id.toLowerCase()] = uData.colore || "#f1f5f9";
    });

    // 3. Carica gli impegni dalla collezione "impegni"
    const snap = await getDocs(collection(db, "impegni"));
    const impegniPerData = {};

    snap.forEach(docSnap => {
      const data = docSnap.data();
      const d = data.data; // formato "YYYY-MM-DD"
      if (!impegniPerData[d]) impegniPerData[d] = [];
      impegniPerData[d].push({
        id: docSnap.id,
        ...data
      });
    });

    // 4. Disegna i 7 giorni
    container.innerHTML = "";

    // Colori di sfondo distinti per i giorni della settimana
    const coloriGiorni = ["#f8fafc", "#f1f5f9", "#e2e8f0", "#f1f5f9", "#e2e8f0", "#f8fafc", "#fef2f2"];

    giorniSettimana.forEach((giorno, index) => {
      const impegniDelGiorno = impegniPerData[giorno.dataIso] || [];
      impegniDelGiorno.sort((a, b) => (a.oraInizio || "").localeCompare(b.oraInizio || ""));

      const card = document.createElement("div");
      card.className = `day-card ${giorno.isDomenica ? 'domenica' : ''}`;
      card.style.backgroundColor = giorno.isDomenica ? '#fff5f5' : (coloriGiorni[index] || '#f8fafc');

      let htmlImpegni = "";
      if (impegniDelGiorno.length === 0) {
        htmlImpegni = `<div class="no-impegni">Nessun impegno in questa giornata.</div>`;
      } else {
        htmlImpegni = `<div class="impegni-grid">`;
        impegniDelGiorno.forEach(item => {
          const creatore = (item.creatore || "").toLowerCase();
          const coloreCreatore = mappaColori[creatore] || "#ffffff";

          htmlImpegni += `
            <div class="impegno-item-card" style="background-color: ${coloreCreatore};">
              <div class="impegno-top">
                <div>
                  <div class="impegno-titolo">${item.titolo}</div>
                  <div class="impegno-autore">Creatore: ${item.creatore || 'Anonimo'}</div>
                </div>
                <button class="btn-delete" data-id="${item.id}" title="Elimina">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
              <div class="impegno-orari">
                <i class="far fa-clock"></i> ${item.oraInizio || '--:--'} - ${item.oraFine || '--:--'}
              </div>
            </div>
          `;
        });
        htmlImpegni += `</div>`;
      }

      card.innerHTML = `
        <div class="day-header ${giorno.isDomenica ? 'domenica-text' : ''}">
          <span><i class="fas fa-calendar-day"></i> ${giorno.nomeGiorno.charAt(0).toUpperCase() + giorno.nomeGiorno.slice(1)} (${giorno.giornoMese})</span>
        </div>
        <div class="day-body">
          ${htmlImpegni}
        </div>
      `;

      container.appendChild(card);
    });

    // Gestione eliminazione impegni
    const deleteButtons = container.querySelectorAll(".btn-delete");
    deleteButtons.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        if (confirm("Vuoi davvero eliminare questo impegno?")) {
          try {
            await deleteDoc(doc(db, "impegni", id));
            await caricaImpegniSettimana();
          } catch (err) {
            console.error("Errore eliminazione:", err);
            alert("Impossibile eliminare l'impegno.");
          }
        }
      });
    });

  } catch (err) {
    console.error("Errore caricamento impegni:", err);
    container.innerHTML = `<p style="padding: 15px; color: #dc3545;">Errore caricamento impegni da Firestore.</p>`;
  }
}
