import os from "os";
import { glob } from "glob";
import { exec } from "child_process";
import yargs from "yargs";
import pino from "pino";

import { createPublish } from "./createPublish.mjs";
import notify from "./notify/index.mjs";

const logger = pino({ transport: { target: "pino-pretty" } });

const ASCII_ART = `
                 (((.              #%%%((
               ((//#(///(#%%%((####%%####((
               ((/(##%%%%%%&&#%%#%####((##//((((
            #(((((#(,(%%%#%@&&%%####(##((,/((///
        *(/((#/,#%(#*/#%%%%@@%%%%%#(((%%/ .#(*/*
         (////./#%%/######%@@&###(/*.*//.  ./(#(
          #/(//(#,(,(((,/#@&&&&#/,,,,,(/(*  /*##
           /(.//(###&&%#%@&&%%&&&%/#(#((((,../(#
            *.#*(%%####&@@&&&&&&&&&#(/(((/,((/##
             %(,#%%%#%@&@%*,.,,.*#&%%(//(///#%%#
            %%,.%###(&&@&,,,,,,...#&&(//(//(/##%#
            &%((%(##%&@&&#*,, .,,/&&%#(((((###(#%
           &%((/#%%##&&@&%#//,***(%%###((#%%%#(##
           &&##/#%%%##%%##(/**,*###%&%%%%%%#%###(
           #&%/,#%%%%##%%%%&%&&%&&&&&&&&%%%%####(
            ###(((#(%#%%%&&%##%&&&&%&&&@&&%%##%%%#
             %%%%##(#%#%&&&%##%%&%&&&&&@&&%&#%%###((,
             #%&%%#######%%##%%%&%&%&&@&&%%&%###(/(#/(
            ##&&&%%%##(####%%%&%&&&&%&&&%%%%%##%%####((
           %#%&&&%%%%%####%%%#%&%&%%%&&%&&%%###&##(%#//(
          ##%&&&&&%%&&%%%%%%%&%&%%%%&&&#%%%&#%#%%###(/#(
          %%&&&&&%%%&%&%%%%%%%%&%&&&&&%%%&%%&%%#%%(%/#*(
`;

logger.info(ASCII_ART);

const argv = yargs(process.argv.slice(2)).parse();
logger.info(
  `Using glob ${argv.files.split(" ")} on ${argv.root ?? process.cwd()}`
);

async function logVersions() {
  const typstVersion = await exec(`typst --version`);
  typstVersion.stdout.on("data", (data) => {
    logger.info(`Typst version: ${data.toString().trim()}`);
  });
  logger.info(`Operating System: ${os.type()} ${os.release()}`);
  logger.info(`Node.js Version: ${process.version}`);
}

async function resolveFiles(patterns, root) {
  return Promise.all(
    patterns.split(" ").map((pattern) =>
      glob(pattern, {
        cwd: root ?? process.cwd(),
        ignore: ".github/**",
      })
    )
  );
}

async function executePublishingProcess() {
  const files = await resolveFiles(argv.files, argv.root);
  const publishConfig = {
    files: files.flatMap((it) => it),
    executor: argv.e ?? argv.executor ?? process.env.EXECUTOR,
    workdir: argv.w ?? argv.workdir ?? "/tmp/max-publisher",
    output: argv.o ?? argv.output ?? "/output",
    globals: argv.g ?? argv.globals ?? "maxds.yaml",
  };

  const publish = createPublish(publishConfig);
  const results = await publish();

  if (results.length > 0) {
    await Promise.all(notify.map((factory) => factory(argv)(results)));
  }
}

await logVersions();
await executePublishingProcess();
