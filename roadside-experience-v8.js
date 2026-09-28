
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const video=document.getElementById("roadside-video");
const loading=document.getElementById("roadside-loading");
const canvas=document.getElementById("road-webgl");
const sections=Array.from(document.querySelectorAll("[data-road-section]"));
const speedValue=document.getElementById("roadside-speed-value");
const carHud=Array.from(document.querySelectorAll("[data-car-hud]"));

if(!video||!canvas||!sections.length){
  throw new Error("Roadside experience elements are missing.");
}

let duration=0;
let videoReady=false;
let targetVideoTime=0;
let lastY=window.scrollY||0;
let lastT=performance.now();
let velocity=0;
let smoothVelocity=0;
let elapsed=0;

const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const lerp=(a,b,t)=>a+(b-a)*t;
function smoothstep(a,b,x){
  const t=clamp((x-a)/(b-a),0,1);
  return t*t*(3-2*t);
}

function pageProgress(){
  const doc=document.documentElement;
  const total=Math.max(1,doc.scrollHeight-window.innerHeight);
  return clamp((window.scrollY||0)/total,0,1);
}

function sectionProgress(section){
  const rect=section.getBoundingClientRect();
  const span=Math.max(1,rect.height+window.innerHeight);
  return clamp((window.innerHeight-rect.top)/span,0,1);
}

const getSection=id=>document.getElementById(id);

function updateDom(){
  const progress=pageProgress();

  if(videoReady&&duration>0){
    targetVideoTime=clamp(progress*duration,0,Math.max(0,duration-.04));
  }

  const now=performance.now();
  const y=window.scrollY||0;
  const dt=Math.max(16,now-lastT);
  velocity=clamp((y-lastY)/dt,-4,4);
  lastY=y;
  lastT=now;

  sections.forEach(section=>{
    const p=sectionProgress(section);

    section.querySelectorAll('[data-road-object="sky"],[data-road-object="destination"]').forEach(el=>{
      const delay=parseFloat(el.getAttribute("data-delay")||"0");
      const t=clamp((p-delay)/(1-delay),0,1);
      const enter=smoothstep(.05,.42,t);
      const leave=smoothstep(.78,1,t);
      const opacity=enter*(1-leave*.88);
      const scale=.90+enter*.10+leave*.025;
      const yy=34-enter*34-leave*7;
      const prefix=(el.classList.contains("road-story-sky")||el.classList.contains("road-story-quote"))
        ?"translateX(-50%) ":"";

      el.style.transform=prefix+"translateY("+yy.toFixed(1)+"px) scale("+scale.toFixed(3)+")";
      el.style.opacity=opacity.toFixed(3);
    });
  });
}

function markReady(){
  if(videoReady) return;
  videoReady=true;
  duration=Number.isFinite(video.duration)?video.duration:0;

  video.pause();
  video.muted=true;
  video.playsInline=true;

  updateDom();

  if(duration>0){
    try{video.currentTime=pageProgress()*duration;}catch(e){}
  }

  if(loading) loading.classList.add("is-hidden");
}

video.muted=true;
video.playsInline=true;
video.pause();
video.addEventListener("loadedmetadata",markReady,{once:true});
video.addEventListener("canplay",markReady,{once:true});
video.readyState>=1?markReady():video.load();

window.addEventListener("scroll",updateDom,{passive:true});
window.addEventListener("resize",updateDom,{passive:true});
updateDom();

/* =========================================================
   THREE.JS WORLD
   ========================================================= */
