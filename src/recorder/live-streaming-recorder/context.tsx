import { createContext, type ReactNode, useContext } from "react";
import {
  type UseRecordingAmplitudesOptions,
  type UseRecordingAmplitudesReturn,
  useRecordingAmplitudes,
} from "./use-recording-amplitudes";

// Context type definition
type RecordingWaveformContextValue = UseRecordingAmplitudesReturn;

// Create context
const RecordingWaveformContext = createContext<RecordingWaveformContextValue | null>(null);

// Provider Props
export interface RecordingWaveformProviderProps extends UseRecordingAmplitudesOptions {
  children: ReactNode | ((value: RecordingWaveformContextValue) => ReactNode);
}

/**
 * RecordingWaveform Context Provider
 * Root component that provides recording amplitude data to child components
 */
export function RecordingWaveformProvider({ children, ...options }: RecordingWaveformProviderProps) {
  const value = useRecordingAmplitudes(options);

  // Support render props pattern
  const content = typeof children === "function" ? children(value) : children;

  return <RecordingWaveformContext.Provider value={value}>{content}</RecordingWaveformContext.Provider>;
}

/**
 * RecordingWaveform Contexthook
 * Root Must be used within component
 */
export function useRecordingWaveformContext(): RecordingWaveformContextValue {
  const context = useContext(RecordingWaveformContext);
  if (!context) {
    throw new Error("useRecordingWaveformContext must be used within RecordingWaveform.Root");
  }
  return context;
}
