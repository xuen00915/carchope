(function(){
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

  function updateFloatingActions(){
    if(!floatingActions) return;
    var threshold=Math.max(window.innerHeight*0.8,520);
    var show=window.scrollY>threshold;
    floatingActions.classList.toggle('visible',show);
    floatingActions.setAttribute('aria-hidden',show?'false':'true');
  }

  window.addEventListener('scroll',updateFloatingActions,{passive:true});
  window.addEventListener('resize',updateFloatingActions);
  updateFloatingActions();

  if(scrollTopBtn){
    scrollTopBtn.addEventListener('click',function(){
      window.scrollTo({top:0,behavior:'smooth'});
    });
  }

  var cartStorageKey='carchopePreviewCart';

  function getPreviewCart(){
    try{
      var parsed=JSON.parse(localStorage.getItem(cartStorageKey)||'[]');
      return Array.isArray(parsed)?parsed:[];
    }catch(e){
      return [];
    }
  }

  function renderCartPopover(){
    var panel=document.getElementById('cart-popover');
    var list=document.getElementById('cart-popover-items');
    var empty=document.getElementById('cart-popover-empty');
    if(!panel||!list||!empty) return;

    var items=getPreviewCart();
    list.innerHTML='';
    empty.style.display=items.length?'none':'block';

    items.slice(-3).reverse().forEach(function(item){
      var row=document.createElement('div');
      row.className='cart-popover-item';
      var name=document.createElement('span');
      name.textContent=item.name;
      var price=document.createElement('strong');
      price.textContent=item.price==null?'Enquire':'  }

  updateCartCount();

  var grid=document.getElementById('inventory-grid');
  if(!grid) return;

  var cars=[
    {brand:'xpeng',name:'XPENG G6 Electric',type:'SUV',price:201705,reg:'27 Mar 2025',dep:'$21,010/yr',km:'7,000 km',year:2025,status:'Available',img:'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1600&q=88'},
    {brand:'volkswagen',name:'Volkswagen Golf SV 1.4A TSI Comfortline',type:'Hatchback',price:55988,reg:'13 Nov 2018',dep:'$13,910/yr',km:'50,000 km',year:2018,status:'Available',img:'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1400&q=88'},
    {brand:'toyota',name:'Toyota Sienta Hybrid 1.5A Elegance',type:'MPV',price:149105,reg:'04 Mar 2024',dep:'$16,220/yr',km:'25,000 km',year:2024,status:'Available',img:'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1400&q=88'},
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

    if(brand){
      btn.appendChild(makeLogoNode(brand,'brand-option-logo'));
    }

    var label=document.createElement('span');
    label.className='brand-option-name';
    label.textContent=brand?brand.name:'All brands';
    btn.appendChild(label);

    btn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
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
      setFilterOpen(brandSelect,brandTrigger,open);
    });
  }

  if(typeTrigger&&typeSelect){
    typeTrigger.addEventListener('click',function(e){
      e.stopPropagation();
      var open=!typeSelect.classList.contains('open');
      setFilterOpen(brandSelect,brandTrigger,false);
      setFilterOpen(typeSelect,typeTrigger,open);
    });
  }

  if(brandMenu) brandMenu.addEventListener('click',function(e){e.stopPropagation();});
  if(typeMenu) typeMenu.addEventListener('click',function(e){e.stopPropagation();});

  document.addEventListener('click',function(){
    setFilterOpen(brandSelect,brandTrigger,false);
    setFilterOpen(typeSelect,typeTrigger,false);
  });

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      setFilterOpen(brandSelect,brandTrigger,false);
      setFilterOpen(typeSelect,typeTrigger,false);
    }
  });

  renderBrandCurrent();
  renderTypeCurrent();
  refreshBrandOptions();
  refreshTypeOptions();

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
        photo.addEventListener('mouseenter',function(){
          photo.classList.add('is-zooming');
        });
        photo.addEventListener('mousemove',function(e){
          var rect=photo.getBoundingClientRect();
          var x=((e.clientX-rect.left)/rect.width)*100;
          var y=((e.clientY-rect.top)/rect.height)*100;
          photoImg.style.transformOrigin=x+'% '+y+'%';
        });
        photo.addEventListener('mouseleave',function(){
          photo.classList.remove('is-zooming');
          photoImg.style.transformOrigin='50% 50%';
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
      currentPage=1;
      render();
    });
  });

  if(budgetRange){
    budgetRange.addEventListener('input',function(){
      updateBudgetLabel();
      currentPage=1;
      render();
    });
    updateBudgetLabel();
  }

  if(searchBtn){
    searchBtn.addEventListener('click',function(){
      currentPage=1;
      render();
      scrollToInventory();
    });
  }

  selectBrand(selectedBrand);
})();+Number(item.price).toLocaleString('en-SG');
      row.appendChild(name);
      row.appendChild(price);
      list.appendChild(row);
    });

    if(items.length>3){
      var more=document.createElement('div');
      more.className='cart-popover-more';
      more.textContent='+'+(items.length-3)+' more item(s)';
      list.appendChild(more);
    }
  }

  function updateCartCount(){
    var total=getPreviewCart().length;
    document.querySelectorAll('[data-cart-count]').forEach(function(el){
      el.textContent=String(total);
    });
    renderCartPopover();
  }

  function addPreviewCartItem(car){
    var items=getPreviewCart();
    items.push({name:car.name,brand:car.brand,price:car.price});
    try{localStorage.setItem(cartStorageKey,JSON.stringify(items));}catch(e){}
    updateCartCount();
  }

  updateCartCount();

  var cartToggle=document.getElementById('header-cart-toggle');
  var cartPopover=document.getElementById('cart-popover');
  if(cartToggle&&cartPopover){
    cartToggle.addEventListener('click',function(e){
      e.stopPropagation();
      var open=cartPopover.classList.toggle('open');
      cartToggle.setAttribute('aria-expanded',open?'true':'false');
      cartPopover.setAttribute('aria-hidden',open?'false':'true');
      if(open) renderCartPopover();
    });

    cartPopover.addEventListener('click',function(e){e.stopPropagation();});

    document.addEventListener('click',function(){
      cartPopover.classList.remove('open');
      cartToggle.setAttribute('aria-expanded','false');
      cartPopover.setAttribute('aria-hidden','true');
    });
  }
  }

  updateCartCount();

  var grid=document.getElementById('inventory-grid');
  if(!grid) return;

  var cars=[
    {brand:'xpeng',name:'XPENG G6 Electric',type:'SUV',price:201705,reg:'27 Mar 2025',dep:'$21,010/yr',km:'7,000 km',year:2025,status:'Available',img:'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1600&q=88'},
    {brand:'volkswagen',name:'Volkswagen Golf SV 1.4A TSI Comfortline',type:'Hatchback',price:55988,reg:'13 Nov 2018',dep:'$13,910/yr',km:'50,000 km',year:2018,status:'Available',img:'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1400&q=88'},
    {brand:'toyota',name:'Toyota Sienta Hybrid 1.5A Elegance',type:'MPV',price:149105,reg:'04 Mar 2024',dep:'$16,220/yr',km:'25,000 km',year:2024,status:'Available',img:'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1400&q=88'},
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
  var type=document.getElementById('car-type');
  var budgetRange=document.getElementById('car-budget-range');
  var budgetValue=document.getElementById('car-budget-value');
  var sort=document.getElementById('car-sort');
  var count=document.getElementById('car-count');
  var rangeText=document.getElementById('car-range');
  var empty=document.getElementById('inventory-empty');
  var brandSelect=document.getElementById('brand-select');
  var brandTrigger=document.getElementById('brand-trigger');
  var brandCurrent=document.getElementById('brand-current');
  var brandMenu=document.getElementById('brand-menu');
  var searchBtn=document.getElementById('car-search-btn');
  var pagination=document.getElementById('pagination');
  var currentPage=1;
  var pageSize=9;

  var queryBrand='';
  try{ queryBrand=(new URLSearchParams(window.location.search)).get('brand')||''; }catch(e){}
  var selectedBrand=brandById[queryBrand]?queryBrand:'all';

  Array.from(new Set(cars.map(function(c){return c.type;}))).sort().forEach(function(t){
    var o=document.createElement('option');
    o.value=t;
    o.textContent=t;
    if(type) type.appendChild(o);
  });

  function renderBrandCurrent(){
    if(!brandCurrent) return;
    brandCurrent.innerHTML='';
    if(selectedBrand==='all'){
      var allMark=document.createElement('span');
      allMark.className='brand-current-mark';
      allMark.textContent='ALL';
      var allName=document.createElement('span');
      allName.textContent='Any brand';
      brandCurrent.appendChild(allMark);
      brandCurrent.appendChild(allName);
      return;
    }
    var brand=brandById[selectedBrand];
    var logo=makeLogoNode(brand,'brand-option-logo');
    var img=logo.querySelector('img');
    if(img) img.className='brand-current-logo';
    brandCurrent.appendChild(logo);
    var name=document.createElement('span');
    name.textContent=brand.name;
    brandCurrent.appendChild(name);
  }

  function syncBrandUrl(){
    if(!window.history||!window.history.replaceState) return;
    try{
      var url=new URL(window.location.href);
      if(selectedBrand==='all') url.searchParams.delete('brand');
      else url.searchParams.set('brand',selectedBrand);
      window.history.replaceState({},'',url.pathname+url.search+url.hash);
    }catch(e){}
  }

  function selectBrand(id){
    selectedBrand=id;
    renderBrandCurrent();
    if(brandMenu){
      brandMenu.querySelectorAll('.brand-option').forEach(function(btn){
        var active=btn.dataset.brand===selectedBrand;
        btn.classList.toggle('active',active);
        btn.setAttribute('aria-selected',active?'true':'false');
      });
    }
    if(brandSelect) brandSelect.classList.remove('open');
    if(brandTrigger) brandTrigger.setAttribute('aria-expanded','false');
    syncBrandUrl();
    currentPage=1;
    render();
  }

  function makeBrandOption(brand){
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='brand-option';
    btn.dataset.brand=brand?brand.id:'all';
    btn.setAttribute('role','option');

    if(brand){
      btn.appendChild(makeLogoNode(brand,'brand-option-logo'));
    }else{
      var mark=document.createElement('span');
      mark.className='brand-option-logo fallback';
      mark.textContent='ALL';
      btn.appendChild(mark);
    }

    var label=document.createElement('span');
    label.className='brand-option-name';
    label.textContent=brand?brand.name:'Any brand';
    btn.appendChild(label);

    btn.addEventListener('click',function(){selectBrand(btn.dataset.brand);});
    return btn;
  }

  if(brandMenu){
    brandMenu.appendChild(makeBrandOption(null));
    brands.forEach(function(brand){brandMenu.appendChild(makeBrandOption(brand));});
  }

  if(brandTrigger&&brandSelect){
    brandTrigger.addEventListener('click',function(){
      var open=brandSelect.classList.toggle('open');
      brandTrigger.setAttribute('aria-expanded',open?'true':'false');
    });
  }

  document.addEventListener('click',function(e){
    if(brandSelect&&!brandSelect.contains(e.target)){
      brandSelect.classList.remove('open');
      if(brandTrigger) brandTrigger.setAttribute('aria-expanded','false');
    }
  });

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&brandSelect){
      brandSelect.classList.remove('open');
      if(brandTrigger){
        brandTrigger.setAttribute('aria-expanded','false');
        brandTrigger.focus();
      }
    }
  });

  renderBrandCurrent();

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
      var brandOk=selectedBrand==='all'||c.brand===selectedBrand;
      var tok=!type||type.value==='all'||c.type===type.value;
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
            '<a class="inventory-view-btn" href="https://www.carchope.com/products" target="_blank" rel="noopener">View Car</a>'+
            '<button class="inventory-cart-btn" type="button" data-add-cart aria-label="Add '+c.name+' to cart" '+(canAdd?'':'disabled')+'>'+
              '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H7"></path><circle cx="10" cy="20" r="1.4"></circle><circle cx="18" cy="20" r="1.4"></circle></svg>'+
            '</button>'+
          '</div>'+
        '</div>'+
        '<div class="inventory-specs"><div class="inventory-spec"><span>Registered</span><strong>'+c.reg+'</strong></div>'+
        '<div class="inventory-spec"><span>Mileage</span><strong>'+c.km+'</strong></div>'+
        '<div class="inventory-spec"><span>Depreciation</span><strong>'+c.dep+'</strong></div></div></div>';

      var photo=article.querySelector('[data-zoom-photo]');
      var photoImg=photo&&photo.querySelector('img');
      if(photo&&photoImg){
        photo.addEventListener('mouseenter',function(){
          photo.classList.add('is-zooming');
        });
        photo.addEventListener('mousemove',function(e){
          var rect=photo.getBoundingClientRect();
          var x=((e.clientX-rect.left)/rect.width)*100;
          var y=((e.clientY-rect.top)/rect.height)*100;
          photoImg.style.transformOrigin=x+'% '+y+'%';
        });
        photo.addEventListener('mouseleave',function(){
          photo.classList.remove('is-zooming');
          photoImg.style.transformOrigin='50% 50%';
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

  [search,type,sort].forEach(function(el){
    if(el) el.addEventListener('input',function(){
      currentPage=1;
      render();
    });
  });

  if(budgetRange){
    budgetRange.addEventListener('input',function(){
      updateBudgetLabel();
      currentPage=1;
      render();
    });
    updateBudgetLabel();
  }

  if(searchBtn){
    searchBtn.addEventListener('click',function(){
      currentPage=1;
      render();
      scrollToInventory();
    });
  }

  selectBrand(selectedBrand);
})();