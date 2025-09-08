// Utility functions for the RYTHM app

/**
 * Calculate 1RM estimate using Epley formula
 * @param weight Weight lifted in kg
 * @param reps Number of repetitions
 * @returns Estimated 1RM in kg
 */
export function calculateOneRM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * Calculate pace (distance per second)
 * @param distance Distance in meters
 * @param duration Duration in seconds
 * @returns Pace in meters per second
 */
export function calculatePace(distance: number, duration: number): number {
  if (duration === 0) return 0;
  return distance / duration;
}

/**
 * Calculate training volume (weight × reps)
 * @param weight Weight in kg
 * @param reps Number of repetitions
 * @returns Training volume
 */
export function calculateVolume(weight: number, reps: number): number {
  return weight * reps;
}

/**
 * Format duration in seconds to human readable format
 * @param seconds Duration in seconds
 * @returns Formatted duration string (e.g., "2:30" for 2 minutes 30 seconds)
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Parse duration string to seconds
 * @param duration Duration string (e.g., "2:30" or "1:23:45")
 * @returns Duration in seconds
 */
export function parseDuration(duration: string): number {
  const parts = duration.split(':').map(Number);
  
  if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  return 0;
}

/**
 * Generate a unique identifier for offline operations
 * @returns UUID-like string for temporary IDs
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate that a value type is appropriate for an exercise
 * @param exerciseName Name of the exercise
 * @param valueType Type of value being set
 * @returns Boolean indicating if the combination is valid
 */
export function isValidValueTypeForExercise(exerciseName: string, valueType: string): boolean {
  const lowerName = exerciseName.toLowerCase();
  
  // Common strength exercises should use weight
  const strengthKeywords = ['squat', 'bench', 'deadlift', 'press', 'curl', 'row'];
  const isStrengthExercise = strengthKeywords.some(keyword => lowerName.includes(keyword));
  
  // Common cardio exercises should use distance/duration
  const cardioKeywords = ['run', 'bike', 'row', 'swim', 'walk'];
  const isCardioExercise = cardioKeywords.some(keyword => lowerName.includes(keyword));
  
  if (isStrengthExercise && valueType === 'weight_kg') return true;
  if (isCardioExercise && ['distance_m', 'duration_s'].includes(valueType)) return true;
  
  // Allow all combinations for flexibility (as per PRD)
  return true;
}

/**
 * Convert between units for display
 */
export function convertWeight(kg: number, unit: 'kg' | 'lbs'): number {
  if (unit === 'lbs') return kg * 2.20462;
  return kg;
}

export function convertDistance(meters: number, unit: 'km' | 'miles' | 'm'): number {
  switch (unit) {
    case 'km': return meters / 1000;
    case 'miles': return meters / 1609.34;
    default: return meters;
  }
}