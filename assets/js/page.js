/* Страницы с текстами из админки: «О компании», «Дизайнерам», «Доставка и оплата» */
(function (w, d) {
  'use strict';
  function boot() {
    var U = w.UN;
    var root = d.querySelector('[data-page]');
    if (!U || !root || !U.renderSections) return;
    var key = root.getAttribute('data-page');
    var pg = U.pageCfg(key) || { title: '', sections: [] };
    var slides = (U.cfg && U.cfg.hero_slides) || [];
    var fallback = { about: 0, designers: 3, delivery: 1 }[key] || 0;
    var img = pg.image || (slides[fallback] && slides[fallback].img) || (slides[0] && slides[0].img) || 'assets/img/salon.webp';
    var btns = {
      about: '<a href="catalog.html" class="mg-btn mg-btn-dark">Смотреть каталог</a><a href="contacts.html" class="mg-btn mg-btn-ghost">Адреса салонов</a>',
      designers: '<button type="button" class="mg-btn mg-btn-dark" data-scroll="#optForm">Оставить заявку</button><a href="catalog.html" class="mg-btn mg-btn-ghost">Каталог</a>',
      delivery: '<button type="button" class="mg-btn mg-btn-dark" data-lead="Рассчитать доставку" data-lead-type="Расчёт доставки">Рассчитать доставку</button><a href="contacts.html" class="mg-btn mg-btn-ghost">Контакты салонов</a>'
    }[key] || '';
    var hero = root.querySelector('.ab-hero');
    if (hero) {
      hero.innerHTML =
        '<div class="mv">' +
        (pg.kicker ? '<span class="mg-kicker">' + U.esc(pg.kicker) + '</span>' : '') +
        '<h1>' + U.esc(pg.title || '') + '</h1>' +
        (pg.lead ? '<p class="ab-lead-big">' + U.esc(pg.lead) + '</p>' : '') +
        '<div class="ab-btns" style="display:flex;gap:10px;flex-wrap:wrap">' + btns + '</div>' +
        '</div>' +
        '<div class="ab-hero-img"><img src="' + U.esc(img) + '" alt="' + U.esc(pg.title || 'АББА Керамика') + '" decoding="async"></div>';
    }
    var body = root.querySelector('.ab-body');
    if (body) {
      body.innerHTML = U.renderSections(pg.sections || []);
      body.querySelectorAll('.ab-stats').forEach(function (s) { s.closest('.ab-sec').classList.add('ab-stats-sec'); });
    }
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-scroll]');
      if (!b) return;
      var t = d.querySelector(b.getAttribute('data-scroll'));
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    if (U.motion) U.motion(d);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else setTimeout(boot, 0);
})(window, document);
