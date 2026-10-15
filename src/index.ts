import { assertFfmpeg, buildFfmpegArgs, type ConvertOptions } from './ffmpeg.ts';
import { fileExists } from './fs.ts';

export type { ConvertOptions } from './ffmpeg.ts';

export async function convertMp4ToGif(
    inputPath: string,
    outputPath: string,
    options: ConvertOptions = {},
): Promise<void> {
    const normalizedOptions: ConvertOptions = {
        fps: 10,
        overwrite: false,
        ...options,
    };

    // !(v > 0) also rejects NaN
    for (const key of ['fps', 'width', 'duration'] as const) {
        const v = normalizedOptions[key];
        if (v !== undefined && !(v > 0)) throw new Error(`${key} must be a positive number`);
    }
    if (normalizedOptions.start !== undefined && !(normalizedOptions.start >= 0)) {
        throw new Error('start must be a non-negative number');
    }

    await assertFfmpeg();

    if (!(await fileExists(inputPath))) {
        throw new Error(`Input file not found: ${inputPath}`);
    }

    if (!normalizedOptions.overwrite && (await fileExists(outputPath))) {
        throw new Error(`Output file already exists: ${outputPath}. Use overwrite option to replace.`);
    }

    const ffmpegArgs = buildFfmpegArgs(inputPath, outputPath, normalizedOptions);
    const proc = Bun.spawn(['ffmpeg', ...ffmpegArgs], {
        stdout: 'inherit',
        stderr: 'inherit',
    });
    const code = await proc.exited;
    if (code !== 0) {
        throw new Error(`ffmpeg exited with code ${code}`);
    }
}


