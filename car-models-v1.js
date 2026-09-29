
import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/*
  Procedural car reconstruction factories following the img2threejs approach:
  - real dimensions first
  - reference-specific silhouette and component inventory
  - separate body / greenhouse / glazing / lamps / trim / wheels
  - animation-ready hierarchy with named wheel nodes

  Coordinates:
  X = vehicle width
  Y = height above ground
  Z = longitudinal axis, rear at +Z, front at -Z
*/

function makeMaterials(bodyColor){
  return {
    body:new THREE.MeshPhysicalMaterial({
      color:bodyColor,
      metalness:.72,
      roughness:.31,
      clearcoat:1,
      clearcoatRoughness:.055,
      envMapIntensity:1.0
    }),
    glass:new THREE.MeshPhysicalMaterial({
      color:0x18242d,
      metalness:.05,
      roughness:.12,
      transmission:.20,
      transparent:true,
      opacity:.88,
      envMapIntensity:.9,
      side:THREE.DoubleSide
    }),
    black:new THREE.MeshStandardMaterial({
      color:0x151719,
      metalness:.16,
      roughness:.52
    }),
    tire:new THREE.MeshStandardMaterial({
      color:0x101112,
      metalness:.02,
      roughness:.86
    }),
    rim:new THREE.MeshStandardMaterial({
      color:0xb9bdc2,
      metalness:.88,
      roughness:.24
    }),
    chrome:new THREE.MeshStandardMaterial({
      color:0xd8dbde,
      metalness:.94,
      roughness:.16
    }),
    redLamp:new THREE.MeshPhysicalMaterial({
      color:0xb40f1c,
      emissive:0x8f0710,
      emissiveIntensity:.34,
      metalness:.08,
      roughness:.18,
      clearcoat:.8,
      clearcoatRoughness:.05
    }),
    clearLamp:new THREE.MeshPhysicalMaterial({
      color:0xf0f2ef,
      emissive:0xffffff,
      emissiveIntensity:.06,
      metalness:.02,
      roughness:.16,
      clearcoat:.8
    })
  };
}

function bodyHull(stations,material,kind="body"){
  const points=[];

  const bodyCross=[
    [-.56,0],
    [-.88,.09],
    [-1,.34],
    [-.99,.68],
    [-.88,1],
    [.88,1],
    [.99,.68],
    [1,.34],
    [.88,.09],
    [.56,0]
  ];

  const cabinCross=[
    [-1,0],
    [-.98,.26],
    [-.86,.66],
    [-.62,1],
    [.62,1],
    [.86,.66],
    [.98,.26],
    [1,0]
  ];

  const cross=kind==="cabin"?cabinCross:bodyCross;

  stations.forEach(s=>{
    const height=s.top-s.bottom;
    cross.forEach(([xf,yf])=>{
      points.push(
        new THREE.Vector3(
          xf*s.halfWidth,
          s.bottom+yf*height,
          s.z
        )
      );
    });
  });

  const geometry=new ConvexGeometry(points);
  geometry.computeVertexNormals();

  const mesh=new THREE.Mesh(geometry,material);
  mesh.name=kind==="cabin"?"greenhouse-shell":"body-shell";
  return mesh;
}

function roundedBox(w,h,d,r,material){
  const geometry=new RoundedBoxGeometry(w,h,d,5,r);
  return new THREE.Mesh(geometry,material);
}

function shapePanel(points,material,z,depth=.018,bevel=.008){
  const shape=new THREE.Shape();
  shape.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++) shape.lineTo(points[i][0],points[i][1]);
  shape.closePath();

  const geometry=new THREE.ExtrudeGeometry(shape,{
    depth,
    bevelEnabled:true,
    bevelSegments:2,
    bevelSize:bevel,
    bevelThickness:bevel
  });

  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.z=z;
  return mesh;
}

function sidePanel(points,material,sideX){
  const shape=new THREE.Shape();

  const first=points[0];
  shape.moveTo(-first.z,first.y);

  for(let i=1;i<points.length;i++){
    shape.lineTo(-points[i].z,points[i].y);
  }
  shape.closePath();

  const geometry=new THREE.ShapeGeometry(shape);
  geometry.rotateY(Math.PI/2);

  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.x=sideX;
  mesh.renderOrder=3;
  return mesh;
}

