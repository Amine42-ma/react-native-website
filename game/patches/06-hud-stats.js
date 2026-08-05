  /* ============================================================
     6.39.8) عدّادات اللعب: الأيقونة وحدها والرقم وحده
     ------------------------------------------------------------
     كانت خانة العدّاد صندوقاً واحداً فيه رمز ورقم معاً، والمحرّك يقرأ
     الرمز فقط ويتجاهل الصورة التي ترفعها من تبويب «العدّادات». الآن:
     الأيقونة في قرصها الخاصّ — رمزاً كانت أو صورة من جهازك — والرقم
     في خانته وحده أمامها، فتُبدّل أيقونة الجمجمة أو «كم باقي» بما شئت
     والرقم يبقى كما هو يتغيّر مع اللعب.
     ============================================================ */
  var STAT_CSS = false;
  function injectStatCss() {
    if (STAT_CSS) return;
    STAT_CSS = true;
    var css = document.createElement("style");
    css.id = "royal-stat-css";
    css.textContent =
      /* الحاوية تصير شفّافة: كلّ قطعة تحمل خلفيّتها بنفسها */
      ".hud-stat.rstat{background:none;border:0;padding:0;gap:6px}" +
      ".hud-stat.rstat .e{display:grid;place-items:center;width:1.85em;height:1.85em;" +
      "border-radius:50%;font-size:16px;line-height:1;overflow:hidden;" +
      "background:linear-gradient(180deg,rgba(14,8,40,.94),rgba(8,4,26,.82));" +
      "border:1.5px solid rgba(255,255,255,.26);box-shadow:0 3px 9px rgba(0,0,0,.5)}" +
      ".hud-stat.rstat .e img{width:100%;height:100%;object-fit:cover;display:block}" +
      ".hud-stat.rstat .v{min-width:2.1ch;padding:3px 9px;border-radius:10px;" +
      "background:linear-gradient(180deg,rgba(10,6,32,.9),rgba(10,6,32,.66));" +
      "border:1.5px solid rgba(255,255,255,.22);box-shadow:0 3px 9px rgba(0,0,0,.5)}";
    document.head.appendChild(css);
  }

  function statIconNode(game, cfg) {
    var src = null;
    if (cfg && cfg.icon) {
      src = isUrl(cfg.icon)
        ? cfg.icon
        : (game && game.assetURL ? game.assetURL(cfg.icon) : null);
    }
    if (src) return el("img", { src: src, alt: "" });
    return document.createTextNode((cfg && cfg.emoji) || "•");
  }

  function paintStat(game, s) {
    var cfg = s.cfg || {};
    var ico = s.node.querySelector(".e");
    if (!ico) return;
    ico.innerHTML = "";
    ico.appendChild(statIconNode(game, cfg));
    ico.style.fontSize = (16 * (OPT.statIconSize || 1)) + "px";
    s.node.__ico = (cfg.icon || "") + "|" + (cfg.emoji || "");
  }

  function upgradeStats(game) {
    if (!OPT.statSplit) return;
    var hud = game && game.hud;
    if (!hud || !hud.stats) return;
    injectStatCss();
    for (var id in hud.stats) {
      var s = hud.stats[id];
      if (!s || !s.node || id === "hp" || id === "minimap") continue;
      s.node.classList.add("rstat");
      paintStat(game, s);
      s.icon = s.node.querySelector(".e");
    }
  }

  /* لو بدّلت الأيقونة من لوحة الإعداد وأنت داخل المباراة: تتحدّث فوراً */
  var STAT_T = 0;
  function syncStats(game, dt) {
    if (!OPT.statSplit) return;
    STAT_T -= dt;
    if (STAT_T > 0) return;
    STAT_T = 0.4;
    var hud = game && game.hud;
    if (!hud || !hud.stats) return;
    for (var id in hud.stats) {
      var s = hud.stats[id];
      if (!s || !s.node || id === "hp" || id === "minimap") continue;
      var cfg = s.cfg || {};
      var key = (cfg.icon || "") + "|" + (cfg.emoji || "");
      if (s.node.__ico !== key) { s.node.classList.add("rstat"); paintStat(game, s); }
    }
  }
