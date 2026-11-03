@echo off
chcp 65001 >nul
echo ====================================================
echo  🚀 جاري رفع مشروع FEKRA AI إلى GitHub
echo  المستودع: https://github.com/ahmedelsadny/fekra-ai
echo ====================================================

git remote set-url origin https://github.com/ahmedelsadny/fekra-ai.git

echo.
echo [1/4] إضافة الملفات...
git add .

echo.
echo [2/4] إنشاء Commit...
git commit -m "Add self-hosted WebRTC video calling, Nginx HTTPS reverse proxy, and SSL setup"

echo.
echo [3/4] التأكد من الفرع الرئيسي main...
git branch -M main

echo.
echo [4/4] الرفع إلى GitHub...
git push -u origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️ إذا كان المستودع على GitHub يحتوي على ملفات أولية (README أو License)، جاري المزامنة...
    git pull origin main --allow-unrelated-histories --no-rebase
    git push -u origin main
)

echo.
echo ====================================================
echo  ✅ تم الانتهاء بنجاح!
echo ====================================================
pause
