module.exports = function getVerifyView(email, error = null) {
    return `
        <style>
            header, footer { display: none !important; }
            body { background-color: #f9f9f9 !important; }
            html.dark body { background-color: #000000 !important; }
        </style>

        <div class="min-h-screen flex flex-col items-center pt-16 px-4">
            
            <div class="mb-8 flex items-center justify-center gap-6 w-full max-w-[420px]">
                <img src="/xpm-logo.png" alt="XPM Logo" class="h-10 w-auto opacity-90">
                <button type="button" class="theme-toggle-btn text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors cursor-pointer focus:outline-none">
                <i data-lucide="moon" class="w-4 h-4 block dark:hidden"></i>
                <i data-lucide="sun" class="w-4 h-4 hidden dark:block"></i>
            </button>
            </div>

            <div class="w-full max-w-[420px] bg-white dark:bg-[#111111] shadow-[0_4px_12px_rgb(0,0,0,0.05)] border border-gray-200 dark:border-gray-700 rounded p-8">
                
                <div class="w-[140px] h-[140px] bg-[#e6e6e6] dark:bg-[#21262d] rounded-full mx-auto mb-6 flex items-center justify-center overflow-hidden">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#b3b3b3" stroke-width="1.5" class="w-16 h-16"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>

                <h2 class="text-[22px] font-normal text-gray-800 dark:text-gray-200 mb-2">Check your email</h2>
                <hr class="border-t border-gray-100 dark:border-gray-800 mb-6">

                <p class="text-[14px] text-gray-600 dark:text-gray-400 mb-6 text-center">We sent a verification code to <br><span class="font-bold text-gray-900 dark:text-gray-100">${email}</span></p>

                ${error ? `
                <div class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-medium">
                    ${error}
                </div>
                ` : ''}

                <form action="/verify" method="POST" class="space-y-6" id="verifyForm">
                    <input type="hidden" name="email" value="${email}">
                    
                    <div>
                        <label for="otp" class="block text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-1.5 text-center">Authentication Code</label>
                        <input id="otp" name="otp" type="text" required maxlength="6" placeholder="------" class="block w-full px-3 py-4 border border-gray-300 dark:border-gray-600 rounded-[3px] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-shadow text-center text-3xl font-mono tracking-[0.5em] uppercase text-gray-800 dark:text-gray-200">
                    </div>

                    <div class="pt-2">
                        <button type="submit" id="submitBtn" class="w-full py-2.5 px-4 border border-transparent rounded-[3px] text-[14px] font-bold text-gray-400 bg-[#f4f4f4] dark:bg-[#21262d] dark:text-gray-500 transition-colors" disabled>
                            Verify Account
                        </button>
                    </div>
                </form>
                
                <div class="mt-8 text-center">
                    <p class="text-[13px] text-gray-500 dark:text-gray-400">Didn't receive the email? Check your spam folder.</p>
                </div>
            </div>
        </div>
        
        <script>
            // Button active state logic
            const form = document.getElementById('verifyForm');
            const submitBtn = document.getElementById('submitBtn');
            const otpInput = document.getElementById('otp');

            otpInput.addEventListener('input', function() {
                if (this.value.trim().length >= 6) {
                    submitBtn.disabled = false;
                    submitBtn.className = "w-full py-2.5 px-4 border border-transparent rounded-[3px] text-[14px] font-bold text-white bg-[#24292e] hover:bg-black transition-colors cursor-pointer";
                } else {
                    submitBtn.disabled = true;
                    submitBtn.className = "w-full py-2.5 px-4 border border-transparent rounded-[3px] text-[14px] font-bold text-gray-400 bg-[#f4f4f4] dark:bg-[#21262d] dark:text-gray-500 transition-colors cursor-not-allowed";
                }
            });
        </script>
    `;
};
