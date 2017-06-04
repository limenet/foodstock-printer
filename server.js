const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const execSync = require('sync-exec');
const execAsync = require('child_process').exec;
const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');

const app = express();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.post('/', urlencodedParser, (req, res) => {
    const printJob = execSync(`${path.join(__dirname, '/bpac-barcode/bpac-barcode.exe')} "${req.body.title}" "${req.body.barcode}" "${req.body.timestamp}" ${req.body.copies}`);
    const ts = moment().format('YYYY-MM-DD HH:mm:ss');

    if (printJob.status === 0) {
        console.log(ts);
        console.log(req.body);
        console.log('Printed');
        res.status(200).send('Printed');
    } else {
        console.error(ts);
        console.error(req.body);
        console.error('Printing failed');
        res.status(500).send('Printing failed');
    }
});

app.listen(process.env.LABEL_PRINTER_PORT, () => {
    console.log(`Listening on port ${process.env.LABEL_PRINTER_PORT}`);

    execAsync('node updater.js', { cwd: __dirname });
});
