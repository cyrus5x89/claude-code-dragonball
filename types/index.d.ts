export type Pose = 'idle' | 'sleep' | 'charge' | 'punch' | 'blast'

declare module 'claude-code' {
  interface PluginState {
    dragonball: { pose: Pose; level: string }
  }
}
