import { createPublish } from "./createPublish.mjs";
import { glob } from 'glob';
import yargs from "yargs";

const argv = yargs(process.argv.slice(2)).parse();

const files = await Promise.all(argv.files.split(' ').map(el => glob(el, {
    cwd: argv.root ?? process.cwd,
})))


const publish = createPublish({
    files: files.flatMap(it => it),
    executor: argv.e ?? argv.executor ?? process.env.EXECUTOR,
    workdir: argv.w ?? argv.workdir ?? "/tmp/max-publisher",
    output: argv.o ?? argv.output ?? "/output"
});

await publish();


