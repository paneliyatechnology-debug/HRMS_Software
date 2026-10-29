@echo off
title Paneliya HRMS - Permanent Mobile & LAN Access Setup
color 0A

:: Check for Administrative privileges and self-elevate
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo =======================================================
    echo   Requesting Administrator privileges...
    echo   Please click "YES" on the Windows prompt!
    echo =======================================================
    powershell -NoProfile -Command "Start-Process cmd.exe -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

cls
echo =======================================================
echo    PANELIYA HRMS - PERMANENT MOBILE ACCESS FIX
echo =======================================================
echo.
echo [1/4] Setting Wi-Fi to Private Network...
powershell -NoProfile -Command "Get-NetConnectionProfile | Where-Object { $_.InterfaceAlias -like '*Wi-Fi*' -or $_.IPv4Connectivity -eq 'Internet' } | Set-NetConnectionProfile -NetworkCategory Private -ErrorAction SilentlyContinue"

echo [2/4] Allowing Port 3000 (Frontend) in Windows Firewall...
netsh advfirewall firewall delete rule name="HRMS Frontend Port 3000" >nul 2>&1
netsh advfirewall firewall add rule name="HRMS Frontend Port 3000" dir=in action=allow protocol=TCP localport=3000 profile=any >nul 2>&1

echo [3/4] Allowing Port 4000 (Backend) in Windows Firewall...
netsh advfirewall firewall delete rule name="HRMS Backend Port 4000" >nul 2>&1
netsh advfirewall firewall add rule name="HRMS Backend Port 4000" dir=in action=allow protocol=TCP localport=4000 profile=any >nul 2>&1

echo [4/4] Removing Node.js Block rules in Windows Firewall...
powershell -NoProfile -Command "Get-NetFirewallRule -DisplayName '*Node*' | Where-Object { $_.Action -eq 'Block' } | Remove-NetFirewallRule -ErrorAction SilentlyContinue"
netsh advfirewall firewall add rule name="Node.js Inbound Allow" dir=in action=allow program="%ProgramFiles%\nodejs\node.exe" profile=any >nul 2>&1

echo.
echo =======================================================
echo    SUCCESS! FIREWALL PERMANENTLY UNLOCKED!
echo =======================================================
echo.
echo Open this exact URL on your Mobile or other device:
echo (Make sure Mobile is connected to the same Wi-Fi)
echo.
powershell -NoProfile -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi' -ErrorAction SilentlyContinue).IPAddress; if (-not $ip) { $ip = '192.168.1.106' }; Write-Host ('   >>> http://' + $ip + ':3000 <<<') -ForegroundColor Green; Write-Host ('   Backend: http://' + $ip + ':4000') -ForegroundColor Yellow"
echo.
echo =======================================================
echo Press any key to close this window...
pause >nul
