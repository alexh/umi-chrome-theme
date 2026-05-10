#!/usr/bin/env python3
"""Build all promo + screenshot images via ImageMagick `magick`.

1990s technical-documentation aesthetic: flat near-black ground, hairline
rule grid, crop marks at corners, spec-sheet metadata strips, tabular
palette with numbered callouts, no decorative gradients or shadows.
"""

import subprocess
from pathlib import Path

ROOT   = Path(__file__).resolve().parent.parent
MEDIA  = ROOT / "media"
DIST   = ROOT / "dist" / "screenshots"

# Fonts (Monaspace Krypton family)
F_HEAVY = "/usr/share/fonts/OTF/MonaspaceKrypton-WideExtraBold.otf"
F_BOLD  = "/usr/share/fonts/OTF/MonaspaceKrypton-Bold.otf"
F_MED   = "/usr/share/fonts/OTF/MonaspaceKrypton-WideMedium.otf"
F_LABEL = "/usr/share/fonts/OTF/MonaspaceKrypton-SemiBold.otf"
F_REG   = "/usr/share/fonts/OTF/MonaspaceKrypton-Regular.otf"
F_MONO  = "/usr/share/fonts/OTF/MonaspaceKrypton-Bold.otf"

GEAR    = Path("/tmp/gear-clean.png")
SCREEN  = DIST / "final-1.png"

# Palette
BG     = "#0a0a0a"   # flat industrial black, slightly warmed
FG     = "#fbf1c7"   # cream / bone
ORANGE = "#FF6700"
DIM    = "#766c50"   # warm grey for metadata
RULE   = "#2a2520"   # very dim hairline

PALETTE = [
    ("01", "#1a1a1a", "FRAME",   "CHARCOAL · BROWSER FRAME"),
    ("02", "#2a1c12", "TOOLBAR", "WARM · TOOLBAR + BUTTONS"),
    ("03", "#FF6700", "STATE",   "PANTONE 165 · ACTIVE STATES"),
    ("04", "#FF4500", "HOVER",   "BRIGHT · HOVER + LINK"),
    ("05", "#fbf1c7", "CREAM",   "BONE · PRIMARY FOREGROUND"),
    ("06", "#d5c4a1", "STEEL",   "WHEAT · SECONDARY TEXT"),
    ("07", "#a89984", "DIM",     "ASH · TERTIARY · METADATA"),
]


def run(args: list[str]) -> None:
    subprocess.run(["magick"] + args, check=True)


def crop_marks(W: int, H: int, inset: int = 24, arm: int = 22, color: str = DIM) -> list[str]:
    """L-shaped registration marks at all four corners, hairline."""
    return [
        "-strokewidth", "1", "-stroke", color,
        "-draw", f"line {inset},{inset} {inset},{inset+arm}",
        "-draw", f"line {inset},{inset} {inset+arm},{inset}",
        "-draw", f"line {W-inset},{inset} {W-inset},{inset+arm}",
        "-draw", f"line {W-inset-arm},{inset} {W-inset},{inset}",
        "-draw", f"line {inset},{H-inset} {inset},{H-inset-arm}",
        "-draw", f"line {inset},{H-inset} {inset+arm},{H-inset}",
        "-draw", f"line {W-inset},{H-inset} {W-inset},{H-inset-arm}",
        "-draw", f"line {W-inset-arm},{H-inset} {W-inset},{H-inset}",
    ]


def hairline(x1: int, y1: int, x2: int, y2: int, color: str = RULE, w: float = 0.5) -> list[str]:
    return ["-strokewidth", str(w), "-stroke", color,
            "-draw", f"line {x1},{y1} {x2},{y2}", "-stroke", "none"]


def text(x: int, y: int, font: str, size: int, fill: str, content: str,
         gravity: str = "northwest") -> list[str]:
    """Add a text annotation at exact pixel offset (gravity northwest)."""
    return ["-font", font, "-pointsize", str(size), "-fill", fill,
            "-stroke", "none", "-gravity", gravity, "-annotate",
            f"{'+' if x >= 0 else ''}{x}{'+' if y >= 0 else ''}{y}", content]


def filled_rect(x1: int, y1: int, x2: int, y2: int, fill: str, stroke: str = DIM, w: float = 0.5) -> list[str]:
    return ["-fill", fill, "-strokewidth", str(w), "-stroke", stroke,
            "-draw", f"rectangle {x1},{y1} {x2},{y2}",
            "-fill", "none", "-stroke", "none"]


