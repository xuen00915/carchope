
(function(){
  "use strict";

  var story=document.getElementById("road-story");
  var stage=document.getElementById("road-stage");
  var canvas=document.getElementById("road-webgl");
  var fallback=document.getElementById("road-fallback");
  var chapters=Array.prototype.slice.call(document.querySelectorAll("[data-road-chapter]"));
  var counter=document.getElementById("road-chapter-count");
  var root=document.documentElement;
  var body=document.body;
  var reducedMotion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if(!story||!stage) return;

  /*
    Empty-road image: Unsplash, Simon Schwyter.
    The cockpit framing is rendered by CSS so the scene reads as a first-person
    view from inside the car while the road stays free of other vehicles.
  */
  var ROAD_IMAGE="https://images.unsplash.com/photo-1766487484329-c76860d9460d?auto=format&fit=crop&w=2400&q=84";

  if(fallback) fallback.src=ROAD_IMAGE;

  var targetProgress=0;
  var smoothProgress=0;
  var pointer={x:0,y:0};
  var pointerTarget={x:0,y:0};
  var lastScrollY=window.scrollY||0;
  var lastScrollTime=performance.now();
  var scrollVelocity=0;

  function clamp(v,min,max){return Math.min(max,Math.max(min,v));}
  function smoothstep(edge0,edge1,x){
    var t=clamp((x-edge0)/(edge1-edge0),0,1);
    return t*t*(3-2*t);
  }
  function storyProgress(){
    var rect=story.getBoundingClientRect();
    var total=Math.max(1,story.offsetHeight-window.innerHeight);
    return clamp((-rect.top)/total,0,1);
  }
  function chapterOpacity(index,p){
    if(index===0){
      if(p<=.18) return 1;
      return 1-smoothstep(.18,.31,p);
    }
    if(index===1){
      return smoothstep(.22,.34,p)*(1-smoothstep(.54,.67,p));
    }
    return smoothstep(.58,.71,p);
  }
  function updateStoryState(){
    targetProgress=storyProgress();

    var now=performance.now();
    var dt=Math.max(16,now-lastScrollTime);
    var currentY=window.scrollY||0;
    scrollVelocity=(currentY-lastScrollY)/dt;
    lastScrollY=currentY;
    lastScrollTime=now;

    chapters.forEach(function(chapter,index){
      var opacity=chapterOpacity(index,targetProgress);
      var y=(1-opacity)*34;
      chapter.style.setProperty("--chapter-opacity",opacity.toFixed(3));
      chapter.style.setProperty("--chapter-y",y.toFixed(1)+"px");
      chapter.classList.toggle("is-visible",opacity>.03);
      chapter.setAttribute("aria-hidden",opacity>.03?"false":"true");
    });

    var active=targetProgress<.29?1:(targetProgress<.65?2:3);
    if(counter) counter.textContent=("0"+active).slice(-2)+" / 03";
    root.style.setProperty("--road-progress",targetProgress.toFixed(4));

    var rect=story.getBoundingClientRect();
    var heroDone=rect.bottom<=window.innerHeight*0.22;
    body.classList.toggle("road-header-solid",heroDone);
  }

  updateStoryState();
  window.addEventListener("scroll",updateStoryState,{passive:true});
  window.addEventListener("resize",updateStoryState,{passive:true});
  window.addEventListener("pointermove",function(e){
    pointerTarget.x=(e.clientX/window.innerWidth-.5)*2;
    pointerTarget.y=(e.clientY/window.innerHeight-.5)*2;
  },{passive:true});

  if(reducedMotion||!canvas||!window.THREE){
    body.classList.add("road-webgl-fallback");
    return;
  }

  var renderer=new THREE.WebGLRenderer({
    canvas:canvas,
    alpha:true,
    antialias:true,
    powerPreference:"high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,window.innerWidth<760?1.35:1.75));
  renderer.setClearColor(0x000000,0);

  var scene=new THREE.Scene();
  var camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  var geometry=new THREE.PlaneGeometry(2,2);

  var uniforms={
    uTexture:{value:null},
    uResolution:{value:new THREE.Vector2(1,1)},
    uTexResolution:{value:new THREE.Vector2(16,9)},
    uProgress:{value:0},
    uPointer:{value:new THREE.Vector2(0,0)},
    uTime:{value:0},
    uVelocity:{value:0}
  };

  var material=new THREE.ShaderMaterial({
    transparent:true,
    uniforms:uniforms,
    vertexShader:[
      "varying vec2 vUv;",
      "void main(){",
      "  vUv=uv;",
      "  gl_Position=vec4(position,1.0);",
      "}"
    ].join("\\n"),
    fragmentShader:[
      "uniform sampler2D uTexture;",
      "uniform vec2 uResolution;",
      "uniform vec2 uTexResolution;",
      "uniform float uProgress;",
      "uniform vec2 uPointer;",
      "uniform float uTime;",
      "uniform float uVelocity;",
      "varying vec2 vUv;",
      "void main(){",
      "  float screenAspect=uResolution.x/uResolution.y;",
      "  float texAspect=uTexResolution.x/uTexResolution.y;",
      "  vec2 cover=vec2(1.0);",
      "  if(screenAspect>texAspect){",
      "    cover.y=texAspect/screenAspect;",
      "  }else{",
      "    cover.x=screenAspect/texAspect;",
      "  }",
      "  float zoom=mix(1.0,0.81,smoothstep(0.0,1.0,uProgress));",
      "  vec2 uv=(vUv-0.5)*cover*zoom+0.5;",
      "  uv+=uPointer*vec2(0.011,-0.007)*(1.0-uProgress*0.25);",
      "  float bend=sin((uv.y*3.1415926)+(uProgress*2.3))*0.0055*uProgress;",
      "  uv.x+=bend;",
      "  float speedPush=clamp(abs(uVelocity)*0.55,0.0,0.018);",
      "  uv.y+=speedPush*(0.5-vUv.y);",
      "  vec4 c=texture2D(uTexture,clamp(uv,0.001,0.999));",
      "  float vignette=1.0-smoothstep(0.34,0.82,distance(vUv,vec2(0.5)));",
      "  c.rgb*=mix(0.86,1.0,vignette);",
      "  c.rgb*=vec3(1.02,0.995,0.97);",
      "  gl_FragColor=c;",
      "}"
    ].join("\\n")
  });

  scene.add(new THREE.Mesh(geometry,material));

  function resize(){
    var w=stage.clientWidth;
    var h=stage.clientHeight;
    renderer.setSize(w,h,false);
    uniforms.uResolution.value.set(w,h);
  }
  resize();
  window.addEventListener("resize",resize,{passive:true});

  var loader=new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  loader.load(
    ROAD_IMAGE,
    function(texture){
      texture.colorSpace=THREE.SRGBColorSpace;
      texture.minFilter=THREE.LinearFilter;
      texture.magFilter=THREE.LinearFilter;
      uniforms.uTexture.value=texture;
      if(texture.image){
        uniforms.uTexResolution.value.set(texture.image.naturalWidth||texture.image.width||16,texture.image.naturalHeight||texture.image.height||9);
      }
      canvas.classList.add("is-ready");
    },
    undefined,
    function(){
      body.classList.add("road-webgl-fallback");
    }
  );

  var clock=new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    smoothProgress+=(targetProgress-smoothProgress)*.065;
    pointer.x+=(pointerTarget.x-pointer.x)*.055;
    pointer.y+=(pointerTarget.y-pointer.y)*.055;

    uniforms.uProgress.value=smoothProgress;
    uniforms.uPointer.value.set(pointer.x,pointer.y);
    uniforms.uTime.value=clock.getElapsedTime();
    uniforms.uVelocity.value+=(scrollVelocity-uniforms.uVelocity.value)*.08;

    renderer.render(scene,camera);
  }
  animate();
})();
