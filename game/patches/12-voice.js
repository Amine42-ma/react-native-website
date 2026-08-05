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
