import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, Text, TouchableOpacity, View, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../styles/colors';

const FILTERS = [
  ['original', 'Original', 'image-outline'], ['gray', 'P&B', 'contrast-box'], ['blur', 'Desfoque', 'blur'],
  ['gaussian', 'Gaussiano', 'blur-radial'], ['median', 'Mediana', 'blur-linear'], ['bilateral', 'Bilateral', 'blur-linear'],
  ['sharpen', 'Nitidez', 'auto-fix'], ['canny', 'Contorno', 'vector-polyline'], ['threshold', 'Threshold', 'chart-bell-curve'],
  ['otsu', 'Otsu', 'chart-bell-curve-cumulative'], ['adaptive', 'Adaptativo', 'grid'], ['invert', 'Inverter', 'invert-colors'],
  ['equalize', 'Equalizar', 'chart-line'], ['erode', 'Erosão', 'arrow-collapse'], ['dilate', 'Dilatação', 'arrow-expand'],
  ['open', 'Abertura', 'selection-drag'], ['close', 'Fechamento', 'selection-off'], ['gradient', 'Gradiente', 'gradient-horizontal'],
  ['tophat', 'Top-hat', 'shape-outline'], ['blackhat', 'Black-hat', 'shape-outline'],
];

const INITIAL = { brightness: 0, contrast: 1, saturation: 1, rotation: 0, flipX: false, flipY: false, filter: 'original', crop: null };
const cloneState = (s) => ({ ...s, crop: s.crop ? { ...s.crop } : null });

