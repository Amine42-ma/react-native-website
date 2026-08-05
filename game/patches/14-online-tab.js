      row("العدد الكامل للمباراة", slider(2, 60, 1, OPT.netTarget, function (v) { OPT.netTarget = v; persist(); })),
      row("أقلّ عدد حقيقي للبدء", slider(1, 40, 1, OPT.netMin, function (v) { OPT.netMin = v; persist(); })),
      row("أقصى انتظار (ث)", slider(20, 600, 10, OPT.netWait, function (v) { OPT.netWait = v; persist(); })),
      el("div", { class: "rs-chips" }, [
        el("button", {
          class: "rs-chip " + (OPT.netFill !== false ? "ok" : "dz"),
          text: OPT.netFill !== false ? "🤖 أكمل النقص ببوتات" : "🚫 لاعبون حقيقيّون فقط",
          onclick: function () { OPT.netFill = OPT.netFill === false; persist(); renderPlay(); }
        })
      ]),
      el("div", { class: "rs-hint", text: "تبدأ المباراة فور اكتمال «أقلّ عدد حقيقي» — أو عند انتهاء الانتظار مهما كان العدد — ثمّ يُكمَّل الباقي بوتات حتى العدد الكامل. مثلاً: العدد الكامل ٢٥ وأقلّ عدد ١٥ يعني ١٥ لاعباً حقيقيّاً و١٠ بوتات. اجعل «أقلّ عدد» = ١ ليبدأ فوراً بلا انتظار." })