@echo off
:: Проверка прав администратора
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Запущено от имени администратора.
) else (
    echo [ERROR] ПОЖАЛУЙСТА, ЗАПУСТИТЕ ЭТОТ ФАЙЛ ОТ ИМЕНИ АДМИНИСТРАТОРА!
    echo Нажмите правой кнопкой мыши -> Запуск от имени администратора.
    pause
    exit /b
)

echo [1/3] Добавление Java в исключения Брандмауэра...
netsh advfirewall firewall add rule name="Flux_Java_In" dir=in action=allow program="C:\Program Files\Android\Android Studio\jbr\bin\java.exe" enable=yes
netsh advfirewall firewall add rule name="Flux_Java_Out" dir=out action=allow program="C:\Program Files\Android\Android Studio\jbr\bin\java.exe" enable=yes

echo [2/3] Сброс сетевого стека Windows...
netsh winsock reset
netsh int ip reset

echo [3/3] Настройка IPv4...
setx _JAVA_OPTIONS "-Djava.net.preferIPv4Stack=true" /M

echo.
echo ======================================================
echo ГОТОВО! СИСТЕМНЫЕ ПРЕГРАДЫ УСТРАНЕНЫ.
echo ТЕПЕРЬ ОБЯЗАТЕЛЬНО ПЕРЕЗАГРУЗИ КОМПЬЮТЕР!
echo После перезагрузки нажми Sync в Android Studio.
echo ======================================================
pause
