(function (w, d) {
  'use strict';

  function init() {
    var U = w.UN;
    if (!U) return;

    var tileSel = d.getElementById('calcTile');
    var modeSel = d.getElementById('calcMode');
    var lenInp = d.getElementById('calcLen');
    var widInp = d.getElementById('calcWid');
    var areaInp = d.getElementById('calcAreaDirect');
    var dimBox = d.getElementById('calcDimsWrap');
    var dirBox = d.getElementById('calcDirectWrap');
    var laySel = d.getElementById('calcLay');
    var outEl = d.getElementById('calcOut');

    if (!outEl) return;

    if (tileSel) {
      tileSel.innerHTML = '<option value="custom">Свой формат 60×120 см (упаковка 1.44 м²)</option>' +
        (U.products || []).filter(function (p) { return !p.is_hidden && !U.isPc(p); }).slice().sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'ru'); }).map(function (p) {
          return '<option value="' + U.esc(p.id) + '">' + U.esc(p.name) + ' · ' + U.size(p) + (U.hasPrice(p) ? ' (' + U.rub(p.price) + '/' + U.unitLabel(p) + ')' : '') + '</option>';
        }).join('');
    }

    function compute() {
      var mode = modeSel ? modeSel.value : 'dims';
      if (dimBox) dimBox.style.display = mode === 'dims' ? 'grid' : 'none';
      if (dirBox) dirBox.style.display = mode === 'area' ? 'block' : 'none';

      var netArea = mode === 'dims'
        ? Math.max(0.5, (Number(lenInp.value) || 0) * (Number(widInp.value) || 0))
        : Math.max(0.5, Number(areaInp.value) || 12);

      var layCoef = laySel && laySel.value === 'diag' ? 1.15 : (laySel && laySel.value === 'herring' ? 1.18 : 1.1);
      var grossArea = netArea * layCoef;

      var selId = tileSel ? tileSel.value : 'custom';
      var p = selId !== 'custom' ? U.byId(selId) : null;
      var m2PerBox = p ? (p.m2 || 1.44) : 1.44;
      var pcsPerBox = p ? (p.pcs || 2) : 2;
      var priceM2 = p && U.hasPrice(p) ? Number(p.price) : 0;

      var boxes = Math.max(1, Math.ceil(grossArea / m2PerBox));
      var buyArea = boxes * m2PerBox;
      var pcs = boxes * pcsPerBox;
      var tileCost = boxes * Math.round(priceM2 * m2PerBox);
      var k = U.kit(buyArea);

      outEl.innerHTML =
        '<div class="sum-row"><span>Чистая площадь</span><b>' + netArea.toFixed(2) + ' м²</b></div>' +
        '<div class="sum-row"><span>С запасом на подрезку (+' + Math.round((layCoef - 1) * 100) + '%)</span><b>' + grossArea.toFixed(2) + ' м²</b></div>' +
        '<div class="sum-row"><span>Необходимо упаковок</span><b>' + boxes + ' уп. (' + pcs + ' шт · ' + buyArea.toFixed(2) + ' м²)</b></div>' +
        '<div class="sum-row"><span>Клей усиленный (25 кг)</span><b>' + k.glue + ' меш.</b></div>' +
        '<div class="sum-row"><span>Затирка и СВП-клипсы</span><b>' + k.grout + ' вед. + ' + k.svp + ' уп. СВП</b></div>' +
        '<div class="sum-total"><span>Стоимость плитки</span><span>' + (priceM2 > 0 ? U.rub(tileCost) : 'по запросу') + '</span></div>' +
        (priceM2 > 0 ? '' : '<p class="muted" style="font-size:12.5px;margin:8px 0 0">Отправьте расчёт менеджеру — пришлём цену, наличие на складе и стоимость доставки.</p>') +
        '<div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">' +
        (p ? '<button type="button" class="btn btn-gold" id="calcAddTile">Добавить ' + boxes + ' уп. в ' + (priceM2 > 0 ? 'корзину' : 'заявку') + '</button>' : '') +
        '<button type="button" class="btn btn-portoro" id="calcSendLead">Отправить расчёт менеджеру</button>' +
        '</div>';

      var addB = d.getElementById('calcAddTile');
      if (addB && p) addB.onclick = function () { U.cart.add(p.id, boxes); };

      var leadB = d.getElementById('calcSendLead');
      if (leadB) leadB.onclick = function () {
        U.openLead({
          title: 'Отправить расчёт на проверку менеджеру',
          type: 'Расчёт калькулятора',
          comment: 'Площадь: ' + netArea.toFixed(2) + ' м², с запасом: ' + buyArea.toFixed(2) + ' м² (' + boxes + ' уп.), клей: ' + k.glue + ' меш., материал: ' + (p ? p.name : 'Свой формат')
        });
      };
    }

    ['change', 'input'].forEach(function (ev) {
      [tileSel, modeSel, lenInp, widInp, areaInp, laySel].forEach(function (el) {
        if (el) el.addEventListener(ev, compute);
      });
    });
    compute();
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
