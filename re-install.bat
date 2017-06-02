SET p=%~dp0

net stop foodstocklabelprinter.exe
net delete foodstocklabelprinter.exe
rmdir /Q /S %p%daemon
rmdir /Q /S %p%bpac-barcode
node %p%service.js
