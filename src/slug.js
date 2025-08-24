// player name + team -> slug "First Last__Team"
export const slugPlayer = (player, team) =>
  encodeURIComponent(`${player}__${team}`);

// reverse
export const unslugPlayer = (slug) => {
  const [player, team] = decodeURIComponent(slug).split("__");
  return { player, team };
};
