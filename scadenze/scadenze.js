import { db } from "../firebase-config.js";
import { collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  await caricaScadenze();

  const modal = document.getElementById("modal-scadenza");
  const openBtn = document.getElementById("open-modal-btn");
  const closeBtn = document.getElementById("close-modal-btn");
  const cancelBtn = document.getElementById("cancel-modal-btn");
  const formScadenza = document.getElementById("form-scadenza");

  function toggleModal(open) {
    if (modal) {
      if (open) {
        modal.classList.add("active");
      } else {
        modal.classList.remove("active");
        if (formScadenza) formScadenza.reset();
      }
    }
  }

  if (openBtn) openBtn.addEventListener("click", () => toggleModal(true));
  if (closeBtn) closeBtn.addEventListener("click", () => toggleModal(false));
  if (cancelBtn) cancelBtn.addEventListener("click", () => toggleModal(false));
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) toggleModal(false);
    });
  }

  if (formScadenza) {
    formScadenza.addEventListener("submit", async (e) => {
      e.preventDefault();

      const titolo = document.getElementById("titolo").value.trim();
      const importo = parseFloat(document.getElementById("importo").value);
      const data = document.getElementById("data").value;
      const creatore = localStorage.getItem("sitoFamiglia_user") || "Famiglia";
      const creatoIl = new Date().toISOString();

      try {
        await addDoc(collection(db, "scadenze"), {
          titolo,
          importo,
          data,
          creatore,
          creatoIl
        });

        toggleModal(false);
        await caricaScadenze();
      } catch (err) {
        console.error("Errore salvataggio scadenza:", err);
        alert("Errore durante il salvataggio della scadenza.");
      }
    });
  }

  // OCR
  const ocrInput = document.getElementById("ocr-file-input");
  const ocrStatus = document.getElementById("ocr-status");

  if (ocrInput) {
    ocrInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (ocrStatus) {
        ocrStatus.style.display = "block";
        ocrStatus.textContent = "Analisi OCR in corso... estrazione dati dalla foto.";
      }

      try {
        const result = await Tesseract.recognize(file, 'ita+eng');
        const text = result.data.text;

        const importoMatch = text.match(/(?:totale|eur|€)?\s*(\d+[\.,]\d{2})/i);
        if (importoMatch && importoMatch[1]) {
          document.getElementById("importo").value = importoMatch[1].replace(',', '.');
        }

        const dataMatch = text.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
        if (dataMatch) {
          const [_, gg, mm, aaaa] = dataMatch;
          document.getElementById("data").value = `${aaaa}-${mm}-${gg}`;
        }

        if (text.toLowerCase().includes("enel") || text.toLowerCase().includes("luce")) {
          document.getElementById("titolo").value = "Bolletta Luce";
        } else if (text.toLowerCase().includes("gas") || text.toLowerCase().includes("iren")) {
          document.getElementById("titolo").value = "Bolletta Gas";
        } else {
          document.getElementById("titolo").value = "Scansione Bolletta";
        }

        if (ocrStatus) {
          ocrStatus.textContent = "OCR completato! Controlla i dati.";
          setTimeout(() => { ocrStatus.style.display = "none"; }, 4000);
        }
      } catch (err) {
        console.error("Errore OCR:", err);
        if (ocrStatus) {
          ocrStatus.textContent = "Errore lettura OCR.";
          setTimeout(() => { ocrStatus.style.display = "none"; }, 4000);
        }
      }
    });
  }
});

async function caricaScadenze() {
  const listaContainer = document.getElementById("lista-scadenze-completa");
  const totaleImportoSpan = document.getElementById("totale-importo");
  if (!listaContainer) return;

  try {
    const snap = await getDocs(collection(db, "scadenze"));
    listaContainer.innerHTML = "";

    if (snap.empty) {
      listaContainer.innerHTML = `<p style="color: #666;">Nessuna scadenza presente.</p>`;
      if (totaleImportoSpan) totaleImportoSpan.textContent = "€ 0.00";
      return;
    }

    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    const scadenze = [];
    let sommaTotale = 0;

    snap.forEach(docSnap => {
      const data = docSnap.data();
      const importoNum = parseFloat(data.importo || 0);
      sommaTotale += importoNum;

      const dataScadenza = new Date(data.data);
      dataScadenza.setHours(0, 0, 0, 0);

      const diffTime = dataScadenza.getTime() - oggi.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      scadenze.push({ id: docSnap.id, ...data, diffDays });
    });

    if (totaleImportoSpan) {
      totaleImportoSpan.textContent = `€ ${sommaTotale.toFixed(2)}`;
    }

    scadenze.sort((a, b) => a.diffDays - b.diffDays);

    scadenze.forEach(item => {
      let classeColore = "scadenza-verde";
      let statoTesto = "";

      if (item.diffDays < 0) {
        classeColore = "scadenza-rosso";
        statoTesto = "Scaduta";
      } else if (item.diffDays <= 7) {
        classeColore = "scadenza-rosso";
        statoTesto = `Tra ${item.diffDays} gg`;
      } else if (item.diffDays <= 14) {
        classeColore = "scadenza-giallo";
        statoTesto = `Tra ${item.diffDays} gg`;
      } else {
        classeColore = "scadenza-verde";
        statoTesto = `Tra ${item.diffDays} gg`;
      }

      if (item.diffDays === 0) statoTesto = "Scade Oggi";

      const dataFormattata = item.data ? item.data.split("-").reverse().join("-") : "";
      const importoFormatted = parseFloat(item.importo || 0).toFixed(2);

      const li = document.createElement("li");
      li.className = `scadenza-item ${classeColore}`;
      li.innerHTML = `
        <div class="scadenza-info">
          <span class="scadenza-titolo">${item.titolo} € ${importoFormatted}</span>
          <span class="scadenza-dettaglio">${dataFormattata} (${item.creatore || 'Anonimo'}) - ${statoTesto}</span>
        </div>
        <button class="btn-delete" data-id="${item.id}" title="Elimina scadenza">
          <i class="fas fa-trash-alt"></i>
        </button>
      `;
      listaContainer.appendChild(li);
    });

    const deleteButtons = listaContainer.querySelectorAll(".btn-delete");
    deleteButtons.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        if (confirm("Vuoi davvero eliminare questa scadenza?")) {
          try {
            await deleteDoc(doc(db, "scadenze", id));
            await caricaScadenze();
          } catch (err) {
            console.error("Errore eliminazione:", err);
            alert("Impossibile eliminare la scadenza.");
          }
        }
      });
    });

  } catch (err) {
    console.error("Errore caricamento scadenze:", err);
    listaContainer.innerHTML = `<p style="color: #dc3545;">Errore caricamento dati da Firestore.</p>`;
  }
}
