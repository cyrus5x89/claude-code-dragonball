# hooks/scenes.ts: cảnh nền Claude Dragonball cho app desktop (mod), một cảnh gốc + một cảnh mỗi mức effort
# python3 make_scenes.py
import json, math, pathlib, re, subprocess, tempfile

from PIL import Image

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


def _mascot(level):
    # app không nhận ảnh nhúng trong nền (chỉ vector), nên vẽ lại mascot thành path bằng vtracer (cutout: mỗi mảng màu
    # một path, không chồng lớp nên không bị vệt tối trên mặt), rồi bỏ các path cùng màu nền (màu góc ảnh)
    src = HERE / f"art/mascot/claude-{level}.png"
    with tempfile.TemporaryDirectory() as tmp:
        out = pathlib.Path(tmp, "m.svg")
        subprocess.run(["uv", "run", "--quiet", "--python", "3.12", "--with", "vtracer", "--with", "pillow", "python", "-c",
                        "import sys,vtracer;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').resize((224,224)).save(sys.argv[2]+'.png');"
                        "vtracer.convert_image_to_svg_py(sys.argv[2]+'.png',sys.argv[2],colormode='color',hierarchical='cutout',mode='spline',"
                        "filter_speckle=4,color_precision=6,layer_difference=12,corner_threshold=60,length_threshold=4.0,splice_threshold=45,path_precision=1)",
                        str(src), str(out)], check=True)
        paths = re.findall(r"<path[^>]*/>", out.read_text())
    corner = Image.open(src).convert("RGB").getpixel((4, 4))

    def background(p):
        c = re.search(r'fill="#([0-9A-Fa-f]{6})"', p)
        if c is None or sum(abs(int(c.group(1)[i * 2:i * 2 + 2], 16) - corner[i]) for i in range(3)) >= 45:
            return False
        # mắt cũng tối như nền: chỉ bỏ mảng chạm mép ảnh (path có toạ độ tuyệt đối qua transform translate)
        t = re.search(r'translate\(([-\d.]+),\s*([-\d.]+)\)', p)
        ox, oy = (float(t.group(1)), float(t.group(2))) if t else (0.0, 0.0)
        nums = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", re.search(r' d="([^"]*)"', p).group(1))]
        xs, ys = [x + ox for x in nums[0::2]], [y + oy for y in nums[1::2]]
        return min(xs) < 3 or min(ys) < 3 or max(xs) > 221 or max(ys) > 221

    return "".join(p for p in paths if not background(p))


_PATHS = {}


def mascot(level):
    if level not in _PATHS:
        _PATHS[level] = _mascot(level)
    return _PATHS[level]


def no_outline(paths):
    # nền: bỏ viền đen dày quanh mascot (nhìn bẩn khi mờ), giữ mảng tối nhỏ như mắt
    def keep(p):
        c = re.search(r'fill="#([0-9A-Fa-f]{6})"', p)
        if c is None or sum(int(c.group(1)[i:i + 2], 16) for i in (0, 2, 4)) >= 3 * 70:
            return True
        nums = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", re.search(r' d="([^"]*)"', p).group(1))]
        return max(nums[0::2]) - min(nums[0::2]) < 40 and max(nums[1::2]) - min(nums[1::2]) < 40
    return "".join(p for p in re.findall(r"<path[^>]*/>", paths) if keep(p))


def scene(level=None):
    color = AURA.get(level, "#D97757")
    body = (f'<svg x="1150" y="640" width="340" height="340" viewBox="0 0 224 224" opacity=".55">{no_outline(mascot(level))}</svg>' if level else
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
(HERE / "hooks/scenes.ts").write_text("// Sinh bởi make_scenes.py, đừng sửa tay\n"
                                      "// SCENES: cảnh nền app; MASCOTS: path vector của Claude mỗi mức (viewBox 0 0 256 256), cho con pet cạnh ô chat\n"
                                      "export const SCENES: Record<string, string> = " + json.dumps(scenes) + "\n"
                                      "export const MASCOTS: Record<string, string> = " + json.dumps({lv: mascot(lv) for lv in LEVELS}) + "\n"
                                      "export const AURA: Record<string, string> = " + json.dumps(AURA) + "\n")
print({k: len(v) for k, v in scenes.items()})