function addSideWindows(root,points,halfWidth,materials){
  const left=sidePanel(points,materials.glass,-halfWidth-.006);
  const right=sidePanel(points,materials.glass,halfWidth+.006);

  left.name="side-window-left";
  right.name="side-window-right";

  root.add(left,right);
}

function makePlate(text,w=.48,h=.13){
  const c=document.createElement("canvas");
  c.width=512;
  c.height=150;

  const ctx=c.getContext("2d");
  ctx.fillStyle="#f1f1eb";
  ctx.fillRect(0,0,c.width,c.height);

  ctx.strokeStyle="#232426";
  ctx.lineWidth=12;
  ctx.strokeRect(5,5,c.width-10,c.height-10);

  ctx.fillStyle="#171819";
  ctx.font="700 68px Arial";
  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillText(text,c.width/2,c.height/2+2);

  const texture=new THREE.CanvasTexture(c);
  texture.colorSpace=THREE.SRGBColorSpace;

  const mesh=new THREE.Mesh(
    new THREE.PlaneGeometry(w,h),
    new THREE.MeshBasicMaterial({map:texture,toneMapped:false})
  );

  return mesh;
}

function makeBadge(radius,material){
  return new THREE.Mesh(
    new THREE.CylinderGeometry(radius,radius,.018,32),
    material
  );
}

function createWheel(radius,width,materials,spokes=10){
  const root=new THREE.Group();

  const tire=new THREE.Mesh(
    new THREE.CylinderGeometry(radius,radius,width,36,2),
    materials.tire
  );
  tire.rotation.z=Math.PI/2;
  root.add(tire);

  const rimRadius=radius*.61;
  const rim=new THREE.Mesh(
    new THREE.CylinderGeometry(rimRadius,rimRadius,width+.012,32,1),
    materials.rim
  );
  rim.rotation.z=Math.PI/2;
  root.add(rim);

  const hub=new THREE.Mesh(
    new THREE.CylinderGeometry(radius*.12,radius*.12,width+.025,24),
    materials.chrome
  );
  hub.rotation.z=Math.PI/2;
  root.add(hub);

  for(let i=0;i<spokes;i++){
    const angle=(i/spokes)*Math.PI*2;
    const spoke=new THREE.Mesh(
      new THREE.BoxGeometry(width+.032,radius*.44,.026),
      materials.rim
    );
    spoke.position.y=Math.cos(angle)*radius*.26;
    spoke.position.z=Math.sin(angle)*radius*.26;
    spoke.rotation.x=-angle;
    root.add(spoke);
  }

  root.userData.isWheel=true;
  return root;
}

function addWheelSet(root,dims,materials,wheelRadius,wheelWidth=.25,spokes=10){
  const wheels=[];
  const x=dims.width*.435;
  const frontZ=-dims.wheelbase/2;
  const rearZ=dims.wheelbase/2;

  [
    [-x,frontZ],[x,frontZ],
    [-x,rearZ],[x,rearZ]
  ].forEach(([px,pz],index)=>{
    const wheel=createWheel(wheelRadius,wheelWidth,materials,spokes);
    wheel.position.set(px,wheelRadius+.04,pz);
    wheel.name=["wheel-fl","wheel-fr","wheel-rl","wheel-rr"][index];
    root.add(wheel);
    wheels.push(wheel);
  });

  return wheels;
}

function addWheelArchTrim(root,dims,materials,wheelRadius){
  const x=dims.width*.446;
  const zs=[-dims.wheelbase/2,dims.wheelbase/2];

  [-1,1].forEach(side=>{
    zs.forEach(z=>{
      const arch=new THREE.Mesh(
        new THREE.TorusGeometry(
          wheelRadius*1.08,
          .024,
          8,
          38,
          Math.PI
        ),
        materials.black
      );
      arch.rotation.y=Math.PI/2;
      arch.position.set(side*x,wheelRadius+.06,z);
      root.add(arch);
    });
  });
}

function addSideSkirts(root,dims,materials){
  [-1,1].forEach(side=>{
    const skirt=roundedBox(
      .055,
      .11,
      dims.length*.68,
      .025,
      materials.black
    );
    skirt.position.set(
      side*dims.width*.49,
      .30,
      0
    );
    root.add(skirt);
  });
}

