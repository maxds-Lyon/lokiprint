import Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import { join } from 'path';

Handlebars.registerHelper('join', (context, options) => {
    const fn = options.fn;

    if (!context) return "";

    return context.map((value) => fn(value, { data: options.data }))
        .join(options.hash.sep);
});

export default async (executor) => {
    const content = await fs.readFile(import.meta.dirname + '/main.md.hbs', 'utf-8');
    const template = Handlebars.compile(content);

    return {
        id: 'markdown',
        extension: 'docx',
        fn: async ({data, workdir}) => {
            await fs.copyFile(join(import.meta.dirname, 'template-maxds.docx'), join(workdir, 'reference.docx'))

            await fs.writeFile(join(workdir, 'output.md'), template(data));

            await executor({
                cwd: workdir,
                image: 'docker.io/pandoc/core:edge',
                executable: 'pandoc',
                command: ['./output.md', '--from=markdown', '--reference-doc=reference.docx' , '--output=output.docx']
            });

            return join(workdir, 'output.docx');
        }
    };
}