"""Deterministic SVG artwork for seeded product imagery.

Real photography would require binary assets; instead the seed command writes
generated SVG so the storefront looks finished offline and the repository stays
free of large files. Replace ``image`` on a product through Django admin or the
staff API to use real photos.
"""

from __future__ import annotations

GLYPHS: dict[str, str] = {
    "headphones": """
        <path d="M300 480a150 150 0 0 1 300 0" />
        <rect x="268" y="470" width="62" height="132" rx="30" />
        <rect x="570" y="470" width="62" height="132" rx="30" />
    """,
    "watch": """
        <rect x="362" y="300" width="176" height="290" rx="58" />
        <rect x="398" y="222" width="104" height="82" rx="26" />
        <rect x="398" y="588" width="104" height="82" rx="26" />
        <path d="M450 392v52l38 24" />
    """,
    "laptop": """
        <rect x="300" y="312" width="300" height="196" rx="16" />
        <path d="M262 552h376l26 46H236z" />
        <path d="M420 575h60" />
    """,
    "lamp": """
        <path d="M450 286 352 520h196z" />
        <path d="M450 520v70" />
        <path d="M392 596h116" />
        <path d="M406 640h88" />
    """,
    "dumbbell": """
        <path d="M330 450h240" />
        <rect x="286" y="374" width="54" height="152" rx="20" />
        <rect x="560" y="374" width="54" height="152" rx="20" />
        <rect x="252" y="412" width="34" height="76" rx="14" />
        <rect x="614" y="412" width="34" height="76" rx="14" />
    """,
    "bag": """
        <rect x="316" y="392" width="268" height="212" rx="34" />
        <path d="M382 392v-40a68 68 0 0 1 136 0v40" />
        <path d="M316 470h268" />
    """,
    "box": """
        <path d="M450 292l160 88v176l-160 88-160-88V380z" />
        <path d="M290 380l160 90 160-90" />
        <path d="M450 470v174" />
    """,
}

_SPECK_POSITIONS = [
    (150, 700, 190),
    (760, 170, 240),
    (700, 730, 120),
    (170, 160, 140),
]


def glyph_markup(key: str, variant: int = 0) -> str:
    shape = GLYPHS.get(key) or GLYPHS["box"]
    rotate = -5 if variant % 3 == 0 else (0 if variant % 3 == 1 else 5)
    shift = (variant % 3) * 8 - 8
    return (
        f'<g fill="none" stroke="#ffffff" stroke-width="17" '
        f'stroke-linecap="round" stroke-linejoin="round" opacity="0.9" '
        f'transform="translate(0 {shift}) rotate({rotate} 450 450)">'
        f"{shape}</g>"
    )


def product_art(
    deep: str,
    accent: str,
    glyph: str = "box",
    variant: int = 0,
    title: str = "",
) -> str:
    """Return a 900x900 SVG string: gradient field, light specks, product glyph."""
    cx, cy, r = _SPECK_POSITIONS[variant % len(_SPECK_POSITIONS)]
    safe_title = (
        title.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900" width="900" height="900" role="img" aria-label="{safe_title}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{deep}" />
      <stop offset="1" stop-color="{accent}" />
    </linearGradient>
    <radialGradient id="glow" cx="0.32" cy="0.24" r="0.72">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.22" />
      <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="900" height="900" fill="url(#bg)" />
  <rect width="900" height="900" fill="url(#glow)" />
  <circle cx="{cx}" cy="{cy}" r="{r}" fill="#ffffff" fill-opacity="0.06" />
  <circle cx="450" cy="450" r="292" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2" />
  <circle cx="450" cy="450" r="332" fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="2" />
  {glyph_markup(glyph, variant)}
</svg>
"""
