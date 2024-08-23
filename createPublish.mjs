import templates from "./templates/index.mjs";
import YAML from "yaml";
import { promises as fs } from "fs";
import { join, basename } from "path";
import chalk from "chalk";
import { createValidate } from "./createValidate.mjs";
import { executors } from "./executors.mjs";
import pino from "pino";
const logger = pino({ transport: { target: "pino-pretty" } });

function generateTimestampForFilename() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function logFileGenerationSuccess(item) {
  logger.info(chalk.green(`  ✅ ${item} has been generated`));
}

function logFileGenerationError(item, err) {
  logger.info(chalk.red(`  ❌ ${item} could not be generated:`));
  logger.info("    " + err.message.split("\n").join("\n    "));
}

function logValidationFailure(file, validate) {
  logger.info(chalk.red(`  ❌ ${file} is invalid`));
  const message = validate.errors
    .map(
      ({ instancePath, keyword, message }) =>
        `    ${
          chalk.gray(instancePath.replaceAll("/", ".")) || "<root>"
        }: ${chalk.yellow(keyword)} ${message}`
    )
    .join("\n");
  logger.info(message);
}

function logValidationSuccess(file) {
  logger.info(chalk.blueBright(`  ${file} is valid`));
}

export const createPublish = ({ files, executor, workdir, output, globals }) =>
  async function publish() {
    logger.info({ files, executor, workdir, output, globals });

    const templateFunctions = await Promise.all(
      templates.map((template) => template(executors[executor]))
    );
    const timestamp = generateTimestampForFilename();
    const validate = await createValidate();

    async function mergeWithGlobals(config) {
      if (!globals) {
        logger.warn("  ⚠️ No globals specified.");
        return config;
      }

      const globalsContent = await fs.readFile(globals, "utf-8");
      return {
        ...YAML.parse(globalsContent),
        ...config,
      };
    }

    async function executeTemplateAndExtractOutput({
      template,
      data,
      templateWorkdir,
      item,
      simpleItem,
    }) {
      const resultFile = await template.fn({
        data: await mergeWithGlobals(data),
        workdir: templateWorkdir,
      });

      await fs.mkdir(output, { recursive: true });
      const outputFile = join(output, item);
      const simpleOutputFile = join(output, simpleItem);

      await fs.cp(resultFile, outputFile);
      await fs.cp(resultFile, simpleOutputFile);

      logFileGenerationSuccess(item);
      return { data, item, status: "success", file: outputFile };
    }

    async function processTemplateForValidFile(template, name, data) {
      const templateWorkdir = join(
        workdir,
        Math.random().toString(36).slice(-6)
      );
      await fs.mkdir(templateWorkdir, { recursive: true });

      const item = `${name}-${timestamp}+${process.env.GITHUB_SHA.slice(
        0,
        7
      )}.${template.extension}`;
      const simpleItem = `${name}.${template.extension}`;

      try {
        return executeTemplateAndExtractOutput({
          template,
          data,
          templateWorkdir,
          item,
          simpleItem,
        });
      } catch (err) {
        logFileGenerationError(item, err);
        return { data, item, status: "error", message: err.message };
      }
    }

    async function processValidFile(name, data) {
      return await Promise.all(
        templateFunctions.map(async (template) =>
          processTemplateForValidFile(template, name, data)
        )
      );
    }

    async function processFile(file) {
      const [name] = basename(file).split(".");
      const data = YAML.parse(await fs.readFile(file, "utf-8"));

      logger.info(`🟣 Processing ${file}:`);
      const valid = validate(data);

      if (!valid) {
        logValidationFailure(file, validate);
        return [
          { data, item: file, message: "Validation failed", status: "error" },
        ];
      }

      logValidationSuccess(file);
      return processValidFile(name, data);
    }

    function retrieveYamlFiles() {
      return files.filter((it) => it.endsWith(".yaml") || it.endsWith(".yml"));
    }

    async function processFiles() {
      const yamlFiles = retrieveYamlFiles();
      return (
        await Promise.all(yamlFiles.map((file) => processFile(file)))
      ).flatMap((el) => el);
    }

    logger.info(
      chalk.green(
        "Loaded template functions [" +
          templateFunctions.map((it) => it.id).join(", ") +
          "]"
      )
    );

    return processFiles();
  };
