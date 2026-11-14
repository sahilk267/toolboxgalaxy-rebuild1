/** Real production-game browser checks: time to first death and accessible start/control menus. */
import { chromium } from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader"]});
const page=await browser.newPage({viewport:{width:1250,height:860}});
const errors=[];
page.on("pageerror",error=>errors.push(error.message));
let count=0;
function check(value,message){if(!value)throw Error("Arcade playability browser: "+message);count++;console.log("PASS "+message);}
async function visit(slug){
 const response=await page.goto("http://127.0.0.1:3000/games/"+slug,{waitUntil:"domcontentloaded"});
 check(response?.status()===200,slug+" route HTTP 200");
}
async function confirmNoDeath(text, seconds) {
 await page.waitForTimeout(seconds*1000);
 const body=await page.locator("body").innerText();
 check(!body.includes(text),"no instant death for first "+seconds+" seconds ("+text+")");
}
try{
 await page.route(/https?:\/\//,route=>{
  const host=new URL(route.request().url()).hostname;
  return host==="127.0.0.1"?route.continue():route.abort();
 });
 await visit("tank-evolution");
 const diep=page.getByRole("dialog",{name:"Diep Arena start menu"});
 await diep.getByRole("button",{name:"Start game"}).waitFor({timeout:20000});
 check(await page.locator('canvas[aria-label="Diep Arena Canvas"]').count()===1,"Diep engine preview canvas mounted");
 check(await diep.locator('[data-game-difficulty="diep"]').inputValue()==="normal","Diep normal default");
 await diep.locator('[data-game-difficulty="diep"]').selectOption("easy");
 await confirmNoDeath("TANK DESTROYED",2);
 check(await diep.isVisible(),"Diep stays in ready mode until user starts");
 await diep.getByRole("button",{name:"Start game"}).click();
 await page.getByRole("button",{name:"Pause Diep Arena"}).waitFor({timeout:10000});
 check(!(await diep.isVisible()),"Diep starts only after explicit click");
 await confirmNoDeath("TANK DESTROYED",5);
 await page.getByRole("button",{name:"Pause Diep Arena"}).click();
 await diep.getByText("Game paused").waitFor();
 check(true,"Diep pause screen exposes Resume");
 await diep.getByRole("button",{name:"Resume game"}).click();
 check(!(await diep.isVisible()),"Diep resumes from pause");

 await visit("surviv-io");
 const surviv=page.getByRole("dialog",{name:"Surviv Battle Royale start menu"});
 await surviv.getByRole("button",{name:"Start match"}).waitFor({timeout:20000});
 check(await page.locator('canvas[aria-label="Surviv Arena Canvas"]').count()===1,"Surviv actual canvas mounted");
 check(await surviv.locator('[data-game-difficulty="surviv"]').inputValue()==="normal","Surviv normal default");
 await surviv.locator('[data-game-difficulty="surviv"]').selectOption("easy");
 await confirmNoDeath("ELIMINATED",2);
 check(await surviv.isVisible(),"Surviv battle not auto-started");
 await surviv.getByRole("button",{name:"Start match"}).click();
 await page.getByRole("button",{name:"Pause Surviv"}).waitFor({timeout:10000});
 check(!(await surviv.isVisible()),"Surviv starts with explicit action");
 await confirmNoDeath("ELIMINATED",5);
 await page.getByRole("button",{name:"Pause Surviv"}).click();
 await surviv.getByText("Match paused").waitFor();
 check(true,"Surviv pause/resume option visible");
 await surviv.getByRole("button",{name:"Resume match"}).click();
 check(!(await surviv.isVisible()),"Surviv resumes without reloading");

 await visit("orbit-dash");
 await page.locator('[data-game-difficulty="orbit"]').waitFor({timeout:20000});
 check(await page.locator('[data-game-difficulty="orbit"]').inputValue()==="normal","Orbit normal default");
 await page.locator('[data-game-difficulty="orbit"]').selectOption("easy");
 check((await page.locator("body").innerText()).includes("Early gates approach slowly"),"Orbit instructions explain slow-to-fast progression");
 await page.getByRole("button",{name:"Start run"}).click();
 await confirmNoDeath("RUN COMPLETE",4);

 await visit("krunker");
 await page.locator('[data-game-difficulty="krunker"]').waitFor({timeout:20000});
 check(await page.locator('[data-game-difficulty="krunker"]').inputValue()==="normal","Krunker difficulty control available");
 await page.locator('[data-game-difficulty="krunker"]').selectOption("easy");
 check((await page.locator("body").innerText()).includes("LEARN FIRST"),"Krunker explains learning window");
 await confirmNoDeath("YOU DIED",2);
 await page.getByRole("button",{name:"Start match"}).click();
 check(await page.getByRole("heading",{name:"Krunker Voxel FPS"}).count()>0,"Krunker start action does not crash UI");
 // Responsive regression: short mobile viewports must scroll to real controls.
 const mobile=await browser.newPage({viewport:{width:375,height:590},isMobile:true,hasTouch:true});
 mobile.on("pageerror",e=>errors.push("mobile: "+e.message));
 await mobile.route(/https?:\/\//,route=>{
  const host=new URL(route.request().url()).hostname;
  return host==="127.0.0.1"?route.continue():route.abort();
 });
 for(const slug of [
   "logic/queens","logic/mini-sudoku","logic/tango","logic/patches",
   "logic/zip","logic/wend","orbit-lexicon","connections","the-hive",
   "mini-crossword","chess-puzzles","nonogram",
 ]) {
  const response=await mobile.goto("http://127.0.0.1:3000/games/"+slug,{waitUntil:"domcontentloaded"});
  check(response?.status()===200,slug+" mobile route");
  const root=mobile.locator(".logic-game-page");
  await root.waitFor({timeout:15000});
  const overflow=await root.evaluate(node=>getComputedStyle(node).overflowY);
  check(overflow==="auto"||overflow==="scroll",slug+" small viewport scroll enabled ("+overflow+")");
  const controls=root.locator("button:visible");
  await controls.first().waitFor({timeout:10000});
  const target=controls.last();
  await target.scrollIntoViewIfNeeded({timeout:10000});
  const box=await target.boundingBox();
  check(Boolean(box&&box.y>=-3&&box.y+box.height<=(await mobile.evaluate(()=>innerHeight))+3),slug+" final action is reachable by scrolling");
 }
 await mobile.close();

 check(errors.length===0,"no uncaught page errors in four arcade game sessions: "+errors.join("; "));
 console.log("PASS: "+count+" actual arcade onboarding and early-survival Chromium assertions.");
} catch(error){
 console.error("FAILED arcade playability QA:",error);
 console.error("Current URL",page.url());
 console.error("Browser exceptions",errors);
 console.error("Alerts",await page.locator('[role="alert"]').allTextContents().catch(()=>[]));
 process.exitCode=1;
}finally{await browser.close();}
