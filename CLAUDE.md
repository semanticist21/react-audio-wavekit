# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React component library for audio waveform visualization and live recording. Outputs ESM + CJS bundles with TypeScript declarations. Tree-shakable exports for optimal bundle size.

## Commands

```bash
bun run build           # Build library to dist/ (ESM, CJS, .d.ts)
bun run dev             # Watch mode for development
bun run storybook       # Run Storybook dev server (port 6006)
bun run build-storybook # Build Storybook static site
bun run check           # Check code with Biome + TypeScript (tsgo)
bun run fix             # Fix linting issues with Biome
```

**Note:** Requires Node.js 20.19+ or 22.12+ (Vite 7 requirement).

## Architecture

```
src/
├── index.tsx              # Library entry point (exports all public APIs)
├── index.css              # Tailwind import (Storybook only)
├── types.ts               # Shared appearance types (WaveformAppearance, defaults)
├── waveform/              # Static waveform visualization
│   ├── index.tsx                  # Main AudioWaveform component
│   ├── use-audio-waveform.ts      # Headless hook
│   ├── waveform-renderer.tsx      # Canvas rendering logic
│   ├── util-audio-decoder.ts      # Web Audio API decoding
│   └── util-suspense.ts           # React Suspense cache
├── recorder/              # Live recording components
│   ├── live-recorder/         # Real-time frequency bars
│   │   └── use-live-audio-data.ts # Headless hook
│   ├── live-streaming/        # Both timeline recorders share this folder
│   │   ├── types.ts               # Shared recorder types
│   │   ├── use-recording-amplitudes.ts # Shared headless hook
│   │   ├── recorder/              # Scrolling timeline (Voice Memos style)
│   │   │   ├── index.tsx              # Entry point
│   │   │   ├── recorder-compound.tsx  # LiveStreamingRecorder compound API
│   │   │   └── recorder-context.tsx   # Context provider
│   │   └── stack-recorder/        # Fixed width (bars compress)
│   │       ├── index.tsx              # Entry point
│   │       ├── stack-recorder-compound.tsx # LiveStreamingStackRecorder compound API
│   │       └── stack-recorder-context.tsx  # Context provider
│   ├── use-audio-analyser.ts # Shared Web Audio setup hook
│   ├── use-audio-recorder.ts # MediaRecorder hook with pause/resume
│   └── util-mime-type.ts     # Audio MIME type detection
└── _storybook/            # Storybook demo stories
```

**Component Architecture Pattern:**
- **Simple Components:** Direct prop-based API for easy usage (AudioWaveform)
- **Compound Components:** Flexible composition API for complex use cases (LiveStreamingRecorder, LiveStreamingStackRecorder)
- **Headless Hooks (Recommended):** Extract raw data for custom UI implementations

**Build System:**
- **Build:** Vite 7 library mode with `vite-plugin-dts` for type generation
- **Styling:** Tailwind CSS v4 - classes only, no CSS bundled
- **Output:** `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts` (types)
- **Externals:** React/ReactDOM are peer dependencies, not bundled
- **Linting:** Biome (lineWidth: 120, double quotes, semicolons, ES5 trailing commas)
- **Type Checking:** tsgo (TypeScript native preview with `--noEmit`)

## Code Conventions

- **File naming:** kebab-case (e.g., `audio-waveform.tsx`, `use-audio-recorder.ts`)
- **Component organization:** Feature folders contain `use-*.ts` (headless hook) and optional compound component files (`*-compound.tsx`, `*-context.tsx`)
- **Exports:** All public APIs exported from `src/index.tsx` (auto-sorted by Biome)
- **Imports:** Use relative paths; Biome auto-organizes import order
- **Commit messages:** Conventional commit format, title only (no co-authored-by, no emoji)
- **Code quality:** Always run `bun run fix` after code changes, then `bun run check` to verify
- **Comments:** Add Korean comments for important code sections explaining key logic

## Component API Patterns

### Simple Components

