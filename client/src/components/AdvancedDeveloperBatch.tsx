import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Check, Clipboard, Download, RotateCcw, ShieldCheck } from "lucide-react";
import {
  utf8ToBase64, base64ToUtf8, encodeBase64, decodeBase64, downloadBytes,
  generateUuidBatch, uuidVersion, calculateBinary, evaluateExpression,
  type Base64Flavor, type UuidVersion, type BinaryOp,
} from "@/lib/advancedDeveloperBatch";

function Copy({text}:{text:string}) {
  const [copied,setCopied]=useState(false);
  return <button className="copy-button" type="button" disabled={!text} onClick={async()=>{
    try{await navigator.clipboard.writeText(text);setCopied(true);window.setTimeout(()=>setCopied(false),1200);}catch{}
  }}>{copied?<Check size={15}/>:<Clipboard size={15}/>} {copied?"Copied":"Copy"}</button>;
}
function Output({text,error}:{text:string;error?:string}){
  return <div className={"result-block"+(error?" result-block--error":"")}>
    <div className="telemetry-strip"><span>OUTPUT</span><Copy text={error?"":text}/></div>
    <pre data-tool-output className="max-h-64 overflow-auto whitespace-pre-wrap break-all" aria-live="polite">{error||text||"Your local result will appear here."}</pre>
  </div>;
}
function downloadText(text:string,name:string,mime="text/plain;charset=utf-8"){
  downloadBytes(new TextEncoder().encode(text),name,mime);
}

export function AdvancedBase64Tool() {
  const [mode,setMode]=useState<"encode"|"decode">("encode");
  const [flavor,setFlavor]=useState<Base64Flavor>("standard");
  const [input,setInput]=useState("Hello, Galaxy.");
  const [fileBytes,setFileBytes]=useState<Uint8Array|null>(null);
  const [fileName,setFileName]=useState("");
  const [inputMode,setInputMode]=useState<"text"|"file">("text");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const fileRevision=useRef(0);
  const result=useMemo(()=>{
    try{
      if(inputMode==="file"){
        if(mode==="decode")return {error:"Switch to text input to decode Base64."};
        return fileBytes ? {output:encodeBase64(fileBytes,flavor)} : {error:"Choose a file to encode."};
      }
      return {output:mode==="encode"?utf8ToBase64(input,flavor):base64ToUtf8(input,flavor)};
    }catch(reason){return {error:reason instanceof Error?reason.message:"Invalid text/Base64 data."};}
  },[inputMode,mode,flavor,input,fileBytes]);
  async function chooseFile(event:ChangeEvent<HTMLInputElement>) {
    const file=event.target.files?.[0];event.target.value="";
    if(!file)return;
    const revision=++fileRevision.current;
    setFileBytes(null);setFileName("");setError("");
    if(file.size>2*1024*1024){setBusy(false);setError("Files must not exceed 2 MB.");return;}
    setBusy(true);
    try{
      const bytes=new Uint8Array(await file.arrayBuffer());
      if(revision!==fileRevision.current)return;
      setFileBytes(bytes);setFileName(file.name);
    }catch{
      if(revision===fileRevision.current)setError("Could not read the selected file.");
    }finally{
      if(revision===fileRevision.current)setBusy(false);
    }
  }
  function reset(){fileRevision.current++;setBusy(false);setMode("encode");setFlavor("standard");setInput("Hello, Galaxy.");setInputMode("text");setFileBytes(null);setFileName("");setError("");}
  function downloadResult() {
    try {
      if(mode==="decode"&&inputMode==="text")downloadBytes(decodeBase64(input,flavor),"toolboxgalaxy-decoded.bin");
      else if(result.output)downloadText(result.output,"toolboxgalaxy-base64.txt");
    }catch(reason){setError(reason instanceof Error?reason.message:"Download unavailable.");}
  }
  return <div className="runner-stack" data-tool="advanced-base64">
    <div className="math-row">
      <label>Mode<select data-field="base64-mode" value={mode} onChange={e=>{setMode(e.target.value as "encode"|"decode");setError("");}}>
        <option value="encode">Encode UTF-8 text</option><option value="decode">Decode Base64 text</option>
      </select></label>
      <label>Alphabet<select data-field="base64-flavor" value={flavor} onChange={e=>setFlavor(e.target.value as Base64Flavor)}>
        <option value="standard">Standard Base64</option><option value="url">Base64URL (unpadded)</option>
      </select></label>
      <label>Input type<select data-field="base64-input-mode" value={inputMode} onChange={e=>{setInputMode(e.target.value as "text"|"file");setError("");}}>
        <option value="text">Text</option><option value="file">File → Base64</option>
      </select></label>
    </div>
    {inputMode==="file"?<label className="wide-field">Choose a local file up to 2 MB
      <input data-field="base64-file" type="file" onChange={e=>void chooseFile(e)}/>
      {fileName&&<span className="text-sm">{fileName} · {fileBytes?.length.toLocaleString()} bytes</span>}
    </label>:<label className="wide-field">Input<textarea data-field="base64-input" value={input} rows={7} onChange={e=>setInput(e.target.value)}/></label>}
    <p className="tool-disclaimer"><ShieldCheck size={14} className="inline"/> Processing stays in this browser. Binary Base64 may not be valid UTF-8; decoded text uses strict UTF-8 and rejects malformed sequences. Base64 is encoding, not encryption.</p>
    <div className="flex flex-wrap gap-2">
      <button className="quiet-button" type="button" disabled={!result.output||busy} onClick={downloadResult}><Download size={15}/> Download {mode==="decode"?"binary":"text"}</button>
      <button className="reset-button" type="button" onClick={reset}><RotateCcw size={15}/> Reset</button>
    </div>
    {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}
    <Output text={result.output||""} error={result.error}/>
  </div>;
}

