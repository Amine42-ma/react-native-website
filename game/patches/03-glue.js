  /* ضرر البوت من سلاحه: نصف ضرر اللاعب تقريباً مع تلاشٍ بالمسافة */
  window.__ROYAL_BOTDMG__ = function (game, s, dist) {
    try {
      if (!OPT.botGunDmg) return 4 + Math.random() * 5;
      var d = s && (s.__gun || s.gun);
      var base = (d && d.damage) || 12;
      var far = 1 - Math.min(0.55, (dist || 20) / 120);
      var v = base * 0.5 * far * (0.85 + Math.random() * 0.3);
      return Math.max(3, Math.min(30, v));
    } catch (e) { return 6; }
  };

  /* لا يذهبون خارج الزون: نسحب هدفهم إلى داخله */
  window.__ROYAL_BOTTGT__ = function (game, s) {
    try {
      if (!OPT.botZone) return;
      var z = game.zone; if (!z || !z.r) return;
      var safe = Math.max(6, z.r * 0.72);
      var dx = s.target.x - z.cx, dz = s.target.z - z.cz;
      var d = Math.hypot(dx, dz);
      if (d > safe) {
        var k = safe / (d || 1);
        s.target.x = z.cx + dx * k;
        s.target.z = z.cz + dz * k;
      }
      /* وإن كان هو نفسه خارج الزون فليركض للمركز فوراً */
      var od = Math.hypot(s.pos.x - z.cx, s.pos.z - z.cz);
      if (od > z.r * 0.98) {
        var f = Math.max(0.15, (z.r * 0.55) / (od || 1));
        s.target.x = z.cx + (s.pos.x - z.cx) * f;
        s.target.z = z.cz + (s.pos.z - z.cz) * f;
        s.retarget = s.t + 2.5;
      }
    } catch (e) { }
  };

  function poseChars(game, dt) {
    if (!OPT.charLimbs) return;
    var def = null;
    try { def = (game.inv && game.inv.gun && game.inv.gun.def) || null; } catch (e) { }
    if (game.player) poseLimbs(game, game.player, dt, def);
    if (OPT.botLimbs && game.bots) for (var i = 0; i < game.bots.length; i++) {
      var b = game.bots[i];
      if (b.ch && b.ch.group.visible) poseLimbs(game, b.ch, dt, b.gun || null);
    }
  }
