  /* ============================================================
     6.43) الزون: جدار عاصفة + برق ورعد
     ------------------------------------------------------------
     جدار الزون كان خطوطاً زرقاء هادئة، والخروج منه لا يُحسّ إلّا برقم
     الصحّة ينزل. الآن: الجدار عاصفة بَنَفسجيّة تتلوّى فيها ومضات، وما
     إن تخرج من الزون حتى تُظلم الدنيا وينزل المطر ويلمع البرق ويأتي
     الرعد بعده بمقدار بُعدك عن الأمان — وكلّما تأخّرت اشتدّت العاصفة.
     ============================================================ */
  var ZFX = {
    storm: 0, t: 0, next: 2, el: null, bolt: null, boltT: 0,
    css: false, wall: null, audio: null
  };

  function zoneCss() {
    if (ZFX.css) return;
    ZFX.css = true;
    var s = document.createElement("style");
    s.id = "royal-zone-css";
    s.textContent =
      "#rzone-fx{position:fixed;inset:0;pointer-events:none;z-index:14;opacity:0;" +
      "transition:opacity .35s linear;overflow:hidden}" +
      "#rzone-fx>i{position:absolute;display:block}" +
      /* بَنَفسج يغمر الشاشة كأنّها نهاية العالم، وأثقل عند الأطراف */
      "#rzone-fx .tint{inset:0;background:rgba(96,26,196,.30);mix-blend-mode:screen}" +
      "#rzone-fx .vig{inset:0;background:radial-gradient(ellipse at 50% 48%," +
      "rgba(88,20,180,.20) 18%,rgba(74,10,150,.52) 66%,rgba(26,2,54,.90) 100%)}" +
      "#rzone-fx .rain{inset:-25%;opacity:.55;" +
      "background:repeating-linear-gradient(101deg,rgba(198,214,255,.20) 0 1.5px,transparent 1.5px 9px);" +
      "animation:rzrain .55s linear infinite}" +
      "#rzone-fx .rain.b{opacity:.3;animation-duration:.34s;" +
      "background:repeating-linear-gradient(98deg,rgba(230,238,255,.16) 0 1px,transparent 1px 14px)}" +
      "@keyframes rzrain{from{transform:translate3d(3%,-14%,0)}to{transform:translate3d(-3%,14%,0)}}" +
      "#rzone-fx .bolt{inset:0;opacity:0;" +
      "background:linear-gradient(180deg,rgba(232,214,255,.95),rgba(176,96,255,.42) 46%,transparent 78%)}" +
      "#rzone-fx .bolt.on{animation:rzbolt .46s ease-out}" +
      "@keyframes rzbolt{0%{opacity:0}5%{opacity:.9}11%{opacity:.12}19%{opacity:.72}" +
      "30%{opacity:.06}44%{opacity:.28}100%{opacity:0}}";
    document.head.appendChild(s);
  }

  function zoneLayer() {
    if (ZFX.el && ZFX.el.parentNode) return ZFX.el;
    zoneCss();
    var n = el("div", { id: "rzone-fx" }, [
      el("i", { class: "tint" }),
      el("i", { class: "vig" }),
      el("i", { class: "rain" }),
      el("i", { class: "rain b" }),
      el("i", { class: "bolt" })
    ]);
    document.body.appendChild(n);
    ZFX.el = n;
    ZFX.bolt = n.querySelector(".bolt");
    return n;
  }

  /* ---- الرعد: ضجيج مُرشَّح ينزل تردّده ببطء + دمدمة عميقة ---- */
  function zoneAudio() {
    if (ZFX.audio !== null) return ZFX.audio;
    var A = window.__ROYAL_AUDIO__;
    var ctx = null;
    try { ctx = A && A.init ? A.init() : null; } catch (e) { }
    if (!ctx) { ZFX.audio = false; return false; }
    var out = null;
    try { out = A.sfx ? A.sfx() : null; } catch (e) { }
    var buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    ZFX.audio = { ctx: ctx, out: out || ctx.destination, noise: buf };
    return ZFX.audio;
  }

  function thunder(power) {
    var a = zoneAudio(); if (!a) return;
    var ctx = a.ctx;
    if (ctx.state === "suspended") { try { ctx.resume(); } catch (e) { } }
    var t0 = ctx.currentTime;
    var life = 1.6 + power * 2.2;
    var src = ctx.createBufferSource();
    src.buffer = a.noise; src.loop = true;
    var lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(900 + power * 700, t0);
    lp.frequency.exponentialRampToValueAtTime(90, t0 + life);
    lp.Q.value = 0.6;
    var hp = ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 32;
    var g = ctx.createGain();
    var peak = 0.11 + power * 0.3;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.035);
    /* قصفتان ثم دمدمة تنسحب */
    g.gain.exponentialRampToValueAtTime(peak * 0.34, t0 + 0.28);
    g.gain.exponentialRampToValueAtTime(peak * 0.62, t0 + 0.44);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + life);
    src.connect(lp); lp.connect(hp); hp.connect(g); g.connect(a.out);
    src.start(t0); src.stop(t0 + life + 0.05);
    /* دمدمة عميقة تحت الضجيج */
    var o = ctx.createOscillator(), og = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(58, t0);
    o.frequency.exponentialRampToValueAtTime(28, t0 + life * 0.8);
    og.gain.setValueAtTime(0.0001, t0);
    og.gain.exponentialRampToValueAtTime(0.08 + power * 0.12, t0 + 0.06);
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + life * 0.85);
    o.connect(og); og.connect(a.out);
    o.start(t0); o.stop(t0 + life);
  }

  /* ------------------------------------------------------------------
     صاعقة حقيقية تضرب الأرض أمامك
     ------------------------------------------------------------------
     خطّ متعرّج من السماء إلى نقطة على الأرض قريبة منك، حوله هالة أوسع،
     وعند نقطة الاصطدام كرة ضوء وحلقة تتّسع ثمّ تخبو. نُبقي ثلاثاً في
     مخزنٍ ونُعيد استعمالها فلا نُخصّص شيئاً أثناء اللعب.
     ------------------------------------------------------------------ */
  var BOLT = { pool: [], live: [], segs: 9 };

  function newBolt(game) {
    var T = window.__ROYAL_THREE__; if (!T) return null;
    var g = new T.Group();
    var core = [], halo = [];
    var matCore = new T.Basic({ color: 0xf1e6ff, transparent: true, opacity: 1, depthWrite: false });
    var matHalo = new T.Basic({ color: 0xb06cff, transparent: true, opacity: 0.42, depthWrite: false });
    for (var i = 0; i < BOLT.segs; i++) {
      var c = new T.Mesh(new T.Box(0.34, 1, 0.34), matCore);
      var h = new T.Mesh(new T.Box(1.05, 1, 1.05), matHalo);
      c.frustumCulled = h.frustumCulled = false;
      g.add(c); g.add(h);
      core.push(c); halo.push(h);
    }
    var hit = new T.Mesh(new T.Sph(1, 10, 8), matHalo.clone());
    hit.frustumCulled = false;
    g.add(hit);
    g.renderOrder = 6;
    game.scene.add(g);
    return { g: g, core: core, halo: halo, hit: hit, matCore: matCore, matHalo: matHalo, t: 0, life: 1 };
  }

  function strike(game, power) {
    if (OPT.zoneBolts === false) return;
    var T = window.__ROYAL_THREE__; if (!T || !game.pos) return;
    var b = BOLT.pool.pop();
    if (!b) { b = newBolt(game); if (!b) return; }
    /* نقطة الضرب: أمامك غالباً حتى تراها، على مسافة يشعر بها اللاعب */
    var yaw = (typeof game.yaw === "number" ? game.yaw : 0) + (Math.random() - 0.5) * 2.1;
    var dist = 9 + Math.random() * 22;
    var hx = game.pos.x - Math.sin(yaw) * dist + (Math.random() - 0.5) * 6;
    var hz = game.pos.z - Math.cos(yaw) * dist + (Math.random() - 0.5) * 6;
    var hy = game.pos.y;
    try { hy = game.groundY(hx, hz, 1e5); } catch (e) { }

    var top = hy + 42 + Math.random() * 26;
    var t = ltmp();
    var n = BOLT.segs;
    var px = hx + (Math.random() - 0.5) * 9, pz = hz + (Math.random() - 0.5) * 9, py = top;
    for (var i = 0; i < n; i++) {
      var f = (i + 1) / n;
      /* كلّما اقتربنا من الأرض ضاق التعرّج حتى ينطبق على نقطة الضرب */
      var spread = (1 - f) * 3.4;
      var nx = hx + (px - hx) * (1 - f) + (Math.random() - 0.5) * spread;
      var nz = hz + (pz - hz) * (1 - f) + (Math.random() - 0.5) * spread;
      var ny = top + (hy - top) * f;
      t.a.set(px, py, pz); t.b.set(nx, ny, nz);
      placeBone(b.core[i], t.a, t.b);
      placeBone(b.halo[i], t.a, t.b);
      px = nx; py = ny; pz = nz;
    }
    b.hit.position.set(hx, hy + 0.4, hz);
    b.t = 0;
    b.life = 0.5 + Math.random() * 0.2;
    b.power = power;
    b.g.visible = true;
    BOLT.live.push(b);
    ZFX.boltT = Math.max(ZFX.boltT, 0.55);
  }

  function updBolts(dt) {
    for (var i = BOLT.live.length - 1; i >= 0; i--) {
      var b = BOLT.live[i];
      b.t += dt;
      var p = b.t / b.life;
      if (p >= 1) {
        b.g.visible = false;
        BOLT.live.splice(i, 1);
        if (BOLT.pool.length < 3) BOLT.pool.push(b);
        continue;
      }
      /* وميض متقطّع ثمّ خبو */
      var flick = p < 0.55 ? (0.55 + 0.45 * Math.sin(b.t * 90)) : 0;
      var fade = Math.max(0, 1 - Math.max(0, (p - 0.35)) / 0.65);
      b.matCore.opacity = Math.min(1, flick * fade + fade * 0.25);
      b.matHalo.opacity = 0.4 * fade;
      var s = 1 + p * 9;
      b.hit.scale.setScalar(s);
      b.hit.material.opacity = 0.5 * (1 - p) * (1 - p);
    }
  }

  function lightning(game, power) {
    if (ZFX.bolt) {
      ZFX.bolt.classList.remove("on");
      void ZFX.bolt.offsetWidth;          /* أعِد تشغيل الحركة */
      ZFX.bolt.classList.add("on");
    }
    /* وميض على جدار الزون نفسه */
    ZFX.boltT = 0.5;
    /* صاعقة تضرب الأرض قربك — قريبة فرعدها يأتي سريعاً */
    var near = Math.random() < 0.72;
    if (near) try { strike(game, power); } catch (e) { rerr("strike", e); }
    var delay = near ? 60 + Math.random() * 140 : 260 + (1 - power) * 900;
    setTimeout(function () { try { thunder(near ? Math.min(1, power + 0.25) : power); } catch (e) { } }, delay);
  }

  /* ---- جدار الزون: عاصفة بدل الخطوط الهادئة ---- */
  function upgradeZoneWall(game) {
    if (OPT.zoneStorm === false) return;
    var m = game && game.zoneMesh && game.zoneMesh.material;
    if (!m || !m.uniforms || m.__storm) return;
    m.uniforms.uS = { value: 0 };
    m.vertexShader =
      "varying vec2 vUv; varying vec3 vW;\n" +
      "void main(){ vUv=uv; vec4 wp=modelMatrix*vec4(position,1.0); vW=wp.xyz;\n" +
      "  gl_Position=projectionMatrix*viewMatrix*wp; }";
    m.fragmentShader = [
      "uniform float t; uniform vec3 c; uniform float uS; varying vec2 vUv; varying vec3 vW;",
      "float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }",
      "float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);",
      "  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }",
      "void main(){",
      "  float fade = smoothstep(1.0,.10,vUv.y);",
      /* أعمدة طاقة تتلوّى بدل خطوط مستقيمة */
      "  float wob = n(vec2(vUv.x*38.0, t*0.35))*0.55;",
      "  float bars = smoothstep(.80,1.0,abs(sin(vUv.x*150.0 + wob*7.0 + t*0.7)));",
      "  float rise = smoothstep(.86,1.0,abs(sin(vUv.y*9.0 - t*1.7 + wob*3.0)));",
      /* ومضات تجري أفقياً على الجدار */
      "  float arc = smoothstep(.965,1.0, n(vec2(vUv.x*26.0 - t*1.2, vUv.y*3.0 + t*0.5)));",
      "  float base = smoothstep(.16,.0,vUv.y);",     /* خطّ ساطع عند الأرض */
      "  float a = (bars*.5 + rise*.34 + arc*.9 + base*.5 + .10) * fade;",
      /* كلّما اشتدّت العاصفة مال اللون إلى الحُمرة وزاد لمعانه */
      "  vec3 hot = mix(c, vec3(1.0,0.24,0.42), 0.55);",
      "  vec3 col = mix(c, hot, clamp(uS,0.0,1.0));",
      "  col *= 1.0 + rise*1.6 + arc*2.4 + uS*0.9;",
      "  gl_FragColor = vec4(col, a*(0.60 + uS*0.32));",
      "}"
    ].join("\n");
    m.needsUpdate = true;
    m.__storm = true;
    ZFX.wall = m;
  }

  /* ---- كلّ إطار: شدّة العاصفة وجدولة البرق ---- */
  function zoneStormFrame(game, dt) {
    if (OPT.zoneStorm === false || !game) return;
    if (!ZFX.wall) { try { upgradeZoneWall(game); } catch (e) { } }
    if (BOLT.live.length) updBolts(dt);
    var out = !!game.outZone && game.phase === "ground";
    var want = 0;
    if (out) {
      var z = game.zone, far = 0;
      try { far = Math.hypot(game.pos.x - z.cx, game.pos.z - z.cz) - z.r; } catch (e) { }
      want = Math.min(1, 0.42 + Math.max(0, far) / 110);
    }
    var sp = out ? 1.7 : 0.75;
    ZFX.storm += (want - ZFX.storm) * (1 - Math.exp(-sp * Math.min(dt, 0.2)));
    if (ZFX.storm < 0.004) ZFX.storm = 0;

    if (ZFX.boltT > 0) ZFX.boltT = Math.max(0, ZFX.boltT - dt);
    if (ZFX.wall && ZFX.wall.uniforms.uS) {
      ZFX.wall.uniforms.uS.value = Math.min(1, ZFX.storm + ZFX.boltT * 1.6);
    }

    if (ZFX.storm <= 0) {
      if (ZFX.el) ZFX.el.style.opacity = "0";
      ZFX.t = 0; ZFX.next = 1.2;
      return;
    }
    var lay = zoneLayer();
    lay.style.opacity = (Math.min(1, ZFX.storm) * (OPT.zoneStormAlpha == null ? 0.92 : OPT.zoneStormAlpha)).toFixed(3);

    if (!out) return;                       /* البرق لا ينزل إلّا وأنت فيها */
    ZFX.t += dt;
    if (ZFX.t >= ZFX.next) {
      ZFX.t = 0;
      ZFX.next = 1.6 + Math.random() * 4.5 * (1.2 - ZFX.storm * 0.7);
      try { lightning(game, Math.min(1, 0.35 + ZFX.storm * 0.65)); } catch (e) { }
    }
  }

  function zoneStormStop() {
    ZFX.storm = 0; ZFX.boltT = 0;
    if (ZFX.el) ZFX.el.style.opacity = "0";
    /* المشهد يُبنى من جديد كلّ مباراة: لا نُبقي صواعق مباراة سابقة */
    BOLT.pool.length = 0; BOLT.live.length = 0;
  }
