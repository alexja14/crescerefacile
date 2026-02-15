// ======================================
// CrescereFacile.it — Calcolatore Congedo Parentale
// Normativa aggiornata 2026
// ======================================

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('calcola-btn');
    if (!btn) return;

    btn.addEventListener('click', calcolaCongedo);
});

function calcolaCongedo() {
    // Read inputs
    const genitore = document.getElementById('genitore').value;
    const contratto = document.getElementById('contratto').value;
    const ral = parseFloat(document.getElementById('ral').value);
    const dataNascitaStr = document.getElementById('data-nascita').value;
    const mesiUsati = parseInt(document.getElementById('mesi-gia-usati').value);
    const partnerUsa3 = document.getElementById('partner-usa').value === 'si';

    // Validation
    if (!ral || ral <= 0) {
        alert('Inserisci la tua RAL (Retribuzione Annua Lorda) per calcolare il congedo.');
        return;
    }
    if (!dataNascitaStr) {
        alert('Inserisci la data di nascita del figlio.');
        return;
    }

    const dataNascita = new Date(dataNascitaStr);
    const oggi = new Date();

    // Calculate child's age
    const etaAnni = (oggi - dataNascita) / (1000 * 60 * 60 * 24 * 365.25);

    // Check eligibility (max 12 years)
    if (etaAnni > 12) {
        mostraErrore('Il congedo parentale è fruibile solo nei primi 12 anni di vita del figlio. Il tuo bambino ha più di 12 anni.');
        return;
    }

    // --- CALCULATE ---

    // Max months per parent
    let maxMesiIndividuali = 6;
    if (genitore === 'padre' && partnerUsa3) {
        maxMesiIndividuali = 7; // Bonus 1 month if father uses ≥3 months
    }

    const mesiDisponibili = Math.max(0, maxMesiIndividuali - mesiUsati);

    // Monthly gross salary
    const stipendioMensile = ral / 13; // 13 mensilità
    const stipendioGiornaliero = ral / 312; // ~26 giorni lavorativi × 12

    // Retribution calculation based on 2026 rules
    let dettaglioMesi = [];
    let totaleGuadagno = 0;
    let mesiContati = 0;

    for (let i = 0; i < mesiDisponibili; i++) {
        const meseNum = mesiUsati + i + 1; // Actual month number (1-based)
        let percentuale = 0;
        let label = '';

        if (etaAnni <= 6) {
            if (meseNum === 1) {
                // First month per parent: 80%
                percentuale = 80;
                label = '1° mese — 80%';
            } else if (meseNum === 2) {
                // Second month: 60% (novità 2025/2026)
                percentuale = 60;
                label = '2° mese — 60%';
            } else {
                // Remaining: 30%
                percentuale = 30;
                label = `${meseNum}° mese — 30%`;
            }
        } else if (etaAnni <= 12) {
            // After 6 years: 30% only if income is low, otherwise 0
            percentuale = 30;
            label = `${meseNum}° mese — 30% (verifica reddito)`;
        }

        const importoMese = (stipendioMensile * percentuale) / 100;
        totaleGuadagno += importoMese;
        mesiContati++;

        dettaglioMesi.push({
            label: label,
            percentuale: percentuale,
            importoLordo: importoMese,
        });
    }

    // Days
    const giorniTotali = mesiDisponibili * 30; // ~30 days per month
    const giorniLavorativi = mesiDisponibili * 22; // ~22 working days per month

    // Paternity leave (extra)
    const congedoPaternita = genitore === 'padre' ? 10 : 0;

    // Net estimate (rough: ~75% of gross for typical IRPEF)
    const totaleNetto = totaleGuadagno * 0.75;

    // --- RENDER RESULTS ---
    const risultati = document.getElementById('risultati');
    const resultCards = document.getElementById('result-cards');
    const resultDetail = document.getElementById('result-detail');

    resultCards.innerHTML = `
    <div class="result-card">
      <div class="value">${mesiDisponibili}</div>
      <div class="label">Mesi disponibili</div>
    </div>
    <div class="result-card">
      <div class="value">${giorniLavorativi}</div>
      <div class="label">Giorni lavorativi</div>
    </div>
    <div class="result-card">
      <div class="value">€${Math.round(totaleGuadagno).toLocaleString('it-IT')}</div>
      <div class="label">Totale lordo stimato</div>
    </div>
    <div class="result-card">
      <div class="value">€${Math.round(totaleNetto).toLocaleString('it-IT')}</div>
      <div class="label">Totale netto stimato</div>
    </div>
  `;

    // Build detail table
    let tableHTML = `
    <div class="data-table-wrapper" style="margin-top: var(--sp-6);">
      <table class="data-table">
        <thead>
          <tr>
            <th>Mese</th>
            <th>Percentuale</th>
            <th>Importo lordo/mese</th>
            <th>Importo netto stimato</th>
          </tr>
        </thead>
        <tbody>
  `;

    dettaglioMesi.forEach(m => {
        tableHTML += `
      <tr>
        <td>${m.label}</td>
        <td><strong>${m.percentuale}%</strong></td>
        <td>€${Math.round(m.importoLordo).toLocaleString('it-IT')}</td>
        <td>€${Math.round(m.importoLordo * 0.75).toLocaleString('it-IT')}</td>
      </tr>
    `;
    });

    tableHTML += `
        </tbody>
      </table>
    </div>
  `;

    // Extra info
    let extraInfo = '';

    if (congedoPaternita > 0) {
        extraInfo += `
      <div class="info-box tip" style="margin-top: var(--sp-6);">
        <div class="info-box-title">👨 Congedo Paternità Obbligatorio</div>
        <p>In quanto padre, hai anche diritto a <strong>10 giorni di congedo di paternità obbligatorio</strong> retribuiti al <strong>100%</strong> (circa €${Math.round(stipendioGiornaliero * 10 * 0.75).toLocaleString('it-IT')} netti). Questi sono <strong>aggiuntivi</strong> e non si sottraggono dai mesi di congedo parentale.</p>
      </div>
    `;
    }

    if (mesiUsati > 0) {
        extraInfo += `
      <div class="info-box warning" style="margin-top: var(--sp-4);">
        <div class="info-box-title">⚠️ Mesi già utilizzati</div>
        <p>Hai indicato di aver già utilizzato <strong>${mesiUsati} mesi</strong>. Il calcolo tiene conto della retribuzione progressiva: i mesi al 80% e 60% potrebbero essere già stati fruiti.</p>
      </div>
    `;
    }

    if (etaAnni > 6 && etaAnni <= 12) {
        extraInfo += `
      <div class="info-box warning" style="margin-top: var(--sp-4);">
        <div class="info-box-title">⚠️ Retribuzione limitata</div>
        <p>Il tuo bambino ha più di 6 anni. Dai 6 ai 12 anni, il congedo è retribuito al 30% solo se il <strong>reddito familiare</strong> è inferiore a 2,5 volte il trattamento minimo di pensione. Verifica con il tuo consulente del lavoro.</p>
      </div>
    `;
    }

    const limiteData = new Date(dataNascita);
    limiteData.setFullYear(limiteData.getFullYear() + 12);
    const opzioniData = { day: 'numeric', month: 'long', year: 'numeric' };

    extraInfo += `
    <div class="info-box important" style="margin-top: var(--sp-4);">
      <div class="info-box-title">📅 Scadenza</div>
      <p>Il congedo parentale deve essere fruito entro il <strong>${limiteData.toLocaleDateString('it-IT', opzioniData)}</strong> (12° compleanno del figlio).</p>
    </div>
  `;

    resultDetail.innerHTML = tableHTML + extraInfo;

    // Show results
    risultati.classList.add('visible');

    // Scroll to results
    risultati.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function mostraErrore(messaggio) {
    const risultati = document.getElementById('risultati');
    const resultCards = document.getElementById('result-cards');
    const resultDetail = document.getElementById('result-detail');

    resultCards.innerHTML = `
    <div class="result-card" style="grid-column: 1 / -1; background: #FFF0F0;">
      <div class="value" style="color: #D63031; font-size: 1.4rem;">⚠️</div>
      <div class="label" style="color: #D63031; font-size: 1rem; margin-top: var(--sp-3);">${messaggio}</div>
    </div>
  `;
    resultDetail.innerHTML = '';
    risultati.classList.add('visible');
    risultati.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
