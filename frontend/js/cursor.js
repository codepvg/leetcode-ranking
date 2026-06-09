if ("ontouchstart" in window) {
  // Disable on touch devices
} else {
  const cursor = document.createElement("div");
  cursor.className = "matrix-cursor";
  document.body.appendChild(cursor);

  const particles = [];

  let mouseX = 0;
  let mouseY = 0;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    createParticle(mouseX, mouseY);
  });

  function createParticle(x, y) {
    const particle = document.createElement("div");
    particle.className = "cursor-particle";

    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    document.body.appendChild(particle);

    particles.push({
      element: particle,
      life: 1,
    });
  }

  function animate() {
    cursor.style.left = `${mouseX}px`;
    cursor.style.top = `${mouseY}px`;

    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].life -= 0.05;

      particles[i].element.style.opacity = particles[i].life;
      particles[i].element.style.transform =
        `translate(-50%, -50%) scale(${particles[i].life})`;

      if (particles[i].life <= 0) {
        particles[i].element.remove();
        particles.splice(i, 1);
      }
    }

    if (particles.length > 12) {
      particles[0].element.remove();
      particles.shift();
    }

    requestAnimationFrame(animate);
  }

  animate();
}