export interface KeeperBreakoutAssets { background?: HTMLImageElement; ball?: HTMLImageElement; paddle?: HTMLImageElement; paddleWide?: HTMLImageElement; bricks: Partial<Record<string, HTMLImageElement>>; powerups: Partial<Record<string, HTMLImageElement>> }

function image(src: string): Promise<HTMLImageElement | undefined> {
  return new Promise((resolve) => { const value = new Image(); value.onload = () => resolve(value); value.onerror = () => resolve(undefined); value.src = src; });
}

export async function loadKeeperBreakoutAssets(): Promise<KeeperBreakoutAssets> {
  const [background, ball, paddle, paddleWide, ...rest] = await Promise.all([image("/keeper-breakout-background.webp"), image("/soccer_ball.webp"), image("/keeper-breakout-paddle.webp"), image("/keeper-breakout-paddle-wide.webp"), ...["hp1", "hp2", "hp3", "gold", "steel", "burst"].map((type) => image(`/keeper-breakout-brick-${type}.webp`)), ...["wide", "multi", "slow", "shield"].map((type) => image(`/keeper-breakout-powerup-${type}.webp`))]);
  return { background, ball, paddle, paddleWide, bricks: Object.fromEntries(["hp1", "hp2", "hp3", "gold", "steel", "burst"].map((type, index) => [type, rest[index]]).filter(([, value]) => value)), powerups: Object.fromEntries(["wide", "multi", "slow", "shield"].map((type, index) => [type, rest[index + 6]]).filter(([, value]) => value)) };
}
