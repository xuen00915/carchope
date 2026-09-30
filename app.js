(function(){


  /* Header blends into hero at top and becomes glass after scroll */
  var siteHeader=document.querySelector('.site-header');
  if(siteHeader){
    function syncHeaderGlass(){
      siteHeader.classList.toggle('is-scrolled',(window.scrollY||window.pageYOffset||0)>24);
    }
    window.addEventListener('scroll',syncHeaderGlass,{passive:true});
    window.addEventListener('load',syncHeaderGlass,{once:true});
    syncHeaderGlass();
  }



  /* Automatic dark-section header contrast */
  if(siteHeader){
    var darkHeaderSelector=[
      '.page-hero.dark',
      '.inventory-hero',
      '.page-hero:not(.inventory-hero):not(.dark)',
      '.manifesto',
      '.manifesto-video-section',
      '.partner-band',
      '.site-footer',
      '.quote-panel.dark',
      '.feature-car',
      '.product-featured-card',
      '.inventory-photo',
      '[data-header-theme="dark"]'
    ].join(',');

    function getUnderlyingElement(x,y){
      if(document.elementsFromPoint){
        var stack=document.elementsFromPoint(x,y);
        for(var i=0;i<stack.length;i++){
          var candidate=stack[i];
          if(
            candidate!==siteHeader &&
            !siteHeader.contains(candidate) &&
            !(candidate.closest&&candidate.closest('.global-wheel-scroll')) &&
            !(candidate.closest&&candidate.closest('.floating-actions'))
          ){
            return candidate;
          }
        }
      }

      var previousPointerEvents=siteHeader.style.pointerEvents;
      siteHeader.style.pointerEvents='none';
      var fallback=document.elementFromPoint(x,y);
      siteHeader.style.pointerEvents=previousPointerEvents;
      return fallback;
    }

    function syncHeaderContrast(){
      var headerRect=siteHeader.getBoundingClientRect();
      var sampleY=Math.min(
        window.innerHeight-1,
        Math.max(1,headerRect.top+(headerRect.height*.56))
      );
      var sampleXs=[
        Math.round(window.innerWidth*.56),
        Math.round(window.innerWidth*.70),
        Math.round(window.innerWidth*.82)
      ];

      var darkVotes=0;

      sampleXs.forEach(function(x){
        var safeX=Math.min(window.innerWidth-2,Math.max(1,x));
        var el=getUnderlyingElement(safeX,sampleY);

        if(el&&el.closest&&el.closest(darkHeaderSelector)){
          darkVotes++;
        }
      });

      siteHeader.classList.toggle('on-dark',darkVotes>=2);
    }

    window.addEventListener('scroll',syncHeaderContrast,{passive:true});
    window.addEventListener('resize',syncHeaderContrast,{passive:true});
    window.addEventListener('load',syncHeaderContrast,{once:true});
    syncHeaderContrast();
  }

  var menu=document.getElementById('menu-toggle');
  var panel=document.getElementById('mobile-panel');

  if(menu&&panel){
    menu.addEventListener('click',function(){
      var open=panel.classList.toggle('open');
      document.body.classList.toggle('menu-open',open);
      menu.setAttribute('aria-expanded',open?'true':'false');
    });
    panel.querySelectorAll('a').forEach(function(link){
      link.addEventListener('click',function(){
        panel.classList.remove('open');
        document.body.classList.remove('menu-open');
        menu.setAttribute('aria-expanded','false');
      });
    });
  }

  var autoplayVideo=document.querySelector('[data-autoplay-video]');
  if(autoplayVideo){
    autoplayVideo.muted=true;
    var videoSection=autoplayVideo.closest('.manifesto-video-section');

    function tryPlayVideo(){
      var playPromise=autoplayVideo.play();
      if(playPromise&&typeof playPromise.catch==='function'){
        playPromise.catch(function(){
          if(videoSection) videoSection.classList.add('video-fallback');
        });
      }
    }

    autoplayVideo.addEventListener('loadeddata',function(){
      if(videoSection) videoSection.classList.remove('video-fallback');
      tryPlayVideo();
    });

    autoplayVideo.addEventListener('canplay',tryPlayVideo);

    autoplayVideo.addEventListener('error',function(){
      if(videoSection) videoSection.classList.add('video-fallback');
    });

    document.addEventListener('visibilitychange',function(){
      if(!document.hidden) tryPlayVideo();
    });

    tryPlayVideo();
  }

  var reveals=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    },{threshold:.12,rootMargin:'0px 0px -40px 0px'});
    reveals.forEach(function(el){io.observe(el);});
  }else{
    reveals.forEach(function(el){el.classList.add('in');});
  }

  var demoForm=document.querySelector('[data-demo-form]');
  if(demoForm){
    demoForm.addEventListener('submit',function(e){
      e.preventDefault();
      var email=demoForm.querySelector('input[type="email"]');
      var note=demoForm.querySelector('.form-note');
      if(email && !email.checkValidity()){
        if(note) note.textContent='Enter a valid email address.';
        email.focus();
        return;
      }
      if(note) note.textContent='Preview only — connect this form to Carchope’s live enquiry handling during implementation.';
    });
  }

  var brands=[
    {id:'aion',name:'AION',domain:'aionauto.com',logo:'https://commons.wikimedia.org/wiki/Special:Redirect/file/AION_Auto_UK_simple_logo.svg'},
    {id:'audi',name:'Audi',domain:'audi.com',logo:'https://cdn.simpleicons.org/audi'},
    {id:'bmw',name:'BMW',domain:'bmw.com',logo:'https://cdn.simpleicons.org/bmw'},
    {id:'byd',name:'BYD',domain:'byd.com',logo:'https://cdn.simpleicons.org/byd'},
    {id:'citroen',name:'Citroën',domain:'citroen.com',logo:'https://cdn.simpleicons.org/citroen'},
    {id:'denza',name:'DENZA',domain:'denza.com',logo:'https://www.google.com/s2/favicons?sz=128&domain_url=https://www.denza.com'},
    {id:'honda',name:'Honda',domain:'honda.com',logo:'https://cdn.simpleicons.org/honda'},
    {id:'hyundai',name:'Hyundai',domain:'hyundai.com',logo:'https://cdn.simpleicons.org/hyundai'},
    {id:'infiniti',name:'INFINITI',domain:'infiniti.com',logo:'https://cdn.simpleicons.org/infiniti'},
    {id:'kia',name:'Kia',domain:'kia.com',logo:'https://cdn.simpleicons.org/kia'},
    {id:'lexus',name:'Lexus',domain:'lexus.com',logo:'https://cdn.simpleicons.org/lexus'},
    {id:'lotus',name:'Lotus',domain:'lotuscars.com',logo:'https://cdn.simpleicons.org/lotus'},
    {id:'mazda',name:'Mazda',domain:'mazda.com',logo:'https://cdn.simpleicons.org/mazda'},
    {id:'mercedes',name:'Mercedes-Benz',domain:'mercedes-benz.com',logo:'https://cdn.simpleicons.org/mercedesbenz'},
    {id:'mg',name:'MG',domain:'mgmotor.com',logo:'https://cdn.simpleicons.org/mg'},
    {id:'mini',name:'MINI',domain:'mini.com',logo:'https://cdn.simpleicons.org/mini'},
    {id:'nissan',name:'Nissan',domain:'nissan.com',logo:'https://cdn.simpleicons.org/nissan'},
    {id:'peugeot',name:'Peugeot',domain:'peugeot.com',logo:'https://cdn.simpleicons.org/peugeot'},
    {id:'porsche',name:'Porsche',domain:'porsche.com',logo:'https://cdn.simpleicons.org/porsche'},
    {id:'seat',name:'SEAT',domain:'seat.com',logo:'https://cdn.simpleicons.org/seat'},
    {id:'skoda',name:'Škoda',domain:'skoda-auto.com',logo:'https://cdn.simpleicons.org/skoda'},
    {id:'subaru',name:'Subaru',domain:'subaru.com',logo:'https://cdn.simpleicons.org/subaru'},
    {id:'tesla',name:'Tesla',domain:'tesla.com',logo:'https://cdn.simpleicons.org/tesla'},
    {id:'toyota',name:'Toyota',domain:'toyota.com',logo:'https://cdn.simpleicons.org/toyota'},
    {id:'volkswagen',name:'Volkswagen',domain:'volkswagen.com',logo:'https://cdn.simpleicons.org/volkswagen'},
    {id:'volvo',name:'Volvo',domain:'volvocars.com',logo:'https://cdn.simpleicons.org/volvo'},
    {id:'xpeng',name:'XPENG',domain:'xpeng.com',logo:'https://commons.wikimedia.org/wiki/Special:Redirect/file/XPeng_logo.svg'}
  ];

  var brandById={};
  brands.forEach(function(b){brandById[b.id]=b;});

  function initials(name){
    return name.replace(/[^A-Za-z0-9]/g,'').slice(0,3).toUpperCase();
  }

  function makeLogoNode(brand,className){
    var wrap=document.createElement('span');
    wrap.className=className||'brand-option-logo';

    var img=document.createElement('img');
    img.alt=brand.name+' logo';
    img.loading='lazy';
    var step=0;

    img.addEventListener('error',function(){
      if(step===0){
        step=1;
        img.src='https://www.google.com/s2/favicons?sz=128&domain_url=https://'+brand.domain;
      }else{
        img.remove();
        wrap.classList.add('fallback');
        wrap.textContent=initials(brand.name);
      }
    });

    img.src=brand.logo;
    wrap.appendChild(img);
    return wrap;
  }

  var brandLogoPreview=null;

  function ensureBrandLogoPreview(){
    if(brandLogoPreview) return brandLogoPreview;

    brandLogoPreview=document.createElement('div');
    brandLogoPreview.className='brand-logo-hover-preview';
    brandLogoPreview.id='brand-logo-hover-preview';
    brandLogoPreview.setAttribute('aria-hidden','true');
    brandLogoPreview.innerHTML=
      '<span class="brand-logo-hover-preview-icon" aria-hidden="true">'+
        '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="5.5"></circle><path d="m15 15 5 5"></path><path d="M10.5 8v5M8 10.5h5"></path></svg>'+
      '</span>'+
      '<div class="brand-logo-hover-preview-image"></div>'+
      '<div class="brand-logo-hover-preview-name"></div>';

    document.body.appendChild(brandLogoPreview);
    return brandLogoPreview;
  }

  function positionBrandLogoPreview(e){
    var preview=ensureBrandLogoPreview();
    var rect=preview.getBoundingClientRect();
    var gap=18;
    var left=e.clientX+gap;
    var top=e.clientY-(rect.height*.35);

    if(left+rect.width>window.innerWidth-12){
      left=e.clientX-rect.width-gap;
    }
    if(top<12) top=12;
    if(top+rect.height>window.innerHeight-12){
      top=window.innerHeight-rect.height-12;
    }

    preview.style.left=Math.max(12,left)+'px';
    preview.style.top=Math.max(12,top)+'px';
  }

  function showBrandLogoPreview(brand,logoNode,e){
    if(!brand||!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

    var preview=ensureBrandLogoPreview();
    var imageWrap=preview.querySelector('.brand-logo-hover-preview-image');
    var name=preview.querySelector('.brand-logo-hover-preview-name');
    imageWrap.innerHTML='';
    name.textContent=brand.name;

    var source=logoNode&&logoNode.querySelector('img');
    var previewImg=document.createElement('img');
    previewImg.alt='';
    previewImg.src=(source&&(source.currentSrc||source.src))||brand.logo;

    var previewStep=0;
    previewImg.addEventListener('error',function(){
      if(previewStep===0){
        previewStep=1;
        previewImg.src='https://www.google.com/s2/favicons?sz=256&domain_url=https://'+brand.domain;
      }else{
        previewImg.remove();
        imageWrap.textContent=initials(brand.name);
        imageWrap.classList.add('fallback');
      }
    });

    imageWrap.classList.remove('fallback');
    imageWrap.appendChild(previewImg);
    preview.classList.add('is-visible');
    positionBrandLogoPreview(e);
  }

  function hideBrandLogoPreview(){
    if(brandLogoPreview) brandLogoPreview.classList.remove('is-visible');
  }

  var marqueeTrack=document.getElementById('brand-marquee-track');
  if(marqueeTrack){
    function makeMarqueeGroup(){
      var group=document.createElement('div');
      group.className='brand-marquee-group';
      brands.forEach(function(brand){
        var link=document.createElement('a');
        link.className='brand-marquee-item';
        link.href='products.html?brand='+encodeURIComponent(brand.id);
        link.setAttribute('aria-label','Browse '+brand.name+' cars');
        link.appendChild(makeLogoNode(brand,'brand-marquee-logo'));
        var label=document.createElement('span');
        label.className='brand-marquee-name';
        label.textContent=brand.name;
        link.appendChild(label);
        group.appendChild(link);
      });
      return group;
    }
    marqueeTrack.appendChild(makeMarqueeGroup());
    marqueeTrack.appendChild(makeMarqueeGroup());
  }



  document.querySelectorAll('[data-footer-newsletter]').forEach(function(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var input=form.querySelector('input[type="email"]');
      var note=form.parentElement.querySelector('.footer-newsletter-note');
      if(input && !input.checkValidity()){
        if(note) note.textContent='Enter a valid email address.';
        input.focus();
        return;
      }
      if(note) note.textContent='Preview only — newsletter signup will connect to Carchope’s mailing system during implementation.';
    });
  });


  var floatingActions=document.getElementById('floating-actions');
  var scrollTopBtn=document.getElementById('scroll-top-btn');

  /* Inject real SVG car-dashboard gauges */
  var dashboardGaugeLivePaths=[];

  function addDashboardGauge(button){
    if(!button||button.querySelector('.dashboard-gauge')) return;

    var ns='http://www.w3.org/2000/svg';
    var svg=document.createElementNS(ns,'svg');
    svg.setAttribute('class','dashboard-gauge');
    svg.setAttribute('viewBox','0 0 100 100');
    svg.setAttribute('aria-hidden','true');

    /*
      270deg automotive arc:
      lower-left -> left -> top -> right -> lower-right,
      leaving a clear gap at the bottom.
    */
    var pathData='M 18.18 81.82 A 45 45 0 1 1 81.82 81.82';

    var track=document.createElementNS(ns,'path');
    track.setAttribute('class','dashboard-gauge-track');
    track.setAttribute('d',pathData);
    track.setAttribute('pathLength','100');

    var live=document.createElementNS(ns,'path');
    live.setAttribute('class','dashboard-gauge-live');
    live.setAttribute('d',pathData);
    live.setAttribute('pathLength','100');
    live.style.strokeDasharray='0 100';

    /* White zero-speed marker at the lower-left start of the gauge. */
    var startPoint=document.createElementNS(ns,'circle');
    startPoint.setAttribute('class','dashboard-gauge-start');
    startPoint.setAttribute('cx','18.18');
    startPoint.setAttribute('cy','81.82');
    startPoint.setAttribute('r','2.7');

    /*
      Redline is a separate short path at the HIGH-SPEED end only.
      This prevents any red marker from appearing at the starting point.
    */
    var redline=document.createElementNS(ns,'path');
    redline.setAttribute('class','dashboard-gauge-redline');
    redline.setAttribute('d','M 93.37 61.86 A 45 45 0 0 1 81.82 81.82');

    svg.appendChild(track);
    svg.appendChild(live);
    svg.appendChild(redline);
    svg.appendChild(startPoint);

    button.insertBefore(svg,button.firstChild);
    dashboardGaugeLivePaths.push(live);
  }

  if(floatingActions){
    addDashboardGauge(floatingActions.querySelector('.floating-whatsapp'));
    addDashboardGauge(floatingActions.querySelector('.floating-top'));
  }


  function updateFloatingActions(){
    if(!floatingActions) return;
    var threshold=Math.max(window.innerHeight*0.8,520);
    var showTop=window.scrollY>threshold;
    floatingActions.classList.toggle('show-top',showTop);
    floatingActions.setAttribute('aria-hidden','false');
  }

  window.addEventListener('scroll',updateFloatingActions,{passive:true});
  window.addEventListener('resize',updateFloatingActions);
  updateFloatingActions();

  if(scrollTopBtn){
    scrollTopBtn.addEventListener('click',function(){
      window.scrollTo({top:0,behavior:'smooth'});
    });
  }

  /* Scroll-velocity speedometer animation for floating controls */
  if(floatingActions){
    var gaugeLastY=window.scrollY||window.pageYOffset||0;
    var gaugeLastTime=performance.now();
    var gaugeTarget=0;
    var gaugeShown=0;
    var gaugeRaf=0;

    function measureGaugeSpeed(){
      var now=performance.now();
      var y=window.scrollY||window.pageYOffset||0;
      var dt=Math.max(16,now-gaugeLastTime);
      var dy=Math.abs(y-gaugeLastY);

      /*
        Car-dashboard feel:
        - direction does not matter; speed is absolute
        - quick wheel/trackpad input climbs the gauge rapidly
        - very slow movement only lights a short section
      */
      var pxPerMs=dy/dt;
      var normalized=Math.min(1,pxPerMs/3.2);

      /* Slightly ease the input so medium scrolling is clearly visible. */
      gaugeTarget=Math.pow(normalized,.72);

      gaugeLastY=y;
      gaugeLastTime=now;
    }

    function animateGauge(){
      gaugeRaf=requestAnimationFrame(animateGauge);

      /* Fast throttle response, slower falloff like a real instrument. */
      var response=gaugeTarget>gaugeShown?.24:.060;
      gaugeShown+=(gaugeTarget-gaugeShown)*response;
      gaugeTarget*=.925;

      if(gaugeTarget<.002) gaugeTarget=0;
      if(gaugeShown<.002) gaugeShown=0;

      /* Full automotive sweep: lower-left -> across top -> lower-right. */
      var sweep=gaugeShown>0 ? 5+(gaugeShown*265) : 0;

      floatingActions.style.setProperty('--gauge-speed',gaugeShown.toFixed(4));
      floatingActions.style.setProperty('--gauge-sweep',Math.min(270,sweep).toFixed(2)+'deg');

      var gaugePercent=Math.max(0,Math.min(100,gaugeShown*100));
      dashboardGaugeLivePaths.forEach(function(path){
        path.style.strokeDasharray=gaugePercent.toFixed(1)+' 100';
      });

      floatingActions.classList.toggle('is-accelerating',gaugeShown>.06);
      floatingActions.classList.toggle('is-high-speed',gaugeShown>.78);
    }

    window.addEventListener('scroll',measureGaugeSpeed,{passive:true});
    window.addEventListener('resize',function(){
      gaugeLastY=window.scrollY||window.pageYOffset||0;
      gaugeLastTime=performance.now();
    },{passive:true});

    measureGaugeSpeed();
    animateGauge();
  }


  var cartStorageKey='carchopePreviewCart';

  function normalizeCart(items){
    var grouped={};
    (Array.isArray(items)?items:[]).forEach(function(item){
      if(!item||!item.name) return;
      var key=[item.name,item.brand||'',item.price==null?'':item.price].join('|');
      if(!grouped[key]){
        grouped[key]={
          name:item.name,
          brand:item.brand||'',
          price:item.price==null?null:Number(item.price),
          qty:0
        };
      }
      grouped[key].qty+=Math.max(1,Number(item.qty)||1);
    });
    return Object.keys(grouped).map(function(key){return grouped[key];});
  }

  function getPreviewCart(){
    try{
      return normalizeCart(JSON.parse(localStorage.getItem(cartStorageKey)||'[]'));
    }catch(e){
      return [];
    }
  }

  function savePreviewCart(items){
    var clean=normalizeCart(items);
    try{localStorage.setItem(cartStorageKey,JSON.stringify(clean));}catch(e){}
    updateCartCount();
  }

  function cartQuantity(items){
    return (items||[]).reduce(function(sum,item){return sum+(Number(item.qty)||1);},0);
  }

  function renderCartPopover(){
    var panel=document.getElementById('cart-popover');
    var list=document.getElementById('cart-popover-items');
    var empty=document.getElementById('cart-popover-empty');
    var clearBtn=document.getElementById('cart-clear-btn');
    if(!panel||!list||!empty) return;

    var items=getPreviewCart();
    list.innerHTML='';
    empty.style.display=items.length?'none':'block';
    if(clearBtn) clearBtn.disabled=!items.length;

    items.forEach(function(item,index){
      var row=document.createElement('div');
      row.className='cart-popover-item';

      var main=document.createElement('div');
      main.className='cart-item-main';

      var copy=document.createElement('div');
      copy.className='cart-item-copy';

      var name=document.createElement('span');
      name.className='cart-item-name';
      name.textContent=item.name;

      var price=document.createElement('strong');
      price.className='cart-item-price';
      price.textContent=item.price==null?'Enquire':('$'+Number(item.price).toLocaleString('en-SG'));

      copy.appendChild(name);
      copy.appendChild(price);

      var remove=document.createElement('button');
      remove.type='button';
      remove.className='cart-item-remove';
      remove.setAttribute('aria-label','Remove '+item.name+' from cart');
      remove.textContent='×';
      remove.addEventListener('click',function(){
        var next=getPreviewCart();
        next.splice(index,1);
        savePreviewCart(next);
      });

      main.appendChild(copy);
      main.appendChild(remove);

      var controls=document.createElement('div');
      controls.className='cart-item-controls';

      var minus=document.createElement('button');
      minus.type='button';
      minus.className='cart-qty-btn';
      minus.textContent='−';
      minus.disabled=item.qty<=1;
      minus.setAttribute('aria-label','Decrease quantity for '+item.name);
      minus.addEventListener('click',function(){
        var next=getPreviewCart();
        if(next[index]&&next[index].qty>1){
          next[index].qty-=1;
          savePreviewCart(next);
        }
      });

      var qty=document.createElement('span');
      qty.className='cart-qty-value';
      qty.textContent=String(item.qty);

      var plus=document.createElement('button');
      plus.type='button';
      plus.className='cart-qty-btn';
      plus.textContent='+';
      plus.setAttribute('aria-label','Increase quantity for '+item.name);
      plus.addEventListener('click',function(){
        var next=getPreviewCart();
        if(next[index]){
          next[index].qty+=1;
          savePreviewCart(next);
        }
      });

      controls.appendChild(minus);
      controls.appendChild(qty);
      controls.appendChild(plus);

      row.appendChild(main);
      row.appendChild(controls);
      list.appendChild(row);
    });
  }

  function updateCartCount(){
    var items=getPreviewCart();
    var total=cartQuantity(items);
    document.querySelectorAll('[data-cart-count]').forEach(function(el){
      el.textContent=String(total);
    });
    renderCartPopover();
  }

  function addPreviewCartItem(car){
    var items=getPreviewCart();
    var existing=items.find(function(item){
      return item.name===car.name && item.brand===car.brand && item.price===car.price;
    });

    if(existing) existing.qty+=1;
    else items.push({name:car.name,brand:car.brand,price:car.price,qty:1});

    savePreviewCart(items);
  }

  var cartToggle=document.getElementById('header-cart-toggle');
  var cartPopover=document.getElementById('cart-popover');
  var cartClearBtn=document.getElementById('cart-clear-btn');

  if(cartClearBtn){
    cartClearBtn.addEventListener('click',function(){
      savePreviewCart([]);
    });
  }

  if(cartToggle&&cartPopover){
    cartToggle.addEventListener('click',function(e){
      e.stopPropagation();
      var open=cartPopover.classList.toggle('open');
      cartToggle.setAttribute('aria-expanded',open?'true':'false');
      cartPopover.setAttribute('aria-hidden',open?'false':'true');
      if(open) renderCartPopover();
    });

    cartPopover.addEventListener('click',function(e){
      e.stopPropagation();
    });

    document.addEventListener('click',function(){
      cartPopover.classList.remove('open');
      cartToggle.setAttribute('aria-expanded','false');
      cartPopover.setAttribute('aria-hidden','true');
    });
  }

  updateCartCount();

  var grid=document.getElementById('inventory-grid');
  if(!grid) return;

  var cars=[
    {brand:'xpeng',name:'XPENG G6 Electric',type:'SUV',price:201705,reg:'27 Mar 2025',dep:'$21,010/yr',km:'7,000 km',year:2025,status:'Available',img:'assets/xpeng-g6-electric.png'},
    {brand:'volkswagen',name:'Volkswagen Golf SV 1.4A TSI Comfortline',type:'Hatchback',price:55988,reg:'13 Nov 2018',dep:'$13,910/yr',km:'50,000 km',year:2018,status:'Available',img:'assets/volkswagen-golf-sv.webp'},
    {brand:'toyota',name:'Toyota Sienta Hybrid 1.5A Elegance',type:'MPV',price:149105,reg:'04 Mar 2024',dep:'$16,220/yr',km:'25,000 km',year:2024,status:'Available',img:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Toyota_Sienta_TNGA_%28XP210%29_hybrid_in_Singapore_%2813_July_%2724%29.jpg?width=1400'},
    {brand:'tesla',name:'Tesla Model Y Electric RWD',type:'SUV',price:158885,reg:'27 Sep 2022',dep:'$19,250/yr',km:'75,000 km',year:2022,status:'Available',img:'https://images.unsplash.com/photo-1617704548623-340376564e68?auto=format&fit=crop&w=1400&q=88'},
    {brand:'skoda',name:'Škoda Kodiaq Mild Hybrid 1.5 TSI Selection 7-Seater',type:'SUV',price:199888,reg:'30 Jun 2025',dep:'$18,830/yr',km:'1,800 km',year:2025,status:'Available',img:'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1400&q=88'},
    {brand:'seat',name:'SEAT Alhambra Diesel 2.0A TDI DSG Style',type:'MPV',price:47888,reg:'20 Jul 2017',dep:'$16,410/yr',km:'110,000 km',year:2017,status:'Available',img:'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1400&q=88'},
    {brand:'porsche',name:'Porsche Taycan Electric',type:'Sports Car',price:395888,reg:'19 Jun 2023',dep:'$43,680/yr',km:'38,888 km',year:2023,status:'Available',img:'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1400&q=88'},
    {brand:'peugeot',name:'Peugeot e-2008 Electric GT',type:'SUV',price:118088,reg:'28 Jul 2023',dep:'$15,010/yr',km:'30,882 km',year:2023,status:'Available',img:'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1400&q=88'},
    {brand:'nissan',name:'Nissan Serena e-POWER Hybrid 1.4A Highway Star Premium',type:'MPV',price:207905,reg:'28 May 2025',dep:'$19,910/yr',km:'500 km',year:2025,status:'Available',img:'https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1400&q=88'},
    {brand:'mini',name:'MINI Cooper D 1.5A 5DR',type:'Hatchback',price:20888,reg:'21 Oct 2016',dep:'$14,410/yr',km:'123,000 km',year:2016,status:'Available',img:'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&w=1400&q=88'},
    {brand:'mg',name:'MG 4 Electric Trophy Sport LR',type:'Hatchback',price:171885,reg:'25 Sep 2025',dep:'$17,260/yr',km:'50 km',year:2025,status:'Available',img:'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1400&q=88'},
    {brand:'mercedes',name:'Mercedes-Benz C-Class C180 Mild Hybrid Avantgarde',type:'Luxury Sedan',price:208888,reg:'29 Sep 2023',dep:'$23,250/yr',km:'31,600 km',year:2023,status:'Available',img:'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1400&q=88'},
    {brand:'mazda',name:'Mazda CX-9 2.5A Turbo',type:'SUV',price:68888,reg:'31 Oct 2017',dep:'$24,490/yr',km:'11,000 km',year:2017,status:'Available',img:'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1400&q=88'},
    {brand:'lexus',name:'Lexus IS Turbo IS300 Executive',type:'Luxury Sedan',price:78888,reg:'26 Jul 2018',dep:'$20,070/yr',km:'148,000 km',year:2018,status:'Available',img:'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1400&q=88'},
    {brand:'kia',name:'Kia Sorento Diesel 2.2A SX Sunroof',type:'SUV',price:148888,reg:'23 Jul 2021',dep:'$22,460/yr',km:'77,784 km',year:2021,status:'Available',img:'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1400&q=88'},
    {brand:'infiniti',name:'Infiniti Q50 2.0A T Luxe',type:'Luxury Sedan',price:68889,reg:'23 Oct 2018',dep:'$17,030/yr',km:'132,600 km',year:2018,status:'Available',img:'https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1400&q=88'},
    {brand:'hyundai',name:'Hyundai Tucson 1.6A GLS T-GDi DCT Turbo',type:'SUV',price:63888,reg:'27 Feb 2019',dep:'$16,010/yr',km:'81,300 km',year:2019,status:'Available',img:'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1400&q=88'},
    {brand:'honda',name:'Honda Freed Hybrid 1.5A G 7-Seater',type:'MPV',price:70881,reg:'23 May 2019',dep:'$17,120/yr',km:'81,000 km',year:2019,status:'Available',img:'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1400&q=88'},
    {brand:'denza',name:'DENZA D9 Elite',type:'MPV',price:265305,reg:'25 Oct 2024',dep:'$27,010/yr',km:'5,888 km',year:2024,status:'Available',img:'https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1400&q=88'},
    {brand:'bmw',name:'BMW iX1 Electric eDrive20',type:'SUV',price:195905,reg:'20 Aug 2024',dep:'$20,910/yr',km:'15,500 km',year:2024,status:'Available',img:'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=88'},
    {brand:'audi',name:'Audi Q3 1.4A TFSI S-tronic',type:'SUV',price:116888,reg:'29 Dec 2020',dep:'$19,450/yr',km:'101,000 km',year:2020,status:'Available',img:'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1400&q=88'},
    {brand:'aion',name:'AION Y Plus Electric Premium',type:'SUV',price:153885,reg:'14 Feb 2025',dep:'$16,460/yr',km:'7,000 km',year:2025,status:'Available',img:'https://images.unsplash.com/photo-1592833159155-c62df1b65634?auto=format&fit=crop&w=1400&q=88'},
    {brand:'subaru',name:'Subaru Forester e-BOXER Mild Hybrid 2.0i-S EyeSight',type:'SUV',price:183105,reg:'14 Mar 2025',dep:'$18,300/yr',km:'7,100 km',year:2025,status:'Available',img:'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1400&q=88'},
    {brand:'byd',name:'BYD Sealion 7 Electric Premium',type:'SUV',price:215881,reg:'20 Feb 2025',dep:'—',km:'3,206 km',year:2025,status:'Out of stock',img:'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1400&q=88'},
    {brand:'volvo',name:'Volvo XC40 T5 R-Design',type:'SUV',price:null,reg:'10 Aug 2021',dep:'—',km:'3,000 km',year:2021,status:'Sold',img:'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1400&q=88'},
    {brand:'citroen',name:'Citroën C5 Aircross 1.6A PureTech EAT8 Shine',type:'SUV',price:null,reg:'31 Aug 2020',dep:'—',km:'54,000 km',year:2020,status:'Sold',img:'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1400&q=88'}
  ];

  var search=document.getElementById('car-search');
  var budgetRange=document.getElementById('car-budget-range');
  var budgetValue=document.getElementById('car-budget-value');
  var sort=document.getElementById('car-sort');
  var sortSelect=document.getElementById('sort-select');
  var sortTrigger=document.getElementById('sort-trigger');
  var sortCurrent=document.getElementById('sort-current');
  var sortMenu=document.getElementById('sort-menu');
  var count=document.getElementById('car-count');
  var rangeText=document.getElementById('car-range');
  var empty=document.getElementById('inventory-empty');
  var brandSelect=document.getElementById('brand-select');
  var brandTrigger=document.getElementById('brand-trigger');
  var brandCurrent=document.getElementById('brand-current');
  var brandMenu=document.getElementById('brand-menu');
  var typeSelect=document.getElementById('type-select');
  var typeTrigger=document.getElementById('type-trigger');
  var typeCurrent=document.getElementById('type-current');
  var typeMenu=document.getElementById('type-menu');
  var searchBtn=document.getElementById('car-search-btn');
  var pagination=document.getElementById('pagination');
  var mobileFilterToggle=document.getElementById('mobile-filter-toggle');
  var mobileFilterSummary=document.getElementById('mobile-filter-summary');
  var productFilterSection=document.querySelector('.product-filter-section');
  var currentPage=1;
  var pageSize=9;

  var selectedBrands=new Set();
  var selectedTypes=new Set();

  try{
    var urlParams=new URLSearchParams(window.location.search);
    var brandQuery=urlParams.get('brand')||'';
    brandQuery.split(',').filter(Boolean).forEach(function(id){
      if(brandById[id]) selectedBrands.add(id);
    });
  }catch(e){}

  var bodyTypes=Array.from(new Set(cars.map(function(c){return c.type;}))).sort();

  function makeCheck(){
    var check=document.createElement('span');
    check.className='multi-option-check';
    check.innerHTML='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.2 2.7 2.7 6.2-6.1"></path></svg>';
    return check;
  }

  function updateMobileFilterSummary(){
    if(!mobileFilterSummary) return;
    var parts=[];
    if(selectedBrands.size) parts.push(selectedBrands.size+' brand'+(selectedBrands.size>1?'s':''));
    if(selectedTypes.size) parts.push(selectedTypes.size+' type'+(selectedTypes.size>1?'s':''));
    if(budgetRange && Number(budgetRange.value)<Number(budgetRange.max)){
      parts.push('≤ $'+Number(budgetRange.value).toLocaleString('en-SG'));
    }
    mobileFilterSummary.textContent=parts.length?parts.join(' · '):'Brand, type, budget, sort';
  }

  function renderBrandCurrent(){
    if(!brandCurrent) return;
    brandCurrent.innerHTML='';

    if(selectedBrands.size===0){
      brandCurrent.textContent='Any brand';
      return;
    }

    if(selectedBrands.size===1){
      var id=Array.from(selectedBrands)[0];
      var brand=brandById[id];
      brandCurrent.appendChild(makeLogoNode(brand,'brand-current-logo-wrap'));
      var label=document.createElement('span');
      label.textContent=brand.name;
      brandCurrent.appendChild(label);
      return;
    }

    brandCurrent.textContent=selectedBrands.size+' brands selected';
  }

  function renderTypeCurrent(){
    if(!typeCurrent) return;
    if(selectedTypes.size===0) typeCurrent.textContent='Any type';
    else if(selectedTypes.size===1) typeCurrent.textContent=Array.from(selectedTypes)[0];
    else typeCurrent.textContent=selectedTypes.size+' types selected';
  }

  function syncBrandUrl(){
    if(!window.history||!window.history.replaceState) return;
    try{
      var url=new URL(window.location.href);
      if(selectedBrands.size===0) url.searchParams.delete('brand');
      else url.searchParams.set('brand',Array.from(selectedBrands).join(','));
      window.history.replaceState({},'',url.pathname+url.search+url.hash);
    }catch(e){}
  }

  function refreshBrandOptions(){
    if(!brandMenu) return;
    brandMenu.querySelectorAll('.brand-option').forEach(function(btn){
      var id=btn.dataset.brand;
      var active=id==='all'?selectedBrands.size===0:selectedBrands.has(id);
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-selected',active?'true':'false');
    });
  }

  function refreshTypeOptions(){
    if(!typeMenu) return;
    typeMenu.querySelectorAll('.type-option').forEach(function(btn){
      var value=btn.dataset.type;
      var active=value==='all'?selectedTypes.size===0:selectedTypes.has(value);
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-selected',active?'true':'false');
    });
  }

  function toggleBrand(id){
    if(id==='all'){
      selectedBrands.clear();
    }else if(selectedBrands.has(id)){
      selectedBrands.delete(id);
    }else{
      selectedBrands.add(id);
    }
    renderBrandCurrent();
    updateMobileFilterSummary();
    refreshBrandOptions();
    syncBrandUrl();
    currentPage=1;
    render();
  }

  function toggleType(value){
    if(value==='all'){
      selectedTypes.clear();
    }else if(selectedTypes.has(value)){
      selectedTypes.delete(value);
    }else{
      selectedTypes.add(value);
    }
    renderTypeCurrent();
    updateMobileFilterSummary();
    refreshTypeOptions();
    currentPage=1;
    render();
  }

  function makeBrandOption(brand){
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='brand-option multi-option';
    btn.dataset.brand=brand?brand.id:'all';
    btn.setAttribute('role','option');
    btn.appendChild(makeCheck());

    var logoNode=null;
    if(brand){
      logoNode=makeLogoNode(brand,'brand-option-logo');
      btn.appendChild(logoNode);

      btn.addEventListener('mouseenter',function(e){
        showBrandLogoPreview(brand,logoNode,e);
      });
      btn.addEventListener('mousemove',function(e){
        positionBrandLogoPreview(e);
      });
      btn.addEventListener('mouseleave',hideBrandLogoPreview);
    }

    var label=document.createElement('span');
    label.className='brand-option-name';
    label.textContent=brand?brand.name:'All brands';
    btn.appendChild(label);

    btn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      hideBrandLogoPreview();
      toggleBrand(btn.dataset.brand);
    });
    return btn;
  }

  function makeTypeOption(value){
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='type-option multi-option';
    btn.dataset.type=value||'all';
    btn.setAttribute('role','option');
    btn.appendChild(makeCheck());

    var label=document.createElement('span');
    label.className='type-option-name';
    label.textContent=value||'All body types';
    btn.appendChild(label);

    btn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      toggleType(btn.dataset.type);
    });
    return btn;
  }

  function renderSortCurrent(){
    if(!sort||!sortCurrent) return;
    var selected=sort.options[sort.selectedIndex];
    sortCurrent.textContent=selected?selected.textContent:'Sort cars';
  }

  function refreshSortOptions(){
    if(!sortMenu||!sort) return;
    sortMenu.querySelectorAll('.sort-option').forEach(function(btn){
      var active=btn.dataset.sort===sort.value;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-selected',active?'true':'false');
    });
  }

  function makeSortOption(option){
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='sort-option multi-option';
    btn.dataset.sort=option.value;
    btn.setAttribute('role','option');
    btn.appendChild(makeCheck());

    var label=document.createElement('span');
    label.className='sort-option-name';
    label.textContent=option.textContent;
    btn.appendChild(label);

    btn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();

      sort.value=btn.dataset.sort;
      renderSortCurrent();
      refreshSortOptions();
      setFilterOpen(sortSelect,sortTrigger,false);
      currentPage=1;
      render();
    });

    return btn;
  }

  if(brandMenu){
    brandMenu.innerHTML='';
    brandMenu.appendChild(makeBrandOption(null));
    brands.forEach(function(brand){brandMenu.appendChild(makeBrandOption(brand));});
  }

  if(typeMenu){
    typeMenu.innerHTML='';
    typeMenu.appendChild(makeTypeOption(null));
    bodyTypes.forEach(function(value){typeMenu.appendChild(makeTypeOption(value));});
  }

  if(sortMenu&&sort){
    sortMenu.innerHTML='';
    Array.from(sort.options).forEach(function(option){
      sortMenu.appendChild(makeSortOption(option));
    });
    renderSortCurrent();
    refreshSortOptions();
  }

  function setFilterOpen(wrapper,trigger,open){
    if(!wrapper||!trigger) return;
    wrapper.classList.toggle('open',open);
    trigger.setAttribute('aria-expanded',open?'true':'false');
  }

  if(brandTrigger&&brandSelect){
    brandTrigger.addEventListener('click',function(e){
      e.stopPropagation();
      var open=!brandSelect.classList.contains('open');
      setFilterOpen(typeSelect,typeTrigger,false);
      setFilterOpen(sortSelect,sortTrigger,false);
      setFilterOpen(brandSelect,brandTrigger,open);
    });
  }

  if(typeTrigger&&typeSelect){
    typeTrigger.addEventListener('click',function(e){
      e.stopPropagation();
      var open=!typeSelect.classList.contains('open');
      setFilterOpen(brandSelect,brandTrigger,false);
      setFilterOpen(sortSelect,sortTrigger,false);
      setFilterOpen(typeSelect,typeTrigger,open);
    });
  }

  if(sortTrigger&&sortSelect){
    sortTrigger.addEventListener('click',function(e){
      e.stopPropagation();
      var open=!sortSelect.classList.contains('open');
      setFilterOpen(brandSelect,brandTrigger,false);
      setFilterOpen(typeSelect,typeTrigger,false);
      setFilterOpen(sortSelect,sortTrigger,open);
    });
  }

  if(brandMenu) brandMenu.addEventListener('click',function(e){e.stopPropagation();});
  if(typeMenu) typeMenu.addEventListener('click',function(e){e.stopPropagation();});
  if(sortMenu) sortMenu.addEventListener('click',function(e){e.stopPropagation();});

  document.addEventListener('click',function(){
    hideBrandLogoPreview();
    setFilterOpen(brandSelect,brandTrigger,false);
    setFilterOpen(typeSelect,typeTrigger,false);
    setFilterOpen(sortSelect,sortTrigger,false);
  });

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      hideBrandLogoPreview();
      setFilterOpen(brandSelect,brandTrigger,false);
      setFilterOpen(typeSelect,typeTrigger,false);
      setFilterOpen(sortSelect,sortTrigger,false);
    }
  });

  function money(n){return n==null?'Sold':('$'+n.toLocaleString('en-SG'));}
  function brandName(id){return brandById[id]?brandById[id].name:id;}

  function updateBudgetLabel(){
    if(!budgetRange||!budgetValue) return;
    var max=Number(budgetRange.max);
    var value=Number(budgetRange.value);
    budgetValue.textContent=value>=max?'Any budget':'Up to $'+value.toLocaleString('en-SG');
    var progress=max?Math.max(0,Math.min(100,(value/max)*100)):100;
    budgetRange.style.setProperty('--budget-progress',progress+'%');
  }

  function statusRank(c,mode){
    var available=c.status==='Available';
    if(mode==='sold-first') return available?1:0;
    if(mode==='stock-first') return available?0:1;
    return 0;
  }

  function renderPagination(totalItems){
    if(!pagination) return;
    pagination.innerHTML='';

    var totalPages=Math.max(1,Math.ceil(totalItems/pageSize));
    if(currentPage>totalPages) currentPage=totalPages;

    if(totalItems<=pageSize){
      pagination.style.display='none';
      return;
    }

    pagination.style.display='flex';

    var prev=document.createElement('button');
    prev.type='button';
    prev.className='pagination-prev';
    prev.textContent='Previous';
    prev.disabled=currentPage===1;
    prev.addEventListener('click',function(){
      if(currentPage>1){
        currentPage--;
        render();
        scrollToInventory();
      }
    });
    pagination.appendChild(prev);

    for(var page=1;page<=totalPages;page++){
      var btn=document.createElement('button');
      btn.type='button';
      btn.textContent=String(page);
      btn.setAttribute('aria-label','Page '+page);
      if(page===currentPage){
        btn.className='active';
        btn.setAttribute('aria-current','page');
      }
      (function(pageNumber){
        btn.addEventListener('click',function(){
          currentPage=pageNumber;
          render();
          scrollToInventory();
        });
      })(page);
      pagination.appendChild(btn);
    }

    var next=document.createElement('button');
    next.type='button';
    next.className='pagination-next';
    next.textContent='Next';
    next.disabled=currentPage===totalPages;
    next.addEventListener('click',function(){
      if(currentPage<totalPages){
        currentPage++;
        render();
        scrollToInventory();
      }
    });
    pagination.appendChild(next);
  }

  function scrollToInventory(){
    var toolbar=document.querySelector('.inventory-toolbar');
    if(toolbar) toolbar.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function render(){
    var q=(search&&search.value||'').toLowerCase().trim();
    var maxBudget=budgetRange?Number(budgetRange.value):400000;
    var budgetMax=budgetRange?Number(budgetRange.max):400000;

    var data=cars.filter(function(c){
      var qok=!q||(c.name+' '+c.type+' '+brandName(c.brand)).toLowerCase().indexOf(q)>-1;
      var brandOk=selectedBrands.size===0||selectedBrands.has(c.brand);
      var tok=selectedTypes.size===0||selectedTypes.has(c.type);
      var bok=maxBudget>=budgetMax || (c.price!=null && c.price<=maxBudget);
      return qok&&brandOk&&tok&&bok;
    });

    if(sort){
      if(sort.value==='name-asc') data.sort(function(a,b){return a.name.localeCompare(b.name);});
      if(sort.value==='name-desc') data.sort(function(a,b){return b.name.localeCompare(a.name);});
      if(sort.value==='price-low') data.sort(function(a,b){return (a.price==null?Number.MAX_SAFE_INTEGER:a.price)-(b.price==null?Number.MAX_SAFE_INTEGER:b.price);});
      if(sort.value==='price-high') data.sort(function(a,b){return (b.price==null?-1:b.price)-(a.price==null?-1:a.price);});
      if(sort.value==='sold-first') data.sort(function(a,b){return statusRank(a,'sold-first')-statusRank(b,'sold-first');});
      if(sort.value==='stock-first') data.sort(function(a,b){return statusRank(a,'stock-first')-statusRank(b,'stock-first');});
    }

    var totalPages=Math.max(1,Math.ceil(data.length/pageSize));
    if(currentPage>totalPages) currentPage=totalPages;

    var start=(currentPage-1)*pageSize;
    var pageData=data.slice(start,start+pageSize);
    var end=Math.min(start+pageSize,data.length);

    grid.innerHTML='';

    pageData.forEach(function(c){
      var article=document.createElement('article');
      article.className='inventory-card reveal in';

      var statusLabel=c.status&&c.status!=='Available'?' · '+c.status:'';
      var canAdd=c.status==='Available'&&c.price!=null;

      article.innerHTML=
        '<div class="inventory-top"><span class="inventory-brand">'+brandName(c.brand)+'</span><b>'+c.type+statusLabel+'</b></div>'+
        '<div class="inventory-photo" data-zoom-photo><img src="'+c.img+'" alt="'+c.name+'" loading="lazy"></div>'+
        '<div class="inventory-copy"><h3>'+c.name+'</h3>'+
        '<div class="inventory-price-actions">'+
          '<div class="inventory-price">'+money(c.price)+'</div>'+
          '<div class="inventory-actions">'+
            '<a class="inventory-view-btn" href="https://www.carchope.com/products" target="_blank" rel="noopener">View</a>'+
            '<button class="inventory-cart-btn" type="button" data-add-cart aria-label="Add '+c.name+' to cart" '+(canAdd?'':'disabled')+'>'+
              '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H7"></path><circle cx="10" cy="20" r="1.4"></circle><circle cx="18" cy="20" r="1.4"></circle></svg><span class="cart-plus" aria-hidden="true">+</span>'+
            '</button>'+
          '</div>'+
        '</div>'+
        '<div class="inventory-specs"><div class="inventory-spec"><span>Registered</span><strong>'+c.reg+'</strong></div>'+
        '<div class="inventory-spec"><span>Mileage</span><strong>'+c.km+'</strong></div>'+
        '<div class="inventory-spec"><span>Depreciation</span><strong>'+c.dep+'</strong></div></div></div>';

      var photo=article.querySelector('[data-zoom-photo]');
      var photoImg=photo&&photo.querySelector('img');
      if(photo&&photoImg){
        photo.setAttribute('tabindex','0');
        photo.setAttribute('role','region');
        photo.setAttribute('aria-label','Magnify '+c.name+' image');

        var lens=document.createElement('span');
        lens.className='inventory-lens';
        lens.setAttribute('aria-hidden','true');
        photo.appendChild(lens);

        var zoomFactor=1.7;

        function syncLens(e){
          var rect=photo.getBoundingClientRect();
          var localX=Math.max(0,Math.min(rect.width,e.clientX-rect.left));
          var localY=Math.max(0,Math.min(rect.height,e.clientY-rect.top));
          var xPct=rect.width?localX/rect.width:0.5;
          var yPct=rect.height?localY/rect.height:0.5;

          photo.style.setProperty('--lens-x',localX.toFixed(2)+'px');
          photo.style.setProperty('--lens-y',localY.toFixed(2)+'px');

          lens.style.backgroundImage='url("'+photoImg.currentSrc.replace(/"/g,'%22')+'")';
          lens.style.backgroundSize=(rect.width*zoomFactor).toFixed(2)+'px '+(rect.height*zoomFactor).toFixed(2)+'px';

          var lensRect=lens.getBoundingClientRect();
          var lensW=lensRect.width||170;
          var lensH=lensRect.height||170;
          var bgW=rect.width*zoomFactor;
          var bgH=rect.height*zoomFactor;

          var bgX=(lensW/2)-(xPct*bgW);
          var bgY=(lensH/2)-(yPct*bgH);
          lens.style.backgroundPosition=bgX.toFixed(2)+'px '+bgY.toFixed(2)+'px';
        }

        photo.addEventListener('mouseenter',function(e){
          photo.classList.add('is-lens-active');
          syncLens(e);
        });

        photo.addEventListener('mousemove',syncLens);

        photo.addEventListener('mouseleave',function(){
          photo.classList.remove('is-lens-active');
        });

        photo.addEventListener('keydown',function(e){
          if(e.key==='Escape'){
            photo.classList.remove('is-lens-active');
            photo.blur();
          }
        });
      }

      var addBtn=article.querySelector('[data-add-cart]');
      if(addBtn&&canAdd){
        addBtn.addEventListener('click',function(){
          addPreviewCartItem(c);
          addBtn.classList.add('added');
          window.setTimeout(function(){addBtn.classList.remove('added');},650);
        });
      }

      grid.appendChild(article);
    });

    if(count) count.textContent=data.length;
    if(rangeText) rangeText.textContent=data.length?(start+1)+'–'+end:'0';
    if(empty) empty.style.display=data.length?'none':'block';
    renderPagination(data.length);
  }

  [search,sort].forEach(function(el){
    if(el) el.addEventListener('input',function(){
      if(el===sort){
        renderSortCurrent();
        refreshSortOptions();
      }
      currentPage=1;
      render();
    });
  });

  if(budgetRange){
    budgetRange.addEventListener('input',function(){
      updateBudgetLabel();
      updateMobileFilterSummary();
      currentPage=1;
      render();
    });
    updateBudgetLabel();
  }

  if(mobileFilterToggle&&productFilterSection){
    mobileFilterToggle.addEventListener('click',function(){
      var open=productFilterSection.classList.toggle('mobile-filters-open');
      mobileFilterToggle.setAttribute('aria-expanded',open?'true':'false');
    });
  }

  if(searchBtn){
    searchBtn.addEventListener('click',function(){
      currentPage=1;
      render();
      scrollToInventory();
    });
  }

  renderBrandCurrent();
  renderTypeCurrent();
  updateMobileFilterSummary();
  refreshBrandOptions();
  refreshTypeOptions();
  render();
})();

