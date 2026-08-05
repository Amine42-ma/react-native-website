  /* ============================================================
     6.52) واجهة اللعبة: صندوق تصميم واحد للحجم والمكان
     ------------------------------------------------------------
     كان الزرّ يُقاس بمقياسين مختلفين في آنٍ واحد:

       • حجمه  ← نسبة من صندوق ‎16:9‎ مُدرَج داخل الشاشة
                 (`--dw = min(100vw, 100dvh*16/9)`)
       • مكانه ← نسبة من الشاشة الحقيقية (`left:x%`, `top:y%`)

     فإذا خالفت نسبةُ الشاشة ‎16:9‎ انفصل المقياسان: في العمودي يصير
     ارتفاع الصندوق ربع ارتفاع الشاشة تقريباً، وفي الشاشة العريضة
     يتباعد العرضان — فيهرب الزرّ عن موضعه في المعاينة.

     العلاج ليس بتوسيع الحجم إلى الشاشة (فذلك ينفخ الأزرار على الشاشات
     العريضة)، بل بجرّ المكان إلى صندوق التصميم نفسه: نُبقي الحجم كما
     كان بالضبط، ونحسب المكان داخل الصندوق ذاته ونُوسّطه في الشاشة.
     فتصير الواجهة نسخةً طبق الأصل من المعاينة على أيّ جهاز وأيّ دوران.
     ============================================================ */
  var LBFIT = { css: false };

  function lobbyFitCss() {
    if (OPT.lobbyFit === false || LBFIT.css) return;
    LBFIT.css = true;
    var s = document.createElement("style");
    s.id = "royal-lbfit-css";
    /* الحجم بصندوق ‎16:9‎ كما كان، والمكان صار بالصندوق نفسه موسَّطاً.
       نستعمل وحدات الشاشة لا النِّسب المئويّة: المتغيّر الواحد يُستبدل
       نصّاً، فلو حوى ‎%‎ لتغيّر معناه بين محور وآخر. */
    s.textContent =
      "#lobby .lb-el{" +
      "--bw:min(100vw, calc(100dvh * 16 / 9));" +
      "--bh:calc(var(--bw) * 9 / 16);" +
      "width:calc(var(--w,.1) * var(--bw))!important;" +
      "height:calc(var(--h,.12) * var(--bh))!important;" +
      "left:calc((100vw - var(--bw)) / 2 + var(--rx,.5) * var(--bw))!important;" +
      "top:calc((100dvh - var(--bh)) / 2 + var(--ry,.5) * var(--bh))!important}" +
      /* شريط الوضع (فردي/ضدّ الروبوتات) يتبع زرّ اللعب فليتبعه هنا أيضاً */
      "#lobby .mode-bar{" +
      "--bw:min(100vw, calc(100dvh * 16 / 9));" +
      "--bh:calc(var(--bw) * 9 / 16);" +
      "left:calc((100vw - var(--bw)) / 2 + var(--rx,.85) * var(--bw))!important;" +
      "top:calc((100dvh - var(--bh)) / 2 + var(--ry,.72) * var(--bh) - 4.6em)!important}";
    document.head.appendChild(s);
  }

  /* المحرّك يكتب المكان في نمط العنصر مباشرةً، فنُمرّر له النِّسبتين
     في متغيّرين ونترك الحساب كلّه للـ CSS — فيتبع تغيّر الشاشة فوراً
     بلا انتظار دورتنا. */
  function lobbyFitVars() {
    if (OPT.lobbyFit === false) return;
    lobbyFitCss();
    var els = document.querySelectorAll("#lobby .lb-el");
    var play = null;
    for (var i = 0; i < els.length; i++) {
      var n = els[i];
      var cfg = lbCfgByUid(n.dataset && n.dataset.uid);
      if (!cfg) continue;
      if (n.style.getPropertyValue("--rx") !== String(cfg.x)) n.style.setProperty("--rx", cfg.x);
      if (n.style.getPropertyValue("--ry") !== String(cfg.y)) n.style.setProperty("--ry", cfg.y);
      if (cfg.kind === "play") play = cfg;
    }
    var mb = document.querySelector("#lobby .mode-bar");
    if (mb && play) {
      mb.style.setProperty("--rx", play.x);
      mb.style.setProperty("--ry", play.y);
    }
  }
