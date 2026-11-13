(function (w, d) {
  'use strict';

  function init() {
    var U = w.UN;
    if (!U) return;
    if (d.getElementById('astFab')) return;

    var wrap = d.createElement('div');
    wrap.innerHTML =
      '<button type="button" class="ast-fab" id="astFab" aria-label="Консультант Абба Керамика">' +
      '  <span style="width:9px;height:9px;border-radius:50%;background:#E4B858;display:inline-block"></span>' +
      '  <span>Абба-консультант</span>' +
      '</button>' +
      '<div class="ast-panel" id="astPanel">' +
      '  <div class="ast-hd">' +
      '    <div><b style="font-size:14px">Абба-консультант</b><div style="font-size:11px;opacity:.78">Помогу подобрать плитку, клей и филиал</div></div>' +
      '    <button type="button" id="astClose" style="background:none;border:0;color:#FBF4E4;font-size:18px">✕</button>' +
      '  </div>' +
      '  <div class="ast-msgs" id="astMsgs"></div>' +
      '  <div class="ast-quick">' +
      '    <button type="button" data-aq="мрамор">Под мрамор</button>' +
      '    <button type="button" data-aq="беж">Бежевая плитка</button>' +
      '    <button type="button" data-aq="адреса">Салоны и склады</button>' +
      '    <button type="button" data-aq="3д">3D-примерочная</button>' +
      '  </div>' +
      '  <form class="ast-inp-row" id="astForm">' +
      '    <input class="inp" id="astInp" placeholder="Спросите про формат, цену или адрес...">' +
      '    <button type="submit" class="btn btn-gold btn-sm">→</button>' +
      '  </form>' +
      '</div>';
    d.body.appendChild(wrap);

    var fab = d.getElementById('astFab');
    var panel = d.getElementById('astPanel');
    var msgs = d.getElementById('astMsgs');
    var inp = d.getElementById('astInp');

    function push(who, html) {
      var div = d.createElement('div');
      div.className = 'ast-msg ' + who;
      div.innerHTML = html;
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    }

    push('bot', 'Здравствуйте! Я помогу подобрать керамогранит Абба Керамика, рассчитать упаковки и клей или подсказать адреса в Мытищах, Москве и Твери.');

    function reply(q) {
      var s = String(q || '').toLowerCase();
      if (s.indexOf('адрес') >= 0 || s.indexOf('салон') >= 0 || s.indexOf('склад') >= 0 || s.indexOf('твер') >= 0 || s.indexOf('мытищ') >= 0 || s.indexOf('люблин') >= 0) {
        return U.branches().map(function (b) {
          return '<b>' + U.esc(b.city) + '</b>: ' + U.esc(b.address) + (b.warehouse_address ? ' (' + U.esc(b.warehouse_address) + ')' : '') + ' · <a href="tel:' + U.esc(b.phone_tel) + '" style="text-decoration:underline">' + U.esc(b.phone) + '</a>';
        }).join('<br><br>');
      }
      if (s.indexOf('3д') >= 0 || s.indexOf('3d') >= 0 || s.indexOf('примерить') >= 0) {
        return 'В нашей <a href="designer.html" style="text-decoration:underline;font-weight:600">3D-примерочной</a> можно уложить любую плитку на стены и пол в ванной, кухне или гостиной.';
      }
      if (s.indexOf('кальк') >= 0 || s.indexOf('клей') >= 0 || s.indexOf('расход') >= 0) {
        return 'Откройте <a href="calc.html" style="text-decoration:underline;font-weight:600">калькулятор расхода</a> — он автоматически посчитает коробки, +10% на подрезку, мешки клея и затирку.';
      }
      var hits = U.search(s).slice(0, 3);
      if (hits.length) {
        return 'Нашла подходящие позиции в каталоге:<br>' + hits.map(function (p) {
          return '• <a href="' + U.url(p) + '" style="text-decoration:underline">' + U.esc(p.name) + '</a> (' + U.size(p) + ') — <b>' + U.esc(U.priceText(p)) + '</b>';
        }).join('<br>') + '<br><br><a href="' + U.catalogUrl({ q: q }) + '" style="font-weight:600;color:var(--gold2)">Смотреть все совпадения →</a>';
      }
      return 'По вашему запросу могу предложить подбор через <a href="catalog.html" style="text-decoration:underline">каталог с фильтрами</a> или расчёт с менеджером. <button type="button" class="btn btn-gold btn-sm" style="margin-top:6px" onclick="UN.openLead({title:\'Консультация\'})">Связаться с менеджером</button>';
    }

    fab.onclick = function () { panel.classList.toggle('open'); };
    d.getElementById('astClose').onclick = function () { panel.classList.remove('open'); };

    d.querySelector('.ast-quick').addEventListener('click', function (e) {
      var b = e.target.closest('[data-aq]');
      if (!b) return;
      var txt = b.textContent;
      push('usr', U.esc(txt));
      setTimeout(function () { push('bot', reply(b.dataset.aq)); }, 180);
    });

    d.getElementById('astForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var txt = inp.value.trim();
      if (!txt) return;
      inp.value = '';
      push('usr', U.esc(txt));
      setTimeout(function () { push('bot', reply(txt)); }, 180);
    });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
