@echo off
REM I9Audit service launcher (Windows) — from OnBlickMicroservices I9Audit folder
cd /d "%~dp0"
dotnet restore I9Audit.sln
dotnet build I9Audit.sln -c Debug
dotnet run --project I9Audit.csproj --urls "http://127.0.0.1:5089"
