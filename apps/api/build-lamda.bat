@echo off
SETLOCAL

REM Step 1: Clean previous zip
IF EXIST moi-app-lambda.zip (
    del moi-app-lambda.zip
)

REM Step 2: Build the project
echo Installing dependencies...
call npx tsc 


REM Step 3: Build the project
echo Building project...
call npx tsc 

REM Step 4: Zip dist + node_modules into moi-app-lambda.zip
echo Creating ZIP...
powershell -Command "Compress-Archive -Path dist, node_modules -DestinationPath moi-app-lambda.zip"

echo ✅ Done! Created moi-app-lambda.zip with dist/ and node_modules/
ENDLOCAL
pause
