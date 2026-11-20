#!/bin/zsh
# Cài theme theo chuẩn Claude Code: ~/.claude/themes/dragonball.json, chọn bằng "theme": "custom:dragonball".
# Gộp thêm câu chờ + tip từ settings.json vào ~/.claude/settings.json (có bản sao lưu).
set -e
cd "${0:A:h}"
mkdir -p ~/.claude/themes
cp themes/dragonball.json ~/.claude/themes/dragonball.json
S=~/.claude/settings.json
[[ -f $S ]] && cp "$S" "$S.bak-dragonball"
python3 - "$S" settings.json <<'PY'
import json, os, sys
dst, src = sys.argv[1], json.load(open(sys.argv[2]))
d = json.load(open(dst)) if os.path.exists(dst) else {}
d.update(src)
json.dump(d, open(dst, "w"), indent=2, ensure_ascii=False)
PY
echo "xong: Claude Code (CLI và app) dùng theme Claude Dragonball. Bỏ: cp $S.bak-dragonball $S"
