const Service = require('node-windows').Service;
const path = require('path');


// Create a new service object
const svc = new Service({
    name: 'foodstock label-printer',
    description: 'Print barcode labels for foodstock',
    script: path.join(__dirname, '/server.js'),
    cwd: __dirname,
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', () => {
    svc.start();
});

svc.install();
