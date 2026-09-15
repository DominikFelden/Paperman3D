// Single switch for all debug-only visuals (particle trails, velocity vectors, etc.).
// Flip to false to disable them everywhere with effectively zero runtime cost.
export const GLOBAL_DEBUG = true

// Caps how many trail markers/vectors a particle keeps, so long debug sessions don't leak meshes.
export const TRAIL_MAX_LENGTH = 200
