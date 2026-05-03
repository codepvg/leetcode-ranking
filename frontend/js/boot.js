document.addEventListener("DOMContentLoaded", () => {
    // Hide hero content initially
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.opacity = '0';
        heroContent.style.visibility = 'hidden';
    }

    // Create the boot overlay container
    const bootOverlay = document.createElement('div');
    bootOverlay.className = 'boot-overlay';

    // Create an inner wrapper to center the text block
    const bootInner = document.createElement('div');
    bootInner.className = 'boot-inner';
    bootOverlay.appendChild(bootInner);

    document.body.appendChild(bootOverlay);

    const bootLines = [
        "CodePVG_OS v2.4.1 (tty1)",
        "",
        "[  0.041] initializing kernel...",
        "[  0.089] loading core modules.............. [OK]",
        "[  0.124] mounting file systems............. [OK]",
        "[  0.201] establishing secure connection.... [OK]",
        "[  0.345] fetching leetcode user data....... [OK]",
        "[  0.412] resolving rank algorithms......... [OK]",
        "[  0.589] loading matrix_rain.sh............ [OK]",
        "[  0.640] starting UI service............... [OK]",
        "",
        "system ready.",
        "$ exec dashboard"
    ];

    let currentLine = 0;

    // Function to rapidly print lines
    function printNextLine() {
        if (currentLine < bootLines.length) {
            const line = document.createElement('div');
            line.className = 'boot-line';

            // Highlight [OK] in green
            let text = bootLines[currentLine];
            if (text.includes('[OK]')) {
                text = text.replace('[OK]', '<span class="boot-ok">[OK]</span>');
            }

            line.innerHTML = text;
            bootInner.appendChild(line);

            // Auto scroll to bottom
            bootOverlay.scrollTop = bootOverlay.scrollHeight;

            currentLine++;

            // Random slower delay between 80ms and 250ms
            const delay = Math.random() * 170 + 80;
            setTimeout(printNextLine, delay);
        } else {
            // Finish sequence
            setTimeout(() => {
                bootOverlay.classList.add('fade-out');

                setTimeout(() => {
                    bootOverlay.remove();
                    if (heroContent) {
                        heroContent.style.visibility = 'visible';
                        heroContent.style.animation = 'fadeIn 0.8s ease-out forwards';
                        document.dispatchEvent(new Event('bootSequenceComplete'));
                    }
                }, 400); // Wait for fade out
            }, 400); // Short pause before fading out
        }
    }

    // Start boot sequence
    setTimeout(printNextLine, 200); // Initial small delay
});
