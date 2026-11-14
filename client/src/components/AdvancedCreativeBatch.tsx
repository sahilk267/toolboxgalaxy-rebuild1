import { useMemo, useState } from "react";
import { Check, Clipboard, Download, RotateCcw } from "lucide-react";
import {
  normalizeHex, hexToRgb, rgbToHsl, rgbToHsv, contrastRatio,
  colorPalette, gradientCss, transformTextCase,
  type GradientStop, type CaseMode,
} from "@/lib/advancedCreativeBatch";
import { trackPageView } from "@/lib/analytics";
function CopyText({value}:{value:string}) {
  const [copied,setCopied]=useState(false);
  return <button className="copy-button" type="button" disabled={!value} onClick={async()=>{
    try {await navigator.clipboard.writeText(value);setCopied(true);window.setTimeout(()=>setCopied(false),1200);} catch {}
  }}>{copied?<Check size={15}/>:<Clipboard size={15}/>} {copied?"Copied":"Copy"}</button>;
}
function Output({value,error}:{value:string;error?:string}) {
  return <div className={"result-block"+(error?" result-block--error":"")}>
    <div className="telemetry-strip"><span>OUTPUT</span><CopyText value={error?"":value}/></div>
    <pre data-tool-output aria-live="polite">{error||value||"Your result will appear here."}</pre>
  </div>;
}
const numeric=(n:number,places=1)=>Number(n.toFixed(places));
export function AdvancedColorTool() {
  const [value,setValue]=useState("#c7f36b");
  const [background,setBackground]=useState("#ffffff");
  const rgb=useMemo(()=>hexToRgb(value),[value]);
  const hex=normalizeHex(value);
  const hsl=rgb?rgbToHsl(rgb):null,hsv=rgb?rgbToHsv(rgb):null;
  const palette=colorPalette(value);
  const contrast=contrastRatio(value,background);
  const summary=rgb&&hsl&&hsv&&hex ?
    "HEX "+hex+"\nRGB "+rgb.r+", "+rgb.g+", "+rgb.b+
    "\nHSL "+numeric(hsl.h)+"°, "+numeric(hsl.s)+"%, "+numeric(hsl.l)+"%"+
    "\nHSV "+numeric(hsv.h)+"°, "+numeric(hsv.s)+"%, "+numeric(hsv.v)+"%"+
    (contrast?"\nContrast against "+background+": "+contrast.toFixed(2)+":1"+
      (contrast>=4.5?" · meets WCAG AA normal text":" · does not meet WCAG AA normal text"):"")+
    (palette?"\nComplement: "+palette.complement+"\nAnalogous: "+palette.analogous.join(", "):"") : "";
  return <div className="runner-stack" data-tool="advanced-color">
    <div className="color-layout">
      <div className="color-preview" style={{background:hex||"#1f2937"}} aria-label="Selected color preview"/>
      <div className="math-row">
        <label>HEX color<input data-field="color-hex" value={value} onChange={e=>setValue(e.target.value)}/></label>
        <label>Pick color<input type="color" value={hex||"#c7f36b"} onChange={e=>setValue(e.target.value)}/></label>
        <label>Contrast background<input data-field="color-background" type="color" value={background} onChange={e=>setBackground(e.target.value)}/></label>
      </div>
    </div>
    {palette&&<section className="rounded-xl border border-white/15 p-3" aria-label="Color palette">
      <strong>Complement, analogous colors and tints</strong>
      <div className="mt-3 flex flex-wrap gap-2">
        {[hex!,palette.complement,...palette.analogous,...palette.tints].map((shade,i)=><button
          key={i} type="button" title={"Use "+shade} className="flex flex-col gap-1 rounded border border-white/20 p-2 text-xs"
          onClick={()=>setValue(shade)}><span style={{display:"block",width:54,height:32,background:shade,borderRadius:4}}/>
          {shade}</button>)}
      </div>
    </section>}
    <button type="button" className="reset-button" onClick={()=>{setValue("#c7f36b");setBackground("#ffffff");}}><RotateCcw size={15}/> Reset</button>
    <Output value={summary} error={!rgb?"Enter a three- or six-digit HEX color.":undefined}/>
    <p className="tool-disclaimer">Contrast ratios use WCAG relative luminance. Accessibility depends on text size and real layout; preview does not certify a complete design.</p>
  </div>;
}

