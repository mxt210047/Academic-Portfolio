@echo off
REM Launcher from repo root - delegates to I9Audit\START.bat
cd /d "%~dp0OnBlickMicroservices\src\API\Services\OpenAI\I9Audit"
call "%~dp0OnBlickMicroservices\src\API\Services\OpenAI\I9Audit\START.bat" %*
