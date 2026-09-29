
/* Pure timeline model shared by the featured-car renderer and its tests. */
(function(root){
  "use strict";

  function clamp01(value){
    return Math.max(0,Math.min(1,value));
  }

  function easeOutCubic(value){
    var t=clamp01(value);
    return 1-Math.pow(1-t,3);
  }

  function round(value){
    return Math.round(value*1000)/1000;
  }

  function getState(progress,count){
    var total=Math.max(1,Math.floor(count||1));
    var p=clamp01(Number(progress)||0);

    if(p>=1){
      return {index:total-1,phase:"parked",local:1,x:0,info:1,wheels:-1440};
    }

    var scaled=p*total;
    var index=Math.min(total-1,Math.floor(scaled));
    var local=clamp01(scaled-index);
    var enterEnd=.24;
    var parkEnd=.72;
    var phase="parked";
    var x=0;
    var info=1;

    if(local<enterEnd){
      phase="entering";
      var entering=easeOutCubic(local/enterEnd);
      x=112*(1-entering);
      info=clamp01((local-.16)/.08);
    }else if(local>parkEnd){
      phase="leaving";
      var leaving=easeOutCubic((local-parkEnd)/(1-parkEnd));
      x=-118*leaving;
      info=1-clamp01((local-parkEnd)/.08);
    }

    return {
      index:index,
      phase:phase,
      local:round(local),
      x:round(x),
      info:round(info),
      wheels:round(-1440*local)
    };
  }

  root.CarchopeFeaturedSequence={getState:getState};
})(typeof globalThis!=="undefined"?globalThis:window);


/* Carchope whole-page scroll-scrub road background */
(function(){
  "use strict";

  var video=document.getElementById("road-scroll-video");
  var loading=document.getElementById("road-video-loading");
  var wheel=document.getElementById("road-wheel-thumb");

  if(!video) return;

  var duration=0;
  var ready=false;
  var targetTime=0;
  var targetProgress=0;
  var rafId=0;

  function clamp(v,min,max){
    return Math.min(max,Math.max(min,v));
  }

  function getDocumentProgress(){
    var doc=document.documentElement;
    var body=document.body;
    var scrollTop=window.pageYOffset||doc.scrollTop||body.scrollTop||0;
    var fullHeight=Math.max(
      body.scrollHeight,
      body.offsetHeight,
      doc.clientHeight,
      doc.scrollHeight,
      doc.offsetHeight
    );
    var total=Math.max(1,fullHeight-window.innerHeight);
    return clamp(scrollTop/total,0,1);
  }

  function updateTarget(){
    targetProgress=getDocumentProgress();

    if(wheel){
      var wheelContainer=document.getElementById("road-wheel-scroll");
      var wheelSize=wheel.offsetHeight||50;
      var trackHeight=wheelContainer?wheelContainer.clientHeight:184;
      var travel=Math.max(0,trackHeight-wheelSize);
      var wheelY=targetProgress*travel;
      var wheelRotation=targetProgress*1080;
      wheel.style.setProperty("--road-wheel-y",wheelY.toFixed(2)+"px");
      wheel.style.setProperty("--road-wheel-rotation",wheelRotation.toFixed(2)+"deg");
    }

    if(ready&&duration>0){
      /*
        The entire page controls the video:
        page top    -> video first frame
        page footer -> video final frame
      */
      targetTime=clamp(
        targetProgress*duration,
        0,
        Math.max(0,duration-.04)
      );
    }
  }

  function markReady(){
    if(ready) return;

    ready=true;
    duration=isFinite(video.duration)?video.duration:0;

    /*
      Never free-run/autoplay. The video's frame is controlled only
      by the user's page scroll position.
    */
    video.pause();
    video.muted=true;
    video.playsInline=true;

    updateTarget();

    if(duration>0){
      try{
        video.currentTime=targetTime;
      }catch(e){}
    }

    if(loading){
      loading.classList.add("is-hidden");
    }
  }

  video.muted=true;
  video.playsInline=true;
  video.pause();

  video.addEventListener("loadedmetadata",markReady,{once:true});
  video.addEventListener("canplay",markReady,{once:true});

  if(video.readyState>=1){
    markReady();
  }else{
    video.load();
  }

  window.addEventListener("scroll",updateTarget,{passive:true});
  window.addEventListener("resize",updateTarget,{passive:true});
  window.addEventListener("load",updateTarget,{once:true});

  /*
    Images, marquee content and responsive changes can alter the page's
    total scroll height. Recalculate when the document geometry changes.
  */
  if("ResizeObserver" in window){
    var ro=new ResizeObserver(function(){
      updateTarget();
    });
    ro.observe(document.body);
  }

  updateTarget();

  function render(){
    rafId=requestAnimationFrame(render);

    if(!ready||!duration) return;

    var now=video.currentTime||0;
    var diff=targetTime-now;

    if(Math.abs(diff)>.012){
      var step=diff*.22;

      /* Catch up quickly after a large trackpad/page jump. */
      if(Math.abs(diff)>.65) step=diff*.42;
      if(Math.abs(diff)>2.0) step=diff*.70;

      var next=clamp(
        now+step,
        0,
        Math.max(0,duration-.04)
      );

      try{
        video.currentTime=next;
      }catch(e){}
    }
  }

  render();

  document.addEventListener("visibilitychange",function(){
    if(document.hidden){
      video.pause();
    }
  });
})();


