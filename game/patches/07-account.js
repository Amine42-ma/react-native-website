  /* ============================================================
     6.42) الحساب: نسخة احتياطية واسترجاع
     ------------------------------------------------------------
     تقدّم اللاعب (الكؤوس والعملات والمستوى والبطل المُختار وترتيب
     أزراره) محفوظ في متصفّح جهازه وحده. فإذا ضاع الجهاز أو فُرمِت ضاع
     كلّ شيء. هنا طريقتان:

     ١) رمز الاسترجاع — يعمل دائماً وبلا إنترنت: نجمع الحفظ ونضغطه
        ونُخرجه نصّاً واحداً يحفظه اللاعب عنده (أو ملفّاً). يلصقه في أيّ
        جهاز فيعود حسابه كما كان. هذه هي الطريقة المضمونة.

     ٢) الدخول بحساب جوجل — يحفظ نفس النسخة داخل مجلّد التطبيق المخفيّ
        في Google Drive الخاصّ باللاعب ويستعيدها في أيّ جهاز. يحتاج
        شيئين: أن تكون اللعبة منشورة على رابط https حقيقي (لا تعمل من
        ملفّ محفوظ داخل الجهاز)، وأن تضع «معرّف عميل جوجل» الذي تُنشئه
        من Google Cloud Console في تبويب «اللعب».
     ============================================================ */
  var ACC_KEYS = ["royal-game-prefs-v1", "royal-setup-v3", "royal-minimap", "royal-account-id"];
  var ACC_MAX = 512 * 1024;
  var GIS_URL = "https://accounts.google.com/gsi/client";
  var DRIVE_FILE = "royal-save.json";
  var DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";

  function accId() {
    var v = null;
    try { v = localStorage.getItem("royal-account-id"); } catch (e) { }
    if (!v) {
      v = "RB-" + Math.random().toString(36).slice(2, 7).toUpperCase() +
        "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
      try { localStorage.setItem("royal-account-id", v); } catch (e) { }
    }
    return v;
  }

  function accSnapshot() {
    var out = { v: 1, at: Date.now(), id: accId(), keys: {} };
    for (var i = 0; i < ACC_KEYS.length; i++) {
      var k = ACC_KEYS[i], s = null;
      try { s = localStorage.getItem(k); } catch (e) { }
      if (s != null && s.length <= ACC_MAX) out.keys[k] = s;
    }
    return out;
  }

  function accRestore(snap) {
    if (!snap || !snap.keys) throw new Error("رمز غير صالح");
    var n = 0;
    for (var k in snap.keys) {
      if (ACC_KEYS.indexOf(k) < 0) continue;
      try { localStorage.setItem(k, snap.keys[k]); n++; } catch (e) { }
    }
    if (!n) throw new Error("لا يوجد حفظ داخل هذا الرمز");
    return n;
  }

  /* ---- ترميز الرمز: JSON ← ضغط ← base64 ---- */
  function b64enc(buf) {
    var b = new Uint8Array(buf), s = "", CH = 0x8000;
    for (var i = 0; i < b.length; i += CH) s += String.fromCharCode.apply(null, b.subarray(i, i + CH));
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64dec(str) {
    var s = String(str).replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var bin = atob(s), b = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    return b;
  }
  function accEncode(snap) {
    var json = JSON.stringify(snap);
    var plain = function () { return "RB0" + b64enc(new TextEncoder().encode(json)); };
    if (typeof CompressionStream !== "function") return Promise.resolve(plain());
    return new Response(new Blob([json]).stream().pipeThrough(new CompressionStream("gzip")))
      .arrayBuffer()
      .then(function (buf) { return "RB1" + b64enc(buf); })
      .catch(function () { return plain(); });
  }
  function accDecode(code) {
    var s = String(code || "").replace(/\s+/g, "");
    if (s.slice(0, 3) === "RB0") {
      try { return Promise.resolve(JSON.parse(new TextDecoder().decode(b64dec(s.slice(3))))); }
      catch (e) { return Promise.reject(new Error("الرمز ناقص أو تالف")); }
    }
    if (s.slice(0, 3) !== "RB1") return Promise.reject(new Error("هذا ليس رمز استرجاع"));
    if (typeof DecompressionStream !== "function") return Promise.reject(new Error("متصفّحك لا يفكّ الضغط — افتح اللعبة في متصفّح أحدث"));
    return new Response(new Blob([b64dec(s.slice(3))]).stream().pipeThrough(new DecompressionStream("gzip")))
      .text().then(function (t) { return JSON.parse(t); })
      .catch(function () { throw new Error("الرمز ناقص أو تالف"); });
  }

  /* ---- جوجل درايف: مجلّد التطبيق المخفيّ (لا نرى بقيّة ملفّاته) ---- */
  var GIS = { loaded: false, token: null, exp: 0 };

  function gisLoad() {
    if (GIS.loaded) return Promise.resolve();
    if (location.protocol !== "https:" && location.hostname !== "localhost") {
      return Promise.reject(new Error("الدخول بجوجل يحتاج نشر اللعبة على رابط https — لا يعمل من ملفّ داخل الجهاز. استعمل رمز الاسترجاع."));
    }
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = GIS_URL; s.async = true; s.defer = true;
      s.onload = function () { GIS.loaded = true; res(); };
      s.onerror = function () { rej(new Error("تعذّر الوصول لجوجل — تحقّق من الإنترنت")); };
      document.head.appendChild(s);
    });
  }

  function gisToken() {
    if (GIS.token && Date.now() < GIS.exp - 30000) return Promise.resolve(GIS.token);
    var cid = String(OPT.googleClientId || "").trim();
    if (!cid) return Promise.reject(new Error("لم يُضبط «معرّف عميل جوجل» — ضعه في تبويب «اللعب» داخل لوحة الإعداد"));
    return gisLoad().then(function () {
      return new Promise(function (res, rej) {
        var tc = window.google.accounts.oauth2.initTokenClient({
          client_id: cid,
          scope: DRIVE_SCOPE,
          callback: function (r) {
            if (r && r.access_token) {
              GIS.token = r.access_token;
              GIS.exp = Date.now() + (r.expires_in || 3600) * 1000;
              res(GIS.token);
            } else rej(new Error("لم يكتمل الدخول"));
          },
          error_callback: function (e) { rej(new Error("أُلغِي الدخول" + (e && e.type ? " (" + e.type + ")" : ""))); }
        });
        tc.requestAccessToken({});
      });
    });
  }

  function driveFind(tok) {
    var u = "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name)&q=" +
      encodeURIComponent("name='" + DRIVE_FILE + "'");
    return fetch(u, { headers: { Authorization: "Bearer " + tok } })
      .then(function (r) { return r.json(); })
      .then(function (j) { return (j.files && j.files[0] && j.files[0].id) || null; });
  }

  function driveSave() {
    var tok;
    return gisToken().then(function (t) { tok = t; return driveFind(tok); }).then(function (id) {
      var meta = id ? {} : { name: DRIVE_FILE, parents: ["appDataFolder"] };
      var body = new FormData();
      body.append("metadata", new Blob([JSON.stringify(meta)], { type: "application/json" }));
      body.append("file", new Blob([JSON.stringify(accSnapshot())], { type: "application/json" }));
      return fetch("https://www.googleapis.com/upload/drive/v3/files" + (id ? "/" + id : "") + "?uploadType=multipart",
        { method: id ? "PATCH" : "POST", headers: { Authorization: "Bearer " + tok }, body: body });
    }).then(function (r) {
      if (!r.ok) throw new Error("رفض جوجل الحفظ (" + r.status + ")");
      return true;
    });
  }

  function driveLoad() {
    var tok;
    return gisToken().then(function (t) { tok = t; return driveFind(tok); }).then(function (id) {
      if (!id) throw new Error("لا توجد نسخة محفوظة في حساب جوجل هذا");
      return fetch("https://www.googleapis.com/drive/v3/files/" + id + "?alt=media",
        { headers: { Authorization: "Bearer " + tok } });
    }).then(function (r) {
      if (!r.ok) throw new Error("تعذّر تنزيل النسخة (" + r.status + ")");
      return r.json();
    });
  }

  /* ---- واجهة اللاعب ---- */
  var ACC_CSS = false;
  function accCss() {
    if (ACC_CSS) return;
    ACC_CSS = true;
    var s = document.createElement("style");
    s.id = "royal-acc-css";
    s.textContent =
      "#racc-btn{position:absolute;z-index:26;top:2%;left:1.5%;display:flex;align-items:center;gap:6px;" +
      "padding:5px 11px;border-radius:11px;font-weight:900;font-size:clamp(11px,1.5vw,15px);cursor:pointer;" +
      "background:rgba(8,4,24,.72);border:1.5px solid rgba(255,255,255,.2);color:#fff;pointer-events:auto}" +
      "#racc-wrap{position:fixed;inset:0;z-index:900;background:rgba(4,2,14,.82);display:none;" +
      "align-items:center;justify-content:center;padding:14px;direction:rtl}" +
      "#racc-wrap.on{display:flex}" +
      "#racc-box{width:min(560px,100%);max-height:92vh;overflow:auto;border-radius:18px;padding:16px;" +
      "background:linear-gradient(180deg,#221056,#150c38);border:1.5px solid rgba(255,255,255,.16);" +
      "box-shadow:0 18px 50px rgba(0,0,0,.6);color:#fff}" +
      "#racc-box h3{margin:0 0 4px;font-size:18px}" +
      "#racc-box .hnt{color:#c9c0ee;font-size:12.5px;line-height:1.7;margin:6px 0 12px}" +
      "#racc-box .sec{border-top:1px solid rgba(255,255,255,.12);margin-top:14px;padding-top:12px}" +
      "#racc-box .ttl{font-weight:900;color:#ffc21a;margin-bottom:6px;font-size:14px}" +
      "#racc-box textarea{width:100%;height:92px;border-radius:10px;padding:8px;font-size:11px;direction:ltr;" +
      "background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.16);color:#fff;resize:vertical}" +
      "#racc-box .rw{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}" +
      "#racc-box button{flex:1 1 auto;min-width:120px;padding:10px;border-radius:11px;border:0;cursor:pointer;" +
      "font-weight:900;font-size:13px;color:#20143a;background:linear-gradient(180deg,#ffc21a,#c98800)}" +
      "#racc-box button.g{background:linear-gradient(180deg,#39e07b,#1c9a4c);color:#06240f}" +
      "#racc-box button.c{background:linear-gradient(180deg,#25d3ff,#0e88b8);color:#04202b}" +
      "#racc-box button.x{background:rgba(255,255,255,.14);color:#fff}" +
      "#racc-box .idv{direction:ltr;text-align:center;font-weight:900;letter-spacing:1px;font-size:15px;" +
      "background:rgba(0,0,0,.3);border-radius:9px;padding:7px;margin-bottom:8px}" +
      "#racc-msg{margin-top:10px;font-size:12.5px;min-height:1.2em;line-height:1.6}";
    document.head.appendChild(s);
  }

  function accPanel() {
    accCss();
    var old = document.getElementById("racc-wrap");
    if (old) old.remove();
    var wrap = el("div", { id: "racc-wrap" });
    var box = el("div", { id: "racc-box" });
    wrap.appendChild(box);
    wrap.onclick = function (e) { if (e.target === wrap) wrap.remove(); };
    document.body.appendChild(wrap);

    var msg = el("div", { id: "racc-msg" });
    function say(t, ok) {
      msg.textContent = t;
      msg.style.color = ok === false ? "#ff8a9a" : ok ? "#7dffae" : "#c9c0ee";
    }

    box.appendChild(el("h3", { text: "🔐 حسابك ونسخته الاحتياطية" }));
    box.appendChild(el("div", {
      class: "hnt",
      text: "تقدّمك محفوظ داخل هذا المتصفّح فقط. احفظ رمز الاسترجاع في مكان آمن (أرسله لنفسك، أو احفظه ملفّاً) — به يعود حسابك بعد فرمتة الجهاز أو على هاتف جديد."
    }));
    box.appendChild(el("div", { class: "idv", text: accId() }));

    /* ١) رمز الاسترجاع */
    box.appendChild(el("div", { class: "sec" }, [el("div", { class: "ttl", text: "١) رمز الاسترجاع" })]));
    var ta = el("textarea", { readonly: "readonly", spellcheck: "false" });
    box.appendChild(ta);
    accEncode(accSnapshot()).then(function (c) { ta.value = c; })
      .catch(function (e) { say("تعذّر تجهيز الرمز: " + e.message, false); });
    box.appendChild(el("div", { class: "rw" }, [
      el("button", {
        text: "📋 انسخ الرمز", onclick: function () {
          if (!ta.value) return say("الرمز لم يجهز بعد", false);
          ta.removeAttribute("readonly");
          ta.select(); ta.setSelectionRange(0, ta.value.length);
          var done = false;
          try { done = document.execCommand("copy"); } catch (e) { }
          ta.setAttribute("readonly", "readonly");
          if (done) return say("نُسخ الرمز — احفظه عندك", true);
          if (navigator.clipboard) {
            navigator.clipboard.writeText(ta.value).then(
              function () { say("نُسخ الرمز — احفظه عندك", true); },
              function () { say("انسخه يدوياً من الصندوق", false); });
            return;
          }
          say("انسخه يدوياً من الصندوق", false);
        }
      }),
      el("button", {
        class: "c", text: "💾 احفظه ملفّاً", onclick: function () {
          if (!ta.value) return say("الرمز لم يجهز بعد", false);
          try {
            var bl = new Blob([ta.value], { type: "text/plain;charset=utf-8" });
            var a = el("a", { href: URL.createObjectURL(bl), download: "royal-account-" + accId() + ".txt" });
            document.body.appendChild(a); a.click();
            setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 6000);
            say("نزّلنا الملفّ — احتفظ به", true);
          } catch (e) { say("تعذّر الحفظ: " + e.message, false); }
        }
      })
    ]));

    /* ٢) الاسترجاع */
    box.appendChild(el("div", { class: "sec" }, [el("div", { class: "ttl", text: "٢) استرجاع حساب" })]));
    var inp = el("textarea", { placeholder: "الصق رمز الاسترجاع هنا…", spellcheck: "false" });
    box.appendChild(inp);
    var file = el("input", { type: "file", accept: ".txt,text/plain", style: "display:none" });
    file.onchange = function () {
      var f = file.files && file.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () { inp.value = String(r.result || "").trim(); say("قرأنا الملفّ — اضغط «استرجع الآن»"); };
      r.readAsText(f);
    };
    box.appendChild(file);
    function doRestore(snap) {
      var n = accRestore(snap);
      say("رجع حسابك (" + n + " عناصر) — نُعيد التشغيل…", true);
      setTimeout(function () { location.reload(); }, 1200);
    }
    box.appendChild(el("div", { class: "rw" }, [
      el("button", { class: "x", text: "📂 من ملفّ", onclick: function () { file.click(); } }),
      el("button", {
        class: "g", text: "♻️ استرجع الآن", onclick: function () {
          var code = inp.value.trim();
          if (!code) return say("الصق الرمز أوّلاً", false);
          if (!confirm("سيحلّ الحساب المُسترجَع محلّ تقدّمك الحالي على هذا الجهاز. متأكّد؟")) return;
          accDecode(code).then(doRestore).catch(function (e) { say("فشل الاسترجاع: " + e.message, false); });
        }
      })
    ]));

    /* ٣) جوجل */
    box.appendChild(el("div", { class: "sec" }, [el("div", { class: "ttl", text: "٣) الدخول بحساب جوجل" })]));
    box.appendChild(el("div", {
      class: "hnt",
      text: OPT.googleClientId
        ? "تُحفظ نسختك في مجلّد مخفيّ داخل Google Drive الخاصّ بك، وتعود في أيّ جهاز تدخل منه بنفس الحساب."
        : "غير مُفعَّل: على مطوّر اللعبة وضع «معرّف عميل جوجل» في تبويب «اللعب» داخل لوحة الإعداد، ونشر اللعبة على رابط https."
    }));
    box.appendChild(el("div", { class: "rw" }, [
      el("button", {
        class: "c", text: "☁️ ارفع لجوجل", onclick: function () {
          say("جارٍ الدخول…");
          driveSave().then(function () { say("حُفظت نسختك في حساب جوجل", true); })
            .catch(function (e) { say(e.message, false); });
        }
      }),
      el("button", {
        class: "g", text: "⬇️ استرجع من جوجل", onclick: function () {
          say("جارٍ الدخول…");
          driveLoad().then(function (snap) {
            if (!confirm("سيحلّ ما في حساب جوجل محلّ تقدّمك الحالي على هذا الجهاز. متأكّد؟")) return say("أُلغِي");
            doRestore(snap);
          }).catch(function (e) { say(e.message, false); });
        }
      })
    ]));

    box.appendChild(msg);
    box.appendChild(el("div", { class: "rw" }, [
      el("button", {
        class: "x", text: "📜 الشكر والتراخيص",
        onclick: function () { wrap.remove(); if (window.__ROYAL_CREDITS__) window.__ROYAL_CREDITS__(); }
      }),
      el("button", { class: "x", text: "✕ إغلاق", onclick: function () { wrap.remove(); } })
    ]));
    wrap.classList.add("on");
  }
  window.__ROYAL_ACCOUNT__ = accPanel;

  /* زرّ الحساب في واجهة اللعبة */
  function accButton() {
    if (OPT.account === false) return;
    var lobby = document.getElementById("lobby");
    if (!lobby || document.getElementById("racc-btn")) return;
    accCss();
    lobby.appendChild(el("div", { id: "racc-btn", text: "🔐 حسابي", onclick: accPanel }));
  }
  setInterval(function () { try { accButton(); } catch (e) { } }, 900);
