  /* ============================================================
     6.45) لوحة الفريق: كم بقي من دم كلّ رفيق
     ------------------------------------------------------------
     رفاقك — سواء كانوا بوتات فريقك أو أصدقاءك في الأونلاين — لم يكن
     يظهر منهم شيء. الآن شريطٌ لكلّ واحد باسمه ودمه، يخضرّ ثمّ يصفرّ
     ثمّ يحمرّ، ويُشطب اسمه إذا سقط. صحّة الأصدقاء الحقيقيّين تصل عبر
     نفس قناة الأحداث: نُرسل نبضة كلّ نصف ثانية ونقرأ نبضاتهم.
     ============================================================ */
  var SQ = { css: false, el: null, cfg: null, rows: {}, t: 0, hp: {}, sendT: 0 };

  function squadCss() {
    if (SQ.css) return;
    SQ.css = true;
    var s = document.createElement("style");
    s.id = "royal-squad-css";
    s.textContent =
      /* اللوحة تسكن خانةً من خانات العدّادات، فيُرتّبها المحرّك مع
         إخوتها: تسحبها وتُكبّرها وتُخفيها من تبويب «العدّادات» */
      "#hud .hud-stat.rsquad,#rs-stage .hud-stat.rsquad{background:none;border:0;" +
      "padding:0;box-shadow:none;text-shadow:0 2px 0 rgba(0,0,0,.5)}" +
      ".rsquad{display:flex;flex-direction:column;gap:5px;align-items:stretch;" +
      "pointer-events:none;direction:rtl;font-weight:900;white-space:nowrap}" +
      ".rsquad .sq{display:flex;align-items:center;gap:6px;padding:4px 8px;border-radius:10px;" +
      "background:linear-gradient(180deg,rgba(10,6,32,.86),rgba(10,6,32,.6));" +
      "border:1.5px solid rgba(255,255,255,.2);box-shadow:0 3px 9px rgba(0,0,0,.45)}" +
      ".rsquad .sq.dead{opacity:.45}" +
      ".rsquad .sq .dot{width:9px;height:9px;border-radius:50%;background:#39e07b;flex:0 0 auto}" +
      ".rsquad .sq.dead .dot{background:#8b7fc0}" +
      ".rsquad .sq .nm{font-size:11.5px;max-width:78px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      ".rsquad .sq.dead .nm{text-decoration:line-through}" +
      ".rsquad .sq .bar{position:relative;width:64px;height:9px;border-radius:5px;overflow:hidden;" +
      "background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.16)}" +
      ".rsquad .sq .bar i{position:absolute;inset:0;width:100%;transform-origin:right center;" +
      "background:linear-gradient(180deg,#5cff8d,#12a84a);transition:transform .18s linear,background .18s linear}" +
      /* الأصدقاء بالأزرق حتى تُميّزهم عن دمّك بلمحة، ولا يحمرّ إلّا من
         أشرف على الموت فيبقى الخطر مقروءاً */
      ".rsquad .sq.mate .dot{background:#25d3ff}" +
      ".rsquad .sq.mate .hp{color:#7fe4ff}" +
      ".rsquad .sq.me .nm{color:#ffc21a}" +
      ".rsquad .sq .hp{font-size:11px;color:var(--acc);direction:ltr;min-width:3ch;text-align:center}";
    document.head.appendChild(s);
  }

  /* نتبنّى الخانة التي بناها المحرّك لنا: هو يضع مكانها وحجمها من
     إعدادك، ونحن نملأها بالصفوف */
  function squadHost(game) {
    if (SQ.el && SQ.el.parentNode) return SQ.el;
    squadCss();
    var st = game.hud && game.hud.stats && game.hud.stats.squad;
    if (st && st.node) {
      SQ.el = st.node;
      SQ.el.innerHTML = "";
      SQ.el.classList.add("rsquad");
      SQ.cfg = st.cfg || null;
      return SQ.el;
    }
    /* لو لم تكن الخانة موجودة (إعداد قديم) نضعها في زاويةٍ ولا نُعطّل شيئاً */
    SQ.el = el("div", { class: "rsquad", style: "position:absolute;left:12px;top:12px;z-index:9" });
    (game.hud && game.hud.node ? game.hud.node : document.body).appendChild(SQ.el);
    return SQ.el;
  }

  /* اللوحة للفريق وحده: أونلاين، وفي وضعٍ فيه رفاق (ثنائي أو رباعي).
     صفوفها بعدد الفريق: أنت أوّلاً ثم من معك — فالرباعي أربعة صفوف
     (أنت وثلاثة)، والثنائي صفّان (أنت وصديق واحد). وفي الفردي لا شيء. */
  function squadMembers(game) {
    var out = [];
    if (!game.net) return out;
    var team = game.teamSize || 1;
    if (team < 2) return out;

    out.push({
      id: "__me", name: "أنت",
      hp: Math.max(0, Math.round((game.stats && game.stats.hp) || 0)),
      alive: !game.stats || game.stats.hp > 0, me: true
    });

    /* الأصدقاء الحقيقيّون أوّلاً */
    if (game.remote) {
      game.remote.forEach(function (r) {
        if (!r || out.length >= team) return;
        var h = SQ.hp[r.id];
        out.push({
          id: r.id, name: r.name || "صديق",
          hp: r.alive === false ? 0 : (h == null ? 100 : h),
          alive: r.alive !== false
        });
      });
    }
    /* ثمّ بوتات فريقك تُكمل الخانات الباقية — هم فريقك أيضاً */
    if (game.bots) {
      for (var i = 0; i < game.bots.length && out.length < team; i++) {
        var b = game.bots[i];
        if (!b || !b.ally) continue;
        out.push({ id: b.id, name: b.name, hp: Math.max(0, b.hp || 0), alive: !!b.alive });
      }
    }
    return out;
  }

  function squadFrame(game, dt) {
    if (OPT.squadHp === false || !game || game.phase !== "ground") {
      if (SQ.el) SQ.el.style.display = "none";
      return;
    }
    /* أرسل دمّك لرفاقك */
    SQ.sendT -= dt;
    if (SQ.sendT <= 0) {
      SQ.sendT = 0.5;
      try {
        if (game.net && game.net.sendEvent) {
          game.net.sendEvent({ k: "hp", v: Math.max(0, Math.round(game.stats.hp)) });
        }
      } catch (e) { }
    }
    SQ.t -= dt;
    if (SQ.t > 0) return;
    SQ.t = 0.2;

    var list = squadMembers(game);
    var host = squadHost(game);
    var vis = !SQ.cfg || SQ.cfg.visible !== false;
    host.style.display = (list.length && vis) ? "flex" : "none";
    if (!list.length || !vis) return;

    var seen = {};
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      seen[m.id] = 1;
      var row = SQ.rows[m.id];
      if (!row) {
        var bar = el("div", { class: "bar" }, [el("i")]);
        row = el("div", { class: "sq" }, [
          el("span", { class: "dot" }),
          el("span", { class: "nm", text: m.name }),
          bar,
          el("span", { class: "hp", text: "100" })
        ]);
        host.appendChild(row);
        SQ.rows[m.id] = row;
      }
      row.classList.toggle("me", !!m.me);
      row.classList.toggle("mate", !m.me);
      var k = Math.max(0, Math.min(1, m.hp / 100));
      var fill = row.querySelector("i");
      fill.style.transform = "scaleX(" + k.toFixed(3) + ")";
      if (m.me) {
        fill.style.background = k > 0.55
          ? "linear-gradient(180deg,#5cff8d,#12a84a)"
          : (k > 0.25 ? "linear-gradient(180deg,#ffd35c,#c98800)"
            : "linear-gradient(180deg,#ff6b7b,#b8202f)");
      } else {
        /* أزرق للصديق، ولا يحمرّ إلّا على شفا الموت */
        fill.style.background = k > 0.25
          ? "linear-gradient(180deg,#7fe4ff,#0e88b8)"
          : "linear-gradient(180deg,#ff6b7b,#b8202f)";
      }
      row.querySelector(".hp").textContent = m.alive ? Math.round(m.hp) : "☠";
      row.classList.toggle("dead", !m.alive);
    }
    for (var id in SQ.rows) {
      if (!seen[id]) { SQ.rows[id].remove(); delete SQ.rows[id]; }
    }
  }

  /* نلتقط نبضات الصحّة من الشبكة دون أن نمسّ بقيّة الأحداث */
  function hookNetEvents(game) {
    if (!game || !game.net || game.__hpHook) return;
    game.__hpHook = true;
    var orig = game.netEvent ? game.netEvent.bind(game) : null;
    game.netEvent = function (id, e) {
      try { if (e && e.k === "hp") SQ.hp[id] = +e.v || 0; } catch (er) { }
      if (orig) return orig(id, e);
    };
  }

  /* تسجيل الخانة قبل أن يبني المحرّك واجهته */
  function registerSquadStat(P) {
    if (OPT.squadHp === false) return;
    var D = window.__ROYAL_STATDEFS__;
    if (D && !D.squad) D.squad = { label: "دم الرفاق", emo: "\u2764\uFE0F" };
    if (!P || !P.controls || !Array.isArray(P.controls.stats)) return;
    for (var i = 0; i < P.controls.stats.length; i++) {
      if (P.controls.stats[i] && P.controls.stats[i].id === "squad") return;
    }
    P.controls.stats.push({
      id: "squad", x: 0.075, y: 0.54, size: 1, visible: true,
      emoji: "\u2764\uFE0F", icon: null
    });
  }

  function squadReset() {
    SQ.hp = {};
    for (var id in SQ.rows) { try { SQ.rows[id].remove(); } catch (e) { } }
    SQ.rows = {};
    /* الخانة يملكها المحرّك الآن: نُفرغها ولا نحذفها */
    if (SQ.el) { try { SQ.el.innerHTML = ""; } catch (e) { } }
    SQ.el = null; SQ.cfg = null;
  }
