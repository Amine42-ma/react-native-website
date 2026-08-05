  /* ============================================================
     6.47) الأونلاين: ابدأ بعددٍ حقيقي وأكمل الباقي بوتات
     ------------------------------------------------------------
     كان الأونلاين ينتظر حتى يكتمل العدد كاملاً وإلّا لعبتَ وحدك، ولا
     يُنزل بوتاً واحداً مهما قلّ الناس. الآن: تبدأ المباراة فور اكتمال
     «أقلّ عدد حقيقي»، ويُكمَّل الباقي بوتات حتى العدد الكامل — فخمسة
     عشر لاعباً حقيقيّاً وعشرة بوتات تُعطيك خمسة وعشرين. وفي السكواد
     والدوو يُملأ فريقك أوّلاً حتى لا تدخل وحدك.
     ============================================================ */
  window.__ROYAL_NETBOTS__ = function (game) {
    try {
      if (OPT.netFill === false) return 0;
      var real = 1;
      try { real = Math.max(1, game.net.count()); } catch (e) { }
      var want = (OPT.netTarget || 25) - real;
      var cap = OPT.netBotCap == null ? 40 : OPT.netBotCap;
      return Math.max(0, Math.min(cap, Math.round(want)));
    } catch (e) { return 0; }
  };

  /* عدّاد «الباقون» يجب أن يشمل البوتات التي أضفناها */
  function fixAliveCount(game) {
    try {
      if (!game.net || !game.bots) return;
      var real = Math.max(1, game.net.count());
      var total = real + game.bots.length;
      game.stats.alive = total;
      game.stats.rank = total;
      game.hud.setStat("alive", total);
      game.hud.setStat("rank", "#" + total);
    } catch (e) { }
  }
