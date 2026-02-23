export const TOKEN_TYPES = {
    dreadful: ["mage", "priest", "warlock"],
    mystic: ["demon hunter", "druid", "monk", "rogue"],
    venerated: ["evoker", "hunter", "shaman"],
    zenith: ["death knight", "paladin", "warrior"],
};

export const getTokenCounts = (tokenType, players) => {
    const playersInType = players.filter((p) => TOKEN_TYPES[tokenType].includes(p.class));
    return playersInType.length;
};