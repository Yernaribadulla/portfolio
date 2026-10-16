import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Mesh } from 'three';

// Editable source: modeling/yernar-laptop.blend, exported by Blender to local GLB.
export default function Laptop() {
  const {scene}=useGLTF(import.meta.env.BASE_URL+'models/laptop.glb');
  const model=useMemo(()=>{
    const copy=scene.clone(true);
    copy.traverse(object=>{
      if(object instanceof Mesh){object.castShadow=true;object.receiveShadow=true;}
    });
    return copy;
  },[scene]);
  return <primitive object={model} position={[0,-.011,0]}/>;
}
