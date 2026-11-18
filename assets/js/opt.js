(function (w, d) {
  'use strict';

  function init() {
    var U = w.UN;
    if (!U) return;
    var form = d.getElementById('optLeadForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        var payload = { type: 'Сотрудничество: дизайнер / архитектор' };
        fd.forEach(function (v, k) { payload[k] = v; });
        U.send(payload).then(function (r) {
          if (r && r.ok) {
            form.reset();
            U.toast('Заявка принята! Менеджер свяжется с вами (' + (r.order_number || '') + ')');
          } else U.toast('Ошибка отправки');
        });
      });
    }
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
