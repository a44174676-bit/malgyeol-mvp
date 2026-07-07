@echo off
chcp 65001 >nul
title 말결 외부접속 (휴대폰 테스트용)
echo.
echo  ─────────────────────────────────────────────────
echo   말결 외부접속 터널을 시작합니다.
echo.
echo   잠시 후 나오는  https://XXXX.trycloudflare.com
echo   주소를 휴대폰 브라우저에 입력하세요.
echo   (주소는 실행할 때마다 바뀝니다)
echo.
echo   ※ 먼저 [말결-시작]이 켜져 있어야 합니다.
echo   ※ 이 주소를 아는 사람은 누구나 접속을 시도할 수
echo      있으니, 테스트가 끝나면 이 창을 꼭 닫으세요.
echo  ─────────────────────────────────────────────────
echo.
"C:\projects\malgyeol\cloudflared.exe" tunnel --url http://localhost:3300
pause