/* Featured Cars: drive in from the right, park, reveal, then leave. */
(function(){
  "use strict";

  var section=document.getElementById("featured-drive-section");
  var track=document.getElementById("featured-drive-track");
  var stage=document.getElementById("featured-drive-stage");
  var countLabel=document.getElementById("featured-drive-count");
  var progressBar=document.getElementById("featured-drive-progress-bar");
  var cars=stage?Array.prototype.slice.call(stage.querySelectorAll("[data-featured-car]")):[];
  var sequence=window.CarchopeFeaturedSequence;

  if(!section||!track||!stage||!cars.length||!sequence) return;

  var reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var queued=false;

  function clamp01(value){
    return Math.max(0,Math.min(1,value));
  }

  function sectionProgress(){
    var rect=track.getBoundingClientRect();
    var range=Math.max(1,track.offsetHeight-window.innerHeight);
    return clamp01(-rect.top/range);
  }

  function setAccessibleCar(activeIndex,phase){
    cars.forEach(function(car,index){
      var available=reduced||(index===activeIndex&&phase==="parked");
      car.tabIndex=available?0:-1;
      car.setAttribute("aria-hidden",reduced||index===activeIndex?"false":"true");
      if(index===activeIndex&&phase==="parked"){
        car.setAttribute("aria-current","true");
      }else{
        car.removeAttribute("aria-current");
      }
    });
  }

  function renderFeaturedCars(){
    queued=false;

    if(reduced){
      setAccessibleCar(0,"parked");
      return;
    }

    var progress=sectionProgress();
    var state=sequence.getState(progress,cars.length);

    cars.forEach(function(car,index){
      var active=index===state.index;
      car.classList.toggle("is-active",active);
      car.classList.toggle("is-parked",active&&state.phase==="parked");
      car.dataset.phase=active?state.phase:"waiting";

      if(active){
        car.style.setProperty("--car-x",state.x);
        car.style.setProperty("--info-opacity",state.info);
        car.style.setProperty("--motion-blur",state.phase==="parked"?"0px":"2px");
        car.style.setProperty("--media-scale",state.phase==="parked"?"1.02":"1.055");
        car.style.setProperty("--car-tilt",state.phase==="entering"?"-1.1":state.phase==="leaving"?"1.1":"0");
      }
    });

    setAccessibleCar(state.index,state.phase);

    if(countLabel){
      countLabel.textContent=String(state.index+1).padStart(2,"0")+" / "+String(cars.length).padStart(2,"0");
    }
    if(progressBar){
      progressBar.style.width=(progress*100).toFixed(2)+"%";
    }
  }

  function requestRender(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(renderFeaturedCars);
  }

  window.addEventListener("scroll",requestRender,{passive:true});
  window.addEventListener("resize",requestRender,{passive:true});
  window.addEventListener("load",requestRender,{once:true});
  renderFeaturedCars();
})();


