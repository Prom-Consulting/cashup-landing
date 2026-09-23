import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Склейка классов: последний конфликтующий утилитарный класс побеждает. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
