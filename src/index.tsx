// Appearance Types (needed when customizing appearance prop)

export { LiveRecorder } from "./recorder/live-recorder/index.js";
export { LiveStreamingRecorder } from "./recorder/live-streaming/recorder/recorder-compound.js";
export { LiveStreamingStackRecorder } from "./recorder/live-streaming/stack-recorder/stack-recorder-compound.js";
// Hook Return Type (needed for typing useAudioRecorder return value)
export type { UseAudioRecorderReturn } from "./recorder/use-audio-recorder.js";
// Hook
export { useAudioRecorder } from "./recorder/use-audio-recorder.js";
export type { AudioWaveformAppearance, ScrollbarAppearance, WaveformAppearance } from "./types.js";
// Components
export { AudioWaveform } from "./waveform/index.js";
