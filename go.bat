@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: git 저장소인지 확인
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo ❌ 현재 디렉터리는 git 저장소가 아닙니다.
    exit /b 1
)

:: 로컬 GEMINI.md 파일을 글로벌 경로로 동기화 (에이전트 룰 업데이트 목적)
if exist "%~dp0GEMINI.md" (
    copy /y "%~dp0GEMINI.md" "c:\Users\accen\.gemini\GEMINI.md" >nul
)

echo 🔍 git status
git status

:: 변경사항 스테이징
echo ➕ git add .
git add .

:: 스테이징된 변경 여부 확인 (없으면 종료)
git diff --cached --quiet
if not errorlevel 1 (
    echo ℹ️ 커밋할 변경사항이 없습니다. 종료합니다.
    exit /b 0
)

:: 고정 커밋 메시지 프리픽스 (무파라미터일 때 숫자 점증용)
set "BASE_MSG=Fix Vercel deploy issue with author info"

:: --- 커밋 메시지 결정 로직 ---
:: 1) 파라미터가 있으면 해당 파라미터를 커밋 타이틀로 사용
:: 2) 파라미터가 없으면 BASE_MSG + 증가 숫자 형식으로 자동 커밋 메시지 생성
set "USER_MSG=%~1"

if not "!USER_MSG!"=="" (
    :: 사용자가 전달한 커밋 타이틀 사용
    set "COMMIT_MSG=!USER_MSG!"
) else (
    :: 최근 동일 패턴의 커밋 메시지에서 숫자 추출 후 +1
    set "LAST_COMMIT="
    for /f "delims=" %%i in ('git log -n 1 --grep^="^%BASE_MSG% " --pretty^=format:%%s 2^>nul') do (
        set "LAST_COMMIT=%%i"
    )
    
    set "LAST_NUM="
    if defined LAST_COMMIT (
        :: BASE_MSG + 공백 제거
        set "TEMP_MSG=!LAST_COMMIT:%BASE_MSG% =!"
        if not "!TEMP_MSG!"=="" (
            if not "!TEMP_MSG!"=="!LAST_COMMIT!" (
                :: 숫자인지 확인 (0-9 이외의 문자가 없는지)
                set "NOT_NUMERIC="
                for /f "delims=0123456789" %%j in ("!TEMP_MSG!") do (
                    set "NOT_NUMERIC=1"
                )
                if not defined NOT_NUMERIC (
                    set "LAST_NUM=!TEMP_MSG!"
                )
            )
        )
    )
    
    if "!LAST_NUM!"=="" (
        set "NEXT_NUM=1"
    ) else (
        set /a "NEXT_NUM=!LAST_NUM! + 1"
    )
    set "COMMIT_MSG=%BASE_MSG% !NEXT_NUM!"
)
:: --- 커밋 메시지 결정 끝 ---

echo 📝 git commit -m "!COMMIT_MSG!"
git commit -m "!COMMIT_MSG!"

:: 현재 브랜치 확인
set "CURRENT_BRANCH="
for /f "delims=" %%i in ('git rev-parse --abbrev-ref HEAD') do (
    set "CURRENT_BRANCH=%%i"
)
echo 📦 현재 브랜치: !CURRENT_BRANCH!

:: 원격 main으로 푸시
echo 🚀 git push origin main
git push origin main

echo ✅ 완료: !COMMIT_MSG!
