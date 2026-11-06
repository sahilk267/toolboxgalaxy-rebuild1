import type { LootType } from "./types";

/** Ground loot that can be collected partially while the remainder stays on the map. */
export function isStackableSurvivLoot(type: LootType): boolean {
  return type === "ammo" || type === "bandage" ||
    type === "medkit" || type === "soda" || type === "pills";
}

export const SURVIV_MEDICAL_LIMITS = {
  bandage: 15,
  medkit: 3,
  soda: 6,
  pills: 4,
} as const;

export type SurvivMedicalLoot = keyof typeof SURVIV_MEDICAL_LIMITS;

export const SURVIV_MEDICAL_INVENTORY_KEY = {
  bandage: "bandages",
  medkit: "medkits",
  soda: "sodas",
  pills: "pills",
} as const satisfies Record<SurvivMedicalLoot, string>;

/** Move only the available capacity out of a ground stack; never discard overflow. */
export function transferSurvivLootStack(
  carried: number,
  capacity: number,
  onGround: number,
): { carried: number; onGround: number; taken: number } {
  if (![carried, capacity, onGround].every(Number.isSafeInteger) ||
      carried < 0 || capacity < 0 || onGround < 0) {
    return { carried, onGround, taken: 0 };
  }
  const taken = Math.min(onGround, Math.max(0, capacity - carried));
  return { carried: carried + taken, onGround: onGround - taken, taken };
}
