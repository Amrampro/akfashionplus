import { useEffect, useRef, useState } from "react";

// The scene is decorative: shopping and navigation remain ordinary HTML controls.
export default function FashionScene({ paused }: { paused: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const control = useRef<((paused: boolean) => void) | null>(null);
  const pausedRef = useRef(paused);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
    control.current?.(paused);
  }, [paused]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false;
    let dispose = () => {};

    async function mount() {
      const THREE = await import("three");
      const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");
      if (cancelled) return;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setClearColor(0xf5f5f7);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      element!.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xf5f5f7, 15, 30);
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const environment = pmrem.fromScene(room, 0.04);
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.65;
      room.dispose();
      pmrem.dispose();
      scene.add(new THREE.HemisphereLight(0xffffff, 0x9295a3, 1.4));
      const light = new THREE.DirectionalLight(0xfff7e7, 2.5);
      light.position.set(-3, 8, 6);
      light.castShadow = true;
      light.shadow.mapSize.set(1024, 1024);
      light.shadow.camera.left = -7;
      light.shadow.camera.right = 7;
      light.shadow.camera.top = 7;
      light.shadow.camera.bottom = -7;
      light.shadow.normalBias = 0.03;
      scene.add(light);

      const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: 0xf5f5f7, roughness: 0.9 }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -1.9;
      floor.receiveShadow = true;
      scene.add(floor);
      const installation = new THREE.Group();
      scene.add(installation);
      const gold = new THREE.MeshStandardMaterial({ color: 0xdcae21, metalness: 0.8, roughness: 0.28 });
      const ink = new THREE.MeshStandardMaterial({ color: 0x071846, roughness: 0.52 });
      const paper = new THREE.MeshStandardMaterial({ color: 0xfaf9f5, roughness: 0.76 });
      const navy = new THREE.MeshStandardMaterial({ color: 0x071846, roughness: 0.5 });
      const textures: InstanceType<typeof THREE.Texture>[] = [];

      function mesh(geometry: NonNullable<ConstructorParameters<typeof THREE.Mesh>[0]>, material: InstanceType<typeof THREE.Material>, parent = installation) {
        const object = new THREE.Mesh(geometry, material);
        object.castShadow = true;
        object.receiveShadow = true;
        parent.add(object);
        return object;
      }

      function wordmark(background: string, foreground: string) {
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 768;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, 1024, 768);
        ctx.textAlign = "center";
        ctx.fillStyle = foreground;
        ctx.font = "170px Georgia";
        ctx.fillText("AK", 512, 350);
        ctx.font = "36px Georgia";
        ctx.fillText("FASHION PLUS", 512, 432);
        ctx.fillStyle = "#dcae21";
        ctx.fillRect(454, 477, 116, 3);
        ctx.font = "18px sans-serif";
        ctx.fillText("STYLE. QUALITY. YOU.", 512, 530);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
        textures.push(texture);
        return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.68 });
      }

      function bag(color: InstanceType<typeof THREE.Material>, face: InstanceType<typeof THREE.Material>, scale: number) {
        const group = new THREE.Group();
        const shape = new THREE.Shape();
        shape.moveTo(-0.91, -1.25);
        shape.lineTo(0.91, -1.25);
        shape.lineTo(1.02, 1.15);
        shape.lineTo(-1.02, 1.15);
        shape.closePath();
        mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.64, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 3, steps: 1 }), color, group).position.z = -0.32;
        const front = mesh(new THREE.PlaneGeometry(1.79, 1.4), face, group);
        front.position.set(0, -0.08, 0.36);
        for (const z of [-0.21, 0.24]) {
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.49, 0.98, z), new THREE.Vector3(-0.49, 1.65, z),
            new THREE.Vector3(0, 1.91, z), new THREE.Vector3(0.49, 1.65, z), new THREE.Vector3(0.49, 0.98, z),
          ]);
          mesh(new THREE.TubeGeometry(curve, 40, 0.028, 8, false), gold, group);
        }
        group.scale.setScalar(scale);
        installation.add(group);
        return group;
      }

      const largeBag = bag(paper, wordmark("#faf9f5", "#071846"), 1.17);
      largeBag.position.set(0.5, 0.2, 0);
      largeBag.rotation.set(-0.05, -0.3, -0.09);
      const smallBag = bag(navy, wordmark("#071846", "#ffffff"), 0.71);
      smallBag.position.set(-1.45, -0.45, -0.85);
      smallBag.rotation.set(0, 0.3, 0.12);

      const gift = new THREE.Group();
      installation.add(gift);
      gift.position.set(1.6, -1.25, 1.25);
      gift.rotation.y = -0.35;
      mesh(new THREE.BoxGeometry(1.35, 0.64, 1.08), ink, gift);
      mesh(new THREE.BoxGeometry(1.42, 0.13, 1.15), ink, gift).position.y = 0.37;
      mesh(new THREE.BoxGeometry(0.16, 0.79, 1.17), gold, gift).position.y = 0.03;
      mesh(new THREE.BoxGeometry(1.44, 0.79, 0.16), gold, gift).position.y = 0.03;
      for (const side of [-1, 1]) {
        const loop = mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 40), gold, gift);
        loop.position.set(side * 0.2, 0.57, 0);
        loop.scale.set(1, 0.55, 1);
        loop.rotation.set(0.35, side * 0.28, side * 0.3);
      }

      let narrow = false;
      let visible = true;
      let frame = 0;
      let time = 0;
      let previous = 0;
      let pointerX = 0;
      let pointerY = 0;
      const resize = () => {
        const { width, height } = element!.getBoundingClientRect();
        if (!width || !height) return;
        narrow = width < 760;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.position.set(0, narrow ? 2.3 : 2.4, narrow ? 12 : 10.5);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        installation.position.set(narrow ? 0 : Math.min(width / height * 1.1, 2.4), narrow ? -1.8 : -0.02, 0);
        installation.scale.setScalar(narrow ? 0.71 : 1);
        floor.position.y = narrow ? -3.15 : -1.9;
        renderer.render(scene, camera);
      };
      const tick = (now: number) => {
        time += previous ? Math.min((now - previous) / 1000, 0.05) : 0;
        previous = now;
        largeBag.position.y = 0.2 + Math.sin(time * 0.65) * 0.12;
        largeBag.rotation.y = -0.3 + Math.sin(time * 0.35) * 0.13;
        smallBag.position.y = -0.45 + Math.sin(time * 0.65 + 1.8) * 0.1;
        gift.rotation.y = -0.35 + Math.sin(time * 0.4) * 0.09;
        installation.rotation.y += (pointerX * 0.1 - installation.rotation.y) * 0.04;
        installation.rotation.x += (pointerY * 0.035 - installation.rotation.x) * 0.04;
        renderer.render(scene, camera);
        renderer.domElement.dataset.frame = String(++frame);
      };
      const updateLoop = () => {
        previous = 0;
        renderer.setAnimationLoop(visible && !document.hidden && !pausedRef.current ? tick : null);
        renderer.render(scene, camera);
      };
      const move = (event: PointerEvent) => {
        if (pausedRef.current || event.pointerType === "touch") return;
        const rect = element!.getBoundingClientRect();
        pointerX = (event.clientX - rect.left) / rect.width * 2 - 1;
        pointerY = (event.clientY - rect.top) / rect.height * 2 - 1;
      };
      const leave = () => { pointerX = 0; pointerY = 0; };
      const lost = (event: Event) => { event.preventDefault(); renderer.setAnimationLoop(null); setReady(false); };
      const observer = new ResizeObserver(resize);
      observer.observe(element!);
      const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; updateLoop(); });
      intersection.observe(element!);
      document.addEventListener("visibilitychange", updateLoop);
      element!.addEventListener("pointermove", move);
      element!.addEventListener("pointerleave", leave);
      renderer.domElement.addEventListener("webglcontextlost", lost);
      control.current = updateLoop;
      resize();
      updateLoop();
      setReady(true);
      dispose = () => {
        renderer.setAnimationLoop(null);
        observer.disconnect();
        intersection.disconnect();
        document.removeEventListener("visibilitychange", updateLoop);
        element!.removeEventListener("pointermove", move);
        element!.removeEventListener("pointerleave", leave);
        renderer.domElement.removeEventListener("webglcontextlost", lost);
        const materials = new Set<InstanceType<typeof THREE.Material>>();
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
          }
        });
        materials.forEach((material) => material.dispose());
        textures.forEach((texture) => texture.dispose());
        environment.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        control.current = null;
      };
    }
    void mount().catch(() => { if (!cancelled) setReady(false); });
    return () => { cancelled = true; dispose(); };
  }, []);

  return <div className="fashion-scene" ref={host} aria-hidden="true" data-ready={ready}>
    {!ready && <div className="fashion-scene-fallback"><img src="/logonavbar.svg" alt="" /></div>}
  </div>;
}
