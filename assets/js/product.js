(function (w, d) {
  'use strict';

  function init() {
    var U = w.UN;
    if (!U) return;
    var $ = function (id) { return d.getElementById(id); };
    var sp = new URLSearchParams(location.search);
    var slug = sp.get('slug') || sp.get('id');
    if (!slug && location.pathname.indexOf('/product/') >= 0) slug = location.pathname.split('/product/').pop().replace(/\.html$/, '');

    var p = slug && U.byId(slug);
    if (!p && slug) p = (U.products || []).filter(function (x) { return x.sku === slug || x.slug === slug; })[0];
    if (!p) {
      $('prodRoot').innerHTML = '<div class="panel-card" style="text-align:center;padding:48px 20px"><h2>Позиция не найдена</h2><p class="muted">Возможно, она снята с продажи. Посмотрите похожие в каталоге.</p><a href="catalog.html" class="btn btn-gold">Перейти в каталог</a></div>';
      return;
    }
    var hasPhoto = !p.nophoto && p.imgs && p.imgs.length > 0;
    var priced = U.hasPrice(p);

    d.title = p.name + ' ' + U.size(p) + ' — керамогранит | Абба Керамика';
    var md = d.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', 'Керамогранит ' + p.name + ' ' + U.size(p) + ', ' + String(p.surf || '').toLowerCase() + ' поверхность. ' + U.stockInfo(p).text + '. Абба Керамика — Мытищи, Москва, Тверь.');

    $('prodBread').innerHTML = '<a href="index.html">Главная</a><span>/</span><a href="catalog.html">Каталог</a><span>/</span><a href="catalog.html?design=' + encodeURIComponent(p.design) + '">' + U.esc(U.label('designs', p.design)) + '</a><span>/</span><b>' + U.esc(p.name) + '</b>';

    // ---------- галерея ----------
    var imgs = hasPhoto ? p.imgs.slice() : [U.genTileArt(p)];
    var idx = 0;
    var mainImg = $('prodMainImg'), thumbs = $('prodThumbs'), count = $('galCount');
    var alt = 'Керамогранит ' + p.name + ' ' + U.size(p);
    mainImg.alt = alt;
    function show(i, instant) {
      idx = (i + imgs.length) % imgs.length;
      var src = imgs[idx];
      if (instant) mainImg.src = src;
      else {
        mainImg.classList.add('fade');
        var pre = new Image();
        pre.onload = pre.onerror = function () { mainImg.src = src; requestAnimationFrame(function () { mainImg.classList.remove('fade'); }); };
        pre.src = src;
      }
      if (count) count.textContent = (idx + 1) + ' / ' + imgs.length;
      thumbs.querySelectorAll('.gal-thumb').forEach(function (t, k) { t.classList.toggle('on', k === idx); if (k === idx && t.scrollIntoView && !instant) t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); });
      var lb = $('lbImg'); if (lb && $('lightbox').classList.contains('open')) lb.src = src;
    }
    thumbs.innerHTML = imgs.length > 1 ? imgs.map(function (src, i) {
      return '<button type="button" class="gal-thumb" data-g="' + i + '" aria-label="Фото ' + (i + 1) + '"><img src="' + U.esc(U.thumb(src)) + '" alt="" loading="lazy" decoding="async"></button>';
    }).join('') : '';
    thumbs.addEventListener('click', function (e) { var b = e.target.closest('[data-g]'); if (b) show(Number(b.dataset.g)); });
    if (imgs.length < 2) { $('galPrev').hidden = true; $('galNext').hidden = true; count.hidden = true; }
    $('galPrev').onclick = function (e) { e.stopPropagation(); show(idx - 1); };
    $('galNext').onclick = function (e) { e.stopPropagation(); show(idx + 1); };
    if (!hasPhoto) { $('galSoon').hidden = false; $('galMain').classList.add('is-art'); }
    show(0, true);

    // свайп
    var sx = null;
    $('galMain').addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    $('galMain').addEventListener('touchend', function (e) {
      if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
    });
    // лайтбокс
    var lbox = $('lightbox');
    function openLb() { if (!hasPhoto) return; $('lbImg').src = imgs[idx]; $('lbImg').alt = alt; lbox.classList.add('open'); d.body.style.overflow = 'hidden'; }
    function closeLb() { lbox.classList.remove('open'); d.body.style.overflow = ''; }
    $('galMain').addEventListener('click', function (e) { if (!e.target.closest('.gal-nav')) openLb(); });
    $('lbClose').onclick = closeLb;
    $('lbPrev').onclick = function (e) { e.stopPropagation(); show(idx - 1); };
    $('lbNext').onclick = function (e) { e.stopPropagation(); show(idx + 1); };
    lbox.addEventListener('click', function (e) { if (e.target === lbox) closeLb(); });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLb();
      if (e.target.closest && e.target.closest('input,textarea,select')) return;
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });
    if (imgs[1]) { var pre1 = new Image(); pre1.src = imgs[1]; }

    // ---------- основное ----------
    var tags = p.tags || [];
    var badges = [];
    if (tags.indexOf('new') >= 0) badges.push('<span class="c-badge new">Новинка</span>');
    var si = U.stockInfo(p);
    badges.push('<span class="prod-stock ' + si.cls + '"><i></i>' + U.esc(si.text) + '</span>');
    $('prodBadges').innerHTML = badges.join('');
    $('prodTitle').textContent = p.name;
    $('prodBrand').textContent = 'Керамогранит ' + U.size(p) + ' · ' + (p.surf || '') + ' · Арт. ' + (p.sku || p.id);
    $('prodPrice').innerHTML = priced ? U.esc(U.priceText(p)) : '<span class="price-ask">Цена по запросу</span>';
    var oldEl = $('prodOld');
    if (priced && p.old && p.old > p.price) { oldEl.textContent = U.rub(p.old) + ' / м²'; } else oldEl.style.display = 'none';
    var pack = 'В упаковке ' + (p.pcs || 1) + ' шт. = ' + String(p.m2 || 1).replace('.', ',') + ' м²' + (p.wt ? ' · ' + String(p.wt).replace('.', ',') + ' кг' : '');
    $('prodBoxInfo').textContent = priced ? pack + ' · ' + U.rub(U.boxPrice(p)) + ' за упаковку' : pack + ' · менеджер пришлёт цену и расчёт в течение рабочего дня';

    $('prodFacts').innerHTML = [
      ['Формат', U.size(p)], ['Поверхность', p.surf || '—'], ['Дизайн', U.label('designs', p.design)], ['Толщина', String(p.th || 8.5).replace('.', ',') + ' мм']
    ].map(function (f) { return '<div><small>' + f[0] + '</small><b>' + U.esc(f[1]) + '</b></div>'; }).join('');

    var desc = p.description || ('Керамогранит «' + p.name + '», формат ' + U.size(p) + ', ' + String(p.surf || 'матовая').toLowerCase() + ' поверхность.');
    $('prodDesc').textContent = desc;

    // ---------- наличие ----------
    var bs = p.branch_stock || {}, m2 = bs.m2 || {};
    var rows = [];
    function fm(n) { return Math.round(Number(n) || 0).toLocaleString('ru-RU'); }
    if (m2.msk !== undefined || m2.tver !== undefined) {
      rows.push(['Склад Москва', Number(m2.msk) > 0 ? 'ok' : 'order', Number(m2.msk) > 0 ? fm(m2.msk) + ' м²' : 'под заказ']);
      rows.push(['Склад Тверь', Number(m2.tver) > 0 ? 'ok' : 'order', Number(m2.tver) > 0 ? fm(m2.tver) + ' м²' : 'под заказ']);
      rows.push(['Шоу-рум Мытищи', Number(m2.msk) > 0 ? 'ok' : 'order', Number(m2.msk) > 0 ? 'доставка со склада 1–2 дня' : 'привезём под заказ']);
    } else {
      U.branches().forEach(function (b) { var st = bs[b.id] || p.stock_status || 'pre_order'; rows.push([b.short_name, st === 'in_stock' ? 'ok' : 'order', U.label('stock', st)]); });
    }
    if (p.stock_status === 'awaiting') rows = [['Все склады', 'order', 'ожидается поступление — оформите предзаказ']];
    $('prodBranchStock').innerHTML = rows.map(function (r) {
      return '<div class="stock-row"><span>' + U.esc(r[0]) + '</span><b class="' + r[1] + '">' + U.esc(r[2]) + '</b></div>';
    }).join('');

    // ---------- калькулятор ----------
    var areaInp = $('prodArea'), marginChk = $('prodMargin'), calcRes = $('prodCalcRes');
    var boxes = 1;
    function recalc() {
      var a = Math.max(0.5, Number(String(areaInp.value).replace(',', '.')) || 1);
      if (marginChk.checked) a *= 1.1;
      boxes = Math.max(1, Math.ceil(a / (p.m2 || 1)));
      var real = (boxes * (p.m2 || 1)).toFixed(2).replace('.', ',');
      calcRes.innerHTML = 'Нужно <b>' + boxes + ' ' + U.plural(boxes, 'упаковка', 'упаковки', 'упаковок') + '</b> — ' + real + ' м², ' + (boxes * (p.pcs || 1)) + ' шт.' +
        (priced ? ' · Итого: <b>' + U.rub(boxes * U.boxPrice(p)) + '</b>' : '');
    }
    areaInp.addEventListener('input', recalc);
    marginChk.addEventListener('change', recalc);
    recalc();

    var addBtn = $('prodAddCart');
    addBtn.textContent = priced ? 'Добавить в корзину' : 'Добавить в заявку';
    addBtn.onclick = function () { U.cart.add(p.id, boxes); };
    $('prodAskPrice').textContent = priced ? 'Быстрый заказ' : 'Узнать цену';
    $('prodAskPrice').onclick = function () {
      U.openLead({
        title: priced ? 'Быстрый заказ — ' + p.name : 'Узнать цену — ' + p.name,
        type: priced ? 'Быстрый заказ товара' : 'Запрос цены',
        comment: p.name + ' ' + U.size(p) + ' (арт. ' + (p.sku || p.id) + '), ' + boxes + ' уп. / ' + (boxes * (p.m2 || 1)).toFixed(2) + ' м²'
      });
    };
    $('prodTry3d').href = 'designer.html?tile=' + encodeURIComponent(p.id);

    // ---------- характеристики ----------
    var spec = [
      ['Артикул', p.sku || p.id],
      ['Коллекция', p.coll],
      ['Бренд', p.brand],
      ['Формат', U.size(p)],
      ['Толщина', String(p.th || 8.5).replace('.', ',') + ' мм'],
      ['Поверхность', p.surf],
      ['Дизайн', U.label('designs', p.design)],
      ['Цвет', p.color || U.label('colors', p.cg)],
      ['В упаковке', (p.pcs || 1) + ' шт. · ' + String(p.m2 || 1).replace('.', ',') + ' м²' + (p.wt ? ' · ' + String(p.wt).replace('.', ',') + ' кг' : '')],
      ['Паллет', p.pallet],
      ['Применение', (p.apps || ['floor', 'wall']).map(function (a) { return U.label('apps', a); }).join(', ')],
      ['Помещения', (p.rooms || []).map(function (r) { return U.label('rooms', r); }).join(', ')],
      ['Страна', p.country]
    ].filter(function (r) { return r[1]; });
    var collCount = (U.products || []).filter(function (x) { return x.coll === p.coll; }).length;
    $('prodSpecs').innerHTML = spec.map(function (r) {
      var v = U.esc(r[1]);
      if (r[0] === 'Коллекция' && collCount > 1) v = '<a href="catalog.html?coll=' + encodeURIComponent(p.coll) + '" style="text-decoration:underline">' + v + ' (' + collCount + ')</a>';
      if (r[0] === 'Страна' && p.country) v = '<a href="catalog.html?country=' + encodeURIComponent(p.country) + '" style="text-decoration:underline">' + v + '</a>';
      return '<tr><td>' + U.esc(r[0]) + '</td><td>' + v + '</td></tr>';
    }).join('');

    // ---------- похожие ----------
    var rel = (U.products || []).filter(function (x) { return x.id !== p.id && !x.is_hidden; }).map(function (x) {
      var s = (x.design === p.design ? 3 : 0) + (x.cg === p.cg ? 2 : 0) + (x.w === p.w && x.h === p.h ? 1 : 0) + ((!x.nophoto && x.imgs && x.imgs.length) ? 1.5 : 0);
      return [s, x];
    }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, 4).map(function (r) { return r[1]; });
    $('prodRelated').innerHTML = rel.map(U.card).join('');
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
