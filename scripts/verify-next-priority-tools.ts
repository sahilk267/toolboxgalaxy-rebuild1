/** Assertions against real production engines, including adversarial inputs and legacy defaults. */
import { businessDaysBetween, estimateLoanEmi, planMeetingTime } from "../client/src/lib/dailyToolEngines";
import {
  calculateDiscount, projectLoan, countBusinessDays, shiftBusinessDays, parseHolidays, planMultiZone,
} from "../client/src/lib/advancedDailyBatch";
import {
  normalizeHex, hexToRgb, rgbToHex, rgbToHsl, rgbToHsv, hslToRgb, hsvToRgb,
  contrastRatio, colorPalette, gradientCss, transformTextCase,
  type GradientStop, type CaseMode,
} from "../client/src/lib/advancedCreativeBatch";
import {
  encodeBase64, decodeBase64, utf8ToBase64, base64ToUtf8,
  generateUuidBatch, randomUuid, uuidVersion, calculateBinary, evaluateExpression,
} from "../client/src/lib/advancedDeveloperBatch";

let count=0;
function check(predicate:unknown,msg:string):void{
  if(!predicate)throw new Error("Next priority regression: "+msg);
  count++;
}
function equal(actual:unknown,expected:unknown,msg:string){
  check(actual===expected,msg+" (got "+JSON.stringify(actual)+", expected "+JSON.stringify(expected)+")");
}
function near(actual:number|undefined,expected:number,epsilon:number,msg:string){
  check(actual!==undefined&&Math.abs(actual-expected)<=epsilon,msg+" ("+actual+" vs "+expected+")");
}
function rejects(fn:()=>unknown,msg:string){
  try{fn();check(false,msg+" should throw");}catch(e){if(e instanceof Error&&e.message.startsWith("Next priority regression:"))throw e;count++;}
}

// Discount legacy and next-step multiple/tax/reverse:
const discount=calculateDiscount("89.99","20");
near(discount.value?.finalPrice,71.992,0.00001,"legacy discount default");
near(discount.value?.saved,17.998,0.00001,"legacy discount savings");
const stacked=calculateDiscount("100","10","20","18");
near(stacked.value?.firstSavings,10,1e-9,"first sequential saving");
near(stacked.value?.secondSavings,18,1e-9,"second sequential saving");
near(stacked.value?.discounted,72,1e-9,"stacked savings multiplicative");
near(stacked.value?.tax,12.96,1e-9,"tax after discounts");
near(stacked.value?.finalPrice,84.96,1e-9,"final tax-inclusive");
near(stacked.value?.effectiveDiscount,28,1e-9,"effective percentage");
const reversed=calculateDiscount("84.96","10","20","18",true);
near(reversed.value?.original,100,1e-8,"reverse original");
check(Boolean(calculateDiscount("10","100","0","0",true).error),"reverse 100% prohibited");
check(Boolean(calculateDiscount("100","120").error),"discount above 100 blocked");
check(Boolean(calculateDiscount("100","-1").error),"negative discount blocked");
check(Boolean(calculateDiscount("100","0","0","101").error),"tax above 100 blocked");
check(Boolean(calculateDiscount("-1","10").error),"negative price blocked");
check(Boolean(calculateDiscount("","10").error),"empty price blocked");
near(calculateDiscount("0","20").value?.finalPrice,0,0,"free item works");
near(calculateDiscount("100","0","0","0").value?.finalPrice,100,0,"zero rates");
check(Boolean(calculateDiscount("x","10").error),"non-numeric price blocked");
check(Boolean(calculateDiscount("1e999","10").error),"infinite price blocked");

// Loan legacy baseline unchanged, actual amortization and savings.
const baseline=estimateLoanEmi("500000","9","60");
const projected=projectLoan("500000","9","60");
near(projected.value?.monthlyPayment,baseline.value?.monthlyPayment||0,0.00001,"original EMI unchanged");
near(projected.value?.totalInterest,baseline.value?.totalInterest||0,0.04,"schedule interest equals legacy");
equal(projected.value?.schedule.length,60,"default 60-payment schedule");
near(projected.value?.schedule[59].balance,0,0.01,"final balance pays off");
equal(projected.value?.monthsSaved,0,"no extras save zero months");
const extra=projectLoan("500000","9","60","5000");
check(Boolean(extra.value&&extra.value.months<60),"monthly extra shortens term");
check(Boolean(extra.value&&extra.value.interestSaved>0),"monthly extra saves interest");
near(extra.value?.schedule[extra.value.schedule.length-1].balance,0,0.01,"extra payoff closes at zero");
const lump=projectLoan("500000","9","60","0","2","25000");
check(Boolean(lump.value&&lump.value.totalInterest<projected.value!.totalInterest),"lump reduces interest");
const zero=projectLoan("1200","0","12","0");
near(zero.value?.monthlyPayment,100,1e-9,"zero interest EMI");
near(zero.value?.totalInterest,0,1e-8,"zero interest total");
equal(zero.value?.months,12,"zero interest months");
const early=projectLoan("1200","0","12","200");
equal(early.value?.months,4,"zero rate early payoff");
check(Boolean(projectLoan("0","9","60").error),"zero loan invalid");
check(Boolean(projectLoan("1000","-1","12").error),"negative rate invalid");
check(Boolean(projectLoan("1000","9","0").error),"zero months invalid");
check(Boolean(projectLoan("1000","9","601").error),"600 month max");
check(Boolean(projectLoan("1000","9","12","-1").error),"negative extra invalid");
check(Boolean(projectLoan("1000","9","12","0","1","0").error),"lump month needs amount");
check(Boolean(projectLoan("1000","9","12","0","0","100").error),"lump amount needs month");
check(Boolean(projectLoan("1000","9","12","0","13","100").error),"lump month exceeds term");

