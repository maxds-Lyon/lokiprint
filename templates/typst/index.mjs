import { promises as fs } from 'fs';
import { join } from 'path';
import pino from "pino";

const logger = pino({ transport: { target: "pino-pretty" } });

export default async (executor) => {
    const executeTypstCommand = async (commandArgs, workdir) => {
        try {
            await executor({
                cwd: workdir,
                executable: 'typst',
                command: commandArgs
            });
        } catch (err) {
            logger.error("Failed to execute Typst command:", err);
            throw new Error(`Typst execution failed: ${err.message}`);
        }
    };

    const compileTypst = async (fontDir, workdir) => {
        const compileCommand = [
            'compile',
            '--root', workdir,
            '--font-path', fontDir,
            join(workdir, 'main.typ'),
            join(workdir, 'output.pdf')
        ];
        await executeTypstCommand(compileCommand, workdir);
    };

    const prepareWorkdir = async (data, workdir) => {
        await fs.writeFile(join(workdir, 'data.json'), JSON.stringify(data), 'utf-8');
        await fs.cp(join(import.meta.dirname, '.template'), join(workdir, '.template'), { recursive: true });
        await fs.cp(join(import.meta.dirname, 'main.typ'), join(workdir, 'main.typ'));
    };

    return {
        id: 'typst',
        extension: 'pdf',
        fn: async ({ data, workdir }) => {
            await prepareWorkdir(data, workdir);
            await compileTypst(join(import.meta.dirname, '.template/fonts'), workdir);
            return join(workdir, 'output.pdf');
        }
    };
}