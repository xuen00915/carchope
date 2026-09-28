
(function(){
  "use strict";

  var root=document.documentElement;
  var experience=document.getElementById("roadside-experience");
  var stage=document.getElementById("roadside-stage");
  var video=document.getElementById("roadside-video");
  var loading=document.getElementById("roadside-loading");
  var scenes=Array.prototype.slice.call(document.querySelectorAll(".road-scene"));
  var progressBar=document.getElementById("roadside-progress-bar");
  var progressLabel=document.getElementById("roadside-progress-label");
  var speedValue=document.getElementById("roadside-speed-value");

  if(!experience||!stage||!video||!scenes.length) return;

  var duration=0;
  var videoReady=false;
  var targetVideoTime=0;
  var targetProgress=0;
  var smoothProgress=0;
  var lastY=window.scrollY||0;
  var lastT=performance.now();
  var scrollVelocity=0;
  var smoothVelocity=0;

  function clamp(v,min,max){
    return Math.min(max,Math.max(min,v));
  }

  function lerp(a,b,t){
    return a+(b-a)*t;
  }

  function smoothstep(a,b,x){
    var t=clamp((x-a)/(b-a),0,1);
    return t*t*(3-2*t);
  }

  function experienceProgress(){
    var rect=experience.getBoundingClientRect();
    var total=Math.max(1,experience.offsetHeight-window.innerHeight);
    return clamp((-rect.top)/total,0,1);
  }

  function localSceneProgress(scene,p){
    var start=parseFloat(scene.getAttribute("data-start")||"0");
    var end=parseFloat(scene.getAttribute("data-end")||"1");
    return clamp((p-start)/(end-start),0,1);
  }

  function sceneOpacity(t){
    var enter=smoothstep(0,.18,t);
    var leave=1-smoothstep(.78,1,t);
    return Math.min(enter,leave);
  }

  function setSceneBase(scene,opacity){
    scene.style.opacity=opacity.toFixed(4);
    scene.classList.toggle("is-active",opacity>.02);
  }

  function animateScene(scene,index,p){
    var t=localSceneProgress(scene,p);
    var opacity=sceneOpacity(t);
    setSceneBase(scene,opacity);

    /* 01 — sky title drifts gently forward */
    if(index===0){
      var hero=scene.querySelector(".sky-hero-copy");
      var kicker=scene.querySelector(".sky-kicker");
      if(hero){
        var scale=lerp(.86,1.03,smoothstep(0,.62,t));
        var y=lerp(54,-10,smoothstep(0,.70,t));
        hero.style.transform="translateY(calc(-48% + "+y.toFixed(1)+"px)) scale("+scale.toFixed(3)+")";
      }
      if(kicker){
        kicker.style.transform="translateY("+lerp(18,-7,t).toFixed(1)+"px)";
      }
      return;
    }

    /* roadside billboards — arrive from horizon / side and pass the viewer */
    if(index===1||index===2||index===3||index===8){
      var board=scene.querySelector(".billboard");
      if(board){
        var side=(scene.classList.contains("board-left"))?-1:1;
        var depth=lerp(.18,1.08,smoothstep(0,.68,t));
        var x=lerp(side*150,side*-18,smoothstep(0,.65,t));
        var rotate=lerp(side*14,side*-2,smoothstep(0,.70,t));
        var y=lerp(75,-12,smoothstep(0,.7,t));
        var pass=smoothstep(.76,1,t);
        depth+=pass*.2;
        x+=side*-90*pass;
        board.style.transform=
          "translate3d("+x.toFixed(1)+"px,"+y.toFixed(1)+"px,0) "+
          "scale("+depth.toFixed(3)+") "+
          "rotateY("+rotate.toFixed(2)+"deg)";
        board.style.filter="blur("+lerp(5,0,smoothstep(.04,.36,t)).toFixed(2)+"px)";
      }
      return;
    }

    /* brands cloud floats in sky */
    if(index===4){
      var brands=scene.querySelector(".brands-sky-card");
      if(brands){
        var s=lerp(.72,1.02,smoothstep(0,.58,t));
        var yy=lerp(38,-10,smoothstep(0,.65,t));
        brands.style.transform="translateY("+yy.toFixed(1)+"px) scale("+s.toFixed(3)+")";
        brands.style.filter="blur("+lerp(4,0,smoothstep(.02,.30,t)).toFixed(2)+"px)";
      }
      return;
    }

    /* manifesto floats in open sky */
    if(index===5){
      var manifesto=scene.querySelector(".manifesto-sky");
      if(manifesto){
        var ms=lerp(.78,1.02,smoothstep(0,.55,t));
        var my=lerp(46,-14,smoothstep(0,.68,t));
        manifesto.style.transform="translateY("+my.toFixed(1)+"px) scale("+ms.toFixed(3)+")";
        manifesto.style.filter="blur("+lerp(6,0,smoothstep(.03,.34,t)).toFixed(2)+"px)";
      }
      return;
    }

    /* featured car panel comes straight from the vanishing point */
    if(index===6){
      var car=scene.querySelector(".coming-car-card");
      if(car){
        var arrive=smoothstep(0,.70,t);
        var cs=lerp(.06,1.08,arrive);
        var cy=lerp(-18,0,arrive);
        var blur=lerp(14,0,smoothstep(.10,.62,t));
        car.style.transform="translateY("+cy.toFixed(1)+"vh) scale("+cs.toFixed(3)+")";
        car.style.filter="blur("+blur.toFixed(2)+"px)";
      }
      return;
    }

    /* passing feature cards emerge from horizon then move toward left/right shoulders */
    if(index===7){
      var left=scene.querySelector(".passing-car-left");
      var right=scene.querySelector(".passing-car-right");
      var arrive2=smoothstep(0,.72,t);
      var ps=lerp(.08,1.04,arrive2);
      var py=lerp(-16,0,arrive2);
      if(left){
        var lx=lerp(48,0,arrive2);
        left.style.transform="translate3d("+lx.toFixed(1)+"vw,"+py.toFixed(1)+"vh,0) scale("+ps.toFixed(3)+") rotateY("+lerp(-16,0,arrive2).toFixed(2)+"deg)";
        left.style.filter="blur("+lerp(10,0,arrive2).toFixed(2)+"px)";
      }
      if(right){
        var rx=lerp(-48,0,arrive2);
        right.style.transform="translate3d("+rx.toFixed(1)+"vw,"+py.toFixed(1)+"vh,0) scale("+ps.toFixed(3)+") rotateY("+lerp(16,0,arrive2).toFixed(2)+"deg)";
        right.style.filter="blur("+lerp(10,0,arrive2).toFixed(2)+"px)";
      }
      return;
    }

    /* final sign arrives as destination */
    if(index===9){
      var sign=scene.querySelector(".destination-sign");
      if(sign){
        var ds=lerp(.22,1,smoothstep(0,.68,t));
        var dy=lerp(70,0,smoothstep(0,.68,t));
        sign.style.transform="translateY("+dy.toFixed(1)+"px) scale("+ds.toFixed(3)+")";
        sign.style.filter="blur("+lerp(8,0,smoothstep(.05,.48,t)).toFixed(2)+"px)";
      }
    }
  }

  function update(){
    targetProgress=experienceProgress();

    var now=performance.now();
    var currentY=window.scrollY||0;
    var dt=Math.max(16,now-lastT);
    var velocity=(currentY-lastY)/dt;
    scrollVelocity=clamp(velocity,-4,4);
    lastY=currentY;
    lastT=now;

    if(videoReady&&duration>0){
      targetVideoTime=clamp(targetProgress*duration,0,Math.max(0,duration-.035));
    }

    root.style.setProperty("--road-progress",targetProgress.toFixed(4));

    var activeIndex=0;
    scenes.forEach(function(scene,index){
      animateScene(scene,index,targetProgress);
      var start=parseFloat(scene.getAttribute("data-start")||"0");
      var end=parseFloat(scene.getAttribute("data-end")||"1");
      if(targetProgress>=start&&targetProgress<=end){
        activeIndex=index;
      }
    });

    if(progressLabel){
      progressLabel.textContent=String(activeIndex+1).padStart(2,"0")+" / "+String(scenes.length).padStart(2,"0");
    }
  }

  function markReady(){
    if(videoReady) return;
    videoReady=true;
    duration=isFinite(video.duration)?video.duration:0;
    video.pause();
    video.muted=true;
    video.playsInline=true;

    update();

    if(duration>0){
      try{
        video.currentTime=targetProgress*duration;
      }catch(e){}
    }

    if(loading) loading.classList.add("is-hidden");
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

  window.addEventListener("scroll",update,{passive:true});
  window.addEventListener("resize",update,{passive:true});

  update();

  function render(){
    requestAnimationFrame(render);

    smoothProgress+=(targetProgress-smoothProgress)*.08;
    smoothVelocity+=(scrollVelocity-smoothVelocity)*.12;
    scrollVelocity*=.90;

    if(videoReady&&duration>0){
      var current=video.currentTime||0;
      var diff=targetVideoTime-current;

      if(Math.abs(diff)>.014){
        var step=diff*.22;
        if(Math.abs(diff)>.65) step=diff*.42;
        if(Math.abs(diff)>2) step=diff*.72;

        try{
          video.currentTime=clamp(current+step,0,Math.max(0,duration-.035));
        }catch(e){}
      }
    }

    if(speedValue){
      var kmh=48+Math.abs(smoothVelocity)*34+smoothProgress*18;
      speedValue.textContent=String(Math.round(clamp(kmh,48,168))).padStart(3,"0");
    }

    if(progressBar){
      progressBar.style.transform="scaleY("+smoothProgress.toFixed(4)+")";
    }

    /* tiny forward-motion zoom tied to scroll speed */
    var zoom=1.025+Math.min(.035,Math.abs(smoothVelocity)*.012);
    video.style.transform="scale("+zoom.toFixed(4)+")";
  }

  render();

  document.addEventListener("visibilitychange",function(){
    if(document.hidden) video.pause();
  });
})();