// Business days, original Monday–Friday, weekends, holidays, shifting:
equal(businessDaysBetween("2026-08-24","2026-08-28",true).value?.businessDays,5,"legacy weekday count");
equal(countBusinessDays("2026-08-24","2026-08-28").value?.count,5,"advanced default preserves legacy count");
equal(countBusinessDays("2026-08-24","2026-08-28",false).value?.count,4,"end exclusive");
equal(countBusinessDays("2026-08-28","2026-08-31").value?.count,2,"weekend skipped");
equal(countBusinessDays("2026-08-28","2026-08-31",true,"fri-sat").value?.count,2,"Friday Saturday weekend");
equal(countBusinessDays("2026-08-28","2026-08-31",true,"sun").value?.count,3,"Sunday only weekend");
equal(countBusinessDays("2026-08-28","2026-08-31",true,"none").value?.count,4,"no-weekend policy");
equal(countBusinessDays("2026-08-24","2026-08-28",true,"sat-sun","2026-08-26").value?.count,4,"custom holiday excluded");
equal(countBusinessDays("2026-01-26","2026-01-30",true,"sat-sun","","india-fixed").value?.count,4,"Indian fixed-date preset");
equal(countBusinessDays("2026-07-03","2026-07-07",true,"sat-sun","","us-fixed").value?.count,3,"US fixed holiday on weekend not double-counted");
equal(countBusinessDays("2026-12-24","2026-12-29",true,"sat-sun","","uk-fixed").value?.count,3,"UK fixed dates only; observed substitute must be entered separately");
equal(countBusinessDays("2026-08-24","2026-08-24",true).value?.count,1,"one working day");
equal(countBusinessDays("2026-08-24","2026-08-24",false).value?.count,0,"exclusive same date");
equal(parseHolidays("2026-08-26,2026-08-26").value?.size,1,"duplicate holiday removed");
check(Boolean(parseHolidays("2026-02-30").error),"invalid calendar holiday");
check(Boolean(parseHolidays("tomorrow").error),"holiday relative dates rejected");
check(Boolean(countBusinessDays("2026-08-24","2026-08-21").error),"reversed date rejected");
check(Boolean(countBusinessDays("2026-02-30","2026-03-01").error),"invalid date rejected");
equal(shiftBusinessDays("2026-08-28","1").value?.resultDate,"2026-08-31","forward skip weekend");
equal(shiftBusinessDays("2026-08-31","-1").value?.resultDate,"2026-08-28","backward skip weekend");
equal(shiftBusinessDays("2026-08-24","0").value?.resultDate,"2026-08-24","zero shift exact");
equal(shiftBusinessDays("2026-08-28","1","sat-sun","2026-08-31").value?.resultDate,"2026-09-01","custom holiday while shifting");
check(Boolean(shiftBusinessDays("2026-08-28","5001").error),"bounded shift");
check(Boolean(shiftBusinessDays("2026-08-28","1.5").error),"integer shift needed");
check(Boolean(shiftBusinessDays("2026-08-28","bad").error),"invalid shift");

