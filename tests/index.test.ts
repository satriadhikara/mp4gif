import { describe, it, expect, mock, spyOn } from 'bun:test';
import { convertMp4ToGif } from '../src/index.ts';

function mockSpawn(exitCode: number, captureArgs?: (args: string[]) => void) {
    const originalSpawn = Bun.spawn;
    (Bun as any).spawn = mock((cmd: string[]) => {
        const args = cmd as unknown as string[];
        captureArgs?.(args);
        return {
            exited: Promise.resolve(exitCode),
            ref() { return this; },
            unref() { return this; },
            kill() { return true; },
            stdin: null,
            stdout: null,
            stderr: null,
        } as unknown as ReturnType<typeof Bun.spawn>;
    });
    return () => { (Bun as any).spawn = originalSpawn; };
}

describe('convertMp4ToGif', () => {
    it('rejects invalid numeric options', async () => {
        await expect(convertMp4ToGif('input.mp4', 'output.gif', { fps: 0 })).rejects.toThrow('fps must be a positive number');
        await expect(convertMp4ToGif('input.mp4', 'output.gif', { width: -5 })).rejects.toThrow('width must be a positive number');
        await expect(convertMp4ToGif('input.mp4', 'output.gif', { duration: NaN })).rejects.toThrow('duration must be a positive number');
        await expect(convertMp4ToGif('input.mp4', 'output.gif', { start: -1 })).rejects.toThrow('start must be a non-negative number');
    });

    it('throws if input does not exist', async () => {
        const cleanupSpawn = mockSpawn(0);
        const file = spyOn(Bun, 'file');
        (file as any).mockImplementation((path: string) => ({ exists: async () => path.endsWith('input.mp4') ? false : false }));
        const whichOriginal = Bun.which;
        (Bun as any).which = mock(() => '/usr/bin/ffmpeg');

        try {
            await expect(convertMp4ToGif('input.mp4', 'output.gif')).rejects.toThrow('Input file not found');
        } finally {
            cleanupSpawn();
            (Bun as any).which = whichOriginal;
            (file as any).mockRestore?.();
        }
    });

    it('throws if output exists and no overwrite', async () => {
        const cleanupSpawn = mockSpawn(0);
        const file = spyOn(Bun, 'file');
        (file as any).mockImplementation((path: string) => ({ exists: async () => path.endsWith('input.mp4') ? true : true }));
        const whichOriginal = Bun.which;
        (Bun as any).which = mock(() => '/usr/bin/ffmpeg');

        try {
            await expect(convertMp4ToGif('input.mp4', 'output.gif', { overwrite: false })).rejects.toThrow('Output file already exists');
        } finally {
            cleanupSpawn();
            (Bun as any).which = whichOriginal;
            (file as any).mockRestore?.();
        }
    });

    it('spawns ffmpeg and resolves on exit code 0', async () => {
        let captured: string[] | undefined;
        const cleanupSpawn = mockSpawn(0, args => captured = args);
        const file = spyOn(Bun, 'file');
        (file as any).mockImplementation((path: string) => ({ exists: async () => path.endsWith('input.mp4') ? true : false }));
        const whichOriginal = Bun.which;
        (Bun as any).which = mock(() => '/usr/bin/ffmpeg');

        try {
            await expect(convertMp4ToGif('input.mp4', 'output.gif', { fps: 10, overwrite: true })).resolves.toBeUndefined();
            expect(captured?.[0]).toBe('ffmpeg');
            expect(captured).toContain('-i');
            expect(captured).toContain('input.mp4');
            expect(captured?.slice(-3)).toEqual(['-loop', '0', 'output.gif']);
        } finally {
            cleanupSpawn();
            (Bun as any).which = whichOriginal;
            (file as any).mockRestore?.();
        }
    });

    it('throws when ffmpeg exits with non-zero', async () => {
        const cleanupSpawn = mockSpawn(2);
        const file = spyOn(Bun, 'file');
        (file as any).mockImplementation((path: string) => ({ exists: async () => path.endsWith('input.mp4') ? true : false }));
        const whichOriginal = Bun.which;
        (Bun as any).which = mock(() => '/usr/bin/ffmpeg');

        try {
            await expect(convertMp4ToGif('input.mp4', 'output.gif', { overwrite: true })).rejects.toThrow('ffmpeg exited with code 2');
        } finally {
            cleanupSpawn();
            (Bun as any).which = whichOriginal;
            (file as any).mockRestore?.();
        }
    });
});


