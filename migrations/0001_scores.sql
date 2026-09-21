-- One row per (game, player): the player's best result only.
-- player_key is sha256(secret device id) in hex; the secret itself is never stored.
CREATE TABLE scores (
  game        TEXT    NOT NULL,
  player_key  TEXT    NOT NULL,
  nickname    TEXT    NOT NULL,
  score       INTEGER NOT NULL, -- the raw result (hits / goals / points / turns / metres)
  rank_score  INTEGER NOT NULL, -- normalised so that bigger is always better (turns are negated)
  achieved_at INTEGER NOT NULL, -- epoch ms; on a tie the earlier run ranks higher
  PRIMARY KEY (game, player_key)
);

CREATE INDEX idx_scores_rank ON scores (game, rank_score DESC, achieved_at ASC);