const renderer=new THREE.WebGLRenderer({
  canvas,
  alpha:true,
  antialias:true,
  powerPreference:"high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
renderer.setClearColor(0x000000,0);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.96;

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x0a0b0d,.014);

const camera=new THREE.PerspectiveCamera(48,1,.1,240);
const baseCameraY=1.63;
camera.position.set(0,baseCameraY,5.6);
camera.lookAt(0,1.05,-26);

/* realistic environment reflections for car paint/glass */
const pmrem=new THREE.PMREMGenerator(renderer);
const environment=pmrem.fromScene(new RoomEnvironment(renderer),.04).texture;
scene.environment=environment;

scene.add(new THREE.HemisphereLight(0xdde8ff,0x25201c,1.75));

const keyLight=new THREE.DirectionalLight(0xffffff,2.25);
keyLight.position.set(-5,8,5);
scene.add(keyLight);

const warmLight=new THREE.DirectionalLight(0xff9a66,1.05);
warmLight.position.set(7,5,-12);
scene.add(warmLight);

/* =========================================================
   PREMIUM 3D BILLBOARDS
   ========================================================= */
function makeCanvasTexture(options){
  const c=document.createElement("canvas");
  c.width=1024;
  c.height=512;
  const ctx=c.getContext("2d");

  const dark=options.theme!=="light";
  const bg=options.theme==="orange"?"#e95616":(dark?"#111317":"#f4f5f3");

  ctx.fillStyle=bg;
  ctx.fillRect(0,0,c.width,c.height);

  ctx.strokeStyle=dark?"rgba(255,255,255,.13)":"rgba(17,18,20,.13)";
  ctx.lineWidth=2;
  ctx.strokeRect(26,26,c.width-52,c.height-52);

  ctx.fillStyle="#ff5a00";
  ctx.fillRect(56,54,84,5);

  ctx.fillStyle=dark?"rgba(255,255,255,.66)":"rgba(17,18,20,.60)";
  ctx.font="700 28px Arial";
  ctx.fillText((options.kicker||"CARCHOPE").toUpperCase(),56,106);

  ctx.fillStyle=dark?"#fff":"#111214";
  ctx.font="700 76px Arial";

  const title=options.title||"";
  const words=title.split(" ");
  const lines=[];
  let line="";
  words.forEach(word=>{
    const test=line?line+" "+word:word;
    if(ctx.measureText(test).width>820&&line){
      lines.push(line);
      line=word;
    }else{
      line=test;
    }
  });
  if(line) lines.push(line);

  lines.slice(0,2).forEach((text,i)=>ctx.fillText(text,56,205+i*82));

  ctx.fillStyle=dark?"rgba(255,255,255,.64)":"rgba(17,18,20,.58)";
  ctx.font="400 29px Arial";
  ctx.fillText(options.subtitle||"",56,394);

  ctx.fillStyle=dark?"#fff":"#111214";
  ctx.font="700 23px Arial";
  ctx.fillText((options.cta||"LEARN MORE →").toUpperCase(),56,452);

  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.minFilter=THREE.LinearFilter;
  tex.magFilter=THREE.LinearFilter;
  return tex;
}

function makeBillboard(options){
  const group=new THREE.Group();
  const w=5.7,h=2.85;

  const frame=new THREE.Mesh(
    new THREE.BoxGeometry(w+.16,h+.16,.10),
    new THREE.MeshStandardMaterial({
      color:0x25292e,
      roughness:.38,
      metalness:.72
    })
  );
  group.add(frame);

  const face=new THREE.Mesh(
    new THREE.PlaneGeometry(w,h),
    new THREE.MeshBasicMaterial({map:makeCanvasTexture(options)})
  );
  face.position.z=.056;
  group.add(face);

  const post=new THREE.Mesh(
    new THREE.BoxGeometry(.13,4.2,.13),
    new THREE.MeshStandardMaterial({
      color:0x42474d,
      roughness:.45,
      metalness:.75
    })
  );
  post.position.set(0,-3.5,-.02);
  group.add(post);

  group.visible=false;
  scene.add(group);
  return group;
}

const journeyBoards=[
  {
    mesh:makeBillboard({
      theme:"orange",
      kicker:"Pre-Owned Cars",
      title:"Buy a Car",
      subtitle:"Browse our pre-owned inventory",
      cta:"Explore Cars →"
    }),
    side:-1,delay:0
  },
  {
    mesh:makeBillboard({
      theme:"light",
      kicker:"Direct Selling",
      title:"Sell Your Car",
      subtitle:"Get an instant quote",
      cta:"Start Selling →"
    }),
    side:1,delay:.26
  },
  {
    mesh:makeBillboard({
      theme:"dark",
      kicker:"Full-Service Selling",
      title:"Consign Your Car",
      subtitle:"Let Carchope handle the sale",
      cta:"Learn More →"
    }),
    side:-1,delay:.52
  }
];

const supportBoard=makeBillboard({
  theme:"dark",
  kicker:"Ownership Support",
  title:"Your Partner On Every Mile",
  subtitle:"Insurance · Financing · Rental · Consignment",
  cta:"Our Services →"
});

function orientBillboard(group,side){
  group.lookAt(camera.position.x,group.position.y,camera.position.z);
  group.rotation.y+=side*.055;
}

function animateBoard(entry,p){
  const local=clamp((p-entry.delay)/.42,0,1);
  const g=entry.mesh;

  if(local<=.01||local>=.995){
    g.visible=false;
    return;
  }

  g.visible=true;
  const side=entry.side;

  if(local<.72){
    const q=smoothstep(.02,.72,local);
    g.position.x=lerp(side*4.1,side*6.9,q);
    g.position.y=lerp(2.05,2.42,q);
    g.position.z=lerp(-72,-11,q);
  }else{
    const r=smoothstep(.72,1,local);
    g.position.x=lerp(side*6.9,side*11.5,r);
    g.position.y=lerp(2.42,2.60,r);
    g.position.z=lerp(-11,4.8,r);
  }

  orientBillboard(g,side);
}

function animateSupportBoard(p){
  const g=supportBoard;
  const local=clamp((p-.08)/.78,0,1);

  if(local<=.01||local>=.995){
    g.visible=false;
    return;
  }

  g.visible=true;
  const q=smoothstep(.02,.72,local);
  const r=smoothstep(.72,1,local);

  g.position.x=lerp(4.4,7.1,q)+r*4.2;
  g.position.y=lerp(2.1,2.5,q);
  g.position.z=local<.72?lerp(-65,-12,q):lerp(-12,4.2,r);

  orientBillboard(g,1);
}

/* =========================================================
   REAL GLB CAR MODEL
   Ferrari 458 Italia model from three.js example assets.
   Used as a realistic 3D vehicle base for the motion system.
   ========================================================= */
const cars=[
  {mesh:null,wheels:[],side:-1,delay:0,color:0xf05a17},
  {mesh:null,wheels:[],side:1,delay:.30,color:0xaeb3b8},
  {mesh:null,wheels:[],side:-1,delay:.60,color:0xe7e7e2}
];

const dracoLoader=new DRACOLoader();
dracoLoader.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/libs/draco/gltf/");

const gltfLoader=new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

function cloneMaterial(mat){
  return mat&&mat.clone?mat.clone():mat;
}

function buildCarVariant(source,color){
  const model=source.clone(true);

  model.traverse(obj=>{
    if(obj.isMesh){
      obj.material=cloneMaterial(obj.material);
      obj.castShadow=false;
      obj.receiveShadow=false;
    }
  });

  const body=model.getObjectByName("body");
  if(body){
    body.material=new THREE.MeshPhysicalMaterial({
      color,
      metalness:.72,
      roughness:.25,
      clearcoat:1,
      clearcoatRoughness:.035,
      envMapIntensity:1.15
    });
  }

  ["rim_fl","rim_fr","rim_rr","rim_rl","trim"].forEach(name=>{
    const part=model.getObjectByName(name);
    if(part){
      part.material=new THREE.MeshStandardMaterial({
        color:0xb7bcc2,
        metalness:.9,
        roughness:.22,
        envMapIntensity:1.05
      });
    }
  });

  const glass=model.getObjectByName("glass");
  if(glass){
    glass.material=new THREE.MeshPhysicalMaterial({
      color:0x8ca0b0,
      metalness:.05,
      roughness:.08,
      transmission:.65,
      transparent:true,
      opacity:.72,
      envMapIntensity:1.0
    });
  }

  /* Normalize model size and orientation for road scene */
  const box=new THREE.Box3().setFromObject(model);
  const size=new THREE.Vector3();
  box.getSize(size);
  const targetLength=4.55;
  const scale=targetLength/Math.max(size.x,size.z);
  model.scale.setScalar(scale);

  const box2=new THREE.Box3().setFromObject(model);
  const center=new THREE.Vector3();
  box2.getCenter(center);
  model.position.sub(center);
  model.position.y+=.55;

  /*
    The example Ferrari is longitudinally aligned; this rotation presents
    the rear toward our camera while it drives down the road.
  */
  model.rotation.y=0;

  const holder=new THREE.Group();
  holder.userData.rearFacesCamera=true;
  holder.add(model);
  holder.visible=false;
  scene.add(holder);

  const wheels=[
    model.getObjectByName("wheel_fl"),
    model.getObjectByName("wheel_fr"),
    model.getObjectByName("wheel_rl"),
    model.getObjectByName("wheel_rr")
  ].filter(Boolean);

  return {holder,wheels};
}

gltfLoader.load(
  "https://threejs.org/examples/models/gltf/ferrari.glb",
  gltf=>{
    const source=gltf.scene.children[0]||gltf.scene;

    cars.forEach((entry,index)=>{
      const variant=buildCarVariant(source,entry.color);
      entry.mesh=variant.holder;
      entry.wheels=variant.wheels;
    });

    document.body.classList.add("car-model-ready");
  },
  undefined,
  err=>{
    console.error("3D car model failed to load",err);
    document.body.classList.add("car-model-error");
  }
);

function animateCar(entry,p,index,dt){
  const local=clamp((p-entry.delay)/.38,0,1);
  const car=entry.mesh;

  if(!car){
    if(carHud[index]) carHud[index].classList.remove("is-active");
    return;
  }

  const side=entry.side;

  if(local<=.01){
    car.visible=false;
    if(carHud[index]) carHud[index].classList.remove("is-active");
    return;
  }

  car.visible=true;

  if(local<.30){
    const a=smoothstep(.01,.30,local);
    car.position.x=lerp(side*5.5,side*3.4,a);
    car.position.y=.02;
    car.position.z=lerp(3.2,-3.5,a);
    car.rotation.y=side*lerp(.055,.020,a);
  }else if(local<.64){
    const b=smoothstep(.30,.64,local);
    car.position.x=lerp(side*3.4,side*1.18,b);
    car.position.y=.02;
    car.position.z=lerp(-3.5,-12.8,b);
    car.rotation.y=side*lerp(.020,.008,b);
  }else{
    const c=smoothstep(.64,1,local);
    car.position.x=lerp(side*1.18,0,c);
    car.position.y=.02;
    car.position.z=lerp(-12.8,-50,c);
    car.rotation.y=side*lerp(.008,0,c);
  }

  const wheelSpeed=5+Math.abs(smoothVelocity)*6;
  entry.wheels.forEach(wheel=>{
    wheel.rotation.x-=dt*wheelSpeed;
  });

  const hudActive=local>.70&&local<.94;
  if(carHud[index]) carHud[index].classList.toggle("is-active",hudActive);

  if(local>=.995){
    car.visible=false;
    if(carHud[index]) carHud[index].classList.remove("is-active");
  }
}

/* =========================================================
   SPEED STREAKS
   ========================================================= */
const streakCount=46;
const streakGeometry=new THREE.BufferGeometry();
const streakPositions=new Float32Array(streakCount*6);
const streaks=[];

for(let i=0;i<streakCount;i++){
  const side=i%2===0?-1:1;
  streaks.push({
    x:side*(5+Math.random()*7),
    y:.3+Math.random()*4.8,
    z:-6-Math.random()*65,
    len:.8+Math.random()*2.5,
    speed:.7+Math.random()*1.4
  });
}

function writeStreaks(){
  let k=0;
  streaks.forEach(s=>{
    streakPositions[k++]=s.x;
    streakPositions[k++]=s.y;
    streakPositions[k++]=s.z;
    streakPositions[k++]=s.x*1.015;
    streakPositions[k++]=s.y;
    streakPositions[k++]=s.z+s.len;
  });
  streakGeometry.setAttribute("position",new THREE.BufferAttribute(streakPositions,3));
}
writeStreaks();

const streakMaterial=new THREE.LineBasicMaterial({
  color:0xffffff,
  transparent:true,
  opacity:0,
  blending:THREE.AdditiveBlending,
  depthWrite:false
});
const streakMesh=new THREE.LineSegments(streakGeometry,streakMaterial);
scene.add(streakMesh);

function resize(){
  const w=window.innerWidth;
  const h=window.innerHeight;
  renderer.setSize(w,h,false);
  camera.aspect=w/Math.max(1,h);
  camera.updateProjectionMatrix();
}
resize();
window.addEventListener("resize",resize,{passive:true});

function updateWorld(dt){
  const journey=getSection("road-journey");
  const featured=getSection("road-featured");
  const support=getSection("road-support");

  const jp=journey?sectionProgress(journey):0;
  const fp=featured?sectionProgress(featured):0;
  const sp=support?sectionProgress(support):0;

  journeyBoards.forEach(entry=>animateBoard(entry,jp));
  animateSupportBoard(sp);
  cars.forEach((entry,index)=>animateCar(entry,fp,index,dt));

  const speed=Math.min(1.6,Math.abs(smoothVelocity));
  camera.position.y=baseCameraY+Math.sin(elapsed*18)*speed*.007;
  camera.position.x=Math.sin(elapsed*4.5)*speed*.005;
  camera.lookAt(0,1.05,-26);

  streakMaterial.opacity=Math.min(.16,Math.abs(smoothVelocity)*.055);

  streaks.forEach(s=>{
    s.z+=dt*(8+Math.abs(smoothVelocity)*20)*s.speed;
    if(s.z>4){
      s.z=-68-Math.random()*12;
      const side=Math.random()<.5?-1:1;
      s.x=side*(5+Math.random()*7);
      s.y=.3+Math.random()*4.8;
    }
  });

  const arr=streakGeometry.attributes.position.array;
  let k=0;
  streaks.forEach(s=>{
    arr[k++]=s.x;
    arr[k++]=s.y;
    arr[k++]=s.z;
    arr[k++]=s.x*1.015;
    arr[k++]=s.y;
    arr[k++]=s.z+s.len;
  });
  streakGeometry.attributes.position.needsUpdate=true;
}

const clock=new THREE.Clock();

function render(){
  requestAnimationFrame(render);

  const dt=Math.min(clock.getDelta(),.035);
  elapsed+=dt;

  smoothVelocity+=(velocity-smoothVelocity)*.12;
  velocity*=.9;

  if(videoReady&&duration>0){
    const current=video.currentTime||0;
    const diff=targetVideoTime-current;

    if(Math.abs(diff)>.014){
      let step=diff*.24;
      if(Math.abs(diff)>.7) step=diff*.45;
      if(Math.abs(diff)>2) step=diff*.72;

      try{
        video.currentTime=clamp(current+step,0,Math.max(0,duration-.04));
      }catch(e){}
    }
  }

  const zoom=1.025+Math.min(.028,Math.abs(smoothVelocity)*.010);
  video.style.transform="scale("+zoom.toFixed(4)+")";

  if(speedValue){
    const kmh=48+Math.abs(smoothVelocity)*36+pageProgress()*16;
    speedValue.textContent=String(Math.round(clamp(kmh,48,165))).padStart(3,"0");
  }

  updateWorld(dt);
  renderer.render(scene,camera);
}

render();

document.addEventListener("visibilitychange",()=>{
  if(document.hidden) video.pause();
});
