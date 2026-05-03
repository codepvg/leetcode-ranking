document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("matrix-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Full screen size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // Initial resize and add listener
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Matrix characters - mixing katakana, digits, and some leetcode symbols
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>/?~ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ";
    const charArray = chars.split("");

    const fontSize = 14;
    let columns = canvas.width / fontSize;
    
    // Array to store the vertical position of each column
    // 1 = 1 drop initially
    const drops = [];
    for (let i = 0; i < columns; i++) {
        // Randomize initial positions so they don't all fall in a straight line at once
        drops[i] = Math.random() * -100;
    }

    // Refresh columns on resize
    window.addEventListener("resize", () => {
        columns = canvas.width / fontSize;
        const oldDropsLen = drops.length;
        
        if (columns > oldDropsLen) {
            for (let i = oldDropsLen; i < columns; i++) {
                // Add new drops if screen gets wider, start them off screen randomly
                drops[i] = Math.random() * -100;
            }
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
