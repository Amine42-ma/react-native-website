  /* ============================================================
     6.39.6) ظلّ اللاعب
     ------------------------------------------------------------
     ضوء الشمس كان يغطّي الجزيرة كلّها (‎±130م‏) بخريطة ظلّ 2048، أي
     نحو ثمانية أمتار لكلّ بكسل — فشخصيّةٌ طولها متر ونصف لا تملأ بكسلاً
     واحداً، ولذلك لم يكن لها ظلّ أصلاً. نُبقي الضوء نفسه (فلا يتغيّر
     لون المشهد ولا اتّجاه الإضاءة) لكن نجعل صندوق ظلّه يتبع اللاعب
     داخل مساحة صغيرة، فتصير الدقّة سنتيمترات ويظهر ظلّ حقيقي له
     ولما حوله. ونُضيف تحته ظلّ تماسّ ناعماً يلتصق بالأرض.
     ============================================================ */
  var SHDW = null;

  /* المحرّك يُعيد ضبط عتامة القرص وحجمه كلّ إطار، فلا فائدة من تغييرهما
     من هنا. نضع الشكل كلّه داخل النسيج: قلب داكن ثم تلاشٍ، وهامش شفّاف
     يجعل القرص يبدو أصغر ممّا هو. */
  function shadowTex() {
    var cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    var c = cv.getContext("2d");
    var k = Math.max(0.3, Math.min(1, OPT.blobScale == null ? 0.82 : OPT.blobScale));
    var a = Math.max(0.1, Math.min(1, OPT.blobAlpha == null ? 0.95 : OPT.blobAlpha));
    var g = c.createRadialGradient(64, 64, 1, 64, 64, 63 * k);
    g.addColorStop(0.00, "rgba(0,0,0," + a.toFixed(3) + ")");
    g.addColorStop(0.38, "rgba(0,0,0," + (a * 0.78).toFixed(3) + ")");
    g.addColorStop(0.70, "rgba(0,0,0," + (a * 0.30).toFixed(3) + ")");
    g.addColorStop(1.00, "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
    return cv;
  }

  function upgradeShadow(game) {
    if (!OPT.shadow) return;
    var T = window.__ROYAL_THREE__; if (!T || !game.scene) return;
    var sun = null;
    game.scene.traverse(function (o) {
      if (!sun && o.isDirectionalLight && o.castShadow) sun = o;
    });
    if (!sun || !sun.shadow) return;

    var r = Math.max(6, OPT.shadowRange == null ? 34 : OPT.shadowRange);
    var cam = sun.shadow.camera;
    SHDW = {
      sun: sun,
      off: new T.V3().copy(sun.position),
      r: r
    };
    if (sun.target) SHDW.off.sub(sun.target.position);
    /* المحرّك نفسه يُلحق الشمس باللاعب كلّ إطار (updSun)، فلا نحرّكها
       نحن ولا نلمس المستويين الأمامي والخلفي — تضييقهما على مقاس بُعدٍ
       قديم يُسقط المشهد كلّه خارج المجال فيختفي الظلّ تماماً. يكفي أن
       نُضيّق اتّساع الصندوق وحده: هنا تولد الدقّة. */
    cam.left = -r; cam.right = r; cam.top = r; cam.bottom = -r;
    cam.updateProjectionMatrix();
    /* التحيّز القديم (0.55) كان مُقاساً لخريطة خشنة — يُطيّر الظلّ الآن */
    sun.shadow.bias = OPT.shadowBias == null ? -0.0004 : OPT.shadowBias;
    sun.shadow.normalBias = OPT.shadowNormal == null ? 0.03 : OPT.shadowNormal;
    var ms = OPT.shadowMap == null ? 2048 : OPT.shadowMap;
    if (sun.shadow.mapSize.width !== ms) {
      sun.shadow.mapSize.set(ms, ms);
      if (sun.shadow.map) { try { sun.shadow.map.dispose(); } catch (e) { } sun.shadow.map = null; }
    }

    /* كلّ ما على الشخصيّة يرمي ظلّاً: الجسم والذراعان والحذاءان والسلاح */
    castAll(game.player);
    if (game.handGun) castAll(game.handGun);
    if (game.bots) for (var i = 0; i < game.bots.length; i++) castAll(game.bots[i].ch);
    followShadow(game);
  }

  function castAll(ch) {
    if (!ch) return;
    var root = ch.group || ch;
    try {
      root.traverse(function (o) {
        if (!o.isMesh) return;
        /* ألواح الظلّ نفسها لا ترمي ظلّاً وإلّا رسمت مربّعاً أسود */
        if (o === ch.blob || o === ch.__sun) return;
        var m = o.material;
        if (m && m.transparent && m.depthWrite === false) return;
        o.castShadow = true;
      });
    } catch (e) { }
  }
  window.__ROYAL_CASTALL__ = castAll;

  /* يُستدعى كلّ إطار: الظلّ المرسوم فقط — أمّا إلحاق الشمس باللاعب
     فالمحرّك يتكفّل به */
  function followShadow(game) {
    sunShadows(game);
  }

  /* ظلّ التماسّ: القرص الذي تحت الشخصيّة — نجعله أنعم وألصق بالأرض */
  var BLOBTEX = null;
  function upgradeBlob(ch) {
    if (!ch || !ch.blob || ch.blob.__up) return;
    var T = window.__ROYAL_THREE__; if (!T) return;
    var b = ch.blob;
    try {
      var TexClass = b.material.map && b.material.map.constructor;
      if (TexClass) {
        if (!BLOBTEX) {
          BLOBTEX = new TexClass(shadowTex());
          BLOBTEX.needsUpdate = true;
        }
        var old = b.material.map;
        b.material.map = BLOBTEX;
        if (old && old !== BLOBTEX) try { old.dispose(); } catch (e) { }
      }
    } catch (e) { }
    b.material.color && b.material.color.setHex(0xffffff);
    b.material.depthWrite = false;
    b.material.transparent = true;
    b.material.polygonOffset = true;
    b.material.polygonOffsetFactor = -2;
    b.material.polygonOffsetUnits = -2;
    b.material.needsUpdate = true;
    b.renderOrder = 3;
    b.__up = true;
  }

  /* ------------------------------------------------------------------
     ظلّ الشمس المُسقَط
     ------------------------------------------------------------------
     خريطة الظلّ تُطفَأ كلّياً على إعداد الجودة «منخفض» (وهو حال أغلب
     الهواتف)، فلا يبقى للاعب ظلّ إطلاقاً. لذلك نرسم له ظلّاً هندسيّاً:
     بيضة ناعمة تمتدّ في اتّجاه الظلّ الحقيقي وبطول يُحسب من ارتفاع
     الشمس — تتبع الأرض تحته، وتنكمش حين ينخفض، وتبهت حين يقفز. تكلفتها
     مضلّعان فقط، فتعمل على كلّ جهاز.
     ------------------------------------------------------------------ */
  var SUNTEX = null, SUNDIR = null;

  /* اتّجاه الشمس الحقيقي وقت اللعب: يُقرأ من الضوء نفسه بعد أن يُلحقه
     المحرّك باللاعب، لا من موضعه الأوّل قبل بدء المباراة */
  function sunDir(game) {
    if (SUNDIR) return SUNDIR;
    var v = null;
    var s = SHDW && SHDW.sun;
    if (!s) { try { game.scene.traverse(function (o) { if (!s && o.isDirectionalLight) s = o; }); } catch (e) { } }
    if (s) {
      v = { x: s.position.x, y: s.position.y, z: s.position.z };
      if (s.target) { v.x -= s.target.position.x; v.y -= s.target.position.y; v.z -= s.target.position.z; }
      if (!v.x && !v.y && !v.z) v = null;
    }
    if (!v || (!v.x && !v.z)) return { x: 0.4, y: 0.866, z: 0.3, h: 0.5 };
    var L = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
    SUNDIR = { x: v.x / L, y: Math.max(0.15, v.y / L), z: v.z / L };
    SUNDIR.h = Math.sqrt(SUNDIR.x * SUNDIR.x + SUNDIR.z * SUNDIR.z) || 1e-4;
    return SUNDIR;
  }

  function buildSunShadow(ch) {
    if (!ch || ch.__sun || !ch.blob) return;
    var T = window.__ROYAL_THREE__; if (!T) return;
    var PlaneG = ch.blob.geometry && ch.blob.geometry.constructor;
    var TexC = ch.blob.material && ch.blob.material.map && ch.blob.material.map.constructor;
    if (!PlaneG || !TexC) return;
    if (!SUNTEX) { SUNTEX = new TexC(shadowTex()); SUNTEX.needsUpdate = true; }
    var m = new T.Mesh(new PlaneG(1, 1), new T.Basic({
      map: SUNTEX, color: 0xffffff, transparent: true, depthWrite: false
    }));
    m.material.polygonOffset = true;
    m.material.polygonOffsetFactor = -3;
    m.material.polygonOffsetUnits = -3;
    m.rotation.order = "YXZ";
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = 2;
    m.frustumCulled = false;
    ch.group.add(m);
    ch.__sun = m;
  }

  function poseSunShadow(game, ch) {
    var m = ch && ch.__sun; if (!m || !ch.blob) return;
    var d = sunDir(game);
    var st = ch.st || {};
    var H = ch.totalH * (1 - 0.34 * (st.crouch || 0));
    /* طول الظلّ = الارتفاع ÷ ظلّ زاوية الشمس، مع حدّ حتى لا يمتدّ بلا نهاية */
    var stretch = Math.min(ch.R * 9, H * d.h / d.y);
    var w = ch.R * 2.35;
    m.rotation.y = Math.atan2(d.x, d.z);
    m.scale.set(w, w + stretch, 1);
    m.position.set(-d.x / d.h * stretch * 0.5, ch.blob.position.y + 0.008, -d.z / d.h * stretch * 0.5);
    m.material.opacity = ch.blob.material.opacity * (OPT.sunShadowAlpha == null ? 0.9 : OPT.sunShadowAlpha);
    m.visible = ch.blob.visible && ch.group.visible;
  }

  function sunShadows(game) {
    if (!OPT.shadow || !game) return;
    if (game.player) { buildSunShadow(game.player); poseSunShadow(game, game.player); }
    if (OPT.botLimbs && game.bots) {
      for (var i = 0; i < game.bots.length; i++) {
        var ch = game.bots[i] && game.bots[i].ch;
        if (!ch || !ch.group || !ch.group.visible) continue;
        buildSunShadow(ch); poseSunShadow(game, ch);
      }
    }
  }

  function upgradeBlobs(game) {
    if (!OPT.shadow) return;
    upgradeBlob(game.player);
    if (game.bots) for (var i = 0; i < game.bots.length; i++) upgradeBlob(game.bots[i].ch);
  }
