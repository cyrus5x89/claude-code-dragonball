#!/bin/zsh
# Cài plugin + gộp settings.json của repo vào ~/.claude/settings.json (theme, câu chờ, tip). Có bản sao lưu.
set -e
cd "${0:A:h}"
claude plugin marketplace add "$PWD" >/dev/null 2>&1 || true
claude plugin install dragonball@claude-code-dragonball
S=~/.claude/settings.json
[[ -f $S ]] && cp "$S" "$S.bak-dragonball"
python3 - "$S" settings.json <<'PY'
import json, os, sys
dst, src = sys.argv[1], json.load(open(sys.argv[2]))
d = json.load(open(dst)) if os.path.exists(dst) else {}
d.update(src)
json.dump(d, open(dst, "w"), indent=2, ensure_ascii=False)
PY
echo "xong: mở lại Claude Code (CLI hoặc app). Bỏ: cp $S.bak-dragonball $S"
