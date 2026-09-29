
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const video=document.getElementById("roadside-video");
const loading=document.getElementById("roadside-loading");
const canvas=document.getElementById("road-webgl");
const sections=Array.from(document.querySelectorAll("[data-road-section]"));
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

  velocity=clamp((y-lastY)/dt,-3,3);
  lastY=y;
  lastT=now;

  /*
    Real-world treatment:
    content fades into view but does not zoom dramatically or float toward us.
  */
  sections.forEach(section=>{
    const p=sectionProgress(section);

    section.querySelectorAll('[data-road-object="sky"],[data-road-object="destination"]').forEach(el=>{
      const delay=parseFloat(el.getAttribute("data-delay")||"0");
      const t=clamp((p-delay)/(1-delay),0,1);
      const enter=smoothstep(.08,.34,t);
      const leave=smoothstep(.82,1,t);
      const opacity=enter*(1-leave*.82);
      const yOffset=12-enter*12;

      const prefix=(el.classList.contains("road-story-sky")||el.classList.contains("road-story-quote"))
        ?"translateX(-50%) ":"";

      el.style.transform=prefix+"translateY("+yOffset.toFixed(1)+"px)";
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
    try{ video.currentTime=pageProgress()*duration; }catch(e){}
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

renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.55));
renderer.setClearColor(0x000000,0);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.86;

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0xd6d1ca,.0065);

const camera=new THREE.PerspectiveCamera(46,1,.1,220);
const baseCameraY=1.58;

camera.position.set(0,baseCameraY,5.6);
camera.lookAt(0,1.00,-28);

/* Outdoor environment reflections instead of showroom lighting. */
new RGBELoader()
  .load(
    "https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr",
    texture=>{
      texture.mapping=THREE.EquirectangularReflectionMapping;
      scene.environment=texture;
    },
    undefined,
    ()=>{}
  );

scene.add(new THREE.HemisphereLight(0xe5ebf0,0x6b6257,1.25));

const keyLight=new THREE.DirectionalLight(0xffffff,1.45);
keyLight.position.set(-5,9,6);
scene.add(keyLight);

const fillLight=new THREE.DirectionalLight(0xffe2cc,.38);
fillLight.position.set(6,4,-10);
scene.add(fillLight);

/* =========================================================
   REAL-WORLD ROADSIDE BILLBOARDS
   ========================================================= */
function makeCanvasTexture(options){
  const c=document.createElement("canvas");
  c.width=1024;
  c.height=512;
  const ctx=c.getContext("2d");

  const dark=options.theme==="dark";
  const bg=dark?"#1d2023":"#f1f0ec";

  ctx.fillStyle=bg;
  ctx.fillRect(0,0,c.width,c.height);

  ctx.fillStyle="#ff5a00";
  ctx.fillRect(54,52,72,5);

  ctx.fillStyle=dark?"rgba(255,255,255,.62)":"rgba(20,22,24,.58)";
  ctx.font="700 25px Arial";
  ctx.fillText((options.kicker||"CARCHOPE").toUpperCase(),54,99);

  ctx.fillStyle=dark?"#fff":"#17191b";
  ctx.font="700 70px Arial";

  const title=options.title||"";
  const words=title.split(" ");
  const lines=[];
  let line="";

  words.forEach(word=>{
    const test=line?line+" "+word:word;
    if(ctx.measureText(test).width>830&&line){
      lines.push(line);
      line=word;
    }else{
      line=test;
    }
  });

  if(line) lines.push(line);

  lines.slice(0,2).forEach((text,i)=>{
    ctx.fillText(text,54,198+i*78);
  });

  ctx.fillStyle=dark?"rgba(255,255,255,.62)":"rgba(20,22,24,.58)";
  ctx.font="400 27px Arial";
  ctx.fillText(options.subtitle||"",54,390);

  ctx.fillStyle=dark?"#fff":"#17191b";
  ctx.font="700 21px Arial";
  ctx.fillText((options.cta||"LEARN MORE →").toUpperCase(),54,448);

  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.minFilter=THREE.LinearFilter;
  tex.magFilter=THREE.LinearFilter;
  return tex;
}

function makeBillboard(options){
  const group=new THREE.Group();
  const w=5.35;
  const h=2.45;

  const frameMaterial=new THREE.MeshStandardMaterial({
    color:0x4a4d4f,
    roughness:.56,
    metalness:.58
  });

  const frame=new THREE.Mesh(
    new THREE.BoxGeometry(w+.12,h+.12,.08),
    frameMaterial
  );
  group.add(frame);

  const face=new THREE.Mesh(
    new THREE.PlaneGeometry(w,h),
    new THREE.MeshBasicMaterial({map:makeCanvasTexture(options)})
  );
  face.position.z=.046;
  group.add(face);

  const postMaterial=new THREE.MeshStandardMaterial({
    color:0x606367,
    roughness:.62,
    metalness:.55
  });

  [-1.45,1.45].forEach(x=>{
    const post=new THREE.Mesh(
      new THREE.BoxGeometry(.11,3.8,.11),
      postMaterial
    );
    post.position.set(x,-3.05,-.015);
    group.add(post);
  });

  group.visible=false;
  scene.add(group);
  return group;
}

const journeyBoards=[
  {
    mesh:makeBillboard({
      theme:"light",
      kicker:"Pre-Owned Cars",
      title:"Buy a Car",
      subtitle:"Browse our pre-owned inventory",
      cta:"Explore Cars →"
    }),
    side:-1,
    delay:0
  },
  {
    mesh:makeBillboard({
      theme:"dark",
      kicker:"Direct Selling",
      title:"Sell Your Car",
      subtitle:"Get an instant quote",
      cta:"Start Selling →"
    }),
    side:1,
    delay:.27
  },
  {
    mesh:makeBillboard({
      theme:"light",
      kicker:"Consignment",
      title:"Let Us Handle The Sale",
      subtitle:"A simpler route from listing to handover",
      cta:"Learn More →"
    }),
    side:-1,
    delay:.54
  }
];

const supportBoard=makeBillboard({
  theme:"dark",
  kicker:"Ownership Support",
  title:"Your Partner On Every Mile",
  subtitle:"Insurance · Financing · Rental · Consignment",
  cta:"Our Services →"
});

function setBillboardRoadAngle(group,side){
  /*
    Real signs stay fixed relative to the road.
    They do not rotate to face the viewer like game UI.
  */
  group.rotation.set(0,side*-.10,0);
}

function animateBoard(entry,p){
  const local=clamp((p-entry.delay)/.43,0,1);
  const g=entry.mesh;

  if(local<=.015||local>=.995){
    g.visible=false;
    return;
  }

  g.visible=true;

  const q=smoothstep(.02,.98,local);
  const side=entry.side;

  g.position.x=side*7.0;
  g.position.y=2.18;
  g.position.z=lerp(-56,4.4,q);

  setBillboardRoadAngle(g,side);
}

function animateSupportBoard(p){
  const local=clamp((p-.10)/.76,0,1);
  const g=supportBoard;

  if(local<=.015||local>=.995){
    g.visible=false;
    return;
  }

  g.visible=true;

  const q=smoothstep(.02,.98,local);

  g.position.x=7.0;
  g.position.y=2.18;
  g.position.z=lerp(-54,4.2,q);

  setBillboardRoadAngle(g,1);
}

/* =========================================================
   REAL GLB CAR MODEL
   ========================================================= */
const cars=[
  {mesh:null,wheels:[],side:-1,delay:0,color:0x4f5963},
  {mesh:null,wheels:[],side:1,delay:.31,color:0xb5b9bd},
  {mesh:null,wheels:[],side:-1,delay:.62,color:0xe5e5df}
];

const shadowTexture=new THREE.TextureLoader().load(
  "https://threejs.org/examples/models/gltf/ferrari_ao.png"
);

const dracoLoader=new DRACOLoader();
dracoLoader.setDecoderPath(
  "https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/libs/draco/gltf/"
);

const gltfLoader=new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

function buildCarVariant(source,color){
  const model=source.clone(true);

  model.traverse(obj=>{
    if(obj.isMesh&&obj.material){
      obj.material=obj.material.clone();
    }
  });

  const bodyMaterial=new THREE.MeshPhysicalMaterial({
    color,
    metalness:1.0,
    roughness:.50,
    clearcoat:1.0,
    clearcoatRoughness:.03
  });

  const detailsMaterial=new THREE.MeshStandardMaterial({
    color:0xe5e7e8,
    metalness:1.0,
    roughness:.50
  });

  const glassMaterial=new THREE.MeshPhysicalMaterial({
    color:0xffffff,
    metalness:.25,
    roughness:0,
    transmission:1.0
  });

  const body=model.getObjectByName("body");
  if(body) body.material=bodyMaterial;

  ["rim_fl","rim_fr","rim_rr","rim_rl","trim"].forEach(name=>{
    const part=model.getObjectByName(name);
    if(part) part.material=detailsMaterial;
  });

  const glass=model.getObjectByName("glass");
  if(glass) glass.material=glassMaterial;

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
  model.position.y+=.54;

  /*
    Keep the rear toward our camera.
    The car moves down the same road direction as the video.
  */
  model.rotation.y=0;

  const shadow=new THREE.Mesh(
    new THREE.PlaneGeometry(.655*4,1.3*4),
    new THREE.MeshBasicMaterial({
      map:shadowTexture,
      blending:THREE.MultiplyBlending,
      toneMapped:false,
      transparent:true,
      premultipliedAlpha:true,
      opacity:.68
    })
  );
  shadow.rotation.x=-Math.PI/2;
  shadow.position.y=.02;
  shadow.renderOrder=2;
  model.add(shadow);

  const holder=new THREE.Group();
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

    cars.forEach(entry=>{
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
  const local=clamp((p-entry.delay)/.39,0,1);
  const car=entry.mesh;

  if(!car){
    if(carHud[index]) carHud[index].classList.remove("is-active");
    return;
  }

  const side=entry.side;

  if(local<=.015||local>=.995){
    car.visible=false;
    if(carHud[index]) carHud[index].classList.remove("is-active");
    return;
  }

  car.visible=true;

  if(local<.34){
    const a=smoothstep(.015,.34,local);

    /* comes up beside us at believable road scale */
    car.position.x=lerp(side*4.6,side*3.0,a);
    car.position.y=.01;
    car.position.z=lerp(2.0,-3.2,a);
    car.rotation.y=side*lerp(.035,.016,a);
  }else if(local<.68){
    const b=smoothstep(.34,.68,local);

    /* passes our front quarter */
    car.position.x=lerp(side*3.0,side*1.0,b);
    car.position.y=.01;
    car.position.z=lerp(-3.2,-11.5,b);
    car.rotation.y=side*lerp(.016,.006,b);
  }else{
    const c=smoothstep(.68,1,local);

    /* merges gradually into lane ahead */
    car.position.x=lerp(side*1.0,0,c);
    car.position.y=.01;
    car.position.z=lerp(-11.5,-42,c);
    car.rotation.y=side*lerp(.006,0,c);
  }

  const wheelSpeed=4.3+Math.abs(smoothVelocity)*2.5;

  entry.wheels.forEach(wheel=>{
    wheel.rotation.x-=dt*wheelSpeed;
  });

  const hudActive=local>.74&&local<.92;
  if(carHud[index]) carHud[index].classList.toggle("is-active",hudActive);
}

function resize(){
  const w=window.innerWidth;
  const h=window.innerHeight;

  renderer.setSize(w,h,false);
  camera.aspect=w/Math.max(1,h);
  camera.updateProjectionMatrix();
}

resize();
window.addEventListener("resize",resize,{passive:true});

function updateWorld(){
  const journey=getSection("road-journey");
  const featured=getSection("road-featured");
  const support=getSection("road-support");

  const jp=journey?sectionProgress(journey):0;
  const fp=featured?sectionProgress(featured):0;
  const sp=support?sectionProgress(support):0;

  journeyBoards.forEach(entry=>animateBoard(entry,jp));
  animateSupportBoard(sp);

  const dt=Math.min(clock.getDelta(),.035);
  elapsed+=dt;

  cars.forEach((entry,index)=>animateCar(entry,fp,index,dt));

  /*
    Almost imperceptible vehicle/camera vibration.
    No game-like lateral shake.
  */
  const motion=Math.min(1,Math.abs(smoothVelocity));

  camera.position.x=0;
  camera.position.y=baseCameraY+Math.sin(elapsed*13)*motion*.0015;
  camera.lookAt(0,1.00,-28);
}

const clock=new THREE.Clock();

function render(){
  requestAnimationFrame(render);

  smoothVelocity+=(velocity-smoothVelocity)*.10;
  velocity*=.90;

  if(videoReady&&duration>0){
    const current=video.currentTime||0;
    const diff=targetVideoTime-current;

    if(Math.abs(diff)>.014){
      let step=diff*.20;

      if(Math.abs(diff)>.8) step=diff*.38;
      if(Math.abs(diff)>2.2) step=diff*.62;

      try{
        video.currentTime=clamp(
          current+step,
          0,
          Math.max(0,duration-.04)
        );
      }catch(e){}
    }
  }

  /*
    Very small optical push only.
    The original road footage remains dominant.
  */
  const zoom=1.018+Math.min(.007,Math.abs(smoothVelocity)*.0025);
  video.style.transform="scale("+zoom.toFixed(4)+")";

  updateWorld();
  renderer.render(scene,camera);
}

render();

document.addEventListener("visibilitychange",()=>{
  if(document.hidden) video.pause();
});
