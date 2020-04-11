import * as fs from "fs";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as io from "@actions/io";
import { issueCommand } from "@actions/core/lib/command";
import { Either, parseJSON, left, right, either } from "fp-ts/lib/Either";
import { ElmAnalyse } from "./elm-analyse";

const elmAnalyseVersion = core.getInput("elm_analyse_version", {
  required: true
});
const ignoreError = core.getInput("ignore_error") === "true";
const workingDirectory = core.getInput("working_directory") || process.cwd();

const install = async () => {
  core.debug("Installing npm dependencies");
  const npm = await io.which("npm", true);
  core.debug(`Found npm "${npm}"`);
  await npmInit(npm);
  await installPackage(npm, "elm-analyse", elmAnalyseVersion);
};

const npmInit = async (npmPath: string) => {
  if (!fs.existsSync(`${workingDirectory}/package.json`)) {
    core.debug(`Nod Found package.json`);
    await exec.exec(npmPath, ["init", "-y"], {
      silent: true,
      cwd: workingDirectory
    });
  } else {
    core.debug(`Found package.json`);
  }
};

const installPackage = async (
  npmPath: string,
  packageName: string,
  version: string
) => {
  core.debug(`Installing ${packageName}`);
  await exec.exec(npmPath, ["i", "-D", `${packageName}@${version}`], {
    silent: true,
    cwd: workingDirectory
  });
};

const execNpx: (
  command: string,
  args: string[]
) => Promise<Either<string, string>> = async (
  command: string,
  args: string[]
) => {
  let output = "";
  let errorOutput = "";
  const options = {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
      stderr: (data: Buffer) => {
        errorOutput += data.toString();
      }
    },
    silent: true,
    cwd: workingDirectory
  };
  const npx = await io.which("npx", true);
  await exec.exec(npx, [command].concat(args), options).catch(e => e);

  if (errorOutput) {
    return left(errorOutput);
  }
  return right(output.slice(output.indexOf("{")));
};

const runAnalyse = async () => {
  core.debug(`Run analyse`);
  const commandResult = await execNpx("elm-analyse", ["--format", "json"]);
  const analyseJson = either.chain(commandResult, output => {
    return parseJSON(output, e => e);
  }) as Either<string, ElmAnalyse>;

  const result = either.chain(analyseJson, report => {
    const issues = report.messages.map(message => {
      issueCommand(
        "warning",
        {
          file: workingDirectory
            ? `${workingDirectory}/${message.file}`
            : message.file,
          line: message.data.properties.range[0].toString(),
          col: message.data.properties.range[1].toString()
        },
        message.data.description
      );
      return true;
    });
    if (issues.length > 0 && !ignoreError) {
      core.setFailed("elm-analyse error.");
    }
    return right(true);
  });

  either.mapLeft(result, e => {
    core.setFailed(e);
  });
};

const run = async () => {
  try {
    await install();
    await runAnalyse();
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
