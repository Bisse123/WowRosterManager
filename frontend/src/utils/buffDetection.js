export const getRoleCounts = (players) => {
  const counts = { tank: 0, healer: 0, melee: 0, ranged: 0 };
  
  players.forEach(player => {
    const role = player.mainRole.toLowerCase();
    if (role === 'tank') counts.tank++;
    else if (role === 'healer') counts.healer++;
    else if (role === 'melee dps') counts.melee++;
    else if (role === 'ranged dps') counts.ranged++;
  });

  return counts;
};

export const getClassCounts = (players) => {
  const counts = {};
  
  players.forEach(player => {
    counts[player.class] = (counts[player.class] || 0) + 1;
  });

  return counts;
};

export const detectRaidBuffs = (players) => {
  const classes = players.map(p => p.class);
  
  const hasClass = (className) => classes.includes(className);
  const hasAnyClass = (...classNames) => classNames.some(hasClass);

  return {
    standardBuffs: [
      {
        name: 'Bloodlust',
        covered: hasAnyClass('Shaman', 'Mage', 'Hunter', 'Evoker')
      },
      {
        name: 'Intellect',
        covered: hasClass('Mage')
      },
      {
        name: 'Stamina',
        covered: hasClass('Priest')
      },
      {
        name: 'Battle Shout',
        covered: hasClass('Warrior')
      },
      {
        name: 'Mark of the Wild',
        covered: hasClass('Druid')
      },
      {
        name: 'Mystic Touch',
        covered: hasClass('Monk')
      },
      {
        name: 'Chaos Brand',
        covered: hasClass('Demon Hunter')
      },
      {
        name: 'Devotion Aura',
        covered: hasClass('Paladin')
      }
    ],
    raidUtility: [
      {
        name: 'Combat Resurrection',
        covered: hasAnyClass('Druid', 'Warlock', 'Death Knight', 'Paladin')
      },
      {
        name: 'Rallying Cry',
        covered: hasClass('Warrior')
      },
      {
        name: 'Anti-Magic Zone',
        covered: hasClass('Death Knight')
      },
      {
        name: 'Darkness',
        covered: hasClass('Demon Hunter')
      },
      {
        name: 'Gateway',
        covered: hasClass('Warlock')
      },
      {
        name: 'Innervate',
        covered: hasClass('Druid')
      }
    ]
  };
};