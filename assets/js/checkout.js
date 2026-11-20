(function (w, d) {
  'use strict';

  function init() {
    var U = w.UN;
    if (!U) return;

    var form = d.getElementById('checkoutForm');
    var sumEl = d.getElementById('checkoutSummary');
    var zoneSel = d.getElementById('ckZone');
    var branchSel = d.getElementById('ckBranch');
    var paySel = d.getElementById('ckPay');
    var orgBox = d.getElementById('ckOrgFields');
    var promoInp = d.getElementById('ckPromo');
    var promoBtn = d.getElementById('ckApplyPromo');
    var promoDisc = 0;

    if (!form || !sumEl) return;

    if (branchSel) {
      branchSel.innerHTML = U.branches().map(function (b) {
        return '<option value="' + U.esc(b.id) + '">' + U.esc(b.short_name) + ' — ' + U.esc(b.address) + '</option>';
      }).join('');
      branchSel.value = U.getActiveBranch().id;
    }

    function renderSummary() {
      var t = U.cart.totals();
      if (!t.items.length) {
        sumEl.innerHTML = '<h3>Корзина пуста</h3><p class="muted">Добавьте плитку из каталога перед оформлением заказа.</p><a href="catalog.html" class="btn btn-gold">Перейти в каталог</a>';
        return;
      }
      var zone = zoneSel ? zoneSel.value : 'moscow';
      var del = U.delivery(t.sum, zone);
      var discRub = Math.round(t.sum * promoDisc / 100);
      var total = Math.max(0, t.sum - discRub);

      sumEl.innerHTML =
        '<h3 style="margin-top:0">Ваш заказ (' + t.items.length + ' поз.)</h3>' +
        '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">' +
        t.items.map(function (r) {
          return '<div class="sum-row"><span>' + U.esc(r.item.name) + ' × ' + r.q + ' ' + r.unit + '</span><b>' + (r.line > 0 ? U.rub(r.line) : 'по запросу') + '</b></div>';
        }).join('') +
        '</div>' +
        '<div class="sum-row"><span>Общая площадь / вес</span><b>' + t.area.toFixed(2) + ' м² · ' + Math.round(t.weight) + ' кг</b></div>' +
        (discRub > 0 ? '<div class="sum-row"><span>Скидка по промокоду</span><b style="color:var(--ok)">−' + U.rub(discRub) + '</b></div>' : '') +
        '<div class="sum-row"><span>Доставка</span><b>' + (zone === 'pickup' ? 'самовывоз из салона' : 'рассчитает менеджер') + '</b></div>' +
        (t.noPrice ? '<div class="sum-row" style="color:var(--tx2)"><span>Позиции с ценой по запросу</span><b>' + t.noPrice + ' шт.</b></div>' : '') +
        '<div class="sum-total"><span>' + (zone === 'pickup' ? 'Итого' : 'Итого без доставки') + '</span><span>' + (t.noPrice ? (t.sum > 0 ? 'от ' + U.rub(total) : 'рассчитает менеджер') : U.rub(total)) + '</span></div>' +
        (t.noPrice ? '<p class="muted" style="font-size:12.5px;margin:8px 0 0">Менеджер свяжется с вами, подтвердит цену, наличие и стоимость доставки. Оплата — только после согласования.</p>' : '');
    }

    if (zoneSel) zoneSel.addEventListener('change', renderSummary);
    if (paySel && orgBox) {
      paySel.addEventListener('change', function () {
        orgBox.style.display = paySel.value === 'invoice' ? 'grid' : 'none';
      });
    }
    if (promoBtn && promoInp) {
      promoBtn.onclick = function () {
        var code = promoInp.value.trim().toUpperCase();
        if (code === 'ABBA5' || code === 'DESIGN10') {
          promoDisc = code === 'DESIGN10' ? 10 : 5;
          U.toast('Промокод ' + code + ' применён (−' + promoDisc + '%)');
          renderSummary();
        } else {
          promoDisc = 0;
          U.toast('Доступные промокоды: ABBA5 (−5%), DESIGN10 (−10%)');
        }
      };
    }

    w.addEventListener('abba:cart', renderSummary);
    renderSummary();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var t = U.cart.totals();
      if (!t.items.length) {
        U.toast('Корзина пуста — добавьте товары');
        return;
      }
      var fd = new FormData(form);
      var zone = zoneSel ? zoneSel.value : 'moscow';
      var del = U.delivery(t.sum, zone);
      var discRub = Math.round(t.sum * promoDisc / 100);
      var total = Math.max(0, t.sum - discRub);

      var payload = {
        type: 'Заказ с сайта',
        name: fd.get('name'),
        phone: fd.get('phone'),
        email: fd.get('email'),
        branch: fd.get('branch') || U.getActiveBranch().id,
        address: fd.get('address'),
        pay: fd.get('pay'),
        company: fd.get('company'),
        inn: fd.get('inn'),
        comment: fd.get('comment'),
        subtotal: t.sum,
        delivery_cost: del.cost,
        total_amount: total,
        items: t.items.map(function (r) {
          return { id: r.item.id, name: r.item.name, qty: r.q, unit: r.unit, price: r.boxPrice, line: r.line };
        })
      };

      U.send(payload).then(function (r) {
        if (r && r.ok) {
          var orders = U.store.get('orders', []);
          orders.unshift({
            order_number: r.order_number,
            date: new Date().toLocaleDateString('ru-RU'),
            total: total,
            status: 'Новый',
            branch: payload.branch,
            items: payload.items
          });
          U.store.set('orders', orders);
          U.cart.clear();
          form.innerHTML =
            '<div style="text-align:center;padding:24px 10px">' +
            '  <span class="tag tag-gold">Заказ оформлен</span>' +
            '  <h2 style="margin:12px 0">Спасибо! Заказ ' + U.esc(r.order_number || '') + ' принят</h2>' +
            '  <p class="muted">Менеджер выбранного филиала АББА Керамика проверит резерв на складе и свяжется с вами в рабочее время салона.</p>' +
            '  <div style="display:flex;gap:10px;justify-content:center;margin-top:20px">' +
            '    <a href="account.html" class="btn btn-gold">Мои заказы</a>' +
            '    <a href="catalog.html" class="btn btn-ghost">Продолжить выбор</a>' +
            '  </div>' +
            '</div>';
        } else {
          U.toast((r && r.error) || 'Ошибка оформления заказа');
        }
      }).catch(function () { U.toast('Ошибка сети'); });
    });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
