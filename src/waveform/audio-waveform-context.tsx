import { createContext, type ReactNode, useContext } from "react";
import { type UseAudioWaveformOptions, type UseAudioWaveformReturn, useAudioWaveform } from "./use-audio-waveform";

// Context type definition
type AudioWaveformContextValue = UseAudioWaveformReturn;

// Create context
const AudioWaveformContext = createContext<AudioWaveformContextValue | null>(null);

// Provider Props
export interface AudioWaveformProviderProps extends UseAudioWaveformOptions {
  children: ReactNode | ((value: AudioWaveformContextValue) => ReactNode);
}

/**
 * AudioWaveform Context Provider
 * Root component that provides waveform data to child components
 */
export function AudioWaveformProvider({ children, ...options }: AudioWaveformProviderProps) {
  const value = useAudioWaveform(options);

  // Support render props pattern
  const content = typeof children === "function" ? children(value) : children;

  return <AudioWaveformContext.Provider value={value}>{content}</AudioWaveformContext.Provider>;
}

/**
 * AudioWaveform Contexthook
 * Root Must be used within component
 */
export function useAudioWaveformContext(): AudioWaveformContextValue {
  const context = useContext(AudioWaveformContext);
  if (!context) {
    throw new Error("useAudioWaveformContext must be used within AudioWaveform.Root");
  }
  return context;
}
