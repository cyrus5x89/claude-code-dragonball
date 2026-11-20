# hooks/scenes.ts: cảnh nền Claude Dragonball cho app desktop (mod), một cảnh gốc + một cảnh mỗi mức effort
# python3 make_scenes.py
import base64, io, json, math, pathlib
from PIL import Image

HERE = pathlib.Path(__file__).parent
LEVELS = ["low", "medium", "high", "xhigh", "max", "ultracode"]
AURA = {"low": "#F2C230", "medium": "#C98A0B", "high": "#FFD84D", "xhigh": "#E0384F", "max": "#2FA8F0", "ultracode": "#D8DEE9"}
STILL = "@media (prefers-reduced-motion: reduce) { * { animation: none !important } }"
CSS = (".ball{animation:pulse 6s ease-in-out infinite alternate}"
       ".aura{transform-origin:1330px 800px;animation:breathe 9s ease-in-out infinite alternate}"
       "@keyframes pulse{from{opacity:.55}to{opacity:1}}@keyframes breathe{from{transform:scale(.94);opacity:.7}to{transform:scale(1.06);opacity:1}}")


def balls():
    # 7 viên ngọc xếp vòng cung quanh góc dưới phải, viên thứ n có n sao
    out = []
    for i in range(7):
        a = math.radians(198 + i * 24)
        x, y = 1320 + 240 * math.cos(a), 800 + 240 * math.sin(a)
        stars = "".join(f'<text x="{x + (k - i / 2) * 9:.0f}" y="{y + 5:.0f}" font-size="13" fill="#C0392B" text-anchor="middle">★</text>'
                        for k in range(i + 1))
        out.append(f'<g class="ball" style="animation-delay:-{i * 0.8:.1f}s" opacity=".5"><circle cx="{x:.0f}" cy="{y:.0f}" r="26" fill="url(#orb)"/>{stars}</g>')
    return "".join(out)


def mascot(level):
    # nền tối của ảnh thành trong suốt (độ sáng thấp → alpha thấp) để hoà vào hào quang phía sau
    im = Image.open(HERE / f"art/mascot/claude-{level}.png").convert("RGB").resize((340, 340), Image.LANCZOS)
    alpha = im.convert("L").point(lambda v: 0 if v < 24 else min(255, (v - 24) * 6))
    im.putalpha(alpha)
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=70)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def scene(level=None):
    color = AURA.get(level, "#D97757")
    body = (f'<image href="{mascot(level)}" x="1150" y="640" width="340" height="340" opacity=".45"/>' if level else
            '<text x="1330" y="850" font-size="120" text-anchor="middle" fill="#D97757" opacity=".18">✳</text>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">'
            f'<style>{CSS} {STILL}</style><defs>'
            '<radialGradient id="orb" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#FFE29A"/><stop offset=".55" stop-color="#F5A623"/><stop offset="1" stop-color="#B85C00"/></radialGradient>'
            f'<radialGradient id="glow"><stop offset="0" stop-color="{color}" stop-opacity=".22"/><stop offset="1" stop-color="{color}" stop-opacity="0"/></radialGradient>'
            '</defs><rect width="1600" height="1000" fill="#0E0E0E"/>'
            f'<ellipse class="aura" cx="1330" cy="800" rx="420" ry="360" fill="url(#glow)"/>{body}{balls()}</svg>')


scenes = {"dragonball": scene(), **{f"dragonball-{lv}": scene(lv) for lv in LEVELS}}
for k, v in scenes.items():
    assert len(v) < 131072, (k, len(v))
(HERE / "hooks/scenes.ts").write_text("// Sinh bởi make_scenes.py, đừng sửa tay\nexport const SCENES: Record<string, string> = "
                                      + json.dumps(scenes) + "\n")
print({k: len(v) for k, v in scenes.items()})
