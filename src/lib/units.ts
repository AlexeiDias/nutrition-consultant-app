// src/lib/units.ts

export type UnitSystem = 'metric' | 'imperial';

// ── Weight ──────────────────────────────────────────────
export function kgToLb(kg: number): number {
  return Math.round(kg * 2.205 * 10) / 10;
}
export function lbToKg(lb: number): number {
  return Math.round((lb / 2.205) * 10) / 10;
}
export function displayWeight(kg: number, system: UnitSystem): string {
  if (!kg) return '—';
  return system === 'imperial' ? `${kgToLb(kg)} lb` : `${kg} kg`;
}
export function weightLabel(system: UnitSystem): string {
  return system === 'imperial' ? 'lb' : 'kg';
}
export function toStorageWeight(value: number, system: UnitSystem): number {
  return system === 'imperial' ? lbToKg(value) : value;
}
export function toDisplayWeight(kg: number, system: UnitSystem): number {
  return system === 'imperial' ? kgToLb(kg) : kg;
}

// ── Height ──────────────────────────────────────────────
export function cmToFtIn(cm: number): string {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
}
export function ftInToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * 2.54);
}
export function displayHeight(cm: number, system: UnitSystem): string {
  if (!cm) return '—';
  return system === 'imperial' ? cmToFtIn(cm) : `${cm} cm`;
}
export function heightLabel(system: UnitSystem): string {
  return system === 'imperial' ? 'ft / in' : 'cm';
}

// ── Food quantity ────────────────────────────────────────
export function gToOz(g: number): number {
  return Math.round((g / 28.35) * 10) / 10;
}
export function ozToG(oz: number): number {
  return Math.round(oz * 28.35);
}
export function displayQuantity(g: number, system: UnitSystem): string {
  if (!g && g !== 0) return '—';
  return system === 'imperial' ? `${gToOz(g)} oz` : `${g} g`;
}
export function quantityLabel(system: UnitSystem): string {
  return system === 'imperial' ? 'oz' : 'g';
}
export function toStorageQuantity(value: number, system: UnitSystem): number {
  return system === 'imperial' ? ozToG(value) : value;
}

// ── Water ────────────────────────────────────────────────
export function lToFlOz(l: number): number {
  return Math.round(l * 33.814 * 10) / 10;
}
export function flOzToL(flOz: number): number {
  return Math.round((flOz / 33.814) * 100) / 100;
}
export function displayWater(l: number, system: UnitSystem): string {
  if (!l) return '—';
  return system === 'imperial' ? `${lToFlOz(l)} fl oz` : `${l} L`;
}
export function waterLabel(system: UnitSystem): string {
  return system === 'imperial' ? 'fl oz' : 'L';
}
export function toStorageWater(value: number, system: UnitSystem): number {
  return system === 'imperial' ? flOzToL(value) : value;
}
