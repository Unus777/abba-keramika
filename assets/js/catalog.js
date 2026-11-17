(function (w, d) {
  'use strict';

  function init() {
    var U = w.UN;
    if (!U) return;
    var PRODUCTS = (U.products || []).filter(function (p) { return !p.is_hidden; });
    var PAGE_SIZE = 24;
    var grid = d.getElementById('catGrid');
    if (!grid) return;

    var $ = function (id) { return d.getElementById(id); };
    var qInput = $('catSearch'), sortSel = $('catSort'), priceMax = $('catPriceMax'), priceVal = $('catPriceVal');
    var countEl = $('catCount'), chipsEl = $('catChips'), pagEl = $('catPag'), filtersEl = $('catFilters');

    var SW = { white: '#F3F0EA', beige: '#D9C7A8', grey: '#A3A29E', brown: '#8A6146', dark: '#2C2C2C', black: '#151515', gold: 'linear-gradient(135deg,#1b1b1b,#c49a52)', color: 'linear-gradient(135deg,#C79A5B,#5E7C76)' };
    var GROUPS = ['design', 'color', 'room', 'surf', 'size', 'country', 'coll'];
    var FLAGS = { stock: 'В наличии', msk: 'Склад Москва', tver: 'Склад Тверь', new: 'Новинки', photo: 'С фото' };

    function m2(p, k) { var b = p.branch_stock || {}; return Number((b.m2 || {})[k] || 0); }
    function hasPhoto(p) { return !p.nophoto && p.imgs && p.imgs.length > 0; }
    var flagFn = {
      stock: function (p) { return p.stock_status === 'in_stock' && Number(p.stock_qty || 0) > 0; },
      msk: function (p) { return m2(p, 'msk') > 0; },
      tver: function (p) { return m2(p, 'tver') > 0; },
      new: function (p) { return (p.tags || []).indexOf('new') >= 0; },
      photo: hasPhoto
    };

    var priced = PRODUCTS.filter(function (p) { return Number(p.price) > 0; });
    var maxP = priced.reduce(function (m, p) { return Math.max(m, Number(p.price)); }, 0);
    maxP = Math.ceil(maxP / 100) * 100;

    var state = { q: '', design: [], color: [], room: [], surf: [], size: [], country: [], coll: [], flags: [], maxPrice: maxP || 0, sort: 'popular', page: 1 };

    var sp = new URLSearchParams(location.search);
    if (sp.get('q')) state.q = sp.get('q');
    GROUPS.forEach(function (k) { if (sp.get(k)) state[k] = sp.get(k).split(',').filter(Boolean); });
    if (sp.get('flag')) state.flags = sp.get('flag').split(',').filter(function (f) { return flagFn[f]; });
    if (sp.get('tag') === 'new' && state.flags.indexOf('new') < 0) state.flags.push('new');
    if (sp.get('stock') === '1' && state.flags.indexOf('stock') < 0) state.flags.push('stock');
    if (sp.get('max') && maxP) state.maxPrice = Math.min(maxP, Number(sp.get('max')) || maxP);
    if (sp.get('sort')) state.sort = sp.get('sort');

    // Цены: если ни у одной позиции нет цены — убираем ценовой фильтр и сортировку
    if (!priced.length && sortSel) {
      sortSel.querySelectorAll('option[data-price]').forEach(function (o) { o.remove(); });
      if (/^price/.test(state.sort)) state.sort = 'popular';
    } else if (priced.length && $('priceGrp')) {
      $('priceGrp').style.display = '';
      priceMax.max = maxP; priceMax.value = state.maxPrice;
      priceVal.textContent = U.rub(state.maxPrice);
    }
    if (qInput) qInput.value = state.q;
    if (sortSel) sortSel.value = state.sort;

    function countBy(fn) {
      var map = {};
      PRODUCTS.forEach(function (p) {
        var v = fn(p);
        (Array.isArray(v) ? v : [v]).forEach(function (x) { if (x) map[x] = (map[x] || 0) + 1; });
      });
      return map;
    }
    function mountFacet(elId, group, items) {
      var box = $(elId);
      if (!box) return;
      if (!items.length) { box.closest('.flt-grp').style.display = 'none'; return; }
      box.innerHTML = items.map(function (it) {
        var sw = group === 'color' && SW[it.key] ? '<i class="mg-sw" style="background:' + SW[it.key] + '"></i>' : '';
        return '<label class="flt-opt"><span><input type="checkbox" data-flt="' + group + '" value="' + U.esc(it.key) + '"' +
          (state[group].indexOf(it.key) >= 0 ? ' checked' : '') + '> ' + sw + U.esc(it.label) + '</span><small class="muted" data-cnt="' + group + ':' + U.esc(it.key) + '">' + it.count + '</small></label>';
      }).join('');
    }
    function byCount(map, labelFn) {
      return Object.keys(map).sort(function (a, b) { return map[b] - map[a]; }).map(function (k) { return { key: k, label: labelFn(k), count: map[k] }; });
    }
    var sizeMap = countBy(function (p) { return p.w && p.h ? p.w + 'x' + p.h : ''; });
    mountFacet('fltSize', 'size', byCount(sizeMap, function (k) { return k.replace('x', '×') + ' см'; }));
    mountFacet('fltDesign', 'design', byCount(countBy(function (p) { return p.design; }), function (k) { return U.label('designs', k); }));
    mountFacet('fltColor', 'color', byCount(countBy(function (p) { return p.cg; }), function (k) { return U.label('colors', k); }));
    mountFacet('fltSurf', 'surf', byCount(countBy(function (p) { return p.surf; }), function (k) { return k; }));
    mountFacet('fltRoom', 'room', byCount(countBy(function (p) { return p.rooms || []; }), function (k) { return U.label('rooms', k); }));
    // Страна: показываем, когда в каталоге есть позиции с указанной страной и есть из чего выбирать
    var ctryMap = countBy(function (p) { return p.country; });
    var ctryKeys = Object.keys(ctryMap);
    var noCtry = PRODUCTS.filter(function (p) { return !p.country; }).length;
    mountFacet('fltCountry', 'country', (ctryKeys.length >= 2 || (ctryKeys.length === 1 && noCtry > 0) || state.country.length) ? byCount(ctryMap, function (k) { return k; }) : []);
    // Коллекции из 2+ позиций
    var collMap = countBy(function (p) { return p.coll; });
    mountFacet('fltColl', 'coll', Object.keys(collMap).filter(function (k) { return collMap[k] > 1 || state.coll.indexOf(k) >= 0; }).sort(function (a, b) { return a.localeCompare(b, 'ru'); }).map(function (k) { return { key: k, label: k.replace(/^Коллекция\s+/, ''), count: collMap[k] }; }));

    d.querySelectorAll('[data-flag]').forEach(function (cb) { cb.checked = state.flags.indexOf(cb.dataset.flag) >= 0; });

    function norm(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[×х*]/g, 'x').replace(/\s+/g, ' '); }
    function hay(p) {
      return norm([p.name, p.sku, p.coll, p.color, p.surf, p.country, p.brand, p.w + 'x' + p.h, U.label('designs', p.design), U.label('colors', p.cg)].join(' '));
    }

    function matches(p, skip) {
      if (state.q) {
        var h = hay(p);
        if (!norm(state.q).split(' ').every(function (t) { return !t || h.indexOf(t) >= 0; })) return false;
      }
      if (skip !== 'design' && state.design.length && state.design.indexOf(p.design) < 0) return false;
      if (skip !== 'color' && state.color.length && state.color.indexOf(p.cg) < 0) return false;
      if (skip !== 'surf' && state.surf.length && state.surf.indexOf(p.surf) < 0) return false;
      if (skip !== 'room' && state.room.length && !(p.rooms || []).some(function (r) { return state.room.indexOf(r) >= 0; })) return false;
      if (skip !== 'size' && state.size.length && state.size.indexOf(p.w + 'x' + p.h) < 0) return false;
      if (skip !== 'country' && state.country.length && state.country.indexOf(p.country) < 0) return false;
      if (skip !== 'coll' && state.coll.length && state.coll.indexOf(p.coll) < 0) return false;
      for (var i = 0; i < state.flags.length; i++) { if (skip !== 'flag:' + state.flags[i] && !flagFn[state.flags[i]](p)) return false; }
      if (priced.length && state.maxPrice < maxP && Number(p.price) > state.maxPrice) return false;
      return true;
    }

    function updateCounts() {
      // счётчики фасетов с учётом остальных выбранных фильтров
      d.querySelectorAll('[data-cnt]').forEach(function (el) {
        var parts = el.dataset.cnt.split(':'), g = parts[0], v = parts.slice(1).join(':');
        var n = PRODUCTS.filter(function (p) {
          if (!matches(p, g)) return false;
          if (g === 'size') return p.w + 'x' + p.h === v;
          if (g === 'design') return p.design === v;
          if (g === 'color') return p.cg === v;
          if (g === 'surf') return p.surf === v;
          if (g === 'room') return (p.rooms || []).indexOf(v) >= 0;
          if (g === 'country') return p.country === v;
          if (g === 'coll') return p.coll === v;
          return false;
        }).length;
        el.textContent = n;
        el.closest('.flt-opt').classList.toggle('is-empty', n === 0);
      });
      var ids = { stock: 'cntStock', msk: 'cntMsk', tver: 'cntTver', new: 'cntNew', photo: 'cntPhoto' };
      Object.keys(ids).forEach(function (f) {
        var el = $(ids[f]);
        if (el) el.textContent = PRODUCTS.filter(function (p) { return matches(p, 'flag:' + f) && flagFn[f](p); }).length;
      });
    }

    function sortList(list) {
      var s = state.sort;
      var nm = function (a, b) { return String(a.name).localeCompare(String(b.name), 'ru'); };
      if (s === 'price_asc') return list.sort(function (a, b) { return (a.price || 1e9) - (b.price || 1e9); });
      if (s === 'price_desc') return list.sort(function (a, b) { return (b.price || 0) - (a.price || 0); });
      if (s === 'stock') return list.sort(function (a, b) { return Number(b.stock_qty || 0) - Number(a.stock_qty || 0); });
      if (s === 'new') return list.sort(function (a, b) { return (flagFn.new(b) - flagFn.new(a)) || (hasPhoto(b) - hasPhoto(a)) || nm(a, b); });
      if (s === 'name') return list.sort(nm);
      return list.sort(function (a, b) { return (hasPhoto(b) - hasPhoto(a)) || (Number(a.rk || 0) - Number(b.rk || 0)) || (Number(b.stock_qty || 0) - Number(a.stock_qty || 0)); });
    }

    function syncUrl() {
      var q = new URLSearchParams();
      if (state.q) q.set('q', state.q);
      GROUPS.forEach(function (k) { if (state[k].length) q.set(k, state[k].join(',')); });
      if (state.flags.length) q.set('flag', state.flags.join(','));
      if (state.sort !== 'popular') q.set('sort', state.sort);
      if (state.page > 1) q.set('page', state.page);
      var url = location.pathname + (q.toString() ? '?' + q.toString() : '');
      try { history.replaceState(null, '', url); } catch (e) {}
    }

    function labelFor(g, v) {
      if (g === 'design') return U.label('designs', v);
      if (g === 'color') return U.label('colors', v);
      if (g === 'room') return U.label('rooms', v);
      if (g === 'size') return v.replace('x', '×') + ' см';
      if (g === 'coll') return v.replace(/^Коллекция\s+/, 'Коллекция ');
      return v;
    }

    var grid3 = U.store.get('dens', '4');
    function setDens(v) {
      grid3 = v; U.store.set('dens', v);
      grid.classList.toggle('dens-3', v === '3');
      d.querySelectorAll('[data-dens]').forEach(function (b) { b.classList.toggle('on', b.dataset.dens === v); });
    }
    setDens(grid3);
    d.querySelectorAll('[data-dens]').forEach(function (b) { b.onclick = function () { setDens(b.dataset.dens); }; });

    var pillsEl = $('catPills');
    var PILLS = [{ g: '', v: '', t: 'Все' }];
    Object.keys(sizeMap).sort(function (a, b) { return sizeMap[b] - sizeMap[a]; }).forEach(function (k) { PILLS.push({ g: 'size', v: k, t: k.replace('x', '×') }); });
    ['marble', 'stone', 'concrete', 'wood', 'plain'].forEach(function (k) { if (PRODUCTS.some(function (p) { return p.design === k; })) PILLS.push({ g: 'design', v: k, t: U.label('designs', k) }); });
    PILLS.push({ g: 'flag', v: 'new', t: 'Новинки' });
    function renderPills() {
      if (!pillsEl) return;
      var none = !state.size.length && !state.design.length && !state.flags.length;
      pillsEl.innerHTML = PILLS.map(function (x) {
        var on = !x.g ? none : (x.g === 'flag' ? state.flags.indexOf(x.v) >= 0 : state[x.g].indexOf(x.v) >= 0);
        return '<button type="button" class="mg-pill' + (on ? ' on' : '') + '" data-pg2="' + x.g + '" data-pv="' + U.esc(x.v) + '">' + U.esc(x.t) + '</button>';
      }).join('');
    }
    if (pillsEl) pillsEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pg2]'); if (!b) return;
      var g = b.dataset.pg2, v = b.dataset.pv;
      if (!g) { state.size = []; state.design = []; state.flags = []; }
      else if (g === 'flag') { var i = state.flags.indexOf(v); if (i >= 0) state.flags.splice(i, 1); else state.flags.push(v); }
      else state[g] = state[g].length === 1 && state[g][0] === v ? [] : [v];
      d.querySelectorAll('[data-flt="size"],[data-flt="design"]').forEach(function (el) { el.checked = state[el.dataset.flt].indexOf(el.value) >= 0; });
      d.querySelectorAll('[data-flag]').forEach(function (cb) { cb.checked = state.flags.indexOf(cb.dataset.flag) >= 0; });
      state.page = 1; apply();
    });

    var h1 = $('catH1');
    function updateH1() {
      if (!h1) return;
      var parts = [];
      if (state.design.length === 1) parts.push(U.label('designs', state.design[0]).toLowerCase());
      if (state.size.length === 1) parts.push(state.size[0].replace('x', '×'));
      if (state.color.length === 1) parts.push(U.label('colors', state.color[0]).toLowerCase());
      var t = 'Керамогранит' + (parts.length ? ' ' + parts.join(', ') : '');
      if (!parts.length && !state.flags.length && !state.q) t = 'Каталог керамогранита';
      h1.textContent = t;
    }

    function apply() {
      var list = sortList(PRODUCTS.filter(function (p) { return matches(p); }));
      var total = list.length;
      var pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (state.page > pages) state.page = pages;
      var shown = Math.min(total, state.page * PAGE_SIZE);
      var slice = list.slice(0, shown);
      var word = U.plural(total, 'позиция', 'позиции', 'позиций');
      if (countEl) countEl.textContent = total ? 'Показано ' + shown + ' из ' + total : 'Ничего не найдено';
      var ac = $('catApplyCnt'); if (ac) ac.textContent = total + ' ' + word;

      grid.innerHTML = slice.length
        ? slice.map(U.card).join('')
        : '<div class="mg-empty"><h3>По выбранным фильтрам ничего не найдено</h3><p class="muted">Сбросьте часть параметров или напишите нам — подберём аналог со склада.</p><button type="button" class="mg-btn mg-btn-copper" id="emptyReset">Сбросить фильтры</button></div>';
      var er = $('emptyReset'); if (er) er.onclick = resetAll;
      grid.classList.remove('swap'); void grid.offsetWidth; grid.classList.add('swap');
      var more = $('catMore');
      if (more) {
        var left = total - shown;
        more.hidden = left <= 0;
        more.textContent = 'Показать ещё ' + Math.min(PAGE_SIZE, left) + ' из ' + left;
      }

      var nAct = 0;
      if (chipsEl) {
        var ch = [];
        if (state.q) ch.push('<button type="button" class="chip" data-clr="q">Поиск: ' + U.esc(state.q) + ' ✕</button>');
        state.flags.forEach(function (f) { ch.push('<button type="button" class="chip" data-clr="flag:' + f + '">' + FLAGS[f] + ' ✕</button>'); });
        GROUPS.forEach(function (g) {
          state[g].forEach(function (v) { ch.push('<button type="button" class="chip" data-clr="' + g + ':' + U.esc(v) + '">' + U.esc(labelFor(g, v)) + ' ✕</button>'); });
        });
        nAct = ch.length;
        if (ch.length > 1) ch.push('<button type="button" class="chip chip-clear" id="chipsReset">Сбросить всё</button>');
        chipsEl.innerHTML = ch.join('');
        chipsEl.style.display = ch.length ? '' : 'none';
        var cr = $('chipsReset'); if (cr) cr.onclick = resetAll;
      }
      var fn = $('catFltN'); if (fn) { fn.textContent = nAct ? String(nAct) : ''; fn.classList.toggle('on', nAct > 0); }
      if (pagEl) pagEl.innerHTML = '';
      renderPills();
      updateH1();
      updateCounts();
      syncUrl();
    }

    function resetAll() {
      state.q = ''; GROUPS.forEach(function (g) { state[g] = []; }); state.flags = []; state.page = 1;
      if (priced.length) { state.maxPrice = maxP; priceMax.value = maxP; priceVal.textContent = U.rub(maxP); }
      if (qInput) qInput.value = '';
      d.querySelectorAll('[data-flt],[data-flag]').forEach(function (el) { el.checked = false; });
      apply();
    }

    if (sp.get('page')) state.page = Math.max(1, Number(sp.get('page')) || 1);

    d.addEventListener('change', function (e) {
      var cb = e.target.closest('[data-flt]');
      if (cb) {
        var g = cb.dataset.flt, v = cb.value;
        if (cb.checked) { if (state[g].indexOf(v) < 0) state[g].push(v); } else state[g] = state[g].filter(function (x) { return x !== v; });
        state.page = 1; apply(); return;
      }
      var fl = e.target.closest('[data-flag]');
      if (fl) {
        var f = fl.dataset.flag;
        if (fl.checked) { if (state.flags.indexOf(f) < 0) state.flags.push(f); } else state.flags = state.flags.filter(function (x) { return x !== f; });
        state.page = 1; apply();
      }
    });
    var qt;
    if (qInput) qInput.addEventListener('input', function () { clearTimeout(qt); qt = setTimeout(function () { state.q = qInput.value.trim(); state.page = 1; apply(); }, 120); });
    if (sortSel) sortSel.addEventListener('change', function () { state.sort = sortSel.value; state.page = 1; apply(); });
    if (priceMax) priceMax.addEventListener('input', function () { state.maxPrice = Number(priceMax.value); priceVal.textContent = U.rub(state.maxPrice); state.page = 1; apply(); });
    if ($('catReset')) $('catReset').onclick = resetAll;

    // мобильные фильтры — выезжающая панель
    var tg = $('catFltToggle');
    function closeF() { filtersEl.classList.remove('open'); d.body.classList.remove('flt-lock'); }
    var isMob = function () { return w.matchMedia('(max-width: 1100px)').matches; };
    if (tg) tg.onclick = function () {
      if (isMob()) { filtersEl.classList.add('open'); d.body.classList.add('flt-lock'); }
      else { d.body.classList.toggle('flt-hidden'); U.store.set('flt_hidden', d.body.classList.contains('flt-hidden')); }
    };
    if (U.store.get('flt_hidden', false)) d.body.classList.add('flt-hidden');
    if ($('catFltClose')) $('catFltClose').onclick = closeF;
    if ($('catMore')) $('catMore').onclick = function () { state.page++; apply(); };
    if ($('catApplyMob')) $('catApplyMob').onclick = function () { closeF(); w.scrollTo({ top: grid.getBoundingClientRect().top + w.scrollY - 120, behavior: 'smooth' }); };
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeF(); });
    d.addEventListener('click', function (e) { if (d.body.classList.contains('flt-lock') && !e.target.closest('#catFilters') && !e.target.closest('#catFltToggle')) closeF(); });

    if (chipsEl) chipsEl.addEventListener('click', function (e) {
      var c = e.target.closest('[data-clr]');
      if (!c) return;
      var val = c.dataset.clr;
      if (val === 'q') { state.q = ''; if (qInput) qInput.value = ''; }
      else {
        var i = val.indexOf(':'), g = val.slice(0, i), v = val.slice(i + 1);
        if (g === 'flag') { state.flags = state.flags.filter(function (x) { return x !== v; }); d.querySelectorAll('[data-flag="' + v + '"]').forEach(function (el) { el.checked = false; }); }
        else { state[g] = state[g].filter(function (x) { return x !== v; }); d.querySelectorAll('[data-flt="' + g + '"]').forEach(function (el) { if (el.value === v) el.checked = false; }); }
      }
      state.page = 1; apply();
    });

    apply();
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
