import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTestTypeInRussian(type: string): string {
  switch (type.toLowerCase()) {
    case 'hinted':
      return 'Тест с подсказками';
    case 'section_final':
      return 'Финальный тест раздела';
    case 'global_final':
      return 'Финальный тест темы';
    case 'practice':
      return 'Практический тест';
    default:
      return type;
  }
}
