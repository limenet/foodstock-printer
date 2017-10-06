const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { exec } = require('child_process');
const express = require('express');
const { check, validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');
const bodyParser = require('body-parser');
const moment = require('moment');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

function ts() { return moment().format('YYYY-MM-DD HH:mm:ss'); }

app.post('/', [
    check('title')
        .not().isEmpty(),
    check('barcode', 'Has to be a valid Code 128')
        .not().isEmpty()
        .custom(value => /^[\x20-\x7F]*$/.test(value)),
    check('timestamp', 'Must be a parseable date')
        .not().isEmpty()
        .custom(value => !Number.isNaN(Date.parse(value))),
    check('copies', 'At least 1')
        .not().isEmpty()
        .isInt({ min: 1 }),
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.mapped() });
    }

    const data = matchedData(req);

    return exec(`${path.join(__dirname, '/bpac-barcode/bpac-barcode.exe')} "${data.title}" "${data.barcode}" "${data.timestamp}" ${data.copies}`, (error, stdout, stderr) => {
        if (error) {
            console.error(ts(), data, 'Printing failed', { exitCode: error.code }, stderr);
            res.status(500).send('Printing failed');
        } else {
            console.log(ts(), data, 'Printed');
            res.status(200).send('Printed');
        }
    });
});

app.listen(process.env.LABEL_PRINTER_PORT, () => {
    console.log(ts());
    console.log(`Listening on port ${process.env.LABEL_PRINTER_PORT}`);

    exec('node updater.js', { cwd: __dirname });
});

