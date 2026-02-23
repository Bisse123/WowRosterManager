export const ITEM_TYPES = {
  armor: {
    label: "Armor",
    types: {
      cloth: ["mage", "priest", "warlock"],
      leather: ["demon hunter", "druid", "monk", "rogue"],
      mail: ["evoker", "hunter", "shaman"],
      plate: ["death knight", "paladin", "warrior"],
    },
  },
  stat: {
    label: "Stats",
    types: {
      strength: {
        "death knight": ["tank", "melee"],
        paladin: ["tank", "melee"],
        warrior: ["tank", "melee"],
      },
      agility: {
        "demon hunter": ["tank", "melee"],
        druid: ["tank", "melee"],
        hunter: ["melee", "ranged"],
        monk: ["tank", "melee"],
        rogue: ["melee"],
        shaman: ["melee"],
      },
      intellect: {
        druid: ["healer", "ranged"],
        evoker: ["healer", "ranged"],
        mage: ["ranged"],
        monk: ["healer"],
        paladin: ["healer"],
        priest: ["healer", "ranged"],
        shaman: ["healer", "ranged"],
        warlock: ["ranged"],
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
  const clsKey = String(cls).toLowerCase();
  const roleKey = String(role).toLowerCase();
  console.log(`Checking eligibility for class: ${clsKey}, role: ${roleKey}, against typeKey: ${typeKey}`);
  console.log(typeKey)
  if (typeKey.includes(clsKey)) return true;
  if (typeKey.includes(roleKey)) return true;
  for (const tk of typeKey) {
    const eligibleForArmor = ITEM_TYPES.armor.types[tk];
    if (eligibleForArmor && eligibleForArmor.includes(clsKey)) {
      return true;
    }
    const eligibleForStats = ITEM_TYPES.stat.types[tk];
    if (eligibleForStats && eligibleForStats.hasOwnProperty(clsKey)) {
      const eligibleRoles = eligibleForStats[clsKey];
      if (eligibleRoles && eligibleRoles.includes(roleKey)) {
        return true;
      }
    }
  }
  return false;
};

export default ITEM_TYPES;
