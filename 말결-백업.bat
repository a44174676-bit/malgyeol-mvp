@echo off
chcp 65001 >nul
title 말결 백업
set "ts=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%"
set "ts=%ts: =0%"
set "dest=C:\projects\malgyeol\backup\%ts%"
mkdir "%dest%" 2>nul
copy /Y C:\projects\malgyeol\prisma\dev.db "%dest%\dev.db" >nul
if exist C:\projects\malgyeol\uploads xcopy C:\projects\malgyeol\uploads "%dest%\uploads\" /E /I /Q >nul
echo.
echo  백업이 완료되었습니다:
echo  %dest%
echo.
echo  (환자 기록 데이터베이스와 녹음 파일이 모두 복사되었습니다)
echo.
pause
