# hooks/scenes.ts: cảnh nền Claude Dragonball cho app desktop (mod), một cảnh gốc + một cảnh mỗi mức effort
# python3 make_scenes.py
import json, math, pathlib, re, subprocess, sys, tempfile

import numpy as np
from PIL import Image, ImageOps
from scipy import ndimage as nd

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


KEY = (255, 0, 255)  # màu đánh dấu ngoài lớp: vtracer vẽ nó thành path riêng, bỏ đi


def split(level):
    """Tách mascot thành 3 mặt nạ 224x224: aura (viền ki ngoài nét mực), hair, body (da cam, gồm nét mực của nó)."""
    im = np.asarray(Image.open(HERE / f"art/mascot/claude-{level}.png").convert("RGB").resize((448, 448), Image.LANCZOS)) / 255
    mx, mn = im.max(2), im.min(2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    skin = nd.binary_opening((r > 0.55) & (g < 0.62) & (b < 0.45) & (r - g > 0.15) & (g - b > 0) & (sat > 0.3), iterations=2)
    lab, n = nd.label(skin)
    seed = lab == 1 + np.argmax(nd.sum(skin, lab, range(1, n + 1)))
    # cơ bắp tô tối hơn: loang từ vùng da sáng qua các tông da tối (nét mực chặn lại)
    lab, _ = nd.label(((r > 0.28) & (r - g > 0.1) & (g - b > -0.03) & (sat > 0.3)) | seed)
    skin = np.isin(lab, list(set(np.unique(lab[seed])) - {0}))
    body = nd.binary_fill_holes(nd.binary_closing(nd.binary_dilation(skin, iterations=3), iterations=8))
    fg = mx > 0.16
    hull = nd.binary_fill_holes(nd.binary_closing(fg, iterations=6))
    core = nd.binary_opening(nd.binary_fill_holes(nd.binary_closing(((mx < 0.16) & hull) | body, iterations=3)), iterations=2)
    hair = core & ~body
    if level == "ultracode":  # hào quang trắng sáng lấp chỗ hở của nét mực: tóc bạc = các mảng xám dính vào thân
        lab, _ = nd.label(nd.binary_opening((sat < 0.25) & (mx > 0.4) & (mx < 0.93) & ~body))
        touch = list(set(np.unique(lab[nd.binary_dilation(body, iterations=6)])) - {0})
        hair = nd.binary_fill_holes(nd.binary_closing(np.isin(lab, touch), iterations=3)) & ~body
        core = hair | body
    # tóc lót xuống dưới mép thân một chút để thân nhún không hở khe
    hair = hair | (core & ~nd.binary_erosion(body, iterations=6))
    half = lambda m: m.reshape(224, 2, 224, 2).mean((1, 3)) > 0.5
    # mảng tối trong hào quang (khe giữa các mũi tóc) lộ ra thành vệt đen khi tóc cử động: bỏ
    return {"aura": half(fg & ~core & (mx > 0.3)), "hair": half(hair), "body": half(body)}


def _trace(img):
    with tempfile.TemporaryDirectory() as tmp:
        src, out = pathlib.Path(tmp, "l.png"), pathlib.Path(tmp, "l.svg")
        img.save(src)
        subprocess.run(["uv", "run", "--quiet", "--python", "3.12", "--with", "vtracer", "python", "-c",
                        "import sys,vtracer;vtracer.convert_image_to_svg_py(sys.argv[1],sys.argv[2],colormode='color',hierarchical='cutout',mode='spline',"
                        "filter_speckle=4,color_precision=6,layer_difference=12,corner_threshold=60,length_threshold=4.0,splice_threshold=45,path_precision=1)",
                        str(src), str(out)], check=True)
        paths = re.findall(r"<path[^>]*/>", out.read_text())

    def keyed(p):
        c = re.search(r'fill="#([0-9A-Fa-f]{6})"', p)
        if c is None:
            return False
        r, g, b = (int(c.group(1)[i:i + 2], 16) for i in (0, 2, 4))
        return r - g > 30 and b - g > 30  # vtracer trộn màu đánh dấu với viền: mọi tông tím hồng đều là nó
    return "".join(p for p in paths if not keyed(p))


def layers(level):
    """Path vector từng lớp (viewBox 0 0 224 224), để con pet cử động từng bộ phận."""
    rgb = np.asarray(Image.open(HERE / f"art/mascot/claude-{level}.png").convert("RGB").resize((224, 224), Image.LANCZOS))
    out = {}
    for name, m in split(level).items():
        img = np.where(m[..., None], rgb, np.array(KEY, dtype=np.uint8))
        out[name] = _trace(Image.fromarray(img.astype(np.uint8)))
    return out


def fx_sprites(sheet, size=120, grid=None):
    """Cắt từng hình trên tấm sprite (nền hồng tím của studio image) theo thứ tự hàng rồi cột, vẽ lại thành path.
    grid=(hàng, cột): chia tấm theo lưới, mỗi ô một hình (khi một hình gồm nhiều mảnh rời như vòng khói).
    size: cạnh dài mỗi hình sau khi thu nhỏ (một số, hoặc danh sách theo thứ tự hình).
    Trả về [{w, h, d}]: d là các path trong viewBox 0 0 w h."""
    im = Image.open(HERE / f"art/fx/{sheet}.png").convert("RGB")
    a = np.asarray(im).astype(int)
    # viền khử răng cưa trộn hồng tím: coi là nền luôn, để vtracer không ra màu bẩn ở mép
    fg = nd.binary_opening(~((a[..., 0] - a[..., 1] > 60) & (a[..., 2] - a[..., 1] > 60)), iterations=2)
    a[~fg] = KEY
    im = Image.fromarray(a.astype(np.uint8))
    # gom mảnh nhỏ sát nhau (tia lửa văng, nét nhánh sét) vào hình chính
    if grid:
        H, W = fg.shape
        boxes = []
        for r in range(grid[0]):
            for c in range(grid[1]):
                y0, x0 = r * H // grid[0], c * W // grid[1]
                cell = fg[y0:(r + 1) * H // grid[0], x0:(c + 1) * W // grid[1]]
                lab, n = nd.label(cell)  # bỏ mẩu của hình ô bên cạnh lấn qua mép ô
                edge = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
                cell = cell & ~np.isin(lab, [i for i in edge if (lab == i).sum() < 2000])
                ys, xs = np.nonzero(cell)
                boxes.append((slice(y0 + ys.min(), y0 + ys.max() + 1), slice(x0 + xs.min(), x0 + xs.max() + 1)))
    else:
        lab, n = nd.label(nd.binary_dilation(fg, iterations=14))
        boxes = [b for b in nd.find_objects(lab) if (b[0].stop - b[0].start) * (b[1].stop - b[1].start) > 900]
    rows = sorted(boxes, key=lambda b: b[0].start)
    ordered, line = [], []
    for b in rows:  # cùng hàng nếu tâm dọc gần nhau
        if line and abs((b[0].start + b[0].stop) / 2 - (line[0][0].start + line[0][0].stop) / 2) > 120:
            ordered += sorted(line, key=lambda b: b[1].start); line = []
        line.append(b)
    ordered += sorted(line, key=lambda b: b[1].start)
    out = []
    for i, b in enumerate(ordered if not grid else boxes):
        crop = im.crop((b[1].start, b[0].start, b[1].stop, b[0].stop))
        k = (size[i] if isinstance(size, list) else size) / max(crop.size)
        crop = crop.resize((max(1, round(crop.width * k)), max(1, round(crop.height * k))), Image.LANCZOS)
        out.append({"w": crop.width, "h": crop.height, "d": _trace(crop)})
    return out


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


if "--frames" in sys.argv:
    # khung PNG của pet CLI (make_cli_frames.ts) nén về bảng 256 màu có alpha: nhẹ hơn nhiều, nhìn như cũ
    for f in sorted((HERE / "frames").rglob("*.png")):
        if f.name.startswith("l"):
            continue
        im = Image.open(f).convert("RGBA")
        im.quantize(256, method=Image.Quantize.FASTOCTREE).save(f, optimize=True)
        # bản soi gương cho /dragonball left: con pet ở mép trái, chưởng bắn sang phải
        ImageOps.mirror(im).quantize(256, method=Image.Quantize.FASTOCTREE).save(f.with_name("l" + f.name), optimize=True)
    sys.exit()

scenes = {"dragonball": scene(), **{f"dragonball-{lv}": scene(lv) for lv in LEVELS}}
for k, v in scenes.items():
    assert len(v) < 131072, (k, len(v))
(HERE / "hooks/scenes.ts").write_text("// Sinh bởi make_scenes.py, đừng sửa tay\n"
                                      "// SCENES: cảnh nền app; MASCOTS: path vector của Claude mỗi mức tách lớp aura / hair / body (viewBox 0 0 224 224), cho con pet cạnh ô chat\n"
                                      "export const SCENES: Record<string, string> = " + json.dumps(scenes) + "\n"
                                      "export const MASCOTS: Record<string, { aura: string; hair: string; body: string }> = " + json.dumps({lv: layers(lv) for lv in LEVELS}) + "\n"
                                      "export const AURA: Record<string, string> = " + json.dumps(AURA) + "\n"
                                      "// FX: hiệu ứng vẽ bằng studio image (art/fx), cắt từng hình và vẽ lại thành path\n"
                                      "export const FX: Record<string, { w: number; h: number; d: string }[]> = "
                                      + json.dumps({"bolts": fx_sprites("bolts", 90), "impact": fx_sprites("impact", 90, grid=(2, 2)),
                                                    "beam": fx_sprites("beam", [90, 260], grid=(2, 1)), "debris": fx_sprites("debris", 40),
                                                    "sleep": fx_sprites("sleep", 60)}) + "\n"
                                      "// KI: hào quang gồng ki riêng từng mức (art/fx/aura-*.png), cùng khung với mascot (viewBox 0 0 160 160); bỏ nét viền tối: vtracer tô kín cả lòng vòng viền thành mảng đen\n"
                                      "export const KI: Record<string, string> = "
                                      + json.dumps({lv: no_outline(_trace(Image.open(HERE / f"art/fx/aura-{lv}.png").convert("RGB").resize((160, 160), Image.LANCZOS))) for lv in LEVELS}) + "\n")
print({k: len(v) for k, v in scenes.items()})