/* Global steering-wheel scroll indicator */
(function(){
  if(document.getElementById('global-wheel-scroll')) return;

  var indicator=document.createElement('div');
  indicator.className='global-wheel-scroll';
  indicator.id='global-wheel-scroll';
  indicator.setAttribute('aria-hidden','true');
  indicator.innerHTML=
    '<div class="global-wheel-track"></div>'+
    '<div class="global-wheel-thumb" id="global-wheel-thumb">'+
      '<span class="global-wheel-rim"></span>'+
      '<span class="global-wheel-spoke global-wheel-spoke-a"></span>'+
      '<span class="global-wheel-spoke global-wheel-spoke-b"></span>'+
      '<span class="global-wheel-spoke global-wheel-spoke-c"></span>'+
      '<span class="global-wheel-hub"></span>'+
    '</div>';

  document.body.appendChild(indicator);
  var thumb=document.getElementById('global-wheel-thumb');

  function clamp(v,min,max){return Math.min(max,Math.max(min,v));}

  function updateWheel(){
    var doc=document.documentElement;
    var body=document.body;
    var y=window.pageYOffset||doc.scrollTop||body.scrollTop||0;
    var fullHeight=Math.max(body.scrollHeight,body.offsetHeight,doc.clientHeight,doc.scrollHeight,doc.offsetHeight);
    var total=Math.max(1,fullHeight-window.innerHeight);
    var progress=clamp(y/total,0,1);
    var wheelSize=thumb.offsetHeight||46;
    var travel=Math.max(0,indicator.clientHeight-wheelSize);
    indicator.style.setProperty('--gws-progress',progress.toFixed(4));
    thumb.style.setProperty('--gws-y',(progress*travel).toFixed(2)+'px');
    thumb.style.setProperty('--gws-rotation',(progress*1080).toFixed(2)+'deg');
  }

  window.addEventListener('scroll',updateWheel,{passive:true});
  window.addEventListener('resize',updateWheel,{passive:true});
  window.addEventListener('load',updateWheel,{once:true});
  if('ResizeObserver' in window){
    var ro=new ResizeObserver(updateWheel);
    ro.observe(document.body);
  }
  updateWheel();
})();