# ─── PALETTE CARD 1280×800 ────────────────────────────────────────────────
def build_palette_card(out: Path) -> None:
    W, H = 1280, 800
    args: list[str] = ["-size", f"{W}x{H}", f"xc:{BG}"]

    args += crop_marks(W, H)

    # top + bottom hairline rules
    args += hairline(80, 84, W - 80, 84)
    args += hairline(80, H - 84, W - 80, H - 84)

    # mid-section rules
    args += hairline(80, 378, W - 80, 378)

    # top metadata strip
    args += text(80, 62, F_LABEL, 11, DIM, "UTILITY MATERIALS  ·  CHROME THEME")
    args += text(-80, 62, F_LABEL, 11, DIM, "SPEC.001    REV.A    2026.05", gravity="northeast")

    # bottom colophon
    args += text(80, H - 50, F_LABEL, 11, DIM, "© 2026 UTILITY MATERIALS INC.")
    args += text(-80, H - 50, F_LABEL, 11, DIM, "THEMES.UTILITY.MATERIALS.NYC", gravity="northeast")
    args += text(0, H - 50, F_LABEL, 11, DIM, "NEW YORK", gravity="north")

    # gear (right side, dimmed) with callout
    if GEAR.exists():
        args += ["(", str(GEAR), "-resize", "260x260",
                 "-channel", "A", "-evaluate", "multiply", "0.55", "+channel",
                 ")", "-gravity", "northwest", "-geometry", "+860+128", "-composite"]
        # callout leader line + label
        args += hairline(820, 178, 870, 178, DIM, 0.5)
        args += text(820, 158, F_LABEL, 9, DIM, "№ 01")
        args += text(820, 172, F_REG, 9, DIM, "BRAND MARK")

    # wordmark (left, big)
    args += text(80, 110, F_HEAVY, 96, FG, "UTILITY")
    args += text(80, 220, F_HEAVY, 96, FG, "MATERIALS")

    # short orange rule above subtitle
    args += ["-strokewidth", "2", "-stroke", ORANGE,
             "-draw", "line 82,326 180,326", "-stroke", "none"]
    args += text(80, 332, F_MED, 18, ORANGE, "A CHROME THEME")

    # palette section header
    args += text(80, 408, F_LABEL, 11, ORANGE, "02 / COLOR SYSTEM")
    args += text(280, 408, F_LABEL, 9, DIM, "SEVEN ROLES · IDENTIFIED BY HEX")

    # column headers
    yh = 446
    args += text(80,  yh, F_LABEL, 9, DIM, "№")
    args += text(140, yh, F_LABEL, 9, DIM, "SWATCH")
    args += text(208, yh, F_LABEL, 9, DIM, "HEX")
    args += text(312, yh, F_LABEL, 9, DIM, "ROLE")
    args += text(416, yh, F_LABEL, 9, DIM, "DESCRIPTION")
    args += hairline(80, yh + 16, W - 80, yh + 16, DIM, 0.5)

    # palette rows
    for idx, (num, hex_, name, desc) in enumerate(PALETTE):
        y = 478 + idx * 32
        args += text(80,  y + 4, F_REG,   11, DIM,   num)
        args += filled_rect(140, y, 178, y + 22, hex_, DIM, 0.5)
        args += text(208, y + 4, F_MONO,  11, FG,    hex_)
        args += text(312, y + 4, F_LABEL, 11, FG,    name)
        args += text(416, y + 4, F_REG,   10, DIM,   desc)
        # row separator
        args += hairline(80, y + 28, W - 80, y + 28, RULE, 0.3)

    args.append(str(out))
    run(args)
    print(f"  wrote {out.relative_to(ROOT)}")


# ─── THEME TILE 440×280 ───────────────────────────────────────────────────
def build_theme_tile(out: Path) -> None:
    W, H = 440, 280
    args: list[str] = ["-size", f"{W}x{H}", f"xc:{BG}"]
    args += crop_marks(W, H, inset=14, arm=12)

    # top + bottom hairlines define the "page area"
    args += hairline(40, 38, W - 40, 38)
    args += hairline(40, H - 38, W - 40, H - 38)

    # top metadata
    args += text(40, 26, F_LABEL, 8, DIM, "UTILITY MATERIALS  ·  CHROME THEME")
    args += text(-40, 26, F_LABEL, 8, DIM, "SPEC.001  REV.A", gravity="northeast")

    # bottom colophon
    args += text(40, H - 30, F_LABEL, 8, DIM, "© 2026 UMI INC.")
    args += text(-40, H - 30, F_LABEL, 8, DIM, "NEW YORK", gravity="northeast")

    # gear at right side, smaller so it doesn't crowd the wordmark
    if GEAR.exists():
        args += ["(", str(GEAR), "-resize", "120x120",
                 "-channel", "A", "-evaluate", "multiply", "0.45", "+channel",
                 ")", "-gravity", "east", "-geometry", "+34+0", "-composite"]

    # Wordmark: 26pt fits inside a 260px text column without bleeding past
    # the gear. "MATERIALS" at 26pt WideExtraBold ≈ 200px wide.
    args += text(40, 92, F_HEAVY, 26, FG, "UTILITY")
    args += text(40, 122, F_HEAVY, 26, FG, "MATERIALS")
    args += ["-strokewidth", "1.5", "-stroke", ORANGE,
             "-draw", f"line 42,170 110,170", "-stroke", "none"]
    args += text(40, 178, F_MED, 11, ORANGE, "A CHROME THEME")

    args.append(str(out))
    run(args)
    print(f"  wrote {out.relative_to(ROOT)}")


