import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { Mesh, MeshStandardMaterial, MeshPhysicalMaterial, DataTexture, RGBAFormat, RepeatWrapping, LinearMipmapLinearFilter, SRGBColorSpace } from "three";
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
function FramePart({size,position,radius,material}:{size:[number,number,number];position:[number,number,number];radius:number;material?:MeshStandardMaterial}){
  const [w,h,d]=size;
  const geometry=useMemo(()=>new RoundedBoxGeometry(w,h,d,5,radius),[w,h,d,radius]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry} material={material} position={position} castShadow receiveShadow>{!material&&<meshStandardMaterial color="#62694f" roughness={.98}/>}</mesh>;
}
export default function Sofa() {
  const { scene } = useGLTF(import.meta.env.BASE_URL + "models/sofa.glb");
  const weave=useMemo(()=>{
    const size=128,data=new Uint8Array(size*size*4);
    let seed=71;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      seed=(1664525*seed+1013904223)>>>0;
      const thread=(Math.sin(x*Math.PI/2)*Math.cos(y*Math.PI/2));
      const value=235+thread*9+(seed/4294967296-.5)*12,index=(y*size+x)*4;
      data[index]=data[index+1]=data[index+2]=value;data[index+3]=255;
    }
    const texture=new DataTexture(data,size,size,RGBAFormat);
    texture.wrapS=texture.wrapT=RepeatWrapping;texture.repeat.set(12,12);
    texture.colorSpace=SRGBColorSpace;texture.generateMipmaps=true;texture.minFilter=LinearMipmapLinearFilter;texture.anisotropy=8;texture.needsUpdate=true;
    return texture;
  },[]);
  useEffect(()=>()=>weave.dispose(),[weave]);
  const copy = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      if (o instanceof Mesh) {
        // Retain the sculpted cushions, but replace the three independent chassis.
        if (/deck|foot|connector/i.test(o.name)) o.visible=false;
        // Compress only the central seat's top surface; retain the original stitched silhouette.
        if (/seat[_.]?001$/.test(o.name) && !/welt/i.test(o.name)) {
          o.geometry=o.geometry.clone();
          const positions=o.geometry.attributes.position;
          for(let i=0;i<positions.count;i++){
            const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
            const top=Math.max(0,Math.min(1,(y-.015)/.055));
            const footprint=Math.pow(Math.abs(x)/.29,8)+Math.pow(Math.abs(z-.002)/.205,8);
            const indentation=.014*Math.exp(-footprint*.7)*top*top*(3-2*top);
            positions.setY(i,y-indentation);
          }
          positions.needsUpdate=true;
          o.geometry.computeVertexNormals();
        }
        o.castShadow = true;
        o.receiveShadow = true;
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        o.material = materials.map((m) => {
          const n = m.clone() as MeshStandardMaterial;
          if (/fabric|uphol|textile/i.test(n.name)) {
            n.color.set("#747c6a");
            // Original near-black albedo and white sheen were masking the dyed fabric colour.
            n.map=weave;
            if(n instanceof MeshPhysicalMaterial){
              n.sheen=.22;
              n.sheenColor.set('#9ca68b');
              n.sheenRoughness=.9;
            }
            n.roughness = 0.96;
            n.roughnessMap = null;
            n.normalScale.set(0.28, 0.28);
            n.envMapIntensity = 0.12;
            if (n.map) n.map.anisotropy = 8;
            if (n.normalMap) n.normalMap.anisotropy = 8;
          }
          return n;
        });
        if (o.material.length === 1) o.material = o.material[0];
      }
    });
    return c;
  }, [scene,weave]);
  const fabric=useMemo(()=>{
    let result:MeshStandardMaterial|undefined;
    copy.traverse(o=>{
      if(o instanceof Mesh){
        const materials=Array.isArray(o.material)?o.material:[o.material];
        const match=materials.find(m=>/textile/i.test(m.name));
        if(match)result=match as MeshStandardMaterial;
      }
    });
    return result;
  },[copy]);
  useEffect(
    () => () => {
      copy.traverse((o) => {
        if (o instanceof Mesh) {
          const materials = Array.isArray(o.material)
            ? o.material
            : [o.material];
          materials.forEach((material) => material.dispose());
        }
      });
    },
    [copy],
  );
  return <group>
    <primitive object={copy} />
    <FramePart material={fabric} size={[2.66,.24,.94]} radius={.09} position={[0,.255,.005]} />
    <FramePart material={fabric} size={[2.66,.61,.19]} radius={.07} position={[0,.62,-.43]} />
    {[-1.37,1.37].map(x=><FramePart material={fabric} key={x} size={[.24,.51,.96]} radius={.075} position={[x,.48,0]} />)}
    {[-1.13,1.13].flatMap(x=>[-.3,.3].map(z=><mesh key={`${x}-${z}`} position={[x,.078,z]} castShadow><cylinderGeometry args={[.032,.026,.156,24]}/><meshStandardMaterial color="#171b21" metalness={.35} roughness={.55}/></mesh>))}
  </group>;
}
