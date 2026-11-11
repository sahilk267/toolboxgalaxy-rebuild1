/** Real Chromium smoke for all ten previously prioritized tool slugs against production output. */
import { chromium } from "playwright";
import fs from "node:fs/promises";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const page=await browser.newPage({acceptDownloads:true});
let checks=0;
function check(value,msg){if(!value)throw new Error("Browser QA: "+msg);checks++;console.log("PASS "+msg);}
async function visit(slug,heading){
  const response=await page.goto("http://127.0.0.1:3000/tools/"+slug,{waitUntil:"domcontentloaded"});
  check(response?.status()===200,slug+" original URL HTTP 200");
  await page.getByRole("heading",{name:heading,exact:true}).waitFor();
}
async function readDownload(button){
  const event=page.waitForEvent("download");await button.click();
  const download=await event;const path=await download.path();if(!path)throw new Error("Download has no browser file path.");
  return {name:download.suggestedFilename(),data:await fs.readFile(path)};
}
try {
  await page.route(/https?:\/\//,route=>{
    const host=new URL(route.request().url()).hostname;
    return host==="127.0.0.1"?route.continue():route.abort();
  });
  await visit("discount-calculator","Discount Calculator");
  let box=page.locator('[data-tool="advanced-discount"]');
  await box.locator("[data-tool-output]").getByText("Final price", {exact:false}).waitFor();
  check((await box.locator("[data-tool-output]").innerText()).includes("$71.99"),"default discount 20% off 89.99 USD");
  await box.locator('[data-field="discount-second"]').fill("20");
  await box.locator('[data-field="discount-tax"]').fill("10");
  check((await box.locator("[data-tool-output]").innerText()).includes("$63.35"),"sequential discounts and tax");
  await box.locator('[data-field="discount-reverse"]').check();
  check((await box.locator("[data-tool-output]").innerText()).includes("Calculated original price"),"reverse discount works");
  await box.locator('[data-field="discount-first"]').fill("110");
  check((await box.locator("[data-tool-output]").innerText()).includes("between 0% and 100%"),"invalid discount blocked");

  await visit("loan-emi-estimate","Loan / EMI Estimate");
  box=page.locator('[data-tool="advanced-loan"]');
  await box.locator("[data-tool-output]").getByText("Monthly EMI",{exact:false}).waitFor();
  check((await box.locator("[data-tool-output]").innerText()).includes("60 months"),"legacy 60 months EMI estimate");
  await box.locator('[data-field="emi-extra"]').fill("5000");
  check((await box.locator("[data-tool-output]").innerText()).includes("Interest saved"),"prepayment savings shown");
  await box.getByRole("button",{name:"Show amortization schedule"}).click();
  await box.getByRole("table").waitFor();
  check(await box.getByRole("table").locator("tbody tr").count()<60,"prepayment shortens schedule");
  const csv=await readDownload(box.getByRole("button",{name:"Export CSV"}));
  check(csv.name==="toolboxgalaxy-loan-schedule.csv","amortization CSV filename");
  check(csv.data.toString("utf8").includes("Closing Balance"),"real amortization CSV columns");

  await visit("business-days-calculator","Business Days Calculator");
  box=page.locator('[data-tool="advanced-business-days"]');
  await box.locator("[data-tool-output]").getByText("5 business days",{exact:false}).waitFor();
  check((await box.locator("[data-tool-output]").innerText()).includes("5 business days"),"legacy weekday default");
  await box.locator('[data-field="business-holidays"]').fill("2026-08-26");
  check((await box.locator("[data-tool-output]").innerText()).includes("4 business days"),"custom holiday counted");
  await box.getByRole("button",{name:"Add / subtract working days"}).click();
  await box.locator('[data-field="business-start"]').fill("2026-08-28");
  await box.locator('[data-field="business-shift"]').fill("1");
  check((await box.locator("[data-tool-output]").innerText()).includes("2026-08-31"),"forward working-day shift skips weekend");
  await box.locator('[data-field="business-holidays"]').fill("bad");
  check((await box.locator("[data-tool-output]").innerText()).includes("Invalid holiday"),"invalid calendar input rejected");

  await visit("time-zone-meeting-planner","Time Zone Meeting Planner");
  box=page.locator('[data-tool="advanced-timezone"]');
  await box.locator("[data-tool-output]").getByText("Asia/Kolkata",{exact:false}).waitFor();
  check((await box.locator("[data-tool-output]").innerText()).includes("America/New_York"),"two-zone default preserved");
  await box.locator('[data-field="timezone-source"]').selectOption("America/New_York");
  await box.locator('[data-field="timezone-local"]').fill("2026-03-08T02:30");
  check((await box.locator("[data-tool-output]").innerText()).includes("daylight-saving"),"DST gap rejected");
  await box.locator('[data-field="timezone-local"]').fill("2026-11-01T01:30");
  await box.getByRole("status").getByText("repeats",{exact:false}).waitFor();
  check(true,"fall DST ambiguity warning displayed");

  await visit("color-signal","Color Signal");
  box=page.locator('[data-tool="advanced-color"]');
  await box.locator("[data-tool-output]").getByText("RGB",{exact:false}).waitFor();
  check((await box.locator("[data-tool-output]").innerText()).includes("HEX #C7F36B"),"legacy HEX defaults maintained");
  check((await box.locator("[data-tool-output]").innerText()).includes("HSV"),"HSV conversion displayed");
  check(await box.locator('button[title^="Use "]').count()>=5,"palette swatches rendered");
  await box.locator('[data-field="color-hex"]').fill("invalid");
  check((await box.locator("[data-tool-output]").innerText()).includes("Enter a three- or six-digit"),"invalid HEX handled");

  await visit("gradient-forge","Gradient Forge");
  box=page.locator('[data-tool="advanced-gradient"]');
  await box.locator("[data-tool-output]").getByText("linear-gradient",{exact:false}).waitFor();
  check((await box.locator("[data-tool-output]").innerText()).includes("125deg"),"legacy 125 degree gradient");
  await box.getByRole("button",{name:"Add gradient stop"}).click();
  check(await box.locator('[data-field^="gradient-color-"]').count()===3,"third gradient color stop");
  await box.locator('[data-field="gradient-type"]').selectOption("radial");
  check((await box.locator("[data-tool-output]").innerText()).includes("radial-gradient"),"radial gradient mode");
  const html=await readDownload(box.getByRole("button",{name:"Export HTML"}));
  check(html.name==="toolboxgalaxy-gradient.html","gradient HTML export filename");
  check(html.data.toString("utf8").includes("radial-gradient"),"gradient HTML contains actual CSS");

  await visit("text-case-tool","Text Case Tool");
  box=page.locator('[data-tool="advanced-text-case"]');
  await box.locator("[data-tool-output]").getByText("Toolbox Galaxy Makes Small Things Easy",{exact:false}).waitFor();
  check((await box.locator("[data-tool-output]").innerText()).includes("Toolbox Galaxy Makes Small Things Easy"),"legacy title case default");
  await box.locator('[data-field="case-mode"]').selectOption("snake");
  check((await box.locator("[data-tool-output]").innerText()).includes("toolbox_galaxy_makes_small_things_easy"),"new snake_case mode");
  await box.locator('[data-field="case-input"]').fill("Hello,   WORLD!");
  await box.locator('[data-field="case-mode"]').selectOption("sentence");
  check((await box.locator("[data-tool-output]").innerText()).includes("Hello,   world!"),"sentence preserves punctuation");

  await visit("base64-workbench","Base64 Workbench");
  box=page.locator('[data-tool="advanced-base64"]');
  await box.locator("[data-tool-output]").getByText("SGVsbG8sIEdhbGF4eS4=",{exact:false}).waitFor();
  check((await box.locator("[data-tool-output]").innerText()).includes("SGVsbG8sIEdhbGF4eS4="),"legacy Base64 default");
  await box.locator('[data-field="base64-mode"]').selectOption("decode");
  check((await box.locator("[data-tool-output]").innerText()).includes("Invalid Base64"),"reject legacy text while decoding");
  await box.locator('[data-field="base64-input"]').fill("SGVsbG8=");
  check((await box.locator("[data-tool-output]").innerText()).includes("Hello"),"valid Base64 decode");
  await box.locator('[data-field="base64-mode"]').selectOption("encode");
  await box.locator('[data-field="base64-input-mode"]').selectOption("file");
  await box.locator('[data-field="base64-file"]').setInputFiles({name:"hello.txt",mimeType:"text/plain",buffer:Buffer.from("OK!")});
  await box.locator("[data-tool-output]").getByText("T0sh",{exact:false}).waitFor();
  check((await box.locator("[data-tool-output]").innerText()).includes("T0sh"),"real local file to Base64");

  await visit("uuid-generator","UUID Generator");
  box=page.locator('[data-tool="advanced-uuid"]');
  await box.getByRole("button",{name:"Generate UUID"}).click();
  check(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test((await box.locator("[data-tool-output]").innerText()).trim()),"default UUIDv4");
  await box.locator('[data-field="uuid-version"]').selectOption("v7");
  await box.locator('[data-field="uuid-count"]').fill("3");
  await box.getByRole("button",{name:"Generate UUID"}).click();
  const uuidOutput=(await box.locator("[data-tool-output]").innerText()).trim().split(/\r?\n/);
  check(uuidOutput.length===3 && uuidOutput.every(x=>/-7[\da-f]{3}-[89ab]/i.test(x)),"three UUIDv7 values");
  await box.locator('[data-field="uuid-validate"]').fill(uuidOutput[0]);
  await box.getByRole("status").getByText("Valid v7 UUID",{exact:false}).waitFor();
  check(true,"UUID version validation");
  const uuidTxt=await readDownload(box.getByRole("button",{name:"Export TXT"}));
  check(uuidTxt.data.toString("utf8").includes(uuidOutput[0]),"UUID batch TXT export");

  await visit("basic-calculator","Basic Calculator");
  box=page.locator('[data-tool="advanced-calculator"]');
  await box.locator("[data-tool-output]").getByText("4",{exact:true}).waitFor();
  check((await box.locator("[data-tool-output]").innerText()).trim()==="4","legacy 12 ÷ 3 default");
  await box.getByRole("button",{name:"Scientific expression"}).click();
  await box.locator("[data-tool-output]").getByText("17",{exact:true}).waitFor();
  check((await box.locator("[data-tool-output]").innerText()).trim()==="17","scientific parser default");
  await box.locator('[data-field="calc-expression"]').fill("2+3*4");
  check((await box.locator("[data-tool-output]").innerText()).trim()==="14","math precedence");
  await box.locator('[data-field="calc-expression"]').press("Enter");
  check((await box.locator('[data-calc-history] li').first().innerText()).includes("14"),"Enter saves local history");
  await box.locator('[data-field="calc-expression"]').fill("alert(1)");
  check((await box.locator("[data-tool-output]").innerText()).includes("Unknown function"),"arbitrary JavaScript not evaluated");

  console.log("PASS: "+checks+" next-priority Chromium real UI/export assertions.");
} catch(err) {
  console.error("FAILED next-priority Chromium QA:",err);
  console.error("Page URL:",page.url());
  console.error("Alerts:",await page.locator('[role="alert"]').allTextContents().catch(()=>[]));
  process.exitCode=1;
} finally { await browser.close(); }
