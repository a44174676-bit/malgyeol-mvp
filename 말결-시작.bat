@echo off
chcp 65001 >nul
title 말결 서버
cd /d C:\projects\malgyeol
set "PATH=%PATH%;C:\Program Files\nodejs"

if not exist .next\BUILD_ID (
  echo 최초 실행 준비 중입니다. 1~2분 정도 걸립니다...
  call npx next build
)

echo.
echo  ─────────────────────────────────────────────
echo   말결 서버가 시작됩니다.
echo   브라우저에서  http://localhost:3300  을 여세요.
echo.
echo   ※ 이 검은 창을 닫으면 서버가 종료됩니다.
echo      사용하는 동안 최소화만 해 두세요.
echo  ─────────────────────────────────────────────
echo.
start "" http://localhost:3300
call npx next start -p 3300
pause
