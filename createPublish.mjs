import templates from "./templates/index.mjs";
import YAML from 'yaml';
import { promises as fs } from 'fs';
import { join, basename } from 'path';
import chalk from "chalk";
import { createValidate } from "./createValidate.mjs";
import { executors } from "./executors.mjs";

function generateTimestampForFilename() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

export const createPublish = ({
    files, executor, workdir, output
}) => async function publish() {

    const templateFunctions = await Promise.all(templates.map((template) => template(executors[executor])));
    const timestamp = generateTimestampForFilename();
    const validate = await createValidate();

    async function extractOutputFromTemplate({ template, data, templateWorkdir, item, simpleItem }) {
        const resultFile = await template.fn({
            data,
            workdir: templateWorkdir,
        });

        await fs.mkdir(output, { recursive: true });

        const outputFile = join(output, item);
        await fs.cp(resultFile, outputFile);

        if (item != simpleItem) {
            const simpleOutputFile = join(output, simpleItem);
            await fs.cp(resultFile, simpleOutputFile);
        }

        console.log(chalk.green(`  ✅ ${item} has been generated`));

        return { data, item, status: 'success', file: outputFile};
    }

    async function processTemplateForValidFile(template, name, data) {
        const templateWorkdir = join(workdir, Math.random().toString(36).slice(-6));

        await fs.mkdir(templateWorkdir, { recursive: true });

        const item = `${name}-${timestamp}+${process.env.GITHUB_SHA.slice(0, 7)}.${template.extension}`;
        const simpleItem = `${name}.${template.extension}`;

        try {
            return extractOutputFromTemplate({ template, data, templateWorkdir, item, simpleItem })
        } catch (err) {
            console.log(chalk.red(`  ❌ ${item} could not be generated:`));

            console.log('    ' + err.message.split('\n').join('\n    '));

            return { data, item, status: 'error', message: err.message};
        }
    }

    async function processValidFile(name, data) {
        return await Promise.all(
            templateFunctions.map(async (template) => processTemplateForValidFile(template, name, data))
        );
    }

    function invalideFileTreatment(file, data) {
        console.log(chalk.red(`  ❌ ${file} is invalid`));

        const message = validate.errors
            .map(({ instancePath, keyword, message }) => `    ${chalk.gray(instancePath.replaceAll('/', '.')) || '<root>'}: ${chalk.yellow(keyword)} ${message}`)
            .join('\n')

        console.log(message);

        return [{ data, item: file, message, status: 'error' }];
    }

    async function processFile(file) {
        const [name] = basename(file).split('.');
        const data = YAML.parse(await fs.readFile(file, 'utf-8'));

        console.log(`🟣 Processing ${file}:`);

        const valid = validate(data);

        if (!valid) {
            return invalideFileTreatment(file, data);
        }

        console.log(chalk.blueBright(`  ${file} is valid`));

        return processValidFile(name, data);
    }

    function retrieveYamlFiles() {
        return files.filter(it => it.endsWith('.yaml') || it.endsWith('.yml'));
    }

    async function processFiles() {
        const yamlFiles = retrieveYamlFiles();

        return (await Promise.all(
            yamlFiles.map(async (file) => processFile(file))
        )).flatMap(el => el);
    }

    async function doPublish() {
        console.log(chalk.green('Loaded template functions [' + templateFunctions.map(it => it.id).join(", ") + ']'));

        return processFiles();
    }

    return doPublish();
};
