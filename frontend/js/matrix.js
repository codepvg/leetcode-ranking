document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("matrix-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  let lastWidth = window.innerWidth;

  // Full screen size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    // Use screen height to ensure canvas is always tall enough, preventing
    // gaps when mobile browser URL bars hide/show on scroll.
    canvas.height = Math.max(
      window.innerHeight,
      window.screen ? window.screen.height : 0,
    );
  }

  // Initial resize
  resizeCanvas();

  // Matrix characters - mixing katakana, digits, and some leetcode symbols
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>/?~ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";
  const charArray = chars.split("");

  const fontSize = 14;
  let columns = Math.ceil(canvas.width / fontSize);

  // Array to store the vertical position of each column
  const drops = [];
  for (let i = 0; i < columns; i++) {
    drops[i] = Math.random() * -100;
  }

  window.addEventListener("resize", () => {
    // Only trigger matrix buffer reset if the width changes (e.g., orientation change / desktop resize)
    // This stops mobile overscroll/URL bar behaviors from constantly wiping the matrix clean
    if (window.innerWidth !== lastWidth) {
      resizeCanvas();
      columns = Math.ceil(canvas.width / fontSize);
      const oldDropsLen = drops.length;

      if (columns > oldDropsLen) {
        for (let i = oldDropsLen; i < columns; i++) {
          drops[i] = Math.random() * -100;
        }
      }
      lastWidth = window.innerWidth;
    }
  });

  const FPS = 30; // Matrix looks better slightly choppy/retro

  function draw() {
    // Subtle semi-transparent black background creates the fading trail effect
    // The alpha value controls the length of the trail
    ctx.fillStyle = "rgba(10, 10, 10, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = fontSize + "px 'Fira Code', monospace";

    // Draw the characters
    for (let i = 0; i < drops.length; i++) {
      // Pick a random character
      const text = charArray[Math.floor(Math.random() * charArray.length)];

      // Give the "head" of the drop a brighter, whiter-green look occasionally
      // and the tail a standard terminal green.
      if (Math.random() > 0.95) {
        ctx.fillStyle = "#b0ffb0"; // bright text
      } else {
        ctx.fillStyle = "#00ff41"; // core green
      }

      // x coordinate = column index * font size
      // y coordinate = drop tracked value * font size
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      // Draw character
      ctx.fillText(text, x, y);

      // Once the drop crosses the bottom of the canvas, randomly reset it to the top
      // to keep the rain continuous
      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }

      // Drop falls by 1 unit
      drops[i]++;
    }
  }

  // We don't want the matrix to be super smooth 60fps, Matrix screens look good around 30fps
  setInterval(draw, 1000 / FPS);
});