// Time-zone: preserve original conversion and expose multi-zone DST semantics.
const oldZone=planMeetingTime("2026-08-24T09:00","Asia/Kolkata","America/New_York");
const multi=planMultiZone("2026-08-24T09:00","Asia/Kolkata",["Asia/Kolkata","America/New_York"]);
equal(multi.value?.epoch,oldZone.value?.epoch,"multi-zone underlying UTC unchanged");
equal(multi.value?.rows.length,2,"two target zones returned");
check(Boolean(multi.value?.rows[1].local.includes("New York")===false),"zone formatting valid without extra label");
check(Boolean(multi.value?.rows[1].local.includes("23:30")),"Eastern daylight offset respected");
check(Boolean(planMultiZone("2026-03-08T02:30","America/New_York",["UTC"]).error),"spring DST nonexistent time rejected");
check(Boolean(planMultiZone("2026-11-01T01:30","America/New_York",["UTC"]).value?.warning.includes("repeats")),"fall DST repeated time warning");
check(Boolean(planMultiZone("2026-08-24T09:00","Asia/Kolkata",[]).error),"zero target rejected");
check(Boolean(planMultiZone("2026-08-24T09:00","Asia/Kolkata",["UTC","UTC"]).error),"duplicate target rejected");
check(Boolean(planMultiZone("2026-08-24T09:00","Not/AZone",["UTC"]).error),"unknown source zone rejected");

// Colors, validated CSS, Unicode case:
equal(normalizeHex("#abc"),"#AABBCC","short hex expansion");
equal(normalizeHex("c7f36b"),"#C7F36B","original default hex preserved");
equal(normalizeHex("##c7f36b"),null,"double hash invalid");
equal(normalizeHex("#12345z"),null,"non-hex refused");
equal(rgbToHex({r:255,g:0,b:17}),"#FF0011","rgb to hex");
equal(hexToRgb("#ff0011")?.g,0,"hex channels");
near(rgbToHsl({r:255,g:0,b:0}).h,0,1e-8,"red HSL hue");
near(rgbToHsl({r:255,g:0,b:0}).s,100,1e-8,"red HSL saturation");
near(rgbToHsv({r:0,g:255,b:0}).h,120,1e-8,"green HSV hue");
equal(rgbToHex(hslToRgb(240,100,50)),"#0000FF","HSL blue roundtrip");
equal(rgbToHex(hsvToRgb(240,100,100)),"#0000FF","HSV blue roundtrip");
equal(contrastRatio("#000000","#ffffff"),21,"black-white contrast");
near(contrastRatio("#111111","#111111")||0,1,1e-9,"identical colors contrast");
equal(contrastRatio("invalid","#ffffff"),null,"invalid contrast null");
equal(colorPalette("#ff0000")?.complement,"#00FFFF","complement cyan");
equal(colorPalette("#FF0000")?.tints.length,3,"tints generated");
rejects(()=>rgbToHex({r:300,g:0,b:0}),"RGB bounds");
rejects(()=>hslToRgb(361,100,50),"HSL hue bounds");
rejects(()=>hsvToRgb(0,-1,50),"HSV bounds");
const two:GradientStop[]=[{color:"#c7f36b",position:0},{color:"#6fd5ff",position:100}];
equal(gradientCss(two,125),"linear-gradient(125deg, #C7F36B 0%, #6FD5FF 100%)","legacy gradient preserved");
check(gradientCss(two,125,"radial").startsWith("radial-gradient(circle"),"radial CSS");
check(gradientCss([{color:"#000000",position:0},{color:"#777777",position:50},{color:"#ffffff",position:100}],45).includes("50%"),"3 stops");
rejects(()=>gradientCss([two[0]],0),"gradient min 2 stops");
rejects(()=>gradientCss(two,500),"angle limited");
rejects(()=>gradientCss([{color:"#000000",position:60},{color:"#ffffff",position:20}],45),"out-of-order positions");
rejects(()=>gradientCss([{color:"#123456",position:0},{color:"red; background:url(x)",position:100}],0),"CSS injection impossible");
const title="Toolbox Galaxy Makes Small Things Easy";
equal(transformTextCase("Toolbox Galaxy makes small things easy","title"),title,"legacy title-case default");
equal(transformTextCase("Hello,   WORLD!\nHow are YOU?","sentence"),"Hello,   world!\nHow are you?","sentence preserves punctuation/spacing");
equal(transformTextCase("Hello,   WORLD!","upper"),"HELLO,   WORLD!","uppercase preserves spacing");
equal(transformTextCase("Hello, WORLD!","lower"),"hello, world!","lowercase preserves punctuation");
equal(transformTextCase("Hello World","camel"),"helloWorld","camel case");
equal(transformTextCase("hello world","pascal"),"HelloWorld","Pascal case");
equal(transformTextCase("Hello World","kebab"),"hello-world","kebab");
equal(transformTextCase("Hello World","snake"),"hello_world","snake");
equal(transformTextCase("Hello World","constant"),"HELLO_WORLD","constant");
equal(transformTextCase("hello world","alternating"),"hElLo WoRlD","alternating Unicode letters");
equal(transformTextCase("नमस्ते दुनिया","upper").length>0,true,"Hindi accepted");
equal(transformTextCase("नमस्ते दुनिया","snake"),"नमस्ते_दुनिया","Indic combining marks stay in original words");
rejects(()=>transformTextCase("a".repeat(100001),"title"),"text case bounded length");

