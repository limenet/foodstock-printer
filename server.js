const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const exec = require('child_process').exec;
const express = require('express');
const expressValidator = require('express-validator');
const util = require('util');
const bodyParser = require('body-parser');
const moment = require('moment');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator({
    customValidators: {
        gte(param, num) {
            return param >= num;
        },
        isCode128(param) {
            return /^[\x00-\x7F]*$/.test(param);
        },
        isDate(param) {
            return !isNaN(Date.parse(param));
        },
    },
}));

function ts() { return moment().format('YYYY-MM-DD HH:mm:ss'); }

app.post('/', (req, res) => {
    req.checkBody('title', 'title missing').notEmpty();
    req.checkBody('barcode', 'barcode missing or invalid').notEmpty().isCode128();
    req.checkBody('timestamp', 'timestamp missing or invalid').notEmpty().isDate();
    req.checkBody('copies', 'copies missing or invalid').notEmpty().isInt().gte(1);

    req.getValidationResult().then((result) => {
        if (!result.isEmpty()) {
            res.status(400).send(`There have been validation errors: ${util.inspect(result.array())}`);
            return;
        }
        exec(`${path.join(__dirname, '/bpac-barcode/bpac-barcode.exe')} "${req.body.title}" "${req.body.barcode}" "${req.body.timestamp}" ${req.body.copies}`, (error, stdout, stderr) => {
            if (error) {
                console.error(ts());
                console.error(req.body);
                console.error('Printing failed');
                console.error({ exitCode: error.code });
                console.error(stderr);
                res.status(500).send('Printing failed');
            } else {
                console.log(ts());
                console.log(req.body);
                console.log('Printed');
                res.status(200).send('Printed');
            }
        });
    });
});

app.listen(process.env.LABEL_PRINTER_PORT, () => {
    console.log(ts());
    console.log(`Listening on port ${process.env.LABEL_PRINTER_PORT}`);

    exec('node updater.js', { cwd: __dirname });
});

