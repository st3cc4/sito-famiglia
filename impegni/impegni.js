/* --- STILI DEDICATI ALLA SEZIONE IMPEGNI --- */

.impegni-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 900px;
    margin: 0 auto;
}

/* Header della sezione con Pulsante Home e Nuovo Impegno */
.section-header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--card-bg);
    padding: 16px 20px;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    box-shadow: 0 2px 6px rgba(0,0,0,0.04);
    flex-wrap: wrap;
    gap: 12px;
}

.header-left-group {
    display: flex;
    align-items: center;
    gap: 12px;
}

.section-header-actions h2 {
    font-size: 1.2rem;
    color: var(--primary-color);
    display: flex;
    align-items: center;
    gap: 10px;
}

.header-buttons-right {
    display: flex;
    align-items: center;
    gap: 10px;
}

.btn-primary {
    background-color: var(--primary-color);
    color: #ffffff;
    border: none;
    padding: 10px 18px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background-color 0.2s, transform 0.1s;
}

.btn-primary:hover {
    background-color: var(--primary-hover);
    transform: translateY(-1px);
}

.btn-outline {
    background-color: transparent;
    color: var(--primary-color);
    border: 1px solid var(--primary-color);
    padding: 10px 16px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background-color 0.2s, color 0.2s;
}

.btn-outline:hover {
    background-color: var(--primary-color);
    color: #ffffff;
}

/* Form Inserimento / Modifica Impegno */
.form-card {
    background-color: var(--card-bg);
    border-radius: 10px;
    border: 1px solid var(--border-color);
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-card h3 {
    font-size: 1rem;
    color: var(--primary-color);
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 10px;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 14px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-group label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #4a5568;
}

.form-group input,
.form-group textarea {
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s;
    font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
    border-color: var(--primary-color);
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 10px;
}

.btn-secondary {
    background-color: #e2e8f0;
    color: #4a5568;
    border: none;
    padding: 9px 16px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
}

.btn-secondary:hover {
    background-color: #cbd5e0;
}

/* Barra dei Filtri */
.filter-bar {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 4px;
}

.filter-btn {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    padding: 8px 14px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
}

.filter-btn.active {
    background-color: var(--primary-color);
    color: #ffffff;
    border-color: var(--primary-color);
}

/* Struttura Giornaliera Verticale */
.settimana-verticale-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.giorno-box {
    background-color: var(--card-bg);
    border-radius: 10px;
    border: 1px solid var(--border-color);
    box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.giorno-box:hover {
    border-color: var(--primary-color);
    box-shadow: 0 4px 8px rgba(0,0,0,0.06);
}

.giorno-header {
    background-color: #f8fafc;
    padding: 12px 18px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
}

.giorno-header:hover {
    background-color: #f1f5f9;
}

.giorno-nome {
    font-size: 1rem;
    font-weight: 700;
    color: #2c3e50;
    text-transform: capitalize;
}

/* Domenica in rosso */
.giorno-box.domenica .giorno-nome {
    color: #e74c3c;
}

.giorno-data {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-weight: 600;
}

.giorno-eventi-lista {
    padding: 12px 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    list-style: none;
}

.giorno-vuoto {
    padding: 10px 18px;
    font-size: 0.85rem;
    color: var(--text-muted);
    font-style: italic;
}

/* Singola Card Impegno all'interno del giorno */
.impegno-item-card {
    border-radius: 8px;
    padding: 10px 14px;
    border-left: 5px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.impegno-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.impegno-titolo {
    font-size: 0.95rem;
    font-weight: 700;
    color: #1a252f;
}

.impegno-meta {
    font-size: 0.8rem;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.impegno-creator {
    font-weight: 700;
    color: #2c3e50;
}

.impegno-azioni {
    display: flex;
    gap: 4px;
}

.btn-action-icon {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 0.9rem;
    padding: 6px;
    cursor: pointer;
    border-radius: 4px;
    transition: color 0.2s, background-color 0.2s;
}

.btn-action-icon.edit:hover {
    color: var(--primary-color);
    background-color: rgba(43, 62, 80, 0.1);
}

.btn-action-icon.delete:hover {
    color: #e74c3c;
    background-color: rgba(231, 76, 60, 0.1);
}
