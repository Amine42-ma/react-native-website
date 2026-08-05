  /* ============================================================
     6.51) أيقونة بلا إطار في الواجهة والقائمة
     ------------------------------------------------------------
     أزرار الواجهة تُرسم داخل بلاطة: تدرّج لونيّ وحدّ أبيض وظلّ سميك
     تحتها. فإذا وضعتَ أيقونتك صارت محبوسةً داخل تلك الدائرة/البلاطة
     ولا تُرى وحدها. الآن: ما إن تضع أيقونة حتى يختفي الإطار والخلفيّة
     والاسم فلا يبقى إلّا أيقونتك تملأ المكان — بلا أن نمسّ مكان أيّ
     زرّ ولا حجمه ولا ترتيبه. من لم تضع له أيقونة يبقى كما هو تماماً.
     ============================================================ */
  var BARE_CSS = false;
  function bareCss() {
    if (BARE_CSS) return;
    BARE_CSS = true;
    var s = document.createElement("style");
    s.id = "royal-bare-css";
    s.textContent =
      /* أزرار الواجهة */
      "#lobby .lb-el.rs-bare .bs-tile{background:none!important;border:0!important;" +
      "box-shadow:none!important;overflow:visible}" +
      "#lobby .lb-el.rs-bare .bs-tile .lbl{display:none!important}" +
      "#lobby .lb-el.rs-bare .bs-tile .ico{width:100%;height:100%}" +
      "#lobby .lb-el.rs-bare .bs-tile .ico img{width:100%;height:100%;object-fit:contain;" +
      "filter:drop-shadow(0 3px 7px rgba(0,0,0,.5))}" +
      /* صور الأبطال داخل القائمة */
      ".hero-th.rs-bare{background:none!important}" +
      ".hero-th.rs-bare img{filter:drop-shadow(0 3px 7px rgba(0,0,0,.45))}" +
      /* معاينة الواجهة داخل لوحة الإعداد: لتُريك ما سيراه اللاعب */
      "#rs-lbpv .lbb.rs-bare{background:none!important;border:0!important;box-shadow:none!important}" +
      "#rs-lbpv .lbb.rs-bare i{display:none!important}" +
      "#rs-lbpv .lbb.rs-bare img{width:100%;height:100%;object-fit:contain}";
    document.head.appendChild(s);
  }

  function lbCfgByUid(uid) {
    try {
      var list = (P && P.lobby && P.lobby.buttons) || [];
      for (var i = 0; i < list.length; i++) if (list[i].uid === uid) return list[i];
    } catch (e) { }
    return null;
  }

  function bareFrame() {
    if (OPT.bareIcons === false) return;
    bareCss();
    var els = document.querySelectorAll("#lobby .lb-el");
    for (var i = 0; i < els.length; i++) {
      var n = els[i];
      var cfg = lbCfgByUid(n.dataset && n.dataset.uid);
      var ico = n.querySelector(".bs-tile .ico");
      /* الصورة التي ترفعها من اللوحة تُحفظ رابطاً مباشراً، والمحرّك لا
         يقرأ إلّا معرّفات الأصول — فكان يتجاهلها ويعرض الرمز. نضعها. */
      if (ico && cfg && isUrl(cfg.icon) && ico.dataset.rsIcon !== cfg.icon) {
        ico.innerHTML = "";
        ico.appendChild(el("img", { src: cfg.icon, alt: "" }));
        ico.dataset.rsIcon = cfg.icon;
      } else if (ico && cfg && !cfg.icon && ico.dataset.rsIcon) {
        ico.innerHTML = "";
        ico.textContent = cfg.emoji || "⭐";
        delete ico.dataset.rsIcon;
      }
      n.classList.toggle("rs-bare", !!(ico && ico.querySelector("img")));
    }
    /* بطاقات الأبطال: المحرّك لا يضع الصورة إلّا لمن له أيقونة */
    var th = document.querySelectorAll(".hero-th");
    for (var j = 0; j < th.length; j++) {
      th[j].classList.toggle("rs-bare", !!th[j].querySelector("img"));
    }
  }
  setInterval(function () {
    try { bareFrame(); } catch (e) { rerr("bare", e); }
    try { lobbyFitVars(); } catch (e) { rerr("lbfit", e); }
  }, 450);
  window.__ROYAL_BARE__ = bareFrame;