function addGroundShadow(root,dims){
  const c=document.createElement("canvas");
  c.width=512;
  c.height=1024;

  const ctx=c.getContext("2d");
  const g=ctx.createRadialGradient(
    c.width/2,c.height/2,20,
    c.width/2,c.height/2,c.width*.48
  );
  g.addColorStop(0,"rgba(0,0,0,.48)");
  g.addColorStop(.55,"rgba(0,0,0,.22)");
  g.addColorStop(1,"rgba(0,0,0,0)");

  ctx.fillStyle=g;
  ctx.fillRect(0,0,c.width,c.height);

  const tex=new THREE.CanvasTexture(c);

  const mesh=new THREE.Mesh(
    new THREE.PlaneGeometry(
      dims.width*1.12,
      dims.length*.92
    ),
    new THREE.MeshBasicMaterial({
      map:tex,
      transparent:true,
      depthWrite:false,
      toneMapped:false
    })
  );

  mesh.rotation.x=-Math.PI/2;
  mesh.position.y=.012;
  mesh.renderOrder=1;
  root.add(mesh);
}

function addRearGlass(root,dims,materials,points){
  const glass=shapePanel(
    points,
    materials.glass,
    dims.length/2+.012,
    .012,
    .004
  );
  glass.name="rear-glass";
  root.add(glass);
}

function addRearPlate(root,dims,text,y,w=.48,h=.13){
  const plate=makePlate(text,w,h);
  plate.position.set(0,y,dims.length/2+.045);
  root.add(plate);
}

function addRoofSpoiler(root,dims,materials,width,y,depth=.20){
  const spoiler=roundedBox(
    width,
    .055,
    depth,
    .025,
    materials.black
  );
  spoiler.position.set(
    0,
    y,
    dims.length/2-depth*.05
  );
  root.add(spoiler);
}

function addSimpleMirror(root,dims,materials,z,y){
  [-1,1].forEach(side=>{
    const mirror=roundedBox(
      .15,.10,.28,.04,materials.body
    );
    mirror.position.set(
      side*(dims.width*.54),
      y,
      z
    );
    root.add(mirror);
  });
}

function finishVehicle(root,wheels,name,dims){
  root.name=name;
  root.userData.vehicleName=name;
  root.userData.dimensions={...dims};
  root.userData.wheels=wheels;
  root.userData.rearFacesCamera=true;
  return {group:root,wheels};
}

/* =========================================================
   XPENG G6 — 2025
   Official dimensions: 4.758 x 1.920 x 1.650 m, wheelbase 2.890 m.
   Identity details reconstructed from rear / side references:
   coupe-SUV greenhouse, full-width tail lamp, wide rear shoulders,
   dark lower diffuser, short rear overhang, ducktail/spoiler.
   ========================================================= */
export function createXpengG6Model(){
  const dims={
    length:4.758,
    width:1.920,
    height:1.650,
    wheelbase:2.890
  };

  const materials=makeMaterials(0xe9ecec);
  const root=new THREE.Group();

  const body=bodyHull([
    {z: 2.36,halfWidth:.86,bottom:.28,top:.98},
    {z: 1.82,halfWidth:.96,bottom:.25,top:1.04},
    {z: .92,halfWidth:.96,bottom:.24,top:1.01},
    {z: 0,halfWidth:.95,bottom:.24,top:.98},
    {z:-1.05,halfWidth:.94,bottom:.25,top:.93},
    {z:-1.88,halfWidth:.88,bottom:.27,top:.84},
    {z:-2.36,halfWidth:.77,bottom:.31,top:.76}
  ],materials.body);

  root.add(body);

  const cabin=bodyHull([
    {z: 1.58,halfWidth:.70,bottom:.91,top:1.36},
    {z: 1.10,halfWidth:.79,bottom:.91,top:1.54},
    {z: .30,halfWidth:.80,bottom:.90,top:1.65},
    {z:-.55,halfWidth:.78,bottom:.88,top:1.62},
    {z:-1.15,halfWidth:.70,bottom:.86,top:1.47},
    {z:-1.48,halfWidth:.56,bottom:.84,top:1.27}
  ],materials.body,"cabin");

  root.add(cabin);

  addSideWindows(root,[
    {z:1.40,y:1.02},
    {z:1.13,y:1.43},
    {z:.45,y:1.56},
    {z:-.50,y:1.54},
    {z:-1.18,y:1.38},
    {z:-1.36,y:1.02}
  ],.805,materials);

  addRearGlass(root,dims,materials,[
    [-.67,1.05],
    [-.58,1.43],
    [ .58,1.43],
    [ .67,1.05]
  ]);

  const tailBar=roundedBox(1.68,.052,.055,.018,materials.redLamp);
  tailBar.position.set(0,.965,dims.length/2+.055);
  root.add(tailBar);

  const lowerDiffuser=roundedBox(1.68,.22,.12,.055,materials.black);
  lowerDiffuser.position.set(0,.40,dims.length/2+.015);
  root.add(lowerDiffuser);

  const bumperLip=roundedBox(1.42,.055,.08,.022,materials.chrome);
  bumperLip.position.set(0,.31,dims.length/2+.085);
  root.add(bumperLip);

  addRoofSpoiler(root,dims,materials,1.44,1.51,.24);
  addRearPlate(root,dims,"G6",.63,.46,.13);
  addSimpleMirror(root,dims,materials,-1.07,1.05);

  const wheels=addWheelSet(root,dims,materials,.375,.27,10);
  addWheelArchTrim(root,dims,materials,.375);
  addSideSkirts(root,dims,materials);
  addGroundShadow(root,dims);

  return finishVehicle(root,wheels,"XPENG G6",dims);
}

