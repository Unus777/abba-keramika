(function (w, d) {
  'use strict';

  function init() {
    var U = w.UN;
    if (!U) return;
    var grid = d.getElementById('mastersGrid');
    if (!grid) return;

    var list = U.masters || [];
    grid.innerHTML = list.map(function (m) {
      var areas = Array.isArray(m.areas) ? m.areas.join(', ') : (m.city || 'Москва и МО');
      var specs = Array.isArray(m.spec) ? m.spec.join(' · ') : (m.spec || '');
      return (
        '<article class="panel-card" style="display:flex;flex-direction:column;gap:10px">' +
        '  <div style="display:flex;justify-content:space-between;align-items:center">' +
        '    <span class="tag tag-gold">' + U.esc(areas) + '</span>' +
        '    <b style="color:#C88A23">★ ' + (m.rate || '4.9') + '</b>' +
        '  </div>' +
        '  <h3 style="margin:4px 0 0;font-size:24px">' + U.esc(m.name) + '</h3>' +
        '  <div class="muted" style="font-size:13.5px">' + U.esc(specs) + '</div>' +
        (m.bio ? '<p style="margin:0;font-size:13.5px;color:var(--tx2)">' + U.esc(m.bio) + '</p>' : '') +
        '  <div style="display:flex;gap:12px;font-size:13px;color:var(--tx2)">' +
        '    <span>Опыт: <b>' + U.esc(m.yrs || m.exp || 10) + ' лет</b></span>' +
        '    <span>Объектов: <b>' + U.esc(m.jobs || m.objs || 120) + '</b></span>' +
        '  </div>' +
        '  <div class="sum-row" style="margin-top:auto"><span>Укладка от</span><b>' + U.rub(m.from_ || m.price || 1800) + ' / м²</b></div>' +
        '  <button type="button" class="btn btn-portoro btn-sm" data-mlead="' + U.esc(m.name) + '">Пригласить мастера на объект</button>' +
        '</article>'
      );
    }).join('');

    grid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-mlead]');
      if (!b) return;
      U.openLead({
        title: 'Вызвать мастера: ' + b.dataset.mlead,
        type: 'Заявка на укладку плитки',
        comment: 'Интересует мастер ' + b.dataset.mlead
      });
    });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
