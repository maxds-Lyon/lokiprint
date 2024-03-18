import templates from "./templates/index.mjs";
import YAML from 'yaml';
import { promises as fs } from 'fs';
import { join, basename } from 'path';
import chalk from "chalk";
import { createValidate } from "./createValidate.mjs";
import { executors } from "./executors.mjs";

export const createPublish = ({
    files, executor, workdir, output
}) => async function publish() {

    const validate = await createValidate();

    const templateFunctions = await Promise.all(templates.map((template) => template(executors[executor])));

    console.log(chalk.green('Loaded template functions [' + templateFunctions.map(it => it.id).join(", ") + ']'));

    return (await Promise.all(
        files
            .filter(it => it.endsWith('.yaml') || it.endsWith('.yml'))
            .map(async (file) => {
                const [name] = basename(file).split('.');
                const data = YAML.parse(await fs.readFile(file, 'utf-8'));

                console.log(`🟣 Processing ${file}:`);

                const valid = validate(data);

                if (!valid) {
                    console.log(chalk.red(`  ❌ ${file} is invalid`));

                    const message = validate.errors
                        .map(({ instancePath, keyword, message }) => `    ${chalk.gray(instancePath.replaceAll('/', '.')) || '<root>'}: ${chalk.yellow(keyword)} ${message}`)
                        .join('\n')
                    

                    console.log(message);

                    return [{ data, item: file, message, status: 'error' }];
                }

                console.log(chalk.blueBright(`  ${file} is valid`));

                return await Promise.all(
                    templateFunctions.map(async (template) => {
                        const templateWorkdir = join(workdir, Math.random().toString(36).slice(-6));

                        await fs.mkdir(templateWorkdir, { recursive: true });

                        const item = `${name}.${template.extension}`;

                        try {
                            const resultFile = await template.fn({
                                data,
                                workdir: templateWorkdir
                            });

                            await fs.mkdir(output, { recursive: true });

                            const outputFile = join(output, name + '.' + template.extension);

                            await fs.cp(resultFile, outputFile);

                            console.log(chalk.green(`  ✅ ${item} has been generated`));

                            return { data, item, status: 'success', file: outputFile};
                        } catch (err) {
                            console.log(chalk.red(`  ❌ ${item} could not be generated:`));

                            console.log('    ' + err.message.split('\n').join('\n    '));

                            return { data, item, status: 'error', message: err.message};
                        }
                    })
                );
            })
    )).flatMap(el => el);
};
