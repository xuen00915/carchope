
/* Carchope scroll-controlled Mixkit driving video */
(function(){
  "use strict";

  var story=document.getElementById("road-story");
  var stage=document.getElementById("road-stage");
  var video=document.getElementById("road-scroll-video");
  var loading=document.getElementById("road-video-loading");
  var chapters=Array.prototype.slice.call(document.querySelectorAll("[data-road-chapter]"));
  var counter=document.getElementById("road-chapter-count");
  var currentLabel=document.getElementById("road-video-current");
  var durationLabel=document.getElementById("road-video-duration");
  var root=document.documentElement;
  var body=document.body;

  if(!story||!stage||!video) return;

  var targetProgress=0;
  var smoothProgress=0;
  var targetTime=0;
  var duration=0;
  var videoReady=false;
  var rafId=0;

  function clamp(value,min,max){
    return Math.min(max,Math.max(min,value));
  }

  function smoothstep(edge0,edge1,x){
    var t=clamp((x-edge0)/(edge1-edge0),0,1);
    return t*t*(3-2*t);
  }

  function formatTime(seconds){
    if(!isFinite(seconds)||seconds<0) seconds=0;
    var total=Math.floor(seconds);
    var min=Math.floor(total/60);
    var sec=total%60;
    return String(min).padStart(2,"0")+":"+String(sec).padStart(2,"0");
  }

  function getProgress(){
    var rect=story.getBoundingClientRect();
    var total=Math.max(1,story.offsetHeight-window.innerHeight);
    return clamp((-rect.top)/total,0,1);
  }

  function chapterOpacity(index,p){
    if(index===0){
      if(p<=.17) return 1;
      return 1-smoothstep(.17,.30,p);
    }

    if(index===1){
      return smoothstep(.23,.35,p)*(1-smoothstep(.54,.66,p));
    }

    return smoothstep(.60,.72,p);
  }

  function updateContent(p){
    chapters.forEach(function(chapter,index){
      var opacity=chapterOpacity(index,p);
      var y=(1-opacity)*34;

      chapter.style.setProperty("--chapter-opacity",opacity.toFixed(3));
      chapter.style.setProperty("--chapter-y",y.toFixed(1)+"px");
      chapter.classList.toggle("is-visible",opacity>.025);
      chapter.setAttribute("aria-hidden",opacity>.025?"false":"true");
    });

    var active=p<.29?1:(p<.65?2:3);
    if(counter){
      counter.textContent=("0"+active).slice(-2)+" / 03";
    }

    root.style.setProperty("--road-progress",p.toFixed(4));

    var rect=story.getBoundingClientRect();
    var heroDone=rect.bottom<=window.innerHeight*.22;
    body.classList.toggle("road-header-solid",heroDone);
  }

  function setTargetFromScroll(){
    targetProgress=getProgress();
    updateContent(targetProgress);

    if(videoReady&&duration>0){
      /*
        Scroll position maps directly to video time:
        top of story = first frame
        bottom of story = final frame
        Scrolling upward naturally reverses the video.
      */
      targetTime=clamp(targetProgress*duration,0,Math.max(0,duration-.035));
    }
  }

  function setStoryLength(){
    /*
      Give longer clips more scrolling distance so frame movement stays smooth,
      but cap the hero so it never becomes excessively long.
    */
    if(duration>0){
      var vh=clamp(duration*25,360,560);
      story.style.height=vh.toFixed(0)+"svh";
    }
  }

  function markReady(){
    if(videoReady) return;
    videoReady=true;
    duration=isFinite(video.duration)?video.duration:0;

    /*
      The video must never autoplay. The page's scroll position is the only
      playback controller.
    */
    video.pause();

    if(duration>0){
      durationLabel.textContent=formatTime(duration);
      setStoryLength();
      targetTime=getProgress()*duration;

      try{
        video.currentTime=clamp(targetTime,0,Math.max(0,duration-.035));
      }catch(e){}
    }

    if(loading) loading.classList.add("is-hidden");
    setTargetFromScroll();
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

  window.addEventListener("scroll",setTargetFromScroll,{passive:true});
  window.addEventListener("resize",setTargetFromScroll,{passive:true});

  setTargetFromScroll();

  function render(){
    rafId=requestAnimationFrame(render);

    smoothProgress+=(targetProgress-smoothProgress)*.11;

    if(!videoReady||!duration) return;

    /*
      Smoothly chase the desired frame. It feels like playback while scrolling,
      but freezes naturally when the user stops because targetTime stops moving.
    */
    var now=video.currentTime||0;
    var diff=targetTime-now;

    if(Math.abs(diff)>.018){
      var step=diff*.20;

      /*
        Large scroll jumps can otherwise take too long to catch up.
      */
      if(Math.abs(diff)>.70) step=diff*.42;
      if(Math.abs(diff)>2.2) step=diff*.72;

      var next=clamp(now+step,0,Math.max(0,duration-.035));

      try{
        video.currentTime=next;
      }catch(e){}
    }

    if(currentLabel){
      currentLabel.textContent=formatTime(video.currentTime||0);
    }
  }

  render();

  document.addEventListener("visibilitychange",function(){
    if(document.hidden){
      video.pause();
    }
  });
})();
