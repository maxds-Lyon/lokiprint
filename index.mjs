import { createPublish } from "./createPublish.mjs";
import { glob } from 'glob';
import notify from './notify/index.mjs';
import yargs from "yargs";

const argv = yargs(process.argv.slice(2)).parse();

console.log(`Using glob ${argv.files.split(' ')} on ${argv.root ?? process.cwd()}`)

const files = await Promise.all(argv.files.split(' ').map(el => glob(el, {
    cwd: argv.root ?? process.cwd(),
    ignore: '.github/**' 
})))

const publish = createPublish({
    files: files.flatMap(it => it),
    executor: argv.e ?? argv.executor ?? process.env.EXECUTOR,
    workdir: argv.w ?? argv.workdir ?? "/tmp/max-publisher",
    output: argv.o ?? argv.output ?? "/output"
});

const results = await publish();

await Promise.all(notify.map(factory => factory(argv)(results)));