/**
 * CrescereFacile.it — Calcolatore Assegno Unico Universale 2026
 * Calculates the monthly AUU amount based on ISEE, number of children, ages, and conditions.
 */

(function () {
    'use strict';

    const form = document.getElementById('assegno-form');
    const resultsDiv = document.getElementById('assegno-results');

    // 2026 Assegno Unico tables (importi mensili per figlio)
    // Range ISEE → importo base per figlio minorenne
    const FASCE_ISEE = [
        { maxISEE: 17979.88, importo: 199.40 },
        { maxISEE: 20000, importo: 186.00 },
        { maxISEE: 22000, importo: 172.00 },
        { maxISEE: 24000, importo: 158.00 },
        { maxISEE: 26000, importo: 144.00 },
        { maxISEE: 28000, importo: 130.00 },
        { maxISEE: 30000, importo: 116.00 },
        { maxISEE: 32000, importo: 102.00 },
        { maxISEE: 34000, importo: 91.00 },
        { maxISEE: 36000, importo: 82.00 },
        { maxISEE: 38000, importo: 74.00 },
        { maxISEE: 40000, importo: 67.00 },
        { maxISEE: 42000, importo: 61.00 },
        { maxISEE: 45616.27, importo: 57.00 },
        { maxISEE: Infinity, importo: 57.00 }  // oltre 45.616,27€
    ];

    // Maggiorazione per figli successivi al 2° (dal 3° in poi)
    const MAGGIORAZIONE_TERZO_FIGLIO = 96.90;

    // Maggiorazione figli sotto 1 anno
    const MAGGIORAZIONE_SOTTO_1_ANNO = 114.40;

    // Maggiorazione figli 1-3 anni (con 3+ figli)
    const MAGGIORAZIONE_1_3_ANNI = 96.90;

    // Maggiorazione genitori entrambi lavoratori
    const MAGGIORAZIONE_DUE_LAVORATORI_MAX = 34.10;
    const MAGGIORAZIONE_DUE_LAVORATORI_MIN = 24.00;

    // Maggiorazione figli disabili
    const MAGGIORAZIONE_DISABILITA = {
        'non_autosufficiente': 119.60,
        'grave': 108.20,
        'media': 96.90
    };

    // Maggiorazione madri under 21
    const MAGGIORAZIONE_UNDER_21 = 22.80;

    function getImportoBase(isee) {
        if (!isee || isee <= 0) {
            // Senza ISEE → importo minimo
            return FASCE_ISEE[FASCE_ISEE.length - 1].importo;
        }
        for (const fascia of FASCE_ISEE) {
            if (isee <= fascia.maxISEE) return fascia.importo;
        }
        return FASCE_ISEE[FASCE_ISEE.length - 1].importo;
    }

    function getMaggiorazioneLavoratori(isee) {
        if (!isee || isee <= 0) return MAGGIORAZIONE_DUE_LAVORATORI_MIN;
        if (isee <= 17979.88) return MAGGIORAZIONE_DUE_LAVORATORI_MAX;
        if (isee >= 45616.27) return MAGGIORAZIONE_DUE_LAVORATORI_MIN;
        // Interpolazione lineare
        const range = 45616.27 - 17979.88;
        const diff = MAGGIORAZIONE_DUE_LAVORATORI_MAX - MAGGIORAZIONE_DUE_LAVORATORI_MIN;
        return MAGGIORAZIONE_DUE_LAVORATORI_MAX - (isee - 17979.88) / range * diff;
    }

    function calcola() {
        const iseeInput = document.getElementById('isee').value;
        const isee = iseeInput ? parseFloat(iseeInput) : 0;
        const numFigli = parseInt(document.getElementById('num-figli').value) || 0;
        const figliSotto1 = parseInt(document.getElementById('figli-sotto-1').value) || 0;
        const figli1a3 = parseInt(document.getElementById('figli-1-3').value) || 0;
        const figliDisabili = parseInt(document.getElementById('figli-disabili').value) || 0;
        const dueGenLav = document.getElementById('due-genitori-lavoratori').checked;
        const madreUnder21 = document.getElementById('madre-under-21').checked;

        if (numFigli < 1) {
            alert('Inserisci almeno 1 figlio.');
            return;
        }

        const importoBase = getImportoBase(isee);
        let totale = 0;
        const dettagli = [];

        // Base per ogni figlio
        const baseTotale = importoBase * numFigli;
        totale += baseTotale;
        dettagli.push({
            voce: `Importo base (${numFigli} ${numFigli === 1 ? 'figlio' : 'figli'} × €${importoBase.toFixed(2)})`,
            importo: baseTotale
        });

        // Maggiorazione dal 3° figlio in poi
        if (numFigli >= 3) {
            const figliExtra = numFigli - 2;
            const extraTotale = MAGGIORAZIONE_TERZO_FIGLIO * figliExtra;
            totale += extraTotale;
            dettagli.push({
                voce: `Maggiorazione dal 3° figlio (${figliExtra} × €${MAGGIORAZIONE_TERZO_FIGLIO.toFixed(2)})`,
                importo: extraTotale
            });
        }

        // Maggiorazione figli sotto 1 anno
        if (figliSotto1 > 0) {
            const sotto1Tot = MAGGIORAZIONE_SOTTO_1_ANNO * figliSotto1;
            totale += sotto1Tot;
            dettagli.push({
                voce: `Maggiorazione figli < 1 anno (${figliSotto1} × €${MAGGIORAZIONE_SOTTO_1_ANNO.toFixed(2)})`,
                importo: sotto1Tot
            });
        }

        // Maggiorazione figli 1-3 anni (solo se 3+ figli)
        if (figli1a3 > 0 && numFigli >= 3) {
            const a3Tot = MAGGIORAZIONE_1_3_ANNI * figli1a3;
            totale += a3Tot;
            dettagli.push({
                voce: `Maggiorazione figli 1-3 anni (${figli1a3} × €${MAGGIORAZIONE_1_3_ANNI.toFixed(2)})`,
                importo: a3Tot
            });
        }

        // Maggiorazione disabilità
        if (figliDisabili > 0) {
            const disabTot = MAGGIORAZIONE_DISABILITA.media * figliDisabili;
            totale += disabTot;
            dettagli.push({
                voce: `Maggiorazione disabilità (${figliDisabili} × €${MAGGIORAZIONE_DISABILITA.media.toFixed(2)})`,
                importo: disabTot
            });
        }

        // Maggiorazione entrambi genitori lavoratori
        if (dueGenLav) {
            const lavMagg = getMaggiorazioneLavoratori(isee) * numFigli;
            totale += lavMagg;
            dettagli.push({
                voce: `Maggiorazione genitori lavoratori (${numFigli} figli)`,
                importo: lavMagg
            });
        }

        // Maggiorazione madre under 21
        if (madreUnder21) {
            const u21Tot = MAGGIORAZIONE_UNDER_21 * numFigli;
            totale += u21Tot;
            dettagli.push({
                voce: `Maggiorazione madre under 21 (${numFigli} figli × €${MAGGIORAZIONE_UNDER_21.toFixed(2)})`,
                importo: u21Tot
            });
        }

        mostraRisultati(totale, dettagli, isee, numFigli);
    }

    function mostraRisultati(totale, dettagli, isee, numFigli) {
        const annuo = totale * 12;
        const perFiglio = totale / numFigli;

        let html = `
      <div class="result-cards" style="margin-bottom: var(--sp-8);">
        <div class="result-card">
          <div class="value">€${totale.toFixed(2)}</div>
          <div class="label">Totale Mensile</div>
        </div>
        <div class="result-card">
          <div class="value">€${annuo.toFixed(2)}</div>
          <div class="label">Totale Annuo</div>
        </div>
        <div class="result-card">
          <div class="value">€${perFiglio.toFixed(2)}</div>
          <div class="label">Media per Figlio/mese</div>
        </div>
      </div>

      <h3 style="margin-bottom: var(--sp-4);">📋 Dettaglio Calcolo</h3>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr><th>Voce</th><th style="text-align:right;">Importo/mese</th></tr>
          </thead>
          <tbody>
    `;

        for (const d of dettagli) {
            html += `<tr><td>${d.voce}</td><td style="text-align:right;"><strong>€${d.importo.toFixed(2)}</strong></td></tr>`;
        }

        html += `
          <tr style="background: var(--grad-warm); font-weight:700;">
            <td>TOTALE MENSILE</td>
            <td style="text-align:right; color: var(--clr-primary); font-size: 1.1rem;">€${totale.toFixed(2)}</td>
          </tr>
          </tbody>
        </table>
      </div>
    `;

        // Note
        if (!isee || isee <= 0) {
            html += `
        <div class="info-box warning" style="margin-top: var(--sp-6);">
          <div class="info-box-title">⚠️ ISEE non inserito</div>
          <p>Senza ISEE, l'importo calcolato è il <strong>minimo garantito</strong> (€57,00/figlio). Presentando l'ISEE potresti ricevere fino a <strong>€199,40/figlio</strong>! <a href="bonus-famiglia.html#isee">Scopri come richiedere l'ISEE</a>.</p>
        </div>
      `;
        }

        resultsDiv.innerHTML = html;
        resultsDiv.classList.add('visible');
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            calcola();
        });
    }
})();