/* WebGL overtaking layer */
(function(){
  "use strict";

  if(!window.THREE) return;

  var canvas=document.getElementById("road-webgl-layer");
  if(!canvas) return;

  var THREE=window.THREE;
  var renderer;

  try{
    renderer=new THREE.WebGLRenderer({
      canvas:canvas,
      alpha:true,
      antialias:true,
      powerPreference:"high-performance"
    });
  }catch(e){
    canvas.style.display="none";
    return;
  }

  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  var scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x101318,.017);

  var camera=new THREE.PerspectiveCamera(41,1,.1,90);
  camera.position.set(0,1.35,6.2);
  camera.lookAt(0,.35,-18);

  var hemi=new THREE.HemisphereLight(0xdceaff,0x15171b,1.55);
  scene.add(hemi);

  var key=new THREE.DirectionalLight(0xffffff,2.1);
  key.position.set(-4,9,7);
  key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);
  scene.add(key);

  var rim=new THREE.DirectionalLight(0xff6b20,1.15);
  rim.position.set(7,3,-4);
  scene.add(rim);

  var roadRoot=new THREE.Group();
  scene.add(roadRoot);

  var shadowMat=new THREE.MeshBasicMaterial({
    color:0x000000,
    transparent:true,
    opacity:.27,
    depthWrite:false
  });

  function roundedBoxGeometry(w,h,d){
    return new THREE.BoxGeometry(w,h,d,2,2,2);
  }

  function makeCar(color){
    var car=new THREE.Group();

    var paint=new THREE.MeshStandardMaterial({
      color:color,
      metalness:.74,
      roughness:.24,
      envMapIntensity:.8
    });

    var dark=new THREE.MeshStandardMaterial({
      color:0x090b0e,
      metalness:.45,
      roughness:.22
    });

    var glass=new THREE.MeshStandardMaterial({
      color:0x18232d,
      metalness:.15,
      roughness:.08,
      transparent:true,
      opacity:.78
    });

    var redGlow=new THREE.MeshStandardMaterial({
      color:0xff1f2d,
      emissive:0xff1826,
      emissiveIntensity:3.8,
      roughness:.28
    });

    var plateMat=new THREE.MeshStandardMaterial({
      color:0xe8e8e3,
      roughness:.55,
      metalness:.05
    });

    var body=new THREE.Mesh(roundedBoxGeometry(2.04,.62,4.1),paint);
    body.position.y=.38;
    body.castShadow=true;
    body.receiveShadow=true;
    car.add(body);

    var roof=new THREE.Mesh(roundedBoxGeometry(1.54,.58,2.1),paint);
    roof.position.set(0,.88,-.12);
    roof.scale.set(1,.82,1);
    roof.castShadow=true;
    car.add(roof);

    var rearGlass=new THREE.Mesh(new THREE.BoxGeometry(1.28,.36,.08),glass);
    rearGlass.position.set(0,.92,1.02);
    rearGlass.rotation.x=-.12;
    car.add(rearGlass);

    var bumper=new THREE.Mesh(new THREE.BoxGeometry(1.86,.22,.18),dark);
    bumper.position.set(0,.18,2.07);
    car.add(bumper);

    var plate=new THREE.Mesh(new THREE.BoxGeometry(.62,.24,.045),plateMat);
    plate.position.set(0,.34,2.18);
    car.add(plate);

    [-.68,.68].forEach(function(x){
      var light=new THREE.Mesh(new THREE.BoxGeometry(.48,.16,.06),redGlow);
      light.position.set(x,.56,2.14);
      car.add(light);
    });

    var wheelGeo=new THREE.CylinderGeometry(.38,.38,.25,24);
    [-.88,.88].forEach(function(x){
      [-1.28,1.32].forEach(function(z){
        var wheel=new THREE.Mesh(wheelGeo,dark);
        wheel.rotation.z=Math.PI/2;
        wheel.position.set(x,.14,z);
        wheel.castShadow=true;
        car.add(wheel);
      });
    });

    var shadow=new THREE.Mesh(new THREE.PlaneGeometry(2.8,5.2),shadowMat);
    shadow.rotation.x=-Math.PI/2;
    shadow.position.y=-.13;
    shadow.position.z=.2;
    car.add(shadow);

    car.scale.setScalar(.93);
    return car;
  }

  var carSpecs=[
    {start:.08,end:.30,side:-1,color:0x2c3138},
    {start:.35,end:.58,side:1,color:0xd8d9d6},
    {start:.64,end:.88,side:-1,color:0x202429}
  ];

  var cars=carSpecs.map(function(spec){
    var car=makeCar(spec.color);
    roadRoot.add(car);
    return {mesh:car,spec:spec};
  });

  // Reflector posts add subtle true-3D parallax without replacing the real video.
  var postGeo=new THREE.BoxGeometry(.06,.42,.06);
  var postMat=new THREE.MeshStandardMaterial({
    color:0xf1f0e9,
    emissive:0xff6a20,
    emissiveIntensity:.42,
    roughness:.6
  });

  for(var i=0;i<22;i++){
    var z=-3-i*3.6;
    [-3.55,3.55].forEach(function(x){
      var post=new THREE.Mesh(postGeo,postMat);
      post.position.set(x,-.42,z);
      roadRoot.add(post);
    });
  }

  var reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse=window.matchMedia&&window.matchMedia("(pointer: coarse)").matches;

  function clamp01(v){return Math.max(0,Math.min(1,v));}
  function easeInOut(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;}
  function smoothstep(a,b,v){
    var t=clamp01((v-a)/(b-a));
    return t*t*(3-2*t);
  }

  function currentProgress(){
    var doc=document.documentElement;
    var scrollTop=window.scrollY||doc.scrollTop||0;
    var total=Math.max(1,doc.scrollHeight-window.innerHeight);
    return clamp01(scrollTop/total);
  }

  var progress=currentProgress();
  var target=progress;

  function updateSize(){
    var w=window.innerWidth;
    var h=window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,coarse?1.25:1.7));
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.fov=w<861?46:41;
    camera.updateProjectionMatrix();
  }

  function updateCars(p){
    cars.forEach(function(item,index){
      var s=item.spec;
      var local=clamp01((p-s.start)/(s.end-s.start));
      var active=p>=s.start-.025&&p<=s.end+.035;
      item.mesh.visible=active;
      if(!active) return;

      var e=easeInOut(local);
      var pass=smoothstep(0,.38,local);
      var merge=smoothstep(.48,1,local);

      // Begin very close behind at the side, sweep past, then merge into lane ahead.
      var sideX=s.side*(3.45-(pass*1.55));
      var laneX=s.side*(1.9-(merge*1.08));
      item.mesh.position.x=THREE.MathUtils.lerp(sideX,laneX,merge);
      item.mesh.position.y=-.84+Math.sin(local*Math.PI)*.035;
      item.mesh.position.z=4.15-e*39;

      item.mesh.rotation.y=s.side*(-.07+.10*merge);
      item.mesh.rotation.z=s.side*(-.012*(1-merge));

      var pulse=1+Math.sin((local+index)*Math.PI*2)*.006;
      item.mesh.scale.setScalar((coarse?.82:.93)*pulse);
    });
  }

  function updateRoad(p){
    roadRoot.position.z=(p*3.6)%3.6;
    roadRoot.rotation.y=Math.sin(p*Math.PI*2)*.005;
  }

  function render(){
    requestAnimationFrame(render);
    if(reduced) return;

    target=currentProgress();
    progress+= (target-progress)*.075;

    updateCars(progress);
    updateRoad(progress);

    camera.position.x=Math.sin(progress*Math.PI*4)*.025;
    camera.position.y=1.35+Math.sin(progress*Math.PI*6)*.012;
    camera.lookAt(0,.35,-18);

    renderer.render(scene,camera);
  }

  window.addEventListener("resize",updateSize,{passive:true});
  updateSize();
  render();
})();
