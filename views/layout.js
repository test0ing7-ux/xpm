module.exports = function getLayout(content, user = null, notification = null) {
    return `
    <!DOCTYPE html>
    <html lang="en" class="antialiased">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>XPM - Windows Package Registry</title>
        
        <link rel="icon" type="image/svg+xml" href="/xpm-blue-favicon.svg">
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/lucide@latest"></script>
        <script>
            tailwind.config = { darkMode: 'class',
                theme: {
                    extend: {
                        fontFamily: {
                            sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
                            mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
                        }
                    }
                }
            }
        </script>
    
        <script>
            // Prevent FOUC
            if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            
            // Global toggle function
            document.addEventListener('DOMContentLoaded', () => {
                document.addEventListener('click', (e) => {
                    const btn = e.target.closest('.theme-toggle-btn');
                    if (btn) {
                        document.documentElement.classList.toggle('dark');
                        if (document.documentElement.classList.contains('dark')) {
                            localStorage.theme = 'dark';
                        } else {
                            localStorage.theme = 'light';
                        }
                    }
                });
            });
        </script>
</head>
    <body class="bg-gray-50 dark:bg-[#000000] text-gray-900 dark:text-gray-100 min-h-screen flex flex-col font-sans">
        
        <!-- Expandable Notification Banner / Gradient Stripe -->
        ${notification ? `
        <div id="top-banner" class="w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 transition-[height] duration-500 ease-in-out overflow-hidden" style="height: 40px;">
            <div id="banner-content" class="h-[40px] max-w-[1400px] mx-auto px-4 sm:px-8 flex items-center justify-center text-[14px] font-medium text-white relative transition-opacity duration-300">
                <span>${notification}</span>
                <button onclick="dismissBanner()" class="absolute right-4 p-1 hover:bg-white dark:bg-[#111111]/20 rounded-md transition-colors" title="Dismiss">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        </div>
        ` : `
        <div id="top-banner" class="w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600" style="height: 6px;"></div>
        `}
        
        <header id="main-header">
        <!-- Top Nav Row (Pro, Teams, etc) -->
        <div class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111111]"><div class="flex justify-between items-center px-4 sm:px-6 py-2.5 max-w-[1280px] mx-auto w-full">
            <div class="flex items-center gap-6 text-[13px] font-semibold text-gray-600 dark:text-gray-400">
                <button type="button" class="theme-toggle-btn text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors cursor-pointer focus:outline-none">
                <i data-lucide="moon" class="w-4 h-4 block dark:hidden"></i>
                <i data-lucide="sun" class="w-4 h-4 hidden dark:block"></i>
            </button>
                <a href="#" class="hover:text-black dark:text-white transition-colors">Pro</a>
                <a href="#" class="hover:text-black dark:text-white transition-colors">Teams</a>
                <a href="#" class="hover:text-black dark:text-white transition-colors">Pricing</a>
                <a href="/download" class="hover:text-black dark:text-white transition-colors text-[#cb3837] font-bold">Download</a>
                <a href="/help" class="hover:text-black dark:text-white transition-colors">Documentation</a>
            </div>
            <div class="flex items-center text-[13px] font-semibold text-gray-600 dark:text-gray-400">
                 <!-- Right side of top nav (empty for now) -->
            </div>
        </div></div>

        <!-- Main Search Row -->
        <div class="bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-gray-700"><div class="flex flex-col sm:flex-row items-center px-4 sm:px-6 py-4 gap-4 sm:gap-6 max-w-[1280px] mx-auto w-full">
            
            <!-- Logo -->
            <a href="/" class="flex-shrink-0">
                <img src="/xpm-logo.png" alt="XPM Logo" class="h-8 w-auto hover:opacity-80 transition-opacity">
            </a>
            
            <!-- Search Bar -->
            <div class="flex-1 w-full max-w-5xl flex bg-gray-100 border border-transparent focus-within:border-gray-300 dark:border-gray-600 transition-colors">
                <form action="/search" method="GET" class="relative flex-1 flex items-center w-full">
                    <i data-lucide="search" class="absolute left-4 w-5 h-5 text-gray-400"></i>
                    <input type="text" name="q" placeholder="Search packages" class="w-full bg-transparent py-3.5 pl-12 pr-4 text-[15px] outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500">
                </form>
                <button type="button" onclick="document.querySelector('form[action=\'/search\']').submit()" class="bg-[#231f20] hover:bg-black transition-colors text-white px-8 font-bold text-[15px] tracking-wide">
                    Search
                </button>
            </div>

            <!-- Auth / Avatar -->
            <div class="flex-shrink-0 flex items-center gap-2">
                ${user ? `
                    <a href="/profile">
                        <img src="${user.avatarUrl || 'https://ui-avatars.com/api/?name=U'}" alt="Avatar" class="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    </a>
                ` : `
                    <a href="/register" class="border border-gray-300 dark:border-gray-600 text-black dark:text-white px-4 py-2 text-[14px] font-bold hover:bg-gray-50 dark:bg-[#000000] transition-colors ml-2">Sign Up</a>
                    <a href="/login" class="text-black dark:text-white px-4 text-[14px] font-bold hover:text-gray-600 dark:text-gray-400 transition-colors">Sign In</a>
                `}
            </div>
        </div>
        
        </header>
        <!-- Main Content -->
        <main class="flex-grow flex flex-col">
            ${content}
        </main>

        <footer id="main-footer" class="bg-white dark:bg-[#111111] border-t border-gray-200 dark:border-gray-800 relative">
            <div class="max-w-[1280px] mx-auto px-4 sm:px-6 py-16 flex flex-col md:flex-row gap-16 md:gap-24">
                
                <!-- Left Icons -->
                <div class="flex flex-col gap-6">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="w-12 h-12 text-gray-800 dark:text-gray-200"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM6 16h4V10h2v6h2V8H6v8z"/></svg>
                    <svg viewBox="0 0 24 24" fill="currentColor" class="w-10 h-10 text-gray-800 dark:text-gray-200 ml-1"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>
                </div>

                <!-- Footer Columns -->
                <div class="grid grid-cols-2 md:grid-cols-3 gap-12 w-full">
                    <div>
                        <h3 class="text-[16px] font-bold text-gray-900 dark:text-gray-100 mb-6">Support</h3>
                        <ul class="space-y-4">
                            <li><a href="#" class="text-[15px] font-medium text-[#292e31] dark:text-gray-300 hover:text-black hover:underline">Help</a></li>
                            <li><a href="#" class="text-[15px] font-medium text-[#292e31] dark:text-gray-300 hover:text-black hover:underline">Advisories</a></li>
                            <li><a href="#" class="text-[15px] font-medium text-[#292e31] dark:text-gray-300 hover:text-black hover:underline">Status</a></li>
                            <li><a href="#" class="text-[15px] font-medium text-[#292e31] dark:text-gray-300 hover:text-black hover:underline">Contact XPM</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 class="text-[16px] font-bold text-gray-900 dark:text-gray-100 mb-6">Company</h3>
                        <ul class="space-y-4">
                            <li><a href="#" class="text-[15px] font-medium text-[#292e31] dark:text-gray-300 hover:text-black hover:underline">About</a></li>
                            <li><a href="#" class="text-[15px] font-medium text-[#292e31] dark:text-gray-300 hover:text-black hover:underline">Blog</a></li>
                            <li><a href="#" class="text-[15px] font-medium text-[#292e31] dark:text-gray-300 hover:text-black hover:underline">Press</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 class="text-[16px] font-bold text-gray-900 dark:text-gray-100 mb-6">Terms & Policies</h3>
                        <ul class="space-y-4">
                            <li><a href="#" class="text-[15px] font-medium text-[#292e31] dark:text-gray-300 hover:text-black hover:underline">Policies</a></li>
                            <li><a href="#" class="text-[15px] font-medium text-[#292e31] dark:text-gray-300 hover:text-black hover:underline">Terms of Use</a></li>
                            <li><a href="#" class="text-[15px] font-medium text-[#292e31] dark:text-gray-300 hover:text-black hover:underline">Code of Conduct</a></li>
                            <li><a href="/privacy" class="text-[15px] font-medium text-[#292e31] dark:text-gray-300 hover:text-black hover:underline">Privacy</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <!-- Bottom thick gradient line -->
            <div class="w-full h-[8px] bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 absolute bottom-0 left-0"></div>
        </footer>

        
        <script>
            function dismissBanner() {
                const banner = document.getElementById('top-banner');
                const content = document.getElementById('banner-content');
                content.style.opacity = '0';
                setTimeout(() => {
                    banner.style.height = '6px'; // Shrink exactly to h-1.5 (6px)
                }, 150);
            }
            lucide.createIcons();
        </script>

        </footer>
    </body>
    </html>
    `;
};