// Base64 binary strictness, Unicode, Base64URL:
equal(utf8ToBase64("Hello, Galaxy."),"SGVsbG8sIEdhbGF4eS4=","legacy Base64 text default");
equal(base64ToUtf8("SGVsbG8sIEdhbGF4eS4="),"Hello, Galaxy.","legacy Base64 decode");
equal(base64ToUtf8(utf8ToBase64("हिन्दी 🌍")),"हिन्दी 🌍","Unicode roundtrip");
equal(utf8ToBase64("f","url"),"Zg","unpadded URL encoding");
equal(base64ToUtf8("Zg","url"),"f","URL decoding");
equal(encodeBase64(new Uint8Array([0,255,254])),"AP/+","binary bytes encode");
equal(decodeBase64("AP/+")?.[1],255,"binary bytes decode");
equal(encodeBase64(new Uint8Array([0,255,254]),"url"),"AP_-","URL alphabet");
equal(decodeBase64("AP_-","url")?.[2],254,"URL binary alphabet");
rejects(()=>decodeBase64("not@@base64"),"invalid Base64 alphabet");
rejects(()=>base64ToUtf8("/w=="),"invalid UTF-8 decode rejected");
rejects(()=>decodeBase64("Zg==="),"invalid padding");
rejects(()=>decodeBase64("A"),"invalid length");
rejects(()=>decodeBase64("Zh=="),"noncanonical bits");
// UUID CSPRNG, version bits and count:
const generated=generateUuidBatch("v4",10);
equal(generated.length,10,"UUID v4 batch length");
check(generated.every(item=>uuidVersion(item)==="v4"),"v4 all valid");
equal(new Set(generated).size,10,"no duplicate sample");
const v7=randomUuid("v7",1770000000000);
equal(uuidVersion(v7),"v7","v7 bits/version");
equal(parseInt(v7.replace(/-/g,"").slice(0,12),16),1770000000000,"v7 48-bit time");
equal(uuidVersion("00000000-0000-0000-0000-000000000000"),null,"invalid UUID version");
equal(generateUuidBatch("v7",3).length,3,"v7 batch length");
rejects(()=>generateUuidBatch("v4",0),"zero UUID count");
rejects(()=>generateUuidBatch("v4",501),"over 500 UUID count");
rejects(()=>randomUuid("v7",-1),"v7 negative time");

// Basic calculator default, invalid arithmetic, finite bounds and scientific expression parser.
equal(calculateBinary("12","3","÷").value,"4","legacy calculator 12 divided by 3");
equal(calculateBinary("12","3","+").value,"15","basic addition");
equal(calculateBinary("12","3","−").value,"9","basic subtraction");
equal(calculateBinary("12","3","×").value,"36","basic multiplication");
check(Boolean(calculateBinary("12","0","÷").error),"division by zero rejected");
check(Boolean(calculateBinary("x","2","+").error),"NaN rejected");
check(Boolean(calculateBinary("","2","+").error),"empty rejected");
equal(calculateBinary("0.1","0.2","+").value,"0.3","float display precision");
equal(evaluateExpression("sqrt(81) + 2^3").value,"17","scientific UI default");
equal(evaluateExpression("2+3*4").value,"14","precedence multiplication");
equal(evaluateExpression("(2+3)*4").value,"20","parentheses");
equal(evaluateExpression("2^3^2").value,"512","right associative exponentiation");
equal(evaluateExpression("-2^2").value,"-4","unary minus exponent precedence");
equal(evaluateExpression("(-2)^2").value,"4","parenthesized negative exponent");
equal(evaluateExpression("50%").value,"0.5","percentage");
equal(evaluateExpression("sqrt(81)").value,"9","square root");
equal(evaluateExpression("abs(-10)").value,"10","absolute value");
equal(evaluateExpression("cos(0)").value,"1","cosine 0 radians");
equal(evaluateExpression("sin(pi/2)").value,"1","pi trig radians");
equal(evaluateExpression("log(100)").value,"2","base 10 log");
equal(evaluateExpression("ln(e)").value,"1","natural log");
equal(evaluateExpression("2.5e2").value,"250","scientific notation number");
check(Boolean(evaluateExpression("1/0").error),"expression div zero");
check(Boolean(evaluateExpression("sqrt(-1)").error),"nonfinite square root");
check(Boolean(evaluateExpression("alert(1)").error),"no JS execution");
check(Boolean(evaluateExpression("2+").error),"unfinished expression");
check(Boolean(evaluateExpression("2x3").error),"implicit multiply prohibited");
check(Boolean(evaluateExpression("".padEnd(257,"1")).error),"long input bounded");
check(Boolean(evaluateExpression("((1)").error),"missing right parenthesis");
console.log("PASS: "+count+" next-priority production-engine regression assertions.");
