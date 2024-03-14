import { promises as fs } from 'fs';
import { join } from 'path';
import { fetchFonts } from './fetch-fonts.mjs';

export default async (executor) => {
    const fontDir = '.template/cache/fonts';
    await fs.mkdir(join(import.meta.dirname, fontDir), { recursive: true });
    await fetchFonts(join(import.meta.dirname, 'main.typ'), join(import.meta.dirname, fontDir));

    return {
        id: 'typst',
        extension: 'pdf',
        fn: async ({data, workdir}) => {
            await fs.writeFile(workdir + '/data.json', JSON.stringify(data), 'utf-8');

            await fs.cp(join(import.meta.dirname, '.template'), join(workdir, '.template'), { recursive: true });
            await fs.cp(join(import.meta.dirname, 'main.typ'), join(workdir, 'main.typ'));

            try {
                await executor({
                    cwd: workdir,
                    image: 'ghcr.io/typst/typst:v0.10.0',
                    executable: 'typst',
                    command: [
                        'compile', 
                        '--root', workdir,
                        '--font-path', join(workdir, fontDir),
                        join(workdir, 'main.typ'), 
                        join(workdir, 'output.pdf')
                    ]
                });
            } catch (err) {
                throw new Error(err.stderr);
            }

            return join(workdir, 'output.pdf');
        }
    };
}