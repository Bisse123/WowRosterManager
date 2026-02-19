export const WOW_CLASSES = [
  { name: "Death Knight", color: "#C41E3A" },
  { name: "Demon Hunter", color: "#A330C9" },
  { name: "Druid", color: "#FF7C0A" },
  { name: "Evoker", color: "#33937F" },
  { name: "Hunter", color: "#AAD372" },
  { name: "Mage", color: "#3FC7EB" },
  { name: "Monk", color: "#00FF98" },
  { name: "Paladin", color: "#F48CBA" },
  { name: "Priest", color: "#FFFFFF" },
  { name: "Rogue", color: "#FFF468" },
  { name: "Shaman", color: "#0070DD" },
  { name: "Warlock", color: "#8788EE" },
  { name: "Warrior", color: "#C69B6D" },
];

export const getClassColor = (className) => {
  const classData = WOW_CLASSES.find((c) => c.name === className);
  return classData ? classData.color : "#FFFFFF";
};

export const getClassIconPath = (className) => {
  if (!className) return "";
  const slug = className.toLowerCase();
  return `/assets/classes/${slug}.jpg`;
};

export const WOW_ROLES = [
  { key: "tank", name: "Tank", bg: "#002f6c", color: "#66b0ff" },
  { key: "healer", name: "Healer", bg: "#12300a", color: "#7fef4f" },
  { key: "melee", name: "Melee DPS", bg: "#5a0f12", color: "#ff8b91" },
  { key: "ranged", name: "Ranged DPS", bg: "#665000", color: "#fff06a" },
];

export const getRoleIconPath = (roleKey) => {
  if (!roleKey) return "";
  return `/assets/roles/${roleKey.toLowerCase()}.png`;
};
