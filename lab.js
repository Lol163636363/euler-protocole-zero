(function () {
  'use strict';

  var host = null;
  var events = null;
  var currentTab = 'euler';
  var eulerIndex = 2;
  var capacitorTime = 10;
  var steps = [0.5, 0.2, 0.1, 0.05, 0.01];
  var formatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 4 });

  function number(value, digits) {
    if (digits !== undefined) {
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      }).format(value);
    }
    return formatter.format(value);
  }

  function addStyles() {
    if (document.getElementById('lab-style')) return;
    var style = document.createElement('style');
    style.id = 'lab-style';
    style.textContent = `
      .elab{color:#e5ecec;font:inherit;line-height:1.55;max-width:1120px;margin:0 auto}
      .elab *{box-sizing:border-box}
      .elab button,.elab input{font:inherit}
      .elab-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px}
      .elab-tab{border:1px solid #2b414b;border-radius:10px;padding:11px 19px;background:#0a151c;color:#a2b4bd;cursor:pointer;min-height:44px}
      .elab-tab[aria-selected=true]{color:#ff9166;border-color:#ff9166;background:#ff916610}
      .elab button:focus-visible,.elab input:focus-visible{outline:3px solid #73e7de;outline-offset:5px}
      .elab-panel[hidden]{display:none}
      .elab-heading{font-size:clamp(22px,3vw,30px);line-height:1.2;letter-spacing:-.025em;margin:0 0 9px;color:#e5ecec}
      .elab-copy{color:#a2b4bd;max-width:790px;margin:0 0 20px}
      .elab-formula{color:#e5ecec;white-space:nowrap}
      .elab-layout{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:18px;align-items:start}
      .elab-plot{background:#0a151c;border:1px solid #263b44;border-radius:15px;padding:16px 14px 12px;min-width:0}
      .elab-legend{display:flex;flex-wrap:wrap;gap:10px 22px;font-size:12px;color:#b4c3ca;margin:0 0 10px 10px}
      .elab-legend span{display:inline-flex;align-items:center;gap:7px}
      .elab-swatch{display:inline-block;width:21px;height:3px;background:#73e7de;border-radius:3px}
      .elab-swatch-orange{background:#ff9166}
      .elab-swatch-dashed{height:0;background:none;border-top:2px dashed #81949e;border-radius:0}
      .elab-chart{display:block;width:100%;height:auto;overflow:visible}
      .elab-caption{margin:6px 9px 0;color:#81949e;font-size:12px}
      .elab-controls{background:#0a151c;border:1px solid #263b44;border-radius:15px;padding:19px}
      .elab-control-label{display:flex;justify-content:space-between;gap:12px;font-size:14px;font-weight:600;margin-bottom:12px}
      .elab-control-value{color:#ff9166;white-space:nowrap;font-variant-numeric:tabular-nums}
      .elab-range{display:block;width:100%;height:30px;margin:0;accent-color:#ff9166;cursor:pointer}
      .elab-range-ends{display:flex;justify-content:space-between;gap:10px;color:#81949e;font-size:11px;margin:3px 0 17px}
      .elab-metrics{margin:0;padding:0;border-top:1px solid #263b44}
      .elab-metric{padding:11px 0;border-bottom:1px solid #1c3039}
      .elab-metric:last-child{border-bottom:0;padding-bottom:0}
      .elab-metric dt{font-size:12px;color:#81949e;margin:0 0 2px}
      .elab-metric dd{font-size:19px;color:#e5ecec;margin:0;font-variant-numeric:tabular-nums;line-height:1.3}
      .elab-metric dd.elab-orange{color:#ff9166}
      .elab-metric dd.elab-cyan{color:#73e7de}
      .elab-insight{margin-top:18px;border-left:2px solid #73e7de;background:#73e7de06;padding:13px 17px;color:#a2b4bd;font-size:14px}
      .elab-insight strong{color:#e5ecec;font-weight:600}
      .elab-insight p{margin:0}.elab-insight p+p{margin-top:8px}
      @media(max-width:760px){.elab-layout{grid-template-columns:1fr}.elab-controls{padding:16px}.elab-metrics{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}.elab-metric:last-child{padding-bottom:11px}.elab-tab{flex:1;padding:10px 12px;font-size:13px}.elab-plot{padding:12px 5px}.elab-chart text{font-size:13px}}
      @media(prefers-reduced-motion:reduce){.elab *{scroll-behavior:auto}}
    `;
    document.head.appendChild(style);
  }

  function chartFrame(config) {
    var width = 760, height = 330;
    var plot = { left: 59, top: 28, width: 676, height: 251 };
    var x = function (value) { return plot.left + value / config.xMax * plot.width; };
    var y = function (value) { return plot.top + plot.height - value / config.yMax * plot.height; };
    var svg = '<svg class="elab-chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-labelledby="elab-' + config.id + '-chart-title elab-' + config.id + '-chart-desc">' +
      '<title id="elab-' + config.id + '-chart-title">' + config.title + '</title>' +
      '<desc id="elab-' + config.id + '-chart-desc">' + config.description + '</desc>';
    config.yTicks.forEach(function (tick) {
      svg += '<line x1="' + plot.left + '" y1="' + y(tick) + '" x2="' + (plot.left + plot.width) + '" y2="' + y(tick) + '" stroke="#20323b" stroke-width="1"/>';
      svg += '<text x="' + (plot.left - 13) + '" y="' + (y(tick) + 4) + '" text-anchor="end" fill="#81949e" font-size="12">' + number(tick) + '</text>';
    });
    config.xTicks.forEach(function (tick) {
      svg += '<line x1="' + x(tick) + '" y1="' + plot.top + '" x2="' + x(tick) + '" y2="' + (plot.top + plot.height) + '" stroke="#182b34" stroke-width="1"/>';
      svg += '<text x="' + x(tick) + '" y="' + (plot.top + plot.height + 23) + '" text-anchor="middle" fill="#81949e" font-size="12">' + number(tick) + '</text>';
    });
    svg += '<text x="' + plot.left + '" y="14" fill="#a2b4bd" font-size="12">' + config.yLabel + '</text>';
    svg += '<text x="' + (plot.left + plot.width) + '" y="326" text-anchor="end" fill="#a2b4bd" font-size="12">' + config.xLabel + '</text>';
    return { svg: svg, x: x, y: y, plot: plot };
  }

  function line(points, x, y) {
    return points.map(function (point, i) {
      return (i ? 'L' : 'M') + x(point[0]).toFixed(2) + ',' + y(point[1]).toFixed(2);
    }).join(' ');
  }

  function metric(label, value, color) {
    return '<div class="elab-metric"><dt>' + label + '</dt><dd' + (color ? ' class="elab-' + color + '"' : '') + '>' + value + '</dd></div>';
  }

  function updateEuler() {
    if (!host) return;
    var h = steps[eulerIndex];
    var count = Math.round(2 / h);
    var values = [[0, 1]];
    for (var i = 1; i <= count; i++) values.push([i * h, values[i - 1][1] * (1 + h)]);
    var approximation = values[Math.round(1 / h)][1];
    var error = (Math.E - approximation) / Math.E * 100;
    var exact = [];
    for (var j = 0; j <= 240; j++) exact.push([j / 120, Math.exp(j / 120)]);
    var frame = chartFrame({ id: 'euler', xMax: 2, yMax: 8, xTicks: [0, 0.5, 1, 1.5, 2], yTicks: [0, 2, 4, 6, 8], xLabel: 'x', yLabel: 'y',
      title: 'Méthode d’Euler et fonction exponentielle sur [0 ; 2]',
      description: 'La courbe cyan représente e puissance x. La ligne orange relie les ' + (count + 1) + ' points de la méthode d’Euler de pas ' + number(h) + '. En x égal à 1, Euler donne ' + number(approximation) + ' contre ' + number(Math.E) + ' pour la solution exacte. Erreur relative : ' + number(error, 2) + ' pour cent.' });
    var svg = frame.svg;
    svg += '<path d="' + line(exact, frame.x, frame.y) + '" fill="none" stroke="#73e7de" stroke-width="2.7"/>';
    svg += '<path d="' + line(values, frame.x, frame.y) + '" fill="none" stroke="#ff9166" stroke-width="2.6"/>';
    values.forEach(function (point) {
      svg += '<circle cx="' + frame.x(point[0]) + '" cy="' + frame.y(point[1]) + '" r="' + (count <= 40 ? 3.2 : 1.3) + '" fill="#ff9166"' + (count <= 40 ? ' stroke="#0a151c" stroke-width="1"' : '') + '/>';
    });
    svg += '<line x1="' + frame.x(1) + '" y1="' + frame.y(0) + '" x2="' + frame.x(1) + '" y2="' + frame.y(Math.E) + '" stroke="#b9cbd3" stroke-opacity=".4" stroke-dasharray="4 5"/>';
    svg += '<circle cx="' + frame.x(1) + '" cy="' + frame.y(approximation) + '" r="5" fill="#ff9166" stroke="#0a151c" stroke-width="2"/>';
    svg += '<circle cx="' + frame.x(1) + '" cy="' + frame.y(Math.E) + '" r="4.5" fill="#73e7de" stroke="#0a151c" stroke-width="2"/></svg>';
    host.querySelector('#elab-euler-chart').innerHTML = svg;
    host.querySelector('#elab-step-value').textContent = 'h = ' + number(h);
    var input = host.querySelector('#elab-step');
    input.setAttribute('aria-valuetext', 'Pas h égal à ' + number(h));
    host.querySelector('#elab-euler-metrics').innerHTML =
      metric('Points calculés sur [0 ; 2]', number(count + 1)) +
      metric('Approximation en x = 1', number(approximation, 4), 'orange') +
      metric('Valeur exacte : e', number(Math.E, 4), 'cyan') +
      metric('Erreur relative en x = 1', number(error, 2) + ' %');
    host.querySelector('#elab-euler-caption').textContent = number(count) + ' pas de longueur ' + number(h) + ' ; le point initial (0 ; 1) est inclus dans les ' + number(count + 1) + ' points.';
  }

  function updateCapacitor() {
    if (!host) return;
    var time = capacitorTime;
    var voltage = 12 * (1 - Math.exp(-time / 10));
    var derivative = 1.2 * Math.exp(-time / 10);
    var points = [];
    for (var i = 0; i <= 250; i++) points.push([i / 5, 12 * (1 - Math.exp(-i / 50))]);
    var frame = chartFrame({ id: 'capacitor', xMax: 50, yMax: 13, xTicks: [0, 10, 20, 30, 40, 50], yTicks: [0, 3, 6, 9, 12], xLabel: 'Temps t (s)', yLabel: 'Tension u (V)',
      title: 'Charge d’un condensateur : évolution de la tension',
      description: 'La tension croît de zéro vers la limite de 12 volts, tracée en pointillés. À ' + number(time) + ' secondes, elle vaut ' + number(voltage, 2) + ' volts et sa dérivée vaut ' + number(derivative, 3) + ' volt par seconde.' });
    var svg = frame.svg;
    var baseline = frame.y(0);
    svg += '<path d="' + line(points, frame.x, frame.y) + ' L' + frame.x(50) + ',' + baseline + ' L' + frame.x(0) + ',' + baseline + ' Z" fill="#73e7de" fill-opacity=".06"/>';
    svg += '<line x1="' + frame.x(0) + '" y1="' + frame.y(12) + '" x2="' + frame.x(50) + '" y2="' + frame.y(12) + '" stroke="#81949e" stroke-width="1.5" stroke-dasharray="6 5"/>';
    svg += '<path d="' + line(points, frame.x, frame.y) + '" fill="none" stroke="#73e7de" stroke-width="3"/>';
    svg += '<line x1="' + frame.x(time) + '" y1="' + baseline + '" x2="' + frame.x(time) + '" y2="' + frame.y(voltage) + '" stroke="#ff9166" stroke-opacity=".6" stroke-dasharray="4 5"/>';
    svg += '<circle cx="' + frame.x(time) + '" cy="' + frame.y(voltage) + '" r="11" fill="#ff9166" fill-opacity=".14"/>';
    svg += '<circle cx="' + frame.x(time) + '" cy="' + frame.y(voltage) + '" r="5.5" fill="#ff9166" stroke="#0a151c" stroke-width="2"/></svg>';
    host.querySelector('#elab-capacitor-chart').innerHTML = svg;
    host.querySelector('#elab-time-value').textContent = number(time, 1) + ' s';
    host.querySelector('#elab-time').setAttribute('aria-valuetext', number(time, 1) + ' secondes');
    host.querySelector('#elab-capacitor-metrics').innerHTML =
      metric('Tension à cet instant', number(voltage, 2) + ' V', 'orange') +
      metric('Vitesse de charge u′(t)', number(derivative, 3) + ' V/s', 'cyan') +
      metric('Part de la tension finale', number(voltage / 12 * 100, 1) + ' %') +
      metric('Constante de temps τ', '10 s');
    host.querySelector('#elab-capacitor-caption').textContent = 'Le point orange indique la tension à t = ' + number(time, 1) + ' s. La ligne pointillée indique la limite de 12 V.';
  }

  function selectTab(name, focus) {
    currentTab = name;
    host.querySelectorAll('.elab-tab').forEach(function (tab) {
      var selected = tab.dataset.labTab === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });
    host.querySelectorAll('.elab-panel').forEach(function (panel) {
      panel.hidden = panel.id !== 'elab-' + name + '-panel';
    });
  }

  function render(container) {
    if (!(container instanceof Element)) throw new TypeError('Le laboratoire attend un élément HTML.');
    destroy();
    host = container;
    events = new AbortController();
    addStyles();
    host.innerHTML = `
      <section class="elab" aria-label="Laboratoire scientifique interactif">
        <div class="elab-tabs" role="tablist" aria-label="Expérience scientifique">
          <button type="button" id="elab-euler-tab" class="elab-tab" data-lab-tab="euler" role="tab" aria-controls="elab-euler-panel">Méthode d’Euler</button>
          <button type="button" id="elab-capacitor-tab" class="elab-tab" data-lab-tab="capacitor" role="tab" aria-controls="elab-capacitor-panel">Condensateur</button>
        </div>
        <div id="elab-euler-panel" class="elab-panel" role="tabpanel" aria-labelledby="elab-euler-tab" tabindex="0">
          <h3 class="elab-heading">Approcher l’exponentielle, pas à pas.</h3>
          <p class="elab-copy">Pour <span class="elab-formula">y′ = y</span> et <span class="elab-formula">y(0) = 1</span>, la solution exacte est <span class="elab-formula">y(x) = eˣ</span>. Change le pas <em>h</em> pour comparer la méthode d’Euler à cette courbe.</p>
          <div class="elab-layout">
            <div class="elab-plot">
              <div class="elab-legend"><span><i class="elab-swatch" aria-hidden="true"></i>Solution exacte eˣ</span><span><i class="elab-swatch elab-swatch-orange" aria-hidden="true"></i>Euler : points reliés</span></div>
              <div id="elab-euler-chart"></div>
              <p id="elab-euler-caption" class="elab-caption"></p>
            </div>
            <div class="elab-controls">
              <label for="elab-step" class="elab-control-label"><span>Longueur du pas</span><output id="elab-step-value" class="elab-control-value" for="elab-step"></output></label>
              <input id="elab-step" class="elab-range" type="range" min="0" max="4" step="1" aria-describedby="elab-step-help">
              <div id="elab-step-help" class="elab-range-ends"><span>0,5 · plus rapide</span><span>0,01 · plus précis</span></div>
              <dl id="elab-euler-metrics" class="elab-metrics" aria-live="polite" aria-atomic="true"></dl>
            </div>
          </div>
          <div class="elab-insight"><p><strong>La règle :</strong> x<sub>n+1</sub> = x<sub>n</sub> + h et y<sub>n+1</sub> = y<sub>n</sub> + hy<sub>n</sub> = (1 + h)y<sub>n</sub>, avec y<sub>0</sub> = 1.</p><p>À chaque pas, on utilise la pente au point de départ. Ici, Euler sous-estime eˣ aux points calculés : réduire h améliore l’approximation. L’erreur affichée vaut |y<sub>Euler</sub>(1) − e| / e × 100.</p></div>
        </div>
        <div id="elab-capacitor-panel" class="elab-panel" role="tabpanel" aria-labelledby="elab-capacitor-tab" tabindex="0" hidden>
          <h3 class="elab-heading">Observe la charge du condensateur.</h3>
          <p class="elab-copy">Un condensateur initialement déchargé est alimenté sous <span class="elab-formula">12 V</span>, avec <span class="elab-formula">RC = 10 s</span>. Déplace le curseur pour explorer sa tension et sa vitesse de charge.</p>
          <div class="elab-layout">
            <div class="elab-plot">
              <div class="elab-legend"><span><i class="elab-swatch" aria-hidden="true"></i>Tension u(t)</span><span><i class="elab-swatch elab-swatch-orange" aria-hidden="true"></i>Instant choisi</span><span><i class="elab-swatch elab-swatch-dashed" aria-hidden="true"></i>Limite : 12 V</span></div>
              <div id="elab-capacitor-chart"></div>
              <p id="elab-capacitor-caption" class="elab-caption"></p>
            </div>
            <div class="elab-controls">
              <label for="elab-time" class="elab-control-label"><span>Temps écoulé</span><output id="elab-time-value" class="elab-control-value" for="elab-time"></output></label>
              <input id="elab-time" class="elab-range" type="range" min="0" max="50" step="0.1" aria-describedby="elab-time-help">
              <div id="elab-time-help" class="elab-range-ends"><span>0 s · début</span><span>50 s · 5τ</span></div>
              <dl id="elab-capacitor-metrics" class="elab-metrics" aria-live="polite" aria-atomic="true"></dl>
            </div>
          </div>
          <div class="elab-insight"><p><strong>L’équation :</strong> u′(t) + 0,1u(t) = 1,2, avec u(0) = 0. Sa solution est u(t) = 12(1 − e<sup>−t/10</sup>) et sa dérivée est u′(t) = 1,2e<sup>−t/10</sup>.</p><p>À τ = 10 s, la tension atteint environ 63,2 % de sa valeur finale. Elle se rapproche de 12 V sans l’atteindre à un temps fini dans ce modèle. Sa dérivée diminue : la charge ralentit.</p></div>
        </div>
      </section>`;
    var signal = events.signal;
    host.querySelectorAll('.elab-tab').forEach(function (tab) {
      tab.addEventListener('click', function () { selectTab(tab.dataset.labTab, false); }, { signal: signal });
      tab.addEventListener('keydown', function (event) {
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(event.key) < 0) return;
        event.preventDefault();
        var next = event.key === 'Home' ? 'euler' : event.key === 'End' ? 'capacitor' : currentTab === 'euler' ? 'capacitor' : 'euler';
        selectTab(next, true);
      }, { signal: signal });
    });
    var stepInput = host.querySelector('#elab-step');
    stepInput.value = String(eulerIndex);
    stepInput.addEventListener('input', function () { eulerIndex = Number(stepInput.value); updateEuler(); }, { signal: signal });
    var timeInput = host.querySelector('#elab-time');
    timeInput.value = String(capacitorTime);
    timeInput.addEventListener('input', function () { capacitorTime = Number(timeInput.value); updateCapacitor(); }, { signal: signal });
    updateEuler();
    updateCapacitor();
    selectTab(currentTab, false);
  }

  function destroy() {
    if (events) events.abort();
    events = null;
    if (host) host.innerHTML = '';
    host = null;
  }

  window.EulerLab = { render: render, destroy: destroy };
}());
