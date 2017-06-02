SET p=%~dp0

sc.exe stop foodstocklabelprinter.exe
sc.exe delete foodstocklabelprinter.exe
rmdir /Q /S %p%daemon
rmdir /Q /S %p%bpac-barcode
node %p%service.js
