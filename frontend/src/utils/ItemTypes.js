export const ITEM_TYPES = {
  armor: {
    label: "Armor",
    types: {
      Cloth: ["Mage", "Priest", "Warlock"],
      Leather: ["Demon Hunter", "Druid", "Monk", "Rogue"],
      Mail: ["Evoker", "Hunter", "Shaman"],
      Plate: ["Death Knight", "Paladin", "Warrior"],
    },
  },
  stat: {
    label: "Stats",
    types: {
      Strength: {
        "Death Knight": ["tank", "melee"],
        Paladin: ["tank", "melee"],
        Warrior: ["tank", "melee"],
      },
      Agility: {
        "Demon Hunter": ["tank", "melee"],
        Druid: ["tank", "melee"],
        Hunter: ["melee", "ranged"],
        Monk: ["tank", "melee"],
        Rogue: ["melee"],
        Shaman: ["melee"],
      },
      Intellect: {
        Druid: ["healer", "ranged"],
        Evoker: ["healer", "ranged"],
        Mage: ["ranged"],
        Monk: ["healer"],
        Paladin: ["healer"],
        Priest: ["healer", "ranged"],
        Shaman: ["healer", "ranged"],
        Warlock: ["ranged"],
      },
    },
  },
};

export const getAllTypesGrouped = () => {
  const groups = [];
  Object.keys(ITEM_TYPES).forEach((catKey) => {
    const cat = ITEM_TYPES[catKey];
    groups.push({ label: cat.label, options: Object.keys(cat.types) });
  });
  return groups;
};

export const isClassEligibleForType = (cls, role, typeKey) => {
  if (!cls || !role) return false;
  if (typeKey.includes(cls)) return true;
  if (typeKey.includes(role)) return true;
  for (const tk of typeKey) {
    const eligibleForArmor = ITEM_TYPES.armor.types[tk];
    if (eligibleForArmor && eligibleForArmor.includes(cls)) {
      return true;
    }
    const eligibleForStats = ITEM_TYPES.stat.types[tk];
    if (eligibleForStats && eligibleForStats.hasOwnProperty(cls)) {
      const eligibleRoles = eligibleForStats[cls];
      if (eligibleRoles && eligibleRoles.includes(role)) {
        return true;
      }
    }
  }
  return false;
};

export default ITEM_TYPES;
