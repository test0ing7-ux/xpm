module.exports = function getLoginView(error = null) {
    return `
        <style>
            /* Hide the standard layout navbar and footer for the dedicated auth view */
            header, footer { display: none !important; }
            body { background-color: #f9f9f9 !important; }
            html.dark body { background-color: #1f1f1f !important; }
        </style>

        <div class="min-h-screen flex flex-col items-center pt-16 px-4">
            
            <!-- Exact NPM-style standalone logo header -->
            <div class="mb-8 flex items-center justify-center gap-6 w-full max-w-[420px]">
                <img src="/xpm-logo.png" alt="XPM Logo" class="h-10 w-auto opacity-90 dark:invert">
                <button type="button" class="theme-toggle-btn text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors cursor-pointer focus:outline-none">
                <i data-lucide="moon" class="w-4 h-4 block dark:hidden"></i>
                <i data-lucide="sun" class="w-4 h-4 hidden dark:block"></i>
            </button>
            </div>

            <!-- Auth Card -->
            <div class="w-full max-w-[420px] bg-white dark:bg-[#242424] shadow-[0_4px_12px_rgb(0,0,0,0.05)] border border-gray-200 dark:border-gray-700 rounded p-8">
                
                <!-- Illustration Circle -->
                <div class="relative w-[140px] h-[140px] bg-[#e6e6e6] dark:bg-[#333333] rounded-full mx-auto mb-6 flex items-center justify-center overflow-hidden shadow-inner p-5 border-4 border-white dark:border-[#242424]">
                    <img src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f435.svg" alt="Monkey Mascot" class="w-[85%] h-[85%] object-contain drop-shadow-sm transition-transform duration-300">
                    
                    <!-- Password Shutter -->
                    <div id="password-shutter" class="absolute inset-0 bg-white dark:bg-[#1f1f1f] flex items-center justify-center -translate-y-full transition-transform duration-300 ease-in-out border-b-8 border-[#e6e6e6] dark:border-[#333]">
                        <img src="/xpm-logo.png" class="w-16 opacity-30 dark:opacity-100 dark:invert">
                    </div>
                </div>

                <h2 class="text-[22px] font-normal text-gray-800 dark:text-gray-200 mb-2">Sign In</h2>
                <hr class="border-t border-gray-100 dark:border-gray-800 mb-6">

                ${error ? `
                <div class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-medium">
                    ${error}
                </div>
                ` : ''}

                <form action="/login" method="POST" class="space-y-5" id="loginForm">
                    <div>
                        <label for="email" class="block text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-1.5">Email address</label>
                        <input id="email" name="email" type="email" required class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-[3px] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-shadow text-[14px]">
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-1.5">
                            <label for="password" class="block text-[13px] font-bold text-gray-900 dark:text-gray-100">Password</label>
                            <a href="#" class="text-[13px] font-medium text-[#0969da] hover:underline">Forgot password?</a>
                        </div>
                        <div class="relative flex border border-gray-300 dark:border-gray-600 rounded-[3px] focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-shadow">
                            <input id="password" name="password" type="password" required class="block w-full px-3 py-2 focus:outline-none text-[14px] bg-transparent dark:text-white">
                            <button type="button" id="togglePassword" class="px-4 border-l border-gray-300 dark:border-gray-600 text-[13px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:bg-[#000000] font-medium bg-white dark:bg-[#111111] rounded-r-[3px]">Show</button>
                        </div>
                    </div>

                    <div class="pt-2">
                        <button type="submit" id="submitBtn" class="w-full py-2.5 px-4 border border-transparent rounded-[3px] text-[14px] font-bold text-gray-400 bg-[#f4f4f4] dark:bg-[#21262d] dark:text-gray-500 transition-colors" disabled>
                            Sign In
                        </button>
                    </div>
                </form>
                
                <div class="mt-8 text-center">
                    <a href="/register" class="text-[14px] font-medium text-[#0969da] hover:underline">Create Account</a>
                </div>
            </div>
        </div>
        
        <script>
            // Show/Hide Password
            const togglePassword = document.getElementById('togglePassword');
            const password = document.getElementById('password');
            
            togglePassword.addEventListener('click', function () {
                const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
                password.setAttribute('type', type);
                this.textContent = type === 'password' ? 'Show' : 'Hide';
            });

            // Shutter Logic
            const shutter = document.getElementById('password-shutter');
            password.addEventListener('focus', () => {
                shutter.classList.remove('-translate-y-full');
                shutter.classList.add('translate-y-0');
            });
            password.addEventListener('blur', () => {
                shutter.classList.remove('translate-y-0');
                shutter.classList.add('-translate-y-full');
            });

            // Button active state logic (matches NPM behavior)
            const form = document.getElementById('loginForm');
            const submitBtn = document.getElementById('submitBtn');
            const inputs = form.querySelectorAll('input[required]');

            function checkForm() {
                let isValid = true;
                inputs.forEach(input => {
                    if (!input.value.trim()) isValid = false;
                });
                
                if (isValid) {
                    submitBtn.disabled = false;
                    submitBtn.className = "w-full py-2.5 px-4 border border-transparent rounded-[3px] text-[14px] font-bold text-white bg-[#24292e] hover:bg-black transition-colors cursor-pointer";
                } else {
                    submitBtn.disabled = true;
                    submitBtn.className = "w-full py-2.5 px-4 border border-transparent rounded-[3px] text-[14px] font-bold text-gray-400 bg-[#f4f4f4] dark:bg-[#21262d] dark:text-gray-500 transition-colors cursor-not-allowed";
                }
            }

            inputs.forEach(input => {
                input.addEventListener('input', checkForm);
            });
        </script>
    `;
};
