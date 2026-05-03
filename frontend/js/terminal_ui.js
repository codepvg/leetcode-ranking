document.addEventListener("DOMContentLoaded", () => {
    // 1. Title Typist Effect
    const titles = document.querySelectorAll('.page-title');
    
    // Only type out on about, leaderboard, registration, NOT the main index which has its own decrypt effect
    if (!document.querySelector('.decryption-title')) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if(entry.isIntersecting && !entry.target.dataset.typed) {
                    entry.target.dataset.typed = 'true';
                    typeOut(entry.target);
                }
            });
        }, { threshold: 0.1 });

        titles.forEach(title => {
            title.dataset.original = title.innerText.trim();
            title.innerText = "";
            observer.observe(title);
        });

        function typeOut(element) {
            const text = element.dataset.original;
            let i = 0;
            const interval = setInterval(() => {
                element.innerText = text.substring(0, i + 1);
                i++;
                if(i >= text.length) clearInterval(interval);
            }, 60);
        }
    }

    // 2. Mock Bash Form Inputs
    const formInputs = document.querySelectorAll('.form-input');
    
    formInputs.forEach(input => {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-input-bash-wrapper';
        
        input.parentNode.insertBefore(wrapper, input);
        
        const prefix = document.createElement('span');
        prefix.className = 'bash-prefix';
        
        // Use query-style wording — we are LOOKING UP an existing LeetCode UID, not setting one
        const cmdName = input.id === 'leetcodeId' ? 'uid' : input.id;
        const fullPrefix = `> query --${cmdName}="`;
        
        const suffix = document.createElement('span');
        suffix.className = 'bash-suffix';
        suffix.innerText = '"';
        
        wrapper.appendChild(prefix);
        wrapper.appendChild(input);
        wrapper.appendChild(suffix);
        
        // Remove structural borders from the input so the flex wrapper handles all boundaries
        input.classList.add('bash-active');
        
        // Save original placeholder
        const originalPlaceholder = input.placeholder;
        
        let typeInt;
        
        input.addEventListener('focus', () => {
            if (prefix.innerText === fullPrefix) return; // Already rendered
            
            // Clear placeholder and any existing value so the command prompt starts clean
            input.placeholder = "";
            input.value = "";
            
            clearInterval(typeInt);
            let i = 0;
            prefix.innerText = "";
            suffix.style.opacity = '0';
            
            typeInt = setInterval(() => {
                prefix.innerText = fullPrefix.substring(0, i + 1);
                i++;
                if(i >= fullPrefix.length) {
                    clearInterval(typeInt);
                    suffix.style.opacity = '1';
                }
            }, 25);
        });
        
        input.addEventListener('blur', () => {
            if (input.value === '') {
                clearInterval(typeInt);
                input.placeholder = originalPlaceholder;
                prefix.innerText = '';
                suffix.style.opacity = '0';
            }
        });
    });
});
