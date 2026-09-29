
(function(){
  "use strict";

  var video=document.getElementById("roadside-video");
  var loading=document.getElementById("roadside-loading");
  var sections=Array.prototype.slice.call(document.querySelectorAll("[data-road-section]"));
  var callouts=Array.prototype.slice.call(document.querySelectorAll("[data-car-callout]"));

  if(!video||!sections.length) return;

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

  function sectionProgress(section){
    var rect=section.getBoundingClientRect();
    var span=Math.max(1,rect.height+window.innerHeight);
    return clamp((window.innerHeight-rect.top)/span,0,1);
  }

  /*
    The source clip is a static high-angle road shot (12 s).
    Each content item is timed to one car pass and follows a lane trajectory.
    x/y values are viewport percentages, so the content stays aligned to the
    real moving cars rather than adding separate car graphics.
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

  function updateCarCallouts(time){
    callouts.forEach(function(el,index){
      var pass=carPasses[index];

      if(!pass){
        el.style.setProperty("--car-alpha","0");
        el.classList.remove("is-active");
        return;
      }

      var raw=(time-pass.start)/(pass.end-pass.start);
      var local=clamp(raw,0,1);
      var active=raw>=0&&raw<=1;

      var fadeIn=smoothstep(0,.14,local);
      var fadeOut=1-smoothstep(.78,1,local);
      var alpha=active?Math.min(fadeIn,fadeOut):0;

      var x=lerp(pass.x0,pass.x1,local);
      var y=lerp(pass.y0,pass.y1,local);

      /*
        Slight perspective reduction as the car gets farther across the shot.
        Keep it subtle: the car itself in the footage does all the visual work.
      */
      var scale=lerp(1,.92,local);

      el.style.setProperty("--car-x",x.toFixed(2)+"%");
      el.style.setProperty("--car-y",y.toFixed(2)+"%");
      el.style.setProperty("--car-alpha",alpha.toFixed(3));
      el.style.setProperty("--car-scale",scale.toFixed(3));
      el.classList.toggle("is-active",alpha>.30);
    });
  }

  function updateDom(){
    var progress=pageProgress();

    if(ready&&duration>0){
      targetTime=clamp(progress*duration,0,Math.max(0,duration-.04));
    }

    var now=performance.now();
    var y=window.scrollY||0;
    var dt=Math.max(16,now-lastT);

    velocity=clamp((y-lastY)/dt,-3,3);
    lastY=y;
    lastT=now;

    sections.forEach(function(section){
      var p=sectionProgress(section);

      section.querySelectorAll('[data-road-object="sky"],[data-road-object="destination"]').forEach(function(el){
        var delay=parseFloat(el.getAttribute("data-delay")||"0");
        var t=clamp((p-delay)/(1-delay),0,1);
        var enter=smoothstep(.08,.34,t);
        var leave=smoothstep(.82,1,t);
        var opacity=enter*(1-leave*.82);
        var yOffset=10-enter*10;

        var prefix=
          (el.classList.contains("road-story-sky")||el.classList.contains("road-story-quote"))
            ?"translateX(-50%) ":"";

        el.style.transform=prefix+"translateY("+yOffset.toFixed(1)+"px)";
        el.style.opacity=opacity.toFixed(3);
      });
    });
  }

  function markReady(){
    if(ready) return;

    ready=true;
    duration=isFinite(video.duration)&&video.duration>0?video.duration:12;

    video.pause();
    video.muted=true;
    video.playsInline=true;

    updateDom();

    try{
      video.currentTime=pageProgress()*duration;
    }catch(e){}

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

  window.addEventListener("scroll",updateDom,{passive:true});
  window.addEventListener("resize",updateDom,{passive:true});

  updateDom();

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

      updateCarCallouts(video.currentTime||targetTime);
    }

    var zoom=1.01+Math.min(.005,Math.abs(smoothVelocity)*.0018);
    video.style.transform="scale("+zoom.toFixed(4)+")";
  }

  render();

  document.addEventListener("visibilitychange",function(){
    if(document.hidden) video.pause();
  });
})();
