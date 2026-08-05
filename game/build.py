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
                     patch("09-zone.js"), patch("03-glue.js")]),
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
        "    try { zoneStormStop(); upgradeZoneWall(game); } catch (e) { console.warn(\"zone\", e); }",
        "READY hook",
    )
    html = replace_once(
        html,
        "  window.__ROYAL_FX__ = function (game, dt) {\n    try { poseChars(game, dt); } catch (e) { }",
        "  window.__ROYAL_FX__ = function (game, dt) {\n    try { poseChars(game, dt); } catch (e) { }\n"
        "    try { followShadow(game); } catch (e) { }\n"
        "    try { syncStats(game, dt); } catch (e) { }\n"
        "    try { zoneStormFrame(game, dt); } catch (e) { }",
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
        patch("07-account.js").rstrip("\n") + "\n\n"
        "  window.__ROYAL_SETUP__ = function (project) {",
        "account section",
    )

    with open(args.out, "w", encoding="utf-8") as f:
        f.write(html)
    print("build: %s -> %s (%d -> %d bytes, %+d)"
          % (os.path.basename(args.src), os.path.basename(args.out),
             orig_len, len(html), len(html) - orig_len))


if __name__ == "__main__":
    main()
