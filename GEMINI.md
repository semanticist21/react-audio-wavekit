# React Audio WaveKit - Gemini Context

## Project Overview
**React Audio WaveKit** is a React component library for high-performance audio waveform visualization and live recording. It provides a set of type-safe, customizable components and hooks that leverage the Web Audio API and MediaRecorder API, with WASM fallback for broad mobile compatibility.

**Key Features:**
- 🎵 **Static Waveform Visualization** (`AudioWaveform`) with playhead and seek support.
- 🎙️ **Live Recording Visualization** (`LiveRecorder`, `LiveStreamingRecorder`).
- 🧠 **Headless Hooks** (`useAudioRecorder`) for custom implementations.
- 📱 **Mobile Compatible** (WASM decoder fallback).
- ⚛️ **Modern React** (Hooks, Suspense support, Server-Side Rendering compatible).

## Tech Stack & Tooling

| Category | Technology | Notes |
|----------|------------|-------|
| **Core** | React 18+, TypeScript | Hooks-based architecture |
| **Build** | Vite 7 | Library mode, outputs ESM/CJS |
| **Styling** | Tailwind CSS v4 | Classes only, no bundled CSS |
| **Linting** | Biome | Replaces ESLint/Prettier |
| **Testing** | Vitest, Storybook | Unit testing & Visual component dev |
| **Package** | Bun | Preferred package manager & runner |

## Key Commands

The project uses **Bun** as the primary task runner.

```bash
# Development
bun run dev             # Start Vite in watch mode
bun run storybook       # Start Storybook server (port 6006)

# Quality Assurance
bun run check           # Lint & type-check (Biome + tsgo)
bun run fix             # Auto-fix linting issues
bun run test            # Run unit tests (Vitest)

# Build
bun run build           # Build library to dist/ (ESM, CJS, .d.ts)
bun run build-storybook # Build static Storybook site
```

## Architecture & Directory Structure

The source code is modularized by feature within `src/`.

```
src/
├── index.tsx              # Public API entry point (exports all components/hooks)
├── types.ts               # Shared appearance types
├── constants.ts           # Default configuration values
├── waveform/              # 📊 Static Waveform Visualization
│   ├── index.tsx              # AudioWaveform component
│   ├── waveform-renderer.tsx  # Canvas rendering logic
│   ├── util-audio-decoder.ts  # Audio decoding (Native + WASM)
│   └── util-suspense.ts       # React Suspense integration
├── recorder/              # 🎙️ Live Recording Features
│   ├── use-audio-recorder.ts  # Main public hook for recording state
│   ├── live-recorder/         # Frequency bars visualization
│   └── live-streaming/        # Timeline visualization (Scrolling & Stacked)
│       ├── recorder/          # LiveStreamingRecorder (Voice Memos style)
│       └── stack-recorder/    # LiveStreamingStackRecorder (Fixed width)
└── _storybook/            # 📖 Documentation & Demo Stories
```

## Core Concepts

### 1. Visualization Patterns
- **Static:** `AudioWaveform` visualizes a `Blob` or pre-computed `peaks`. Supports drag-to-seek.
- **Live Frequency:** `LiveRecorder` shows real-time frequency bars (FFT data).
- **Live Timeline:** 
    - `LiveStreamingRecorder`: Canvas grows/scrolls horizontally (like Voice Memos).
    - `LiveStreamingStackRecorder`: Fixed width, bars compress as recording lengthens.

### 2. Component Design
- **Simple Components:** Direct prop interface (e.g., `AudioWaveform`, `LiveRecorder`).
- **Compound Components:** Flexible composition for complex UIs (e.g., `LiveStreamingRecorder.Root` + `.Canvas`).
- **Headless Hooks:** Logic separated from UI (e.g., `useAudioRecorder`, `useLiveAudioData`).

### 3. Appearance System
All visual components accept an `appearance` prop typed as `WaveformAppearance`.
- **Defaults:** Defined in `src/constants.ts` (e.g., `barColor`, `barWidth`, `barGap`).
- **Responsiveness:** Components handle `devicePixelRatio` automatically for sharp rendering on high-DPI screens.

## Development Conventions

- **Package Manager:** Use `bun` for scripts and dependency management.
- **File Naming:** Use `kebab-case` for all files (e.g., `audio-waveform.tsx`).
- **Imports:** Use relative paths. Biome automatically organizes imports.
- **Exports:** All public members must be exported from `src/index.tsx`.
- **Linting:** Strictly adhere to Biome rules (`bun run fix` is your friend).
    - Double quotes, semicolons, ES5 trailing commas.
    - Max line width: 120 characters.
- **Commits:** Conventional Commits format (`type: description`). No emojis.
- **Testing:** Add Storybook stories for UI components; use Vitest for logic/hooks.

## Common Tasks

### Adding a New Component
1. Create a folder under `src/waveform/` or `src/recorder/`.
2. Implement the component and/or hook (prefer splitting logic into `use-*.ts`).
3. Export it in `src/index.tsx`.
4. Create a story in `src/_storybook/` to verify behavior visually.

### Building for Production
The build command (`bun run build`) generates:
- `dist/index.js` (ESM)
- `dist/index.cjs` (CommonJS)
- `dist/index.d.ts` (Type Definitions)

**Note:** `react` and `react-dom` are peer dependencies and are **not** bundled.
