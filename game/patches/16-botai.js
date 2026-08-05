  /* ============================================================
     6.49) الخصوم يفتحون الصناديق ويلتقطون الغنائم
     ------------------------------------------------------------
     كان الخصم يدور في الخريطة دوراناً عشوائياً ولا يرى صندوقاً ولا
     غنيمة. الآن يقصد أقرب صندوق لم يُفتح أو أقرب غنيمة، فإذا وصل فتح
     الصندوق (فتظهر غنائمه للجميع) أو التقط الغنيمة — وإن كانت سلاحاً
     أفضل من سلاحه بدّله به. فتصير الجزيرة حيّة: صناديق تُفتح من حولك
     وأصوات تدلّك على مَن يقترب.
     ============================================================ */
  var BAI = { t: 0 };

  function botLootList(game) {
    var defs = (game.wdefs || []).filter(function (d) { return d && d.kind !== "rpg"; });
    var out = [];
    if (defs.length) {
      var w = defs[(Math.random() * defs.length) | 0];
      out.push({ t: "weapon", def: w });
      out.push({ t: "ammo", kind: w.ammo, n: (w.mag || 10) * 2 });
    }
    if (Math.random() < 0.6) out.push({ t: "item", kind: "heal", n: 1 });
    if (Math.random() < 0.4) out.push({ t: "item", kind: "shield", n: 1 });
    if (Math.random() < 0.3) out.push({ t: "item", kind: "nade", n: 1 });
    return out;
  }

  /* نفتح الصندوق كما يفتحه اللاعب تماماً: نفس العلَم ونفس حركة الغطاء */
  function botOpenCrate(game, crate) {
    if (!crate || crate.opened) return;
    crate.opened = true;
    game._crateDirty = true;
    try {
      var d = game.detailPool && game.detailPool.find(function (c) { return c.crate === crate; });
      if (d && d.action) { d.action.reset(); d.action.play(); }
    } catch (e) { }
    try {
      if (game.spawnPickup) {
        var out = botLootList(game);
        for (var i = 0; i < out.length; i++) {
          var a = (i / out.length) * 6.2832;
          game.spawnPickup(crate.x + Math.cos(a) * 1.5, crate.y + 1.3, crate.z + Math.sin(a) * 1.5, out[i]);
        }
      }
    } catch (e) { rerr("botCrate", e); }
  }

  /* الخصم يلتقط: يختفي المجسّم، ويرقّي سلاحه إن كان أطول مدى */
  function botTake(game, bot, L) {
    try {
      var pay = L.payload || {};
      if (pay.t === "weapon" && pay.def && bot.ch && bot.ch.mounts) {
        var cur = bot.gun || bot.__gun;
        var better = !cur || (pay.def.damage || 0) > (cur.damage || 0);
        if (better && game.cloneGun) {
          var host = (bot.ch.__limbs && bot.ch.__limbs.rig) || bot.ch.mounts.hand;
          while (host.children.length) host.remove(host.children[0]);
          var m = game.cloneGun(pay.def);
          m.position.set(0, 0, 0);
          m.rotation.set(pay.def.hold.rx, pay.def.hold.ry + (OPT.gunFlip ? Math.PI : 0), pay.def.hold.rz);
          m.traverse(function (o) { if (o.isMesh) { o.castShadow = !!OPT.shadow; o.frustumCulled = false; } });
          host.add(m);
          bot.gun = bot.__gun = pay.def;
        }
      }
      game.scene.remove(L.mesh);
      var k = game.loot.indexOf(L);
      if (k >= 0) game.loot.splice(k, 1);
    } catch (e) { rerr("botTake", e); }
  }

  /* يُنادى من خطّاف اختيار هدف الخصم: نُبدّل الوجهة العشوائيّة بغرض */
  function botSeek(game, s) {
    if (OPT.botLoot === false || !s || !s.target || s.state === "fight") return false;
    var best = null, bestD = 1e9, kind = null;
    var i, d;
    /* أقرب غنيمة أوّلاً — أقرب مكسب */
    if (game.loot) {
      for (i = 0; i < game.loot.length; i++) {
        var L = game.loot[i];
        if (!L || !L.mesh) continue;
        d = Math.hypot(L.mesh.position.x - s.pos.x, L.mesh.position.z - s.pos.z);
        if (d < 45 && d < bestD) { bestD = d; best = L.mesh.position; kind = "loot"; }
      }
    }
    if (!best && game.crates) {
      for (i = 0; i < game.crates.length; i++) {
        var c = game.crates[i];
        if (!c || c.opened) continue;
        d = Math.hypot(c.x - s.pos.x, c.z - s.pos.z);
        if (d < 85 && d < bestD) { bestD = d; best = c; kind = "crate"; }
      }
    }
    if (!best) return false;
    s.target.x = best.x;
    s.target.z = best.z;
    s.__seek = kind;
    return true;
  }

  /* كلّ ربع ثانية: مَن وصل هدفه فليفتح أو يلتقط */
  function botAiFrame(game, dt) {
    if (OPT.botLoot === false || !game.bots || game.phase !== "ground") return;
    BAI.t -= dt;
    if (BAI.t > 0) return;
    BAI.t = 0.25;
    for (var i = 0; i < game.bots.length; i++) {
      var b = game.bots[i];
      if (!b || !b.alive || !b.landed || b.state === "fight") continue;
      var j, d;
      if (game.crates) {
        for (j = 0; j < game.crates.length; j++) {
          var c = game.crates[j];
          if (!c || c.opened) continue;
          d = Math.hypot(c.x - b.pos.x, c.z - b.pos.z);
          if (d < 2.8) { botOpenCrate(game, c); b.retarget = 0; break; }
        }
      }
      if (game.loot) {
        for (j = game.loot.length - 1; j >= 0; j--) {
          var L = game.loot[j];
          if (!L || !L.mesh) continue;
          d = Math.hypot(L.mesh.position.x - b.pos.x, L.mesh.position.z - b.pos.z);
          if (d < 1.9) { botTake(game, b, L); b.retarget = 0; }
        }
      }
    }
  }