# ─── THEME MARQUEE 1400×560 ───────────────────────────────────────────────
def build_theme_marquee(out: Path) -> None:
    W, H = 1400, 560
    args: list[str] = ["-size", f"{W}x{H}", f"xc:{BG}"]
    args += crop_marks(W, H, inset=24, arm=22)

    args += hairline(80, 76, W - 80, 76)
    args += hairline(80, H - 72, W - 80, H - 72)

    args += text(80, 54, F_LABEL, 12, DIM, "UTILITY MATERIALS  ·  CHROME THEME")
    args += text(-80, 54, F_LABEL, 12, DIM, "SPEC.001    REV.A    2026.05", gravity="northeast")

    args += text(80, H - 56, F_LABEL, 11, DIM, "© 2026 UTILITY MATERIALS INC.")
    args += text(0, H - 56, F_LABEL, 11, DIM, "NEW YORK", gravity="north")
    args += text(-80, H - 56, F_LABEL, 11, DIM, "THEMES.UTILITY.MATERIALS.NYC", gravity="northeast")

    # Gear right-side, sized to leave clearance for stacked wordmark.
    # Wordmark column gets ~880px on the left, gear column ~340px on the right.
    if GEAR.exists():
        args += ["(", str(GEAR), "-resize", "320x320",
                 "-channel", "A", "-evaluate", "multiply", "0.38", "+channel",
                 ")", "-gravity", "east", "-geometry", "+100+0", "-composite"]
        args += hairline(960, 388, 1020, 388, DIM, 0.5)
        args += text(960, 366, F_LABEL, 10, DIM, "№ 01")
        args += text(960, 380, F_REG, 10, DIM, "BRAND MARK")

    # Stacked wordmark: each line ≈ 700px wide at 90pt, fits in 880px column.
    args += text(80, 138, F_HEAVY, 90, FG, "UTILITY")
    args += text(80, 244, F_HEAVY, 90, FG, "MATERIALS")
    args += ["-strokewidth", "2.5", "-stroke", ORANGE,
             "-draw", "line 82,360 280,360", "-stroke", "none"]
    args += text(80, 368, F_MED, 22, ORANGE, "A CHROME THEME")
    args += text(80, 412, F_REG, 12, DIM,
                 "CHARCOAL FRAME · ORANGE STATE · MONOSPACE-FORWARD TYPE")

    # Compact palette row at bottom-left (4 specimens, doesn't reach the gear)
    specs = [
        ("01", "#1a1a1a", "FRAME"),
        ("02", "#2a1c12", "TOOLBAR"),
        ("03", "#FF6700", "STATE"),
        ("04", "#fbf1c7", "CREAM"),
    ]
    sx = 80
    sy = 452
    for i, (num, hex_, name) in enumerate(specs):
        x = sx + i * 130
        args += text(x, sy - 16, F_LABEL, 9, DIM, f"№ {num}")
        args += filled_rect(x, sy, x + 48, sy + 36, hex_, DIM, 0.5)
        args += text(x + 56, sy + 6, F_LABEL, 10, FG, name)
        args += text(x + 56, sy + 22, F_MONO, 9, DIM, hex_)

    args.append(str(out))
    run(args)
    print(f"  wrote {out.relative_to(ROOT)}")


