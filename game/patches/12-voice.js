  /* ============================================================
     6.46) الميكروفون والسماع داخل لوحة الأسلحة
     ------------------------------------------------------------
     كان زرّ الصوت زرّاً واحداً عائماً يدور على ثلاث حالات، فلا تعرف
     أين أنت منها. الآن زرّان مستقلّان في لوحة الأسلحة: واحد لميكروفونك
     وواحد لسماعك. أغلق الميكروفون وحده لتسمع رفاقك ولا يسمعوك، أو
     أغلق الاثنين فلا تسمع شيئاً ولا يسمعك أحد.
     ============================================================ */
  var VP = { css: false, wrap: null };

  function voiceCss() {
    if (VP.css) return;
    VP.css = true;
    var s = document.createElement("style");
    s.id = "royal-voice-css";
    s.textContent =
      "#rv-pan{display:flex;flex-direction:column;gap:5px;margin-inline-start:8px;" +
      "align-self:center;pointer-events:auto}" +
      "#rv-pan b{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;" +
      "font-size:17px;cursor:pointer;user-select:none;line-height:1;" +
      "background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.06));" +
      "border:1.5px solid rgba(255,255,255,.24);box-shadow:0 3px 8px rgba(0,0,0,.45)}" +
      "#rv-pan b.on{background:linear-gradient(180deg,#39e07b,#1c9a4c);border-color:#7dffae}" +
      "#rv-pan b.off{background:linear-gradient(180deg,#ff4d5e,#b8202f);border-color:#ffb3ba}" +
      "#rv-pan b.dim{opacity:.5}";
    document.head.appendChild(s);
  }

  function voiceApply() {
    try {
      if (VOICE.stream) VOICE.stream.getAudioTracks().forEach(function (tr) { tr.enabled = !!VOICE.mic; });
    } catch (e) { }
    for (var k in VOICE.els) { try { VOICE.els[k].muted = !VOICE.listen; } catch (e) { } }
    voicePanelSync();
    try { voiceBtnSync(); } catch (e) { }
  }

  function voicePanelSync() {
    if (!VP.wrap) return;
    var m = VP.wrap.querySelector(".mic"), l = VP.wrap.querySelector(".ear");
    if (m) {
      m.textContent = VOICE.mic ? "🎤" : "🚫";
      m.className = "mic " + (VOICE.mic ? "on" : "off") + (VP.online ? "" : " dim");
      m.title = VOICE.mic ? "ميكروفونك مفتوح — يسمعونك" : "ميكروفونك مغلق — لا يسمعونك";
    }
    if (l) {
      l.textContent = VOICE.listen ? "🔊" : "🔇";
      l.className = "ear " + (VOICE.listen ? "on" : "off") + (VP.online ? "" : " dim");
      l.title = VOICE.listen ? "تسمع رفاقك" : "لا تسمع شيئاً";
    }
  }

  /* ------------------------------------------------------------------
     الميكروفون والسماع كزرّين من أزرار الشاشة
     ------------------------------------------------------------------
     المحرّك يبني كلّ زرّ من جدول تعريفات مكشوف على window، فنُسجّل فيه
     زرّين جديدين ونُضيفهما إلى ترتيب الأزرار. بذلك يصيران مثل «القفز»
     و«الضرب» تماماً: تسحبهما بإصبعك، وتُكبّرهما، وتُبدّل أيقونتهما
     بصورة من جهازك، وتُخفيهما — كلّه من تبويب «الأزرار».
     ------------------------------------------------------------------ */
  function registerVoiceButtons(P) {
    if (OPT.voiceButtons === false) return;
    var D = window.__ROYAL_BTNDEFS__;
    if (D) {
      if (!D.mic) D.mic = { label: "الميكروفون", emo: "🎤", kind: "btn" };
      if (!D.sound) D.sound = { label: "سماع الأصدقاء", emo: "🔊", kind: "btn" };
    }
    if (!P || !P.controls || !Array.isArray(P.controls.layout)) return;
    var have = {};
    P.controls.layout.forEach(function (c) { if (c) have[c.id] = 1; });
    if (!have.mic) P.controls.layout.push({
      id: "mic", x: 0.955, y: 0.22, size: 54, wk: 1, hk: 1,
      shape: "round", emoji: "🎤", icon: null, visible: true, opacity: 0.92
    });
    if (!have.sound) P.controls.layout.push({
      id: "sound", x: 0.955, y: 0.33, size: 54, wk: 1, hk: 1,
      shape: "round", emoji: "🔊", icon: null, visible: true, opacity: 0.92
    });
  }

  /* حالة الزرّ تُقرأ من لونه: أحمر باهت = مغلق، بلا مساس بأيقونتك */
  function voiceBtnCss() {
    if (document.getElementById("royal-vbtn-css")) return;
    var s = document.createElement("style");
    s.id = "royal-vbtn-css";
    s.textContent =
      ".gw.voff{filter:grayscale(.75) brightness(.75)}" +
      ".gw.voff::after{content:'';position:absolute;left:12%;right:12%;top:48%;height:9%;" +
      "border-radius:3px;background:#ff4d5e;transform:rotate(-38deg);box-shadow:0 0 6px rgba(0,0,0,.6)}" +
      ".gw.voff{position:relative}";
    document.head.appendChild(s);
  }

  function voiceWidgetsSync(game) {
    var hud = game && game.hud; if (!hud || !hud.widgets) return;
    voiceBtnCss();
    var m = hud.widgets.mic, s = hud.widgets.sound;
    if (m && m.node) m.node.classList.toggle("voff", !VOICE.mic);
    if (s && s.node) s.node.classList.toggle("voff", !VOICE.listen);
  }

  function voiceButtonsFrame(game) {
    var hud = game && game.hud;
    if (!hud || !hud.consume) return;
    var online = !!game.net;
    if (hud.consume("mic")) {
      if (!online) toast("الصوت يعمل في الأونلاين مع الأصدقاء");
      else {
        VOICE.mic = !VOICE.mic;
        if (VOICE.mic) { try { ensureMic(); } catch (e) { } }
        toast(VOICE.mic ? "🎤 ميكروفونك مفتوح" : "🚫 ميكروفونك مغلق — لن يسمعوك");
        voiceApply();
      }
    }
    if (hud.consume("sound")) {
      if (!online) toast("الصوت يعمل في الأونلاين مع الأصدقاء");
      else {
        VOICE.listen = !VOICE.listen;
        toast(VOICE.listen ? "🔊 تسمع رفاقك" : "🔇 لن تسمع شيئاً");
        voiceApply();
      }
    }
    voiceWidgetsSync(game);
  }

  function voicePanel(game) {
    if (OPT.voicePanel === false || !OPT.voice) return;
    var box = document.getElementById("ammobox");
    if (!box || document.getElementById("rv-pan")) return;
    voiceCss();
    VP.online = !!game.net;
    var mic = el("b", { class: "mic", text: "🎤" });
    var ear = el("b", { class: "ear", text: "🔊" });
    mic.onpointerdown = function (e) {
      e.stopPropagation(); e.preventDefault();
      if (!VP.online) return toast("الصوت يعمل في الأونلاين مع الأصدقاء");
      VOICE.mic = !VOICE.mic;
      if (VOICE.mic) { try { ensureMic(); } catch (er) { } }
      toast(VOICE.mic ? "🎤 ميكروفونك مفتوح" : "🚫 ميكروفونك مغلق — لن يسمعوك");
      voiceApply();
    };
    ear.onpointerdown = function (e) {
      e.stopPropagation(); e.preventDefault();
      if (!VP.online) return toast("الصوت يعمل في الأونلاين مع الأصدقاء");
      VOICE.listen = !VOICE.listen;
      toast(VOICE.listen ? "🔊 تسمع رفاقك" : "🔇 لن تسمع شيئاً");
      voiceApply();
    };
    VP.wrap = el("div", { id: "rv-pan" }, [mic, ear]);
    box.appendChild(VP.wrap);
    if (game.net) VOICE.mic = !!OPT.voiceMic;
    voicePanelSync();
    /* الزرّ العائم القديم لم يعد له داعٍ */
    var old = document.getElementById("rv-btn");
    if (old) old.remove();
  }
