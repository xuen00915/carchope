
(function(){
  "use strict";

  var video=document.getElementById("roadside-video");
  var loading=document.getElementById("roadside-loading");
  var titles=Array.prototype.slice.call(document.querySelectorAll("[data-car-title]"));
  var panels=Array.prototype.slice.call(document.querySelectorAll("[data-center-panel]"));

  if(!video) return;

  var duration=12;
  var ready=false;
  var targetTime=0;
  var lastY=window.scrollY||0;
  var lastT=performance.now();
  var velocity=0;
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

  function pageProgress(){
    var doc=document.documentElement;
    var total=Math.max(1,doc.scrollHeight-window.innerHeight);
    return clamp((window.scrollY||0)/total,0,1);
  }

  /*
    One real car pass = one chapter.
    The title follows the car.
    The chapter content appears in the screen centre after the car has entered.
  */
  var carPasses=[
    {start:.25,end:1.85, x0:10,x1:74, y0:35,y1:39},
    {start:1.55,end:3.15, x0:88,x1:28, y0:54,y1:51},
    {start:2.90,end:4.45, x0:12,x1:78, y0:68,y1:65},
    {start:4.25,end:5.95, x0:86,x1:30, y0:30,y1:34},
    {start:5.70,end:7.55, x0:12,x1:80, y0:49,y1:47},
    {start:7.35,end:9.35, x0:88,x1:25, y0:64,y1:61},
    {start:9.05,end:11.45,x0:10,x1:82, y0:39,y1:42}
  ];

  function activeChapter(time){
    var best=-1;
    var bestScore=-Infinity;

    carPasses.forEach(function(pass,index){
      if(time>=pass.start&&time<=pass.end){
        var local=(time-pass.start)/(pass.end-pass.start);
        /*
          Prefer the car that has already entered sufficiently,
          which makes transitions cleaner where car windows overlap.
        */
        var score=local;
        if(score>bestScore){
          bestScore=score;
          best=index;
        }
      }
    });

    return best;
  }

  function updateScene(time){
    var currentChapter=activeChapter(time);

    titles.forEach(function(el,index){
      var pass=carPasses[index];

      if(!pass){
        el.style.setProperty("--car-alpha","0");
        return;
      }

      var raw=(time-pass.start)/(pass.end-pass.start);
      var local=clamp(raw,0,1);
      var active=raw>=0&&raw<=1;

      var fadeIn=smoothstep(0,.12,local);
      var fadeOut=1-smoothstep(.80,1,local);
      var alpha=active?Math.min(fadeIn,fadeOut):0;

      var x=lerp(pass.x0,pass.x1,local);
      var y=lerp(pass.y0,pass.y1,local);

      el.style.setProperty("--car-x",x.toFixed(2)+"%");
      el.style.setProperty("--car-y",y.toFixed(2)+"%");
      el.style.setProperty("--car-alpha",alpha.toFixed(3));
    });

    panels.forEach(function(panel,index){
      /*
        Content appears once the relevant car has entered the shot,
        and stays centred until the next car becomes the active chapter.
      */
      panel.classList.toggle("is-active",index===currentChapter);
    });
  }

  function updateTarget(){
    if(ready&&duration>0){
      targetTime=clamp(
        pageProgress()*duration,
        0,
        Math.max(0,duration-.04)
      );
    }

    var now=performance.now();
    var y=window.scrollY||0;
    var dt=Math.max(16,now-lastT);

    velocity=clamp((y-lastY)/dt,-3,3);
    lastY=y;
    lastT=now;
  }

  function markReady(){
    if(ready) return;

    ready=true;
    duration=isFinite(video.duration)&&video.duration>0
      ? video.duration
      : 12;

    video.pause();
    video.muted=true;
    video.playsInline=true;

    updateTarget();

    try{
      video.currentTime=pageProgress()*duration;
    }catch(e){}

    updateScene(video.currentTime||0);

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

  window.addEventListener("scroll",updateTarget,{passive:true});
  window.addEventListener("resize",updateTarget,{passive:true});

  updateTarget();

  function render(){
    requestAnimationFrame(render);

    smoothVelocity+=(velocity-smoothVelocity)*.10;
    velocity*=.90;

    if(ready&&duration>0){
      var current=video.currentTime||0;
      var diff=targetTime-current;

      if(Math.abs(diff)>.012){
        var step=diff*.20;

        if(Math.abs(diff)>.75) step=diff*.38;
        if(Math.abs(diff)>2) step=diff*.64;

        try{
          video.currentTime=clamp(
            current+step,
            0,
            Math.max(0,duration-.04)
          );
        }catch(e){}
      }

      updateScene(video.currentTime||targetTime);
    }

    var zoom=1.01+Math.min(
      .004,
      Math.abs(smoothVelocity)*.0015
    );
    video.style.transform="scale("+zoom.toFixed(4)+")";
  }

  render();

  document.addEventListener("visibilitychange",function(){
    if(document.hidden) video.pause();
  });
})();
