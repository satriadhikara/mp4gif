#!/usr/bin/env bun
import { exit } from "node:process";

type CliOptions = {
    outputPath?: string;
    fps: number;
    width?: number;
    start?: number;
    duration?: number;
    overwrite: boolean;
};

function printUsage(): void {
    const usage = `
mp4gif - Convert MP4 to GIF (requires ffmpeg)

Usage:
  mp4gif <input.mp4> [output.gif] [options]

Options:
  -o, --output <path>   Output GIF path (default: <input_basename>.gif)
  --fps <number>        Frames per second (default: 10)
  --width <number>      Output width in pixels, keeps aspect ratio (optional)
  --start <seconds>     Start time offset in seconds (optional)
  --duration <seconds>  Duration to convert in seconds (optional)
  --overwrite           Overwrite output file if it exists
  -h, --help            Show this help
`;
    console.log(usage);
}

function parseArgs(argv: string[]): { inputPath: string; outputPath: string; options: CliOptions } {
    const args = [...argv];
    const options: CliOptions = { fps: 10, overwrite: false };
    const positionals: string[] = [];

    for (let i = 0; i < args.length; i++) {
        const token = args[i]!;
        if (token === '-h' || token === '--help') {
            printUsage();
            exit(0);
        } else if (token === '-o' || token === '--output') {
            const next = args[++i];
            if (!next) throw new Error('Missing value for --output');
            options.outputPath = next;
        } else if (token === '--fps') {
            const next = args[++i];
            if (!next || isNaN(Number(next))) throw new Error('Invalid value for --fps');
            options.fps = Number(next);
        } else if (token === '--width') {
            const next = args[++i];
            if (!next || isNaN(Number(next))) throw new Error('Invalid value for --width');
            options.width = Number(next);
        } else if (token === '--start') {
            const next = args[++i];
            if (!next || isNaN(Number(next))) throw new Error('Invalid value for --start');
            options.start = Number(next);
        } else if (token === '--duration') {
            const next = args[++i];
            if (!next || isNaN(Number(next))) throw new Error('Invalid value for --duration');
            options.duration = Number(next);
        } else if (token === '--overwrite') {
            options.overwrite = true;
        } else if (token.startsWith('-')) {
            throw new Error(`Unknown option: ${token}`);
        } else {
            positionals.push(token!);
        }
    }

    if (positionals.length < 1) {
        throw new Error('Missing input file. Run with --help for usage.');
    }

    const inputPath = positionals[0]!;
    const outputPath = options.outputPath
        ?? positionals[1]
        ?? inputPath.replace(/\.[^.]+$/, '') + '.gif';

    return { inputPath, outputPath, options };
}

async function assertFfmpeg(): Promise<string> {
    const which = Bun.which('ffmpeg');
    if (!which) {
        console.error('Error: ffmpeg not found in PATH.');
        console.error('Install ffmpeg: macOS (brew install ffmpeg), Linux (apt/yum), Windows (scoop/choco).');
        exit(1);
    }
    return which;
}

async function fileExists(path: string): Promise<boolean> {
    try {
        return await Bun.file(path).exists();
    } catch {
        return false;
    }
}

function buildFfmpegArgs(
    inputPath: string,
    outputPath: string,
    options: CliOptions,
): string[] {
    const args: string[] = [];

    if (options.overwrite) args.push('-y');
    if (typeof options.start === 'number') args.push('-ss', String(options.start));

    args.push('-i', inputPath);

    if (typeof options.duration === 'number') args.push('-t', String(options.duration));

    const filters: string[] = [];
    if (typeof options.fps === 'number') filters.push(`fps=${options.fps}`);
    if (typeof options.width === 'number') filters.push(`scale=${options.width}:-1:flags=lanczos`);
    if (filters.length > 0) args.push('-vf', filters.join(','));

    // -loop 0 makes the GIF loop forever
    args.push('-loop', '0', outputPath);
    return args;
}

async function main(): Promise<void> {
    try {
        const { inputPath, outputPath, options } = parseArgs(Bun.argv.slice(2));

        await assertFfmpeg();

        if (!(await fileExists(inputPath))) {
            console.error(`Input file not found: ${inputPath}`);
            exit(1);
        }

        if (!options.overwrite && (await fileExists(outputPath))) {
            console.error(`Output file already exists: ${outputPath}. Use --overwrite to replace.`);
            exit(1);
        }

        const ffmpegArgs = buildFfmpegArgs(inputPath, outputPath, options);

        const proc = Bun.spawn(['ffmpeg', ...ffmpegArgs], {
            stdout: 'inherit',
            stderr: 'inherit',
        });
        const code = await proc.exited;
        if (code !== 0) {
            console.error(`ffmpeg exited with code ${code}`);
            exit(code);
        }
    } catch (err) {
        console.error((err as Error).message ?? err);
        exit(1);
    }
}

await main();


