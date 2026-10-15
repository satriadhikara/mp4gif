#!/usr/bin/env bun
import { exit } from 'node:process';
import { convertMp4ToGif, type ConvertOptions } from './index.ts';

type CliOptions = Required<Pick<ConvertOptions, 'fps' | 'overwrite'>> & Omit<ConvertOptions, 'fps' | 'overwrite'>;

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
    let explicitOutputPath: string | undefined;
    const positionals: string[] = [];

    for (let i = 0; i < args.length; i++) {
        const token = args[i]!;
        if (token === '-h' || token === '--help') {
            printUsage();
            exit(0);
        } else if (token === '-o' || token === '--output') {
            const next = args[++i];
            if (!next) throw new Error('Missing value for --output');
            explicitOutputPath = next;
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
    const outputPath = explicitOutputPath
        ?? positionals[1]
        ?? inputPath.replace(/\.[^.]+$/, '') + '.gif';

    return { inputPath, outputPath, options };
}

async function main(): Promise<void> {
    try {
        const { inputPath, outputPath, options } = parseArgs(Bun.argv.slice(2));
        await convertMp4ToGif(inputPath, outputPath, options);
    } catch (err) {
        console.error((err as Error).message ?? err);
        exit(1);
    }
}

await main();


