#!/usr/bin/env python3
"""Apply the readable patch sources in game/patches/ into the single-file game.

The game ships as one 30 MB HTML file: a gzipped project payload plus two
scripts, `royal-setup` (a readable patch/hook layer that runs before the
engine) and `royal-engine` (the minified engine bundle). Every improvement
here goes into the setup layer, so the exported final game — which is a
self-clone of the live document — carries them too.

usage: python3 game/build.py [--src SRC.html] [--out OUT.html]
"""
import argparse
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PATCHES = os.path.join(HERE, "patches")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def patch(name):
    return read(os.path.join(PATCHES, name)).rstrip("\n")


def splice(html, start, end, new, what):
    """Replace html[start_marker .. end_marker) with `new`, keeping end_marker."""
    i = html.find(start)
    if i < 0:
        sys.exit("build: start marker not found for %s" % what)
    j = html.find(end, i + len(start))
    if j < 0:
        sys.exit("build: end marker not found for %s" % what)
    return html[:i] + new + "\n\n" + html[j:]


def replace_once(html, old, new, what):
    n = html.count(old)
    if n != 1:
        sys.exit("build: expected exactly 1 occurrence of %s, found %d" % (what, n))
    return html.replace(old, new)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=os.path.join(HERE, "royalbattle.src.html"))
    ap.add_argument("--out", default=os.path.join(HERE, "royalbattle.html"))
    args = ap.parse_args()

    html = read(args.src)
    orig_len = len(html)

    # ---- 1) character rig: arms that really hold the gun, shoes, shadow ----
    html = splice(
        html,
        "  /* ============================================================\n     6.39.5) شكل الشخصية",
        "  /* ============================================================\n     6.40) شريطا العلاجات",
        "\n\n".join([patch("01-character.js"), patch("02-shadow.js"),
                     patch("09-zone.js"), patch("10-loot.js"), patch("11-squad.js"),
                     patch("12-voice.js"), patch("13-net.js"), patch("15-drop.js"),
                     patch("16-botai.js"), patch("03-glue.js")]),
        "character section 6.39.5",
    )

    # ---- 2) new option flags ----
    html = replace_once(
        html,
        "    ocean: true,         /* بحر واقعي */",
        patch("04-opts.js").strip("\n"),
        "OPT ocean flag",
    )

    # ---- 3) wire the new upgrades into the in-game hooks ----
    html = replace_once(
        html,
        "    try { upgradeChars(game); } catch (e) { console.warn(\"limbs\", e); }",
        "    try { upgradeChars(game); } catch (e) { console.warn(\"limbs\", e); }\n"
        "    try { upgradeShadow(game); } catch (e) { console.warn(\"shadow\", e); }\n"
        "    try { upgradeBlobs(game); } catch (e) { console.warn(\"blob\", e); }\n"
        "    try { upgradeStats(game); } catch (e) { console.warn(\"stats\", e); }\n"
        "    try { zoneStormStop(); upgradeZoneWall(game); } catch (e) { console.warn(\"zone\", e); }\n"
        "    try { squadReset(); hookNetEvents(game); } catch (e) { console.warn(\"squad\", e); }\n"
        "    try { voicePanel(game); } catch (e) { console.warn(\"voice panel\", e); }\n"
        "    try { fixAliveCount(game); } catch (e) { console.warn(\"alive\", e); }\n"
        "    try { dropInit(game); } catch (e) { console.warn(\"drop\", e); }",
        "READY hook",
    )
    html = replace_once(
        html,
        "  window.__ROYAL_FX__ = function (game, dt) {\n    try { poseChars(game, dt); } catch (e) { }",
        "  window.__ROYAL_FX__ = function (game, dt) {\n"
        "    try { poseChars(game, dt); } catch (e) { rerr(\"pose\", e); }\n"
        "    try { followShadow(game); } catch (e) { rerr(\"shadow\", e); }\n"
        "    try { syncStats(game, dt); } catch (e) { rerr(\"stats\", e); }\n"
        "    try { zoneStormFrame(game, dt); } catch (e) { rerr(\"zone\", e); }\n"
        "    try { lootFrame(game, dt); } catch (e) { rerr(\"loot\", e); }\n"
        "    try { squadFrame(game, dt); } catch (e) { rerr(\"squad\", e); }\n"
        "    try { dropFrame(game, dt); } catch (e) { rerr(\"drop\", e); }\n"
        "    try { botAiFrame(game, dt); } catch (e) { rerr(\"botai\", e); }\n"
        "    try { voiceButtonsFrame(game); } catch (e) { rerr(\"voicebtn\", e); }",
        "FX hook",
    )

    # ---- 4) sea ----
    html = splice(
        html,
        "    o.material.vertexShader = [",
        "    o.material.needsUpdate = true;\n    oceanDepth(game);",
        patch("05-ocean.js").rstrip("\n"),
        "ocean shaders",
    )
    html = replace_once(
        html,
        "      var ng = new G(size, size, 160, 160);",
        "      var ng = new G(size, size, 200, 200);\n"
        "      try { if (OPT.oceanGrid !== false) radialGrid(ng, size); } catch (e) { console.warn(\"ocean grid\", e); }",
        "ocean geometry",
    )

    # ---- 5) HUD counters: own icon, number on its own ----
    html = splice(
        html,
        "  /* ============================================================\n     6.40) شريطا العلاجات",
        "  var HEALS = [",
        patch("06-hud-stats.js").rstrip("\n") + "\n\n"
        "  /* ============================================================\n"
        "     6.40) شريطا العلاجات (يمين) والقنابل (يسار) — بأسلوب ببجي\n"
        "     ============================================================ */",
        "HUD stats section",
    )

    # ---- 6) editor controls for the new options ----
    html = replace_once(
        html,
        "    s.appendChild(el(\"div\", { class: \"rs-card\" }, [\n"
        "      el(\"h4\", { text: \"🎯 تثبيت التصويب\" }),",
        patch("08-play-tab.js").rstrip("\n") + "\n\n"
        "    s.appendChild(el(\"div\", { class: \"rs-card\" }, [\n"
        "      el(\"h4\", { text: \"🎯 تثبيت التصويب\" }),",
        "play tab cards",
    )

    # ---- 7) account backup / restore ----
    html = replace_once(
        html,
        "  window.__ROYAL_SETUP__ = function (project) {",
        patch("07-account.js").rstrip("\n") + "\n\n" +
        patch("17-credits.js").rstrip("\n") + "\n\n" +
        patch("18-bare.js").rstrip("\n") + "\n\n"
        "  window.__ROYAL_SETUP__ = function (project) {",
        "account section",
    )

    # ---- 8) online settings: minimum real players + bot fill ----
    html = splice(
        html,
        "      row(\"عدد اللاعبين\", slider(2, 25, 1, OPT.netTarget,",
        "    ]));\n\n    s.appendChild(el(\"div\", { class: \"rs-card hero\" }, [",
        patch("14-online-tab.js").rstrip("\n"),
        "online tab rows",
    )

    # ---- 9) one knob for how many people are in a match ----
    html = replace_once(
        html,
        "    if (P.match) {\n"
        "      P.match.online = !!OPT.online;\n"
        "      P.match.netWait = OPT.netWait;\n"
        "      P.match.netMinPlayers = 1;\n"
        "      P.match.lookSens = P.match.lookSens || 1;\n"
        "    }",
        "    if (P.match) {\n"
        "      P.match.online = !!OPT.online;\n"
        "      P.match.netWait = OPT.netWait;\n"
        "      P.match.netMinPlayers = 1;\n"
        "      P.match.lookSens = P.match.lookSens || 1;\n"
        "      /* عدد واحد يحكم المباراة: أنت + الباقون. أونلاين نطلب العدد\n"
        "         نفسه ونُكمل نقصه بوتات، وبلا أونلاين كلّهم بوتات. */\n"
        "      if (OPT.matchPlayers > 1) {\n"
        "        P.match.bots = Math.max(1, Math.round(OPT.matchPlayers) - 1);\n"
        "        OPT.netTarget = Math.round(OPT.matchPlayers);\n"
        "      }\n"
        "    }\n"
        "    /* زرّا الصوت يصيران زرّين من أزرار الشاشة: نُسجّلهما قبل بناء الواجهة */\n"
        "    try { registerVoiceButtons(P); } catch (e) { console.warn(\"voice btns\", e); }\n"
        "    try { registerSquadStat(P); } catch (e) { console.warn(\"squad stat\", e); }",
        "match player count + voice buttons",
    )

    # ---- 10) editor preview: an icon with no frame, like in the game ----
    html = replace_once(
        html,
        '      var n = el("div", { class: "lbb" + (lbSel === b.uid ? " sel" : "") + (b.visible ? "" : " off") });\n'
        '      n.style.background = "linear-gradient(180deg," + (b.color || "#c56bff") + "," + hexA(b.color || "#c56bff", 0.55) + ")";',
        '      var bare = OPT.bareIcons !== false && !!b.icon;\n'
        '      var n = el("div", { class: "lbb" + (lbSel === b.uid ? " sel" : "") + (b.visible ? "" : " off") + (bare ? " rs-bare" : "") });\n'
        '      if (!bare) n.style.background = "linear-gradient(180deg," + (b.color || "#c56bff") + "," + hexA(b.color || "#c56bff", 0.55) + ")";',
        "lobby preview bare",
    )

    # ---- 11) the editor must know the two new buttons by name ----
    html = replace_once(
        html,
        '    swap: "تبديل السلاح", bag: "الحقيبة", drop: "رمي السلاح", scope: "التقريب"',
        '    swap: "تبديل السلاح", bag: "الحقيبة", drop: "رمي السلاح", scope: "التقريب",\n'
        '    mic: "الميكروفون", sound: "سماع الأصدقاء"',
        "BTN labels",
    )
    html = replace_once(
        html,
        '    kills: "عدّاد القتلى", rank: "الترتيب", alive: "الباقون",',
        '    kills: "عدّاد القتلى", rank: "الترتيب", alive: "الباقون", squad: "دم الرفاق",',
        "STAT labels",
    )
    html = replace_once(
        html,
        '    zone: ["⏱️", "⏳", "🌀", "⚠️", "🔵", "☢️"]',
        '    zone: ["⏱️", "⏳", "🌀", "⚠️", "🔵", "☢️"],\n'
        '    squad: ["❤️", "🩸", "👥", "🛡️", "💚", "🤝"]',
        "squad emoji presets",
    )
    html = replace_once(
        html,
        '    } else {\n'
        '      node = el("div", { class: "hud-stat rs-w", style: "pointer-events:auto" }, [',
        '    } else if (cfg.id === "squad") {\n'
        '      /* معاينة تُشبه اللوحة الحقيقية حتى تعرف ما تسحبه */\n'
        '      node = el("div", { class: "hud-stat rs-w rsquad", style: "pointer-events:auto" });\n'
        '      [["\u0623\u0646\u062A", 1, 0.9, "#5cff8d"],\n'
        '       ["\u0635\u062F\u064A\u0642 \u0661", 0, 0.7, "#7fe4ff"],\n'
        '       ["\u0635\u062F\u064A\u0642 \u0662", 0, 0.45, "#7fe4ff"],\n'
        '       ["\u0635\u062F\u064A\u0642 \u0663", 0, 0.2, "#ff6b7b"]].forEach(function (r2) {\n'
        '        node.appendChild(el("div", { class: "sq " + (r2[1] ? "me" : "mate") }, [\n'
        '          el("span", { class: "dot", style: r2[1] ? "" : "background:#25d3ff" }),\n'
        '          el("span", { class: "nm", text: r2[0] }),\n'
        '          el("div", { class: "bar" }, [el("i", { style: "transform:scaleX(" + r2[2] + ");background:" + r2[3] })]),\n'
        '          el("span", { class: "hp", text: String(Math.round(r2[2] * 100)) })\n'
        '        ]));\n'
        '      });\n'
        '      node.style.left = (cfg.x * s.w) + "px";\n'
        '      node.style.top = (cfg.y * s.h) + "px";\n'
        '      node.style.transform = "translate(-50%,-50%) scale(" + ((cfg.size || 1) * clamp(hudScale(), 0.7, 1.5)) + ")";\n'
        '    } else {\n'
        '      node = el("div", { class: "hud-stat rs-w", style: "pointer-events:auto" }, [',
        "squad editor preview",
    )
    html = replace_once(
        html,
        '    scope: ["🔭", "🔍", "🎯", "👁️", "🔬", "📡"],',
        '    scope: ["🔭", "🔍", "🎯", "👁️", "🔬", "📡"],\n'
        '    mic: ["🎤", "🗣️", "📢", "🔴", "🎙️", "🚫"],\n'
        '    sound: ["🔊", "👂", "🎧", "🔉", "🔔", "🔇"],',
        "EMOJI presets",
    )

    # ---- 12) lobby buttons were capped at 45% wide / 40% tall ----
    # The play button could not be made big; the cap lived only in the two
    # editor sliders, nothing in the renderer limits it.
    html = replace_once(
        html,
        '    box.appendChild(row("العرض", slider(0.04, 0.45, 0.005, b.w, function (v) { b.w = v; persist(); drawLobbyPreview(pv); })));\n'
        '    box.appendChild(row("الطول", slider(0.05, 0.4, 0.005, b.h, function (v) { b.h = v; persist(); drawLobbyPreview(pv); })));',
        '    box.appendChild(row("العرض", slider(0.04, 1.6, 0.005, b.w, function (v) { b.w = v; persist(); drawLobbyPreview(pv); })));\n'
        '    box.appendChild(row("الطول", slider(0.05, 1.6, 0.005, b.h, function (v) { b.h = v; persist(); drawLobbyPreview(pv); })));\n'
        '    box.appendChild(el("div", { class: "rs-hint", text: "المُنزلق يصل الآن إلى أضعاف عرض الشاشة — كبّر زرّ اللعب كما تشاء. ولو أردت رقماً أدقّ فاكتبه في الخانتين تحت." }));\n'
        '    box.appendChild(row("العرض (رقماً)", numBox(b.w, function (v) { b.w = v; persist(); drawLobbyPreview(pv); })));\n'
        '    box.appendChild(row("الطول (رقماً)", numBox(b.h, function (v) { b.h = v; persist(); drawLobbyPreview(pv); })));',
        "lobby size sliders",
    )
    # a plain number box, so no slider range can ever cage him again
    html = replace_once(
        html,
        "  function lbButtons() { return (P.lobby && P.lobby.buttons) || []; }",
        "  function lbButtons() { return (P.lobby && P.lobby.buttons) || []; }\n"
        "\n"
        "  /* خانة رقم حرّة: المُنزلق مهما اتّسع يبقى له طرف، وهذه بلا طرف */\n"
        "  function numBox(val, onChange) {\n"
        "    var i = el(\"input\", { type: \"number\", class: \"rs-txt\", dir: \"ltr\",\n"
        "      step: \"0.01\", min: \"0.01\", value: String(Math.round(val * 1000) / 1000) });\n"
        "    i.oninput = function () {\n"
        "      var v = parseFloat(i.value);\n"
        "      if (isFinite(v) && v > 0) onChange(v);\n"
        "    };\n"
        "    return i;\n"
        "  }",
        "lobby number box",
    )

    # ---- 13) two surgical edits inside the minified engine ----
    # Online matches spawned zero bots, so a half-full lobby meant an empty
    # island. Route the count through a hook the setup layer owns.
    html = replace_once(
        html,
        "let e=this.net?0:this.P.match.bots,",
        "let e=this.net?((window.__ROYAL_NETBOTS__&&window.__ROYAL_NETBOTS__(this))||0):this.P.match.bots,",
        "buildBots online bot count",
    )
    # Start once enough *real* players have joined (netMin), not only when the
    # lobby is completely full; bots fill the rest.
    html = replace_once(
        html,
        "b>=((window.__ROYAL_OPT__&&window.__ROYAL_OPT__.netTarget)||99)&&_()",
        "b>=((window.__ROYAL_OPT__&&(window.__ROYAL_OPT__.netMin||window.__ROYAL_OPT__.netTarget))||99)&&_()",
        "matchmaking start threshold",
    )

    with open(args.out, "w", encoding="utf-8") as f:
        f.write(html)
    print("build: %s -> %s (%d -> %d bytes, %+d)"
          % (os.path.basename(args.src), os.path.basename(args.out),
             orig_len, len(html), len(html) - orig_len))


if __name__ == "__main__":
    main()
