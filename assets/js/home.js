(function (w, d) {
  'use strict';

  var REDUCED = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SLIDE_MS = 6500;

  // Разбивает заголовок на слова для поочерёдного появления (маска снизу вверх)
  function splitWords(el) {
    if (!el) return;
    var html = el.innerHTML;
    var tmp = d.createElement('div');
    tmp.innerHTML = html;
    var out = [];
    var idx = 0;
    function walk(node, wrapTag) {
      node.childNodes.forEach(function (n) {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { out.push(' '); return; }
            var inner = '<span class="w"><span style="--d:' + (idx++) + '">' + part.replace(/</g, '&lt;') + '</span></span>';
            out.push(wrapTag ? '<' + wrapTag + '>' + inner + '</' + wrapTag + '>' : inner);
          });
        } else if (n.nodeType === 1) {
          walk(n, n.tagName.toLowerCase() === 'em' ? 'em' : null);
        }
      });
    }
    walk(tmp, null);
    el.innerHTML = out.join('');
  }

  function init() {
    var U = w.UN;
    if (!U) return;
    var cfg = U.cfg || {};
    var hero = cfg.hero || {};
    var PRODUCTS = U.products || [];
    var heroEl = d.getElementById('hero');

    /* ---------- 1. Тексты первого экрана из админки ---------- */
    var count = PRODUCTS.length;
    var t = d.getElementById('heroTitle');
    if (t && hero.title) t.innerHTML = hero.title;
    var map = {
      heroEyebrow: hero.eyebrow,
      heroSub: hero.subtitle ? String(hero.subtitle).replace(/\{count\}\s+позиц(ий|ии|ия)/, count + ' ' + U.plural(count, 'позиция', 'позиции', 'позиций')).replace('{count}', count) : '',
      heroCtaPrimary: hero.cta_primary,
      heroCtaSecondary: hero.cta_secondary
    };
    Object.keys(map).forEach(function (id) {
      var el = d.getElementById(id);
      if (el && map[id]) el.textContent = map[id];
    });
    var sSku = d.getElementById('statSku');
    if (sSku) sSku.textContent = count;

    /* ---------- 2. Лента интерьеров (плавный сдвиг, без прелоадера) ---------- */
    // Предпочитаем фото в интерьере: у карточек первые 1–3 фото — обычно постер с инфографикой
    function interior(p, pref) {
      var im = p.imgs || [];
      if (pref && im.indexOf(pref) >= 3) return pref;
      if (im.length >= 5) return im[3];
      return pref || im[im.length - 1] || '';
    }
    var showcase = (cfg.showcase || []).map(function (s) {
      var p = U.byId(s.id);
      return p && p.imgs && p.imgs.length >= 5 ? { p: p, img: interior(p, s.img), kicker: s.kicker } : null;
    }).filter(Boolean);
    PRODUCTS.filter(function (p) { return !p.is_hidden && p.stock_status !== 'supplier' && p.imgs && p.imgs.length >= 6 && !showcase.some(function (s) { return s.p.id === p.id; }); })
      .sort(function (a, b) { return Number(b.stock_qty || 0) - Number(a.stock_qty || 0); })
      .slice(0, Math.max(0, 7 - showcase.length))
      .forEach(function (p) { showcase.push({ p: p, img: interior(p), kicker: U.label('designs', p.design) }); });

    // Слайды первого экрана из админки: чистые фото интерьеров целиком (без обрезки)
    var heroSlides = (Array.isArray(cfg.hero_slides) ? cfg.hero_slides : []).filter(function (s) { return s && s.img; }).map(function (s) {
      var p = s.product_id ? U.byId(s.product_id) : null;
      return { img: s.img, title: s.title || (p ? p.name : ''), caption: s.caption || (p ? [U.size(p), p.surf].filter(Boolean).join(' · ') : ''), href: s.href || (p ? U.url(p) : 'catalog.html'), p: p };
    });
    if (!heroSlides.length) heroSlides = showcase.map(function (s) { return { img: s.img, title: s.p.name, caption: [U.size(s.p), s.p.surf].filter(Boolean).join(' · '), href: U.url(s.p), p: s.p, kicker: s.kicker }; });

    var track = d.getElementById('stageSlides');
    var dotsEl = d.getElementById('stageThumbs');
    var stage = d.getElementById('heroStage');
    var view = d.getElementById('heroView');
    var cur = 0, timer = null, paused = false;
    if (track && heroSlides.length) {
      track.innerHTML = heroSlides.map(function (s, i) {
        return '<a class="mg-slide" href="' + U.esc(s.href) + '" data-i="' + i + '">' +
          '<img src="' + U.esc(s.img) + '" alt="' + U.esc((s.title || 'Керамогранит') + ' в интерьере') + '"' + (i < 2 ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">' +
          '<span class="mg-slide-cap"><b>' + U.esc(s.title || '') + '</b><em>' + U.esc(s.caption || '') + '</em><i>→</i></span></a>';
      }).join('');
      var slides = track.querySelectorAll('.mg-slide');
      var visible = function () { var sw = slides[0].getBoundingClientRect().width || 1; return Math.max(1, Math.round(view.clientWidth / sw)); };
      var maxStart = function () { return Math.max(0, slides.length - visible()); };
      var buildDots = function () {
        var n = maxStart() + 1;
        dotsEl.innerHTML = n > 1 ? Array.from({ length: n }, function (_, i) { return '<button type="button" role="tab" data-i="' + i + '" aria-label="Слайд ' + (i + 1) + '"></button>'; }).join('') : '';
      };
      var go = function (i) {
        var m = maxStart();
        cur = i > m ? 0 : (i < 0 ? m : i);
        track.style.transform = 'translate3d(' + (-slides[cur].offsetLeft) + 'px,0,0)';
        dotsEl.querySelectorAll('button').forEach(function (el, k) { el.classList.toggle('on', k === cur); el.setAttribute('aria-selected', k === cur ? 'true' : 'false'); });
      };
      var schedule = function () {
        clearTimeout(timer);
        if (REDUCED || paused || maxStart() < 1) return;
        timer = setTimeout(function () { go(cur + 1); schedule(); }, SLIDE_MS);
      };
      buildDots();
      dotsEl.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) { go(Number(b.dataset.i)); schedule(); } });
      d.getElementById('heroPrev').onclick = function () { go(cur - 1); schedule(); };
      d.getElementById('heroNext').onclick = function () { go(cur + 1); schedule(); };
      view.addEventListener('mouseenter', function () { paused = true; clearTimeout(timer); });
      view.addEventListener('mouseleave', function () { paused = false; schedule(); });
      d.addEventListener('visibilitychange', function () { if (d.hidden) clearTimeout(timer); else schedule(); });
      var rt; w.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { buildDots(); go(Math.min(cur, maxStart())); }, 150); });
      var sx = null, sy = null;
      view.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
      view.addEventListener('touchend', function (e) {
        if (sx == null) return;
        var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { go(cur + (dx < 0 ? 1 : -1)); schedule(); }
        sx = null;
      });
      go(0);
      schedule();
    }
    if (heroEl) requestAnimationFrame(function () { heroEl.classList.add('is-in'); });

    function interiorOf(src) {
      var p = PRODUCTS.filter(function (x) { return x.imgs && x.imgs.indexOf(src) >= 0; })[0];
      return p && p.imgs.indexOf(src) < 3 && p.imgs.length >= 5 ? p.imgs[3] : src;
    }

    /* ---------- 2b. Популярные категории (овалы) ---------- */
    var catsEl = d.getElementById('homeCats');
    if (catsEl) {
      var texOf = function (list) {
        var p = list.filter(function (x) { return x.fitting_img; })[0] || list.filter(function (x) { return x.imgs && x.imgs.length; })[0];
        return p ? (p.fitting_img || U.thumb(p.imgs[0])) : '';
      };
      var cats = [];
      var sizeMap = {};
      PRODUCTS.forEach(function (p) { if (p.w && p.h) (sizeMap[p.w + 'x' + p.h] = sizeMap[p.w + 'x' + p.h] || []).push(p); });
      Object.keys(sizeMap).filter(function (k) { return sizeMap[k].length >= 8; }).sort(function (a, b) { return sizeMap[b].length - sizeMap[a].length; }).slice(0, 9).forEach(function (k) {
        var pref = sizeMap[k].filter(function (p) { return p.design === (k === '60x60' ? 'stone' : 'marble'); });
        cats.push({ href: 'catalog.html?size=' + k, title: k.replace('x', '×'), big: true, n: sizeMap[k].length, img: texOf(pref.length ? pref : sizeMap[k]) });
      });
      ['marble', 'stone', 'concrete', 'wood', 'decor'].forEach(function (k) {
        var list = PRODUCTS.filter(function (p) { return p.design === k; });
        if (list.length) cats.push({ href: 'catalog.html?design=' + k, title: U.label('designs', k), n: list.length, img: texOf(list) });
      });
      catsEl.innerHTML = cats.map(function (c) {
        return '<a class="mg-cat' + (c.big ? ' is-size' : '') + '" href="' + U.esc(c.href) + '">' +
          '<span class="mg-cat-oval">' + (c.img ? '<img src="' + U.esc(c.img) + '" alt="" loading="lazy" decoding="async">' : '') + '</span>' +
          '<span class="mg-cat-txt"><b>' + U.esc(c.title) + '</b><small>' + c.n + ' ' + U.plural(c.n, 'позиция', 'позиции', 'позиций') + '</small></span></a>';
      }).join('');
    }

    /* ---------- 2c. Плитка в интерьере (точки на фото) ---------- */
    var lookImg = d.getElementById('lookImg'), lookCard = d.getElementById('lookCard'), lookDots = d.getElementById('lookDots');
    var looks = showcase.slice(0, 5);
    if (lookImg && looks.length) {
      var SPOTS = [[58, 66], [42, 72], [64, 58], [50, 70], [36, 64]];
      var li = 0;
      var showLook = function (i) {
        li = (i + looks.length) % looks.length;
        var L = looks[li], sp = SPOTS[li % SPOTS.length];
        lookImg.innerHTML = '<img src="' + U.esc(L.img) + '" alt="' + U.esc(L.p.name + ' в интерьере') + '" loading="lazy" decoding="async">' +
          '<button type="button" class="mg-spot" style="left:' + sp[0] + '%;top:' + sp[1] + '%" aria-label="Показать плитку ' + U.esc(L.p.name) + '"><i></i></button>';
        lookCard.innerHTML = U.card(L.p);
        lookDots.innerHTML = looks.map(function (x, k) { return '<button type="button" data-l="' + k + '"' + (k === li ? ' class="on"' : '') + ' aria-label="Интерьер ' + (k + 1) + '"></button>'; }).join('');
      };
      lookDots.addEventListener('click', function (e) { var b = e.target.closest('[data-l]'); if (b) showLook(Number(b.dataset.l)); });
      lookImg.addEventListener('click', function (e) { if (e.target.closest('.mg-spot')) { var c = lookCard.querySelector('.pc'); if (c) { c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse'); } } });
      showLook(0);
    } else if (d.getElementById('lookSec')) d.getElementById('lookSec').style.display = 'none';

    /* ---------- 3. Подбор плитки ---------- */
    var qForm = d.getElementById('homeQuiz');
    if (qForm) {
      qForm.addEventListener('submit', function (e) {
        e.preventDefault();
        location.href = U.catalogUrl({
          room: d.getElementById('qRoom').value,
          design: d.getElementById('qDesign').value,
          size: d.getElementById('qSize').value
        });
      });
    }

    /* ---------- 4. Коллекции по фактуре ---------- */
    var collEl = d.getElementById('homeCollections');
    if (collEl) {
      var colls = cfg.collections || [];
      collEl.innerHTML = colls.map(function (c, i) {
        var f = c.filter || {};
        var n = PRODUCTS.filter(function (p) {
          if (f.design && p.design !== f.design) return false;
          if (f.cg && p.cg !== f.cg) return false;
          if (f.size && (p.w + 'x' + p.h) !== f.size) return false;
          if (f.tag && (p.tags || []).indexOf(f.tag) < 0) return false;
          return true;
        }).length;
        return (
          '<a href="' + U.esc(c.href) + '" class="coll-card' + (i === 0 ? ' big' : '') + '">' +
          '  <img src="' + U.esc(U.thumb(interiorOf(c.img))) + '" alt="' + U.esc(c.title) + '" loading="lazy" decoding="async">' +
          '  <div class="coll-body">' +
          '    <span class="coll-count">' + n + ' ' + U.plural(n, 'позиция', 'позиции', 'позиций') + '</span>' +
          '    <h3>' + U.esc(c.title) + '</h3>' +
          '    <p>' + U.esc(c.text || '') + '</p>' +
          '    <span class="coll-go">Смотреть <i>→</i></span>' +
          '  </div>' +
          '</a>'
        );
      }).join('');
    }

    /* ---------- 5. Витрина товаров ---------- */
    var rail = d.getElementById('homeRail');
    var tabsWrap = d.getElementById('homeTabs');
    var withPhoto = PRODUCTS.filter(function (p) { return p.imgs && p.imgs.length; });
    function renderRail(key) {
      if (!rail) return;
      var list = withPhoto;
      if (key === 'stock') list = withPhoto.filter(function (p) { return p.stock_status === 'in_stock'; }).sort(function (a, b) { return (b.stock_qty || 0) - (a.stock_qty || 0); });
      else if (key === 'new') list = PRODUCTS.filter(function (p) { return (p.tags || []).indexOf('new') >= 0; }).sort(function (a, b) { return (b.imgs.length ? 1 : 0) - (a.imgs.length ? 1 : 0); });
      else if (key === 'marble') list = withPhoto.filter(function (p) { return p.design === 'marble'; });
      else if (key === 'concrete') list = withPhoto.filter(function (p) { return p.design === 'concrete' || p.design === 'stone'; });
      else if (key === 'large') list = withPhoto.filter(function (p) { return Math.max(p.w || 0, p.h || 0) >= 120; });
      if (!list.length) list = withPhoto;
      rail.classList.remove('swap');
      void rail.offsetWidth;
      rail.innerHTML = list.slice(0, 8).map(U.card).join('');
      rail.classList.add('swap');
    }
    if (tabsWrap) {
      tabsWrap.addEventListener('click', function (e) {
        var btn = e.target.closest('.tab');
        if (!btn) return;
        tabsWrap.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('on'); });
        btn.classList.add('on');
        renderRail(btn.dataset.tab);
      });
    }
    renderRail('stock');

    /* ---------- 6. Отзывы ---------- */
    var revSec = d.getElementById('homeReviewsSec');
    var revGrid = d.getElementById('homeReviews');
    var revs = U.reviews || [];
    if (revSec && !revs.length) revSec.style.display = 'none';
    if (revGrid && revs.length) {
      revGrid.innerHTML = revs.slice(0, 6).map(function (r) {
        var stars = '★'.repeat(Math.max(1, Math.min(5, r.rating || 5)));
        return (
          '<article class="rev-card">' +
          '  <div class="rev-head">' +
          '    <div><b>' + U.esc(r.author_name) + '</b><div class="muted" style="font-size:12px">' + U.esc(r.author_city || '') + (r.product_name ? ' · ' + U.esc(r.product_name) : '') + '</div></div>' +
          '    <div class="rev-stars" title="' + (r.rating || 5) + ' из 5">' + stars + '</div>' +
          '  </div>' +
          '  <p class="rev-text">«' + U.esc(r.text) + '»</p>' +
          (r.reply_text ? '<div class="rev-reply"><b>Ответ АББА Керамика</b>' + U.esc(r.reply_text) + '</div>' : '') +
          '  <div class="muted" style="font-size:11.5px;margin-top:auto">' + U.esc(r.date_text || '') + '</div>' +
          '</article>'
        );
      }).join('');
    }
    var revForm = d.getElementById('publicReviewForm');
    if (revForm) {
      revForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var payload = {};
        new FormData(revForm).forEach(function (v, k) { payload[k] = v; });
        if (window.ABBA_STATIC) {
          revForm.reset();
          U.close('reviewModalBg');
          payload.type = 'Отзыв о салоне';
          U.staticContact(payload, '');
          return;
        }
        fetch('api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res && res.ok) {
              revForm.reset();
              U.close('reviewModalBg');
              U.toast('Спасибо! Отзыв появится на сайте после проверки.');
            } else U.toast((res && res.error) || 'Не удалось отправить отзыв');
          })
          .catch(function () { U.toast('Ошибка соединения'); });
      });
    }

    /* ---------- 7. Филиалы ---------- */
    var brGrid = d.getElementById('homeBranchesGrid');
    if (brGrid) {
      brGrid.innerHTML = U.branches().map(function (b) {
        return (
          '<article class="branch-card">' +
          '  <span class="tag tag-gold" style="align-self:flex-start">' + U.esc(b.type_badge || b.city) + '</span>' +
          '  <h3>' + U.esc(b.city) + '</h3>' +
          '  <div class="branch-list">' +
          '    <div class="branch-row"><strong>Адрес:</strong><span>' + U.esc(b.address) + '</span></div>' +
          (b.warehouse_address ? '    <div class="branch-row"><strong>Склад:</strong><span>' + U.esc(b.warehouse_address.replace(/^Отдельный склад:\s*/, '')) + '</span></div>' : '') +
          '    <div class="branch-row"><strong>Телефон:</strong><a href="tel:' + U.esc(b.phone_tel) + '" style="font-weight:700;color:var(--gold2)">' + U.esc(b.phone) + '</a></div>' +
          '    <div class="branch-row"><strong>Почта:</strong><a href="mailto:' + U.esc(b.email) + '">' + U.esc(b.email) + '</a></div>' +
          '    <div class="branch-row"><strong>Режим:</strong><span>' + U.esc(b.hours) + '</span></div>' +
          '  </div>' +
          '  <div style="margin-top:auto;padding-top:10px;display:flex;gap:8px;flex-wrap:wrap">' +
          '    <button type="button" class="btn btn-gold btn-sm" data-lead="Записаться в шоу-рум (' + U.esc(b.city) + ')" data-lead-type="Запись в шоу-рум ' + U.esc(b.city) + '">Записаться в шоу-рум</button>' +
          '    <a href="https://yandex.ru/maps/?text=' + encodeURIComponent(b.address.split(' — ')[0]) + '" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">Маршрут</a>' +
          '  </div>' +
          '</article>'
        );
      }).join('');
    }
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
