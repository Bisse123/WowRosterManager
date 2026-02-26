export const TOKEN_TYPES = {
    dreadful: ["mage", "priest", "warlock"],
    mystic: ["demon hunter", "druid", "monk", "rogue"],
    venerated: ["evoker", "hunter", "shaman"],
    zenith: ["death knight", "paladin", "warrior"],
};

export const getTokenCounts = (tokenType, players) => {
    const playersInType = players.filter((p) => {
        const cls = String(p.class).toLowerCase();
        return TOKEN_TYPES[tokenType].includes(cls)
    });
    return playersInType.length;
};