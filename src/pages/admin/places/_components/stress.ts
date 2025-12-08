/**
 * Stress mark utilities for form editing
 * Uses combining acute accent (U+0301) for stress marks
 */

const STRESS_MARK = '\u0301';

/**
 * Insert stress mark at cursor position in an input element
 */
export function insertStressMark(input: HTMLInputElement | HTMLTextAreaElement): void {
  const start = input.selectionStart ?? 0;
  const end = input.selectionEnd ?? 0;
  const value = input.value;
  
  // Insert stress mark at the end of selection
  const newValue = value.slice(0, end) + STRESS_MARK + value.slice(end);
  input.value = newValue;
  
  // Set cursor position after the inserted mark
  const newPosition = end + STRESS_MARK.length;
  input.setSelectionRange(newPosition, newPosition);
  
  // Trigger input event for React controlled components
  const event = new Event('input', { bubbles: true });
  input.dispatchEvent(event);
}

/**
 * Convert stressed string to plain form + stress indexes
 * Removes all combining acutes and records their positions
 */
export function parseStressedString(stressed: string): { form: string; stressIndexes: number[] } {
  const stressIndexes: number[] = [];
  let form = '';
  let plainIndex = 0;
  
  for (let i = 0; i < stressed.length; i++) {
    const char = stressed[i];
    if (char === STRESS_MARK) {
      // Stress mark found - record the index of the previous character
      // Only record if there's a preceding character (ignore stress at position 0)
      if (plainIndex > 0) {
        stressIndexes.push(plainIndex - 1);
      }
      // Don't increment plainIndex for the stress mark itself
    } else {
      form += char;
      plainIndex++;
    }
  }
  
  // Remove duplicates and sort
  const uniqueIndexes = Array.from(new Set(stressIndexes)).sort((a, b) => a - b);
  
  return { form, stressIndexes: uniqueIndexes };
}

/**
 * Render plain form + stress indexes back to display string with stress marks
 */
export function renderStressedString(form: string, stressIndexes: number[]): string {
  if (!stressIndexes || stressIndexes.length === 0) {
    return form;
  }
  
  // Sort indexes in descending order to insert from end to start
  const sortedIndexes = [...stressIndexes].sort((a, b) => b - a);
  
  let result = form;
  for (const index of sortedIndexes) {
    // Only insert if index is valid
    if (index >= 0 && index < result.length) {
      result = result.slice(0, index + 1) + STRESS_MARK + result.slice(index + 1);
    }
  }
  
  return result;
}
