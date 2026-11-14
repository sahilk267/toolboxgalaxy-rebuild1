/**
 * Shared fair active-play clock for the word, chess and picture puzzle screens.
 * Browser throttling and hidden tabs must not silently inflate play times.
 */
export type GameClockState = { lastTick: number; remainderMs: number };
export function advanceGameClock(
  previous: GameClockState, now: number, visible: boolean,
): { state: GameClockState; seconds: number } {
  if (!Number.isFinite(now) || !Number.isFinite(previous.lastTick) || now < previous.lastTick)
    return { state:{lastTick:now,remainderMs:0},seconds:0 };
  if (!visible) return { state:{lastTick:now,remainderMs:0},seconds:0 };
  const elapsed = Math.min(now-previous.lastTick,60_000);
  const total = previous.remainderMs+elapsed;
  const seconds = Math.floor(total/1000);
  return {
    state:{lastTick:now,remainderMs:total-seconds*1000},
    seconds,
  };
}
export function subscribeVisibleGameSeconds(addSeconds:(delta:number)=>void):()=>void {
  let clock:GameClockState={lastTick:performance.now(),remainderMs:0};
  const tick=()=>{
    const result=advanceGameClock(clock,performance.now(),!document.hidden);
    clock=result.state;
    if(result.seconds) addSeconds(result.seconds);
  };
  const onVisibility=()=>{
    // Deliberately drop invisible time rather than charging playtime on resume.
    clock={lastTick:performance.now(),remainderMs:clock.remainderMs};
  };
  const interval=window.setInterval(tick,250);
  document.addEventListener("visibilitychange",onVisibility);
  return ()=>{
    window.clearInterval(interval);
    document.removeEventListener("visibilitychange",onVisibility);
  };
}
