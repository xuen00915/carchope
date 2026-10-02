# XPeng G6 Website 3D Model Design

## Objective

Create a recognizable, exterior-only 3D model of the white March 2025 XPeng G6 shown in the supplied Carchope listing. The model must load efficiently in a modern browser and support smooth drag-to-rotate, zoom, and optional automatic rotation.

## References

- Primary cutout: `assets/xpeng-g6-electric-photo.webp`
- Carchope vehicle listing: `https://www.carchope.com/index.php?route=product/product&product_id=1387183`
- Listing gallery images `1387183_1b.jpg` through `1387183_7b.jpg`, used for the front, side, rear, roof, trim, and wheel forms

The listing identifies the vehicle as registered on 27 March 2025 and fitted with a panoramic roof and 20-inch sport rims. Only exterior gallery images are relevant to this model.

## Visual Scope

The model will reproduce the defining exterior features of the referenced pre-facelift G6:

- white fastback SUV body and smooth hood
- black panoramic roof and dark tinted windows
- full-width front daytime-running light strip
- vertically separated lower front lamps
- black front intake and lower body cladding
- flush door handles and front-fender trim
- full-width rear lamp bar, rear spoiler, and black lower bumper
- four 20-inch multi-spoke alloy wheels with separate tires
- simplified XPeng and G6 exterior badges

The cabin, seats, dashboard, opening panels, engine bay, suspension, and detailed underbody are excluded. Dark glass and a simple dark backing volume will prevent empty interior views.

## Modeling Approach

Use a balanced, modular Blender model rather than an ultra-low-poly silhouette or a production-grade automotive surface model. The body will be a smooth subdivision-ready shell built symmetrically around the vehicle centerline. Separate objects will represent glass, light lenses, black trim, mirrors, handles, wheels, tires, badges, and a simple underbody.

The final mesh target is 40,000 to 70,000 triangles after export. Curved body surfaces and wheel silhouettes receive most of the geometry; hidden and small components remain simplified. Object origins, transforms, normals, and naming will be cleaned before export.

## Materials

Use compact physically based materials that export cleanly to glTF:

- pearl white body paint with moderate metallic and clearcoat response
- near-black tinted glass with controlled roughness
- glossy black trim and roof
- dark textured tires
- metallic two-tone wheel finish
- translucent dark front and rear light lenses with restrained emissive accents

Materials will rely primarily on scalar values and vertex geometry. Large image textures are avoided unless a small texture is necessary for a badge, keeping the GLB compact and portable.

## Deliverables

- `assets/3d/xpeng-g6/xpeng-g6.blend` — editable Blender source
- `assets/3d/xpeng-g6/xpeng-g6.glb` — website-ready binary glTF
- `assets/3d/xpeng-g6/preview.png` — verification render
- `xpeng-g6-viewer.html` — standalone browser preview using `<model-viewer>` with drag rotation, zoom, auto-rotation, neutral lighting, and a loading poster

The existing site remains unchanged except for adding the standalone preview and model assets. Embedding the viewer into a specific product page is outside this task.

## Web Presentation

The viewer will center the vehicle at ground level and begin at a front three-quarter angle similar to the supplied cutout. The camera orbit will be constrained to useful showroom angles, zoom will be limited to prevent clipping, and auto-rotation will pause during interaction. A light neutral background and soft shadow will match the current white product imagery.

## Validation

The implementation is complete when:

1. The `.blend` file opens without missing linked assets.
2. The `.glb` imports back into Blender with the expected objects and materials.
3. The model is visually recognizable from front, side, and rear views and matches the supplied white 2025 vehicle references.
4. The exported mesh stays within the 40,000–70,000 triangle target unless a documented visual issue requires a small exception.
5. The standalone viewer loads locally over HTTP and supports mouse or touch rotation, zoom, and automatic rotation without console errors.
6. Windows remain visually dark from all exterior angles, with no exposed empty cabin.
7. The model, materials, and lighting display correctly in current desktop and mobile Chromium-based browsers.

## Constraints and Trade-offs

This is a website showroom asset, not an engineering-accurate CAD reconstruction. A single photographic gallery cannot establish exact millimeter-level curvature, so recognizable proportion and visual identity take priority over manufacturing accuracy. The exterior badge treatment will be simplified to avoid unnecessary texture weight. The triangle budget and dark interior treatment intentionally favor browser performance over close-up cabin realism.
