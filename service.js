const { Service } = require('node-windows');
const path = require('path');

const svc = new Service({
  name: 'foodstock label-printer',
  description: 'Print barcode labels for foodstock',
  script: path.join(__dirname, '/server.js'),
  cwd: __dirname,
});

svc.on('install', () => {
  svc.start();
});

svc.install();