function clamp(v, min = 0, max = 255) { return Math.max(min, Math.min(max, v)); }
function luminance(data, i) { return Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114); }
function toGray(data) {
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) { const g = luminance(data, i); out[i] = out[i + 1] = out[i + 2] = g; out[i + 3] = data[i + 3]; }
  return out;
}
function threshold(data, value, invert = false) {
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) { let v = luminance(data, i) >= value ? 255 : 0; if (invert) v = 255 - v; out[i] = out[i + 1] = out[i + 2] = v; out[i + 3] = data[i + 3]; }
  return out;
}
function equalize(data) {
  const hist = new Array(256).fill(0); const total = data.length / 4;
  for (let i = 0; i < data.length; i += 4) hist[luminance(data, i)]++;
  let sum = 0; const map = new Uint8Array(256); const scale = 255 / Math.max(1, total);
  for (let i = 0; i < 256; i++) { sum += hist[i]; map[i] = Math.round(sum * scale); }
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) { const v = map[luminance(data, i)]; out[i] = out[i + 1] = out[i + 2] = v; out[i + 3] = data[i + 3]; }
  return out;
}
function convolution(data, w, h, kernel, divisor = 1, offset = 0) {
  const out = new Uint8ClampedArray(data.length), k = Math.floor(Math.sqrt(kernel.length) / 2);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let r = 0, g = 0, b = 0;
    for (let ky = -k; ky <= k; ky++) for (let kx = -k; kx <= k; kx++) {
      const xx = Math.max(0, Math.min(w - 1, x + kx)), yy = Math.max(0, Math.min(h - 1, y + ky));
      const j = (yy * w + xx) * 4, kv = kernel[(ky + k) * (2 * k + 1) + kx + k];
      r += data[j] * kv; g += data[j + 1] * kv; b += data[j + 2] * kv;
    }
    const i = (y * w + x) * 4; out[i] = clamp(r / divisor + offset); out[i + 1] = clamp(g / divisor + offset); out[i + 2] = clamp(b / divisor + offset); out[i + 3] = data[i + 3];
  }
  return out;
}
function boxBlur(data, w, h, radius = 2) {
  const size = radius * 2 + 1; const kernel = new Array(size * size).fill(1); return convolution(data, w, h, kernel, size * size);
}
function medianFilter(data, w, h, radius = 1) {
  const out = new Uint8ClampedArray(data.length), vals = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const channels = [[], [], []];
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) { const xx=Math.max(0,Math.min(w-1,x+dx)), yy=Math.max(0,Math.min(h-1,y+dy)); const j=(yy*w+xx)*4; channels[0].push(data[j]); channels[1].push(data[j+1]); channels[2].push(data[j+2]); }
    const i=(y*w+x)*4; for(let c=0;c<3;c++){ vals.length=0; vals.push(...channels[c]); vals.sort((a,b)=>a-b); out[i+c]=vals[Math.floor(vals.length/2)]; } out[i+3]=data[i+3];
  }
  return out;
}
function morphology(data, w, h, mode) {
  const gray = toGray(data), out = new Uint8ClampedArray(data.length), isMax = mode === 'dilate' || mode === 'gradient';
  const base = (x,y) => gray[(Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x)))*4];
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
    let mn=255,mx=0; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){const v=base(x+dx,y+dy);mn=Math.min(mn,v);mx=Math.max(mx,v);}
    let v = isMax ? mx : mn;
    if(mode==='open'||mode==='close'||mode==='tophat'||mode==='blackhat') { const first = mode==='open'||mode==='tophat' ? mn : mx; v=first; }
    if(mode==='gradient') v=mx-mn;
    if(mode==='tophat') v=Math.max(0,base(x,y)-mn); if(mode==='blackhat') v=Math.max(0,mx-base(x,y));
    const i=(y*w+x)*4; out[i]=out[i+1]=out[i+2]=v; out[i+3]=data[i+3];
  }
  return out;
}
function edgeDetect(data,w,h){
  const g=toGray(data), out=new Uint8ClampedArray(data.length), sx=[-1,0,1,-2,0,2,-1,0,1], sy=[-1,-2,-1,0,0,0,1,2,1];
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){let gx=0,gy=0; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){const xx=Math.max(0,Math.min(w-1,x+dx)),yy=Math.max(0,Math.min(h-1,y+dy)),v=g[(yy*w+xx)*4],k=(dy+1)*3+(dx+1);gx+=v*sx[k];gy+=v*sy[k];} const v=clamp(Math.hypot(gx,gy)); const i=(y*w+x)*4; out[i]=out[i+1]=out[i+2]=v>100?255:0; out[i+3]=data[i+3];}
  return out;
}
function processPixels(data,w,h,state){
  let out=data; const f=state.filter;
  if(f==='gray') out=toGray(out);
  else if(f==='invert'){out=new Uint8ClampedArray(out); for(let i=0;i<out.length;i+=4){out[i]=255-out[i];out[i+1]=255-out[i+1];out[i+2]=255-out[i+2];}}
  else if(f==='blur') out=boxBlur(out,w,h,2);
  else if(f==='gaussian') out=boxBlur(boxBlur(out,w,h,2),w,h,2);
  else if(f==='median') out=medianFilter(out,w,h,1);
  else if(f==='bilateral') out=boxBlur(out,w,h,1);
  else if(f==='sharpen') out=convolution(out,w,h,[0,-1,0,-1,5,-1,0,-1,0]);
  else if(f==='canny') out=edgeDetect(out,w,h);
  else if(f==='threshold') out=threshold(out,128);
  else if(f==='otsu'){let g=toGray(out),hist=new Array(256).fill(0),total=w*h;for(let i=0;i<g.length;i+=4)hist[g[i]]++;let sum=0,sumB=0,wB=0,max=0,t=128;for(let i=0;i<256;i++)sum+=i*hist[i];for(let i=0;i<256;i++){wB+=hist[i];if(!wB)continue;const wF=total-wB;if(!wF)break;sumB+=i*hist[i];const mB=sumB/wB,mF=(sum-sumB)/wF,between=wB*wF*(mB-mF)*(mB-mF);if(between>max){max=between;t=i;}}out=threshold(out,t);}
  else if(f==='adaptive'){const g=toGray(out), local=boxBlur(g,w,h,4);out=new Uint8ClampedArray(g.length);for(let i=0;i<g.length;i+=4){const v=g[i]>=local[i]-5?255:0;out[i]=out[i+1]=out[i+2]=v;out[i+3]=g[i+3];}}
  else if(f==='equalize') out=equalize(out);
  else if(['erode','dilate','open','close','gradient','tophat','blackhat'].includes(f)) out=morphology(out,w,h,f);
  if(state.brightness!==0||state.contrast!==1||state.saturation!==1){out=new Uint8ClampedArray(out);const c=state.contrast,b=state.brightness,s=state.saturation;for(let i=0;i<out.length;i+=4){let r=out[i],g=out[i+1],bl=out[i+2];r=clamp((r-128)*c+128+b);g=clamp((g-128)*c+128+b);bl=clamp((bl-128)*c+128+b);const lum=r*.299+g*.587+bl*.114;r=clamp(lum+(r-lum)*s);g=clamp(lum+(g-lum)*s);bl=clamp(lum+(bl-lum)*s);out[i]=r;out[i+1]=g;out[i+2]=bl;}}
  return out;
}

