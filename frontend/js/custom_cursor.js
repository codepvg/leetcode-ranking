const cursor = document.querySelector(".custom-cursor");

let lastTrail = 0;

document.addEventListener("mousemove", (e) => {
  cursor.style.left = e.clientX + "px";
  cursor.style.top = e.clientY + "px";

  const now = Date.now();

    if (now - lastTrail > 20) {
    lastTrail = now;

    const trail = document.createElement("div");
    trail.className = "trail";

    trail.style.left = e.clientX + "px";
    trail.style.top = e.clientY + "px";

    document.body.appendChild(trail);

    setTimeout(() => {
    trail.remove();
    }, 500);
  }
});