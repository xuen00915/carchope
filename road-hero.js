
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
    The first-person cockpit is CSS. WebGL turns the still image into a scroll-
    driven forward-driving scene by zooming FROM the road's vanishing point,
    adding radial motion blur and moving road-speed streaks.
  */
  var ROAD_IMAGE="https://images.unsplash.com/photo-1766487484329-c76860d9460d?auto=format&fit=crop&w=2400&q=84";

  if(fallback) fallback.src=ROAD_IMAGE;

  var targetProgress=0;
  var smoothProgress=0;
  var pointer={x:0,y:0};
  var pointerTarget={x:0,y:0};

  var lastScrollY=window.scrollY||0;
  var lastScrollTime=performance.now();
  var velocityTarget=0;
  var velocitySmooth=0;
  var acceleration=0;
  var driveDistance=0;

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
    var dy=currentY-lastScrollY;

    /*
      px/ms. Downward scrolling creates positive acceleration.
      We clamp hard so a trackpad fling feels fast without becoming chaotic.
    */
    var instant=clamp(dy/dt,-3.6,3.6);
    velocityTarget=instant;

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

  /*
    Even the non-WebGL fallback now pushes forward from approximately the same
    vanishing point, so the motion direction still feels correct.
  */
  function updateFallbackMotion(){
    if(!fallback) return;
    var boost=clamp(Math.abs(velocitySmooth)*.09,0,.08);
    var scale=1.02+(smoothProgress*.38)+boost;
    fallback.style.transformOrigin="53% 54%";
    fallback.style.transform="scale("+scale.toFixed(4)+")";
  }

  if(reducedMotion||!canvas||!window.THREE){
    body.classList.add("road-webgl-fallback");
    window.addEventListener("scroll",function(){
      smoothProgress=storyProgress();
      updateFallbackMotion();
    },{passive:true});
    updateFallbackMotion();
    return;
  }

  var renderer=new THREE.WebGLRenderer({
    canvas:canvas,
    alpha:true,
    antialias:true,
    powerPreference:"high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,window.innerWidth<760?1.25:1.7));
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
    uVelocity:{value:0},
    uDrive:{value:0},
    uAcceleration:{value:0}
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
    ].join("\n"),
    fragmentShader:[
      "precision highp float;",
      "uniform sampler2D uTexture;",
      "uniform vec2 uResolution;",
      "uniform vec2 uTexResolution;",
      "uniform float uProgress;",
      "uniform vec2 uPointer;",
      "uniform float uTime;",
      "uniform float uVelocity;",
      "uniform float uDrive;",
      "uniform float uAcceleration;",
      "varying vec2 vUv;",

      "float hash(float n){",
      "  return fract(sin(n)*43758.5453123);",
      "}",

      "void main(){",
      "  float screenAspect=uResolution.x/uResolution.y;",
      "  float texAspect=uTexResolution.x/uTexResolution.y;",
      "  vec2 cover=vec2(1.0);",

      "  if(screenAspect>texAspect){",
      "    cover.y=texAspect/screenAspect;",
      "  }else{",
      "    cover.x=screenAspect/texAspect;",
      "  }",

      /*
        Vanishing point of this road image in screen UV space.
        Every scale change radiates from here, so the foreground road expands
        toward the viewer like actual forward movement.
      */
      "  vec2 vanish=vec2(0.535,0.555);",

      /*
        Much stronger than the old centered zoom:
        1.00 -> 0.57 over the scroll story, plus a short impulse on fast scroll.
      */
      "  float speed=clamp(abs(uVelocity)*0.42+uAcceleration*0.30,0.0,1.0);",
      "  float travel=smoothstep(0.0,1.0,uProgress);",
      "  float zoom=mix(1.0,0.57,travel)-speed*0.045;",
      "  zoom=max(0.50,zoom);",

      "  vec2 screenUv=vanish+(vUv-vanish)*zoom;",

      /*
        Subtle perspective stretch: near road moves more than the horizon.
      */
      "  float nearMask=smoothstep(0.60,0.02,vUv.y);",
      "  screenUv.y-=nearMask*(0.012*travel+0.010*speed);",
      "  screenUv.x+=(vUv.x-vanish.x)*nearMask*0.018*speed;",

      /*
        Steering/parallax is deliberately tiny so it does not fight the
        forward-driving direction.
      */
      "  screenUv+=uPointer*vec2(0.006,-0.003)*(1.0-travel*0.35);",

      /*
        Small suspension vibration, strongest near the foreground.
      */
      "  float vibration=sin(uDrive*5.0+vUv.y*28.0)*0.00075*speed;",
      "  screenUv.y+=vibration*nearMask;",

      "  vec2 uv=(screenUv-0.5)*cover+0.5;",
      "  vec2 mappedVanish=(vanish-0.5)*cover+0.5;",
      "  vec2 radial=uv-mappedVanish;",

      /*
        Radial motion blur: samples stretch AWAY from the vanishing point.
        This is the main acceleration cue while the page is being scrolled.
      */
      "  float blurAmount=mix(0.0005,0.0095,speed)+travel*0.0012;",
      "  vec4 c=vec4(0.0);",
      "  c+=texture2D(uTexture,clamp(uv-radial*blurAmount*0.00,0.001,0.999))*0.27;",
      "  c+=texture2D(uTexture,clamp(uv-radial*blurAmount*0.35,0.001,0.999))*0.22;",
      "  c+=texture2D(uTexture,clamp(uv-radial*blurAmount*0.75,0.001,0.999))*0.20;",
      "  c+=texture2D(uTexture,clamp(uv-radial*blurAmount*1.20,0.001,0.999))*0.17;",
      "  c+=texture2D(uTexture,clamp(uv-radial*blurAmount*1.75,0.001,0.999))*0.14;",

      /*
        Procedural roadside/asphalt streaks. They originate at the horizon and
        rush toward the bottom/sides, reinforcing forward speed without adding
        cars or objects to the road.
      */
      "  vec2 rp=vUv-vanish;",
      "  float radius=length(rp);",
      "  float angle=atan(rp.y,rp.x);",
      "  float band=floor(angle*92.0);",
      "  float rnd=hash(band);",
      "  float flow=fract(radius*52.0-uDrive*(2.8+speed*9.0)+rnd);",
      "  float streak=smoothstep(0.985,1.0,flow);",
      "  float outward=smoothstep(0.18,0.74,radius);",
      "  float roadHalf=smoothstep(0.58,0.03,vUv.y);",
      "  float edgeMask=smoothstep(0.14,0.52,abs(vUv.x-vanish.x))+roadHalf*0.30;",
      "  streak*=outward*edgeMask*(0.12+speed*0.72);",
      "  c.rgb+=vec3(1.0,0.83,0.69)*streak*0.24;",

      "  float vignette=1.0-smoothstep(0.34,0.84,distance(vUv,vec2(0.5)));",
      "  c.rgb*=mix(0.84,1.0,vignette);",
      "  c.rgb*=vec3(1.02,0.995,0.97);",

      /*
        Slight contrast lift while accelerating makes the scene feel sharper
        at the center while the edges stretch.
      */
      "  c.rgb=mix(c.rgb,(c.rgb-0.5)*1.08+0.5,speed*0.34);",
      "  gl_FragColor=c;",
      "}"
    ].join("\n")
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
        uniforms.uTexResolution.value.set(
          texture.image.naturalWidth||texture.image.width||16,
          texture.image.naturalHeight||texture.image.height||9
        );
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

    var dt=Math.min(clock.getDelta(),0.034);

    smoothProgress+=(targetProgress-smoothProgress)*.085;
    pointer.x+=(pointerTarget.x-pointer.x)*.045;
    pointer.y+=(pointerTarget.y-pointer.y)*.045;

    /*
      Let the scroll impulse linger briefly, like throttle / inertia, then fall
      back to a gentle cruising motion as the user stops scrolling.
    */
    velocitySmooth+=(velocityTarget-velocitySmooth)*.16;
    velocityTarget*=Math.pow(0.055,dt);
    if(Math.abs(velocityTarget)<0.002) velocityTarget=0;

    var requestedAcceleration=clamp(Math.abs(velocitySmooth)*0.38,0,1);
    acceleration+=(requestedAcceleration-acceleration)*.12;

    /*
      Drive distance keeps advancing a little even between wheel ticks.
      Faster scroll = faster forward travel / streak motion.
    */
    var cruise=0.16+smoothProgress*0.18;
    var throttle=cruise+acceleration*2.65;
    driveDistance+=dt*throttle;

    uniforms.uProgress.value=smoothProgress;
    uniforms.uPointer.value.set(pointer.x,pointer.y);
    uniforms.uTime.value=clock.elapsedTime;
    uniforms.uVelocity.value=velocitySmooth;
    uniforms.uDrive.value=driveDistance;
    uniforms.uAcceleration.value=acceleration;

    /*
      Physical cockpit feedback: tiny suspension bob + roll. Because only the
      cockpit moves, the road remains the dominant forward-motion cue.
    */
    var bob=(Math.sin(driveDistance*18.0)*0.8+Math.sin(driveDistance*31.0)*0.35)*acceleration;
    var roll=Math.sin(driveDistance*9.0)*0.06*acceleration;
    root.style.setProperty("--drive-bob",(bob.toFixed(3))+"px");
    root.style.setProperty("--drive-roll",(roll.toFixed(3))+"deg");
    root.style.setProperty("--drive-speed",acceleration.toFixed(3));

    updateFallbackMotion();
    renderer.render(scene,camera);
  }

  animate();
})();
