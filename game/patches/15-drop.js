  /* ============================================================
     6.48) الجميع ينزلون من الطائرة
     ------------------------------------------------------------
     كان الخصوم يظهرون على الأرض ظهوراً: يبقون مخفيّين ثوانيَ ثمّ
     «يُرسَّبون» في أماكنهم بلا نزول. الآن يقفزون من الطائرة مثلك
     تماماً — كلٌّ عند لحظته على طول المسار — يسقطون سقوطاً حرّاً ثمّ
     تنفتح مظلّاتهم فتُرى عشرات المظلّات في السماء، وينزلقون نحو نقطة
     هبوطهم حتى تلمس أقدامهم الأرض فتُطوى المظلّة ويبدأ اللعب.
     ============================================================ */
  var DROP = { t: 0, on: false, chuteGeo: null, cordGeo: null };

  function makeChute(T, color) {
    var g = new T.Group();
    var mat = new T.Std({ color: color || "#ffc21a", roughness: 0.85, metalness: 0 });
    mat.side = 2;                                   /* DoubleSide */
    if (!DROP.chuteGeo) DROP.chuteGeo = new T.Sph(1.55, 14, 9, 0, Math.PI * 2, 0, Math.PI * 0.5);
    var dome = new T.Mesh(DROP.chuteGeo, mat);
    dome.scale.set(1, 0.72, 1);
    g.add(dome);
    var cordMat = new T.Std({ color: 0x2a2c34, roughness: 0.8 });
    if (!DROP.cordGeo) DROP.cordGeo = new T.Cyl(0.022, 0.022, 1, 4, 1);
    for (var i = 0; i < 4; i++) {
      var a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      var cx = Math.cos(a) * 1.35, cz = Math.sin(a) * 1.35;
      var cord = new T.Mesh(DROP.cordGeo, cordMat);
      var t = ltmp();
      t.a.set(cx, 0, cz); t.b.set(0, -1.5, 0);
      placeBone(cord, t.a, t.b);
      g.add(cord);
    }
    g.position.y = 1.85;
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; } });
    return g;
  }

  /* يُستدعى مع بداية كلّ مباراة */
  function dropInit(game) {
    DROP.t = 0;
    DROP.on = OPT.botChute !== false;
    if (!DROP.on || !game.bots) return;
    var dur = Math.max(6, game.flightDur || 40);
    for (var i = 0; i < game.bots.length; i++) {
      var b = game.bots[i];
      if (!b || !b.ch) continue;
      b.__land = { x: b.pos.x, y: b.pos.y, z: b.pos.z };   /* نقطة الهبوط */
      b.__at = dur * (0.06 + Math.random() * 0.88);         /* لحظة قفزه */
      b.__ph = "wait";
      b.landed = false;
      b.landDelay = 1e9;                                    /* لا يُرسّبه المحرّك */
      b.ch.group.visible = false;
    }
  }

  function dropFrame(game, dt) {
    if (!DROP.on || !game.bots || game.phase === "loading" || game.phase === "end") return;
    DROP.t += dt;
    var T = window.__ROYAL_THREE__;
    var sky = (game.an ? game.an.yMax : 0) + (game.altitude || 260);

    for (var i = 0; i < game.bots.length; i++) {
      var b = game.bots[i];
      if (!b || !b.alive || !b.ch || b.landed || !b.__ph) continue;

      if (b.__ph === "wait") {
        if (DROP.t < b.__at) { b.landDelay = 1e9; continue; }
        /* اخرج من الطائرة حيث هي الآن، وإلّا فمن فوق نقطة هبوطك */
        var sx = b.__land.x, sz = b.__land.z;
        if (game.ship && game.ship.position) { sx = game.ship.position.x; sz = game.ship.position.z; }
        b.pos.set(sx, sky - 4, sz);
        b.ch.group.position.copy(b.pos);
        b.ch.group.visible = true;
        b.__ph = "fall";
        b.__vy = -6;
        continue;
      }

      b.landDelay = 1e9;
      var gy = b.__land.y;
      try { gy = game.groundY(b.pos.x, b.pos.z, b.pos.y); } catch (e) { }

      if (b.__ph === "fall") {
        b.__vy = Math.max(-62, b.__vy - 26 * dt);
        b.pos.y += b.__vy * dt;
        /* ينجرف قليلاً نحو نقطة هبوطه أثناء السقوط */
        b.pos.x += (b.__land.x - b.pos.x) * Math.min(1, dt * 0.35);
        b.pos.z += (b.__land.z - b.pos.z) * Math.min(1, dt * 0.35);
        if (b.pos.y - gy < 48) {
          b.__ph = "chute";
          try {
            if (!b.__chute && T) {
              b.__chute = makeChute(T, (b.ch.opts && b.ch.opts.body) || "#ffc21a");
              b.ch.group.add(b.__chute);
            }
            if (b.__chute) { b.__chute.visible = true; b.__chute.scale.setScalar(0.15); }
          } catch (e) { rerr("chute", e); }
        }
      } else if (b.__ph === "chute") {
        if (b.__chute && b.__chute.scale.x < 1) {
          b.__chute.scale.setScalar(Math.min(1, b.__chute.scale.x + dt * 3.2));
        }
        b.__vy = -8.5;
        b.pos.y += b.__vy * dt;
        var k = Math.min(1, dt * 0.9);
        b.pos.x += (b.__land.x - b.pos.x) * k;
        b.pos.z += (b.__land.z - b.pos.z) * k;
        b.ch.group.rotation.y = (b.ch.group.rotation.y || 0) + dt * 0.35;
        if (b.pos.y <= gy + 0.05) {
          b.pos.y = gy;
          b.__ph = null;
          b.landed = true;
          b.landDelay = 0;
          b.ch.group.rotation.y = 0;
          if (b.__chute) { b.ch.group.remove(b.__chute); b.__chute = null; }
        }
      }

      b.ch.group.position.copy(b.pos);
      try {
        b.ch.update(dt, { speed: 0, grounded: b.__ph === null, groundY: gy, vy: b.__vy });
      } catch (e) { }
    }
  }
