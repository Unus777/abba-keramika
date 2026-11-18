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
    if (!p && slug) p = (U.products || []).filter(function (x) { return x.slug === slug; })[0];
    // старые ссылки вида «elli-krem-60x60-vhp600853» ведут на новую страницу без артикула
    if (!p && slug && /-[a-z]{2,4}\d{4,}[a-z]?$/i.test(slug)) { var s2 = slug.replace(/-[a-z]{2,4}\d{4,}[a-z]?$/i, ''); p = (U.products || []).filter(function (x) { return x.slug === s2; })[0]; }
    if (!p) {
      $('prodRoot').innerHTML = '<div class="panel-card" style="text-align:center;padding:48px 20px"><h2>Позиция не найдена</h2><p class="muted">Возможно, она снята с продажи. Посмотрите похожие в каталоге.</p><a href="catalog.html" class="btn btn-gold">Перейти в каталог</a></div>';
      return;
    }
    var hasPhoto = !p.nophoto && p.imgs && p.imgs.length > 0;
    var priced = U.hasPrice(p);

    d.title = p.name + ' ' + U.size(p) + ' — керамогранит | АББА Керамика';
    var md = d.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', 'Керамогранит ' + p.name + ' ' + U.size(p) + ', ' + String(p.surf || '').toLowerCase() + ' поверхность. ' + U.stockInfo(p).text + '. АББА Керамика — Москва, Мытищи, Тверь.');

    $('prodBread').innerHTML = '<a href="index.html">Главная</a><span>›</span><a href="catalog.html">Каталог</a><span>›</span><a href="catalog.html?size=' + encodeURIComponent(p.w + 'x' + p.h) + '">' + U.esc(p.w + '×' + p.h) + '</a><span>›</span><a href="catalog.html?design=' + encodeURIComponent(p.design) + '">' + U.esc(U.label('designs', p.design)) + '</a><span>›</span><b>' + U.esc(p.name) + '</b>';

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
      thumbs.querySelectorAll('.gal-thumb').forEach(function (t, k) { t.classList.toggle('on', k === idx); if (k === idx && t.scrollIntoView && !instant) t.parentNode.scrollTo && t.parentNode.scrollTo({ top: t.offsetTop - t.parentNode.clientHeight / 2 + t.clientHeight / 2, left: t.offsetLeft - t.parentNode.clientWidth / 2 + t.clientWidth / 2, behavior: 'smooth' }); });
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
    var si = U.stockInfo(p);
    var badges = ['<span class="mg-stock ' + si.cls + '">' + U.esc(si.text) + '</span>'];
    if (tags.indexOf('new') >= 0) badges.unshift('<span class="pc-badge new">Новинка</span>');
    $('prodBadges').innerHTML = badges.join('');
    var coll = String(p.coll || '').replace(/^Коллекция\s+/, '');
    $('prodSeries').textContent = (coll ? 'Коллекция ' + coll : 'Керамогранит') + ' · ' + U.size(p);
    $('prodTitle').textContent = p.name;
    $('prodBrand').textContent = p.brand || 'АББА Керамика';
    $('prodPrice').innerHTML = priced ? U.esc(U.rub(p.price)) + '<small> / м²</small>' : '<span class="price-ask">Цена по запросу</span>';
    var oldEl = $('prodOld');
    if (priced && p.old && p.old > p.price) { oldEl.textContent = U.rub(p.old); } else oldEl.style.display = 'none';
    var th = String(p.th || 8.5).replace('.', ',') + ' мм';
    $('prodChips').innerHTML = [U.size(p), th, p.surf, U.label('designs', p.design), p.color].filter(Boolean).map(function (c) { return '<span>' + U.esc(c) + '</span>'; }).join('');
    var pack = 'В упаковке ' + (p.pcs || 1) + ' шт. = ' + String(p.m2 || 1).replace('.', ',') + ' м²' + (p.wt ? ' · ' + String(p.wt).replace('.', ',') + ' кг' : '');
    $('prodBoxInfo').textContent = priced ? pack + ' · ' + U.rub(U.boxPrice(p)) + ' за упаковку' : pack + ' · менеджер пришлёт цену и расчёт в течение рабочего дня';
    $('prodGeoSub').textContent = [U.size(p), th, p.surf].filter(Boolean).join(' · ');
    $('prodFacts').innerHTML = [
      ['Формат', U.size(p)], ['Толщина', th], ['Поверхность', p.surf || '—'], ['Дизайн', U.label('designs', p.design)],
      ['В упаковке', (p.pcs || 1) + ' шт. · ' + String(p.m2 || 1).replace('.', ',') + ' м²'], ['Вес упаковки', p.wt ? String(p.wt).replace('.', ',') + ' кг' : '—']
    ].map(function (f) { return '<div><small>' + f[0] + '</small><b>' + U.esc(f[1]) + '</b></div>'; }).join('');
    $('prodGeoBtn').onclick = function () { var f = $('prodFacts'); f.hidden = !f.hidden; this.classList.toggle('open', !f.hidden); };

    var desc = p.description || ('Керамогранит «' + p.name + '», формат ' + U.size(p) + ', ' + String(p.surf || 'матовая').toLowerCase() + ' поверхность.');
    var shortDesc = desc.length > 180 ? desc.slice(0, desc.lastIndexOf(' ', 180)) + '…' : desc;
    $('prodDesc').innerHTML = U.esc(shortDesc) + (desc.length > 180 ? ' <a href="#prodTabs" class="mg-ulink" id="descMore">Читать полностью</a>' : '');
    $('prodDescFull').innerHTML = '<h3>О товаре</h3><p>' + U.esc(desc) + '</p>' +
      '<p class="muted">Оттенок и рисунок на экране могут немного отличаться от живой плитки. Приезжайте посмотреть образцы в шоу-румах в Москве, Мытищах и Твери — или попросите менеджера прислать фото из конкретной партии.</p>';

    // свойства с иконками
    var apps = (p.apps || ['floor', 'wall']).map(function (a) { return U.label('apps', a); }).join(' и ').toLowerCase();
    var feats = [
      ['ruler', 'Формат ' + U.size(p)],
      ['layers', 'Толщина ' + th],
      ['drop', (p.surf || 'Матовая') + ' поверхность'],
      ['home', 'Для: ' + apps],
      ['box', (p.pcs || 1) + ' шт. в уп. · ' + String(p.m2 || 1).replace('.', ',') + ' м²'],
      ['store', 'Образцы в 3 шоу-румах']
    ];
    $('prodFeats').innerHTML = feats.map(function (f) { return '<div class="mg-feat">' + U.ic(f[0]) + '<span>' + U.esc(f[1]) + '</span></div>'; }).join('');
    $('prodDeliv').innerHTML = U.ic('truck') + '<span>Доставка по Москве, МО и Твери · самовывоз со склада</span>';
    $('prodAsk').innerHTML = U.ic('chat') + '<span>Задать вопрос менеджеру</span>';
    $('prodSalons').innerHTML = U.ic('pin') + '<span>Посмотреть вживую в шоу-руме</span>';
    $('prodDelivTab').innerHTML = '<h3>Доставка</h3><p>Привезём по Москве, Московской области и Твери, при необходимости поднимем на этаж. Стоимость и дату доставки менеджер рассчитает вместе с заказом.</p>' +
      '<h3>Самовывоз</h3><ul>' + U.branches().map(function (b) { return '<li><b>' + U.esc(b.city) + ':</b> ' + U.esc(b.address) + (b.warehouse_address ? '; ' + U.esc(b.warehouse_address) : '') + ' · <a href="tel:' + U.esc(b.phone_tel) + '">' + U.esc(b.phone) + '</a></li>'; }).join('') + '</ul>' +
      '<h3>Оплата</h3><p>Наличными или картой в салоне, по счёту для юрлиц. Подробнее — на странице <a class="mg-ulink" href="delivery.html">Доставка и оплата</a>.</p>';

    // избранное и «поделиться»
    var fb = $('prodFav');
    fb.dataset.id = p.id; fb.innerHTML = U.ic('heart');
    if (U.favs && U.favs.has && U.favs.has(p.id)) fb.classList.add('on');
    var shb = $('prodShare');
    shb.innerHTML = U.ic('share');
    shb.onclick = function () {
      var data = { title: p.name + ' — АББА Керамика', url: location.href };
      if (navigator.share) navigator.share(data).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () { U.toast('Ссылка скопирована'); });
    };

    // вкладки
    var tabsNav = d.querySelector('.mg-ptabs-nav');
    function openTab(k) {
      tabsNav.querySelectorAll('[data-pt]').forEach(function (b) { b.classList.toggle('on', b.dataset.pt === k); b.setAttribute('aria-selected', b.dataset.pt === k ? 'true' : 'false'); });
      d.querySelectorAll('.mg-ptab').forEach(function (x) { x.classList.toggle('on', x.dataset.pp === k); });
    }
    tabsNav.addEventListener('click', function (e) { var b = e.target.closest('[data-pt]'); if (b) openTab(b.dataset.pt); });
    var dm = $('descMore'); if (dm) dm.onclick = function () { openTab('desc'); };

    // ---------- наличие ----------
    var bs = p.branch_stock || {}, m2 = bs.m2 || {};
    var rows = [];
    function fm(n) { return Math.round(Number(n) || 0).toLocaleString('ru-RU'); }
    if (m2.msk !== undefined || m2.tver !== undefined) {
      rows.push(['Склад Москва', Number(m2.msk) > 0 ? 'ok' : 'order', Number(m2.msk) > 0 ? fm(m2.msk) + ' м²' : 'под заказ']);
      rows.push(['Склад Тверь', Number(m2.tver) > 0 ? 'ok' : 'order', Number(m2.tver) > 0 ? fm(m2.tver) + ' м²' : 'под заказ']);
      rows.push(['Шоу-рум Мытищи', Number(m2.msk) > 0 ? 'ok' : 'order', Number(m2.msk) > 0 ? 'доставка со склада 1–2 дня' : 'привезём под заказ']);
      if (p.stock_status === 'supplier') rows = [['Склад поставщика', 'ok', Number(p.supplier_m2) > 0 ? fm(p.supplier_m2) + ' м²' : 'есть'], ['Шоу-румы', 'order', 'привезём под заказ — срок уточнит менеджер']];
    } else {
      U.branches().forEach(function (b) { var st = bs[b.id] || p.stock_status || 'pre_order'; rows.push([b.short_name, st === 'in_stock' ? 'ok' : 'order', U.label('stock', st)]); });
    }
    if (p.stock_status === 'awaiting') rows = [['Все склады', 'order', 'ожидается поступление — оформите предзаказ']];
    $('prodBranchStock').innerHTML = rows.map(function (r) {
      return '<div class="stock-row"><span>' + U.esc(r[0]) + '</span><b class="' + r[1] + '">' + U.esc(r[2]) + '</b></div>';
    }).join('');

    // ---------- калькулятор ----------
    var areaInp = $('prodArea'), marginChk = $('prodMargin'), calcRes = $('prodCalcRes');
    var boxes = 1, unit = 'm2', per = Number(p.m2 || 1);
    function fmt2(n) { return (Math.round(n * 100) / 100).toString().replace('.', ','); }
    function recalc() {
      var v = Math.max(unit === 'm2' ? 0.5 : 1, Number(String(areaInp.value).replace(',', '.')) || 1);
      if (unit === 'm2') { var a = marginChk.checked ? v * 1.1 : v; boxes = Math.max(1, Math.ceil(a / per)); }
      else boxes = Math.max(1, Math.round(v));
      var real = boxes * per;
      calcRes.innerHTML = '<div><small>Упаковок</small><b>' + boxes + '</b></div><div><small>Площадь</small><b>' + fmt2(real) + ' м²</b></div><div><small>Плиток</small><b>' + (boxes * (p.pcs || 1)) + ' шт.</b></div>' +
        '<div class="mg-calc-sum"><small>Итого</small><b>' + (priced ? U.rub(boxes * U.boxPrice(p)) : 'по запросу') + '</b></div>';
      $('stMeta').textContent = U.size(p) + ' · ' + boxes + ' уп. / ' + fmt2(real) + ' м²';
    }
    d.querySelectorAll('#prodUnit [data-unit]').forEach(function (b) {
      b.onclick = function () {
        if (b.dataset.unit === unit) return;
        var cur = Number(String(areaInp.value).replace(',', '.')) || 1;
        unit = b.dataset.unit;
        d.querySelectorAll('#prodUnit [data-unit]').forEach(function (x) { x.classList.toggle('on', x === b); });
        if (unit === 'box') { areaInp.step = 1; areaInp.min = 1; areaInp.value = boxes; marginChk.closest('label').style.opacity = .45; marginChk.disabled = true; }
        else { areaInp.step = 0.5; areaInp.min = 0.5; areaInp.value = fmt2(boxes * per).replace(',', '.'); marginChk.closest('label').style.opacity = ''; marginChk.disabled = false; }
        recalc();
      };
    });
    $('prodMinus').onclick = function () { var st = unit === 'm2' ? 1 : 1; areaInp.value = Math.max(Number(areaInp.min), (Number(areaInp.value) || 0) - st); recalc(); };
    $('prodPlus').onclick = function () { var st = unit === 'm2' ? 1 : 1; areaInp.value = (Number(areaInp.value) || 0) + st; recalc(); };
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
        comment: p.name + ' ' + U.size(p) + ', ' + boxes + ' уп. / ' + (boxes * per).toFixed(2) + ' м²'
      });
    };
    $('prodTry3d').href = 'designer.html?tile=' + encodeURIComponent(p.id);
    $('prodTry3d').innerHTML = U.ic('cube') + ' Примерить в 3D';
    $('prodAsk').dataset.lead = 'Вопрос по товару — ' + p.name;

    // липкая панель
    var sticky = $('prodSticky');
    $('stImg').src = U.thumb(imgs[0]);
    $('stName').textContent = p.name;
    $('stPrice').innerHTML = priced ? U.esc(U.rub(p.price)) + '<small>/м²</small>' : 'Цена по запросу';
    $('stAdd').textContent = addBtn.textContent;
    $('stAdd').onclick = function () { U.cart.add(p.id, boxes); };
    if ('IntersectionObserver' in w) {
      new IntersectionObserver(function (en) {
        var off = !en[0].isIntersecting && en[0].boundingClientRect.top < 0;
        sticky.classList.toggle('on', off); sticky.setAttribute('aria-hidden', off ? 'false' : 'true');
      }).observe(addBtn);
    }

    // ---------- характеристики ----------
    var spec = [
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

    // ---------- schema.org Product (без артикула поставщика) ----------
    try {
      var ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.name + ' ' + U.size(p), brand: { '@type': 'Brand', name: p.brand || 'АББА Керамика' }, category: 'Керамогранит', description: p.description || '', image: imgs.filter(function (x) { return !/^data:/.test(x); }).slice(0, 4).map(function (x) { return new URL(x, location.href).href; }) };
      if (priced) ld.offers = { '@type': 'Offer', priceCurrency: 'RUB', price: p.price, availability: p.stock_status === 'in_stock' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder' };
      var sc = d.createElement('script'); sc.type = 'application/ld+json'; sc.textContent = JSON.stringify(ld); d.head.appendChild(sc);
    } catch (e) {}

    // ---------- похожие ----------
    var rel = (U.products || []).filter(function (x) { return x.id !== p.id && !x.is_hidden; }).map(function (x) {
      var s = (x.design === p.design ? 3 : 0) + (x.cg === p.cg ? 2 : 0) + (x.w === p.w && x.h === p.h ? 1 : 0) + ((!x.nophoto && x.imgs && x.imgs.length) ? 1.5 : 0);
      return [s, x];
    }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, 4).map(function (r) { return r[1]; });
    $('prodRelated').innerHTML = rel.map(U.card).join('');
    d.body.classList.add('has-sticky');
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
