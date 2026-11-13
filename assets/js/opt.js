(function (w, d) {
  'use strict';

  function init() {
    var U = w.UN;
    if (!U) return;
    var range = d.getElementById('optArea');
    var out = d.getElementById('optOut');
    if (!range || !out) return;

    function recalc() {
      var m2 = Number(range.value) || 50;
      var ps = (U.products || []).filter(function (p) { return !p.is_hidden; });
      var enough = ps.filter(function (p) { var b = (p.branch_stock || {}).m2 || {}; return Number(b.msk || 0) + Number(b.tver || 0) >= m2; }).length;
      var pallets = Math.max(1, Math.ceil(m2 / 72));
      out.innerHTML =
        '<div class="sum-row"><span>Объём закупки</span><b>' + m2 + ' м²</b></div>' +
        '<div class="sum-row"><span>Позиций с таким остатком на складах</span><b>' + enough + '</b></div>' +
        '<div class="sum-row"><span>Ориентировочно паллет (60×120)</span><b>≈ ' + pallets + '</b></div>' +
        '<div class="sum-total"><span>Оптовая цена</span><span>по запросу</span></div>';
    }

    range.addEventListener('input', recalc);
    recalc();

    var form = d.getElementById('optLeadForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        var payload = { type: 'Оптовый / дизайнерский запрос' };
        fd.forEach(function (v, k) { payload[k] = v; });
        U.send(payload).then(function (r) {
          if (r && r.ok) {
            form.reset();
            U.toast('Запрос оптового отдела принят! (' + (r.order_number || '') + ')');
          } else U.toast('Ошибка отправки');
        });
      });
    }
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
