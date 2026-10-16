import { 
    collection, 
    getDocs, 
    addDoc, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../firebase-config.js";
import { nomeUtenteCorrente, idUtenteCorrenteId } from "../auth.js";

export async function caricaAppuntamenti() {
    const containerImpegniCompleto = document.getElementById('lista-appuntamenti');
    const summaryImpegniHome = document.getElementById('home-summary-impegni');
    
    if (!containerImpegniCompleto && !summaryImpegniHome) return;

    try {
        let querySnapshot;
        try {
            querySnapshot = await getDocs(collection(db, "appuntamenti"));
        } catch (e) {
            querySnapshot = await getDocs(collection(db, "impegni"));
        }

        let impegni = [];
        querySnapshot.forEach((docSnap) => {
            impegni.push({ id: docSnap.id, ...docSnap.data() });
        });

        impegni.sort((a, b) => (a.data + (a.ora || '00:00')).localeCompare(b.data + (b.ora || '00:00')));

        let html = "";
        impegni.forEach((i) => {
            const dataGrezza = i.data || '';
            const parti = dataGrezza.split('-');
            const dataFormatted = parti.length === 3 ? `${parti[2]}/${parti[1]}/${parti[0]}` : dataGrezza;
            const creatoreNome = i.creatore || i.utente || '';

            html += `
                <div style="background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e2e8f0; border-left: 6px solid #3b82f6; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <div>
                        <strong style="font-size: 1.05rem; color: #1e293b; display: block; margin-bottom: 2px;">${escapeHtml(i.titolo || i.descrizione || 'Impegno')}</strong>
                        <div style="font-size: 0.9rem; color: #475569;">Data: ${dataFormatted} | Orario: ${escapeHtml(i.ora || '00:00')}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        ${creatoreNome ? `<span style="font-size: 0.9rem; font-weight: 600; color: #334155;">${escapeHtml(creatoreNome)}</span>` : ''}
                        <button onclick="eliminaImpegno('${i.id}')" style="background: none; border: none; cursor: pointer; font-size: 1rem;" title="Elimina">🗑️</button>
                    </div>
                </div>
            `;
        });

        const messaggioVuoto = `<p class="text-muted" style="font-style: italic; color: #64748b; padding: 10px;">Nessun impegno in programma.</p>`;

        if (containerImpegniCompleto) {
            containerImpegniCompleto.innerHTML = html || messaggioVuoto;
        }
        
        if (summaryImpegniHome) {
            summaryImpegniHome.innerHTML = html || messaggioVuoto;
        }

    } catch (err) {
        console.error("Errore caricamento impegni:", err);
    }
}

const formNuovoImpegno = document.getElementById('form-nuovo-appuntamento') || document.getElementById('form-nuovo-impegno');
if (formNuovoImpegno) {
    formNuovoImpegno.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titoloInput = document.getElementById('appuntamento-titolo') || document.getElementById('impegno-titolo');
        const dataInput = document.getElementById('appuntamento-data') || document.getElementById('impegno-data');
        const oraInput = document.getElementById('appuntamento-ora') || document.getElementById('impegno-ora');

        if (!titoloInput || !dataInput) return;

        try {
            await addDoc(collection(db, "appuntamenti"), {
                titolo: titoloInput.value.trim(),
                data: dataInput.value,
                ora: oraInput ? oraInput.value : '00:00',
                creatore: nomeUtenteCorrente || 'Famiglia',
                creatoreId: idUtenteCorrenteId || ''
            });

            formNuovoImpegno.reset();
            caricaAppuntamenti();
            if (window.caricaSummaryImpegniHome) window.caricaSummaryImpegniHome();
        } catch (err) {
            console.error("Errore salvataggio impegno:", err);
            alert("Errore durante il salvataggio dell'impegno.");
        }
    });
}

window.eliminaImpegno = async function(id) {
    if (!confirm("Vuoi davvero eliminare questo impegno?")) return;
    try {
        await deleteDoc(doc(db, "appuntamenti", id));
        caricaAppuntamenti();
        if (window.caricaSummaryImpegniHome) window.caricaSummaryImpegniHome();
    } catch (err) {
        try {
            await deleteDoc(doc(db, "impegni", id));
            caricaAppuntamenti();
            if (window.caricaSummaryImpegniHome) window.caricaSummaryImpegniHome();
        } catch (e) {
            console.error("Errore eliminazione impegno:", e);
            alert("Impossibile eliminare l'impegno.");
        }
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

window.caricaAppuntamenti = caricaAppuntamenti;
