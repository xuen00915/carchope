
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
