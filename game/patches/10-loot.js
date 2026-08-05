  /* ============================================================
     6.44) شكل الغنائم على الأرض
     ------------------------------------------------------------
     كان اللوت أشكالاً هندسيّة عارية: مكعّب صغير للرصاص، ومجسّم
     عشرونيّ للأدوات، وعمود شفّاف باهت فوقها. الآن لكلّ صنف هيئته:
     صندوق ذخيرة بغطاء وحزامين ورصاصات فوقه، وحقيبة إسعاف بصليب،
     ودرع بلوح، وقنبلة بمقبض — وفوق الجميع عمود ضوء وحلقة تدور على
     الأرض فتُرى الغنيمة من بعيد وتُعرف قبل أن تصلها.
     ============================================================ */
  var LOOT = { mats: null, t: 0 };

  function lootMats(T) {
    if (LOOT.mats) return LOOT.mats;
    function m(hex, rough, emi) {
      return new T.Std({
        color: hex, roughness: rough == null ? 0.55 : rough, metalness: 0.06,
        emissive: emi == null ? hex : emi, emissiveIntensity: emi === 0 ? 0 : 0.18
      });
    }
    LOOT.mats = {
      crate: m(0x4a5a34, 0.75), band: m(0x2b3320, 0.6), brass: m(0xd8a53a, 0.35),
      white: m(0xf2f4f8, 0.5), red: m(0xd42b3c, 0.45), blue: m(0x2aa7ff, 0.4),
      dark: m(0x2a2c34, 0.6), green: m(0x3f6b2e, 0.6), orange: m(0xff8a1e, 0.4)
    };
    return LOOT.mats;
  }

  /* عمود ضوء + حلقة على الأرض بدل الأسطوانة الباهتة */
  function lootBeam(T, colorHex, mesh) {
    var g = new T.Group();
    var beam = new T.Mesh(new T.Cyl(0.30, 0.5, 2.6, 12, 1, true), new T.Basic({
      color: colorHex, transparent: true, opacity: 0.16, depthWrite: false
    }));
    beam.position.y = 1.3;
    g.add(beam);
    var core = new T.Mesh(new T.Cyl(0.09, 0.16, 2.2, 8, 1, true), new T.Basic({
      color: colorHex, transparent: true, opacity: 0.30, depthWrite: false
    }));
    core.position.y = 1.1;
    g.add(core);
    var ring = new T.Mesh(new T.Cyl(0.62, 0.62, 0.035, 20, 1, true), new T.Basic({
      color: colorHex, transparent: true, opacity: 0.55, depthWrite: false
    }));
    ring.position.y = -0.34;
    g.add(ring);
    g.__ring = ring;
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; } });
    mesh.add(g);
    return g;
  }

  function ammoCrate(T, M, color) {
    var g = new T.Group();
    var body = new T.Mesh(new T.Box(0.52, 0.3, 0.36), M.crate);
    g.add(body);
    var lid = new T.Mesh(new T.Box(0.55, 0.07, 0.39), M.band);
    lid.position.y = 0.18;
    g.add(lid);
    for (var i = -1; i <= 1; i += 2) {
      var band = new T.Mesh(new T.Box(0.06, 0.33, 0.38), M.band);
      band.position.set(i * 0.16, 0.01, 0);
      g.add(band);
    }
    var tint = new T.Mesh(new T.Box(0.3, 0.05, 0.2), new T.Std({
      color: color, roughness: 0.4, emissive: color, emissiveIntensity: 0.5
    }));
    tint.position.set(0, 0.22, 0);
    g.add(tint);
    /* رصاصات نحاسيّة فوق الغطاء */
    for (var b = 0; b < 3; b++) {
      var bul = new T.Mesh(new T.Cyl(0.035, 0.035, 0.17, 6, 1), M.brass);
      bul.rotation.z = Math.PI * 0.5;
      bul.position.set(0, 0.26, -0.1 + b * 0.1);
      g.add(bul);
    }
    return g;
  }

  function itemModel(T, M, kind) {
    var g = new T.Group();
    if (kind === "heal" || kind === "med") {
      var big = kind === "med";
      var box = new T.Mesh(new T.Box(big ? 0.5 : 0.38, big ? 0.34 : 0.26, big ? 0.3 : 0.22), M.white);
      g.add(box);
      var h = new T.Mesh(new T.Box(big ? 0.3 : 0.22, 0.07, 0.03), M.red);
      h.position.z = (big ? 0.16 : 0.12);
      g.add(h);
      var v = new T.Mesh(new T.Box(0.07, big ? 0.22 : 0.16, 0.03), M.red);
      v.position.z = h.position.z;
      g.add(v);
      var hand = new T.Mesh(new T.Box(big ? 0.2 : 0.14, 0.04, 0.05), M.dark);
      hand.position.y = big ? 0.2 : 0.16;
      g.add(hand);
    } else if (kind === "shield") {
      var pl = new T.Mesh(new T.Box(0.36, 0.44, 0.09), M.blue);
      g.add(pl);
      var tip = new T.Mesh(new T.Sph(0.19, 10, 8), M.blue);
      tip.scale.set(1, 0.62, 0.5);
      tip.position.y = -0.2;
      g.add(tip);
      var bar = new T.Mesh(new T.Box(0.4, 0.06, 0.11), M.white);
      bar.position.y = 0.12;
      g.add(bar);
    } else if (kind === "nade") {
      var bod = new T.Mesh(new T.Sph(0.19, 10, 8), M.green);
      bod.scale.set(1, 1.12, 1);
      g.add(bod);
      var top = new T.Mesh(new T.Cyl(0.07, 0.08, 0.09, 8, 1), M.dark);
      top.position.y = 0.2;
      g.add(top);
      var lev = new T.Mesh(new T.Box(0.05, 0.2, 0.03), M.dark);
      lev.position.set(0.09, 0.13, 0);
      lev.rotation.z = 0.2;
      g.add(lev);
    } else {
      var c = new T.Mesh(new T.Box(0.3, 0.3, 0.3), M.orange);
      c.rotation.set(0.5, 0.6, 0);
      g.add(c);
    }
    return g;
  }

  /* نُعيد تشكيل كلّ غنيمة جديدة تظهر — بلا خطّاف في المحرّك */
  function upgradeLoot(game) {
    if (OPT.lootLook === false || !game || !game.loot) return;
    var T = window.__ROYAL_THREE__; if (!T) return;
    var M = lootMats(T);
    for (var i = 0; i < game.loot.length; i++) {
      var L = game.loot[i];
      if (!L || !L.mesh || L.mesh.__up) continue;
      var mesh = L.mesh, pay = L.payload || {};
      mesh.__up = true;
      var color = 0xffc21a;
      try {
        /* لون الغنيمة: نأخذه من العمود القديم قبل أن نحذفه */
        for (var k = mesh.children.length - 1; k >= 0; k--) {
          var c = mesh.children[k];
          if (c.isMesh && c.material && c.material.transparent && c.geometry &&
            c.geometry.type && /Cylinder/i.test(c.geometry.type)) {
            if (c.material.color) color = c.material.color.getHex();
            mesh.remove(c);
          }
        }
      } catch (e) { }

      if (pay.t === "ammo") {
        for (var j = mesh.children.length - 1; j >= 0; j--) mesh.remove(mesh.children[j]);
        mesh.add(ammoCrate(T, M, color));
      } else if (pay.t === "item") {
        for (var j2 = mesh.children.length - 1; j2 >= 0; j2--) mesh.remove(mesh.children[j2]);
        mesh.add(itemModel(T, M, pay.kind));
      }
      /* السلاح يبقى مجسّمه كما هو — يكفيه العمود والحلقة */
      mesh.__beam = lootBeam(T, color, mesh);
      mesh.traverse(function (o) {
        if (o.isMesh && o.material && !o.material.transparent) o.castShadow = !!OPT.shadow;
      });
    }
  }

  /* دوران هادئ للحلقة والغنيمة معاً */
  function spinLoot(game, dt) {
    if (OPT.lootLook === false || !game || !game.loot) return;
    LOOT.t += dt;
    for (var i = 0; i < game.loot.length; i++) {
      var m = game.loot[i] && game.loot[i].mesh;
      if (!m || !m.__beam) continue;
      m.__beam.__ring.rotation.y = LOOT.t * 1.3;
      m.__beam.__ring.scale.setScalar(1 + Math.sin(LOOT.t * 2.4 + i) * 0.07);
    }
  }

  var LOOT_T = 0;
  function lootFrame(game, dt) {
    LOOT_T -= dt;
    if (LOOT_T <= 0) { LOOT_T = 0.25; upgradeLoot(game); }
    spinLoot(game, dt);
  }
