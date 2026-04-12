import { useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import {
  Box3,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  Vector3,
  type Group,
  type Object3D,
} from "three";

function ChainringModel({ onReady }: { onReady: () => void }) {
  const baseUrl = import.meta.env.BASE_URL;
  const groupRef = useRef<Group | null>(null);
  const modelSrc = `${baseUrl}CHAINRING-JAKUBKANNA.glb`;
  const dracoDecoderPath = `${baseUrl}draco/`;
  const { scene } = useGLTF(modelSrc, dracoDecoderPath);
  const steelMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#d8dde1",
        emissive: "#1d2225",
        emissiveIntensity: 0.22,
        metalness: 1,
        roughness: 0.32,
        side: DoubleSide,
      }),
    [],
  );

  const model = useMemo(() => {
    const nextModel = scene.clone(true);
    const bounds = new Box3().setFromObject(nextModel);
    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z, 1);

    nextModel.position.sub(center);
    nextModel.scale.setScalar(4.2 / maxAxis);
    nextModel.traverse((object: Object3D) => {
      if (!(object instanceof Mesh)) return;
      object.material = steelMaterial;
    });

    return nextModel;
  }, [scene, steelMaterial]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.z += delta * 0.28;
  });

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  );
}

export default function HomeChainringScene({ onReady }: { onReady: () => void }) {
  return (
    <Canvas
      camera={{ fov: 32, position: [0, 0, 5.6] }}
      dpr={1}
      gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#050505"]} />
      <ambientLight intensity={1.25} />
      <directionalLight intensity={2.6} position={[3.5, 4, 5]} />
      <directionalLight intensity={1.35} position={[-4, -2, 3]} />
      <Suspense fallback={null}>
        <ChainringModel onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(
  `${import.meta.env.BASE_URL}CHAINRING-JAKUBKANNA.glb`,
  `${import.meta.env.BASE_URL}draco/`,
);
