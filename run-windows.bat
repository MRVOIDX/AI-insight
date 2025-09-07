@echo off
echo Starting GitWiki AI...
set PORT=5000
set NODE_ENV=production
set GEMINI_API_KEY=YOUR-GEMINI_API_KEY
echo Building application...
call npm run build
echo Starting server...
call node dist/index.js
pause