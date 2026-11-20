export type Pose = 'idle' | 'charge' | 'blast'

declare module 'claude-code' {
  interface PluginState {
    dragonball: { pose: Pose; level: string }
  }
}
