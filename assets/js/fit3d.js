/* 3D-примерочная АББА Керамика.
   Реалистичная раскладка: реальный размер плитки (см), ширина шва (мм), цвет затирки,
   прямая / со смещением 1/2 / 1/3, ориентация 60×120, лёгкая вариативность рисунка. */
(function (w, d) {
  'use strict';

  function init() {
    var U = w.UN;
    var T = w.THREE;
    var stage = d.getElementById('f3Stage');
    if (!U || !stage) return;

    var PRODUCTS = (U.products || []).filter(function (p) { return !p.is_hidden; });
    // Сначала — плитки с готовой текстурой для примерки
    PRODUCTS.sort(function (a, b) { return (texSrcOf(b) ? 1 : 0) - (texSrcOf(a) ? 1 : 0); });

    var tilesListEl = d.getElementById('f3Tiles');
    var targetTabs = d.getElementById('f3TargetTabs');
    var presetBtns = d.getElementById('f3Presets');
    var groutEl = d.getElementById('f3Grout');
    var patSel = d.getElementById('f3Pattern');
    var orientSel = d.getElementById('f3Orient');
    var seamSel = d.getElementById('f3Seam');
    var searchInp = d.getElementById('f3Search');
    var infoEl = d.getElementById('f3ActiveInfo');
    var scaleEl = d.getElementById('f3Scale');

    var sp = new URLSearchParams(location.search);
    var initId = sp.get('tile');
    var initTile = (initId && U.byId(initId)) || PRODUCTS[0] || null;
    var wallInit = PRODUCTS.filter(function (p) { return p !== initTile && texSrcOf(p) && Number(p.h) > Number(p.w); })[0] || PRODUCTS[1] || initTile;

    var ROOM = { W: 4.4, D: 4.4, H: 2.7 };
    var state = {
      room: 'bath',
      target: 'floor',
      floorTile: initTile,
      wallTile: wallInit,
      grout: '#DFD3C1',
      seam: 2,           // мм
      pattern: 'grid',   // grid | half | third
      orient: 'auto'     // auto | long-x | long-y
    };
    if (sp.get('wall') && U.byId(sp.get('wall'))) state.wallTile = U.byId(sp.get('wall'));
    if (sp.get('pat')) state.pattern = sp.get('pat');

    var GROUTS = [
      { c: '#F7F3EC', n: 'Белая' }, { c: '#DFD3C1', n: 'Бежевая' }, { c: '#B9B2A7', n: 'Светло-серая' },
      { c: '#8A847B', n: 'Серая' }, { c: '#5B4A3A', n: 'Коричневая' }, { c: '#2B2622', n: 'Антрацит' }
    ];

    function texSrcOf(p) {
      if (!p) return '';
      return p.fitting_img || p.template_img || (Array.isArray(p.imgs) && p.imgs[0]) || '';
    }
    function isPolished(p) {
      var s = String((p && p.surf) || '').toLowerCase();
      return s.indexOf('полир') >= 0 || s.indexOf('глян') >= 0 || s.indexOf('полиш') >= 0 || s.indexOf('лаппат') >= 0;
    }
    function isWood(p) { return p && (p.design === 'wood' || /вуд|wood|дерев/i.test((p.name || '') + ' ' + (p.en || ''))); }

    /* ---------- изображения ---------- */
    var IMG = {};
    function loadImg(src, cb) {
      if (!src) return cb(null);
      var e = IMG[src];
      if (e && e.ok) return cb(e.img);
      if (e && e.failed) return cb(null);
      if (e) { e.cbs.push(cb); return; }
      e = IMG[src] = { img: new Image(), cbs: [cb] };
      e.img.decoding = 'async';
      e.img.onload = function () { e.ok = true; e.cbs.splice(0).forEach(function (f) { f(e.img); }); };
      e.img.onerror = function () { e.failed = true; e.cbs.splice(0).forEach(function (f) { f(null); }); };
      e.img.src = src;
    }

    /* ---------- геометрия раскладки ---------- */
    // Возвращает размеры одной плитки на поверхности (м) с учётом ориентации
    function tileDims(p, surface) {
      var a = Number(p && p.w) || 60, b = Number(p && p.h) || 60;
      var shortS = Math.min(a, b) / 100, longS = Math.max(a, b) / 100;
      var o = state.orient;
      if (o === 'auto') o = surface === 'wall' ? 'long-y' : 'long-x';
      return o === 'long-x' ? { w: longS, h: shortS, rot: longS !== shortS } : { w: shortS, h: longS, rot: false };
    }

    // Процедурная текстура, если фото нет (без выдуманных рисунков — мягкий однотонный камень)
    var PAL = {
      white: ['#F6F2EB', '#ECE5D9', '#BFB3A1'], beige: ['#EDE2D0', '#DCCBB1', '#B59468'],
      grey: ['#D7D3CC', '#C0BBB3', '#8C877F'], brown: ['#C3A383', '#A27C59', '#6B4A2C'],
      dark: ['#2A2622', '#1E1B18', '#6A6158'], black: ['#1F1C19', '#141210', '#BFA06A'],
      gold: ['#221D17', '#17130F', '#D4AF62'], color: ['#D9E1D8', '#BCC8BD', '#71877A']
    };
    function seededRand(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
    function drawProcedural(ctx, x, y, tw, th, p, k) {
      var pal = PAL[(p && p.cg) || 'beige'] || PAL.beige;
      var g = ctx.createLinearGradient(x, y, x + tw, y + th);
      g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
      ctx.fillStyle = g; ctx.fillRect(x, y, tw, th);
      var r = seededRand(1000 + k * 7919);
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, tw, th); ctx.clip();
      ctx.strokeStyle = pal[2]; ctx.globalAlpha = 0.28; ctx.lineWidth = Math.max(1, tw / 300);
      for (var v = 0; v < 4; v++) {
        ctx.beginPath();
        var sx = x + r() * tw, sy = y;
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(x + r() * tw, y + th * 0.33, x + r() * tw, y + th * 0.66, x + r() * tw, y + th);
        ctx.stroke();
      }
      ctx.restore(); ctx.globalAlpha = 1;
    }

    // Рисует «единицу раскладки» (повторяемый фрагмент) на canvas.
    // Единица: 2 плитки по ширине × N рядов (N=2 для прямой и 1/2, 3 для 1/3)
    function buildUnit(p, surface, img) {
      var td = tileDims(p, surface);
      var seamM = state.seam / 1000;
      var cols = 2, rows = state.pattern === 'third' ? 3 : 2;
      var cellW = td.w + seamM, cellH = td.h + seamM;
      var unitW = cols * cellW, unitH = rows * cellH;
      var MAXPX = 2048;
      var ppm = Math.min(MAXPX / unitW, MAXPX / unitH, 1400);
      var cw = Math.round(unitW * ppm), ch = Math.round(unitH * ppm);
      var cv = d.createElement('canvas'); cv.width = cw; cv.height = ch;
      var ctx = cv.getContext('2d');
      ctx.fillStyle = state.grout; ctx.fillRect(0, 0, cw, ch);
      var sPx = Math.max(2.6, seamM * ppm * 1.4);
      var tW = cw / cols - sPx, tH = ch / rows - sPx;
      var poli = isPolished(p), wood = isWood(p);
      var k = 0;
      for (var r = 0; r < rows; r++) {
        var shift = state.pattern === 'half' ? (r % 2) * 0.5 : (state.pattern === 'third' ? r / 3 : 0);
        var offPx = shift * (cw / cols);
        for (var c = -1; c <= cols; c++) {
          var x = c * (cw / cols) + offPx + sPx / 2, y = r * (ch / rows) + sPx / 2;
          if (x > cw || x + tW < 0) continue;
          k++;
          // вариативность: поворот на 180° через одну (как при реальной укладке), для дерева — без зеркал
          var flip = !wood && ((r + c + 4) % 2 === 1);
          drawTile(ctx, img, x, y, tW, tH, td.rot, flip, p, (r * 4 + c + 8));
          // фаска / тень на кромке
          ctx.strokeStyle = poli ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.10)';
          ctx.lineWidth = Math.max(1, sPx * 0.45);
          ctx.strokeRect(x + 0.5, y + 0.5, tW - 1, tH - 1);
        }
      }
      return { canvas: cv, unitW: unitW, unitH: unitH, td: td, ppm: ppm };
    }

    function drawTile(ctx, img, x, y, tw, th, rot, flip, p, k) {
      if (!img) { drawProcedural(ctx, x, y, tw, th, p, k); return; }
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, tw, th); ctx.clip();
      ctx.translate(x + tw / 2, y + th / 2);
      if (flip) ctx.rotate(Math.PI);
      var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      var imgPortrait = ih > iw * 1.15;
      var needRot = rot ? imgPortrait : (!imgPortrait && th > tw * 1.15 && iw > ih * 1.15);
      // 1,5% от кромки фото срезаем — прячем блики и следы фона по краю
      var ix = iw * 0.015, iy = ih * 0.015, sw = iw - 2 * ix, sh = ih - 2 * iy;
      if (needRot) { ctx.rotate(Math.PI / 2); ctx.drawImage(img, ix, iy, sw, sh, -th / 2, -tw / 2, th, tw); }
      else ctx.drawImage(img, ix, iy, sw, sh, -tw / 2, -th / 2, tw, th);
      ctx.restore();
    }

    /* ---------- 3D ---------- */
    var renderer = null, fallbackCanvas = null, scene, camera, controls, floorMat, wallMat, roomGroup;
    var stageH = function () { return Math.max(460, stage.clientHeight || 620); };

    function hasWebGL() {
      try { var c = d.createElement('canvas'); return !!(w.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (_) { return false; }
    }
    if (T && hasWebGL()) {
      try {
        renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: false });
        renderer.setPixelRatio(Math.min(w.devicePixelRatio || 1, 2));
        renderer.setSize(stage.clientWidth, stageH());
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = T.PCFSoftShadowMap;
        if ('outputEncoding' in renderer && T.sRGBEncoding) renderer.outputEncoding = T.sRGBEncoding;
        
        stage.insertBefore(renderer.domElement, stage.firstChild);
      } catch (_) { renderer = null; }
    }
    if (!renderer) {
      fallbackCanvas = d.createElement('canvas');
      fallbackCanvas.width = Math.max(640, stage.clientWidth || 800) * Math.min(w.devicePixelRatio || 1, 2);
      fallbackCanvas.height = stageH() * Math.min(w.devicePixelRatio || 1, 2);
      fallbackCanvas.style.width = '100%';
      fallbackCanvas.style.height = stageH() + 'px';
      stage.insertBefore(fallbackCanvas, stage.firstChild);
    }

    var CAM0 = [1.75, 1.6, 2.05], TGT0 = [-0.55, 0.95, -0.95];
    if (renderer) {
      scene = new T.Scene();
      scene.background = new T.Color('#E9E1D5');
      camera = new T.PerspectiveCamera(58, stage.clientWidth / stageH(), 0.05, 60);
      fitFov();
      camera.position.set(CAM0[0], CAM0[1], CAM0[2]);
      controls = T.OrbitControls ? new T.OrbitControls(camera, renderer.domElement) : null;
      if (controls) {
        controls.enableDamping = true;
        controls.target.set(TGT0[0], TGT0[1], TGT0[2]);
        controls.maxPolarAngle = Math.PI / 2 - 0.03;
        controls.minDistance = 0.5;
        controls.maxDistance = 3.6;
        controls.minAzimuthAngle = -0.05;
        controls.maxAzimuthAngle = 1.45;
        controls.enablePan = false;
        controls.update();
      } else camera.lookAt(TGT0[0], TGT0[1], TGT0[2]);

      scene.add(new T.HemisphereLight('#FFFDF7', '#B9A890', 0.62));
      var sun = new T.DirectionalLight('#FFF1DC', 0.62);
      sun.position.set(3.5, 6, 4.5);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.left = -4; sun.shadow.camera.right = 4; sun.shadow.camera.top = 4; sun.shadow.camera.bottom = -4;
      sun.shadow.bias = -0.0004; sun.shadow.radius = 4;
      scene.add(sun);
      var fill = new T.DirectionalLight('#E6ECF5', 0.18);
      fill.position.set(-3, 2.5, 3);
      scene.add(fill);

      roomGroup = new T.Group();
      scene.add(roomGroup);
      floorMat = new T.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.5, metalness: 0 });
      wallMat = new T.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.55, metalness: 0 });
    }

    // на узких (портретных) экранах расширяем угол обзора, чтобы было видно пол и обе стены
    function fitFov() {
      if (!camera) return;
      var asp = stage.clientWidth / stageH();
      camera.aspect = asp;
      camera.fov = asp < 1 ? Math.min(80, 58 / Math.max(0.6, asp) * 0.9) : 58;
      camera.updateProjectionMatrix();
    }
    var maxAniso = renderer ? renderer.capabilities.getMaxAnisotropy() : 1;
    function makeTexture(unit, sizeU, sizeV) {
      var tex = new T.CanvasTexture(unit.canvas);
      tex.wrapS = tex.wrapT = T.RepeatWrapping;
      tex.anisotropy = Math.min(8, maxAniso);
      if ('encoding' in tex && T.sRGBEncoding) tex.encoding = T.sRGBEncoding;
      tex.repeat.set(sizeU / unit.unitW, sizeV / unit.unitH);
      return tex;
    }

    // плоскость с UV в метрах (плитка начинается от угла комнаты)
    function plane(wm, hm, mat) {
      var g = new T.PlaneGeometry(wm, hm);
      var m = new T.Mesh(g, mat);
      m.receiveShadow = true;
      return m;
    }

    var floorMesh, wallBack, wallLeft, wallTexBack, wallTexLeft;
    function buildRoom(kind) {
      if (!renderer) return;
      while (roomGroup.children.length) roomGroup.remove(roomGroup.children[0]);
      floorMesh = plane(ROOM.W, ROOM.D, floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      roomGroup.add(floorMesh);
      wallBack = plane(ROOM.W, ROOM.H, wallMat);
      wallBack.position.set(0, ROOM.H / 2, -ROOM.D / 2);
      roomGroup.add(wallBack);
      wallLeft = plane(ROOM.D, ROOM.H, wallMat);
      wallLeft.rotation.y = Math.PI / 2;
      wallLeft.position.set(-ROOM.W / 2, ROOM.H / 2, 0);
      roomGroup.add(wallLeft);
      // правая стена — штукатурка, потолок — белый (плитка на полу и двух стенах)
      var plaster = new T.MeshStandardMaterial({ color: '#EFE8DD', roughness: 0.95 });
      var rWall = plane(ROOM.D, ROOM.H, plaster);
      rWall.rotation.y = -Math.PI / 2; rWall.position.set(ROOM.W / 2, ROOM.H / 2, 0); roomGroup.add(rWall);
      var ceil = plane(ROOM.W, ROOM.D, new T.MeshBasicMaterial({ color: '#E9E3D9' }));
      ceil.rotation.x = Math.PI / 2; ceil.position.y = ROOM.H; roomGroup.add(ceil);

      var woodMat = new T.MeshStandardMaterial({ color: '#9A7350', roughness: 0.6 });
      var whiteMat = new T.MeshStandardMaterial({ color: '#F8F5EF', roughness: 0.2 });
      var brassMat = new T.MeshStandardMaterial({ color: '#B98B3E', metalness: 0.8, roughness: 0.3 });
      var darkMat = new T.MeshStandardMaterial({ color: '#2A241E', roughness: 0.45 });
      var mirrorMat = new T.MeshStandardMaterial({ color: '#DCE3E8', metalness: 0.15, roughness: 0.05, emissive: '#55606A', emissiveIntensity: 0.25 });
      var fabric = new T.MeshStandardMaterial({ color: '#D9CDBB', roughness: 0.95 });
      function box(wd, h, dp, mat, x, y, z) {
        var m = new T.Mesh(new T.BoxGeometry(wd, h, dp), mat);
        m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; roomGroup.add(m); return m;
      }
      var HW = ROOM.W / 2, HD = ROOM.D / 2;
      if (kind === 'bath') {
        // отдельностоящая ванна
        var tub = new T.Mesh(new T.CylinderGeometry(0.42, 0.36, 0.58, 48, 1), whiteMat);
        tub.scale.set(2.0, 1, 1); tub.position.set(-HW + 1.15, 0.29, -HD + 0.75); tub.castShadow = true; roomGroup.add(tub);
        box(1.2, 0.5, 0.48, woodMat, 0.9, 0.55, -HD + 0.26);          // подвесная тумба
        box(0.62, 0.1, 0.42, whiteMat, 0.9, 0.85, -HD + 0.26);        // раковина
        box(0.9, 1.0, 0.025, mirrorMat, 0.9, 1.6, -HD + 0.015);       // зеркало
        box(0.03, 0.22, 0.03, brassMat, 0.9, 1.0, -HD + 0.07);        // смеситель
      } else if (kind === 'kitchen') {
        box(3.0, 0.86, 0.6, whiteMat, 0.4, 0.43, -HD + 0.3);
        box(3.02, 0.04, 0.62, darkMat, 0.4, 0.88, -HD + 0.31);
        box(2.4, 0.72, 0.34, woodMat, 0.1, 1.86, -HD + 0.17);
        // остров-стол у левой стены, чтобы не закрывал пол
        box(0.8, 0.05, 1.3, woodMat, -HW + 0.95, 0.75, 0.55);
        [[-0.32, -0.58], [0.32, -0.58], [-0.32, 0.58], [0.32, 0.58]].forEach(function (l) { box(0.05, 0.73, 0.05, darkMat, -HW + 0.95 + l[0], 0.365, 0.55 + l[1]); });
      } else {
        box(2.3, 0.4, 0.95, fabric, 0.3, 0.24, -HD + 0.6);
        box(2.3, 0.5, 0.2, fabric, 0.3, 0.6, -HD + 0.2);
        var ct = new T.Mesh(new T.CylinderGeometry(0.45, 0.45, 0.035, 48), darkMat);
        ct.position.set(0.3, 0.42, 0.25); ct.castShadow = true; roomGroup.add(ct);
        var leg = new T.Mesh(new T.CylinderGeometry(0.05, 0.12, 0.4, 24), brassMat);
        leg.position.set(0.3, 0.2, 0.25); roomGroup.add(leg);
        box(0.06, 1.6, 0.9, woodMat, -HW + 0.04, 1.3, 0.2); // панель ТВ-зоны
      }
      applyTextures();
    }

    var applySeq = 0;
    function applyTextures() {
      var seq = ++applySeq;
      var fT = state.floorTile, wT = state.wallTile;
      loadImg(texSrcOf(fT), function (fImg) {
        loadImg(texSrcOf(wT), function (wImg) {
          if (seq !== applySeq) return;
          var fu = fT ? buildUnit(fT, 'floor', fImg) : null;
          var wu = wT ? buildUnit(wT, 'wall', wImg) : null;
          if (renderer) {
            if (fu) {
              if (floorMat.map) floorMat.map.dispose();
              floorMat.map = makeTexture(fu, ROOM.W, ROOM.D);
              floorMat.roughness = isPolished(fT) ? 0.12 : 0.55;
              floorMat.needsUpdate = true;
            }
            if (wu) {
              if (wallMat.map) wallMat.map.dispose();
              wallMat.map = makeTexture(wu, ROOM.W, ROOM.H);
              // начинаем ряд от пола: смещаем V так, чтобы снизу была целая плитка
              wallMat.map.offset.set(0, 0);
              wallMat.roughness = isPolished(wT) ? 0.14 : 0.6;
              wallMat.needsUpdate = true;
            }
          } else {
            renderFallback2D(fu, wu);
          }
          updateInfo(fu, wu);
        });
      });
    }

    function fmtCm(m) { return String(Math.round(m * 100)); }
    function updateInfo(fu, wu) {
      if (infoEl) {
        infoEl.innerHTML =
          '<span>Пол: <b>' + U.esc(state.floorTile ? state.floorTile.name : '—') + '</b></span> · ' +
          '<span>Стены: <b>' + U.esc(state.wallTile ? state.wallTile.name : '—') + '</b></span>';
      }
      if (scaleEl) {
        var parts = [];
        if (fu) parts.push('пол ' + fmtCm(fu.td.w) + '×' + fmtCm(fu.td.h) + ' см');
        if (wu) parts.push('стены ' + fmtCm(wu.td.w) + '×' + fmtCm(wu.td.h) + ' см');
        parts.push('шов ' + String(state.seam).replace('.', ',') + ' мм');
        parts.push('комната ' + String(ROOM.W).replace('.', ',') + '×' + String(ROOM.D).replace('.', ',') + ' м');
        scaleEl.textContent = parts.join(' · ');
      }
    }

    /* ---------- 2D-превью без WebGL: стена + пол в перспективе ---------- */
    function renderFallback2D(fu, wu) {
      if (!fallbackCanvas) return;
      var cw = fallbackCanvas.width, ch = fallbackCanvas.height, ctx = fallbackCanvas.getContext('2d');
      ctx.fillStyle = '#EDE4D6'; ctx.fillRect(0, 0, cw, ch);
      var horizon = Math.round(ch * 0.58);
      // стена: ширина ROOM.W на всю ширину холста
      var ppmWall = cw / ROOM.W;
      if (wu) {
        var pc = d.createElement('canvas');
        pc.width = Math.max(1, Math.round(wu.unitW * ppmWall)); pc.height = Math.max(1, Math.round(wu.unitH * ppmWall));
        pc.getContext('2d').drawImage(wu.canvas, 0, 0, pc.width, pc.height);
        ctx.save();
        ctx.translate(0, horizon); // ряды начинаются от пола
        ctx.fillStyle = ctx.createPattern(pc, 'repeat');
        ctx.fillRect(0, -horizon, cw, horizon);
        ctx.restore();
      }
      // пол: перспективная проекция полосами (глубина ROOM.D)
      if (fu) {
        var top = d.createElement('canvas');
        var ppmF = 300;
        top.width = Math.round(ROOM.W * ppmF); top.height = Math.round(ROOM.D * ppmF);
        var tctx = top.getContext('2d');
        var pc2 = d.createElement('canvas');
        pc2.width = Math.round(fu.unitW * ppmF); pc2.height = Math.round(fu.unitH * ppmF);
        pc2.getContext('2d').drawImage(fu.canvas, 0, 0, pc2.width, pc2.height);
        tctx.fillStyle = tctx.createPattern(pc2, 'repeat'); tctx.fillRect(0, 0, top.width, top.height);
        var hc = 1.6, zNear = 1.4;
        var f = zNear * ((ch - horizon) + hc * cw / ROOM.W) / hc;
        var zFar = f * ROOM.W / cw;
        var Y0 = horizon - hc * f / zFar;
        for (var y = horizon; y < ch; y++) {
          var z = hc * f / (y + 0.5 - Y0);
          var fromWall = zFar - z;
          if (fromWall < 0 || fromWall > ROOM.D) continue;
          var tv = Math.min(top.height - 1, Math.floor(fromWall / ROOM.D * top.height));
          var wpx = f * ROOM.W / z;
          ctx.drawImage(top, 0, tv, top.width, 1, (cw - wpx) / 2, y, wpx, 1.2);
        }
        var gr = ctx.createLinearGradient(0, horizon, 0, ch);
        gr.addColorStop(0, 'rgba(60,45,30,.18)'); gr.addColorStop(0.3, 'rgba(60,45,30,0)');
        ctx.fillStyle = gr; ctx.fillRect(0, horizon, cw, ch - horizon);
      }
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(0, horizon - 1, cw, 2);
    }

    /* ---------- UI ---------- */
    function renderTileList(q) {
      if (!tilesListEl) return;
      var s = String(q || '').trim().toLowerCase();
      var list = PRODUCTS.filter(function (p) {
        return !s || (p.name + ' ' + p.coll + ' ' + U.size(p) + ' ' + (p.country || '') + ' ' + U.label('designs', p.design)).toLowerCase().indexOf(s) >= 0;
      }).slice(0, 60);
      var activeObj = state.target === 'floor' ? state.floorTile : state.wallTile;
      if (!list.length) { tilesListEl.innerHTML = '<p class="muted" style="grid-column:1/-1;margin:8px 0">Ничего не найдено</p>'; return; }
      tilesListEl.innerHTML = list.map(function (p) {
        var on = activeObj && activeObj.id === p.id ? ' on' : '';
        var src = p.fitting_img || U.img(p);
        return '<button type="button" class="f3-tile' + on + '" data-tid="' + U.esc(p.id) + '">' +
          '<img src="' + U.esc(src) + '" alt="" loading="lazy">' +
          '<b>' + U.esc(p.name) + '</b>' +
          '<small>' + U.esc(U.size(p)) + ' · ' + U.esc(p.surf || '') + '</small></button>';
      }).join('');
    }

    if (groutEl) {
      groutEl.innerHTML = GROUTS.map(function (g) {
        return '<button type="button" class="f3-swatch' + (g.c === state.grout ? ' on' : '') + '" data-gr="' + g.c + '" style="background:' + g.c + '" title="' + g.n + '" aria-label="Затирка: ' + g.n + '"></button>';
      }).join('');
      groutEl.addEventListener('click', function (e) {
        var b = e.target.closest('[data-gr]'); if (!b) return;
        state.grout = b.dataset.gr;
        groutEl.querySelectorAll('.f3-swatch').forEach(function (x) { x.classList.toggle('on', x === b); });
        applyTextures();
      });
    }
    if (tilesListEl) tilesListEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tid]'); if (!b) return;
      var p = U.byId(b.dataset.tid); if (!p) return;
      if (state.target === 'floor') state.floorTile = p; else state.wallTile = p;
      applyTextures(); renderTileList(searchInp ? searchInp.value : '');
    });
    if (targetTabs) targetTabs.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tgt]'); if (!b) return;
      state.target = b.dataset.tgt;
      targetTabs.querySelectorAll('.f3-btn').forEach(function (x) { x.classList.toggle('on', x === b); });
      renderTileList(searchInp ? searchInp.value : '');
    });
    if (presetBtns) presetBtns.addEventListener('click', function (e) {
      var b = e.target.closest('[data-rm]'); if (!b) return;
      state.room = b.dataset.rm;
      presetBtns.querySelectorAll('.f3-btn').forEach(function (x) { x.classList.toggle('on', x === b); });
      buildRoom(state.room);
    });
    if (patSel) { patSel.value = state.pattern; patSel.addEventListener('change', function () { state.pattern = patSel.value; applyTextures(); }); }
    if (orientSel) orientSel.addEventListener('change', function () { state.orient = orientSel.value; applyTextures(); });
    if (seamSel) { seamSel.value = String(state.seam); seamSel.addEventListener('change', function () { state.seam = parseFloat(seamSel.value) || 2; applyTextures(); }); }
    if (searchInp) searchInp.addEventListener('input', function () { renderTileList(searchInp.value); });

    var addFloorBtn = d.getElementById('f3AddFloor');
    if (addFloorBtn) addFloorBtn.onclick = function () { if (state.floorTile) U.cart.add(state.floorTile.id, 1); };
    var resetCamBtn = d.getElementById('f3ResetCam');
    if (resetCamBtn) resetCamBtn.onclick = function () {
      if (!camera) return;
      camera.position.set(CAM0[0], CAM0[1], CAM0[2]);
      if (controls) { controls.target.set(TGT0[0], TGT0[1], TGT0[2]); controls.update(); }
    };

    if (renderer) buildRoom(state.room); else applyTextures();
    renderTileList('');

    if (renderer) (function animate() {
      requestAnimationFrame(animate);
      if (controls) controls.update();
      renderer.render(scene, camera);
    })();

    w.addEventListener('resize', function () {
      if (renderer) {
        fitFov();
        renderer.setSize(stage.clientWidth, stageH());
      } else applyTextures();
    });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
