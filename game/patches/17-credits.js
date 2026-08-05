  /* ============================================================
     6.50) الشكر والتراخيص
     ------------------------------------------------------------
     كلّ مجسّم ‎glTF‏ يحمل داخله بطاقة صانعه: الاسم والرابط والرخصة —
     يكتبها المصدّر (Sketchfab وغيره) في ‎asset.extras‏. فبدل أن تكتب
     القائمة بيدك وتنساها كلّما أضفت نموذجاً، نقرأها من الملفّات نفسها
     وقت فتح الشاشة. ما لا يحمل بطاقةً نُظهره صراحةً بوصفه «بلا بيانات
     رخصة» حتى لا تظنّ أنّ الأمر مضمون وهو ليس كذلك.
     ============================================================ */
  var CRD = { cache: null, busy: false, url: null };

  /* المحرّك يضع مُحوّل المعرّف إلى رابط على المباراة باسم __assetURL،
     فنلتقطه أوّل ما تبدأ مباراة ونحتفظ به لما بعدها */
  function assetResolver() {
    var rt = window.__runtime;
    var f = (rt && rt.game && (rt.game.__assetURL || rt.game.assetURL)) || null;
    if (f) CRD.url = f;
    return CRD.url;
  }

  function creditAssetIds(P) {
    var ids = [], seen = {};
    function add(v) { if (v && typeof v === "string" && !seen[v]) { seen[v] = 1; ids.push(v); } }
    try {
      if (P.map) { add(P.map.assetId); add(P.map.shipAssetId); add(P.map.crateAssetId); }
      (P.weapons || []).forEach(function (w) { add(w && w.assetId); });
      ((P.lobby && P.lobby.heroes) || []).forEach(function (h) {
        (h.attachments || []).forEach(function (a) { add(a && a.assetId); });
      });
    } catch (e) { }
    return ids;
  }

  /* بطاقة الصانع من داخل ملفّ ‎GLB‏: أوّل مقطع فيه هو ‎JSON‏ */
  function glbMeta(url) {
    return fetch(url).then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
      if (buf.byteLength < 24) return null;
      var dv = new DataView(buf);
      if (dv.getUint32(0, true) !== 0x46546c67) return null;      /* "glTF" */
      var len = dv.getUint32(12, true), type = dv.getUint32(16, true);
      if (type !== 0x4e4f534a) return null;                        /* "JSON" */
      len = Math.min(len, buf.byteLength - 20);
      var txt = new TextDecoder().decode(new Uint8Array(buf, 20, len));
      var js = JSON.parse(txt);
      var x = (js.asset && js.asset.extras) || null;
      if (!x) return null;
      return {
        title: x.title || null, author: x.author || null,
        license: x.license || null, source: x.source || null
      };
    }).catch(function () { return null; });
  }

  function collectCredits(P, assetURL) {
    if (CRD.cache) return Promise.resolve(CRD.cache);
    var ids = creditAssetIds(P);
    var jobs = ids.map(function (id) {
      var url = null;
      try { url = assetURL ? assetURL(id) : null; } catch (e) { }
      if (!url) return Promise.resolve({ id: id, meta: null });
      return glbMeta(url).then(function (m) { return { id: id, meta: m }; });
    });
    return Promise.all(jobs).then(function (rows) {
      CRD.cache = rows;
      return rows;
    });
  }

  function creditsPanel() {
    accCss();
    var old = document.getElementById("rcrd-wrap");
    if (old) old.remove();
    var wrap = el("div", { id: "rcrd-wrap", class: "on" });
    wrap.id = "racc-wrap";                    /* نستعمل تنسيق لوحة الحساب */
    var box = el("div", { id: "racc-box" });
    wrap.appendChild(box);
    wrap.onclick = function (e) { if (e.target === wrap) wrap.remove(); };
    document.body.appendChild(wrap);

    box.appendChild(el("h3", { text: "📜 الشكر والتراخيص" }));
    box.appendChild(el("div", {
      class: "hnt",
      text: "هذه بطاقات الصانعين المكتوبة داخل ملفّات المجسّمات نفسها. رخصة CC-BY تسمح بالاستعمال والتعديل وحتى الربح، بشرط واحد: أن يبقى اسم الصانع ورابط عمله ورابط الرخصة ظاهرين للاعب — وهذه الشاشة هي التي تُوفّي بذلك، فلا تحذفها من نسختك."
    }));
    var list = el("div", {});
    box.appendChild(list);
    list.appendChild(el("div", { class: "hnt", text: "جارٍ القراءة من الملفّات…" }));

    var rt = window.__runtime;
    var P = (rt && rt.P) || null;
    var url = assetResolver();
    if (!P) { list.innerHTML = ""; list.appendChild(el("div", { class: "hnt", text: "تعذّر الوصول للمشروع." })); }
    else if (!url) {
      list.innerHTML = "";
      list.appendChild(el("div", {
        class: "hnt",
        text: "بطاقات الصانعين تُقرأ من ملفّات المجسّمات بعد تحميلها. ادخل مباراةً واحدة ثمّ افتح هذه الشاشة."
      }));
    }
    else collectCredits(P, url).then(function (rows) {
      list.innerHTML = "";
      var withMeta = 0;
      rows.forEach(function (r) {
        var sec = el("div", { class: "sec" });
        if (r.meta) {
          withMeta++;
          sec.appendChild(el("div", { class: "ttl", text: r.meta.title || r.id }));
          if (r.meta.author) sec.appendChild(el("div", { class: "hnt", text: "الصانع: " + r.meta.author }));
          if (r.meta.license) sec.appendChild(el("div", { class: "hnt", text: "الرخصة: " + r.meta.license }));
          if (r.meta.source) {
            var a = el("a", { href: r.meta.source, target: "_blank", rel: "noopener",
              style: "color:#25d3ff;font-size:12px;direction:ltr;display:block;word-break:break-all" });
            a.textContent = r.meta.source;
            sec.appendChild(a);
          }
        } else {
          sec.appendChild(el("div", { class: "ttl", text: r.id }));
          sec.appendChild(el("div", {
            class: "hnt",
            text: "⚠️ لا بطاقة رخصة داخل هذا الملفّ — تحقّق من مصدره بنفسك قبل التوزيع."
          }));
        }
        list.appendChild(sec);
      });
      list.appendChild(el("div", {
        class: "hnt", style: "margin-top:12px",
        text: "قُرِئت " + withMeta + " بطاقة من " + rows.length + " ملفّاً. الأصوات والصور التي رفعتَها أنت لا تحمل بطاقات، ومسؤوليّتها عليك."
      }));
    }).catch(function (e) {
      list.innerHTML = "";
      list.appendChild(el("div", { class: "hnt", text: "تعذّرت القراءة: " + e.message }));
    });

    box.appendChild(el("div", { class: "rw" }, [
      el("button", { class: "x", text: "✕ إغلاق", onclick: function () { wrap.remove(); } })
    ]));
  }
  window.__ROYAL_CREDITS__ = creditsPanel;
