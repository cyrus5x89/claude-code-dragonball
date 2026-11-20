# hooks/scenes.ts: cảnh nền Claude Dragonball cho app desktop (mod), một cảnh gốc + một cảnh mỗi mức effort
# python3 make_scenes.py
import json, math, pathlib, re, subprocess, tempfile

HERE = pathlib.Path(__file__).parent
LEVELS = ["low", "medium", "high", "xhigh", "max", "ultracode"]
AURA = {"low": "#F2C230", "medium": "#C98A0B", "high": "#FFD84D", "xhigh": "#E0384F", "max": "#2FA8F0", "ultracode": "#D8DEE9"}
# tâm cụm ngọc + mascot trên khung 1600x1000: lệch phải, trên ô nhập
CX, CY = 1290, 600
STILL = "@media (prefers-reduced-motion: reduce) { * { animation: none !important } }"
CSS = (".ball{animation:pulse 6s ease-in-out infinite alternate}"
       ".aura{transform-box:fill-box;transform-origin:center;animation:breathe 9s ease-in-out infinite alternate}"
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
    # app không nhận ảnh nhúng trong nền (chỉ vector), nên vẽ lại mascot thành path bằng vtracer, bỏ các mảng nền tối
    with tempfile.TemporaryDirectory() as tmp:
        out = pathlib.Path(tmp, "m.svg")
        subprocess.run(["uv", "run", "--quiet", "--python", "3.12", "--with", "vtracer", "--with", "pillow", "python", "-c",
                        "import sys,vtracer;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').resize((256,256)).save(sys.argv[2]+'.png');"
                        "vtracer.convert_image_to_svg_py(sys.argv[2]+'.png',sys.argv[2],colormode='color',hierarchical='stacked',mode='spline',"
                        "filter_speckle=6,color_precision=5,layer_difference=24,corner_threshold=60,length_threshold=4.0,splice_threshold=45,path_precision=1)",
                        str(HERE / f"art/mascot/claude-{level}.png"), str(out)], check=True)
        paths = re.findall(r"<path[^>]*/>", out.read_text())

    def dark(p):
        # mảng nền: tối và phủ gần hết khung (giữ lại mắt, viền nhỏ)
        c = re.search(r'fill="#([0-9A-Fa-f]{6})"', p)
        if c is None or sum(int(c.group(1)[i:i + 2], 16) for i in (0, 2, 4)) >= 3 * 40:
            return False
        nums = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", re.search(r'd="([^"]*)"', p).group(1))]
        xs, ys = nums[0::2], nums[1::2]
        return max(xs) - min(xs) > 150 or max(ys) - min(ys) > 150

    return "".join(p for p in paths[1:] if not dark(p))  # path đầu của chế độ stacked là cả khung nền


def scene(level=None):
    color = AURA.get(level, "#D97757")
    body = (f'<svg x="1150" y="640" width="340" height="340" viewBox="0 0 256 256" opacity=".45">{mascot(level)}</svg>' if level else
            '<text x="1330" y="850" font-size="120" text-anchor="middle" fill="#D97757" opacity=".18">✳</text>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">'
            f'<style>{CSS} {STILL}</style><defs>'
            '<radialGradient id="orb" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#FFE29A"/><stop offset=".55" stop-color="#F5A623"/><stop offset="1" stop-color="#B85C00"/></radialGradient>'
            f'<radialGradient id="glow"><stop offset="0" stop-color="{color}" stop-opacity=".22"/><stop offset="1" stop-color="{color}" stop-opacity="0"/></radialGradient>'
            '</defs><rect width="1600" height="1000" fill="#0E0E0E"/>'
            f'<g transform="translate({CX - 0.65 * 1330:.0f} {CY - 0.65 * 800:.0f}) scale(.65)"><ellipse class="aura" cx="1330" cy="800" rx="420" ry="360" fill="url(#glow)"/>{body}{balls()}</g></svg>')


scenes = {"dragonball": scene(), **{f"dragonball-{lv}": scene(lv) for lv in LEVELS}}
for k, v in scenes.items():
    assert len(v) < 131072, (k, len(v))
(HERE / "hooks/scenes.ts").write_text("// Sinh bởi make_scenes.py, đừng sửa tay\nexport const SCENES: Record<string, string> = "
                                      + json.dumps(scenes) + "\n")
print({k: len(v) for k, v in scenes.items()})
