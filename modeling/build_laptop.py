import bpy, math, os
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name,color,metal=0,rough=.4):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 m.node_tree.nodes.clear();p=m.node_tree.nodes.new('ShaderNodeBsdfPrincipled');out=m.node_tree.nodes.new('ShaderNodeOutputMaterial');m.node_tree.links.new(p.outputs['BSDF'],out.inputs['Surface']);p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 return m
metal=mat('Satin graphite aluminium',(.28,.31,.35),.86,.3)
edge=mat('Machined edge',(.43,.47,.52),.9,.24)
black=mat('Soft black keycaps',(.012,.016,.023),.08,.38)
glass=mat('Display glass bezel',(.006,.009,.014),.24,.19)
rubber=mat('Rubber seam',(.008,.01,.013),0,.7)
track=mat('Etched glass trackpad',(.19,.22,.26),.42,.37)
white=mat('Key legends',(.57,.63,.69),.05,.48)
lens=mat('Camera sapphire',(.015,.045,.065),.65,.13)
screen=mat('Display backing',(.008,.018,.03),0,.5)
def xyz(p):return (p[0],-p[2],p[1])
def finish(o,name,material,bevel=0):
 o.name=name;o.data.materials.append(material)
 if bevel:
  m=o.modifiers.new('Precision edge fillet','BEVEL');m.width=bevel;m.segments=3
  bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=m.name)
 for f in o.data.polygons:f.use_smooth=True
 m=o.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL');m.keep_sharp=True;m.weight=50
 bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=m.name)
 return o
def box(name,size,pos,material,bevel=.001,parent=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(pos));o=bpy.context.object;o.dimensions=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 finish(o,name,material,bevel)
 if parent:o.parent=parent
 return o
def panel(name,w,h,d,r,pos,material,base=False,parent=None):
 contour=[]
 for cx,cy,start in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
  for i in range(13):
   a=math.radians(start+i*90/12);contour.append((cx+r*math.cos(a),cy+r*math.sin(a)))
 n=len(contour);v=[]
 for z in [-d/2,d/2]:
  for x,y in contour:v.append(xyz((x,z,y) if base else (x,y,z)))
 # Correct face winding after coordinate conversion (base swaps the local axes).
 faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 if base:faces=[tuple(reversed(f)) for f in faces]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(v,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.location=xyz(pos)
 finish(o,name,material,.00045)
 if parent:o.parent=parent
 return o
body=panel('01 • Unibody shell',.492,.329,.014,.014,(0,.538,.077),metal,True)
panel('02 • Lower enclosure seam',.481,.318,.002,.013,(0,.530,.077),rubber,True)
# Actual recessed port openings cut into the left side.
for i,z in enumerate([-.025,.018]):
 cutter=box('Port cutter',(.014,.006,.021),(-.245,.538,z),black,.001)
 bpy.context.view_layer.objects.active=body
 mod=body.modifiers.new('USB-C opening','BOOLEAN');mod.operation='DIFFERENCE';mod.object=cutter
 bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
 box('USB-C dark interior '+str(i),(.002,.004,.017),(-.239,.538,z),rubber,.0007)
panel('Keyboard recessed bed',.429,.136,.001,.006,(0,.545,.007),rubber,True)
labels=[]
rows=[['esc']+['F'+str(i) for i in range(1,13)]+['●'],list('1234567890')+['-','=','⌫'],['tab']+list('QWERTYUIOP')+['[',']'],['caps']+list('ASDFGHJKL')+['enter'],['shift']+list('ZXCVBNM')+[',','.','shift'],['fn','ctrl','alt','cmd','space','cmd','alt','←','↑','↓','→']]
for row,keys in enumerate(rows):
 weights=[5 if k=='space' else 1.65 if k in ['shift','enter','caps','tab'] else 1 for k in keys]
 unit=(.411-.003*(len(keys)-1))/sum(weights);x=-.2055;z=-.047+row*.0214
 for k,weight in zip(keys,weights):
  w=unit*weight
  box('Key '+k,(w,.0027,.0175),(x+w/2,.5472,z),black,.0012)
  if k!='space':
   bpy.ops.object.text_add(location=xyz((x+w/2,.5487,z)))
   t=bpy.context.object;t.name='Legend '+k;t.data.body=k;t.data.align_x='CENTER';t.data.align_y='CENTER';t.data.size=.0043 if len(k)>1 else .005;t.rotation_euler=(0,0,0);t.data.materials.append(white)
   bpy.ops.object.convert(target='MESH');labels.append(bpy.context.object)
  x+=w+.003
panel('Trackpad precision seam',.223,.099,.001,.006,(0,.545,.177),rubber,True)
panel('Trackpad matte glass',.220,.096,.0012,.005,(0,.5451,.177),track,True)
# Front finger recess and hinge details.
box('Opening lip recess',(.092,.003,.0015),(0,.539,.242),rubber,.0005)
for x in [-.17,.17]:
 bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.006,depth=.066,location=xyz((x,.552,-.079)),rotation=(0,math.pi/2,0));finish(bpy.context.object,'Hinge barrel',edge)
for x in [-.23,.23]:
 for col in range(4):
  for row in range(34):
   bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=.00055,depth=.00015,location=xyz((x+(col-1.5)*.0028,.5452,-.05+row*.004)))
   finish(bpy.context.object,'Speaker perforation',rubber)
lid=bpy.data.objects.new('Display assembly • 100 degrees',None);bpy.context.collection.objects.link(lid);lid.location=xyz((0,.709,-.077));lid.rotation_euler.x=-.18
panel('Display aluminium lid',.482,.314,.006,.013,(0,0,0),metal,parent=lid)
panel('Display edge seal',.477,.309,.0017,.011,(0,0,.004),rubber,parent=lid)
panel('Display glass surround',.474,.306,.001,.010,(0,0,.005),glass,parent=lid)
box('Screen plane • DOM alignment',(.454,.284,.0006),(0,0,.0085),screen,.0001,parent=lid)
box('Camera housing',(.027,.004,.001),(0,.148,.0065),rubber,.0007,parent=lid)
bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=10,radius=.0013,location=xyz((0,.148,.0075)));o=bpy.context.object;finish(o,'Webcam lens',lens);o.parent=lid
# Merge repeated parts by material, keeping major editable assemblies separate.
for prefix in ['Legend ','Speaker perforation','Key ']:
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.name.startswith(prefix)]
 if objects:
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name=prefix.strip()+' • combined'
# Export only the asset; studio setup remains in the editable Blender source.
model=[o for o in bpy.context.scene.objects]
bpy.ops.object.select_all(action='DESELECT')
for o in model:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,'public','models','laptop.glb'),export_format='GLB',use_selection=True,export_yup=True)
# Native studio preview.
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,.525));ground=bpy.context.object;ground.name='Studio ground • not exported';ground.data.materials.append(mat('Studio charcoal',(.025,.03,.04),0,.8))
def light(name,pos,power,size):
 bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,.65))-o.location).to_track_quat('-Z','Y').to_euler()
light('Large softbox',(-1,-1,2),90,1.8);light('Rim softbox',(1,.8,1.4),110,1.2)
bpy.ops.object.camera_add(location=(.75,-1.3,1.05));cam=bpy.context.object;cam.rotation_euler=(Vector((0,-.04,.66))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=55;bpy.context.scene.camera=cam
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.render.resolution_x=1500;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.world.color=(.12,.12,.12);scene.render.filepath=os.path.join(ROOT,'modeling','laptop-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'modeling','yernar-laptop.blend'))
bpy.ops.render.render(write_still=True)
