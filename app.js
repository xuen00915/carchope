
(function(){
  var menu=document.getElementById('menu-toggle');
  var panel=document.getElementById('mobile-panel');
  if(menu&&panel){
    menu.addEventListener('click',function(){
      var open=panel.classList.toggle('open');
      document.body.classList.toggle('menu-open',open);
      menu.setAttribute('aria-expanded',open?'true':'false');
    });
  }

  var demoForm=document.querySelector('[data-demo-form]');
  if(demoForm){
    demoForm.addEventListener('submit',function(e){
      e.preventDefault();
      var note=demoForm.querySelector('.form-note');
      if(note) note.textContent='Preview only — connect this form to Carchope’s live enquiry handling during implementation.';
    });
  }

  var grid=document.getElementById('inventory-grid');
  if(!grid) return;

  var cars=[
    {name:'XPENG G6 Electric',type:'SUV',price:201705,reg:'27 Mar 2025',dep:'$21,010/yr',km:'7,000 km',year:2025,img:'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1200&q=86'},
    {name:'Volkswagen Golf Variant 1.4A TSI R-Line Sunroof',type:'Stationwagon',price:17889,reg:'23 Mar 2016',dep:'—',km:'173,000 km',year:2016,img:'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=86'},
    {name:'Volkswagen Golf SV 1.4A TSI Comfortline',type:'Hatchback',price:55988,reg:'13 Nov 2018',dep:'$13,910/yr',km:'50,000 km',year:2018,img:'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=86'},
    {name:'Volkswagen Golf GTI 5DR (COE till 03/2029)',type:'Sports Car',price:42889,reg:'19 May 2009',dep:'$12,360/yr',km:'189,000 km',year:2009,img:'https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=1200&q=86'},
    {name:'Volkswagen Beetle 1.2A TSI',type:'Hatchback',price:65888,reg:'29 Nov 2018',dep:'$17,790/yr',km:'85,100 km',year:2018,img:'https://images.unsplash.com/photo-1518987048-93e29699e79a?auto=format&fit=crop&w=1200&q=86'},
    {name:'Toyota Wish 2.0A (COE till 11/2029)',type:'MPV',price:57889,reg:'10 Dec 2009',dep:'$13,980/yr',km:'190,000 km',year:2009,img:'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1200&q=86'},
    {name:'Toyota Sienta Hybrid 1.5A Elegance',type:'MPV',price:149105,reg:'04 Mar 2024',dep:'$16,220/yr',km:'25,000 km',year:2024,img:'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1200&q=86'},
    {name:'Toyota Sienta 1.5A G',type:'MPV',price:15582,reg:'18 May 2016',dep:'$13,390/yr',km:'73,000 km',year:2016,img:'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=86'},
    {name:'Toyota Prius Plus Hybrid 1.8A',type:'MPV',price:98888,reg:'28 Dec 2020',dep:'$17,000/yr',km:'89,000 km',year:2020,img:'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=86'}
  ];

  var search=document.getElementById('car-search');
  var type=document.getElementById('car-type');
  var budget=document.getElementById('car-budget');
  var sort=document.getElementById('car-sort');
  var count=document.getElementById('car-count');
  var empty=document.getElementById('inventory-empty');

  Array.from(new Set(cars.map(function(c){return c.type;}))).sort().forEach(function(t){
    var o=document.createElement('option');o.value=t;o.textContent=t;type.appendChild(o);
  });

  function money(n){return '$'+n.toLocaleString('en-SG');}
  function render(){
    var q=(search.value||'').toLowerCase().trim();
    var data=cars.filter(function(c){
      var qok=!q||(c.name+' '+c.type).toLowerCase().indexOf(q)>-1;
      var tok=type.value==='all'||c.type===type.value;
      var bok=true;
      if(budget.value==='u50') bok=c.price<50000;
      if(budget.value==='50to100') bok=c.price>=50000&&c.price<=100000;
      if(budget.value==='o100') bok=c.price>100000;
      return qok&&tok&&bok;
    });
    if(sort.value==='low') data.sort(function(a,b){return a.price-b.price;});
    if(sort.value==='high') data.sort(function(a,b){return b.price-a.price;});
    if(sort.value==='new') data.sort(function(a,b){return b.year-a.year;});

    grid.innerHTML='';
    data.forEach(function(c,i){
      var a=document.createElement('a');
      a.className='inventory-card';
      a.href='https://www.carchope.com/products';
      a.target='_blank';
      a.rel='noopener';
      a.innerHTML=
        '<div class="inventory-top"><span>'+String(i+1).padStart(2,'0')+' / '+String(data.length).padStart(2,'0')+'</span><b>'+c.type+'</b></div>'+
        '<div class="inventory-photo"><img src="'+c.img+'" alt="'+c.name+'" loading="lazy"><span class="view">View car ↗</span></div>'+
        '<div class="inventory-copy"><h3>'+c.name+'</h3><div class="inventory-price">'+money(c.price)+'</div>'+
        '<div class="inventory-specs"><div class="inventory-spec"><span>Registered</span><strong>'+c.reg+'</strong></div>'+
        '<div class="inventory-spec"><span>Mileage</span><strong>'+c.km+'</strong></div>'+
        '<div class="inventory-spec"><span>Depreciation</span><strong>'+c.dep+'</strong></div></div></div>';
      grid.appendChild(a);
    });
    count.textContent=data.length;
    empty.style.display=data.length?'none':'block';
  }
  [search,type,budget,sort].forEach(function(el){el.addEventListener('input',render);});
  render();
})();
