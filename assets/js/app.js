(function (w, d) {
  'use strict';

  var BASE = w.UN || { cfg: {}, products: [], acc: [], masters: [], reviews: [] };
  var CACHE_TEX = {};

  var LABELS = {
    apps: {
      floor: 'Пол',
      wall: 'Стены',
      bathroom: 'Ванная',
      kitchen: 'Кухня',
      facade: 'Фасад и терраса',
      stairs: 'Ступени',
      heat: 'Тёплый пол',
      outdoor: 'Улица и крыльцо',
      public: 'Общественные зоны'
    },
    rooms: {
      bath: 'Ванная',
      kitchen: 'Кухня',
      living: 'Гостиная',
      hall: 'Прихожая и коридор',
      outdoor: 'Терраса и фасад',
      public: 'Коммерция'
    },
    designs: {
      marble: 'Мрамор и оникс',
      stone: 'Камень и травертин',
      wood: 'Дерево',
      concrete: 'Бетон и терраццо',
      plain: 'Моноколор',
      terrazzo: 'Терраццо',
      onyx: 'Оникс',
      mono: 'Моноколор'
    },
    colors: {
      white: 'Белый и молочный',
      beige: 'Бежевый и кремовый',
      grey: 'Серый камень',
      brown: 'Коричневый и дерево',
      dark: 'Графит и тёмные тона',
      color: 'Оникс и акцентные',
      black: 'Чёрный / Графит',
      gold: 'Чёрно-золотой'
    },
    stock: {
      in_stock: 'В наличии',
      awaiting: 'Ожидается поступление',
      pre_order: 'Под заказ',
      out_of_stock: 'Нет в наличии'
    }
  };

  var ICONS = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 20.5s-7.5-4.7-9.2-9.4C1.6 7.8 3.9 4.5 7.4 4.5c2 0 3.5 1 4.6 2.5 1.1-1.5 2.6-2.5 4.6-2.5 3.5 0 5.8 3.3 4.6 6.6-1.7 4.7-9.2 9.4-9.2 9.4Z"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M3 4h2l2.4 10.5a1.5 1.5 0 0 0 1.5 1.2h8.8a1.5 1.5 0 0 0 1.4-1.1L21 8H7"/><circle cx="10" cy="19.5" r="1.5"/><circle cx="18" cy="19.5" r="1.5"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m12 12 8-4.5M12 12v9M12 12 4 7.5"/></svg>',
    calc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3.1 5.2 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.5 2.1L9 10.6a16 16 0 0 0 6.4 6.4l1.2-1.2a2 2 0 0 1 2.1-.5c.8.4 1.7.6 2.6.7a2 2 0 0 1 1.7 1.9Z"/></svg>'
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function num(n) {
    var x = Number(n) || 0;
    return x.toLocaleString('ru-RU');
  }

  function rub(n) {
    return num(Math.round(Number(n) || 0)) + ' ₽';
  }

  function plural(n, one, few, many) {
    n = Math.abs(Number(n) || 0) % 100;
    var n1 = n % 10;
    if (n > 10 && n < 20) return many;
    if (n1 > 1 && n1 < 5) return few;
    if (n1 === 1) return one;
    return many;
  }

  function storeGet(k, def) {
    try {
      var raw = localStorage.getItem('abba_' + k);
      return raw ? JSON.parse(raw) : def;
    } catch (_) {
      return def;
    }
  }

  function storeSet(k, v) {
    try {
      localStorage.setItem('abba_' + k, JSON.stringify(v));
    } catch (_) {}
  }

  function ic(name) {
    return ICONS[name] || '';
  }

  function label(group, key) {
    return (LABELS[group] && LABELS[group][key]) || key || '';
  }

  function byId(id) {
    var p = (BASE.products || []).find(function (x) { return x.id === id || x.slug === id; });
    if (p) return p;
    return (BASE.acc || []).find(function (x) { return x.id === id; }) || null;
  }

  function isAcc(x) {
    return !!(x && String(x.id || '').indexOf('a') === 0 && !x.w);
  }

  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // Procedural ceramic/marble SVG preview when no real tile photo has been uploaded yet
  function genTileArt(p) {
    var id = (p && (p.id || p.slug || p.name)) || 'tile';
    if (CACHE_TEX[id]) return CACHE_TEX[id];

    var cg = (p && p.cg) || 'beige';
    var dg = (p && p.design) || 'marble';
    var surf = (p && p.surf) || 'Матовый';
    var seed = hashStr(String(id));

    var palettes = {
      white: ['#F9F6F0', '#EFE8DC', '#C9B596', '#4E4337'],
      beige: ['#EFE5D5', '#DFD0B8', '#B7925B', '#4A3B2A'],
      grey: ['#DCD8D1', '#C2BEB6', '#88837B', '#2F2C28'],
      brown: ['#C8A887', '#A47D58', '#6B4829', '#322114'],
      dark: ['#181512', '#26201A', '#E4B858', '#FBF4E4'],
      black: ['#181512', '#26201A', '#D6A647', '#FBF4E4'],
      gold: ['#1B1713', '#2D251C', '#E4B858', '#FFF6DF'],
      color: ['#DCE4DF', '#B8C6C0', '#63807A', '#23322F']
    };
    var pal = palettes[cg] || palettes.beige;
    var isDark = cg === 'dark' || cg === 'black' || cg === 'gold';
    var fmt = p && p.w && p.h ? (p.w + ' × ' + p.h + ' см') : 'Керамогранит';

    var veins = '';
    if (dg === 'wood') {
      for (var i = 0; i < 8; i++) {
        var y = 30 + i * 34 + (seed % 9);
        veins += '<path d="M0 ' + y + ' Q 180 ' + (y + ((i % 2 ? 1 : -1) * 8)) + ', 400 ' + (y + 3) + '" stroke="' + pal[2] + '" stroke-opacity="0.28" stroke-width="2" fill="none"/>';
      }
    } else if (dg === 'terrazzo') {
      for (var j = 0; j < 28; j++) {
        var cx = ((seed * (j + 3)) % 360) + 20;
        var cy = ((seed * (j + 7)) % 260) + 20;
        var r = 3 + ((seed + j) % 7);
        veins += '<polygon points="' + cx + ',' + cy + ' ' + (cx + r) + ',' + (cy + 3) + ' ' + (cx + 2) + ',' + (cy + r + 2) + '" fill="' + pal[j % 2 ? 2 : 3] + '" fill-opacity="0.35"/>';
      }
    } else if (dg === 'concrete') {
      for (var k = 0; k < 14; k++) {
        var rx = (seed * (k + 5)) % 350;
        var ry = (seed * (k + 11)) % 250;
        veins += '<circle cx="' + rx + '" cy="' + ry + '" r="' + (12 + (k % 20)) + '" fill="' + pal[2] + '" fill-opacity="0.08"/>';
      }
    } else {
      for (var v = 0; v < 5; v++) {
        var y1 = 40 + v * 48 + ((seed + v * 17) % 25);
        var y2 = 20 + v * 52 + ((seed + v * 29) % 35);
        veins += '<path d="M-10 ' + y1 + ' C 110 ' + (y1 - 35) + ', 260 ' + (y2 + 40) + ', 410 ' + y2 + '" stroke="' + pal[2] + '" stroke-opacity="' + (isDark ? '0.68' : '0.35') + '" stroke-width="' + (v % 2 === 0 ? '2.2' : '1.1') + '" fill="none"/>';
      }
    }

    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
      '<defs>' +
      '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + pal[0] + '"/>' +
      '<stop offset="100%" stop-color="' + pal[1] + '"/>' +
      '</linearGradient>' +
      '</defs>' +
      '<rect width="400" height="300" fill="url(#g)"/>' +
      veins +
      '<rect x="0" y="0" width="400" height="300" fill="none" stroke="' + pal[2] + '" stroke-opacity="0.18" stroke-width="2"/>' +
      '</svg>';

    var uri = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    CACHE_TEX[id] = uri;
    return uri;
  }

  function img(p) {
    if (!p) return 'assets/img/salon.svg';
    if (p.template_img) return p.template_img;
    if (Array.isArray(p.imgs) && p.imgs.length > 0 && p.imgs[0]) {
      return p.imgs[0];
    }
    return genTileArt(p);
  }

  function accImg(a) {
    if (a && a.img) return a.img;
    if (a && Array.isArray(a.imgs) && a.imgs.length > 0) return a.imgs[0];
    var title = (a && a.name) || 'Клей и затирка';
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">' +
      '<rect width="320" height="240" fill="#F4EDE3"/>' +
      '<rect x="95" y="42" width="130" height="148" rx="14" fill="#FFFDF9" stroke="#C28E36" stroke-width="2"/>' +
      '<rect x="110" y="64" width="100" height="42" rx="8" fill="#161310"/>' +
      '<text x="160" y="89" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="700" fill="#E4B858">АББА ПРОФИ</text>' +
      '<text x="160" y="138" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="11" font-weight="600" fill="#52473B">' + esc(title.slice(0, 22)) + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  function tex(p) {
    if (!p) return '';
    if (p.fitting_img) return p.fitting_img;
    return img(p);
  }

  function url(p) {
    if (!p) return 'catalog.html';
    return 'product.html?slug=' + encodeURIComponent(p.slug || p.id);
  }

  function size(p) {
    if (!p) return '';
    return p.w && p.h ? (p.w + '×' + p.h + ' см') : '';
  }

  function hasPrice(p) {
    return !!(p && Number(p.price) > 0);
  }

  // «Цена по запросу», если цена не задана в админке
  function priceText(p, unit) {
    if (!hasPrice(p)) return 'Цена по запросу';
    return rub(p.price) + (unit === false ? '' : ' / м²');
  }

  // Миниатюра для карточек: uploads/tiles/catalog/ART/01.jpg -> 01_t.jpg
  function thumb(src) {
    var s = String(src || '');
    return /uploads\/tiles\/catalog\/[^/]+\/\d+\.jpg$/.test(s) ? s.replace(/\.jpg$/, '_t.jpg') : s;
  }

  function stockInfo(p) {
    var st = (p && p.stock_status) || 'in_stock';
    var m2 = (p && p.branch_stock && p.branch_stock.m2) || null;
    var qty = m2 ? (Number(m2.msk || 0) + Number(m2.tver || 0)) : Number(p && p.stock_qty || 0);
    if (st === 'in_stock') return { cls: 'ok', text: 'В наличии' + (qty > 0 ? ' · ' + num(Math.round(qty)) + ' м²' : '') };
    if (st === 'awaiting') return { cls: 'soon', text: 'Ожидается поступление' };
    if (st === 'pre_order') return { cls: 'order', text: 'Под заказ' };
    return { cls: 'off', text: 'Нет в наличии' };
  }

  function boxPrice(p) {
    if (!p) return 0;
    return isAcc(p) ? p.price : Math.round((p.price || 0) * (p.m2 || 1));
  }

  function catalogUrl(params) {
    var q = new URLSearchParams();
    Object.keys(params || {}).forEach(function (k) {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
        q.set(k, params[k]);
      }
    });
    var s = q.toString();
    return 'catalog.html' + (s ? '?' + s : '');
  }

  function branches() {
    return (BASE.cfg && Array.isArray(BASE.cfg.branches) && BASE.cfg.branches.length)
      ? BASE.cfg.branches
      : [
          {
            id: 'mytishchi',
            city: 'Мытищи',
            short_name: 'Мытищи · Яуза',
            type_badge: 'Шоу-рум и точка продаж',
            address: 'г. Мытищи, строительный рынок «Яуза», Осташковское шоссе, вл. 4, стр. 4, павильон ТСК-2-62',
            phone: '8 (936) 209-01-01',
            phone_tel: '+79362090101',
            phone_raw: '89362090101',
            email: '89362090101@mail.ru',
            hours: 'Ежедневно 09:00–19:00'
          },
          {
            id: 'moscow',
            city: 'Москва',
            short_name: 'Москва · Люблинское поле',
            type_badge: 'Флагманский павильон',
            address: 'г. Москва, Тихорецкий бульвар, д. 1, стр. 70, корпус В, ТЦ «Люблинское поле», павильоны В-146, В-147',
            phone: '8 (936) 302-01-01',
            phone_tel: '+79363020101',
            phone_raw: '89363020101',
            email: '89363020101@mail.ru',
            hours: 'Ежедневно 10:00–20:00'
          },
          {
            id: 'tver',
            city: 'Тверь',
            short_name: 'Тверь · Коминтерна 44',
            type_badge: 'Шоу-рум и склады',
            address: 'г. Тверь, ул. Коминтерна, 44 — склад и шоу-рум',
            warehouse_address: 'Отдельный склад: посёлок Новая Константиновка, д. 1',
            phone: '8 (930) 096-01-01',
            phone_tel: '+79300960101',
            phone_raw: '89300960101',
            email: '89260025040@mail.ru',
            hours: 'Пн–Сб 09:00–18:00'
          }
        ];
  }

  function getActiveBranchId() {
    return storeGet('branch', 'moscow');
  }

  function setActiveBranchId(id) {
    storeSet('branch', id);
    updateBranchUI();
  }

  function getActiveBranch() {
    var list = branches();
    var id = getActiveBranchId();
    return list.find(function (b) { return b.id === id; }) || list[0];
  }

  function updateBranchUI() {
    var b = getActiveBranch();
    if (!b) return;
    d.querySelectorAll('[data-active-phone]').forEach(function (el) {
      el.textContent = b.phone;
      if (el.tagName === 'A') el.href = 'tel:' + b.phone_tel;
    });
    d.querySelectorAll('[data-active-email]').forEach(function (el) {
      el.textContent = b.email;
      if (el.tagName === 'A') el.href = 'mailto:' + b.email;
    });
    d.querySelectorAll('[data-active-city]').forEach(function (el) {
      el.textContent = b.short_name;
    });
    d.querySelectorAll('.hd-branch-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.branch === b.id);
    });
  }

  function toast(msg) {
    var el = d.getElementById('abbaToast');
    if (!el) {
      el = d.createElement('div');
      el.id = 'abbaToast';
      el.className = 'toast';
      d.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.classList.remove('show');
    }, 3200);
  }

  // Favorites & Cart
  var favs = {
    list: function () { return storeGet('favs', []); },
    has: function (id) { return favs.list().indexOf(id) >= 0; },
    toggle: function (id) {
      var l = favs.list();
      var i = l.indexOf(id);
      if (i >= 0) l.splice(i, 1); else l.push(id);
      storeSet('favs', l);
      syncBadges();
      d.querySelectorAll('.c-fav[data-id="' + id + '"]').forEach(function (b) {
        b.classList.toggle('on', i < 0);
      });
      toast(i < 0 ? 'Добавлено в избранное' : 'Удалено из избранного');
    }
  };

  var cart = {
    list: function () { return storeGet('cart', []); },
    add: function (id, boxes) {
      var l = cart.list();
      var b = Math.max(1, Number(boxes) || 1);
      var ex = l.find(function (x) { return x.id === id; });
      if (ex) ex.q += b; else l.push({ id: id, q: b });
      storeSet('cart', l);
      syncBadges();
      renderCart();
      var item = byId(id);
      toast((item && !hasPrice(item) && !isAcc(item) ? 'В заявке: ' : 'В корзине: ') + (item ? item.name : id) + ' (' + b + ' уп.)');
    },
    set: function (id, q) {
      var l = cart.list();
      var n = Number(q) || 0;
      if (n <= 0) l = l.filter(function (x) { return x.id !== id; });
      else {
        var ex = l.find(function (x) { return x.id === id; });
        if (ex) ex.q = n;
      }
      storeSet('cart', l);
      syncBadges();
      renderCart();
    },
    clear: function () {
      storeSet('cart', []);
      syncBadges();
      renderCart();
    },
    totals: function () {
      var l = cart.list();
      var sum = 0, area = 0, weight = 0, boxes = 0, items = [], noPrice = 0;
      l.forEach(function (row) {
        var p = byId(row.id);
        if (!p) return;
        var bp = boxPrice(p);
        if (!(bp > 0)) noPrice++;
        var line = bp * row.q;
        sum += line;
        boxes += row.q;
        if (!isAcc(p)) area += (p.m2 || 1) * row.q;
        weight += (p.wt || 15) * row.q;
        items.push({ item: p, q: row.q, line: line, boxPrice: bp });
      });
      return { sum: sum, area: area, weight: weight, boxes: boxes, items: items, noPrice: noPrice };
    }
  };

  function delivery(sum, zone) {
    var del = (BASE.cfg && BASE.cfg.delivery) || { free_from: 50000, moscow: 2500, mo: 3900, tver: 2900 };
    if (zone === 'pickup') return { cost: 0, text: 'Самовывоз со склада (0 ₽)' };
    if (sum >= (del.free_from || 50000) && (zone === 'moscow' || !zone)) {
      return { cost: 0, text: 'Бесплатная доставка по Москве и до ТК' };
    }
    if (zone === 'mo') return { cost: del.mo || 3900, text: 'Доставка по МО' };
    if (zone === 'tver') return { cost: del.tver || 2900, text: 'Доставка по Твери и области' };
    return { cost: del.moscow || 2500, text: 'Доставка по Москве в пределах МКАД' };
  }

  function kit(area) {
    var a = Math.max(1, Number(area) || 10);
    return {
      glue: Math.ceil(a / 5),
      grout: Math.ceil(a / 14),
      svp: Math.ceil(a * 4 / 100)
    };
  }

  function syncBadges() {
    var t = cart.totals();
    var fl = favs.list().length;
    d.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = t.boxes > 0 ? String(t.boxes) : '';
      el.classList.toggle('zero', t.boxes === 0);
    });
    d.querySelectorAll('[data-fav-count]').forEach(function (el) {
      el.textContent = fl > 0 ? String(fl) : '';
      el.classList.toggle('zero', fl === 0);
    });
    w.dispatchEvent(new CustomEvent('abba:cart'));
  }

  function card(p) {
    if (!p) return '';
    var hasPhoto = Array.isArray(p.imgs) && p.imgs.length > 0;
    var tags = p.tags || [];
    var badges = [];
    if (tags.indexOf('new') >= 0) badges.push('<span class="c-badge new">Новинка</span>');
    if (p.old && p.old > p.price && hasPrice(p)) badges.push('<span class="c-badge sale">-' + Math.round((1 - p.price / p.old) * 100) + '%</span>');
    if ((tags.indexOf('hit') >= 0)) badges.push('<span class="c-badge hit">Хит</span>');

    var favOn = favs.has(p.id) ? ' on' : '';
    var inCart = cart.list().some(function (x) { return x.id === p.id; });
    var first = img(p);
    var secondImg = (hasPhoto && p.imgs.length > 3) ? p.imgs[Math.min(p.imgs.length - 1, 4)] : (hasPhoto && p.imgs.length > 1 ? p.imgs[1] : '');
    if (secondImg === first) secondImg = '';
    var si = stockInfo(p);
    var media = hasPhoto
      ? '      <img class="i1" src="' + esc(thumb(first)) + '" alt="' + esc(p.name + ' ' + size(p)) + '" loading="lazy" decoding="async">' +
        (secondImg ? '<img class="i2" src="' + esc(thumb(secondImg)) + '" alt="" loading="lazy" decoding="async">' : '')
      : '      <div class="card-nophoto"><img src="' + esc(first) + '" alt="" loading="lazy"><span>Фото скоро появится</span></div>';
    return (
      '<article class="card" data-id="' + esc(p.id) + '">' +
      '  <div class="card-img">' +
      '    <a href="' + url(p) + '" aria-label="' + esc(p.name) + '">' + media + '</a>' +
      '    <div class="card-badges">' + badges.join('') + '</div>' +
      '    <button type="button" class="c-fav' + favOn + '" data-id="' + esc(p.id) + '" aria-label="В избранное">' + ic('heart') + '</button>' +
      '  </div>' +
      '  <div class="card-body">' +
      '    <div class="card-meta"><span>' + esc(size(p)) + '</span><span>' + esc(p.surf || '') + '</span></div>' +
      '    <h3 class="card-title"><a href="' + url(p) + '">' + esc(p.name) + '</a></h3>' +
      '    <div class="card-stock ' + si.cls + '"><i></i>' + esc(si.text) + '</div>' +
      '    <div class="card-foot">' +
      '      <div class="card-price">' +
      (hasPrice(p)
        ? (p.old && p.old > p.price ? '<span class="card-old">' + rub(p.old) + '</span>' : '') + '<b>' + rub(p.price) + '</b> <small>/ м²</small>'
        : '<b class="ask">Цена по запросу</b>') +
      '      </div>' +
      '      <div class="card-act">' +
      '        <button type="button" class="btn-cart' + (inCart ? ' in' : '') + '" data-add="' + esc(p.id) + '">' + (inCart ? 'В корзине ✓' : (hasPrice(p) ? 'В корзину' : 'В заявку')) + '</button>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</article>'
    );
  }

  function accCard(a) {
    return (
      '<article class="card">' +
      '  <div class="card-img"><img src="' + esc(accImg(a)) + '" alt="' + esc(a.name) + '" loading="lazy"></div>' +
      '  <div class="card-body">' +
      '    <div class="card-meta"><span>' + esc(a.brand || 'Abba Pro') + '</span><span>' + esc(a.pack || 'уп.') + '</span></div>' +
      '    <h3 class="card-title">' + esc(a.name) + '</h3>' +
      '    <div class="card-foot">' +
      '      <div class="card-price"><b>' + rub(a.price) + '</b></div>' +
      '      <button type="button" class="btn-cart" data-add="' + esc(a.id) + '">Добавить</button>' +
      '    </div>' +
      '  </div>' +
      '</article>'
    );
  }

  function search(q) {
    var s = String(q || '').trim().toLowerCase();
    if (!s) return [];
    return (BASE.products || []).filter(function (p) {
      return (p.name + ' ' + p.sku + ' ' + p.coll + ' ' + size(p) + ' ' + String(size(p)).replace('×', 'x') + ' ' + (p.surf || '') + ' ' + (p.color || '') + ' ' + label('designs', p.design)).toLowerCase().indexOf(s) >= 0;
    }).slice(0, 14);
  }

  function fmtPhone(el) {
    if (!el) return;
    el.addEventListener('input', function () {
      var dgt = el.value.replace(/\D/g, '').slice(0, 11);
      if (dgt.length && dgt[0] === '8') dgt = '7' + dgt.slice(1);
      if (!dgt) { el.value = ''; return; }
      var out = '+7';
      if (dgt.length > 1) out += ' (' + dgt.slice(1, 4);
      if (dgt.length >= 4) out += ') ' + dgt.slice(4, 7);
      if (dgt.length >= 7) out += '-' + dgt.slice(7, 9);
      if (dgt.length >= 9) out += '-' + dgt.slice(9, 11);
      el.value = out;
    });
  }

  function send(payload) {
    var body = Object.assign({
      branch: getActiveBranchId(),
      page: location.pathname
    }, payload || {});
    if (w.ABBA_STATIC) {
      // Статическая версия (GitHub Pages): сервера нет — сохраняем заявку в браузере и предлагаем отправить её письмом или позвонить
      var num = 'AB-' + String(Date.now()).slice(-6);
      var saved = storeGet('static_leads', []);
      saved.unshift(Object.assign({ order_number: num, date: new Date().toISOString() }, body));
      storeSet('static_leads', saved.slice(0, 20));
      setTimeout(function () { staticContact(body, num); }, 350);
      return Promise.resolve({ ok: true, order_number: num, static: true });
    }
    return fetch('send.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); });
  }

  function staticContact(body, num) {
    body = body || {};
    var br = branches().filter(function (b) { return b.id === (body.branch || getActiveBranchId()); })[0] || branches()[0];
    var lines = [];
    var labels = { name: 'Имя', client_name: 'Имя', phone: 'Телефон', client_phone: 'Телефон', email: 'Почта', type: 'Тип', comment: 'Комментарий', product_name: 'Товар', text: 'Отзыв', rating: 'Оценка', address: 'Адрес', total_amount: 'Сумма' };
    Object.keys(labels).forEach(function (k) { if (body[k]) lines.push(labels[k] + ': ' + body[k]); });
    if (Array.isArray(body.items) && body.items.length) {
      lines.push('Состав заявки:');
      body.items.forEach(function (it) { lines.push('— ' + it.name + (it.sku ? ' (арт. ' + it.sku + ')' : '') + ', ' + it.qty + ' уп.'); });
    }
    lines.push('Страница: ' + location.href);
    var subj = 'Заявка с сайта ' + (num || '') + ' — ' + (body.type || 'Абба Керамика');
    var mail = 'mailto:' + br.email + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(lines.join('\n'));
    var old = d.getElementById('staticLeadBg');
    if (old) old.remove();
    var bg = d.createElement('div');
    bg.className = 'modal-bg open';
    bg.id = 'staticLeadBg';
    bg.innerHTML =
      '<div class="modal" style="width:min(480px,100%);text-align:center">' +
      '  <span class="tag tag-gold">Заявка ' + esc(num || '') + ' сохранена</span>' +
      '  <h3 style="margin:12px 0 8px;font-size:24px">Спасибо! Остался один шаг</h3>' +
      '  <p class="muted" style="margin:0 0 16px">Чтобы менеджер салона «' + esc(br.short_name || br.city) + '» получил заявку сразу, отправьте её письмом — текст уже заполнен — или позвоните.</p>' +
      '  <div style="display:flex;flex-direction:column;gap:10px">' +
      '    <a class="btn btn-gold" href="' + esc(mail) + '">Отправить письмом на ' + esc(br.email) + '</a>' +
      '    <a class="btn btn-portoro" href="tel:' + esc(br.phone_tel) + '">Позвонить ' + esc(br.phone) + '</a>' +
      '    <button type="button" class="btn btn-ghost" data-close="staticLeadBg">Закрыть</button>' +
      '  </div>' +
      '</div>';
    d.body.appendChild(bg);
  }

  function open(id) {
    var el = d.getElementById(id);
    if (el) el.classList.add('open');
  }

  function close(id) {
    var el = d.getElementById(id);
    if (el) el.classList.remove('open');
  }

  function closeAll() {
    d.querySelectorAll('.modal-bg.open, .drawer-bg.open, .drawer.open, .mega.open, .nav-more.open').forEach(function (el) {
      el.classList.remove('open');
    });
  }

  function openLead(opts) {
    opts = opts || {};
    var m = d.getElementById('leadModal');
    if (!m) return;
    d.getElementById('leadTitle').textContent = opts.title || 'Оставить заявку в Абба Керамика';
    d.getElementById('leadType').value = opts.type || 'Заявка с сайта';
    d.getElementById('leadComment').value = opts.comment || '';
    var br = d.getElementById('leadBranch');
    if (br) br.value = getActiveBranchId();
    open('leadModalBg');
  }

  function renderCart() {
    var bd = d.getElementById('cartBody');
    var ft = d.getElementById('cartFoot');
    if (!bd || !ft) return;
    var t = cart.totals();
    if (!t.items.length) {
      bd.innerHTML = '<div style="text-align:center;padding:36px 12px" class="muted"><p>Корзина пока пуста</p><a href="catalog.html" class="btn btn-gold btn-sm">Перейти в каталог</a></div>';
      ft.innerHTML = '';
      return;
    }
    bd.innerHTML = t.items.map(function (row) {
      var p = row.item;
      return (
        '<div class="cart-item">' +
        '  <img src="' + esc(isAcc(p) ? accImg(p) : img(p)) + '" alt="' + esc(p.name) + '">' +
        '  <div>' +
        '    <b style="font-size:13.5px;display:block">' + esc(p.name) + '</b>' +
        '    <small class="muted">' + (row.boxPrice > 0 ? rub(row.boxPrice) + ' / уп.' : 'Цена по запросу') + (!isAcc(p) ? ' · ' + ((p.m2 || 1) * row.q).toFixed(2) + ' м²' : '') + '</small>' +
        '    <div class="qty" style="margin-top:6px">' +
        '      <button type="button" data-cdec="' + esc(p.id) + '">−</button>' +
        '      <span style="padding:0 8px;font-size:13px;font-weight:600">' + row.q + '</span>' +
        '      <button type="button" data-cinc="' + esc(p.id) + '">+</button>' +
        '    </div>' +
        '  </div>' +
        '  <div style="text-align:right">' +
        '    <b>' + (row.line > 0 ? rub(row.line) : '—') + '</b>' +
        '    <button type="button" class="btn-sm" data-cdel="' + esc(p.id) + '" style="display:block;margin-left:auto;margin-top:6px;background:none;border:0;color:var(--mut)">Удалить</button>' +
        '  </div>' +
        '</div>'
      );
    }).join('');

    var del = delivery(t.sum, 'moscow');
    var left = Math.max(0, 50000 - t.sum);
    ft.innerHTML =
      '<div style="font-size:12.5px;color:var(--tx2);margin-bottom:10px">' +
      (left > 0 ? 'До бесплатной доставки по Москве осталось <b>' + rub(left) + '</b>' : '<b style="color:var(--ok)">Бесплатная доставка по Москве активирована ✓</b>') +
      '</div>' +
      '<div class="sum-row"><span>Площадь / вес</span><b>' + t.area.toFixed(2) + ' м² · ' + Math.round(t.weight) + ' кг</b></div>' +
      (t.noPrice ? '<div style="font-size:12.5px;color:var(--tx2);margin-bottom:8px">Для части позиций цена по запросу — менеджер пришлёт точный расчёт.</div>' : '') +
      '<div class="sum-total" style="margin-bottom:14px"><span>Итого</span><span>' + (t.sum > 0 ? rub(t.sum) + (t.noPrice ? ' +' : '') : 'по запросу') + '</span></div>' +
      '<div style="display:flex;gap:8px">' +
      '  <a href="checkout.html" class="btn btn-gold" style="flex:1">Оформить заказ</a>' +
      '  <button type="button" class="btn btn-ghost btn-sm" id="cartFastLead">В 1 клик</button>' +
      '</div>';

    var fl = d.getElementById('cartFastLead');
    if (fl) {
      fl.onclick = function () {
        close('cartDrawer');
        close('cartBg');
        openLead({
          title: 'Быстрый заказ по корзине',
          type: 'Быстрый заказ',
          comment: t.items.map(function (r) { return r.item.name + ' × ' + r.q + ' уп.'; }).join('; ') + ' (Сумма: ' + rub(t.sum) + ')'
        });
      };
    }
  }

  function mountShell() {
    var brs = branches();
    var activeB = getActiveBranch();
    var page = location.pathname.split('/').pop() || 'index.html';

    var hd = d.getElementById('siteHeader');
    if (hd) {
      hd.className = 'hd';
      hd.innerHTML =
        '<div class="hd-portoro">' +
        '  <div class="wrap">' +
        '    <div class="hd-branches">' +
        brs.map(function (b) {
          return '<button type="button" class="hd-branch-btn' + (b.id === activeB.id ? ' active' : '') + '" data-branch="' + esc(b.id) + '"><span class="hd-branch-dot"></span><span>' + esc(b.city) + ' · ' + esc(b.phone) + '</span></button>';
        }).join('') +
        '    </div>' +
        '    <div class="hd-top-links">' +
        '      <a href="delivery.html">Доставка Москва · МО · Тверь</a>' +
        '      <a href="contacts.html">3 шоу-рума и склада</a>' +
        '      <a href="tel:' + esc(activeB.phone_tel) + '" class="hd-top-phone" data-active-phone>' + esc(activeB.phone) + '</a>' +
        '    </div>' +
        '  </div>' +
        '</div>' +
        '<div class="wrap hd-in">' +
        '  <a href="index.html" class="brand">' +
        '    <span class="brand-mark"><img src="assets/img/favicon.svg" alt="Абба Керамика"></span>' +
        '    <span class="brand-txt"><b>Абба Керамика</b><small>Керамогранит · 3 склада</small></span>' +
        '  </a>' +
        '  <nav class="nav" aria-label="Основное меню">' +
        '    <button type="button" class="nav-a nav-cat-btn" id="megaToggle">' + ic('grid') + '<span>Каталог</span></button>' +
        '    <a href="designer.html" class="nav-a' + (page === 'designer.html' ? ' on' : '') + '">3D-примерочная</a>' +
        '    <a href="calc.html" class="nav-a' + (page === 'calc.html' ? ' on' : '') + '">Калькулятор</a>' +
        '    <a href="opt.html" class="nav-a' + (page === 'opt.html' ? ' on' : '') + '">Дизайнерам и опт</a>' +
        '    <a href="masters.html" class="nav-a' + (page === 'masters.html' ? ' on' : '') + '">Мастера</a>' +
        '    <a href="contacts.html" class="nav-a' + (page === 'contacts.html' ? ' on' : '') + '">Салоны и склады</a>' +
        '    <div class="nav-more-wrap">' +
        '      <button type="button" class="nav-a" id="moreToggle">Ещё ▾</button>' +
        '      <div class="nav-more" id="navMore">' +
        '        <a href="about.html">О компании Абба Керамика</a>' +
        '        <a href="delivery.html">Доставка и самовывоз</a>' +
        '        <a href="account.html">Личный кабинет и бонусы</a>' +
        '      </div>' +
        '    </div>' +
        '  </nav>' +
        '  <div class="hd-act">' +
        '    <button type="button" class="ic-btn" id="openSearch" aria-label="Поиск">' + ic('search') + '</button>' +
        '    <a href="account.html#favs" class="ic-btn" aria-label="Избранное">' + ic('heart') + '<span class="badge-n zero" data-fav-count></span></a>' +
        '    <button type="button" class="ic-btn" id="openCart" aria-label="Корзина">' + ic('cart') + '<span class="badge-n zero" data-cart-count></span></button>' +
        '    <button type="button" class="btn btn-gold btn-sm" id="openFastLead">Заказать расчёт</button>' +
        '    <button type="button" class="ic-btn burger" id="openMobNav" aria-label="Меню">' + ic('menu') + '</button>' +
        '  </div>' +
        '</div>' +
        '<div class="mega" id="megaMenu">' +
        '  <div class="wrap mega-grid">' +
        '    <div class="mega-col"><h4>По дизайну</h4>' +
        '      <a href="catalog.html?design=marble"><span>Под мрамор</span><span>→</span></a>' +
        '      <a href="catalog.html?design=stone"><span>Камень и травертин</span><span>→</span></a>' +
        '      <a href="catalog.html?design=wood"><span>Под дерево</span><span>→</span></a>' +
        '      <a href="catalog.html?design=concrete"><span>Бетон и терраццо</span><span>→</span></a>' +
        '      <a href="catalog.html?design=plain"><span>Однотонный</span><span>→</span></a>' +
        '    </div>' +
        '    <div class="mega-col"><h4>По цвету</h4>' +
        '      <a href="catalog.html?color=beige"><span>Тёплый беж и крем</span><span>→</span></a>' +
        '      <a href="catalog.html?color=white"><span>Молочный белый</span><span>→</span></a>' +
        '      <a href="catalog.html?color=dark"><span>Графит и тёмные</span><span>→</span></a>' +
        '      <a href="catalog.html?color=grey"><span>Серый и графит</span><span>→</span></a>' +
        '      <a href="catalog.html?color=brown"><span>Коричневый</span><span>→</span></a>' +
        '      <a href="catalog.html?color=color"><span>Оникс и акцентные</span><span>→</span></a>' +
        '    </div>' +
        '    <div class="mega-col"><h4>По зоне укладки</h4>' +
        '      <a href="catalog.html?room=bath"><span>Ванная комната</span><span>→</span></a>' +
        '      <a href="catalog.html?room=kitchen"><span>Кухня и фартук</span><span>→</span></a>' +
        '      <a href="catalog.html?room=living"><span>Гостиная</span><span>→</span></a>' +
        '      <a href="catalog.html?room=hall"><span>Прихожая и коридор</span><span>→</span></a>' +
        '      <a href="catalog.html?size=60x120"><span>Крупный формат 60×120</span><span>→</span></a>' +
        '    </div>' +
        '    <div class="mega-promo">' +
        '      <div>' +
        '        <span class="portoro-badge">Новинки сезона</span>' +
        '        <b style="margin-top:10px">Живые образцы в 3 салонах</b>' +
        '        <p>Мытищи · Москва (Люблинское поле) · Тверь (ул. Коминтерна и склад Новая Константиновка)</p>' +
        '      </div>' +
        '      <a href="designer.html" class="btn btn-gold btn-sm">Открыть 3D-примерочную</a>' +
        '    </div>' +
        '  </div>' +
        '</div>';
    }

    var ft = d.getElementById('siteFooter');
    if (ft) {
      ft.className = 'ft';
      ft.innerHTML =
        '<div class="wrap">' +
        '  <div class="ft-grid">' +
        '    <div>' +
        '      <a href="index.html" class="ft-logo" aria-label="Абба Керамика — на главную"><img src="assets/img/logo.svg" alt="Абба Керамика"></a>' +
        '      <p class="muted" style="font-size:13.5px;max-width:340px">Керамогранит 60×60 и 60×120, клей и затирка. Шоу-румы в Мытищах, Москве и Твери, склады в Москве и Твери.</p>' +
        '      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">' +
        '        <a href="catalog.html" class="tag tag-gold">Каталог керамогранита</a>' +
        '        <a href="designer.html" class="tag">3D-примерочная</a>' +
        '      </div>' +
        '    </div>' +
        '    <div><h4>Покупателям</h4>' +
        '      <a href="catalog.html">Каталог плитки</a>' +
        '      <a href="calc.html">Калькулятор расхода</a>' +
        '      <a href="delivery.html">Доставка и самовывоз</a>' +
        '      <a href="masters.html">Каталог мастеров</a>' +
        '      <a href="account.html">Бонусы и заказы</a>' +
        '    </div>' +
        '    <div><h4>Компания</h4>' +
        '      <a href="about.html">О нас</a>' +
        '      <a href="opt.html">Дизайнерам и оптовикам</a>' +
        '      <a href="contacts.html">Все салоны и склады</a>' +
        '      <a href="privacy.html">Политика конфиденциальности</a>' +
        '    </div>' +
        '    <div><h4>Наши салоны и склады</h4>' +
        brs.map(function (b) {
          return (
            '<div style="margin-bottom:12px;font-size:13px">' +
            '  <b style="display:block;color:var(--tx)">' + esc(b.city) + ' · <a href="tel:' + esc(b.phone_tel) + '" style="display:inline;color:var(--gold2)">' + esc(b.phone) + '</a></b>' +
            '  <span class="muted">' + esc(b.address) + '</span><br>' +
            (b.warehouse_address ? '<span class="muted">' + esc(b.warehouse_address) + '</span><br>' : '') +
            '  <a href="mailto:' + esc(b.email) + '" style="font-size:12px">' + esc(b.email) + '</a>' +
            '</div>'
          );
        }).join('') +
        '    </div>' +
        '  </div>' +
        '  <div class="ft-bot">' +
        '    <span>© ' + new Date().getFullYear() + ' Абба Керамика. Все права защищены.</span>' +
        '    <span>Мытищи · Москва · Тверь</span>' +
        '  </div>' +
        '</div>';
    }

    // Shared Cart Drawer + Search Modal + Lead Modal + Mobile Bar + Cookie
    if (!d.getElementById('cartBg')) {
      var wrap = d.createElement('div');
      wrap.innerHTML =
        '<div class="drawer-bg" id="cartBg"></div>' +
        '<aside class="drawer" id="cartDrawer" aria-label="Корзина">' +
        '  <div class="drawer-hd"><b>Корзина заказа</b><button type="button" class="ic-btn" data-close="cartDrawer">' + ic('close') + '</button></div>' +
        '  <div class="drawer-bd" id="cartBody"></div>' +
        '  <div class="drawer-ft" id="cartFoot"></div>' +
        '</aside>' +
        '<div class="modal-bg" id="searchModalBg">' +
        '  <div class="srch-box">' +
        '    <div style="display:flex;gap:10px;align-items:center">' +
        '      <input type="search" id="globalSearchInp" class="inp" placeholder="Поиск по названию, формату 60×120, мрамору, артикулу...">' +
        '      <button type="button" class="ic-btn" data-close="searchModalBg">' + ic('close') + '</button>' +
        '    </div>' +
        '    <div class="srch-res" id="globalSearchRes"><p class="muted" style="padding:10px;margin:0">Начните вводить запрос — например, Травертин, Бетон, Оникс или 60×120.</p></div>' +
        '  </div>' +
        '</div>' +
        '<div class="modal-bg" id="leadModalBg">' +
        '  <div class="modal" id="leadModal">' +
        '    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
        '      <h3 id="leadTitle" style="margin:0;font-size:28px">Оставить заявку</h3>' +
        '      <button type="button" class="ic-btn" data-close="leadModalBg">' + ic('close') + '</button>' +
        '    </div>' +
        '    <form id="leadForm" style="display:flex;flex-direction:column;gap:12px">' +
        '      <input type="hidden" id="leadType" name="type" value="Заявка с сайта">' +
        '      <div class="field"><label>Ваше имя</label><input class="inp" name="name" required placeholder="Например, Алексей"></div>' +
        '      <div class="field"><label>Телефон</label><input class="inp js-phone" name="phone" required placeholder="+7 (___) ___-__-__"></div>' +
        '      <div class="field"><label>Филиал (салон и склад)</label>' +
        '        <select class="inp" name="branch" id="leadBranch">' +
        brs.map(function (b) { return '<option value="' + esc(b.id) + '">' + esc(b.short_name) + ' (' + esc(b.phone) + ')</option>'; }).join('') +
        '        </select>' +
        '      </div>' +
        '      <div class="field"><label>Комментарий или площадь в м²</label><textarea class="inp" id="leadComment" name="comment" rows="3" placeholder="Укажите желаемую коллекцию, формат или метраж"></textarea></div>' +
        '      <button type="submit" class="btn btn-gold">Отправить заявку менеджеру</button>' +
        '      <small class="muted">Отправляя заявку, вы соглашаетесь с <a href="privacy.html" style="text-decoration:underline">политикой обработки данных</a>.</small>' +
        '    </form>' +
        '  </div>' +
        '</div>' +
        '<div class="modal-bg" id="mobMenuBg">' +
        '  <div class="modal">' +
        '    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><b>Меню Абба Керамика</b><button type="button" class="ic-btn" data-close="mobMenuBg">' + ic('close') + '</button></div>' +
        '    <div style="display:flex;flex-direction:column;gap:8px">' +
        '      <a href="catalog.html" class="btn btn-portoro">Каталог керамогранита</a>' +
        '      <a href="designer.html" class="btn btn-ghost">3D-примерочная</a>' +
        '      <a href="calc.html" class="btn btn-ghost">Калькулятор расхода</a>' +
        '      <a href="opt.html" class="btn btn-ghost">Дизайнерам и опт</a>' +
        '      <a href="masters.html" class="btn btn-ghost">Каталог мастеров</a>' +
        '      <a href="contacts.html" class="btn btn-ghost">Салоны: Мытищи · Москва · Тверь</a>' +
        '      <a href="about.html" class="btn btn-ghost">О компании</a>' +
        '      <a href="delivery.html" class="btn btn-ghost">Доставка</a>' +
        '      <a href="account.html" class="btn btn-ghost">Личный кабинет</a>' +
        '    </div>' +
        '  </div>' +
        '</div>' +
        '<nav class="mob-bar" aria-label="Мобильная навигация">' +
        '  <a href="index.html">Главная</a>' +
        '  <a href="catalog.html">Каталог</a>' +
        '  <a href="designer.html">3D</a>' +
        '  <button type="button" id="mobCartBtn">Корзина<span class="mob-cnt zero" data-cart-count></span></button>' +
        '  <a href="contacts.html">Салоны</a>' +
        '</nav>';
      d.body.appendChild(wrap);
    }

    if (!storeGet('cookie_ok', false) && !d.getElementById('cookieBar')) {
      var cb = d.createElement('div');
      cb.id = 'cookieBar';
      cb.className = 'cookie-bar';
      cb.innerHTML = '<span>Мы сохраняем корзину, избранное и выбранный салон в cookies для удобной работы.</span><button type="button" class="btn btn-gold btn-sm" id="cookieOk">Хорошо</button>';
      d.body.appendChild(cb);
      d.getElementById('cookieOk').onclick = function () {
        storeSet('cookie_ok', true);
        cb.remove();
      };
    }

    // Bind header & drawer events
    var mt = d.getElementById('megaToggle');
    var mm = d.getElementById('megaMenu');
    if (mt && mm) {
      mt.onclick = function (e) {
        e.stopPropagation();
        mm.classList.toggle('open');
      };
    }
    var mr = d.getElementById('moreToggle');
    var nm = d.getElementById('navMore');
    if (mr && nm) {
      mr.onclick = function (e) {
        e.stopPropagation();
        nm.classList.toggle('open');
      };
    }
    d.addEventListener('click', function (e) {
      if (mm && !mm.contains(e.target) && e.target !== mt) mm.classList.remove('open');
      if (nm && !nm.contains(e.target) && e.target !== mr) nm.classList.remove('open');
    });

    d.querySelectorAll('.hd-branch-btn').forEach(function (btn) {
      btn.onclick = function () {
        setActiveBranchId(btn.dataset.branch);
        toast('Выбран филиал: ' + getActiveBranch().short_name);
      };
    });

    var os = d.getElementById('openSearch');
    if (os) os.onclick = function () { open('searchModalBg'); setTimeout(function () { d.getElementById('globalSearchInp').focus(); }, 60); };

    var oc = d.getElementById('openCart');
    var mcb = d.getElementById('mobCartBtn');
    function openCartDrawer() {
      renderCart();
      open('cartBg');
      open('cartDrawer');
    }
    if (oc) oc.onclick = openCartDrawer;
    if (mcb) mcb.onclick = openCartDrawer;

    var ofl = d.getElementById('openFastLead');
    if (ofl) ofl.onclick = function () { openLead({ title: 'Заказать бесплатный расчёт плитки', type: 'Расчёт с сайта' }); };

    var omn = d.getElementById('openMobNav');
    if (omn) omn.onclick = function () { open('mobMenuBg'); };

    var sinp = d.getElementById('globalSearchInp');
    var sres = d.getElementById('globalSearchRes');
    if (sinp && sres) {
      sinp.addEventListener('input', function () {
        var found = search(sinp.value);
        if (!sinp.value.trim()) {
          sres.innerHTML = '<p class="muted" style="padding:10px;margin:0">Введите название коллекции, размер или цвет.</p>';
          return;
        }
        if (!found.length) {
          sres.innerHTML = '<p class="muted" style="padding:10px;margin:0">Ничего не найдено. Попробуйте «Мрамор», «Травертин» или «60×120».</p>';
          return;
        }
        sres.innerHTML = found.map(function (p) {
          return '<a class="srch-item" href="' + url(p) + '"><img src="' + esc(thumb(img(p))) + '" alt=""><div style="flex:1"><b>' + esc(p.name) + '</b><div class="muted" style="font-size:12px">' + esc(size(p)) + ' · ' + esc(p.surf || '') + ' · арт. ' + esc(p.sku || '') + '</div></div><b style="white-space:nowrap">' + (hasPrice(p) ? rub(p.price) + '/м²' : '<span class="muted" style="font-weight:500">по запросу</span>') + '</b></a>';
        }).join('');
      });
    }

    var lf = d.getElementById('leadForm');
    if (lf) {
      lf.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(lf);
        var data = {};
        fd.forEach(function (v, k) { data[k] = v; });
        send(data).then(function (r) {
          if (r && r.ok) {
            close('leadModalBg');
            lf.reset();
            if (!r.static) toast('Заявка ' + (r.order_number || '') + ' принята! Менеджер свяжется с вами.');
          } else {
            toast('Ошибка отправки заявки');
          }
        }).catch(function () { toast('Нет связи с сервером'); });
      });
    }
  }

  function initGlobalEvents() {
    d.addEventListener('click', function (e) {
      var cls = e.target.closest('[data-close]');
      if (cls) {
        var id = cls.dataset.close;
        close(id);
        if (id === 'cartDrawer') close('cartBg');
        return;
      }
      if (e.target.classList.contains('modal-bg') || e.target.id === 'cartBg') {
        closeAll();
        return;
      }
      var favBtn = e.target.closest('.c-fav');
      if (favBtn) {
        e.preventDefault();
        favs.toggle(favBtn.dataset.id);
        return;
      }
      var addBtn = e.target.closest('[data-add]');
      if (addBtn) {
        e.preventDefault();
        cart.add(addBtn.dataset.add, 1);
        addBtn.classList.add('in');
        if (addBtn.classList.contains('btn-cart')) addBtn.textContent = 'В корзине ✓';
        return;
      }
      var dec = e.target.closest('[data-cdec]');
      if (dec) {
        var row = cart.list().find(function (x) { return x.id === dec.dataset.cdec; });
        if (row) cart.set(row.id, row.q - 1);
        return;
      }
      var inc = e.target.closest('[data-cinc]');
      if (inc) {
        var row2 = cart.list().find(function (x) { return x.id === inc.dataset.cinc; });
        if (row2) cart.set(row2.id, row2.q + 1);
        return;
      }
      var del = e.target.closest('[data-cdel]');
      if (del) {
        cart.set(del.dataset.cdel, 0);
        return;
      }
      var leadBtn = e.target.closest('[data-lead]');
      if (leadBtn) {
        openLead({ title: leadBtn.dataset.lead, type: leadBtn.dataset.leadType || leadBtn.dataset.lead });
      }
    });

    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });

    w.addEventListener('scroll', function () {
      var hd = d.querySelector('.hd');
      if (hd) hd.classList.toggle('stuck', w.scrollY > 18);
    }, { passive: true });
  }

  function initReveal() {
    var els = d.querySelectorAll('.rv');
    if (!els.length) return;
    if (!('IntersectionObserver' in w)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  function boot() {
    mountShell();
    initGlobalEvents();
    initReveal();
    renderCart();
    syncBadges();
    updateBranchUI();
    d.querySelectorAll('.js-phone').forEach(fmtPhone);
  }

  w.UN = Object.assign(BASE, {
    esc: esc,
    num: num,
    rub: rub,
    plural: plural,
    store: { get: storeGet, set: storeSet },
    ic: ic,
    label: label,
    LABELS: LABELS,
    byId: byId,
    isAcc: isAcc,
    genTileArt: genTileArt,
    img: img,
    accImg: accImg,
    tex: tex,
    url: url,
    size: size,
    boxPrice: boxPrice,
    hasPrice: hasPrice,
    priceText: priceText,
    thumb: thumb,
    stockInfo: stockInfo,
    catalogUrl: catalogUrl,
    branches: branches,
    getActiveBranch: getActiveBranch,
    setActiveBranchId: setActiveBranchId,
    toast: toast,
    search: search,
    card: card,
    accCard: accCard,
    favs: favs,
    delivery: delivery,
    kit: kit,
    cart: cart,
    open: open,
    close: close,
    closeAll: closeAll,
    openLead: openLead,
    fmtPhone: fmtPhone,
    send: send,
    staticContact: staticContact,
    initReveal: initReveal
  });

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);