/* =========================================================
   Volkswagen Golf SV / Sportsvan — 2018
   Reference dimensions: 4.351 x 1.807 x ~1.578 m,
   wheelbase 2.670 m.
   Identity details: upright hatch, tall greenhouse, roof rails,
   horizontal split rear lamps, restrained bumper geometry.
   ========================================================= */
export function createGolfSvModel(){
  const dims={
    length:4.351,
    width:1.807,
    height:1.578,
    wheelbase:2.670
  };

  const materials=makeMaterials(0xb8bcc0);
  const root=new THREE.Group();

  const body=bodyHull([
    {z: 2.13,halfWidth:.84,bottom:.27,top:1.00},
    {z: 1.55,halfWidth:.90,bottom:.25,top:1.02},
    {z: .65,halfWidth:.90,bottom:.24,top:1.00},
    {z:-.35,halfWidth:.89,bottom:.24,top:.96},
    {z:-1.35,halfWidth:.86,bottom:.26,top:.88},
    {z:-2.12,halfWidth:.75,bottom:.31,top:.78}
  ],materials.body);

  root.add(body);

  const cabin=bodyHull([
    {z: 1.74,halfWidth:.70,bottom:.88,top:1.45},
    {z: 1.15,halfWidth:.78,bottom:.87,top:1.55},
    {z: .35,halfWidth:.79,bottom:.86,top:1.58},
    {z:-.55,halfWidth:.77,bottom:.84,top:1.56},
    {z:-1.24,halfWidth:.70,bottom:.83,top:1.45},
    {z:-1.58,halfWidth:.57,bottom:.81,top:1.25}
  ],materials.body,"cabin");

  root.add(cabin);

  addSideWindows(root,[
    {z:1.53,y:.96},
    {z:1.30,y:1.40},
    {z:.68,y:1.49},
    {z:-.40,y:1.49},
    {z:-1.14,y:1.38},
    {z:-1.44,y:.96}
  ],.795,materials);

  addRearGlass(root,dims,materials,[
    [-.68,.98],
    [-.64,1.42],
    [ .64,1.42],
    [ .68,.98]
  ]);

  [-1,1].forEach(side=>{
    const lamp=roundedBox(.46,.17,.055,.035,materials.redLamp);
    lamp.position.set(
      side*.60,
      .89,
      dims.length/2+.055
    );
    root.add(lamp);
  });

  const bumper=roundedBox(1.62,.19,.11,.045,materials.body);
  bumper.position.set(0,.42,dims.length/2+.02);
  root.add(bumper);

  const lowerTrim=roundedBox(1.48,.12,.10,.035,materials.black);
  lowerTrim.position.set(0,.31,dims.length/2+.06);
  root.add(lowerTrim);

  addRoofSpoiler(root,dims,materials,1.36,1.50,.18);
  addRearPlate(root,dims,"GOLF SV",.66,.54,.12);
  addSimpleMirror(root,dims,materials,-.98,1.04);

  /* roof rails */
  [-1,1].forEach(side=>{
    const rail=roundedBox(.035,.035,2.25,.015,materials.chrome);
    rail.position.set(side*.59,1.57,.02);
    root.add(rail);
  });

  /* rear VW-style circular badge */
  const badge=makeBadge(.085,materials.chrome);
  badge.rotation.x=Math.PI/2;
  badge.position.set(0,.94,dims.length/2+.065);
  root.add(badge);

  const wheels=addWheelSet(root,dims,materials,.345,.245,10);
  addWheelArchTrim(root,dims,materials,.345);
  addSideSkirts(root,dims,materials);
  addGroundShadow(root,dims);

  return finishVehicle(root,wheels,"Volkswagen Golf SV",dims);
}

