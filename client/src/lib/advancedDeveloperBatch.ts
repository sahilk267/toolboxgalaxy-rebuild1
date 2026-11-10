/** Offline developer utilities: strict UTF-8/base64, cryptographic UUIDs, and expression parser (never eval). */
const MAX_TEXT_BYTES = 2 * 1024 * 1024;
export type Base64Flavor = "standard" | "url";
export function encodeBase64(bytes: Uint8Array, flavor:Base64Flavor="standard"):string {
  if(bytes.byteLength>MAX_TEXT_BYTES)throw new Error("File is limited to 2 MB.");
  let binary="";
  for(let i=0;i<bytes.length;i+=0x4000){
    binary+=Array.from(bytes.subarray(i,i+0x4000),b=>String.fromCharCode(b)).join("");
  }
  const output=btoa(binary);
  return flavor==="url"?output.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,""):output;
}
export function decodeBase64(input:string,flavor:Base64Flavor="standard"):Uint8Array {
  if(input.length>3_000_000)throw new Error("Base64 input is limited to three million characters.");
  const clean=input.replace(/[\t\n\r ]/g,"");
  let normalized=flavor==="url"?clean.replace(/-/g,"+").replace(/_/g,"/"):clean;
  if(!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)||normalized.length%4===1)
    throw new Error("Invalid Base64 alphabet or padding.");
  normalized=normalized.replace(/=+$/,"");
  normalized+="=".repeat((4-normalized.length%4)%4);
  const binary=atob(normalized);
  const result=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)result[i]=binary.charCodeAt(i);
  if(encodeBase64(result,"standard").replace(/=+$/,"")!==normalized.replace(/=+$/,""))
    throw new Error("Base64 encoding has noncanonical trailing bits.");
  if(result.length>MAX_TEXT_BYTES)throw new Error("Decoded data exceeds 2 MB.");
  return result;
}
export function utf8ToBase64(text:string,flavor:Base64Flavor="standard"):string {
  return encodeBase64(new TextEncoder().encode(text),flavor);
}
export function base64ToUtf8(input:string,flavor:Base64Flavor="standard"):string {
  return new TextDecoder("utf-8",{fatal:true}).decode(decodeBase64(input,flavor));
}
export function downloadBytes(bytes:Uint8Array, filename:string, mime="application/octet-stream"):void {
  const blob=new Blob([new Uint8Array(bytes)],{type:mime});
  const href=URL.createObjectURL(blob),a=document.createElement("a");
  a.download=filename;a.href=href;document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(href),1400);
}

export type UuidVersion = "v4" | "v7";
export function randomUuid(version:UuidVersion="v4",epoch=Date.now()):string {
  if(typeof crypto==="undefined"||!crypto.getRandomValues)throw new Error("Secure randomness is unavailable.");
  const data=new Uint8Array(16);
  crypto.getRandomValues(data);
  if(version==="v7"){
    if(!Number.isSafeInteger(epoch)||epoch<0||epoch>281_474_976_710_655)
      throw new Error("UUIDv7 timestamp is outside 48-bit range.");
    let time=epoch;
    for(let i=5;i>=0;i--){data[i]=time%256;time=Math.floor(time/256);}
    data[6]=(data[6]&0x0f)|0x70;
  } else if(version==="v4")data[6]=(data[6]&0x0f)|0x40;
  else throw new Error("Unsupported UUID version.");
  data[8]=(data[8]&0x3f)|0x80;
  const hex=Array.from(data,b=>b.toString(16).padStart(2,"0")).join("");
  return hex.slice(0,8)+"-"+hex.slice(8,12)+"-"+hex.slice(12,16)+"-"+hex.slice(16,20)+"-"+hex.slice(20);
}
export function generateUuidBatch(version:UuidVersion,count:number):string[] {
  if(!Number.isSafeInteger(count)||count<1||count>500)throw new Error("Generate between 1 and 500 UUIDs.");
  return Array.from({length:count},()=>randomUuid(version));
}
export function uuidVersion(input:string):UuidVersion|null {
  if(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(input))return "v4";
  if(/^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(input))return "v7";
  return null;
}