# ─── NTP TILE 440×280 ─────────────────────────────────────────────────────
def build_ntp_tile(out: Path) -> None:
    W, H = 440, 280
    args: list[str] = ["-size", f"{W}x{H}", f"xc:{BG}"]
    args += crop_marks(W, H, inset=14, arm=12)

    args += hairline(40, 38, W - 40, 38)
    args += hairline(40, H - 38, W - 40, H - 38)

    args += text(40, 26, F_LABEL, 8, DIM, "UTILITY MATERIALS  ·  NEW TAB")
    args += text(-40, 26, F_LABEL, 8, DIM, "v0.4.3", gravity="northeast")

    args += text(40, H - 30, F_LABEL, 8, DIM, "© 2026 UMI INC.")
    args += text(-40, H - 30, F_LABEL, 8, DIM, "NEW YORK", gravity="northeast")

    # Layout math: tile 440 wide. Text column 40-220 (180px) for "MATERIALS"
    # at 22pt ≈ 175px. Screenshot column 240-416 (176px wide). 20px gap.
    if SCREEN.exists():
        args += ["(", str(SCREEN), "-resize", "176x",
                 "-bordercolor", DIM, "-border", "1",
                 ")", "-gravity", "east", "-geometry", "+22+0", "-composite"]

    args += text(40, 92, F_HEAVY, 22, FG, "UTILITY")
    args += text(40, 118, F_HEAVY, 22, FG, "MATERIALS")
    args += ["-strokewidth", "1.5", "-stroke", ORANGE,
             "-draw", f"line 42,156 100,156", "-stroke", "none"]
    args += text(40, 164, F_MED, 11, ORANGE, "NEW TAB")
    args += text(40, 186, F_REG, 9, DIM, "COMMAND CENTER")

    args.append(str(out))
    run(args)
    print(f"  wrote {out.relative_to(ROOT)}")


# ─── NTP MARQUEE 1400×560 ─────────────────────────────────────────────────
def build_ntp_marquee(out: Path) -> None:
    W, H = 1400, 560
    args: list[str] = ["-size", f"{W}x{H}", f"xc:{BG}"]
    args += crop_marks(W, H, inset=24, arm=22)

    args += hairline(80, 76, W - 80, 76)
    args += hairline(80, H - 72, W - 80, H - 72)

    args += text(80, 54, F_LABEL, 12, DIM, "UTILITY MATERIALS  ·  NEW TAB OVERRIDE")
    args += text(-80, 54, F_LABEL, 12, DIM, "v0.4.3    REV.A    2026.05", gravity="northeast")

    args += text(80, H - 56, F_LABEL, 11, DIM, "© 2026 UTILITY MATERIALS INC.")
    args += text(0, H - 56, F_LABEL, 11, DIM, "NEW YORK", gravity="north")
    args += text(-80, H - 56, F_LABEL, 11, DIM, "THEMES.UTILITY.MATERIALS.NYC", gravity="northeast")

    # screenshot on right, with hairline frame
    if SCREEN.exists():
        args += ["(", str(SCREEN), "-resize", "780x",
                 "-bordercolor", DIM, "-border", "1",
                 ")", "-gravity", "east", "-geometry", "+90+0", "-composite"]

    args += text(80, 138, F_HEAVY, 60, FG, "UTILITY")
    args += text(80, 200, F_HEAVY, 60, FG, "MATERIALS")
    args += ["-strokewidth", "2", "-stroke", ORANGE,
             "-draw", "line 82,278 240,278", "-stroke", "none"]
    args += text(80, 286, F_MED, 18, ORANGE, "NEW TAB COMMAND CENTER")

    # spec list
    specs = [
        "01    ANALOG CHRONOMETER + DIGITAL READOUT",
        "02    ATMOSPHERIC · OPEN-METEO + IP GEOLOCATION",
        "03    SOLAR ARC · SUNRISE / SUNSET",
        "04    LIVE CPU + MEMORY · CHROME.SYSTEM",
        "05    NETWORK PING + CONNECTION TYPE",
        "06    SYSTEM STATUS · ONLINE / VIEWPORT / LOCALE",
    ]
    for i, line in enumerate(specs):
        args += text(80, 332 + i * 18, F_REG, 11, DIM, line)

    args.append(str(out))
    run(args)
    print(f"  wrote {out.relative_to(ROOT)}")


def main() -> None:
    print("Building 1990s spec-sheet promo images…")
    MEDIA.mkdir(exist_ok=True)
    (MEDIA / "screenshots").mkdir(exist_ok=True)
    (MEDIA / "promo").mkdir(exist_ok=True)
    build_palette_card(MEDIA / "screenshots" / "theme-palette-1280x800.png")
    build_theme_tile(MEDIA / "promo" / "theme-tile-440x280.png")
    build_theme_marquee(MEDIA / "promo" / "theme-marquee-1400x560.png")
    build_ntp_tile(MEDIA / "promo" / "ntp-tile-440x280.png")
    build_ntp_marquee(MEDIA / "promo" / "ntp-marquee-1400x560.png")
    print("Done.")


if __name__ == "__main__":
    main()
