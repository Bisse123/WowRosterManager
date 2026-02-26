import { WOW_CLASSES, WOW_ROLES } from "./wowClasses";

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
  if (typeKey.includes(clsKey)) return true;
  
  const roles = typeKey.filter((t) => WOW_ROLES.map((r) => r.key).includes(t));
  const armor = typeKey.filter((t) =>
    Object.keys(ITEM_TYPES.armor.types).includes(t),
  );
  const stats = typeKey.filter((t) =>
    Object.keys(ITEM_TYPES.stat.types).includes(t),
  );
  let roleFound = roles.length === 0;
  let armorEligible = armor.length === 0;
  let statsEligible = stats.length === 0;
  if (roleFound && armorEligible && statsEligible) return false;

  if (roles.length && roles.includes(roleKey)) roleFound = true;

  if (armor.length) {
    for (const tk of armor) {
      const eligibleClasses = ITEM_TYPES.armor.types[tk];
      if (eligibleClasses && eligibleClasses.includes(clsKey)) {
        armorEligible = true;
        break;
      }
    }
  }

  if (stats.length) {
    for (const tk of stats) {
      const eligibleForStats = ITEM_TYPES.stat.types[tk];
      if (eligibleForStats && eligibleForStats.hasOwnProperty(clsKey)) {
        const eligibleRoles = eligibleForStats[clsKey];
        if (eligibleRoles && eligibleRoles.includes(roleKey)) {
          statsEligible = true;
          break;
        } 
      }
    }
  }

  return roleFound && armorEligible && statsEligible;
};

export default ITEM_TYPES;
