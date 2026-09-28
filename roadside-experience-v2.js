
(function(){
  "use strict";

  var video=document.getElementById("roadside-video");
  var loading=document.getElementById("roadside-loading");
  var sections=Array.prototype.slice.call(document.querySelectorAll("[data-road-section]"));
  var navLinks=Array.prototype.slice.call(document.querySelectorAll("[data-section-link]"));
  var speedValue=document.getElementById("roadside-speed-value");

  if(!video||!sections.length) return;

  var duration=0;
  var ready=false;
  var targetTime=0;
  var lastY=window.scrollY||0;
  var lastT=performance.now();
  var velocity=0;
  var smoothVelocity=0;

  function clamp(v,min,max){
    return Math.min(max,Math.max(min,v));
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

  function applySectionObjects(section){
    var p=sectionProgress(section);
    var objects=Array.prototype.slice.call(section.querySelectorAll("[data-road-object]"));

    objects.forEach(function(el,index){
      var type=el.getAttribute("data-road-object");
      var delay=parseFloat(el.getAttribute("data-delay")||"0");
      var t=clamp((p-delay)/(1-delay),0,1);

      if(type==="board"){
        var side=el.getAttribute("data-side")==="right"?1:-1;
        var arrive=smoothstep(.08,.48,t);
        var pass=smoothstep(.70,1,t);

        /*
          Board appears around the windshield/side-window sightline,
          grows as the car approaches it, then exits beyond the side window.
        */
        var scale=.34+arrive*.72+pass*.10;
        var x=side*(110-arrive*92+pass*125);
        var y=34-arrive*30-pass*4;
        var rotateY=side*(16-arrive*13+pass*4);
        var blur=(1-arrive)*5+pass*1.5;
        var opacity=Math.min(arrive*1.4,1)*(1-pass*.85);

        el.style.transform=
          "translate3d("+x.toFixed(1)+"px,"+y.toFixed(1)+"px,0) "+
          "scale("+scale.toFixed(3)+") rotateY("+rotateY.toFixed(2)+"deg)";
        el.style.filter="blur("+blur.toFixed(2)+"px)";
        el.style.opacity=opacity.toFixed(3);
        return;
      }

      if(type==="car"){
        var side2=el.getAttribute("data-side")==="right"?1:-1;
        var arrive2=smoothstep(.08,.54,t);
        var pass2=smoothstep(.72,1,t);
        var scale2=.28+arrive2*.76+pass2*.08;
        var x2=side2*(105-arrive2*88+pass2*118);
        var y2=30-arrive2*28;
        var opacity2=Math.min(arrive2*1.5,1)*(1-pass2*.86);

        el.style.transform=
          "translate3d("+x2.toFixed(1)+"px,"+y2.toFixed(1)+"px,0) "+
          "scale("+scale2.toFixed(3)+") rotateY("+(side2*(12-arrive2*10)).toFixed(2)+"deg)";
        el.style.filter="blur("+((1-arrive2)*5).toFixed(2)+"px)";
        el.style.opacity=opacity2.toFixed(3);
        return;
      }

      if(type==="sky"){
        var enter=smoothstep(.05,.42,t);
        var leave=smoothstep(.76,1,t);
        var opacity3=enter*(1-leave*.9);
        var scale3=.88+enter*.12+leave*.04;
        var y3=38-enter*38-leave*8;

        el.style.transform=
          (el.classList.contains("road-story-sky")||el.classList.contains("road-story-quote")
            ? "translateX(-50%) "
            : "")+
          "translateY("+y3.toFixed(1)+"px) scale("+scale3.toFixed(3)+")";
        el.style.opacity=opacity3.toFixed(3);
        return;
      }

      if(type==="destination"){
        var enter4=smoothstep(.08,.52,t);
        el.style.transform="translateY("+(48-enter4*48).toFixed(1)+"px) scale("+(.88+enter4*.12).toFixed(3)+")";
        el.style.opacity=enter4.toFixed(3);
      }
    });
  }

  function update(){
    var progress=pageProgress();

    if(ready&&duration>0){
      targetTime=clamp(progress*duration,0,Math.max(0,duration-.04));
    }

    var now=performance.now();
    var y=window.scrollY||0;
    var dt=Math.max(16,now-lastT);
    velocity=clamp((y-lastY)/dt,-4,4);
    lastY=y;
    lastT=now;

    sections.forEach(applySectionObjects);

    var active=activeSection();
    navLinks.forEach(function(link){
      link.classList.toggle("is-active",active&&link.getAttribute("data-section-link")===active.id);
    });
  }

  function markReady(){
    if(ready) return;
    ready=true;
    duration=isFinite(video.duration)?video.duration:0;
    video.pause();
    video.muted=true;
    video.playsInline=true;
    update();

    if(duration>0){
      try{
        video.currentTime=pageProgress()*duration;
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

    smoothVelocity+=(velocity-smoothVelocity)*.13;
    velocity*=.9;

    if(ready&&duration>0){
      var current=video.currentTime||0;
      var diff=targetTime-current;

      if(Math.abs(diff)>.014){
        var step=diff*.24;
        if(Math.abs(diff)>.7) step=diff*.45;
        if(Math.abs(diff)>2) step=diff*.72;

        try{
          video.currentTime=clamp(current+step,0,Math.max(0,duration-.04));
        }catch(e){}
      }
    }

    var zoom=1.025+Math.min(.03,Math.abs(smoothVelocity)*.011);
    video.style.transform="scale("+zoom.toFixed(4)+")";

    if(speedValue){
      var kmh=48+Math.abs(smoothVelocity)*36+pageProgress()*16;
      speedValue.textContent=String(Math.round(clamp(kmh,48,165))).padStart(3,"0");
    }
  }

  render();

  document.addEventListener("visibilitychange",function(){
    if(document.hidden) video.pause();
  });
})();
