(function (w, d) {
  'use strict';

  function init() {
    var U = w.UN;
    if (!U) return;
    var box = d.getElementById('accountRoot');
    if (!box) return;

    var tabs = d.getElementById('accTabs');
    var panels = d.querySelectorAll('[data-acc-panel]');

    function showTab(name) {
      if (tabs) {
        tabs.querySelectorAll('.tab').forEach(function (t) {
          t.classList.toggle('on', t.dataset.acc === name);
        });
      }
      panels.forEach(function (p) {
        p.style.display = p.dataset.accPanel === name ? 'block' : 'none';
      });
    }

    if (tabs) {
      tabs.addEventListener('click', function (e) {
        var b = e.target.closest('.tab');
        if (b) showTab(b.dataset.acc);
      });
    }

    if (location.hash === '#favs') showTab('favs');

    // Render favorites
    function renderFavs() {
      var fg = d.getElementById('accFavsGrid');
      if (!fg) return;
      var items = U.favs.list().map(U.byId).filter(Boolean);
      fg.innerHTML = items.length
        ? items.map(U.card).join('')
        : '<div class="panel-card" style="grid-column:1/-1"><p class="muted">Вы ещё не добавили плитку в избранное.</p><a href="catalog.html" class="btn btn-gold btn-sm">Открыть каталог</a></div>';
    }

    // Render local orders
    function renderOrders() {
      var ol = d.getElementById('accOrdersList');
      if (!ol) return;
      var orders = U.store.get('orders', []);
      if (!orders.length) {
        ol.innerHTML = '<div class="panel-card"><p class="muted">История заказов пока пуста. Оформите первый заказ через корзину.</p></div>';
        return;
      }
      ol.innerHTML = orders.map(function (o) {
        return (
          '<div class="panel-card" style="margin-bottom:12px">' +
          '  <div style="display:flex;justify-content:space-between;align-items:center">' +
          '    <b>Заказ ' + U.esc(o.order_number) + '</b>' +
          '    <span class="tag tag-gold">' + U.esc(o.status) + '</span>' +
          '  </div>' +
          '  <div class="muted" style="font-size:13px;margin:6px 0">' + U.esc(o.date) + ' · ' + (o.items ? o.items.length : 0) + ' поз.</div>' +
          '  <b>Итого: ' + U.rub(o.total) + '</b>' +
          '</div>'
        );
      }).join('');
    }

    var profForm = d.getElementById('accProfileForm');
    if (profForm) {
      var saved = U.store.get('profile', { name: '', phone: '', city: 'Москва', role: 'Покупатель' });
      Object.keys(saved).forEach(function (k) {
        if (profForm.elements[k]) profForm.elements[k].value = saved[k];
      });
      profForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(profForm);
        var obj = {};
        fd.forEach(function (v, k) { obj[k] = v; });
        U.store.set('profile', obj);
        U.toast('Профиль сохранён');
      });
    }

    renderFavs();
    renderOrders();
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