function EditorWeb({ sourceUri, onUse }) {
  const canvasRef=useRef(null), sourceRef=useRef(null), imageRef=useRef(null);
  const [ready,setReady]=useState(false),[busy,setBusy]=useState(true),[error,setError]=useState('');
  const [state,setState]=useState(INITIAL),[undo,setUndo]=useState([]),[redo,setRedo]=useState([]),[zoom,setZoom]=useState(1);
  const [cropMode,setCropMode]=useState(false),[cropBox,setCropBox]=useState({x:10,y:10,w:80,h:80}),dragRef=useRef(null);
  const commit=useCallback((updater)=>{setState(prev=>{const next=typeof updater==='function'?updater(prev):updater;setUndo(s=>[...s.slice(-29),cloneState(prev)]);setRedo([]);return next;});},[]);
  const load=useCallback(()=>{setBusy(true);setError('');const img=new window.Image();img.onload=()=>{const c=sourceRef.current;if(!c){setError('O editor não conseguiu inicializar o canvas de origem.');setBusy(false);return;}const max=1200,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));const w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});if(!ctx){setError('O navegador não disponibilizou o Canvas 2D.');setBusy(false);return;}ctx.clearRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);imageRef.current={width:w,height:h};setReady(true);setBusy(false);};img.onerror=()=>{setError('Não foi possível carregar a imagem.');setBusy(false);};img.src=sourceUri;},[sourceUri]);
  useEffect(()=>{load();},[load]);
  const render=useCallback(()=>{
    if(!ready||!sourceRef.current||!canvasRef.current)return;
    try {
      const source=sourceRef.current, sourceCtx=source.getContext('2d');
      let workCanvas=source, workCtx=sourceCtx, w=source.width, h=source.height;
      if(state.crop){
        const x=Math.max(0,Math.min(w-1,Math.round(w*state.crop.x/100)));
        const y=Math.max(0,Math.min(h-1,Math.round(h*state.crop.y/100)));
        const cw=Math.max(1,Math.min(w-x,Math.round(w*state.crop.w/100)));
        const ch=Math.max(1,Math.min(h-y,Math.round(h*state.crop.h/100)));
        workCanvas=document.createElement('canvas'); workCanvas.width=cw; workCanvas.height=ch;
        workCtx=workCanvas.getContext('2d'); workCtx.putImageData(sourceCtx.getImageData(x,y,cw,ch),0,0); w=cw; h=ch;
      } else {
        workCtx=sourceCtx;
      }
      const input=workCtx.getImageData(0,0,w,h);
      const processed=processPixels(input.data,w,h,state);
      const dest=canvasRef.current;
      dest.width=(Math.abs(state.rotation)===90)?h:w; dest.height=(Math.abs(state.rotation)===90)?w:h;
      const destCtx=dest.getContext('2d'); destCtx.clearRect(0,0,dest.width,dest.height);
      const processedCanvas=document.createElement('canvas'); processedCanvas.width=w; processedCanvas.height=h;
      processedCanvas.getContext('2d').putImageData(new ImageData(processed,w,h),0,0);
      destCtx.save(); destCtx.translate(dest.width/2,dest.height/2); destCtx.rotate(state.rotation*Math.PI/180); destCtx.scale(state.flipX?-1:1,state.flipY?-1:1);
      destCtx.drawImage(processedCanvas,-w/2,-h/2); destCtx.restore();
      dest.style.transform=`scale(${zoom})`; setError('');
    } catch(e) { setError(`Erro ao processar imagem: ${e?.message||e}`); }
  },[ready,state,zoom]);
  useEffect(()=>{render();},[render]);
  const undoEdit=()=>{setUndo(s=>{if(!s.length)return s;const prev=s[s.length-1];setRedo(r=>[...r.slice(-29),cloneState(state)]);setState(cloneState(prev));return s.slice(0,-1);});setCropMode(false);};
  const redoEdit=()=>{setRedo(s=>{if(!s.length)return s;const next=s[s.length-1];setUndo(u=>[...u.slice(-29),cloneState(state)]);setState(cloneState(next));return s.slice(0,-1);});setCropMode(false);};
  const reset=()=>{commit(INITIAL);setCropMode(false);setZoom(1);};
  const applyCrop=()=>{commit(s=>({...s,crop:{...cropBox}}));setCropMode(false);};
  const beginCropDrag=e=>{e.preventDefault();const rect=e.currentTarget.getBoundingClientRect();dragRef.current={sx:e.clientX,sy:e.clientY,start:{...cropBox},rect};const move=ev=>{const dX=(ev.clientX-dragRef.current.sx)/rect.width*100,dY=(ev.clientY-dragRef.current.sy)/rect.height*100;setCropBox(c=>({...c,x:Math.max(0,Math.min(100-c.w,dragRef.current.start.x+dX)),y:Math.max(0,Math.min(100-c.h,dragRef.current.start.y+dY))}));};const up=()=>{window.removeEventListener('mousemove',move);window.removeEventListener('mouseup',up);};window.addEventListener('mousemove',move);window.addEventListener('mouseup',up);};
  return <View style={styles.root}><View style={styles.preview}><canvas ref={sourceRef} style={styles.sourceCanvas}/><canvas ref={canvasRef} style={styles.canvas}/>{cropMode&&<View style={styles.cropOverlay} onStartShouldSetResponder={()=>true} onResponderGrant={beginCropDrag}><View style={[styles.cropBox,{left:`${cropBox.x}%`,top:`${cropBox.y}%`,width:`${cropBox.w}%`,height:`${cropBox.h}%`}]}><View style={styles.cropShade}/><View style={styles.cropHandle}><MaterialCommunityIcons name="cursor-move" size={20} color="#fff"/></View></View></View>}{busy&&<View style={styles.overlay}><ActivityIndicator size="large" color={colors.primary}/><Text style={styles.status}>Preparando editor...</Text></View>}</View>
    {error?<View style={styles.errorBox}><Text style={styles.error}>{error}</Text><Text style={styles.errorHelp}>O editor não depende mais do módulo @opencvjs/web/Metro. O processamento é feito localmente no navegador.</Text></View>:null}
    <View style={styles.topTools}><TouchableOpacity disabled={!undo.length} onPress={undoEdit} style={[styles.action,!undo.length&&styles.disabled]}><MaterialCommunityIcons name="undo" size={18} color="#fff"/><Text style={styles.actionText}>Voltar</Text></TouchableOpacity><TouchableOpacity disabled={!redo.length} onPress={redoEdit} style={[styles.action,!redo.length&&styles.disabled]}><MaterialCommunityIcons name="redo" size={18} color="#fff"/><Text style={styles.actionText}>Refazer</Text></TouchableOpacity><TouchableOpacity onPress={()=>{setCropMode(true);setCropBox(state.crop||{x:10,y:10,w:80,h:80});}} style={styles.action}><MaterialCommunityIcons name="crop" size={18} color="#fff"/><Text style={styles.actionText}>Cortar</Text></TouchableOpacity><TouchableOpacity onPress={reset} style={styles.action}><MaterialCommunityIcons name="restore" size={18} color="#fff"/><Text style={styles.actionText}>Redefinir</Text></TouchableOpacity>{cropMode&&<TouchableOpacity onPress={applyCrop} style={[styles.action,styles.actionActive]}><MaterialCommunityIcons name="check" size={18} color="#fff"/><Text style={styles.actionText}>Aplicar corte</Text></TouchableOpacity>}</View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>{FILTERS.map(([id,label,icon])=><TouchableOpacity key={id} onPress={()=>commit(s=>({...s,filter:id}))} style={[styles.filter,state.filter===id&&styles.filterActive]}><MaterialCommunityIcons name={icon} size={20} color={state.filter===id?'#fff':colors.primary}/><Text style={[styles.filterText,state.filter===id&&{color:'#fff'}]}>{label}</Text></TouchableOpacity>)}</ScrollView>
    <View style={styles.toolbar}><TouchableOpacity onPress={()=>commit(s=>({...s,rotation:(s.rotation+90)%360}))} style={styles.tool}><MaterialCommunityIcons name="rotate-right" size={22} color={colors.primary}/><Text>Girar</Text></TouchableOpacity><TouchableOpacity onPress={()=>commit(s=>({...s,flipX:!s.flipX}))} style={styles.tool}><MaterialCommunityIcons name="flip-horizontal" size={22} color={colors.primary}/><Text>Espelhar X</Text></TouchableOpacity><TouchableOpacity onPress={()=>commit(s=>({...s,flipY:!s.flipY}))} style={styles.tool}><MaterialCommunityIcons name="flip-vertical" size={22} color={colors.primary}/><Text>Espelhar Y</Text></TouchableOpacity><TouchableOpacity onPress={()=>commit(s=>({...s,brightness:Math.max(-100,s.brightness-10)}))} style={styles.tool}><Text style={styles.big}>−</Text><Text>Brilho</Text></TouchableOpacity><TouchableOpacity onPress={()=>commit(s=>({...s,brightness:Math.min(100,s.brightness+10)}))} style={styles.tool}><Text style={styles.big}>+</Text><Text>Brilho</Text></TouchableOpacity><TouchableOpacity onPress={()=>commit(s=>({...s,contrast:Math.max(.2,Number((s.contrast-.1).toFixed(1)))}))} style={styles.tool}><Text style={styles.big}>−</Text><Text>Contraste</Text></TouchableOpacity><TouchableOpacity onPress={()=>commit(s=>({...s,contrast:Math.min(3,Number((s.contrast+.1).toFixed(1)))}))} style={styles.tool}><Text style={styles.big}>+</Text><Text>Contraste</Text></TouchableOpacity><TouchableOpacity onPress={()=>setZoom(z=>Math.min(3,z+.2))} style={styles.tool}><MaterialCommunityIcons name="magnify-plus" size={22} color={colors.primary}/><Text>Zoom</Text></TouchableOpacity><TouchableOpacity onPress={()=>setZoom(z=>Math.max(.5,z-.2))} style={styles.tool}><MaterialCommunityIcons name="magnify-minus" size={22} color={colors.primary}/><Text>Zoom</Text></TouchableOpacity></View>
    <TouchableOpacity style={styles.useButton} onPress={()=>onUse(canvasRef.current.toDataURL('image/jpeg',.92))}><MaterialCommunityIcons name="check" size={22} color="#fff"/><Text style={styles.useText}>Usar imagem editada</Text></TouchableOpacity></View>;
}
function NativeFallback({sourceUri,onUse}){return <View style={styles.native}><Text style={styles.nativeTitle}>Editor de imagem</Text><Image source={{uri:sourceUri}} style={styles.nativeImage}/><Text style={styles.nativeText}>A edição completa está disponível no navegador. A versão nativa preserva a imagem original nesta etapa.</Text><TouchableOpacity onPress={()=>onUse(sourceUri)} style={styles.useButton}><Text style={styles.useText}>Usar imagem</Text></TouchableOpacity></View>}
export function ImageEditorScreen(){const navigation=useNavigation(),route=useRoute(),sourceUri=route.params?.uri;const onUse=image=>{if(route.params?.returnTo){navigation.popTo(route.params.returnTo,{editedImage:image});}else navigation.goBack();};if(!sourceUri)return <View style={styles.empty}><Text>Imagem não encontrada.</Text></View>;return Platform.OS==='web'?<EditorWeb sourceUri={sourceUri} onUse={onUse}/>:<NativeFallback sourceUri={sourceUri} onUse={onUse}/>;}
const styles={root:{flex:1,backgroundColor:'#f4f4f4',padding:14},preview:{flex:1,minHeight:340,backgroundColor:'#111',borderRadius:14,overflow:'hidden',alignItems:'center',justifyContent:'center',padding:12,position:'relative'},sourceCanvas:{position:'absolute',left:-10000,top:-10000,width:1,height:1},canvas:{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',transition:'transform .15s ease'},overlay:{position:'absolute',top:0,left:0,right:0,bottom:0,backgroundColor:'rgba(255,255,255,.94)',alignItems:'center',justifyContent:'center'},status:{marginTop:10,fontWeight:'700',color:'#333'},errorBox:{padding:10,backgroundColor:'#fff3f3',borderRadius:10,marginTop:8},error:{color:'#b00020',fontWeight:'800'},errorHelp:{color:'#666',marginTop:4,fontSize:12},topTools:{flexDirection:'row',flexWrap:'wrap',gap:8,paddingVertical:10},action:{backgroundColor:colors.primary,borderRadius:10,paddingHorizontal:13,paddingVertical:9,flexDirection:'row',alignItems:'center',gap:5},actionActive:{backgroundColor:'#7f1111'},disabled:{opacity:.35},actionText:{color:'#fff',fontWeight:'800'},cropOverlay:{position:'absolute',top:0,left:0,right:0,bottom:0},cropBox:{position:'absolute',borderWidth:2,borderColor:'#fff',backgroundColor:'rgba(255,255,255,.06)'},cropShade:{position:'absolute',top:-1000,left:-1000,right:-1000,bottom:-1000,backgroundColor:'rgba(0,0,0,.48)'},cropHandle:{position:'absolute',left:'50%',top:'50%',marginLeft:-18,marginTop:-18,width:36,height:36,borderRadius:18,backgroundColor:colors.primary,alignItems:'center',justifyContent:'center'},filterRow:{gap:8,paddingVertical:8},filter:{minWidth:92,paddingVertical:10,paddingHorizontal:10,borderRadius:10,backgroundColor:'#fff',alignItems:'center',gap:4,borderWidth:1,borderColor:'#ddd'},filterActive:{backgroundColor:colors.primary,borderColor:colors.primary},filterText:{fontSize:12,fontWeight:'700',color:'#333'},toolbar:{flexDirection:'row',flexWrap:'wrap',gap:8,paddingBottom:10},tool:{backgroundColor:'#fff',borderRadius:10,paddingHorizontal:12,paddingVertical:8,alignItems:'center',minWidth:78},big:{fontSize:20,fontWeight:'800',color:colors.primary},useButton:{backgroundColor:colors.primary,borderRadius:12,padding:15,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},useText:{color:'#fff',fontWeight:'800',fontSize:16},native:{flex:1,padding:20,backgroundColor:'#fff'},nativeTitle:{fontSize:22,fontWeight:'800',color:'#222',marginBottom:12},nativeImage:{width:'100%',height:320,resizeMode:'contain',backgroundColor:'#111'},nativeText:{marginTop:16,color:'#666'},empty:{flex:1,justifyContent:'center',alignItems:'center'}};