const initialStops: GradientStop[]=[{color:"#c7f36b",position:0},{color:"#6fd5ff",position:100}];
const presets:readonly {title:string;colors:string[]}[]=[
  {title:"Mint to sky",colors:["#c7f36b","#6fd5ff"]},
  {title:"Sunrise",colors:["#ffb451","#ff6c87","#6d52ca"]},
  {title:"Ocean",colors:["#033f63","#1597bb","#83e8ba"]},
];
export function AdvancedGradientTool() {
  const [stops,setStops]=useState<GradientStop[]>(initialStops);
  const [angle,setAngle]=useState("125");
  const [type,setType]=useState<"linear"|"radial">("linear");
  const css=useMemo(()=>{try{return {value:gradientCss(stops,Number(angle),type)};}catch(reason){return {error:reason instanceof Error?reason.message:"Invalid gradient."};}},[stops,angle,type]);
  const update=(index:number,patch:Partial<GradientStop>)=>setStops(current=>current.map((s,i)=>i===index?{...s,...patch}:s));
  const text=css.value?"background: "+css.value+";":"";
  return <div className="runner-stack" data-tool="advanced-gradient">
    <div className="gradient-preview" aria-label="Gradient preview"
      style={{background:css.value||"linear-gradient(125deg, #c7f36b, #6fd5ff)"}}/>
    <div className="math-row">
      <label>Gradient type<select data-field="gradient-type" value={type} onChange={e=>setType(e.target.value as "linear"|"radial")}>
        <option value="linear">Linear</option><option value="radial">Radial</option>
      </select></label>
      <label>Angle (°)<input data-field="gradient-angle" inputMode="decimal" value={angle} disabled={type==="radial"} onChange={e=>setAngle(e.target.value)}/></label>
    </div>
    <section className="rounded-xl border border-white/15 p-3">
      <strong>Color stops (2–6)</strong>
      <div className="mt-3 space-y-2">{stops.map((stop,i)=><div className="math-row" key={i}>
        <label>Color {i+1}<input data-field={"gradient-color-"+i} type="color" value={stop.color} onChange={e=>update(i,{color:e.target.value})}/></label>
        <label>Position (%)<input data-field={"gradient-position-"+i} type="number" min={0} max={100} value={stop.position} onChange={e=>update(i,{position:Number(e.target.value)})}/></label>
        <button type="button" className="reset-button" disabled={stops.length<=2} onClick={()=>setStops(current=>current.filter((_,j)=>j!==i))}>Remove</button>
      </div>)}</div>
      <button type="button" className="quiet-button mt-2" disabled={stops.length>=6} onClick={()=>setStops(current=>{
        if(current.length>=6)return current;
        const last=current[current.length-1],prev=current[current.length-2];
        const position=Math.floor((prev.position+last.position)/2);
        return [...current.slice(0,-1),{color:last.color,position},last];
      })}>Add gradient stop</button>
    </section>
    <div className="flex flex-wrap gap-2">{presets.map(p=><button type="button" className="quiet-button" key={p.title} onClick={()=>
      setStops(p.colors.map((color,i)=>({color,position:i*100/(p.colors.length-1)})))}>{p.title}</button>)}</div>
    <div className="flex flex-wrap gap-2">
      <button type="button" className="reset-button" onClick={()=>{setStops(initialStops);setAngle("125");setType("linear");}}><RotateCcw size={15}/> Reset</button>
      <button type="button" className="quiet-button" disabled={!css.value} onClick={()=>{
        const data="<!doctype html><meta charset=\"utf-8\"><title>Gradient Preview</title><style>html,body{height:100%;margin:0}body{"+text+"}</style>";
        const url=URL.createObjectURL(new Blob([data],{type:"text/html"}));
        const a=document.createElement("a");a.href=url;a.download="toolboxgalaxy-gradient.html";
        document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1200);
      }}><Download size={15}/> Export HTML</button>
    </div>
    <Output value={text} error={css.error}/>
    <p className="tool-disclaimer">Stop positions must be ascending. CSS and downloadable HTML are generated from validated numeric positions and six-digit HEX colors only.</p>
  </div>;
}

const modes:readonly {key:CaseMode;label:string}[]=[
  {key:"title",label:"Title Case"},{key:"sentence",label:"Sentence case"},
  {key:"upper",label:"UPPERCASE"},{key:"lower",label:"lowercase"},
  {key:"camel",label:"camelCase"},{key:"pascal",label:"PascalCase"},
  {key:"kebab",label:"kebab-case"},{key:"snake",label:"snake_case"},
  {key:"constant",label:"CONSTANT_CASE"},{key:"alternating",label:"aLtErNaTiNg"},
];
export function AdvancedTextCaseTool() {
  const [input,setInput]=useState("Toolbox Galaxy makes small things easy");
  const [mode,setMode]=useState<CaseMode>("title");
  const result=useMemo(()=>{try{return {value:transformTextCase(input,mode)}}catch(reason){return {error:reason instanceof Error?reason.message:"Invalid text."}}},[input,mode]);
  return <div className="runner-stack" data-tool="advanced-text-case">
    <label>Case<select data-field="case-mode" value={mode} onChange={e=>{
      const next=e.target.value as CaseMode;setMode(next);
      trackPageView(undefined,undefined,"text-formatted",{format:next,tool_slug:"text-case"});
    }}>{modes.map(item=><option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
    <label className="wide-field">Input text<textarea data-field="case-input" rows={7} value={input} onChange={e=>setInput(e.target.value)}/></label>
    <button type="button" className="reset-button" onClick={()=>{setInput("Toolbox Galaxy makes small things easy");setMode("title");}}><RotateCcw size={15}/> Reset</button>
    <Output value={result.value||""} error={result.error}/>
    <p className="tool-disclaimer">Title and sentence case preserve existing whitespace and punctuation. Programmer cases intentionally normalize separators. Unicode letters are handled locally.</p>
  </div>;
}
