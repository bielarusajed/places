import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFormWithStress(form: string, stressIndexes: number[] | null) {
  if (!stressIndexes || stressIndexes.length === 0) {
    return form;
  }

  let result = '';
  for (let i = 0; i < form.length; i++) {
    result += form[i];
    if (stressIndexes.includes(i)) {
      result += String.fromCharCode(769); // combining acute accent U+0301
    }
  }
  return result;
}
