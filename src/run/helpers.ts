import { spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

chalk.red();

export const splitFilesToThreads = (files: string[], numberThreads: number) =>
    files.reduce((acc, cur, index) => {
        const idx = index % numberThreads;
        if (Array.isArray(acc[idx])) {
            acc[idx].push(cur);
        } else {
            acc.push([cur]);
        }
        return acc;
    }, [] as string[][]);

export const enhanceFilePath = (files: string[], dir: string) => files.map((file: string) => `${dir}/${file}`);

export const createChildProcess = (binPath, args: string[]) => spawn(binPath, ['run', '--spec'].concat(args));

export const handleChildProcessSync = (childProcess, logFile: string, callback: (err, result?: string) => void) => {
    const outputFile = fs.createWriteStream(logFile);
    const { name } = path.parse(logFile);

    childProcess.stdout.pipe(outputFile);

    childProcess.stderr.pipe(outputFile);

    childProcess.on('error', (error) => {
        // eslint-disable-next-line no-console
        console.log(`${chalk.blue(name)} ${chalk.magenta('(error)')}: ${chalk.redBright(error.message)}`);
    });

    childProcess.on('close', (code) => {
        const exitCode = code ? chalk.redBright(code) : chalk.green(code);
        // eslint-disable-next-line no-console
        console.log(`${chalk.blue(name)} exited with code ${exitCode}`);
        if (code) {
            callback(new Error(`${chalk.redBright('Tests failed, see logs')} ${chalk.blue.underline(logFile)}`));
        } else {
            callback(null, 'Success');
        }
    });
};

export const handleChildProcess = promisify(handleChildProcessSync);

interface ExecBin {
    files: string[];
    binPath: string;
    outputLogDir: string;
    index: number;
    getopt: string[];
}

export const execBin = async ({ files, binPath, outputLogDir, index, getopt }: ExecBin) => {
    const arg = files.join(',');
    const name = `thread-${index + 1}`;
    const logFile = path.join(outputLogDir, `${name}.log`);
    const args = [arg].concat(getopt);
    const cypressRun = createChildProcess(binPath, args);
    // eslint-disable-next-line no-console
    console.log(`${chalk.blue(name)} started with tests: ${chalk.yellow(arg)}`);
    const result = await handleChildProcess(cypressRun, logFile);
    return result;
};

export const createOutputLogDir = (outputLog) => {
    if (!fs.existsSync(outputLog)) {
        fs.mkdirSync(outputLog, { recursive: true });
    }
};

interface RunCypressTests {
    threadsWithFiles: string[][];
    binPath: string;
    outputLogDir: string;
    getopt: string[];
}

export const runCypressTests = async ({ threadsWithFiles, binPath, outputLogDir, getopt }: RunCypressTests) =>
    Promise.all(threadsWithFiles.map((files, index) => execBin({ files, binPath, outputLogDir, index, getopt })));
