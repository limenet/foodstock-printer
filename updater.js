const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const GitHub = require('github-api');
const download = require('download');

const gh = new GitHub({
    token: process.env.GITHUB_TOKEN,
});

const bpacRepo = gh.getRepo('limenet/bpac-barcode');

bpacRepo.listReleases((error, data) => {
    const downloadUrl = data[0].assets[0].browser_download_url;
    download(downloadUrl, path.join(__dirname, '/bpac-barcode'), {
        extract: true,
    });
});
