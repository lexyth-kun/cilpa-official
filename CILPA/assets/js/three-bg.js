const canvas = document.getElementById('three-bg');
if (canvas) {
  const pointer = { x: 0, y: 0 };
  let isTabVisible = true;
  let animId = null;

  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive:true });

  document.addEventListener('visibilitychange', () => {
    isTabVisible = !document.hidden;
  });

  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 120);
    camera.position.set(0, 0, 7);

    // Optimized DPR capping to 1.5 prevents GPU fillrate throttling on 4K/Retina displays
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    const group = new THREE.Group();
    scene.add(group);

    const violet = new THREE.Color(0x6c6bf3);
    const lilac = new THREE.Color(0xbab8ff);
    const deep = new THREE.Color(0x302d8f);

    const coreGeo = new THREE.IcosahedronGeometry(1.2, 3);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x6c6bf3,
      wireframe: true,
      transparent: true,
      opacity: 0.16
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(2.4, 0.35, -1.4);
    group.add(core);

    const ringGeo = new THREE.TorusGeometry(1.92, 0.012, 8, 120);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x6c6bf3, transparent: true, opacity: 0.18 });
    const rings = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(ringGeo, ringMat.clone());
      ring.position.copy(core.position);
      ring.rotation.x = Math.PI * 0.22 * i;
      ring.rotation.y = Math.PI * 0.34 * i;
      ring.material.opacity = 0.13 + i * 0.04;
      rings.push(ring);
      group.add(ring);
    }

    const particleCount = 140;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 12;
      positions[i3 + 1] = (Math.random() - 0.5) * 7;
      positions[i3 + 2] = (Math.random() - 0.5) * 7;
      const c = i % 3 === 0 ? violet : (i % 3 === 1 ? lilac : deep);
      colors[i3] = c.r; colors[i3 + 1] = c.g; colors[i3 + 2] = c.b;
      speeds[i] = 0.25 + Math.random() * 0.95;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.032,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    const lineCount = 50;
    const linePositions = new Float32Array(lineCount * 2 * 3);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const line = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0x6c6bf3, transparent: true, opacity: 0.10 }));
    group.add(line);

    const waveGeo = new THREE.PlaneGeometry(9.5, 4.8, 36, 18);
    const waveMat = new THREE.MeshBasicMaterial({ color: 0x6c6bf3, wireframe: true, transparent: true, opacity: 0.04 });
    const wave = new THREE.Mesh(waveGeo, waveMat);
    wave.position.set(0, -1.8, -2.7);
    wave.rotation.x = -0.72;
    scene.add(wave);

    let resizeTimer = null;
    function resize(){
      const width = canvas.clientWidth || canvas.offsetWidth || window.innerWidth;
      const height = canvas.clientHeight || canvas.offsetHeight || 720;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }

    function animate(t){
      if (isTabVisible) {
        const time = t * 0.001;
        const scroll = (window.scrollY || 0) * 0.0003;
        camera.position.x += (pointer.x * 0.35 - camera.position.x) * 0.03;
        camera.position.y += (pointer.y * 0.25 - camera.position.y) * 0.03;
        camera.lookAt(0, 0, 0);

        group.rotation.y = Math.sin(time * 0.18) * 0.12 + pointer.x * 0.05 + scroll;
        group.rotation.x = Math.cos(time * 0.16) * 0.04 - pointer.y * 0.03;
        core.rotation.x = time * 0.20;
        core.rotation.y = time * 0.30;
        rings.forEach((ring, i) => {
          ring.rotation.x += 0.002 + i * 0.0008;
          ring.rotation.y += 0.003 + i * 0.001;
        });

        const p = particleGeo.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          p[i3 + 1] += Math.sin(time * speeds[i] + i) * 0.0015;
          p[i3] += Math.cos(time * speeds[i] + i * 0.15) * 0.0008;
        }
        particleGeo.attributes.position.needsUpdate = true;

        const lp = lineGeo.attributes.position.array;
        let ptr = 0;
        for (let i = 0; i < lineCount; i++) {
          const a = (i * 2) % particleCount;
          const b = (a + 7 + (i % 9)) % particleCount;
          const a3 = a * 3;
          const b3 = b * 3;
          lp[ptr++] = p[a3]; lp[ptr++] = p[a3 + 1]; lp[ptr++] = p[a3 + 2];
          lp[ptr++] = p[b3]; lp[ptr++] = p[b3 + 1]; lp[ptr++] = p[b3 + 2];
        }
        lineGeo.attributes.position.needsUpdate = true;

        const w = wave.geometry.attributes.position;
        for (let i = 0; i < w.count; i++) {
          const x = w.getX(i);
          const y = w.getY(i);
          w.setZ(i, Math.sin(x * 1.4 + time) * 0.09 + Math.cos(y * 1.8 + time * 0.7) * 0.05);
        }
        wave.geometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
      }
      animId = requestAnimationFrame(animate);
    }
    resize();
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 80);
    });
    animId = requestAnimationFrame(animate);
  } catch (err) {
    // Canvas 2D Lightweight Fallback
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1;
    const dots = Array.from({ length: 60 }, () => ({
      x: Math.random(), y: Math.random(), r: 1 + Math.random() * 2.5,
      dx: (Math.random() - 0.5) * 0.0008, dy: (Math.random() - 0.5) * 0.0008,
      a: 0.15 + Math.random() * 0.2
    }));
    function resize(){
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || 720;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(t){
      if (isTabVisible) {
        ctx.clearRect(0, 0, w, h);
        const grad = ctx.createRadialGradient(w * 0.72, h * 0.22, 10, w * 0.72, h * 0.22, w * 0.55);
        grad.addColorStop(0, 'rgba(108,107,243,0.16)');
        grad.addColorStop(1, 'rgba(108,107,243,0)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
        dots.forEach((dot, i) => {
          dot.x += dot.dx; dot.y += dot.dy;
          if(dot.x < 0 || dot.x > 1) dot.dx *= -1;
          if(dot.y < 0 || dot.y > 1) dot.dy *= -1;
          const x = dot.x * w + Math.sin(t / 1000 + i) * 12;
          const y = dot.y * h + Math.cos(t / 1200 + i) * 10;
          ctx.beginPath();
          ctx.fillStyle = `rgba(108,107,243,${dot.a})`;
          ctx.arc(x, y, dot.r, 0, Math.PI * 2); ctx.fill();
        });
      }
      requestAnimationFrame(draw);
    }
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(draw);
  }
}
