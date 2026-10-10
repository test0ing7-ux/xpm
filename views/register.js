module.exports = function getRegisterView(error = null, sitekey = null) {
    return `
        <style>
            header, footer { display: none !important; }
            body { background-color: #f9f9f9 !important; }
            html.dark body { background-color: #1f1f1f !important; }
        </style>
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

        <div class="min-h-screen flex flex-col items-center pt-16 px-4 pb-12">
            
            <div class="mb-8 flex items-center justify-center gap-6 w-full max-w-[420px]">
                <img src="/xpm-logo.png" alt="XPM Logo" class="h-10 w-auto opacity-90 dark:invert">
                <button type="button" class="theme-toggle-btn text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors cursor-pointer focus:outline-none">
                <i data-lucide="moon" class="w-4 h-4 block dark:hidden"></i>
                <i data-lucide="sun" class="w-4 h-4 hidden dark:block"></i>
            </button>
            </div>

            <!-- Sign Up Card -->
            <div class="w-full max-w-[420px] bg-white dark:bg-[#242424] shadow-[0_4px_12px_rgb(0,0,0,0.05)] border border-gray-200 dark:border-gray-700 rounded p-8 mb-6">
                
                <h2 class="text-[22px] font-normal text-gray-800 dark:text-gray-200 mb-2">Sign Up</h2>
                <hr class="border-t border-gray-100 dark:border-gray-800 mb-6">

                ${error ? `
                <div class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-medium">
                    ${error}
                </div>
                ` : ''}

                <form action="/register" method="POST" class="space-y-5" id="registerForm">
                    
                    <div>
                        <label for="username" class="block text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-1.5">Username *</label>
                        <input id="username" name="username" type="text" pattern="[a-zA-Z0-9_-]{3,20}" required class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-[3px] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-shadow text-[14px] font-mono">
                    </div>

                    <div class="hidden">
                        <!-- Keep displayName for backend compatibility, auto-filled via JS -->
                        <input id="displayName" name="displayName" type="text" class="hidden">
                    </div>

                    <div>
                        <label for="email" class="block text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-1.5">Email address</label>
                        <input id="email" name="email" type="email" required class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-[3px] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-shadow text-[14px]">
                        <p class="mt-2 text-[12px] text-gray-500 dark:text-gray-400 leading-tight">Your email address will be added to the metadata of packages that you publish, so it may be seen publicly.</p>
                    </div>

                    <div>
                        <label for="password" class="block text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-1.5">Password</label>
                        <div class="relative flex border border-gray-300 dark:border-gray-600 rounded-[3px] focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-shadow">
                            <input id="password" name="password" type="password" minlength="8" required class="block w-full px-3 py-2 focus:outline-none text-[14px] bg-transparent dark:text-white">
                            <button type="button" id="togglePassword" class="px-4 border-l border-gray-300 dark:border-gray-600 text-[13px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:bg-[#000000] font-medium bg-white dark:bg-[#111111] rounded-r-[3px]">Show</button>
                        </div>
                        <p class="mt-2 text-[12px] text-gray-500 dark:text-gray-400 leading-tight">Minimum of 8 characters and must meet our password guidelines.</p>
                    </div>

                    <div class="flex items-start pt-2">
                        <div class="flex items-center h-5">
                            <input id="terms" name="terms" type="checkbox" required class="w-3.5 h-3.5 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded focus:ring-black accent-black cursor-pointer">
                        </div>
                        <div class="ml-2 text-[12px] text-gray-700 dark:text-gray-300">
                            <label for="terms" class="cursor-pointer">I agree to the <a href="#" class="text-[#0969da] hover:underline">End User License Agreement</a> and the <a href="#" class="text-[#0969da] hover:underline">Privacy Policy</a>. *</label>
                        </div>
                    </div>

                    ${sitekey ? `
                    <div class="pt-2 flex justify-center">
                        <div class="cf-turnstile" data-sitekey="${sitekey}" data-action="register"></div>
                    </div>
                    ` : ''}

                    <div class="pt-2">
                        <button type="submit" id="submitBtn" class="w-full py-2.5 px-4 border border-transparent rounded-[3px] text-[14px] font-bold text-gray-400 bg-[#f4f4f4] dark:bg-[#21262d] dark:text-gray-500 transition-colors" disabled>
                            Create an Account
                        </button>
                    </div>
                </form>
            </div>
            
            <!-- Outside Footer Links -->
            <div class="text-center w-full max-w-[420px]">
                <p class="text-[13px] font-bold text-gray-800 dark:text-gray-200 mb-1">Already have an account?</p>
                <a href="/login" class="text-[13px] font-medium text-[#0969da] hover:underline">Sign In</a>
            </div>
        </div>
        
        <script>
            // Auto-fill hidden displayName field to keep backend happy
            document.getElementById('username').addEventListener('input', function(e) {
                document.getElementById('displayName').value = e.target.value;
            });

            // Show/Hide Password
            const togglePassword = document.getElementById('togglePassword');
            const password = document.getElementById('password');
            
            togglePassword.addEventListener('click', function () {
                const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
                password.setAttribute('type', type);
                this.textContent = type === 'password' ? 'Show' : 'Hide';
            });

            // Button active state logic
            const form = document.getElementById('registerForm');
            const submitBtn = document.getElementById('submitBtn');
            const inputs = form.querySelectorAll('input[required]');

            function checkForm() {
                let isValid = true;
                inputs.forEach(input => {
                    if (input.type === 'checkbox') {
                        if (!input.checked) isValid = false;
                    } else if (!input.value.trim()) {
                        isValid = false;
                    }
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
                if (input.type === 'checkbox') {
                    input.addEventListener('change', checkForm);
                }
            });
        </script>
    `;
};
