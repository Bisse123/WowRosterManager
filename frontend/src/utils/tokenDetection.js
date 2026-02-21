export const TOKEN_TYPES = {
    dreadful: ["Mage", "Priest", "Warlock"],
    mystic: ["Demon Hunter", "Druid", "Monk", "Rogue"],
    venerated: ["Evoker", "Hunter", "Shaman"],
    zenith: ["Death Knight", "Paladin", "Warrior"],
};

export const getTokenCounts = (tokenType, players) => {
    const playersInType = players.filter((p) => TOKEN_TYPES[tokenType].includes(p.class));
    return playersInType.length;
};