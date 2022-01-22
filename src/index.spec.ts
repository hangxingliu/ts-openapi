import * as glob from "glob";
import { fork } from "child_process";
import { cyan, red, bold } from "colors/safe";
import { basename, dirname, resolve as resolvePath } from "path";

main().catch((e) => {
  console.error(e);
  console.error(red(`Error: ${e.message}`));
  process.exit(1);
});

async function main() {
  let specFiles = await new Promise<string[]>((resolve, reject) => {
    glob("**/*.spec.ts", { cwd: __dirname }, (e, matches) => {
      if (e) return reject(new Error(`search spec files failed: ${e.message}`));
      return resolve(matches);
    });
  });
  specFiles = specFiles.filter(it => it !== 'index.spec.ts');

  let ok = true;
  for (let i = 0; i < specFiles.length; i++) {
    const specFile = specFiles[i];
    const specPath = resolvePath(__dirname, specFile);
    if ((await run(specPath)) !== true) ok = false;
  }
  if (!ok) throw new Error(`Test failed!`);
  console.log(bold(`Done: ${specFiles.length} spec files are passed!`));
}

async function run(specPath: string) {
  const specName = basename(specPath);
  return new Promise<boolean>((resolve, reject) => {
    console.log(cyan(bold(`[${specName}] Running ...`)));
    const child = fork(specPath, {
      cwd: dirname(specPath),
      stdio: ["inherit", "inherit", "inherit", "ipc"],
    });
    child.on("error", (err) => {
      console.error(red(`[${specName}] Error: ${err.message}`));
      return reject(err);
    });
    child.on("exit", (code, signal) => {
      if(code !== 0)
        console.log(red(`[${specName}] Exit: ${code}`));
      return resolve(code === 0);
    });
  });
}
