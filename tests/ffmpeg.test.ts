import { describe, it, expect, mock } from 'bun:test';
import { buildFfmpegArgs, assertFfmpeg } from '../src/ffmpeg.ts';

describe('buildFfmpegArgs', () => {
    it('builds args with defaults (no filters)', () => {
        const args = buildFfmpegArgs('in.mp4', 'out.gif', {});
        expect(args).toContain('-i');
        expect(args).toContain('in.mp4');
        expect(args.includes('-vf')).toBe(false);
        expect(args.includes('-y')).toBe(false);
        expect(args.includes('-ss')).toBe(false);
        expect(args.includes('-t')).toBe(false);
        expect(args.slice(-3)).toEqual(['-loop', '0', 'out.gif']);
    });

    it('builds args with options', () => {
        const args = buildFfmpegArgs('in.mp4', 'out.gif', { fps: 12, width: 480, start: 1, duration: 2, overwrite: true });
        expect(args).toContain('-y');
        expect(args).toContain('-ss');
        expect(args).toContain('1');
        expect(args).toContain('-i');
        expect(args).toContain('in.mp4');
        expect(args).toContain('-t');
        expect(args).toContain('2');
        const vfIndex = args.findIndex(a => a === '-vf');
        expect(vfIndex).toBeGreaterThan(-1);
        expect(args[vfIndex + 1]).toBe('fps=12,scale=480:-1:flags=lanczos');
        expect(args.slice(-3)).toEqual(['-loop', '0', 'out.gif']);
    });
});

describe('assertFfmpeg', () => {
    it('resolves when ffmpeg exists', async () => {
        const original = Bun.which;
        (Bun as any).which = mock(() => '/usr/bin/ffmpeg');
        try {
            const path = await assertFfmpeg();
            expect(path).toBe('/usr/bin/ffmpeg');
        } finally {
            (Bun as any).which = original;
        }
    });

    it('throws when ffmpeg not found', async () => {
        const original = Bun.which;
        (Bun as any).which = mock(() => null);
        try {
            await expect(assertFfmpeg()).rejects.toThrow();
        } finally {
            (Bun as any).which = original;
        }
    });
});


