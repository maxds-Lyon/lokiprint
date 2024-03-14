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

    await Promise.all(
        files
            .filter(it => it.endsWith('.yaml') || it.endsWith('.yml'))
            .map(async (file) => {
                const [name] = basename(file).split('.');
                const data = YAML.parse(await fs.readFile(file, 'utf-8'));

                console.log(`🟣 Processing ${file}:`);

                const valid = validate(data);

                if (!valid) {
                    console.log(chalk.red(`  ❌ ${file} is invalid`));

                    console.log(validate.errors
                        .map(({ instancePath, keyword, message }) => `    ${chalk.gray(instancePath.replaceAll('/', '.')) || '<root>'}: ${chalk.yellow(keyword)} ${message}`)
                        .join('\n')
                    );

                    return;
                }

                console.log(chalk.blueBright(`  ${file} is valid`));

                return await Promise.all(
                    templateFunctions.map(async (template) => {
                        const templateWorkdir = join(workdir, Math.random().toString(36).slice(-6));

                        await fs.mkdir(templateWorkdir, { recursive: true });

                        try {
                            const resultFile = await template.fn({
                                data,
                                workdir: templateWorkdir
                            });

                            await fs.mkdir(output, { recursive: true });

                            await fs.cp(resultFile, join(output, name + '.' + template.extension));

                            console.log(chalk.green(`  ✅ ${name}.${template.extension} has been generated`));
                        } catch (err) {
                            console.log(chalk.red(`  ❌ ${name}.${template.extension} could not be generated:`));

                            console.log('    ' + err.message.split('\n').join('\n    '));

                            return;
                        }
                    })
                );
            })
    );
};