/* =========================================================
   Toyota Prius+ — 2020
   Toyota dimensions: 4.645 x 1.775 x 1.575 m,
   wheelbase 2.780 m.
   Identity details: long high-roof MPV silhouette,
   near-vertical rear hatch, tall vertical tail-lamp clusters,
   roof spoiler and black lower bumper.
   ========================================================= */
export function createPriusPlusModel(){
  const dims={
    length:4.645,
    width:1.775,
    height:1.575,
    wheelbase:2.780
  };

  const materials=makeMaterials(0x943339);
  const root=new THREE.Group();

  const body=bodyHull([
    {z: 2.28,halfWidth:.79,bottom:.28,top:.98},
    {z: 1.72,halfWidth:.88,bottom:.25,top:1.01},
    {z: .72,halfWidth:.88,bottom:.24,top:.99},
    {z:-.30,halfWidth:.87,bottom:.24,top:.94},
    {z:-1.38,halfWidth:.84,bottom:.26,top:.86},
    {z:-2.28,halfWidth:.73,bottom:.31,top:.76}
  ],materials.body);

  root.add(body);

  const cabin=bodyHull([
    {z: 1.86,halfWidth:.68,bottom:.87,top:1.42},
    {z: 1.25,halfWidth:.76,bottom:.86,top:1.54},
    {z: .35,halfWidth:.77,bottom:.85,top:1.575},
    {z:-.62,halfWidth:.75,bottom:.83,top:1.52},
    {z:-1.38,halfWidth:.66,bottom:.81,top:1.34},
    {z:-1.64,halfWidth:.54,bottom:.79,top:1.18}
  ],materials.body,"cabin");

  root.add(cabin);

  addSideWindows(root,[
    {z:1.68,y:.95},
    {z:1.42,y:1.36},
    {z:.72,y:1.48},
    {z:-.38,y:1.48},
    {z:-1.20,y:1.31},
    {z:-1.48,y:.94}
  ],.775,materials);

  addRearGlass(root,dims,materials,[
    [-.65,.97],
    [-.60,1.42],
    [ .60,1.42],
    [ .65,.97]
  ]);

  /* tall Prius+ rear light towers */
  [-1,1].forEach(side=>{
    const upper=roundedBox(.16,.44,.055,.035,materials.clearLamp);
    upper.position.set(
      side*.72,
      1.05,
      dims.length/2+.055
    );
    root.add(upper);

    const lower=roundedBox(.16,.27,.06,.035,materials.redLamp);
    lower.position.set(
      side*.72,
      .79,
      dims.length/2+.058
    );
    root.add(lower);
  });

  const bumper=roundedBox(1.58,.20,.11,.045,materials.body);
  bumper.position.set(0,.42,dims.length/2+.02);
  root.add(bumper);

  const lowerTrim=roundedBox(1.50,.14,.11,.035,materials.black);
  lowerTrim.position.set(0,.30,dims.length/2+.065);
  root.add(lowerTrim);

  addRoofSpoiler(root,dims,materials,1.34,1.49,.21);
  addRearPlate(root,dims,"PRIUS+",.69,.54,.12);
  addSimpleMirror(root,dims,materials,-1.05,1.03);

  const badge=makeBadge(.07,materials.chrome);
  badge.rotation.x=Math.PI/2;
  badge.position.set(0,.93,dims.length/2+.068);
  root.add(badge);

  const wheels=addWheelSet(root,dims,materials,.34,.24,10);
  addWheelArchTrim(root,dims,materials,.34);
  addSideSkirts(root,dims,materials);
  addGroundShadow(root,dims);

  return finishVehicle(root,wheels,"Toyota Prius+",dims);
}
