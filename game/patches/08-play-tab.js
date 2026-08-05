    /* ---- الظلّ والبحر: مقادير المظهر ---- */
    s.appendChild(el("div", { class: "rs-card" }, [
      el("h4", { text: "🌑 ظلّ اللاعب" }),
      el("div", { class: "rs-hint", text: "ظلّ حقيقي يتبع اللاعب: صندوق الظلّ صغير حوله فتظهر تفاصيله بدل أن تضيع في خريطة تغطّي الجزيرة كلّها. ومعه ظلّ مرسوم يمتدّ مع الشمس، يعمل حتى على أضعف الأجهزة." }),
      el("div", { class: "rs-chips" }, [
        el("button", {
          class: "rs-chip " + (OPT.shadow ? "ok" : "dz"),
          text: OPT.shadow ? "✅ الظلّ مُفعَّل" : "🚫 بلا ظلّ",
          onclick: function () { OPT.shadow = !OPT.shadow; persist(); renderPlay(); toast("يظهر في المباراة القادمة"); }
        })
      ]),
      row("مدى الظلّ الحادّ (م)", slider(12, 90, 2, OPT.shadowRange, function (v) { OPT.shadowRange = v; persist(); })),
      row("قتامة الظلّ", slider(0.2, 1, 0.05, OPT.blobAlpha, function (v) { OPT.blobAlpha = v; persist(); })),
      el("div", { class: "rs-hint", text: "كلّما صغُر المدى زادت حِدّة الظلّ وقلّ ما يُظلّل حول اللاعب. ٣٠–٤٠ متراً وسطٌ جيّد." })
    ]));

    s.appendChild(el("div", { class: "rs-card" }, [
      el("h4", { text: "🌊 تفاصيل البحر" }),
      el("div", { class: "rs-hint", text: "شبكة الماء تصير كثيفة قرب الكاميرا فيظهر الموج مجسّماً، ويذوب البحر في السماء عند الأفق بدل الخطّ القاطع." }),
      el("div", { class: "rs-chips" }, [
        el("button", {
          class: "rs-chip " + (OPT.oceanGrid ? "ok" : "dz"),
          text: OPT.oceanGrid ? "🌊 موج مجسّم: مُفعَّل" : "🌊 موج مجسّم: مُعطَّل",
          onclick: function () { OPT.oceanGrid = !OPT.oceanGrid; persist(); renderPlay(); toast("يظهر في المباراة القادمة"); }
        }),
        el("button", {
          class: "rs-chip " + (OPT.oceanSky ? "ok" : "dz"),
          text: OPT.oceanSky ? "🌅 أفق ذائب: مُفعَّل" : "🌅 أفق ذائب: مُعطَّل",
          onclick: function () { OPT.oceanSky = !OPT.oceanSky; persist(); renderPlay(); toast("يظهر في المباراة القادمة"); }
        })
      ]),
      row("عرض تدرّج الشاطئ (م)", slider(0.2, 4, 0.1, OPT.shoreFade, function (v) { OPT.shoreFade = v; persist(); }))
    ]));

    s.appendChild(el("div", { class: "rs-card" }, [
      el("h4", { text: "🌩️ عاصفة الزون" }),
      el("div", { class: "rs-hint", text: "جدار الزون يصير عاصفة تتلوّى فيها الومضات، وما إن تخرج من المنطقة الآمنة حتى تُظلم الدنيا وينزل المطر ويلمع البرق ويأتي الرعد بعده بمقدار بُعدك — وكلّما تأخّرت اشتدّت." }),
      el("div", { class: "rs-chips" }, [
        el("button", {
          class: "rs-chip " + (OPT.zoneStorm !== false ? "ok" : "dz"),
          text: OPT.zoneStorm !== false ? "⛈️ العاصفة مُفعَّلة" : "🚫 بلا عاصفة",
          onclick: function () { OPT.zoneStorm = OPT.zoneStorm === false; persist(); renderPlay(); toast("تظهر في المباراة القادمة"); }
        })
      ]),
      el("div", { class: "rs-chips" }, [
        el("button", {
          class: "rs-chip " + (OPT.zoneBolts !== false ? "ok" : "dz"),
          text: OPT.zoneBolts !== false ? "⚡ صواعق تضرب الأرض" : "🚫 بلا صواعق",
          onclick: function () { OPT.zoneBolts = OPT.zoneBolts === false; persist(); renderPlay(); }
        })
      ]),
      row("شدّة العاصفة", slider(0.2, 1, 0.05, OPT.zoneStormAlpha, function (v) { OPT.zoneStormAlpha = v; persist(); }))
    ]));

    s.appendChild(el("div", { class: "rs-card" }, [
      el("h4", { text: "🎒 الغنائم والفريق والصوت" }),
      el("div", { class: "rs-hint", text: "صناديق ذخيرة وحقائب إسعاف بأشكالها بدل مكعّبات عارية، ولوحة تُريك دم كلّ رفيق، وزرّا ميكروفون وسماع تسحبهما وتُبدّل أيقونتهما من تبويب «الأزرار» مثل بقيّة الأزرار." }),
      el("div", { class: "rs-chips" }, [
        el("button", {
          class: "rs-chip " + (OPT.lootLook !== false ? "ok" : "dz"),
          text: OPT.lootLook !== false ? "📦 غنائم مُجسَّمة" : "🚫 غنائم عادية",
          onclick: function () { OPT.lootLook = OPT.lootLook === false; persist(); renderPlay(); toast("تظهر في المباراة القادمة"); }
        }),
        el("button", {
          class: "rs-chip " + (OPT.squadHp !== false ? "ok" : "dz"),
          text: OPT.squadHp !== false ? "❤️ دم الرفاق ظاهر" : "🚫 بلا لوحة رفاق",
          onclick: function () { OPT.squadHp = OPT.squadHp === false; persist(); renderPlay(); }
        }),
        el("button", {
          class: "rs-chip " + (OPT.voiceButtons !== false ? "ok" : "dz"),
          text: OPT.voiceButtons !== false ? "🎤 الميكروفون والسماع زرّان في الشاشة" : "🚫 بلا زرّي صوت",
          onclick: function () { OPT.voiceButtons = OPT.voiceButtons === false; persist(); renderPlay(); toast("رتّبهما من تبويب «الأزرار»"); }
        }),
        el("button", {
          class: "rs-chip " + (OPT.voicePanel ? "ok" : "dz"),
          text: OPT.voicePanel ? "🔊 وزرّان ملتصقان بلوحة الأسلحة" : "🚫 بلا زرّين في لوحة الأسلحة",
          onclick: function () { OPT.voicePanel = !OPT.voicePanel; persist(); renderPlay(); toast("يظهر في المباراة القادمة"); }
        }),
        el("button", {
          class: "rs-chip " + (OPT.bareIcons !== false ? "ok" : "dz"),
          text: OPT.bareIcons !== false ? "🖼️ أيقونة الواجهة بلا إطار" : "🔲 أيقونة داخل إطار",
          onclick: function () { OPT.bareIcons = OPT.bareIcons === false; persist(); renderPlay(); renderLobbyTab && 0; }
        }),
        el("button", {
          class: "rs-chip", text: "📜 الشكر والتراخيص",
          onclick: function () { if (window.__ROYAL_CREDITS__) window.__ROYAL_CREDITS__(); }
        })
      ])
    ]));

    s.appendChild(el("div", { class: "rs-card" }, [
      el("h4", { text: "🪂 عدد الأشخاص ونزولهم" }),
      el("div", { class: "rs-hint", text: "عدد واحد يحكم المباراة كلّها: أنت والباقون. بلا أونلاين كلّهم خصوم آليّون، ومع الأونلاين يُطلب العدد نفسه ويُكمَّل نقصه بوتات. وكلّهم يقفزون من الطائرة بالمظلّات مثلك — كلٌّ عند لحظته — بدل أن يظهروا على الأرض ظهوراً." }),
      row("عدد الأشخاص", slider(2, 60, 1, OPT.matchPlayers, function (v) { OPT.matchPlayers = v; persist(); })),
      el("div", { class: "rs-chips" }, [
        el("button", {
          class: "rs-chip " + (OPT.botChute !== false ? "ok" : "dz"),
          text: OPT.botChute !== false ? "🪂 ينزلون بالمظلّات" : "🚫 يظهرون على الأرض",
          onclick: function () { OPT.botChute = OPT.botChute === false; persist(); renderPlay(); toast("يظهر في المباراة القادمة"); }
        }),
        el("button", {
          class: "rs-chip " + (OPT.botLoot !== false ? "ok" : "dz"),
          text: OPT.botLoot !== false ? "📦 يفتحون الصناديق ويلتقطون" : "🚫 يدورون بلا هدف",
          onclick: function () { OPT.botLoot = OPT.botLoot === false; persist(); renderPlay(); }
        })
      ]),
      el("div", { class: "rs-hint", text: "خمسون شخصاً على هاتف متوسّط ثقيلة قليلاً — إن تقطّعت اللعبة أنزل العدد أو أطفئ ظلّ اللاعب." })
    ]));

    /* ---- الحساب واسترجاعه ---- */
    var gid = el("input", {
      type: "text", class: "rs-txt", dir: "ltr",
      placeholder: "123456789-abc.apps.googleusercontent.com",
      value: OPT.googleClientId || ""
    });
    gid.oninput = function () { OPT.googleClientId = gid.value.trim(); persist(); };
    s.appendChild(el("div", { class: "rs-card" }, [
      el("h4", { text: "🔐 حساب اللاعب واسترجاعه" }),
      el("div", { class: "rs-hint", text: "تقدّم اللاعب محفوظ في متصفّح جهازه وحده. زرّ «حسابي» في واجهة اللعبة يُعطيه رمز استرجاع يحفظه عنده، فيعود حسابه بعد فرمتة الجهاز أو على هاتف جديد. هذه الطريقة تعمل دائماً وبلا إنترنت." }),
      el("div", { class: "rs-chips" }, [
        el("button", {
          class: "rs-chip " + (OPT.account !== false ? "ok" : "dz"),
          text: OPT.account !== false ? "✅ زرّ «حسابي» ظاهر" : "🚫 زرّ «حسابي» مخفي",
          onclick: function () { OPT.account = OPT.account === false; persist(); renderPlay(); }
        }),
        el("button", {
          class: "rs-chip", text: "🔎 افتح لوحة الحساب الآن",
          onclick: function () { if (window.__ROYAL_ACCOUNT__) window.__ROYAL_ACCOUNT__(); }
        })
      ]),
      el("div", { class: "rs-hint", text: "اختياري — الدخول بحساب جوجل: ضع هنا «معرّف العميل» من Google Cloud Console (نوع: تطبيق ويب)، وأضف رابط موقعك في «أصول JavaScript المسموح بها». يحتاج نشر اللعبة على https؛ لا يعمل من ملفّ داخل الجهاز." }),
      row("معرّف عميل جوجل", gid)
    ]));
