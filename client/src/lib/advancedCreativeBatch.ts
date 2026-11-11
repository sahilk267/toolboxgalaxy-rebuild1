/** Local creative/typography engines, with strict color validation and no CSS injection. */
export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };
export type Hsv = { h: number; s: number; v: number };
export const clamp = (n:number, min=0,max=1) => Math.max(min,Math.min(max,n));
export function normalizeHex(input: string): string | null {
  const clean=input.trim().replace(/^#/,"");
  if (/^[0-9a-f]{3}$/i.test(clean)) return "#"+Array.from(clean).map(x=>x+x).join("").toUpperCase();
  if (/^[0-9a-f]{6}$/i.test(clean)) return "#"+clean.toUpperCase();
  return null;
}
export function hexToRgb(value:string):Rgb | null {
  const hex=normalizeHex(value);if(!hex)return null;
  return {r:parseInt(hex.slice(1,3),16),g:parseInt(hex.slice(3,5),16),b:parseInt(hex.slice(5,7),16)};
}
export function rgbToHex({r,g,b}:Rgb):string {
  const vals=[r,g,b];if(vals.some(x=>!Number.isFinite(x)||x<0||x>255))throw new Error("RGB must be from 0 to 255.");
  return "#"+vals.map(x=>Math.round(x).toString(16).padStart(2,"0")).join("").toUpperCase();
}
export function rgbToHsl({r,g,b}:Rgb):Hsl {
  const R=r/255,G=g/255,B=b/255;
  const hi=Math.max(R,G,B),lo=Math.min(R,G,B),diff=hi-lo;
  const l=(hi+lo)/2;
  let h=0,s=0;
  if(diff) {
    s=diff/(1-Math.abs(2*l-1));
    switch(hi){case R:h=((G-B)/diff)%6;break;case G:h=(B-R)/diff+2;break;default:h=(R-G)/diff+4;}
    h=((h*60)%360+360)%360;
  }
  return {h,s:s*100,l:l*100};
}
export function rgbToHsv({r,g,b}:Rgb):Hsv {
  const R=r/255,G=g/255,B=b/255,hi=Math.max(R,G,B),lo=Math.min(R,G,B),d=hi-lo;
  let h=0;
  if(d){if(hi===R)h=((G-B)/d)%6;else if(hi===G)h=(B-R)/d+2;else h=(R-G)/d+4;}
  return {h:((h*60)%360+360)%360,s:hi===0?0:d/hi*100,v:hi*100};
}
export function hslToRgb(h:number,s:number,l:number):Rgb {
  if(![h,s,l].every(Number.isFinite)||h<0||h>360||s<0||s>100||l<0||l>100)
    throw new Error("Invalid HSL channel value.");
  const S=s/100,L=l/100,C=(1-Math.abs(2*L-1))*S;
  const hh=h/60,X=C*(1-Math.abs(hh%2-1)),m=L-C/2;
  let p:[number,number,number]=[0,0,0];
  if(hh<1)p=[C,X,0];else if(hh<2)p=[X,C,0];else if(hh<3)p=[0,C,X];
  else if(hh<4)p=[0,X,C];else if(hh<5)p=[X,0,C];else p=[C,0,X];
  return {r:Math.round((p[0]+m)*255),g:Math.round((p[1]+m)*255),b:Math.round((p[2]+m)*255)};
}
export function hsvToRgb(h:number,s:number,v:number):Rgb {
  if(![h,s,v].every(Number.isFinite)||h<0||h>360||s<0||s>100||v<0||v>100)
    throw new Error("Invalid HSV channel value.");
  const C=v/100*s/100,hh=h/60,X=C*(1-Math.abs(hh%2-1)),m=v/100-C;
  let p:[number,number,number]=[0,0,0];
  if(hh<1)p=[C,X,0];else if(hh<2)p=[X,C,0];else if(hh<3)p=[0,C,X];
  else if(hh<4)p=[0,X,C];else if(hh<5)p=[X,0,C];else p=[C,0,X];
  return {r:Math.round((p[0]+m)*255),g:Math.round((p[1]+m)*255),b:Math.round((p[2]+m)*255)};
}
export function relativeLuminance(rgb:Rgb):number {
  const channels=[rgb.r,rgb.g,rgb.b].map(channel=>{
    const s=channel/255;return s<=0.04045?s/12.92:((s+0.055)/1.055)**2.4;
  });
  return 0.2126*channels[0]+0.7152*channels[1]+0.0722*channels[2];
}
export function contrastRatio(a:string,b:string):number|null {
  const x=hexToRgb(a),y=hexToRgb(b);if(!x||!y)return null;
  const A=relativeLuminance(x),B=relativeLuminance(y);
  return (Math.max(A,B)+0.05)/(Math.min(A,B)+0.05);
}
export function colorPalette(hex:string):{complement:string;analogous:[string,string];tints:string[]}|null {
  const rgb=hexToRgb(hex);if(!rgb)return null;
  const {h,s,l}=rgbToHsl(rgb);
  return {
    complement:rgbToHex(hslToRgb((h+180)%360,s,l)),
    analogous:[rgbToHex(hslToRgb((h+30)%360,s,l)),rgbToHex(hslToRgb((h+330)%360,s,l))],
    tints:[0.25,0.5,0.75].map(f=>rgbToHex({
      r:rgb.r+(255-rgb.r)*f,g:rgb.g+(255-rgb.g)*f,b:rgb.b+(255-rgb.b)*f,
    })),
  };
}
export type GradientStop = { color:string; position:number };
export function gradientCss(stops:readonly GradientStop[],angle:number,type:"linear"|"radial"="linear"):string {
  if(stops.length<2||stops.length>6)throw new Error("Use 2–6 gradient stops.");
  if(!Number.isFinite(angle)||angle<0||angle>360)throw new Error("Angle must be between 0 and 360 degrees.");
  if(stops.some(item=>!normalizeHex(item.color)||!Number.isFinite(item.position)||item.position<0||item.position>100))
    throw new Error("Every stop needs a HEX color and a position between 0% and 100%.");
  if(stops.some((item,index)=>index>0&&item.position<stops[index-1].position))
    throw new Error("Gradient positions must be in ascending order.");
  const stopText=stops.map(item=>normalizeHex(item.color)+" "+item.position+"%").join(", ");
  return type==="radial"?"radial-gradient(circle, "+stopText+")":"linear-gradient("+angle+"deg, "+stopText+")";
}
export type CaseMode = "title"|"sentence"|"upper"|"lower"|"camel"|"kebab"|"snake"|"pascal"|"constant"|"alternating";
function upperFirst(word:string):string{return word?word.slice(0,1).toLocaleUpperCase()+word.slice(1):word;}
const letterRE=new RegExp("\\p{L}","u");
const wordTokens=(input:string)=>input.match(new RegExp("[\\p{L}\\p{M}\\p{N}]+","gu"))||[];
export function transformTextCase(input:string,mode:CaseMode):string {
  if(input.length>100_000)throw new Error("Text is limited to 100,000 characters.");
  if(mode==="upper")return input.toLocaleUpperCase();
  if(mode==="lower")return input.toLocaleLowerCase();
  const tokens=wordTokens(input);
  if(mode==="camel")return tokens.map((w,i)=>i?upperFirst(w.toLocaleLowerCase()):w.toLocaleLowerCase()).join("");
  if(mode==="pascal")return tokens.map(w=>upperFirst(w.toLocaleLowerCase())).join("");
  if(mode==="kebab")return tokens.map(w=>w.toLocaleLowerCase()).join("-");
  if(mode==="snake")return tokens.map(w=>w.toLocaleLowerCase()).join("_");
  if(mode==="constant")return tokens.map(w=>w.toLocaleUpperCase()).join("_");
  if(mode==="title")return input.replace(new RegExp("[\\p{L}\\p{M}\\p{N}]+","gu"),w=>upperFirst(w.toLocaleLowerCase()));
  if(mode==="alternating"){
    let cap=false;return Array.from(input).map(char=>{
      if(!letterRE.test(char))return char;
      const out=cap?char.toLocaleUpperCase():char.toLocaleLowerCase();
      cap=!cap;return out;
    }).join("");
  }
  if(mode==="sentence"){
    let capitalize=true;
    return Array.from(input.toLocaleLowerCase()).map(char=>{
      if(letterRE.test(char)&&capitalize){capitalize=false;return char.toLocaleUpperCase();}
      if(/[.!?]/.test(char))capitalize=true;
      return char;
    }).join("");
  }
  return input;
}
