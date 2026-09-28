
(function(){
  "use strict";

  var video=document.getElementById("roadside-video");
  var loading=document.getElementById("roadside-loading");
  var canvas=document.getElementById("road-webgl");
  var sections=Array.prototype.slice.call(document.querySelectorAll("[data-road-section]"));
  var navLinks=[];
  var speedValue=document.getElementById("roadside-speed-value");
  var carHud=Array.prototype.slice.call(document.querySelectorAll("[data-car-hud]"));
  var photoCars=Array.prototype.slice.call(document.querySelectorAll("[data-photo-car]"));

  if(!video||!sections.length) return;

  var duration=0;
  var videoReady=false;
  var targetVideoTime=0;
  var lastY=window.scrollY||0;
  var lastT=performance.now();
  var velocity=0;
  var smoothVelocity=0;
  var elapsed=0;

  function clamp(v,min,max){ return Math.min(max,Math.max(min,v)); }
  function lerp(a,b,t){ return a+(b-a)*t; }
  function smoothstep(a,b,x){
    var t=clamp((x-a)/(b-a),0,1);
    return t*t*(3-2*t);
  }

  function pageProgress(){
    var doc=document.documentElement;
    var total=Math.max(1,doc.scrollHeight-window.innerHeight);
    return clamp((window.scrollY||0)/total,0,1);
  }

  function sectionProgress(section){
    var rect=section.getBoundingClientRect();
    var span=Math.max(1,rect.height+window.innerHeight);
    return clamp((window.innerHeight-rect.top)/span,0,1);
  }

  function getSection(id){
    return document.getElementById(id);
  }

  function activeSection(){
    var best=null;
    var bestDistance=Infinity;
    sections.forEach(function(section){
      var rect=section.getBoundingClientRect();
      var center=rect.top+rect.height*.45;
      var distance=Math.abs(center-window.innerHeight*.5);
      if(distance<bestDistance){
        bestDistance=distance;
        best=section;
      }
    });
    return best;
  }

  function updateDom(){
    var progress=pageProgress();

    if(videoReady&&duration>0){
      targetVideoTime=clamp(progress*duration,0,Math.max(0,duration-.04));
    }

    var now=performance.now();
    var y=window.scrollY||0;
    var dt=Math.max(16,now-lastT);
    velocity=clamp((y-lastY)/dt,-4,4);
    lastY=y;
    lastT=now;

    var active=activeSection();
    navLinks.forEach(function(link){
      link.classList.toggle("is-active",active&&link.getAttribute("data-section-link")===active.id);
    });

    /* Keep the existing HTML sky / destination content animation. */
    sections.forEach(function(section){
      var p=sectionProgress(section);
      Array.prototype.slice.call(section.querySelectorAll('[data-road-object="sky"],[data-road-object="destination"]')).forEach(function(el){
        var delay=parseFloat(el.getAttribute("data-delay")||"0");
        var t=clamp((p-delay)/(1-delay),0,1);
        var enter=smoothstep(.05,.42,t);
        var leave=smoothstep(.78,1,t);
        var opacity=enter*(1-leave*.88);
        var scale=.90+enter*.10+leave*.025;
        var yy=34-enter*34-leave*7;
        var prefix=(el.classList.contains("road-story-sky")||el.classList.contains("road-story-quote"))?"translateX(-50%) ":"";
        el.style.transform=prefix+"translateY("+yy.toFixed(1)+"px) scale("+scale.toFixed(3)+")";
        el.style.opacity=opacity.toFixed(3);
      });
    });
  }

  function markReady(){
    if(videoReady) return;
    videoReady=true;
    duration=isFinite(video.duration)?video.duration:0;
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
  if(video.readyState>=1){ markReady(); }else{ video.load(); }

  window.addEventListener("scroll",updateDom,{passive:true});
  window.addEventListener("resize",updateDom,{passive:true});
  updateDom();

  /* =======================================================
     THREE.JS WORLD
     ======================================================= */
  if(!window.THREE||!canvas){
    document.body.classList.add("no-webgl-road");
    photoCars.forEach(function(el){ el.style.opacity="0"; });
    return;
  }

  var renderer=new THREE.WebGLRenderer({
    canvas:canvas,
    alpha:true,
    antialias:true,
    powerPreference:"high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace=THREE.SRGBColorSpace;

  var scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x0a0b0d,.018);

  var camera=new THREE.PerspectiveCamera(50,1,.1,220);
  var baseCameraY=1.65;
  camera.position.set(0,baseCameraY,5.5);
  camera.lookAt(0,1.15,-24);

  scene.add(new THREE.AmbientLight(0xffffff,1.35));

  var keyLight=new THREE.DirectionalLight(0xffffff,1.8);
  keyLight.position.set(-4,8,6);
  scene.add(keyLight);

  var warmLight=new THREE.DirectionalLight(0xff8a50,.75);
  warmLight.position.set(8,4,-10);
  scene.add(warmLight);

  function makeCanvasTexture(options){
    var c=document.createElement("canvas");
    c.width=1024;
    c.height=512;
    var ctx=c.getContext("2d");

    var dark=options.theme!=="light";
    var bg=options.theme==="orange"?"#f25512":(dark?"#111317":"#f4f5f3");
    ctx.fillStyle=bg;
    ctx.fillRect(0,0,c.width,c.height);

    /* premium thin frame */
    ctx.strokeStyle=dark?"rgba(255,255,255,.16)":"rgba(17,18,20,.16)";
    ctx.lineWidth=3;
    ctx.strokeRect(26,26,c.width-52,c.height-52);

    ctx.fillStyle="#ff5a00";
    ctx.fillRect(56,54,92,6);

    ctx.fillStyle=dark?"rgba(255,255,255,.68)":"rgba(17,18,20,.62)";
    ctx.font="700 28px Arial";
    ctx.letterSpacing="2px";
    ctx.fillText((options.kicker||"CARCHOPE").toUpperCase(),56,104);

    ctx.fillStyle=dark?"#ffffff":"#111214";
    ctx.font="700 78px Arial";
    var title=options.title||"";
    var words=title.split(" ");
    var lines=[];
    var line="";
    words.forEach(function(word){
      var test=line?line+" "+word:word;
      if(ctx.measureText(test).width>820&&line){
        lines.push(line); line=word;
      }else{ line=test; }
    });
    if(line) lines.push(line);
    lines.slice(0,2).forEach(function(text,i){
      ctx.fillText(text,56,205+i*84);
    });

    ctx.fillStyle=dark?"rgba(255,255,255,.67)":"rgba(17,18,20,.60)";
    ctx.font="400 30px Arial";
    ctx.fillText(options.subtitle||"",56,395);

    ctx.fillStyle=dark?"#ffffff":"#111214";
    ctx.font="700 24px Arial";
    ctx.fillText((options.cta||"LEARN MORE →").toUpperCase(),56,454);

    var tex=new THREE.CanvasTexture(c);
    tex.colorSpace=THREE.SRGBColorSpace;
    tex.minFilter=THREE.LinearFilter;
    tex.magFilter=THREE.LinearFilter;
    return tex;
  }

  function makeBillboard(options){
    var group=new THREE.Group();
    var w=5.7,h=2.85;

    var frameMat=new THREE.MeshStandardMaterial({
      color:0x16191d,
      roughness:.55,
      metalness:.55
    });
    var frame=new THREE.Mesh(new THREE.BoxGeometry(w+.22,h+.22,.16),frameMat);
    group.add(frame);

    var planeMat=new THREE.MeshBasicMaterial({
      map:makeCanvasTexture(options),
      transparent:false
    });
    var face=new THREE.Mesh(new THREE.PlaneGeometry(w,h),planeMat);
    face.position.z=.09;
    group.add(face);

    var postMat=new THREE.MeshStandardMaterial({
      color:0x33383e,
      roughness:.5,
      metalness:.7
    });
    var post=new THREE.Mesh(new THREE.BoxGeometry(.16,4.3,.16),postMat);
    post.position.set(0,-3.55,-.03);
    group.add(post);

    group.visible=false;
    scene.add(group);
    return group;
  }

  function makeAnchor(){
    var anchor=new THREE.Object3D();
    scene.add(anchor);
    return anchor;
  }

  var journeyBoards=[
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

  var supportBoard=makeBillboard({
    theme:"dark",
    kicker:"Ownership Support",
    title:"Your Partner On Every Mile",
    subtitle:"Insurance · Financing · Rental · Consignment",
    cta:"Our Services →"
  });

  var cars=[
    {anchor:makeAnchor(),side:-1,delay:0},
    {anchor:makeAnchor(),side:1,delay:.30},
    {anchor:makeAnchor(),side:-1,delay:.60}
  ];

  function orientBillboard(group,side){
    group.lookAt(camera.position.x,group.position.y,camera.position.z);
    group.rotation.y+=side*.08;
  }

  function animateBoard(entry,p){
    var local=clamp((p-entry.delay)/.42,0,1);
    var g=entry.mesh;
    if(local<=.01||local>=.995){
      g.visible=false;
      return;
    }
    g.visible=true;

    var side=entry.side;
    if(local<.72){
      var q=smoothstep(.02,.72,local);
      g.position.x=lerp(side*4.2,side*7.0,q);
      g.position.y=lerp(2.05,2.45,q);
      g.position.z=lerp(-72,-11,q);
      g.scale.setScalar(lerp(.92,1.02,q));
    }else{
      var r=smoothstep(.72,1,local);
      g.position.x=lerp(side*7.0,side*11.4,r);
      g.position.y=lerp(2.45,2.65,r);
      g.position.z=lerp(-11,4.5,r);
      g.scale.setScalar(lerp(1.02,1.07,r));
    }
    orientBillboard(g,side);
  }

  function animateSupportBoard(p){
    var g=supportBoard;
    var local=clamp((p-.08)/.78,0,1);
    if(local<=.01||local>=.995){
      g.visible=false;
      return;
    }
    g.visible=true;
    var q=smoothstep(.02,.72,local);
    var r=smoothstep(.72,1,local);
    g.position.x=lerp(4.5,7.2,q)+r*4.2;
    g.position.y=lerp(2.1,2.5,q);
    g.position.z=local<.72?lerp(-65,-12,q):lerp(-12,4.2,r);
    g.scale.setScalar(1.03);
    orientBillboard(g,1);
  }

  function projectAnchorToPhoto(entry,index){
    var el=photoCars[index];
    if(!el) return;

    var anchor=entry.anchor;
    var projected=anchor.position.clone().project(camera);

    if(projected.z<-1||projected.z>1){
      el.style.opacity="0";
      return;
    }

    var x=(projected.x*.5+.5)*window.innerWidth;
    var y=(-projected.y*.5+.5)*window.innerHeight;
    var distance=camera.position.distanceTo(anchor.position);
    var scale=clamp(8.4/Math.max(2.2,distance),.16,1.65);

    var side=entry.side;
    var local=entry.local||0;
    var yaw=side*lerp(1.8,0,smoothstep(.48,1,local));
    var opacity=smoothstep(.015,.10,local)*(1-smoothstep(.97,1,local)*.7);

    el.style.transform=
      "translate3d("+x.toFixed(1)+"px,"+y.toFixed(1)+"px,0) "+
      "translate(-50%,-58%) scale("+scale.toFixed(3)+") rotate("+yaw.toFixed(2)+"deg)";
    el.style.opacity=opacity.toFixed(3);

    var speedBlur=local<.18?(1-smoothstep(.03,.18,local))*1.3:0;
    el.style.filter=
      "drop-shadow(0 "+Math.round(18*scale)+"px "+Math.round(28*scale)+"px rgba(0,0,0,.45)) "+
      "blur("+speedBlur.toFixed(2)+"px)";
  }

  function animateCar(entry,p,index){
    var local=clamp((p-entry.delay)/.38,0,1);
    var g=entry.anchor;
    var side=entry.side;
    entry.local=local;
    var el=photoCars[index];

    if(local<=.01){
      g.visible=false;
      if(el) el.style.opacity="0";
      if(carHud[index]) carHud[index].classList.remove("is-active");
      return;
    }

    g.visible=true;

    if(local<.30){
      var a=smoothstep(.01,.30,local);
      g.position.x=lerp(side*5.6,side*3.5,a);
      g.position.y=lerp(.72,.78,a);
      g.position.z=lerp(3.25,-3.2,a);
    }else if(local<.64){
      var b=smoothstep(.30,.64,local);
      g.position.x=lerp(side*3.5,side*1.2,b);
      g.position.y=lerp(.78,.72,b);
      g.position.z=lerp(-3.2,-12.8,b);
    }else{
      var c=smoothstep(.64,1,local);
      g.position.x=lerp(side*1.2,0,c);
      g.position.y=lerp(.72,.62,c);
      g.position.z=lerp(-12.8,-50,c);
    }

    projectAnchorToPhoto(entry,index);

    var hudActive=local>.70&&local<.94;
    if(carHud[index]) carHud[index].classList.toggle("is-active",hudActive);

    if(local>=.995){
      g.visible=false;
      if(el) el.style.opacity="0";
      if(carHud[index]) carHud[index].classList.remove("is-active");
    }
  }

  /* Edge speed streaks */
  var streakCount=52;
  var streakGeometry=new THREE.BufferGeometry();
  var streakPositions=new Float32Array(streakCount*6);
  var streaks=[];
  for(var i=0;i<streakCount;i++){
    var side=i%2===0?-1:1;
    streaks.push({
      x:side*(5+Math.random()*7),
      y:.3+Math.random()*4.8,
      z:-6-Math.random()*65,
      len:.8+Math.random()*2.5,
      speed:.7+Math.random()*1.4
    });
  }
  function writeStreaks(){
    var k=0;
    streaks.forEach(function(s){
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
  var streakMaterial=new THREE.LineBasicMaterial({
    color:0xffffff,
    transparent:true,
    opacity:0,
    blending:THREE.AdditiveBlending,
    depthWrite:false
  });
  var streakMesh=new THREE.LineSegments(streakGeometry,streakMaterial);
  scene.add(streakMesh);

  function resize(){
    var w=window.innerWidth,h=window.innerHeight;
    renderer.setSize(w,h,false);
    camera.aspect=w/Math.max(1,h);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize",resize,{passive:true});

  function updateWorld(dt){
    var journey=getSection("road-journey");
    var featured=getSection("road-featured");
    var support=getSection("road-support");

    var jp=journey?sectionProgress(journey):0;
    var fp=featured?sectionProgress(featured):0;
    var sp=support?sectionProgress(support):0;

    journeyBoards.forEach(function(entry){ animateBoard(entry,jp); });
    animateSupportBoard(sp);
    cars.forEach(function(entry,index){ animateCar(entry,fp,index); });

    /* camera body motion — tiny, premium, tied to actual scroll velocity */
    var speed=Math.min(1.6,Math.abs(smoothVelocity));
    camera.position.y=baseCameraY+Math.sin(elapsed*18)*speed*.008;
    camera.position.x=Math.sin(elapsed*4.5)*speed*.006;
    camera.lookAt(0,1.12,-24);

    /* streaks only appear while accelerating / scrolling */
    streakMaterial.opacity=Math.min(.20,Math.abs(smoothVelocity)*.07);
    streaks.forEach(function(s){
      s.z+=dt*(8+Math.abs(smoothVelocity)*20)*s.speed;
      if(s.z>4){
        s.z=-68-Math.random()*12;
        var side=Math.random()<.5?-1:1;
        s.x=side*(5+Math.random()*7);
        s.y=.3+Math.random()*4.8;
      }
    });
    var arr=streakGeometry.attributes.position.array;
    var k=0;
    streaks.forEach(function(s){
      arr[k++]=s.x; arr[k++]=s.y; arr[k++]=s.z;
      arr[k++]=s.x*1.015; arr[k++]=s.y; arr[k++]=s.z+s.len;
    });
    streakGeometry.attributes.position.needsUpdate=true;
  }

  var clock=new THREE.Clock();

  function render(){
    requestAnimationFrame(render);

    var dt=Math.min(clock.getDelta(),.035);
    elapsed+=dt;

    smoothVelocity+=(velocity-smoothVelocity)*.12;
    velocity*=.9;

    if(videoReady&&duration>0){
      var current=video.currentTime||0;
      var diff=targetVideoTime-current;
      if(Math.abs(diff)>.014){
        var step=diff*.24;
        if(Math.abs(diff)>.7) step=diff*.45;
        if(Math.abs(diff)>2) step=diff*.72;
        try{
          video.currentTime=clamp(current+step,0,Math.max(0,duration-.04));
        }catch(e){}
      }
    }

    var zoom=1.025+Math.min(.028,Math.abs(smoothVelocity)*.010);
    video.style.transform="scale("+zoom.toFixed(4)+")";

    if(speedValue){
      var kmh=48+Math.abs(smoothVelocity)*36+pageProgress()*16;
      speedValue.textContent=String(Math.round(clamp(kmh,48,165))).padStart(3,"0");
    }

    updateWorld(dt);
    renderer.render(scene,camera);
  }

  render();

  document.addEventListener("visibilitychange",function(){
    if(document.hidden) video.pause();
  });
})();
