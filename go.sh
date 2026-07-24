#!/usr/bin/env bash
set -euo pipefail

# 고정 커밋 메시지 프리픽스 (무파라미터일 때 숫자 점증용)
BASE_MSG="Fix Vercel deploy issue with author info"

# git 저장소인지 확인
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ 현재 디렉터리는 git 저장소가 아닙니다."
  exit 1
fi

# 로컬 GEMINI.md 파일을 글로벌 경로로 동기화 (에이전트 룰 업데이트 목적)
if [ -f "${BASH_SOURCE%/*}/GEMINI.md" ]; then
  cp -f "${BASH_SOURCE%/*}/GEMINI.md" "/c/Users/accen/.gemini/GEMINI.md" 2>/dev/null || cp -f "${BASH_SOURCE%/*}/GEMINI.md" "C:/Users/accen/.gemini/GEMINI.md" 2>/dev/null || true
fi

echo "🔍 git status"
git status

# 변경사항 스테이징
echo "➕ git add ."
git add .

# 스테이징된 변경 여부 확인 (없으면 종료)
if git diff --cached --quiet; then
  echo "ℹ️ 커밋할 변경사항이 없습니다. 종료합니다."
  exit 0
fi

# --- 커밋 메시지 결정 로직 ---
# 1) 파라미터가 있으면 해당 파라미터를 커밋 타이틀로 사용
# 2) 파라미터가 없으면 BASE_MSG + 증가 숫자 형식으로 자동 커밋 메시지 생성
user_msg="${1-}"  # 인자가 없으면 빈 문자열
# 앞뒤 공백 트리밍
user_msg="$(printf '%s' "${user_msg}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

if [[ -n "${user_msg}" ]]; then
  # 사용자가 전달한 커밋 타이틀 사용
  commit_msg="${user_msg}"
else
  # 최근 동일 패턴의 커밋 메시지에서 숫자 추출 후 +1
  last_num="$(git log -n 1 --grep="^${BASE_MSG} " --pretty=%B 2>/dev/null | grep -oE '[0-9]+' | tail -1 || true)"
  if [[ -z "${last_num:-}" ]]; then
    next_num=1
  else
    if [[ "${last_num}" =~ ^[0-9]+$ ]]; then
      next_num=$(( last_num + 1 ))
    else
      next_num=1
    fi
  fi
  commit_msg="${BASE_MSG} ${next_num}"
fi
# --- 커밋 메시지 결정 끝 ---

echo "📝 git commit -m \"${commit_msg}\""
git commit -m "${commit_msg}"

# 현재 브랜치 확인
current_branch="$(git rev-parse --abbrev-ref HEAD)"
echo "📦 현재 브랜치: ${current_branch}"

# 원격 main으로 푸시 (원본 스크립트 동작 유지)
echo "🚀 git push origin main"
git push origin main

echo "✅ 완료: ${commit_msg}"
