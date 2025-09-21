# mp4gif

Convert MP4 to GIF in one command (powered by Bun + ffmpeg).

## Requirements

- `ffmpeg` must be installed and available in your PATH.
  - macOS: `brew install ffmpeg`
  - Linux: `apt install ffmpeg` (Debian/Ubuntu) or `dnf/yum install ffmpeg`
  - Windows: `scoop install ffmpeg` or `choco install ffmpeg`

## Install

- Global install (recommended):

```bash
bun add -g mp4gif
```

- One-off without installing (after publishing):

```bash
bunx mp4gif --help
```

## Usage

```bash
mp4gif <input.mp4> [output.gif] [options]
```

Options:

```
-o, --output <path>   Output GIF path (default: <input_basename>.gif)
--fps <number>        Frames per second (default: 10)
--width <number>      Output width in px, keeps aspect ratio
--start <seconds>     Start offset in seconds
--duration <seconds>  Duration in seconds
--overwrite           Overwrite output if it exists
-h, --help            Show help
```

## Examples

```bash
# Quick convert with defaults (outputs input.gif next to the input)
mp4gif ./clip.mp4

# Custom FPS and width
mp4gif ./input.mp4 ./output.gif --fps 12 --width 480

# Trim a segment (start at 5s for 3s)
mp4gif ./input.mp4 ./out.gif --start 5 --duration 3

# Overwrite existing output
mp4gif ./input.mp4 ./out.gif --overwrite
```

## Development

```bash
bun install

# Run locally without global install
bun run mp4gif ./input.mp4 ./output.gif --fps 12 --width 480

# Or link once to use the global command from this repo
bun link
mp4gif ./input.mp4 ./output.gif
```

## License

MIT
