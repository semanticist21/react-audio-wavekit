// ============================================================================
// Public API Exports (Tree-shakable)
// ============================================================================

export type { LiveAudioVisualizerProps, LiveAudioVisualizerRef } from "./recorder/live-audio-visualizer";
export { LiveAudioVisualizer } from "./recorder/live-audio-visualizer";
// Recording components (for live recording)
export type { UseAudioRecorderConfig, UseAudioRecorderReturn } from "./recorder/use-audio-recorder";
export { useAudioRecorder } from "./recorder/use-audio-recorder";
// Waveform components (for playback visualization)
export type { AudioWaveformProps, AudioWaveformRef } from "./waveform/audio-waveform";
export { AudioVisualizer, AudioWaveform, AudioWaveform as default } from "./waveform/audio-waveform";
export { decodeAudioBlob, getAudioData } from "./waveform/util-audio-decoder";
export type { WaveformRendererProps, WaveformRendererRef } from "./waveform/waveform-renderer";
export { WaveformRenderer } from "./waveform/waveform-renderer";
