  /* ============================================================
     6.39.5) شكل الشخصية: ذراعان حقيقيّتان تمسكان السلاح + حذاءان + ظلّ
     ------------------------------------------------------------
     الذراع صارت عظمين حقيقيّين (عضد + ساعد) تُحلّ بـ IK ثنائي العظم:
     نأخذ مكان المقبض من صندوق السلاح نفسه، نضع اليد عليه فعلاً، ثم
     نحسب المرفق. اليد اليسرى تسند الماسورة في السلاح الطويل، وتلتفّ
     حول اليمنى في المسدّس (مسكة الرماة). والقدمان حذاءان كاملان:
     نعل ووجه ومقدّمة وكعب ورباط.
     ============================================================ */
  var LT = null;
  function ltmp() {
    if (LT) return LT;
    var T = window.__ROYAL_THREE__;
    LT = {
      down: new T.V3(0, -1, 0), up: new T.V3(0, 1, 0),
      a: new T.V3(), b: new T.V3(), c: new T.V3(), d: new T.V3(), e: new T.V3(),
      f: new T.V3(), g: new T.V3(), h: new T.V3(),
      x: new T.V3(), y: new T.V3(), z: new T.V3(),
      i1: new T.V3(), i2: new T.V3(),
      q: new T.Quat(), m: new T.Mat4(), m2: new T.Mat4()
    };
    return LT;
  }
  function limbMat(T, hex, rough, metal) {
    return new T.Std({
      color: hex,
      roughness: rough == null ? 0.55 : rough,
      metalness: metal == null ? 0.04 : metal
    });
  }

  /* صندوق مجسّم داخل فضاء مجموعةٍ أُخرى — بلا تضخّم من دوران العالم */
  function localBox(T, root, node) {
    var box = new T.Box3(); box.makeEmpty();
    root.updateWorldMatrix(true, false);
    node.updateWorldMatrix(true, true);
    var t = ltmp();
    t.m.copy(root.matrixWorld).invert();
    var any = false;
    node.traverse(function (o) {
      if (!o.isMesh || !o.geometry) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      var bb = o.geometry.boundingBox;
      if (!bb) return;
      t.m2.multiplyMatrices(t.m, o.matrixWorld);
      var tmp = bb.clone(); tmp.applyMatrix4(t.m2);
      box.union(tmp); any = true;
    });
    return any ? box : null;
  }

  /* أبعاد السلاح داخل مجموعته: نستخرج منها المقبض والمسند */
  function gunSpan(rig) {
    var T = window.__ROYAL_THREE__;
    var kid = rig && rig.children.length ? rig.children[0] : null;
    if (!kid) return null;
    if (rig.__span && rig.__spanId === kid.uuid) return rig.__span;
    var b = null;
    try { b = localBox(T, rig, kid); } catch (e) { }
    if (!b) return null;
    var s = {
      cx: (b.min.x + b.max.x) * 0.5,
      yLo: b.min.y, yHi: b.max.y,
      zLo: b.min.z, zHi: b.max.z,
      w: b.max.x - b.min.x, h: b.max.y - b.min.y, d: b.max.z - b.min.z
    };
    rig.__span = s; rig.__spanId = kid.uuid;
    /* السلاح يُستبدل عند كل التقاط: أعِد ضبط رمي الظلّ على المجسّم الجديد */
    if (OPT.shadow && window.__ROYAL_CASTALL__) window.__ROYAL_CASTALL__(kid);
    return s;
  }

  /* حلّ IK بعظمين: يُرجع مكان المرفق في out، ويصحّح الهدف إن تعذّر الوصول */
  function solveIK(S, Tg, a, b, pole, out, fixed) {
    var t = ltmp();
    var dir = t.i1.copy(Tg).sub(S);
    var d = dir.length();
    if (d < 1e-5) { dir.set(0, -1, 0); d = 1e-5; }
    dir.multiplyScalar(1 / d);
    var max = (a + b) * 0.998, min = Math.abs(a - b) * 1.02 + 1e-4;
    var dd = d > max ? max : (d < min ? min : d);
    if (dd !== d) fixed.copy(S).addScaledVector(dir, dd); else fixed.copy(Tg);
    var p = t.i2.copy(pole);
    p.addScaledVector(dir, -p.dot(dir));
    if (p.lengthSq() < 1e-8) p.set(dir.z, 0, -dir.x);
    if (p.lengthSq() < 1e-8) p.set(1, 0, 0);
    p.normalize();
    var x = (dd * dd + a * a - b * b) / (2 * dd);
    var hh = Math.sqrt(Math.max(0, a * a - x * x));
    out.copy(S).addScaledVector(dir, x).addScaledVector(p, hh);
    return out;
  }

  /* عظم أسطواني بين نقطتين */
  function placeBone(mesh, A, B) {
    var t = ltmp();
    var v = t.c.copy(B).sub(A);
    var len = v.length();
    if (len < 1e-5) len = 1e-5;
    mesh.position.copy(A).addScaledVector(v, 0.5);
    t.d.copy(v).multiplyScalar(1 / len);
    t.q.setFromUnitVectors(t.down, t.d);
    mesh.quaternion.copy(t.q);
    mesh.scale.set(1, len, 1);
  }

  /* توجيه الكفّ: محوره Y نحو المرفق، وZ باتّجاه السلاح */
  function orientHand(hand, handPos, elbowPos, fwd) {
    var t = ltmp();
    t.y.copy(elbowPos).sub(handPos);
    if (t.y.lengthSq() < 1e-8) t.y.set(0, 1, 0);
    t.y.normalize();
    t.z.copy(fwd);
    t.z.addScaledVector(t.y, -t.z.dot(t.y));
    if (t.z.lengthSq() < 1e-8) { t.z.set(0, 0, 1); t.z.addScaledVector(t.y, -t.z.dot(t.y)); }
    if (t.z.lengthSq() < 1e-8) t.z.set(1, 0, 0);
    t.z.normalize();
    t.x.crossVectors(t.y, t.z).normalize();
    t.z.crossVectors(t.x, t.y).normalize();
    t.m.makeBasis(t.x, t.y, t.z);
    hand.quaternion.setFromRotationMatrix(t.m);
    hand.position.copy(handPos);
  }

  function buildLimbs(game, ch, lod) {
    if (!ch || ch.__limbs) return;
    var T = window.__ROYAL_THREE__; if (!T || !ch.tilt) return;
    var R = ch.R, L = ch.L;
    var base = (ch.opts && ch.opts.body) || "#ffc21a";
    var C = new T.Color(base);
    var sleeve = C.clone().multiplyScalar(0.88);
    var cuff = C.clone().multiplyScalar(0.5);
    var seg = lod ? 6 : 12;
    var cast = !lod;

    var matSleeve = limbMat(T, sleeve.getHex(), 0.62);
    var matCuff = limbMat(T, cuff.getHex(), 0.5);
    var matGlove = limbMat(T, 0x24242c, 0.42, 0.06);
    var matSole = limbMat(T, 0x1b1b22, 0.9);
    var matShoe = limbMat(T, sleeve.getHex(), 0.52);
    var matToe = limbMat(T, cuff.getHex(), 0.45);
    var matLace = limbMat(T, 0xf4f4f8, 0.55);

    function bone(rA, rB) {
      var m = new T.Mesh(new T.Cyl(rA, rB, 1, seg, 1), matSleeve);
      m.castShadow = cast; m.frustumCulled = false;
      ch.tilt.add(m);
      return m;
    }
    function ball(r, mat) {
      var m = new T.Mesh(new T.Sph(r, seg, Math.max(4, seg - 4)), mat);
      m.castShadow = cast; m.frustumCulled = false;
      ch.tilt.add(m);
      return m;
    }
    /* الكفّ: راحة + أصابع ملتفّة حول المقبض + إبهام + معصم */
    function makeHand(side) {
      var g = new T.Group();
      var palm = new T.Mesh(new T.Box(R * 0.19, R * 0.28, R * 0.22), matGlove);
      palm.position.set(0, 0, -R * 0.08);
      g.add(palm);
      /* الأصابع أمام الراحة: أصل المجموعة يقع بينهما فينطبق على المقبض */
      var fing = new T.Mesh(new T.Cyl(R * 0.145, R * 0.145, R * 0.26, seg, 1), matGlove);
      fing.rotation.z = Math.PI * 0.5;
      fing.position.set(0, -R * 0.02, R * 0.07);
      g.add(fing);
      var thumb = new T.Mesh(new T.Cyl(R * 0.068, R * 0.055, R * 0.22, 6, 1), matGlove);
      thumb.rotation.set(Math.PI * 0.44, 0, -side * 0.42);
      thumb.position.set(side * R * 0.1, R * 0.09, R * 0.07);
      g.add(thumb);
      var wrist = new T.Mesh(new T.Cyl(R * 0.125, R * 0.115, R * 0.13, seg, 1), matCuff);
      wrist.position.set(0, R * 0.2, 0);
      g.add(wrist);
      g.traverse(function (o) { if (o.isMesh) { o.castShadow = cast; o.frustumCulled = false; } });
      ch.tilt.add(g);
      return g;
    }

    var Lb = {
      t: 0,
      shL: ball(R * 0.24, matSleeve), shR: ball(R * 0.24, matSleeve),
      upL: bone(R * 0.2, R * 0.165), upR: bone(R * 0.2, R * 0.165),
      elL: ball(R * 0.165, matSleeve), elR: ball(R * 0.165, matSleeve),
      foL: bone(R * 0.16, R * 0.13), foR: bone(R * 0.16, R * 0.13),
      hdL: makeHand(-1), hdR: makeHand(1),
      upLen: L * 0.42, foLen: L * 0.40,
      /* أهداف مُنعَّمة حتى لا تقفز اليد بين الحالات */
      tL: new T.V3(), tR: new T.V3(), has: false,
      eL: new T.V3(), eR: new T.V3(), fL: new T.V3(), fR: new T.V3(),
      fwd: new T.V3(0, 0, 1), kick: 0
    };

    /* السلاح: مجموعة نتحكّم بها وحدنا (لا يلمسها المحرّك) */
    if (game && game.player === ch && game.handGun) Lb.rig = game.handGun;
    else if (ch.mounts && ch.mounts.hand) {
      var r = new T.Group();
      ch.mounts.hand.add(r);
      Lb.rig = r;
    }
    /* مركز مثبّت للمِعصم: نُصفّر إزاحة المِقبض الأصليّة فيصير الحساب دقيقاً */
    if (ch.mounts && ch.mounts.hand) { ch.mounts.hand.position.x = 0; ch.mounts.hand.position.z = 0; }

    /* حذاء كامل بدل الكرة */
    function shoe(foot) {
      foot.scale.set(1, 1, 1);
      var oldG = foot.geometry;
      /* النعل: أضيق قليلاً من وجه الحذاء ليُقرأ نعلاً، ومركزه ‎-0.14R‎
         حتى يلامس أسفله الأرض تماماً كما كانت الكرة القديمة */
      foot.geometry = new T.Box(R * 0.46, R * 0.13, R * 1.04);
      foot.material = matSole;
      foot.castShadow = cast;
      try { oldG.dispose(); } catch (e) { }
      foot.geometry.translate(0, -R * 0.145, 0);
      var top = new T.Mesh(new T.Box(R * 0.5, R * 0.30, R * 0.72), matShoe);
      top.position.set(0, R * 0.07, -R * 0.09);
      foot.add(top);
      var toe = new T.Mesh(new T.Sph(R * 0.25, seg, Math.max(4, seg - 4)), matShoe);
      toe.scale.set(1.0, 0.62, 1.05);
      toe.position.set(0, -R * 0.01, R * 0.32);
      foot.add(toe);
      var cap = new T.Mesh(new T.Box(R * 0.42, R * 0.1, R * 0.24), matToe);
      cap.position.set(0, -R * 0.05, R * 0.36);
      foot.add(cap);
      var heel = new T.Mesh(new T.Box(R * 0.46, R * 0.22, R * 0.18), matToe);
      heel.position.set(0, R * 0.04, -R * 0.42);
      foot.add(heel);
      var lace = new T.Mesh(new T.Box(R * 0.3, R * 0.045, R * 0.09), matLace);
      lace.position.set(0, R * 0.2, R * 0.02);
      foot.add(lace);
      var lace2 = new T.Mesh(new T.Box(R * 0.3, R * 0.045, R * 0.09), matLace);
      lace2.position.set(0, R * 0.17, R * 0.17);
      foot.add(lace2);
      foot.traverse(function (o) { if (o.isMesh) o.castShadow = cast; });
    }
    if (OPT.charShoes !== false) { shoe(ch.footL); shoe(ch.footR); }

    ch.__limbs = Lb;
  }

  /* أين تُمسك هذه القطعة من السلاح؟ يُحسب من صندوقه هو، فيصلح لأي مجسّم */
  function gripPoints(span, len, out1, out2) {
    var longGun = len > 0.55;
    if (longGun) {
      out1.set(span.cx, span.yLo + span.h * 0.34, span.zLo + span.d * 0.20);
      out2.set(span.cx, span.yLo + span.h * 0.42, span.zLo + span.d * 0.62);
    } else {
      out1.set(span.cx, span.yLo + span.h * 0.40, span.zLo + span.d * 0.26);
      out2.set(span.cx, span.yLo + span.h * 0.46, span.zLo + span.d * 0.26);
    }
    return longGun;
  }

  function poseLimbs(game, ch, dt, def) {
    var Lb = ch.__limbs; if (!Lb) return;
    var T = window.__ROYAL_THREE__, t = ltmp();
    var R = ch.R, L = ch.L, st = ch.st;
    Lb.t += dt;
    Lb.kick = Math.max(0, Lb.kick - dt * 6);

    var aim = st.aim || 0;
    var sp = Math.min(1, (st.speed || 0) / 7);
    var swing = Math.sin(Lb.t * (5.4 + sp * 6.5)) * sp;
    var breathe = Math.sin(Lb.t * 1.5) * 0.012;
    var cy = -st.crouch * R * 0.42;
    var shY = R + L * 0.60 + cy;
    var mount = ch.mounts && ch.mounts.hand ? ch.mounts.hand.position : null;

    /* الكتفان خارج جسم الكبسولة (نصف قطرها R) وإلّا غاصت الذراع فيه */
    Lb.shL.position.set(-R * 1.08, shY, 0);
    Lb.shR.position.set(R * 1.08, shY, 0);

    var rig = Lb.rig;
    var span = rig ? gunSpan(rig) : null;
    var len = (def && def.len) || 0.5;
    var gun = !!span;
    var longGun = len > 0.55;

    if (gun) {
      /* 1) أين نريد المقبض في فضاء الجسم — أمام الصدر خارج حدود الكبسولة.
            المسدّس يُمسك بيدين على خطّ المنتصف (مسكة الرماة)، والسلاح
            الطويل يُمسك على الجنب الأيمن ومؤخّرته عند الكتف. */
      var gx = longGun ? R * (0.46 - aim * 0.32) : R * (0.22 - aim * 0.17);
      var gy = R + L * (0.45 + aim * 0.09) + cy + breathe - Lb.kick * 0.02;
      var gz = R * ((longGun ? 1.16 : 1.30) + aim * 0.5) - Lb.kick * 0.16;
      t.f.set(gx, gy, gz);

      /* 2) ميل السلاح مع النظر */
      var pitch = 0;
      if (OPT.gunPitch !== false && game && game.player === ch && typeof game.pitch === "number") {
        pitch = Math.max(-0.7, Math.min(0.7, -game.pitch * (OPT.gunPitchMul == null ? 0.85 : OPT.gunPitchMul)));
      }
      rig.rotation.set(pitch + Lb.kick * 0.35, 0, longGun ? -0.05 : -0.12);

      /* 3) ضع المجموعة بحيث يقع المقبض تماماً على النقطة المطلوبة */
      gripPoints(span, len, t.g, t.h);
      t.a.copy(t.g).applyEuler(rig.rotation);
      rig.position.set(
        t.f.x - t.a.x - (mount ? mount.x : 0),
        t.f.y - t.a.y - (mount ? mount.y : 0),
        t.f.z - t.a.z - (mount ? mount.z : 0)
      );
      if (def && def.hold) {
        rig.position.x += def.hold.px || 0;
        rig.position.y += def.hold.py || 0;
        rig.position.z += def.hold.pz || 0;
      }

      /* 4) اتّجاه السلاح ومكان اليدين عليه */
      Lb.fwd.set(0, 0, 1).applyEuler(rig.rotation).normalize();
      var mx = (mount ? mount.x : 0) + rig.position.x;
      var my = (mount ? mount.y : 0) + rig.position.y;
      var mz = (mount ? mount.z : 0) + rig.position.z;
      /* اليمنى على المقبض */
      t.b.copy(t.g).applyEuler(rig.rotation);
      Lb.tR.set(mx + t.b.x, my + t.b.y, mz + t.b.z);
      /* اليسرى: تسند الماسورة، أو تُطبق على اليمنى في المسدّس */
      t.b.copy(t.h).applyEuler(rig.rotation);
      Lb.tL.set(mx + t.b.x, my + t.b.y, mz + t.b.z);
      if (!longGun) {
        t.x.set(1, 0, 0).applyEuler(rig.rotation);
        Lb.tL.addScaledVector(t.x, -R * 0.22).addScaledVector(Lb.fwd, -R * 0.05);
        Lb.tL.y -= R * 0.03;
      } else {
        /* السلاح أطول من ذراع الشخصيّة: بدل أن تطير اليد في الهواء
           نُزلقها على محور السلاح إلى أبعد نقطة يبلغها الذراع فعلاً */
        var reach = (Lb.upLen + Lb.foLen) * 0.96;
        t.a.copy(Lb.tR).sub(Lb.shL.position);
        var bq = t.a.dot(Lb.fwd);
        var cq = t.a.lengthSq() - reach * reach;
        var want = t.b.copy(Lb.tL).sub(Lb.tR).dot(Lb.fwd);
        var disc = bq * bq - cq;
        var slide = want;
        if (disc > 0) {
          var sMax = -bq + Math.sqrt(disc);
          if (slide > sMax) slide = Math.max(0, sMax);
        } else slide = Math.max(0, -bq);
        Lb.tL.copy(Lb.tR).addScaledVector(Lb.fwd, slide);
        Lb.tL.y += R * 0.05;
      }
    } else {
      /* بلا سلاح: الذراعان على الجنبين مع تأرجح المشي */
      Lb.fwd.set(0, 0, 1);
      Lb.tR.set(R * 1.02, R + L * 0.20 + cy, -swing * R * 0.9);
      Lb.tL.set(-R * 1.02, R + L * 0.20 + cy, swing * R * 0.9);
    }

    /* تنعيم انتقال اليد بين الحالات */
    if (!Lb.has) { Lb.fR.copy(Lb.tR); Lb.fL.copy(Lb.tL); Lb.has = true; }
    var k = 1 - Math.exp(-(gun ? 18 : 12) * Math.min(dt, 0.1));
    Lb.fR.lerp(Lb.tR, k); Lb.fL.lerp(Lb.tL, k);

    /* حلّ الذراعين */
    var a = Lb.upLen, b = Lb.foLen;
    /* متّجه القطب: المرفق ينزل للأسفل وللخارج قليلاً وللخلف */
    t.e.set(0.55, -1, -0.42).normalize();
    solveIK(Lb.shR.position, Lb.fR, a, b, t.e, Lb.eR, t.a);
    placeBone(Lb.upR, Lb.shR.position, Lb.eR);
    placeBone(Lb.foR, Lb.eR, t.a);
    Lb.elR.position.copy(Lb.eR);
    orientHand(Lb.hdR, t.a, Lb.eR, Lb.fwd);

    t.e.set(gun && longGun ? -0.30 : -0.55, -1, gun ? -0.30 : -0.42).normalize();
    solveIK(Lb.shL.position, Lb.fL, a, b, t.e, Lb.eL, t.b);
    placeBone(Lb.upL, Lb.shL.position, Lb.eL);
    placeBone(Lb.foL, Lb.eL, t.b);
    Lb.elL.position.copy(Lb.eL);
    orientHand(Lb.hdL, t.b, Lb.eL, Lb.fwd);
  }

  function upgradeChars(game) {
    if (!OPT.charLimbs) return;
    try { buildLimbs(game, game.player, false); } catch (e) { console.warn("limbs", e); }
    if (OPT.botLimbs && game.bots) {
      for (var i = 0; i < game.bots.length; i++) {
        try { buildLimbs(game, game.bots[i].ch, true); } catch (e) { }
      }
    }
  }

  /* ارتداد بسيط عند الإطلاق: تُستدعى من مؤثّرات الطلقة */
  window.__ROYAL_KICK__ = function (game) {
    try {
      var Lb = game && game.player && game.player.__limbs;
      if (Lb) Lb.kick = Math.min(1, Lb.kick + 0.75);
    } catch (e) { }
  };

  /* ------------------------------------------------------------------
     البوتات: سلاح حقيقي في اليد، وضررهم من سلاحهم، ولا يقفون في الزون
     ------------------------------------------------------------------ */
  function armBots(game) {
    if (!OPT.botGuns || !game.bots || !game.cloneGun) return;
    var defs = (game.wdefs || []).filter(function (d) { return d && d.kind !== "rpg"; });
    if (!defs.length) return;
    for (var i = 0; i < game.bots.length; i++) {
      var b = game.bots[i];
      if (!b || !b.ch || b.__gun) continue;
      var d = defs[(Math.random() * defs.length) | 0];
      try {
        var m = game.cloneGun(d);
        m.position.set(0, 0, 0);
        m.rotation.set(d.hold.rx, d.hold.ry + (OPT.gunFlip ? Math.PI : 0), d.hold.rz);
        m.traverse(function (o) { if (o.isMesh) { o.castShadow = !!OPT.shadow; o.frustumCulled = false; } });
        /* المجموعة التي نتحكّم بها في وضع اليد */
        var host = (b.ch.__limbs && b.ch.__limbs.rig) || b.ch.mounts.hand;
        host.add(m);
        b.__gun = d; b.gun = d;
      } catch (e) { }
    }
  }
