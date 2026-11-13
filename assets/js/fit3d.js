(function (w, d) {
  'use strict';

  function init() {
    var U = w.UN;
    var T = w.THREE;
    var stage = d.getElementById('f3Stage');
    if (!U || !T || !stage) return;

    var PRODUCTS = U.products || [];
    var tilesListEl = d.getElementById('f3Tiles');
    var targetTabs = d.getElementById('f3TargetTabs');
    var presetBtns = d.getElementById('f3Presets');
    var groutEl = d.getElementById('f3Grout');
    var patSel = d.getElementById('f3Pattern');
    var searchInp = d.getElementById('f3Search');
    var infoEl = d.getElementById('f3ActiveInfo');

    var sp = new URLSearchParams(location.search);
    var initId = sp.get('tile');
    var initTile = (initId && U.byId(initId)) || PRODUCTS[0] || null;

    var state = {
      room: 'bath',
      target: 'floor', // 'floor' | 'wall'
      floorTile: initTile,
      wallTile: PRODUCTS[1] || initTile,
      grout: '#E8DFD1',
      pattern: 'grid'
    };

    var GROUTS = ['#FAF6F0', '#DFD3C1', '#9B9388', '#332C25'];

    var renderer = null;
    var fallbackCanvas = null;
    var scene = new T.Scene();
    scene.background = new T.Color('#EAE1D3');

    var camera = new T.PerspectiveCamera(45, stage.clientWidth / Math.max(460, stage.clientHeight), 0.1, 100);
    camera.position.set(3.4, 2.35, 3.8);

    try {
      renderer = new T.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(w.devicePixelRatio || 1, 2));
      renderer.setSize(stage.clientWidth, Math.max(480, stage.clientHeight));
      renderer.shadowMap.enabled = true;
      stage.insertBefore(renderer.domElement, stage.firstChild);
    } catch (_) {
      renderer = null;
      fallbackCanvas = d.createElement('canvas');
      fallbackCanvas.width = Math.max(640, stage.clientWidth || 800);
      fallbackCanvas.height = Math.max(480, stage.clientHeight || 560);
      fallbackCanvas.style.width = '100%';
      fallbackCanvas.style.height = '100%';
      stage.insertBefore(fallbackCanvas, stage.firstChild);
    }

    var controls = (renderer && T.OrbitControls) ? new T.OrbitControls(camera, renderer.domElement) : null;
    if (controls) {
      controls.enableDamping = true;
      controls.target.set(0, 1.0, 0);
      controls.maxPolarAngle = Math.PI / 2 - 0.04;
      controls.minDistance = 2.0;
      controls.maxDistance = 8.0;
    }

    // Soft daylight + warm architectural highlight
    var amb = new T.AmbientLight('#FFFDF8', 0.85);
    scene.add(amb);
    var sun = new T.DirectionalLight('#FFF5E4', 0.9);
    sun.position.set(4, 7, 5);
    sun.castShadow = true;
    scene.add(sun);
    var fill = new T.DirectionalLight('#E8DFD2', 0.4);
    fill.position.set(-4, 3, -3);
    scene.add(fill);

    var roomGroup = new T.Group();
    scene.add(roomGroup);

    var floorMat = new T.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.35, metalness: 0.06 });
    var wallMat = new T.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.45, metalness: 0.04 });

    // Procedural Canvas Texture generator for 3D surfaces
    function buildCanvasTexture(tile, repeatX, repeatY) {
      var canvas = d.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      var ctx = canvas.getContext('2d');

      function drawSample() {
        var cg = (tile && tile.cg) || 'beige';
        var dg = (tile && tile.design) || 'marble';
        var pal = {
          white: ['#FAF7F2', '#EFE8DC', '#C9B596'],
          beige: ['#EFE5D5', '#DFD0B8', '#B89158'],
          grey: ['#DBD7D0', '#C3BFB7', '#89847C'],
          brown: ['#C8A887', '#A47D58', '#6B4829'],
          dark: ['#191613', '#28221B', '#E4B858'],
          black: ['#191613', '#28221B', '#DFB150'],
          gold: ['#1A1612', '#2B231A', '#E4B858'],
          color: ['#DCE4DC', '#B8C6BA', '#6A8371']
        }[cg] || ['#EFE5D5', '#DFD0B8', '#B89158'];

        // Draw 2x2 tile grid on 512x512 with grout & optional offset
        ctx.fillStyle = state.grout;
        ctx.fillRect(0, 0, 512, 512);

        var cols = 2, rows = 2;
        var cw = 512 / cols, ch = 512 / rows;
        for (var r = 0; r < rows; r++) {
          var offX = (state.pattern === 'half' && r % 2 === 1) ? cw * 0.5 : (state.pattern === 'third' && r % 2 === 1 ? cw * 0.33 : 0);
          for (var c = -1; c <= cols; c++) {
            var x = c * cw + offX;
            var y = r * ch;
            var grad = ctx.createLinearGradient(x, y, x + cw, y + ch);
            grad.addColorStop(0, pal[0]);
            grad.addColorStop(1, pal[1]);
            ctx.fillStyle = grad;
            ctx.fillRect(x + 3, y + 3, cw - 6, ch - 6);

            // Organic veins / wood grain
            ctx.strokeStyle = pal[2];
            ctx.globalAlpha = (cg === 'gold' || cg === 'black') ? 0.65 : 0.32;
            ctx.lineWidth = dg === 'marble' ? 2 : 1.5;
            for (var v = 0; v < 3; v++) {
              ctx.beginPath();
              ctx.moveTo(x + 8, y + 30 + v * 65);
              ctx.bezierCurveTo(x + cw * 0.4, y + v * 55, x + cw * 0.7, y + 80 + v * 45, x + cw - 8, y + 25 + v * 70);
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          }
        }
      }

      drawSample();
      var tex = new T.CanvasTexture(canvas);
      tex.wrapS = T.RepeatWrapping;
      tex.wrapT = T.RepeatWrapping;
      tex.repeat.set(repeatX || 3, repeatY || 3);

      // Use dedicated fitting-room texture (fitting_img) or template_img / uploaded photo
      var texSrc = tile ? (tile.fitting_img || tile.template_img || (Array.isArray(tile.imgs) && tile.imgs[0]) || '') : '';
      if (texSrc) {
        var image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = function () {
          ctx.fillStyle = state.grout;
          ctx.fillRect(0, 0, 512, 512);
          var cw = 256, ch = 256;
          for (var r = 0; r < 2; r++) {
            var off = (state.pattern === 'half' && r % 2 === 1) ? 128 : 0;
            for (var c = -1; c <= 2; c++) {
              ctx.drawImage(image, c * cw + off + 3, r * ch + 3, cw - 6, ch - 6);
            }
          }
          tex.needsUpdate = true;
        };
        image.src = texSrc;
      }

      return tex;
    }

    function renderFallback2D() {
      if (!fallbackCanvas) return;
      var cw = fallbackCanvas.width;
      var ch = fallbackCanvas.height;
      var ctx = fallbackCanvas.getContext('2d');
      ctx.fillStyle = '#EFE7DA';
      ctx.fillRect(0, 0, cw, ch);

      // Draw wall area
      var wCol = (state.wallTile && state.wallTile.cg === 'dark') ? '#221C16' : '#F7F1E7';
      ctx.fillStyle = wCol;
      ctx.fillRect(40, 40, cw - 80, ch * 0.56);
      ctx.strokeStyle = state.grout;
      ctx.lineWidth = 3;
      for (var x = 40; x < cw - 40; x += 110) {
        ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, 40 + ch * 0.56); ctx.stroke();
      }
      for (var y = 40; y < 40 + ch * 0.56; y += 70) {
        ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(cw - 40, y); ctx.stroke();
      }

      // Draw floor perspective trapezoid
      var fCol = (state.floorTile && state.floorTile.cg === 'dark') ? '#1D1813' : '#E6DAC6';
      ctx.fillStyle = fCol;
      ctx.beginPath();
      ctx.moveTo(40, 40 + ch * 0.56);
      ctx.lineTo(cw - 40, 40 + ch * 0.56);
      ctx.lineTo(cw, ch);
      ctx.lineTo(0, ch);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = state.grout;
      ctx.stroke();

      ctx.fillStyle = 'rgba(22,19,16,0.78)';
      ctx.fillRect(40, ch * 0.56 - 6, cw - 80, 34);
      ctx.fillStyle = '#FBF4E4';
      ctx.font = '600 13px Inter, sans-serif';
      ctx.fillText('2D превью помещения · Пол: ' + (state.floorTile ? state.floorTile.name : '') + ' | Стены: ' + (state.wallTile ? state.wallTile.name : ''), 56, ch * 0.56 + 16);
    }

    function applyTextures() {
      if (state.floorTile) {
        floorMat.map = buildCanvasTexture(state.floorTile, 3, 3);
        floorMat.roughness = (state.floorTile.surf || '').toLowerCase().indexOf('полит') >= 0 || (state.floorTile.surf || '').toLowerCase().indexOf('глян') >= 0 ? 0.14 : 0.42;
        floorMat.needsUpdate = true;
      }
      if (state.wallTile) {
        wallMat.map = buildCanvasTexture(state.wallTile, 3, 2);
        wallMat.roughness = (state.wallTile.surf || '').toLowerCase().indexOf('глян') >= 0 ? 0.18 : 0.48;
        wallMat.needsUpdate = true;
      }
      if (infoEl) {
        infoEl.innerHTML =
          '<span>Пол: <b>' + U.esc(state.floorTile ? state.floorTile.name : '-') + '</b></span> · ' +
          '<span>Стены: <b>' + U.esc(state.wallTile ? state.wallTile.name : '-') + '</b></span>';
      }
      renderFallback2D();
    }

    function buildRoom(kind) {
      while (roomGroup.children.length) roomGroup.remove(roomGroup.children[0]);

      // Floor 4x4m
      var floor = new T.Mesh(new T.BoxGeometry(4.4, 0.08, 4.4), floorMat);
      floor.position.set(0, -0.04, 0);
      floor.receiveShadow = true;
      roomGroup.add(floor);

      // Back & Left walls
      var backWall = new T.Mesh(new T.BoxGeometry(4.4, 2.7, 0.12), wallMat);
      backWall.position.set(0, 1.35, -2.2);
      backWall.receiveShadow = true;
      roomGroup.add(backWall);

      var leftWall = new T.Mesh(new T.BoxGeometry(0.12, 2.7, 4.4), wallMat);
      leftWall.position.set(-2.2, 1.35, 0);
      leftWall.receiveShadow = true;
      roomGroup.add(leftWall);

      // Architectural furniture depending on room preset
      var woodMat = new T.MeshStandardMaterial({ color: '#9C734B', roughness: 0.55 });
      var whiteMat = new T.MeshStandardMaterial({ color: '#FAF6F0', roughness: 0.25 });
      var brassMat = new T.MeshStandardMaterial({ color: '#C28E36', metalness: 0.85, roughness: 0.25 });
      var darkMat = new T.MeshStandardMaterial({ color: '#26201A', roughness: 0.4 });

      if (kind === 'bath') {
        // Bathtub + Vanity + Mirror
        var tub = new T.Mesh(new T.BoxGeometry(1.75, 0.56, 0.82), whiteMat);
        tub.position.set(-1.15, 0.28, -1.65);
        tub.castShadow = true;
        roomGroup.add(tub);

        var vanity = new T.Mesh(new T.BoxGeometry(1.05, 0.78, 0.52), woodMat);
        vanity.position.set(0.85, 0.42, -1.85);
        vanity.castShadow = true;
        roomGroup.add(vanity);

        var basin = new T.Mesh(new T.BoxGeometry(0.58, 0.12, 0.4), whiteMat);
        basin.position.set(0.85, 0.86, -1.83);
        roomGroup.add(basin);

        var mirror = new T.Mesh(new T.BoxGeometry(0.95, 1.15, 0.04), brassMat);
        mirror.position.set(0.85, 1.65, -2.11);
        roomGroup.add(mirror);
      } else if (kind === 'kitchen') {
        var lower = new T.Mesh(new T.BoxGeometry(3.2, 0.88, 0.65), whiteMat);
        lower.position.set(0.1, 0.44, -1.8);
        lower.castShadow = true;
        roomGroup.add(lower);

        var top = new T.Mesh(new T.BoxGeometry(3.24, 0.05, 0.68), darkMat);
        top.position.set(0.1, 0.9, -1.8);
        roomGroup.add(top);

        var upper = new T.Mesh(new T.BoxGeometry(2.6, 0.78, 0.36), woodMat);
        upper.position.set(-0.2, 1.95, -1.94);
        upper.castShadow = true;
        roomGroup.add(upper);

        var table = new T.Mesh(new T.BoxGeometry(1.4, 0.06, 0.88), woodMat);
        table.position.set(0.3, 0.75, 0.55);
        table.castShadow = true;
        roomGroup.add(table);
      } else {
        // Living room: sofa + coffee table + minimalist portal
        var sofa = new T.Mesh(new T.BoxGeometry(2.2, 0.42, 0.95), new T.MeshStandardMaterial({ color: '#D8CCBB', roughness: 0.9 }));
        sofa.position.set(0.2, 0.24, -1.4);
        sofa.castShadow = true;
        roomGroup.add(sofa);

        var backSofa = new T.Mesh(new T.BoxGeometry(2.2, 0.52, 0.22), new T.MeshStandardMaterial({ color: '#CFC1AD', roughness: 0.9 }));
        backSofa.position.set(0.2, 0.62, -1.78);
        roomGroup.add(backSofa);

        var cTable = new T.Mesh(new T.CylinderGeometry(0.48, 0.48, 0.04, 32), darkMat);
        cTable.position.set(0.2, 0.42, 0.05);
        cTable.castShadow = true;
        roomGroup.add(cTable);

        var leg = new T.Mesh(new T.CylinderGeometry(0.06, 0.14, 0.4, 16), brassMat);
        leg.position.set(0.2, 0.21, 0.05);
        roomGroup.add(leg);
      }
    }

    function renderTileList(q) {
      if (!tilesListEl) return;
      var s = String(q || '').trim().toLowerCase();
      var list = PRODUCTS.filter(function (p) {
        return !s || (p.name + ' ' + p.coll + ' ' + U.size(p) + ' ' + U.label('designs', p.design)).toLowerCase().indexOf(s) >= 0;
      }).slice(0, 36);

      var activeObj = state.target === 'floor' ? state.floorTile : state.wallTile;
      tilesListEl.innerHTML = list.map(function (p) {
        var on = activeObj && activeObj.id === p.id ? ' on' : '';
        return (
          '<button type="button" class="f3-tile' + on + '" data-tid="' + U.esc(p.id) + '">' +
          '  <img src="' + U.esc(U.img(p)) + '" alt="">' +
          '  <b>' + U.esc(p.name) + '</b>' +
          '  <small>' + U.esc(U.size(p)) + ' · ' + U.esc(U.hasPrice(p) ? U.priceText(p) : (p.surf || 'Цена по запросу')) + '</small>' +
          '</button>'
        );
      }).join('');
    }

    if (groutEl) {
      groutEl.innerHTML = GROUTS.map(function (c) {
        return '<button type="button" class="f3-swatch' + (c === state.grout ? ' on' : '') + '" data-gr="' + c + '" style="background:' + c + '" aria-label="Цвет затирки ' + c + '"></button>';
      }).join('');
      groutEl.addEventListener('click', function (e) {
        var b = e.target.closest('[data-gr]');
        if (!b) return;
        state.grout = b.dataset.gr;
        groutEl.querySelectorAll('.f3-swatch').forEach(function (x) { x.classList.toggle('on', x === b); });
        applyTextures();
      });
    }

    if (tilesListEl) {
      tilesListEl.addEventListener('click', function (e) {
        var b = e.target.closest('[data-tid]');
        if (!b) return;
        var p = U.byId(b.dataset.tid);
        if (!p) return;
        if (state.target === 'floor') state.floorTile = p;
        else state.wallTile = p;
        applyTextures();
        renderTileList(searchInp ? searchInp.value : '');
      });
    }

    if (targetTabs) {
      targetTabs.addEventListener('click', function (e) {
        var b = e.target.closest('[data-tgt]');
        if (!b) return;
        state.target = b.dataset.tgt;
        targetTabs.querySelectorAll('.f3-btn').forEach(function (x) { x.classList.toggle('on', x === b); });
        renderTileList(searchInp ? searchInp.value : '');
      });
    }

    if (presetBtns) {
      presetBtns.addEventListener('click', function (e) {
        var b = e.target.closest('[data-rm]');
        if (!b) return;
        state.room = b.dataset.rm;
        presetBtns.querySelectorAll('.f3-btn').forEach(function (x) { x.classList.toggle('on', x === b); });
        buildRoom(state.room);
      });
    }

    if (patSel) patSel.addEventListener('change', function () { state.pattern = patSel.value; applyTextures(); });
    if (searchInp) searchInp.addEventListener('input', function () { renderTileList(searchInp.value); });

    var addFloorBtn = d.getElementById('f3AddFloor');
    if (addFloorBtn) addFloorBtn.onclick = function () { if (state.floorTile) U.cart.add(state.floorTile.id, 1); };
    var resetCamBtn = d.getElementById('f3ResetCam');
    if (resetCamBtn) resetCamBtn.onclick = function () {
      camera.position.set(3.4, 2.35, 3.8);
      if (controls) controls.target.set(0, 1.0, 0);
    };

    buildRoom(state.room);
    applyTextures();
    renderTileList('');

    function animate() {
      if (!renderer) return;
      requestAnimationFrame(animate);
      if (controls) controls.update();
      renderer.render(scene, camera);
    }
    animate();

    w.addEventListener('resize', function () {
      var w0 = stage.clientWidth;
      var h0 = Math.max(460, stage.clientHeight);
      camera.aspect = w0 / h0;
      camera.updateProjectionMatrix();
      if (renderer) renderer.setSize(w0, h0);
    });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
