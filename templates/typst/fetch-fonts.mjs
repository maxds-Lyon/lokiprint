import { join } from 'path';
import { promises as fs } from 'fs'
import { $ } from 'execa';

const fontFace = /@font-face\((?<mode>\w*)=(?<url>.*)\)/g

const downloadFonts = async (targetDir, url) => {
    const tempFile = join('/tmp/', 'font-face-' + Math.random().toString(36).slice(-6));

    await $`wget -O ${tempFile} ${url}`

    await $`unzip -od ${targetDir} ${tempFile}`
}

const copyDir = async (targetDir, dir) => {
    await $`cp -r ${join(import.meta.dirname, dir)}. ${targetDir}`
}

const modes = {
    url: downloadFonts,
    dir: copyDir
}

const fetchFont = (mode, targetDir, param) => modes[mode](targetDir, param)

export const fetchFonts = async (file, output) => {
    const content = await fs.readFile(file, 'utf-8');

    const matches = [...content.matchAll(fontFace)];

    await Promise.all(
        matches.map(({ groups }) => fetchFont(groups.mode, output, groups.url))
    )
}