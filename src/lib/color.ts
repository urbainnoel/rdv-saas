// Calcule les variantes (foncée pour le hover, claire pour les fonds doux)
// à partir d'une seule couleur de marque choisie par l'entrepreneur — pour
// ne jamais lui demander de choisir 3 couleurs à la main.

import type { CSSProperties } from "react";

function hexToRgb(hex: string): [number, number, number] | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

function toHex(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, "0");
}

function mix(rgb: [number, number, number], target: [number, number, number], amount: number) {
  return rgb.map((c, i) => c + (target[i] - c) * amount) as [number, number, number];
}

export function isValidHexColor(value: string): boolean {
  return hexToRgb(value) !== null;
}

/**
 * Retourne { base, dark, soft } à partir d'une couleur hex valide.
 * `dark` : mélangée avec du noir (pour le hover).
 * `soft` : fortement mélangée avec du blanc (pour les fonds badges/pastilles).
 */
export function deriveBrandShades(hex: string): { base: string; dark: string; soft: string } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const dark = mix(rgb, [0, 0, 0], 0.22);
  const soft = mix(rgb, [255, 255, 255], 0.88);

  return {
    base: `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`,
    dark: `#${toHex(dark[0])}${toHex(dark[1])}${toHex(dark[2])}`,
    soft: `#${toHex(soft[0])}${toHex(soft[1])}${toHex(soft[2])}`,
  };
}

/**
 * Objet de style React qui, posé sur un conteneur, remplace la couleur
 * "forest" (verte, par défaut) par la couleur de marque de l'entrepreneur
 * pour toute sa sous-arborescence — sans dupliquer de CSS ni les classes
 * Tailwind existantes (bg-forest, text-forest...), qui se basent déjà sur
 * ces variables CSS.
 */
export function brandCssVars(brandColor: string | null | undefined): CSSProperties {
  if (!brandColor) return {};
  const shades = deriveBrandShades(brandColor);
  if (!shades) return {};
  return {
    "--color-forest": shades.base,
    "--color-forest-dark": shades.dark,
    "--color-forest-soft": shades.soft,
  } as CSSProperties;
}
