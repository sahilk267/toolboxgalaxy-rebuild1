/**
 * Production-code startup safety and difficulty regression checks.
 * Test actual Diep + Surviv engine constructor/damage logic, not mocked clones.
 */
import {
  arcadePressure,isOpeningProtected,targetDiepBots,meetsSpawnSeparation,
  krunkerBotHitChance,orbitGatePace,arcadePhaseLabel,type ArcadeDifficulty,
} from "../client/src/game/playability";
import { DiepEngine } from "../client/src/game/diep/engine";
import { SurvivEngine } from "../client/src/game/surviv/engine";
import type { DiepAudio } from "../client/src/game/diep/audio";
import type { SurvivAudio } from "../client/src/game/surviv/audio";

let checks=0;
function ok(value:unknown,label:string) {
  if(!value)throw Error("Gameplay safety regression: "+label);
  checks++;
}
function equal(actual:unknown,expected:unknown,label:string){
  ok(actual===expected,label+" ("+JSON.stringify(actual)+" vs "+JSON.stringify(expected)+")");
}
function between(actual:number,low:number,high:number,label:string){
  ok(Number.isFinite(actual)&&actual>=low&&actual<=high,label+" ("+actual+")");
}
const difficulties:ArcadeDifficulty[]=["easy","normal","hard"];
for(const difficulty of difficulties) {
  const points=[0,2,5,8,12,16,24,40,60,90,130,180,300,999];
  let last=0;
  for(const elapsed of points){
    const profile=arcadePressure(elapsed,difficulty);
    between(profile.rampFraction,0,1,difficulty+" bounded ramp");
    ok(profile.enemyPressure>=last-1e-12,difficulty+" monotonic enemy pressure");
    ok(profile.protectionRemaining>=0,difficulty+" nonnegative grace");
    ok(arcadePhaseLabel(profile.phase).length>0,difficulty+" meaningful phase");
    last=profile.enemyPressure;
    const pace=orbitGatePace(elapsed,difficulty);
    between(pace.speed,2,6,difficulty+" orbit speed sane");
    between(pace.spawnInterval,1.7,3.6,difficulty+" orbit interval sane");
    between(pace.gapRange,0.39,2.71,difficulty+" orbit gap amplitude sane");
  }
  ok(isOpeningProtected(0,difficulty),difficulty+" zero elapsed shield");
  ok(!isOpeningProtected(300,difficulty),difficulty+" late combat enabled");
  equal(targetDiepBots(0,difficulty),3,difficulty+" three starting bots");
  equal(targetDiepBots(300,difficulty),8,difficulty+" eight late bots");
  ok(orbitGatePace(0,difficulty).speed<orbitGatePace(180,difficulty).speed,difficulty+" orbit genuinely accelerates");
  ok(orbitGatePace(0,difficulty).spawnInterval>orbitGatePace(180,difficulty).spawnInterval,difficulty+" obstacles start less frequent");
}
ok(arcadePressure(0,"easy").protectionRemaining>arcadePressure(0,"normal").protectionRemaining,"easy adds protection");
ok(arcadePressure(0,"normal").protectionRemaining>arcadePressure(0,"hard").protectionRemaining,"hard shortens opening");
equal(arcadePressure(-10,"normal").elapsed,0,"negative elapsed normalized");
equal(arcadePressure(NaN,"normal").elapsed,0,"NaN elapsed normalized");
ok(meetsSpawnSeparation({x:0,y:0},[{x:500,y:0}],480),"safe spawn accepted");
ok(!meetsSpawnSeparation({x:0,y:0},[{x:400,y:0}],480),"close spawn rejected");
ok(!meetsSpawnSeparation({x:NaN,y:0},[],0),"invalid spawn rejected");
ok(!meetsSpawnSeparation({x:0,y:0},[],NaN),"invalid separation rejected");
for(let pressure of [0.2,0.5,0.8,1,1.2]){
 const near=krunkerBotHitChance(pressure,4,0);
 const far=krunkerBotHitChance(pressure,40,0);
 const moving=krunkerBotHitChance(pressure,4,12);
 between(near,0.1,0.7,"Krunker never guaranteed hit");
 ok(near>=far,"distance makes shots less accurate");
 ok(near>=moving,"movement makes bots easier to dodge");
}
ok(krunkerBotHitChance(0.2,10,0)<krunkerBotHitChance(1.1,10,0),"Krunker bots improve gradually");
between(krunkerBotHitChance(NaN,Infinity,NaN),0.1,0.7,"bad bot numbers normalized");

// Minimal constructor dependencies; simulation and damage are real imported engines.
const audioProxy=new Proxy({}, {get:()=>()=>{}}) as DiepAudio & SurvivAudio;
const ctx={} as CanvasRenderingContext2D;
const canvas={getContext:()=>ctx,clientWidth:1280,clientHeight:720,width:1280,height:720} as unknown as HTMLCanvasElement;
for(let index=0;index<3;index++){
 let deaths=0;
 const diep=new DiepEngine(canvas,audioProxy,{
  onPlayerUpdate:()=>{},onLeaderboardUpdate:()=>{},onKillFeed:()=>{},
  onEvolutionChoices:()=>{},onGameOver:()=>{deaths++},
 });
 ok(!diep.isRunning,"Diep does not auto-start from constructor");
 equal(diep.bots.length,3,"Diep starts with three low-level bots");
 const centerDist=Math.hypot(diep.player.x-1600,diep.player.y-1600);
 ok(centerDist>900,"Diep starts outside dangerous central nest");
 for(const bot of diep.bots){
  ok(Math.hypot(bot.x-diep.player.x,bot.y-diep.player.y)>=550,"Diep opponent not on player spawn");
  ok(bot.score<451,"initial Diep bots not max-level veterans");
 }
 diep.player.health=-500;
 (diep as any).eliminateTank(diep.player,0);
 ok(diep.player.active,"Diep early fatal collision suppressed");
 equal(deaths,0,"Diep cannot game-over during beginner shield");
 ok(diep.player.health>0,"Diep shield restores positive health");
 diep.elapsedSeconds=17;
 diep.player.health=-500;
 (diep as any).eliminateTank(diep.player,0);
 equal(deaths,1,"Diep can lose normally after grace");
 diep.dispose();
}
for(let index=0;index<2;index++){
 let deaths=0;
 const surviv=new SurvivEngine(audioProxy,{
  onPlayerUpdate:()=>{},onAliveUpdate:()=>{},onKillFeed:()=>{},
  onZoneUpdate:()=>{},onGameOver:()=>{deaths++},
 });
 ok(!surviv.running,"Surviv does not auto-start before explicit Start");
 equal(surviv.bots.length,29,"Surviv keeps full 30-contender roster");
 for(const bot of surviv.bots){
  const gap=Math.hypot(bot.x-surviv.player.x,bot.y-surviv.player.y);
  ok(gap>=480,"Surviv armed AI stays away from human start");
 }
 const initial=surviv.player.health;
 (surviv as any).damagePlayer(surviv.player,65);
 equal(surviv.player.health,initial,"Surviv opening shot cannot remove health");
 equal(deaths,0,"Surviv no premature game over during grace");
 surviv.elapsedSeconds=20;
 (surviv as any).damagePlayer(surviv.player,10);
 ok(surviv.player.health<initial,"Surviv genuine damage enabled after grace");
 surviv.dispose();
}
console.log("PASS: "+checks+" gameplay startup/difficulty assertions against actual engines.");
