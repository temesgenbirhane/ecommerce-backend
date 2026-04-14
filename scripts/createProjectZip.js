import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const ZIP_NAME_PATTERN = /^backup-(\d+)\.zip$/i;
const ARCHIVE_GLOB_PATTERN = '**/*';
const ARCHIVE_GLOB_OPTIONS = {
  cwd: projectRoot,
  dot: true,
  ignore: ['**/node_modules/**', '**/*.zip', '**/*.sqlite']
};

const getNextZipId = () => {
  const files = fs.readdirSync(projectRoot);
  const existingIds = files
    .map((fileName) => {
      const match = fileName.match(ZIP_NAME_PATTERN);
      return match ? Number(match[1]) : 0;
    })
    .filter((id) => Number.isInteger(id) && id > 0);

  if (existingIds.length === 0) {
    return 1;
  }

  return Math.max(...existingIds) + 1;
};

const createZip = async () => {
  const zipId = getNextZipId();
  const zipFileName = `backup-${zipId}.zip`;
  const outputPath = path.join(projectRoot, zipFileName);

  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      resolve({ zipFileName, bytes: archive.pointer() });
    });

    output.on('error', reject);
    archive.on('error', reject);

    archive.pipe(output);

    archive.glob(ARCHIVE_GLOB_PATTERN, ARCHIVE_GLOB_OPTIONS);

    archive.finalize();
  });
};

try {
  const { zipFileName, bytes } = await createZip();
  console.log(`Created ${zipFileName} (${bytes} bytes)`);
} catch (error) {
  console.error('Failed to create zip archive:', error);
  process.exit(1);
}
