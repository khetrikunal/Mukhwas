@echo off
REM Run this script from the frontend directory:
REM   cd c:\Users\SWAPNIL\Downloads\mukhwas\royal-mukhwas\frontend
REM   copy_images.bat

set SRC=src\assets\product
set DST=Public\products

REM Create directories
mkdir "%DST%\paan" 2>nul
mkdir "%DST%\sweet-mukhwas" 2>nul
mkdir "%DST%\chatpata-mukhwas" 2>nul
mkdir "%DST%\digestive-mukhwas" 2>nul
mkdir "%DST%\amla-mukhwas" 2>nul
mkdir "%DST%\others" 2>nul

REM === PAAN ===
copy /Y "%SRC%\paan\Jaipuri Paan.jpeg" "%DST%\paan\jaipuri-paan.jpeg"
copy /Y "%SRC%\paan\jaipuri package (2).jpeg" "%DST%\paan\jaipuri-paan-package.jpeg"
copy /Y "%SRC%\paan\Banarasi Paan.jpeg" "%DST%\paan\banarasi-paan.jpeg"
copy /Y "%SRC%\paan\Banarasi Package.jpeg" "%DST%\paan\banarasi-paan-package.jpeg"

REM === SWEET MUKHWAS ===
copy /Y "%SRC%\soaf mukhwas\Shimla Mix Mukhwas.jpeg" "%DST%\sweet-mukhwas\shimla-mix.jpeg"
copy /Y "%SRC%\soaf mukhwas\shimla package.jpeg" "%DST%\sweet-mukhwas\shimla-mix-package.jpeg"
copy /Y "%SRC%\soaf mukhwas\Satrangi mukhwas.jpeg" "%DST%\sweet-mukhwas\satrangi.jpeg"
copy /Y "%SRC%\soaf mukhwas\Satrangi package.jpeg" "%DST%\sweet-mukhwas\satrangi-package.jpeg"
copy /Y "%SRC%\soaf mukhwas\khaskhas mukhwas.jpeg" "%DST%\sweet-mukhwas\khaskhus.jpeg"
copy /Y "%SRC%\soaf mukhwas\Chandan Mukhwas.jpeg" "%DST%\sweet-mukhwas\chandan.jpeg"
copy /Y "%SRC%\soaf mukhwas\chandan package.jpeg" "%DST%\sweet-mukhwas\chandan-package.jpeg"
copy /Y "%SRC%\soaf mukhwas\Bambaiya Mukhwas.jpeg" "%DST%\sweet-mukhwas\bambaiya.jpeg"
copy /Y "%SRC%\soaf mukhwas\Madrasi Mukhwas.jpeg" "%DST%\sweet-mukhwas\madbasi.jpeg"

REM === CHATPATA MUKHWAS ===
copy /Y "%SRC%\chatpata mukhwas\Tikhi Keri.jpeg" "%DST%\chatpata-mukhwas\tilchi-feri.jpeg"
copy /Y "%SRC%\chatpata mukhwas\TIkhi Keri package.jpeg" "%DST%\chatpata-mukhwas\tilchi-feri-package.jpeg"

REM === DIGESTIVE MUKHWAS ===
copy /Y "%SRC%\Digestive mukhwas\Digestive Mukhwas.jpeg" "%DST%\digestive-mukhwas\digestive-mukhwas.jpeg"

REM === AMLA MUKHWAS ===
copy /Y "%SRC%\amla mukhwas\Honey Amla Candy.jpeg" "%DST%\amla-mukhwas\honey-amla-candy.jpeg"
copy /Y "%SRC%\amla mukhwas\swwt amla package.jpeg" "%DST%\amla-mukhwas\honey-amla-candy-package.jpeg"
copy /Y "%SRC%\amla mukhwas\Jeera Amla Candy.jpeg" "%DST%\amla-mukhwas\jeera-amla-candy.jpeg"
copy /Y "%SRC%\amla mukhwas\Jeera Amla package.jpeg" "%DST%\amla-mukhwas\jeera-amla-candy-package.jpeg"
copy /Y "%SRC%\amla mukhwas\Amla Pachak.jpeg" "%DST%\amla-mukhwas\amla-pachak.jpeg"
copy /Y "%SRC%\amla mukhwas\Amla package.jpeg" "%DST%\amla-mukhwas\amla-pachak-package.jpeg"

REM === OTHERS ===
copy /Y "%SRC%\others\Aam Papad.jpeg" "%DST%\others\aam-papad.jpeg"
copy /Y "%SRC%\others\imli laduu.jpeg" "%DST%\others\imli-laddu.jpeg"
copy /Y "%SRC%\others\lmli laddu.jpeg" "%DST%\others\imli-laddu-2.jpeg"
copy /Y "%SRC%\others\amngo slice mukhwas.jpeg" "%DST%\others\mango-slice.jpeg"

echo.
echo ========================================
echo   All product images copied successfully!
echo ========================================
pause
