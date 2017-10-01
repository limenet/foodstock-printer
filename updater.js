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

const desiredVersion = '^1.0.0';

if (semver.validRange(desiredVersion) == null) {
    console.error('Invalid version');
    process.exit(1);
}

const lockfile = path.join(__dirname, 'bpac-barcode.lock');
const outputPath = path.join(__dirname, '/bpac-barcode');
const outputPathTemp = path.join(__dirname, `/bpac-barcode_${uuidV4()}`);

let isLockfileOutdated = true;
let lockfileContents = { desired: null, actual: null };
if (fs.existsSync(lockfile)) {
    lockfileContents = fs.readJsonSync(lockfile, { throws: false });

    if (!lockfileContents) {
        console.error('Lockfile invalid, cleaning up');
        fs.remove(lockfile);
    } else {
        isLockfileOutdated = lockfileContents.desired !== desiredVersion;

        if (isLockfileOutdated) {
            console.warn('Lockfile is outdated');
        }
    }
} else {
    console.info('No lockfile found');
}

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

        if (isLockfileOutdated || release.tag_name !== lockfileContents.actual || !fs.existsSync(outputPath)) {
            if (release && asset) {
                const downloadUrl = asset.browser_download_url;
                download(downloadUrl, outputPathTemp, {
                    extract: true,
                }).then(() => {
                    console.info(`Downloaded and extracted bpac-barcode:${release.tag_name}.`);
                    fs.removeSync(outputPath);
                    fs.moveSync(outputPathTemp, outputPath);
                    console.info('Replaced old with new version');
                    fs.writeJson(lockfile, {
                        desired: desiredVersion,
                        actual: release.tag_name,
                    }, 'utf8', () => {
                        console.info('Wrote lock file');
                    });
                });
            } else {
                console.error(`No matching release found for ${desiredVersion}`);
            }
        } else {
            console.info('bpac-barcode is up to date');
        }
    }
});
