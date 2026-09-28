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

  var grid=document.getElementById('inventory-grid');
  if(!grid) return;

  var brands=[
    {id:'aion',name:'AION',domain:'aionauto.com'},
    {id:'audi',name:'Audi',domain:'audi.com'},
    {id:'bmw',name:'BMW',domain:'bmw.com'},
    {id:'byd',name:'BYD',domain:'byd.com'},
    {id:'citroen',name:'Citroën',domain:'citroen.com'},
    {id:'denza',name:'DENZA',domain:'denza.com'},
    {id:'honda',name:'Honda',domain:'honda.com'},
    {id:'hyundai',name:'Hyundai',domain:'hyundai.com'},
    {id:'infiniti',name:'INFINITI',domain:'infiniti.com'},
    {id:'kia',name:'Kia',domain:'kia.com'},
    {id:'lexus',name:'Lexus',domain:'lexus.com'},
    {id:'mazda',name:'Mazda',domain:'mazda.com'},
    {id:'mercedes',name:'Mercedes-Benz',domain:'mercedes-benz.com'},
    {id:'mg',name:'MG',domain:'mgmotor.com'},
    {id:'mini',name:'MINI',domain:'mini.com'},
    {id:'nissan',name:'Nissan',domain:'nissan.com'},
    {id:'peugeot',name:'Peugeot',domain:'peugeot.com'},
    {id:'porsche',name:'Porsche',domain:'porsche.com'},
    {id:'seat',name:'SEAT',domain:'seat.com'},
    {id:'skoda',name:'Škoda',domain:'skoda-auto.com'},
    {id:'subaru',name:'Subaru',domain:'subaru.com'},
    {id:'tesla',name:'Tesla',domain:'tesla.com'},
    {id:'toyota',name:'Toyota',domain:'toyota.com'},
    {id:'volkswagen',name:'Volkswagen',domain:'volkswagen.com'},
    {id:'volvo',name:'Volvo',domain:'volvocars.com'},
    {id:'xpeng',name:'XPENG',domain:'xpeng.com'}
  ];

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
  var budget=document.getElementById('car-budget');
  var sort=document.getElementById('car-sort');
  var count=document.getElementById('car-count');
  var empty=document.getElementById('inventory-empty');
  var brandFilter=document.getElementById('brand-filter');
  var brandReset=document.getElementById('brand-reset');
  var selectedBrand='all';

  var brandById={};
  brands.forEach(function(b){brandById[b.id]=b;});

  Array.from(new Set(cars.map(function(c){return c.type;}))).sort().forEach(function(t){
    var o=document.createElement('option');
    o.value=t;
    o.textContent=t;
    if(type) type.appendChild(o);
  });

  function buildBrandLogo(brand){
    var wrap=document.createElement('span');
    wrap.className='brand-logo-wrap';

    if(!brand){
      wrap.classList.add('fallback');
      wrap.textContent='ALL';
      return wrap;
    }

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
        wrap.textContent=brand.name.replace(/[^A-Za-z0-9]/g,'').slice(0,3).toUpperCase();
      }
    });

    img.src='https://logo.clearbit.com/'+brand.domain+'?size=128';
    wrap.appendChild(img);
    return wrap;
  }

  function makeBrandButton(brand){
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='brand-filter-btn'+(!brand?' all active':'');
    btn.setAttribute('role','listitem');
    btn.dataset.brand=brand?brand.id:'all';
    btn.appendChild(buildBrandLogo(brand));

    var label=document.createElement('span');
    label.className='brand-filter-name';
    label.textContent=brand?brand.name:'All makes';
    btn.appendChild(label);

    btn.addEventListener('click',function(){
      selectedBrand=btn.dataset.brand;
      updateBrandState();
      render();
    });
    return btn;
  }

  function updateBrandState(){
    if(!brandFilter) return;
    brandFilter.querySelectorAll('.brand-filter-btn').forEach(function(btn){
      var active=btn.dataset.brand===selectedBrand;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-pressed',active?'true':'false');
    });
  }

  if(brandFilter){
    brandFilter.appendChild(makeBrandButton(null));
    brands.forEach(function(b){brandFilter.appendChild(makeBrandButton(b));});
  }

  if(brandReset){
    brandReset.addEventListener('click',function(){
      selectedBrand='all';
      updateBrandState();
      render();
      if(brandFilter&&brandFilter.scrollTo){
        brandFilter.scrollTo({left:0,behavior:'smooth'});
      }
    });
  }

  function money(n){return n==null?'Sold':('$'+n.toLocaleString('en-SG'));}
  function brandName(id){return brandById[id]?brandById[id].name:id;}

  function render(){
    var q=(search&&search.value||'').toLowerCase().trim();

    var data=cars.filter(function(c){
      var qok=!q||(c.name+' '+c.type+' '+brandName(c.brand)).toLowerCase().indexOf(q)>-1;
      var brandOk=selectedBrand==='all'||c.brand===selectedBrand;
      var tok=!type||type.value==='all'||c.type===type.value;
      var bok=true;

      if(budget){
        if(budget.value==='u50') bok=c.price!=null&&c.price<50000;
        if(budget.value==='50to100') bok=c.price!=null&&c.price>=50000&&c.price<=100000;
        if(budget.value==='o100') bok=c.price!=null&&c.price>100000;
      }

      return qok&&brandOk&&tok&&bok;
    });

    if(sort){
      if(sort.value==='low'){
        data.sort(function(a,b){
          return (a.price==null?Number.MAX_SAFE_INTEGER:a.price)-(b.price==null?Number.MAX_SAFE_INTEGER:b.price);
        });
      }
      if(sort.value==='high'){
        data.sort(function(a,b){
          return (b.price==null?-1:b.price)-(a.price==null?-1:a.price);
        });
      }
      if(sort.value==='new'){
        data.sort(function(a,b){return b.year-a.year;});
      }
    }

    grid.innerHTML='';

    data.forEach(function(c){
      var a=document.createElement('a');
      a.className='inventory-card reveal in';
      a.href='https://www.carchope.com/products';
      a.target='_blank';
      a.rel='noopener';

      var statusLabel=c.status&&c.status!=='Available'?' · '+c.status:'';

      a.innerHTML=
        '<div class="inventory-top"><span class="inventory-brand">'+brandName(c.brand)+'</span><b>'+c.type+statusLabel+'</b></div>'+
        '<div class="inventory-photo"><img src="'+c.img+'" alt="'+c.name+'" loading="lazy"><span class="view">View car ↗</span></div>'+
        '<div class="inventory-copy"><h3>'+c.name+'</h3><div class="inventory-price">'+money(c.price)+'</div>'+
        '<div class="inventory-specs"><div class="inventory-spec"><span>Registered</span><strong>'+c.reg+'</strong></div>'+
        '<div class="inventory-spec"><span>Mileage</span><strong>'+c.km+'</strong></div>'+
        '<div class="inventory-spec"><span>Depreciation</span><strong>'+c.dep+'</strong></div></div></div>';

      grid.appendChild(a);
    });

    if(count) count.textContent=data.length;
    if(empty) empty.style.display=data.length?'none':'block';
  }

  [search,type,budget,sort].forEach(function(el){
    if(el) el.addEventListener('input',render);
  });

  render();
})();