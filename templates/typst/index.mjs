import {promises as fs} from 'fs';
import {join} from 'path';

export default async (executor) => {
    async function tryExecuteTypst(fontDir, workdir) {
        try {
            await executor({
                cwd: workdir,
                image: 'ghcr.io/typst/typst:v0.10.0',
                executable: 'typst',
                command: [
                    'compile',
                    '--root', workdir,
                    '--font-path', fontDir,
                    join(workdir, 'main.typ'),
                    join(workdir, 'output.pdf')
                ]
            });
        } catch (err) {
            throw new Error(err.stderr);
        }
    }

    return {
        id: 'typst',
        extension: 'pdf',
        fn: async ({data, workdir}) => {
            await fs.writeFile(workdir + '/data.json', JSON.stringify(data), 'utf-8');

            await fs.cp(join(import.meta.dirname, '.template'), join(workdir, '.template'), { recursive: true });
            await fs.cp(join(import.meta.dirname, 'main.typ'), join(workdir, 'main.typ'));

            await tryExecuteTypst(join(import.meta.dirname, '.template/fonts'), workdir);

            return join(workdir, 'output.pdf');
        }
    };
}