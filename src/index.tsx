// ============================================================================
// Public API Exports
// ============================================================================

// Utilities (advanced use)
export { decodeAudioBlob, getAudioData } from "./audio-decoder";
export type { AudioWaveformProps, AudioWaveformRef } from "./audio-waveform";
// Main component (supports both regular and Suspense modes via `suspense` prop)
// Default export
export { AudioVisualizer, AudioWaveform, AudioWaveform as default } from "./audio-waveform";
export type { WaveformRendererProps, WaveformRendererRef } from "./waveform-renderer";
// Low-level renderer (advanced use)
export { WaveformRenderer } from "./waveform-renderer";