export function AdvancedUuidTool() {
  const [version,setVersion]=useState<UuidVersion>("v4");
  const [count,setCount]=useState("1");
  const [values,setValues]=useState<string[]>([]);
  const [validate,setValidate]=useState("");
  const [error,setError]=useState("");
  function generate() {
    try{setValues(generateUuidBatch(version,Number(count)));setError("");}
    catch(reason){setValues([]);setError(reason instanceof Error?reason.message:"UUID generation failed.");}
  }
  const result=values.join("\n");
  return <div className="runner-stack" data-tool="advanced-uuid">
    <div className="math-row">
      <label>Version<select data-field="uuid-version" value={version} onChange={e=>{setVersion(e.target.value as UuidVersion);setValues([]);}}>
        <option value="v4">UUID v4 (random)</option><option value="v7">UUID v7 (timestamp + random)</option>
      </select></label>
      <label>Generate count (1–500)<input data-field="uuid-count" type="number" min={1} max={500} step={1} value={count} onChange={e=>{setCount(e.target.value);setValues([]);}}/></label>
    </div>
    <div className="flex flex-wrap gap-2">
      <button className="signal-button" type="button" onClick={generate}>Generate UUID</button>
      <button className="quiet-button" type="button" disabled={!values.length} onClick={()=>downloadText(result,"toolboxgalaxy-uuids.txt")}><Download size={15}/> Export TXT</button>
      <button className="reset-button" type="button" onClick={()=>{setVersion("v4");setCount("1");setValues([]);setValidate("");setError("");}}><RotateCcw size={15}/> Clear</button>
    </div>
    <label className="wide-field">Validate a UUID v4/v7
      <input data-field="uuid-validate" value={validate} onChange={e=>setValidate(e.target.value)} placeholder="Paste UUID"/>
    </label>
    {validate&&<p className="text-sm" role="status">{uuidVersion(validate.trim())?"Valid "+uuidVersion(validate.trim())+" UUID":"Not a valid UUID v4/v7"}</p>}
    <p className="tool-disclaimer">Browser cryptographic randomness required. UUIDv7 embeds a millisecond timestamp; a batch is not guaranteed to be lexically ordered or monotonic within one millisecond.</p>
    {error&&<p className="text-red-300 text-sm" role="alert">{error}</p>}
    <Output text={result}/>
  </div>;
}

export function AdvancedCalculatorTool() {
  const [mode,setMode]=useState<"basic"|"scientific">("basic");
  const [a,setA]=useState("12"),[b,setB]=useState("3"),[operator,setOperator]=useState<BinaryOp>("÷");
  const [expression,setExpression]=useState("sqrt(81) + 2^3");
  const [history,setHistory]=useState<string[]>([]);
  const basic=useMemo(()=>calculateBinary(a,b,operator),[a,b,operator]);
  const scientific=useMemo(()=>evaluateExpression(expression),[expression]);
  const current=mode==="basic"?basic:scientific;
  function record(){
    if(!current.value)return;
    const item=(mode==="basic"?a+" "+operator+" "+b:expression)+" = "+current.value;
    setHistory(old=>[item,...old].slice(0,20));
  }
  function reset(){
    setMode("basic");setA("12");setB("3");setOperator("÷");
    setExpression("sqrt(81) + 2^3");setHistory([]);
  }
  return <div className="runner-stack" data-tool="advanced-calculator">
    <div className="toggle-row">
      <button type="button" className={mode==="basic"?"toggle-button toggle-button--active":"toggle-button"} onClick={()=>setMode("basic")}>Basic</button>
      <button type="button" className={mode==="scientific"?"toggle-button toggle-button--active":"toggle-button"} onClick={()=>setMode("scientific")}>Scientific expression</button>
    </div>
    {mode==="basic"?<div className="math-row">
      <label>Value A<input data-field="calc-a" inputMode="decimal" value={a} onChange={e=>setA(e.target.value)}/></label>
      <label>Operation<select data-field="calc-operator" value={operator} onChange={e=>setOperator(e.target.value as BinaryOp)}>
        {["+", "−","×","÷"].map(op=><option key={op}>{op}</option>)}
      </select></label>
      <label>Value B<input data-field="calc-b" inputMode="decimal" value={b} onChange={e=>setB(e.target.value)}/></label>
    </div>:<>
      <label className="wide-field">Expression
        <input data-field="calc-expression" value={expression} onChange={e=>setExpression(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();record();}}}/>
      </label>
      <p className="tool-disclaimer">Supported: + − × ÷ ^, parentheses, percentages (50%), π/pi, e, sqrt(), abs(), sin(), cos(), tan(), log(), ln(). Trigonometric angles are in radians. Enter to save to history. Never evaluates JavaScript.</p>
    </>}
    <div className="flex flex-wrap gap-2">
      <button className="quiet-button" type="button" onClick={record} disabled={!current.value}>Save to history</button>
      <button className="reset-button" type="button" onClick={reset}><RotateCcw size={15}/> Reset</button>
    </div>
    <Output text={current.value||""} error={current.error}/>
    {history.length>0&&<section aria-label="Calculation history" className="rounded-xl border border-white/15 p-3">
      <div className="flex items-center justify-between"><strong>Session history</strong><button type="button" className="reset-button" onClick={()=>setHistory([])}>Clear history</button></div>
      <ol className="mt-2 space-y-1" data-calc-history>{history.map((item,i)=><li key={i} className="break-all font-mono text-sm">{item}</li>)}</ol>
    </section>}
  </div>;
}
