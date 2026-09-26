module.exports = function getLayout(content, user) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XPM | The Professional Windows Package Manager</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown-light.min.css">
    <script src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js"></script>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #FAFAFA; color: #111827; }
        pre, code { font-family: 'JetBrains Mono', monospace; }
        .glass-nav { background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
        .gradient-text { background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-image: linear-gradient(135deg, #000000 0%, #4338CA 100%); }
        .btn-primary { background-color: #000; color: #fff; transition: all 0.2s ease; }
        .btn-primary:hover { background-color: #374151; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .btn-danger { background-color: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; transition: all 0.2s ease; }
        .btn-danger:hover { background-color: #FEE2E2; }
    </style>
</head>
<body class="antialiased min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
    
    <!-- Navbar -->
    <nav class="glass-nav fixed top-0 w-full z-50 border-b border-gray-200/80 transition-all duration-300">
        <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="/" class="text-xl font-extrabold tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div class="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-sm shadow-md">
                    <i data-lucide="terminal" class="w-4 h-4"></i>
                </div>
                XPM
            </a>
            
            <div class="hidden md:flex flex-1 max-w-xl mx-8 relative group">
                <form action="/search" method="GET" class="w-full relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i data-lucide="search" class="w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors"></i>
                    </div>
                    <input type="text" name="q" placeholder="Search for packages..." class="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50/50 text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm">
                </form>
            </div>

            <div class="flex items-center gap-6">
                <a href="/help" class="hidden sm:flex text-gray-500 hover:text-black text-sm font-medium transition-colors items-center gap-1">
                    <i data-lucide="life-buoy" class="w-4 h-4"></i> Help
                </a>
                ${user ? `
                    <div class="relative group cursor-pointer">
                        <a href="/profile" class="flex items-center gap-3">
                            <img src="${user.avatarUrl}" class="w-8 h-8 rounded-full border border-gray-200 shadow-sm object-cover">
                            <span class="text-sm font-semibold hidden sm:block">${user.displayName.split(' ')[0]}</span>
                        </a>
                    </div>
                ` : `
                    <a href="/auth/google" class="text-gray-600 hover:text-black font-medium text-sm transition-colors">Sign in</a>
                    <a href="/auth/google" class="btn-primary font-medium py-2 px-5 text-sm rounded-lg shadow-sm flex items-center gap-2">
                        Sign up
                    </a>
                `}
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-1 mt-16 flex flex-col">
        ${content}
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-200 bg-white py-12 mt-auto">
        <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div class="col-span-1 md:col-span-2">
                <div class="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-sm font-bold mb-4">
                    <i data-lucide="terminal" class="w-4 h-4"></i>
                </div>
                <p class="text-gray-500 text-sm mb-4 max-w-sm">The professional package manager designed exclusively for the modern Windows ecosystem.</p>
                <p class="text-gray-400 text-xs">&copy; 2026 XPM Registry. All rights reserved.</p>
            </div>
            <div>
                <h4 class="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Resources</h4>
                <ul class="space-y-2 text-sm text-gray-500">
                    <li><a href="/help" class="hover:text-indigo-600 transition-colors">Documentation</a></li>
                    <li><a href="#" class="hover:text-indigo-600 transition-colors">CLI Commands</a></li>
                    <li><a href="#" class="hover:text-indigo-600 transition-colors">Publishing Guide</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Company</h4>
                <ul class="space-y-2 text-sm text-gray-500">
                    <li><a href="/billing" class="hover:text-indigo-600 transition-colors">Pricing & Billing</a></li>
                    <li><a href="#" class="hover:text-indigo-600 transition-colors">Terms of Service</a></li>
                    <li><a href="#" class="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
                </ul>
            </div>
        </div>
    </footer>
    
    <script>
        // Initialize Lucide icons
        lucide.createIcons();
    </script>
</body>
</html>
    `;
};
