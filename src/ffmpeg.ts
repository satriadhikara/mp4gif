export type ConvertOptions = {
    fps?: number;
    width?: number;
    start?: number;
    duration?: number;
    overwrite?: boolean;
};

export function buildFfmpegArgs(
    inputPath: string,
    outputPath: string,
    options: ConvertOptions,
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

    args.push('-loop', '0', outputPath);
    return args;
}

export async function assertFfmpeg(): Promise<string> {
    const which = Bun.which('ffmpeg');
    if (!which) {
        throw new Error(
            'ffmpeg not found in PATH. Install: macOS (brew install ffmpeg), Linux (apt/yum), Windows (scoop/choco)'
        );
    }
    return which;
}


