export function slugPlayer(player, team){ return encodeURIComponent(`${player}__${team}`); }
export function unslugPlayer(slug){ const [player, team] = decodeURIComponent(slug).split("__"); return {player, team}; }
