/** Production-build Chromium smoke for the game's new practice studio and arcade entry points. */
import { chromium } from "playwright";
const browser=await chromium.launch({headless:true,args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader"]});
const page=await browser.newPage({viewport:{width:1280,height:900}});
let assertions=0;
function check(value,message){if(!value)throw new Error("Games Chromium: "+message);assertions++;console.log("PASS "+message);}
const failures=[];
page.on("pageerror",error=>failures.push(error.message));
try {
  await page.route(/https?:\/\//,route=>{
    const host=new URL(route.request().url()).hostname;
    return host==="127.0.0.1"?route.continue():route.abort();
  });
  const response=await page.goto("http://127.0.0.1:3000/games/logic-lab",{waitUntil:"domcontentloaded"});
  check(response?.status()===200,"Logic Lab route exists");
  const studio=page.locator('[data-game="logic-practice"]');
  await studio.getByText("Build a fresh puzzle").waitFor({timeout:20000});
  check(await studio.locator("[data-practice-cell]").count()===36,"Six-by-six practice board rendered");
  check(await studio.locator('[data-practice="kind"]').inputValue()==="sudoku","Sudoku initial practice type");
  const empty=studio.locator('[data-practice-cell]').filter({hasText:"·"}).first();
  await empty.click();
  await empty.press("2");
  check((await empty.innerText()).trim()==="2","Sudoku keypad input via keyboard");
  await studio.getByRole("button",{name:"Undo"}).click();
  check((await empty.innerText()).trim()==="·","Sudoku undo restores previous value");
  await studio.getByRole("button",{name:"Hint"}).click();
  check((await studio.innerText()).includes("Hints used: 1"),"Sudoku hint count displayed");
  await studio.getByRole("button",{name:"Reset"}).click();
  check((await studio.innerText()).includes("Hints used: 0"),"Sudoku reset clears hint count");

  await studio.locator('[data-practice="kind"]').selectOption("queens");
  await studio.locator('[data-practice-cell="0:0"]').waitFor();
  await studio.locator('[data-practice-cell="0:0"]').click();
  check((await studio.locator('[data-practice-cell="0:0"]').innerText()).includes("♛"),"Queens crown placement");
  await studio.locator('[data-practice-cell="0:1"]').click();
  check(!(await studio.locator('[data-practice-cell="0:0"]').innerText()).includes("♛"),"Queens places one crown per row");
  await studio.getByRole("button",{name:"Undo"}).click();
  check((await studio.locator('[data-practice-cell="0:0"]').innerText()).includes("♛"),"Queens undo restores previous crown");

  await studio.locator('[data-practice="kind"]').selectOption("tango");
  await studio.locator('[data-practice="tango-relations"] li').first().waitFor();
  check(await studio.locator('[data-practice="tango-relations"] li').count()>0,"Tango preserved relation clues visible");
  check(await studio.locator("[data-practice-cell]").count()===36,"Tango six-by-six board rendered");
  await studio.locator('[data-practice="difficulty"]').selectOption("dense");
  await studio.locator('[data-practice="seed"]').fill("local-2026");
  check((await studio.locator("[data-practice-cell]").count())===36,"Seeded dense puzzle generated");
  await studio.locator('[data-practice="seed"]').fill("bad seed!");
  await studio.getByRole("alert").getByText("Choose a 1", {exact:false}).waitFor();
  check(true,"Invalid practice seed rejected safely");
  await studio.locator('[data-practice="seed"]').fill("local-2026");
  await studio.getByRole("button",{name:"New variation"}).click();
  check((await studio.locator('[data-practice="seed"]').inputValue()).startsWith("p"),"New variant gets reproducible seed");

  const search=page.getByRole("textbox",{name:"Search puzzle modules"});
  await search.fill("Chess");
  check(await page.locator(".logic-lab__grid article").count()===1,"Logic Lab filters game cards by name");
  await page.getByRole("combobox",{name:"Puzzle category"}).selectOption("words");
  await page.getByText("No puzzle matches your search.").waitFor();
  check(true,"Combined category and search empty state appears");
  await search.fill("");
  check(await page.locator(".logic-lab__grid article").count()>2,"Category filter displays multiple word games");

  // Full-screen arcade controls and WebGL require real devices for final QA;
  // these checks assert routes render without crashing the React application.
  for(const [slug,label] of [
    ["orbit-dash","Orbit Dash"],["tank-evolution","Diep"],
    ["surviv-io","Surviv"],["krunker","Krunker"],
  ]) {
    const arcade=await page.goto("http://127.0.0.1:3000/games/"+slug,{waitUntil:"domcontentloaded"});
    check(arcade?.status()===200,slug+" arcade route exists");
    await page.waitForTimeout(1800);
    const body=await page.locator("body").innerText();
    check(body.toLowerCase().includes(label.toLowerCase()),slug+" game interface displays");
    check(!body.includes("Application error"),slug+" has no fatal application fallback");
  }
  check(failures.length===0,"No uncaught browser page errors across practice and arcade routes: "+failures.join(" | "));
  console.log("PASS: "+assertions+" games Chromium UI and arcade-route assertions.");
} catch(error){
  console.error("FAILED games Chromium:",error);
  console.error("URL:",page.url());
  console.error("Browser errors:",failures);
  console.error("Alerts:",await page.locator("[role=alert]").allTextContents().catch(()=>[]));
  process.exitCode=1;
} finally {await browser.close();}
