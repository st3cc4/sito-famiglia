// 2. IMPEGNI HOME
window.caricaSummaryImpegniHome = async function() {
    const summaryImpegni = document.getElementById('home-summary-impegni');
    if (!summaryImpegni) return;

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

        let htmlSummary = "";
        impegni.forEach((i) => {
            const dataGrezza = i.data || '';
            const parti = dataGrezza.split('-');
            const dataFormatted = parti.length === 3 ? `${parti[2]}/${parti[1]}/${parti[0]}` : dataGrezza;
            const creatoreNome = i.creatore || i.utente || '';

            htmlSummary += `
                <div style="background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #e2e8f0; border-left: 6px solid #3b82f6; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <div>
                        <strong style="font-size: 1.05rem; color: #1e293b; display: block; margin-bottom: 2px;">${escapeHtml(i.titolo || i.descrizione || 'Impegno')}</strong>
                        <div style="font-size: 0.9rem; color: #475569;">Data: ${dataFormatted} | Orario: ${escapeHtml(i.ora || '00:00')}</div>
                    </div>
                    ${creatoreNome ? `<span style="font-size: 0.9rem; font-weight: 600; color: #334155;">${escapeHtml(creatoreNome)}</span>` : ''}
                </div>
            `;
        });

        summaryImpegni.innerHTML = htmlSummary || `<p class="text-muted" style="font-style: italic; color: #64748b; padding: 10px;">Nessun impegno in programma.</p>`;
    } catch (err) {
        console.error("Errore summary impegni home:", err);
    }
}
