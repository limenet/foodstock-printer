const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const GitHub = require('github-api');
const download = require('download');
const semver = require('semver');
const fs = require('fs-extra');
const uuidV4 = require('uuid/v4');

const gh = new GitHub({
    token: process.env.GITHUB_TOKEN,
});

const bpacRepo = gh.getRepo('limenet/bpac-barcode');

const desiredVersion = '^0.3.0';

if (semver.validRange(desiredVersion) == null) {
    console.error('Invalid version');
    process.exit(1);
}

const outputPath = path.join(__dirname, '/bpac-barcode');
const outputPathTemp = path.join(__dirname, `/bpac-barcode_${uuidV4()}`);

bpacRepo.listReleases((error, data) => {
    if (!error) {
        let release = null;
        let asset = null;

        // first find a semver-match
        // then check for a .zip asset
        for (let i = 0; i < data.length; i += 1) {
            const thisRelease = data[i];
            if (semver.satisfies(thisRelease.tag_name, desiredVersion)) {
                for (let j = 0; j < thisRelease.assets.length; j += 1) {
                    const thisAsset = thisRelease.assets[j];
                    if (thisAsset.name.substr(thisAsset.name.length - 4) === '.zip') {
                        release = thisRelease;
                        asset = thisAsset;
                        break;
                    }
                }
                if (release) {
                    break;
                }
            }
        }

        if (release && asset) {
            const downloadUrl = asset.browser_download_url;
            download(downloadUrl, outputPathTemp, {
                extract: true,
            }).then(() => {
                console.log(`Downloaded and extracted bpac-barcode:${release.tag_name}.`);
                fs.removeSync(outputPath);
                fs.moveSync(outputPathTemp, outputPath);
                console.log('Replaced old with new version');
            });
        } else {
            console.error(`No matching release found for ${desiredVersion}`);
        }
    }
});
