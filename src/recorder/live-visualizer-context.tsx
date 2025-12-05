import { createContext, type ReactNode, useContext } from "react";
import { type UseLiveAudioDataOptions, type UseLiveAudioDataReturn, useLiveAudioData } from "./use-live-audio-data";

// Context type definition
type LiveVisualizerContextValue = UseLiveAudioDataReturn;

// Create context
const LiveVisualizerContext = createContext<LiveVisualizerContextValue | null>(null);

// Provider Props
export interface LiveVisualizerProviderProps extends UseLiveAudioDataOptions {
  children: ReactNode | ((value: LiveVisualizerContextValue) => ReactNode);
}

/**
 * LiveVisualizer Context Provider
 * Root component that provides real-time audio data to child components
 */
export function LiveVisualizerProvider({ children, ...options }: LiveVisualizerProviderProps) {
  const value = useLiveAudioData(options);

  // Support render props pattern
  const content = typeof children === "function" ? children(value) : children;

  return <LiveVisualizerContext.Provider value={value}>{content}</LiveVisualizerContext.Provider>;
}

/**
 * LiveVisualizer Contexthook
 * Root Must be used within component
 */
export function useLiveVisualizerContext(): LiveVisualizerContextValue {
  const context = useContext(LiveVisualizerContext);
  if (!context) {
    throw new Error("useLiveVisualizerContext must be used within LiveVisualizer.Root");
  }
  return context;
}
