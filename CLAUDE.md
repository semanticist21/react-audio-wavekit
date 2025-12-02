# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React component library for audio waveform visualization. Outputs ESM + CJS bundles with TypeScript declarations.

## Commands

```bash
bun run build           # Build library to dist/ (ESM, CJS, .d.ts)
bun run dev             # Watch mode for development
bun run storybook       # Run Storybook dev server (port 6006)
bun run build-storybook # Build Storybook for production
bun run check           # Check code with Biome (actual command)
bun run fix             # Fix linting issues with Biome (actual command)
```

**Note:** Requires Node.js 20.19+ or 22.12+ (Vite 7 requirement). Use `nvm use default` if needed.

## Architecture

- **Build:** Vite 7 library mode with `vite-plugin-dts` for type generation
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite` plugin) - classes only, no CSS bundled
- **Output:** `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts` (types)
- **Externals:** React/ReactDOM are peer dependencies, not bundled
- **Linting/Formatting:** Biome for fast code quality checks and formatting
- **Dev Tools:** Storybook for component development and testing

## Code Conventions

- **File naming:** Use kebab-case for all file names (e.g., `audio-waveform.tsx`, `my-component.stories.tsx`)
- **Commit messages:** Follow conventional commit format with title only

## Component API

The main `AudioWaveform` component accepts:
- `blob`: Audio Blob to visualize (required for waveform display)
- `barWidth`, `gap`, `barRadius`: Visual customization (optional)
- `className`: Tailwind classes for styling (supports `text-*` for bar color, `bg-*` for background)

Key implementation detail: Canvas uses `text-inherit` class to enable Tailwind color inheritance via `getComputedStyle(canvas).color`.

## Key Decisions

- React 19.2.0 with exact version pinning for type compatibility
- Library consumers must include this package in their Tailwind `content` config
- No CSS is bundled - consumers use their own Tailwind setup
- Audio decoding uses Web Audio API (`AudioContext.decodeAudioData`)
- Waveform rendering uses canvas with device pixel ratio support