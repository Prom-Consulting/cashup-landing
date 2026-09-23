"use client";

import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
import { cn } from "./lib";

export type IconSvg = HugeiconsIconProps["icon"];

/**
 * Иконки HugeIcons с нашими значениями по умолчанию: размер по строке текста,
 * цвет наследуется от родителя, из потока чтения скрыты.
 */
export function Icon({
  icon,
  size = 20,
  className,
  ...rest
}: { icon: IconSvg; size?: number; className?: string } & Omit<HugeiconsIconProps, "icon" | "size">) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...rest}
    />
  );
}