**AudioWaveform** - Static waveform visualization with playhead support:
```tsx
// Basic usage
<AudioWaveform blob={audioBlob} className="h-32 w-full" />

// With playhead and seek
<AudioWaveform
  blob={audioBlob}
  className="h-32 w-full"
  currentTime={audioElement.currentTime}
  duration={audioElement.duration}
  onSeek={(time) => audioElement.currentTime = time}
  appearance={{ playheadColor: "#ef4444", playheadWidth: 2 }}
/>

// Custom bar styling via appearance prop
<AudioWaveform
  blob={audioBlob}
  className="h-32 w-full"
  appearance={{ barColor: "#22c55e", barWidth: 5, barGap: 2, barRadius: 2 }}
/>
```

### Compound Components

**LiveStreamingRecorder** - Timeline waveform recording (scrolling):
```tsx
<LiveStreamingRecorder.Root
  mediaRecorder={mediaRecorder}
  className="w-72 overflow-x-auto"
>
  <LiveStreamingRecorder.Canvas
    appearance={{ barColor: "#3b82f6", barWidth: 3, barGap: 1 }}
    growWidth={true}
  />
</LiveStreamingRecorder.Root>
```

**LiveStreamingStackRecorder** - Fixed width waveform (bars compress):
```tsx
<LiveStreamingStackRecorder.Root
  mediaRecorder={mediaRecorder}
  className="w-72"
>
  <LiveStreamingStackRecorder.Canvas
    appearance={{ barColor: "#3b82f6", barWidth: 3, barGap: 1 }}
  />
</LiveStreamingStackRecorder.Root>
```

### Headless Hooks

**useAudioRecorder** - Recording state management:
- Returns: `{ startRecording, stopRecording, pauseRecording, resumeRecording, mediaRecorder, recordingBlob, isRecording, isPaused, recordingTime, error }`

**useAudioWaveform** - Extract waveform data from audio blob:
- Returns: `{ amplitudes, isLoading, error }`

**useLiveAudioData** - Extract real-time frequency data:
- Returns: `{ frequencies, volumes, audioContext, analyser, isRecording, isPaused }`

**useRecordingAmplitudes** - Extract timeline amplitude data:
- Returns: `{ amplitudes, audioContext, analyser, isRecording, isPaused, clearAmplitudes }`

**useAudioAnalyser** - Low-level Web Audio setup (shared internally):
- Creates AudioContext, AnalyserNode, connects MediaRecorder stream
- Returns refs for audioContext, analyser, dataArray, bufferLength

## Key Implementation Details

- **Appearance System:** All waveform components use `appearance` prop with `WaveformAppearance` type (barColor, barWidth, barGap, barRadius, barHeightScale). Defaults exported as `DEFAULT_WAVEFORM_APPEARANCE` from `types.ts`.
- **Audio Decoding:** Web Audio API (`AudioContext.decodeAudioData`) for blob processing
- **Device Pixel Ratio:** Automatic DPR support for sharp canvas rendering on retina displays
- **Growing Canvas Width:** `LiveStreamingRecorder.Canvas` supports `growWidth` prop - when true, canvas grows horizontally as recording continues (Voice Memos style with scrolling)
- **Playhead & Seek:** `AudioWaveform` supports playhead visualization and click-to-seek - pass `currentTime`, `duration`, and `onSeek` props. Uses `AudioWaveformAppearance` which extends `WaveformAppearance` with `playheadColor` and `playheadWidth`.

## Development Workflow

1. **Making Changes:**
   ```bash
   bun run dev           # Start watch mode
   bun run storybook     # Visual testing
   # Make changes...
   bun run fix           # Auto-fix linting
   bun run check         # Verify types + lint
   ```

2. **Adding New Components:**
   - Create feature folder under `recorder/` or `waveform/`
   - Include: `use-*.ts` (headless hook, recommended pattern)
   - For compound components, add `recorder/recorder-compound.tsx` and `recorder/recorder-context.tsx`
   - Export all public APIs from `src/index.tsx` (Biome auto-sorts)
   - Add Storybook story in `src/_storybook/`

3. **Git Workflow:**
   - Commit message format: `type: description` (e.g., `feat: add pitch detection`, `fix: canvas memory leak`)
   - No co-authored-by, no emoji in commits
   - Always run checks before committing

아직 출시 안한 라이브러리니까 호환성 생각하지말고 코딩좀해라