export type BinaryOp = "+"|"−"|"×"|"÷";
export function calculateBinary(first:string,second:string,operator:BinaryOp):{value?:string;error?:string}{
  const a=Number(first),b=Number(second);
  if(!first.trim()||!second.trim()||!Number.isFinite(a)||!Number.isFinite(b))
    return {error:"Enter valid finite numbers."};
  if(operator==="÷"&&b===0)return {error:"Division by zero is undefined."};
  const value=operator==="+"?a+b:operator==="−"?a-b:operator==="×"?a*b:a/b;
  if(!Number.isFinite(value))return {error:"Result is outside the supported numeric range."};
  return {value:formatCalcNumber(value)};
}
function formatCalcNumber(value:number):string {
  if(Object.is(value,-0))return "0";
  if(Number.isInteger(value)&&Number.isSafeInteger(value))return String(value);
  return String(Number(value.toPrecision(12)));
}
type Token={type:"number"|"op"|"name"|"left"|"right"|"percent";raw:string};
const functions:Record<string,(v:number)=>number>={
  sqrt:Math.sqrt,sin:Math.sin,cos:Math.cos,tan:Math.tan,log:Math.log10,ln:Math.log,abs:Math.abs,
};
function tokensFrom(input:string):Token[]{
  if(input.length>256)throw new Error("Expression must be 256 characters or shorter.");
  const tokens:Token[]=[];let pos=0;
  const matchNumber=/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/;
  while(pos<input.length){
    if(/\s/.test(input[pos])){pos++;continue;}
    const remaining=input.slice(pos);
    const n=matchNumber.exec(remaining);
    if(n){tokens.push({type:"number",raw:n[0]});pos+=n[0].length;}
    else if(/[+\-*/^×÷−]/.test(input[pos])){
      tokens.push({type:"op",raw:input[pos]==="×"?"*":input[pos]==="÷"?"/":input[pos]==="−"?"-":input[pos]});pos++;
    }
    else if(input[pos]==="("){tokens.push({type:"left",raw:"("});pos++;}
    else if(input[pos]===")"){tokens.push({type:"right",raw:")"});pos++;}
    else if(input[pos]==="%"){tokens.push({type:"percent",raw:"%"});pos++;}
    else {
      const word=/^(?:[A-Za-z]+|π)/.exec(remaining);
      if(!word)throw new Error("Unsupported character at position "+(pos+1)+".");
      tokens.push({type:"name",raw:word[0].toLowerCase()});pos+=word[0].length;
    }
    if(tokens.length>120)throw new Error("Expression has too many tokens.");
  }
  return tokens;
}
export function evaluateExpression(expression:string):{value?:string;error?:string}{
  try {
    const tokens=tokensFrom(expression);if(!tokens.length)throw new Error("Enter an expression.");
    let index=0;
    const peek=()=>tokens[index];
    const take=()=>tokens[index++];
    const expect=(type:Token["type"])=>{if(peek()?.type!==type)throw new Error("Expected "+(type==="right"?")":type)+".");take();};
    let depth=0;
    const opPrecedence=(op:string)=>op==="+"||op==="-"?1:op==="*"||op==="/"?2:op==="^"?4:0;
    function parsePrefix():number {
      if(++depth>40)throw new Error("Expression nesting is too deep.");
      try {
        const token=take();
        if(!token)throw new Error("Incomplete expression.");
        if(token.type==="number")return Number(token.raw);
        if(token.type==="op"&&(token.raw==="+"||token.raw==="-")){
          const value=parseExpr(3);return token.raw==="-"?-value:value;
        }
        if(token.type==="left"){const value=parseExpr(0);expect("right");return value;}
        if(token.type==="name"){
          if(token.raw==="pi"||token.raw==="π")return Math.PI;
          if(token.raw==="e")return Math.E;
          const fn=functions[token.raw];if(!fn)throw new Error("Unknown function "+token.raw+".");
          expect("left");const value=parseExpr(0);expect("right");return fn(value);
        }
        throw new Error("Expected a number, function or opening parenthesis.");
      } finally {depth--;}
    }
    function parseExpr(min:number):number {
      let value=parsePrefix();
      while(peek()){
        const token=peek();
        if(token.type==="percent"&&5>=min){take();value/=100;continue;}
        if(token.type!=="op")break;
        const precedence=opPrecedence(token.raw);
        if(precedence<min||!precedence)break;
        take();
        const right=parseExpr(precedence+(token.raw==="^"?0:1));
        if(token.raw==="+")value+=right;
        else if(token.raw==="-")value-=right;
        else if(token.raw==="*")value*=right;
        else if(token.raw==="/"){
          if(right===0)throw new Error("Division by zero is undefined.");
          value/=right;
        } else value=value**right;
        if(!Number.isFinite(value))throw new Error("Expression produced a non-finite value.");
      }
      return value;
    }
    const value=parseExpr(0);
    if(index!==tokens.length)throw new Error("Unexpected token: "+tokens[index].raw);
    if(!Number.isFinite(value))throw new Error("Expression result is undefined.");
    return {value:formatCalcNumber(value)};
  } catch(reason){return {error:reason instanceof Error?reason.message:"Invalid expression."};}
}
