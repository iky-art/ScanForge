import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export type CoreState = "idle" | "scanning" | "analyzing" | "complete" | "error";

const STATE_COLOR: Record<CoreState, string> = {
  idle: "#3ea6ff",
  scanning: "#3ea6ff",
  analyzing: "#b678ff",
  complete: "#3ecf8e",
  error: "#ff4d4d",
};

function Core({ state, reduceMotion }: { state: CoreState; reduceMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const color = useMemo(() => new THREE.Color(STATE_COLOR[state]), [state]);

  const speed = state === "scanning" ? 0.8 : state === "analyzing" ? 1.4 : 0.25;

  useFrame((_, delta) => {
    if (reduceMotion) return;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * speed;
      meshRef.current.rotation.x += delta * speed * 0.4;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * speed * 1.6;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.15, 2]} />
        <meshStandardMaterial
          color={color}
          wireframe
          emissive={color}
          emissiveIntensity={state === "error" ? 0.9 : 0.5}
        />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[1.7, 0.012, 8, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
      <pointLight color={color} intensity={2.2} distance={6} />
      <ambientLight intensity={0.25} />
    </group>
  );
}

function Particles({ count, reduceMotion }: { count: number; reduceMotion: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2 + Math.random() * 1.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (reduceMotion || !pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.06;
  });

  if (count === 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#3ea6ff" size={0.02} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function Rig() {
  const { camera } = useThree();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.08) * 0.3;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export function ScanForgeCore({
  state = "idle",
  className,
}: {
  state?: CoreState;
  className?: string;
}) {
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const particleCount = reduceMotion ? 0 : isMobile ? 80 : 220;

  return (
    <div className={className} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Core state={state} reduceMotion={reduceMotion} />
        <Particles count={particleCount} reduceMotion={reduceMotion} />
        {!reduceMotion && <Rig />}
      </Canvas>
    </div>
  );
}
