
function getLandingView() {
    return `
        <!-- Hero Section -->
        <div class="relative overflow-hidden" id="hero-container" style="background: #000000;">
            <canvas id="particle-canvas" class="absolute inset-0 w-full h-full"></canvas>
            
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative z-10">
                <div class="text-center max-w-4xl mx-auto">
                    <h1 class="text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
                        The Universal Native<br><span class="text-cyan-400">Package Manager</span>
                    </h1>
                    <p class="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
                        Distribute and install standalone binaries instantly across Windows, macOS, and Linux. Zero dependencies, no complex installers—just secure, seamless command-line execution.
                    </p>
                    
                    <div class="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <a href="/register" class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-full text-black dark:text-white bg-white dark:bg-[#242424] hover:bg-gray-200 transition-colors">
                            Start Publishing
                        </a>
                        <a href="https://github.com/edvu" target="_blank" class="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-full text-gray-300 bg-black/40 border border-gray-800 hover:border-cyan-500/40 hover:text-white transition-colors">
                            Documentation
                        </a>
                    </div>

                    <!-- Multi-OS Native Installer Selector -->
                    <div class="mt-8 max-w-xl mx-auto">
                        <div class="flex justify-center space-x-2 mb-3 text-xs font-mono">
                            <button type="button" onclick="setInstallTab('win')" id="tab-btn-win" class="px-3.5 py-1.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-semibold transition-all">Windows</button>
                            <button type="button" onclick="setInstallTab('linux')" id="tab-btn-linux" class="px-3.5 py-1.5 rounded-full text-gray-400 hover:text-white border border-transparent transition-all">Linux (APT)</button>
                            <button type="button" onclick="setInstallTab('mac')" id="tab-btn-mac" class="px-3.5 py-1.5 rounded-full text-gray-400 hover:text-white border border-transparent transition-all">macOS (Brew)</button>
                            <button type="button" onclick="setInstallTab('sh')" id="tab-btn-sh" class="px-3.5 py-1.5 rounded-full text-gray-400 hover:text-white border border-transparent transition-all">cURL / Sh</button>
                        </div>
                        <div class="flex items-center px-5 py-3.5 bg-black/70 border border-gray-800 rounded-full shadow-lg shadow-cyan-500/5">
                            <code id="install-cmd" class="text-sm font-mono text-cyan-300 select-all truncate flex-1 text-left">irm https://edvu.in/i | iex</code>
                            <button type="button" onclick="copyInstallCmd()" class="ml-3 text-gray-400 hover:text-cyan-400 transition-colors p-1" title="Copy command">
                                <i data-lucide="copy" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <p class="text-xs text-gray-500 mt-2 text-center" id="install-note">
                            Sets environment PATH automatically. Standalone binary with zero dependencies.
                        </p>
                    </div>
                </div>
                
                <!-- Terminal -->
                <div class="mt-16 max-w-3xl mx-auto">
                    <div class="bg-[#111] rounded-xl overflow-hidden border border-gray-800 shadow-2xl shadow-cyan-500/5">
                        <div class="flex items-center px-4 py-3 bg-[#1a1a1a] border-b border-gray-800">
                            <div class="flex space-x-2">
                                <div class="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                                <div class="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                                <div class="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                            </div>
                            <div class="mx-auto text-xs text-gray-500 font-mono">Terminal</div>
                        </div>
                        <div class="p-6 font-mono text-sm text-gray-400 text-left">
                            <div class="mb-1.5"><span class="text-green-400">~ $</span> <span class="text-white">xpm install neon</span></div>
                            <div class="text-gray-600 mb-1">Downloading cache layer...</div>
                            <div class="text-cyan-500 mb-1">Unpacking neon@2.0.10 from GridFS</div>
                            <div class="text-gray-600 mb-2">Updating Environment PATH...</div>
                            <div class="text-white font-medium mb-3">✓ Successfully installed neon.</div>
                            <div><span class="text-green-400">~ $</span> <span class="text-white">neon --status</span></div>
                            <div class="text-gray-500 mt-1">System is healthy. All checks passed.</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
            const installCmds = {
                win: 'irm https://edvu.in/i | iex',
                linux: 'curl -fsSL https://edvu.in/setup-apt.sh | sudo bash',
                mac: 'brew install https://edvu.in/xpm.rb',
                sh: 'curl -fsSL https://edvu.in/i | bash'
            };
            const installNotes = {
                win: 'PowerShell / Winget • Sets user PATH automatically • Installs xpm.exe & xpx.exe',
                linux: 'Debian / Ubuntu APT • Installs /usr/bin/xpm and /usr/bin/xpx via .deb',
                mac: 'macOS Homebrew • Downloads standalone binary and links to PATH',
                sh: 'POSIX Shell • Universal 1-liner with automatic profile and PATH update'
            };
            function setInstallTab(os) {
                const cmdEl = document.getElementById('install-cmd');
                const noteEl = document.getElementById('install-note');
                if (cmdEl) cmdEl.innerText = installCmds[os];
                if (noteEl) noteEl.innerText = installNotes[os];
                ['win', 'linux', 'mac', 'sh'].forEach(k => {
                    const btn = document.getElementById('tab-btn-' + k);
                    if (btn) {
                        if (k === os) {
                            btn.className = 'px-3.5 py-1.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-semibold transition-all';
                        } else {
                            btn.className = 'px-3.5 py-1.5 rounded-full text-gray-400 hover:text-white border border-transparent transition-all';
                        }
                    }
                });
            }
            function copyInstallCmd() {
                const cmd = document.getElementById('install-cmd').innerText;
                navigator.clipboard.writeText(cmd);
                const btn = event.currentTarget;
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '<span class="text-xs text-green-400">Copied!</span>';
                setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
            }

            (function() {
                const canvas = document.getElementById('particle-canvas');
                const ctx = canvas.getContext('2d');
                let w, h;
                const container = document.getElementById('hero-container');
                let mouseX = -9999, mouseY = -9999;
                const dots = [];

                function resize() {
                    w = canvas.width = container.offsetWidth;
                    h = canvas.height = container.offsetHeight;
                }
                resize();
                window.addEventListener('resize', function() { resize(); init(); });

                container.addEventListener('mousemove', function(e) {
                    const r = canvas.getBoundingClientRect();
                    mouseX = e.clientX - r.left;
                    mouseY = e.clientY - r.top;
                });
                container.addEventListener('mouseleave', function() {
                    mouseX = -9999;
                    mouseY = -9999;
                });

                function init() {
                    dots.length = 0;
                    const num = Math.min(Math.floor((w * h) / 6000), 250);
                    for (let i = 0; i < num; i++) {
                        dots.push({
                            x: Math.random() * w,
                            y: Math.random() * h,
                            ox: 0, 
                            oy: 0,
                            bx: Math.random() * w,
                            by: Math.random() * h,
                            vx: (Math.random() - 0.5) * 0.15,
                            vy: (Math.random() - 0.5) * 0.15,
                            size: Math.random() * 1.2 + 0.6,
                            alpha: Math.random() * 0.3 + 0.2,
                            angle: Math.random() * Math.PI
                        });
                    }
                }
                init();

                function loop() {
                    ctx.clearRect(0, 0, w, h);

                    for (let i = 0; i < dots.length; i++) {
                        const d = dots[i];
                        d.bx += d.vx;
                        d.by += d.vy;
                        if (d.bx < -10) d.bx = w + 10;
                        if (d.bx > w + 10) d.bx = -10;
                        if (d.by < -10) d.by = h + 10;
                        if (d.by > h + 10) d.by = -10;

                        const dx = d.bx - mouseX;
                        const dy = d.by - mouseY;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const radius = 180;

                        if (dist < radius && dist > 0) {
                            const force = (radius - dist) / radius;
                            const pushX = (dx / dist) * force * 60;
                            const pushY = (dy / dist) * force * 60;
                            d.ox += (pushX - d.ox) * 0.08;
                            d.oy += (pushY - d.oy) * 0.08;
                        } else {
                            d.ox *= 0.92;
                            d.oy *= 0.92;
                        }

                        d.x = d.bx + d.ox;
                        d.y = d.by + d.oy;

                        // Draw as circular dot
                        ctx.beginPath();
                        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(56, 189, 248, ' + d.alpha + ')';
                        ctx.fill();
                    }

                    requestAnimationFrame(loop);
                }
                loop();
            })();
            </script>
        </div>

        <!-- Features Grid -->
        <div class="bg-white dark:bg-[#111111] py-20 border-b border-gray-200 dark:border-gray-700">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid md:grid-cols-3 gap-12">
                    <div>
                        <div class="w-14 h-14 bg-[#F2FBF5] rounded-xl flex items-center justify-center mb-5 border border-[#cbebd6] shadow-sm">
                            <svg viewBox="0 0 128 128" class="w-8 h-8"><path fill="#47A248" d="M37.893 91.13c-2.476-8.878 1.492-23.75 8.784-37.135 15.694-28.796 17.587-50.627 17.29-53.995-.27-3-7.592.812-7.592.812s-3.79 2.164-3.52 4.606c1.085 10.024-6.52 35.787-19.535 54.49C21.41 77.027 14.37 93.3 19.535 107.126c8.414 22.518 41.213 20.875 41.213 20.875s40.133.535 47.994-22.775c4.606-13.69-.813-26.697-15.45-38.625-15.727-12.827-21.967-27.108-25.753-43.23-2.71-11.39-1.085-19.516-1.085-19.516s.27-3.79-1.896-4.062c-2.167-.27-4.336 2.71-4.336 2.71s-2.166 3.25-.542 9.48c3.25 12.193 9.48 25.197 19.775 35.22 8.41 8.125 21.67 15.172 26.275 31.42 2.71 9.48.543 21.942-8.667 29.53-7.854 6.5-18.15 7.855-32.235 6.228 15.17-10.02 18.423-17.88 18.966-21.943.542-4.06-21.67-4.06-25.193 3.524 0 0-4.06 6.5-1.082 12.732-8.668-3.79-11.38-8.94-11.92-12.46z"/></svg>
                        </div>
                        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">MongoDB GridFS</h3>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed">Executables are stored natively in MongoDB GridFS, allowing for lightning-fast chunked downloads directly to your local machine.</p>
                    </div>
                    <div>
                        <div class="w-14 h-14 bg-[#fff1e5] rounded-xl flex items-center justify-center mb-5 border border-[#ffd6b3] shadow-sm">
                            <svg viewBox="0 0 128 128" class="w-8 h-8"><path fill="#F38020" d="M109.814 89.25H25.043c-6.837 0-12.383-5.545-12.383-12.382 0-6.835 5.546-12.38 12.383-12.38H28.7c2.194-11.458 12.217-20.18 24.316-20.18 8.636 0 16.227 4.453 20.655 11.196a18.3 18.3 0 0 1 12.443-4.945c10.155 0 18.388 8.232 18.388 18.387 0 .54-.034 1.074-.08 1.6 3.018 2.054 5.392 5.518 5.392 10.12 0 4.746-3.847 8.584-8.584 8.584zM68.53 47.9c-8.23 0-15.54 4.54-19.12 11.44-.35.68-.78 1.4-1.28 2.16l25.86 16.14 11.4-25.06c-4.47-2.95-9.84-4.68-16.86-4.68z"/></svg>
                        </div>
                        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Cloudflare Security</h3>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed">Protected by Cloudflare Turnstile, OTP email verification, and strict namespaces. 2FA is natively required for all package publishing.</p>
                    </div>
                    <div>
                        <div class="w-14 h-14 bg-gray-900 rounded-xl flex items-center justify-center mb-5 border border-black shadow-sm">
                            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" class="w-7 h-7"><path stroke-linecap="round" stroke-linejoin="round" d="M4 17l6-6-6-6m10 14h6" /></svg>
                        </div>
                        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Zero-Config PATH</h3>
                        <p class="text-gray-600 dark:text-gray-400 leading-relaxed">XPM automatically manages your system's Environment Variables. Install a package and run it immediately from any bash, zsh, or PowerShell terminal.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getDashboardView(packages, user, stats) {
    const defaultPackages = packages && packages.length > 0 ? packages : [];

    const packageLinks = defaultPackages.length > 0 ? defaultPackages.slice(0, 10).map(pkg => 
        `<a href="/package/${pkg.name}" class="block py-3.5 border-b border-gray-100 dark:border-gray-800 font-bold text-[15px] text-[#292e31] dark:text-gray-200 hover:text-black hover:bg-gray-50 dark:hover:bg-[#111] transition-colors -mx-2 px-2">${pkg.name}</a>`
    ).join('') : `<p class="text-sm text-gray-500 py-2">No packages published yet. Be the first!</p>`;

    return `
        <div class="bg-[#f4f4f4] dark:bg-[#0a0a0a] min-h-screen pb-16">
            
            <!-- TOP SECTION: Edge-to-Edge White Card -->
            <div class="w-full bg-white dark:bg-[#1f1f1f] border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div class="max-w-[1280px] mx-auto px-4 sm:px-6 py-12">
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
                        
                        <!-- Column 1: Popular Libraries -->
                        <div>
                            <div class="flex items-center gap-2 mb-3">
                                <i data-lucide="flame" class="w-5 h-5 text-gray-800 dark:text-gray-200"></i>
                                <h2 class="text-[18px] font-bold text-gray-800 dark:text-gray-200">Popular libraries</h2>
                            </div>
                            <div class="w-full h-[2px] bg-[#cb3837] mb-2"></div>
                            <div class="flex flex-col">
                                ${packageLinks}
                            </div>
                        </div>

                        <!-- Column 2: Discover Packages -->
                        <div>
                            <div class="flex items-center gap-2 mb-3">
                                <i data-lucide="search" class="w-5 h-5 text-gray-800 dark:text-gray-200"></i>
                                <h2 class="text-[18px] font-bold text-gray-800 dark:text-gray-200">Discover packages</h2>
                            </div>
                            <div class="w-full h-[2px] bg-[#F38020] mb-6"></div>
                            <div class="grid grid-cols-2 gap-0 border-l border-t border-gray-100 dark:border-gray-800">
                                <button class="flex items-center justify-center gap-2 border-r border-b border-gray-100 dark:border-gray-800 py-4 px-2 text-[13px] font-semibold text-[#292e31] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"><i data-lucide="monitor" class="w-4 h-4"></i> Front-end</button>
                                <button class="flex items-center justify-center gap-2 border-r border-b border-gray-100 dark:border-gray-800 py-4 px-2 text-[13px] font-semibold text-[#292e31] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"><i data-lucide="server" class="w-4 h-4"></i> Back-end</button>
                                <button class="flex items-center justify-center gap-2 border-r border-b border-gray-100 dark:border-gray-800 py-4 px-2 text-[13px] font-semibold text-[#292e31] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"><i data-lucide="terminal-square" class="w-4 h-4"></i> CLI</button>
                                <button class="flex items-center justify-center gap-2 border-r border-b border-gray-100 dark:border-gray-800 py-4 px-2 text-[13px] font-semibold text-[#292e31] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"><i data-lucide="book-open" class="w-4 h-4"></i> Documentation</button>
                                <button class="flex items-center justify-center gap-2 border-r border-b border-gray-100 dark:border-gray-800 py-4 px-2 text-[13px] font-semibold text-[#292e31] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"><i data-lucide="palette" class="w-4 h-4"></i> CSS</button>
                                <button class="flex items-center justify-center gap-2 border-r border-b border-gray-100 dark:border-gray-800 py-4 px-2 text-[13px] font-semibold text-[#292e31] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"><i data-lucide="check-circle" class="w-4 h-4"></i> Testing</button>
                                <button class="flex items-center justify-center gap-2 border-r border-b border-gray-100 dark:border-gray-800 py-4 px-2 text-[13px] font-semibold text-[#292e31] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"><i data-lucide="cpu" class="w-4 h-4"></i> IoT</button>
                                <button class="flex items-center justify-center gap-2 border-r border-b border-gray-100 dark:border-gray-800 py-4 px-2 text-[13px] font-semibold text-[#292e31] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"><i data-lucide="shield" class="w-4 h-4"></i> Coverage</button>
                                <button class="flex items-center justify-center gap-2 border-r border-b border-gray-100 dark:border-gray-800 py-4 px-2 text-[13px] font-semibold text-[#292e31] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"><i data-lucide="smartphone" class="w-4 h-4"></i> Mobile</button>
                                <button class="flex items-center justify-center gap-2 border-r border-b border-gray-100 dark:border-gray-800 py-4 px-2 text-[13px] font-semibold text-[#292e31] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"><i data-lucide="box" class="w-4 h-4"></i> Frameworks</button>
                                <button class="flex items-center justify-center gap-2 border-r border-b border-gray-100 dark:border-gray-800 py-4 px-2 text-[13px] font-semibold text-[#292e31] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"><i data-lucide="bot" class="w-4 h-4"></i> Robotics</button>
                                <button class="flex items-center justify-center gap-2 border-r border-b border-gray-100 dark:border-gray-800 py-4 px-2 text-[13px] font-semibold text-[#292e31] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"><i data-lucide="calculator" class="w-4 h-4"></i> Math</button>
                            </div>
                        </div>

                        <!-- Column 3: By the numbers -->
                        <div>
                            <div class="flex items-center gap-2 mb-3">
                                <i data-lucide="bar-chart-2" class="w-5 h-5 text-gray-800 dark:text-gray-200"></i>
                                <h2 class="text-[18px] font-bold text-gray-800 dark:text-gray-200">By the numbers</h2>
                            </div>
                            <div class="w-full h-[2px] bg-[#f1e05a] mb-6"></div>
                            
                            <div class="mb-6 border-b border-gray-100 dark:border-gray-800 pb-6">
                                <p class="text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Packages</p>
                                <p class="text-[32px] font-bold text-[#292e31] dark:text-gray-100 tracking-tight">${(stats?.packages || 0).toLocaleString()}</p>
                            </div>
                            
                            <div class="mb-6 border-b border-gray-100 dark:border-gray-800 pb-6">
                                <p class="text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Downloads - Last Week</p>
                                <p class="text-[32px] font-bold text-[#292e31] dark:text-gray-100 tracking-tight">${(stats?.downloadsLastWeek || 0).toLocaleString()}</p>
                            </div>
                            
                            <div>
                                <p class="text-[13px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Downloads - Last Month</p>
                                <p class="text-[32px] font-bold text-[#292e31] dark:text-gray-100 tracking-tight">${(stats?.downloadsLastMonth || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <!-- BOTTOM SECTION: Recently updated packages -->
            <div class="w-full bg-white dark:bg-[#1f1f1f] border-y border-gray-200 dark:border-gray-800 mt-6 shadow-sm">
                <div class="max-w-[1280px] mx-auto px-4 sm:px-6 py-10">
                     <div class="flex items-center gap-2 mb-3">
                        <i data-lucide="clock" class="w-5 h-5 text-gray-800 dark:text-gray-200"></i>
                        <h2 class="text-[18px] font-bold text-gray-800 dark:text-gray-200">Recently updated packages</h2>
                    </div>
                    <div class="w-full h-[2px] bg-[#cb3837] mb-2"></div>
                    
                    <div class="flex flex-col">
                        ${stats?.recent && stats.recent.length > 0 ? stats.recent.map(pkg => `
                        <div class="py-5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                            <a href="/package/${pkg.name}" class="font-bold text-[16px] text-gray-900 dark:text-gray-100 hover:underline">${pkg.name}</a>
                            <p class="text-[14px] text-gray-600 dark:text-gray-400 mt-1.5 mb-2">${pkg.description || 'No description provided for this package.'}</p>
                            <div class="flex items-center gap-2 text-[13px] text-gray-500 dark:text-gray-400 font-mono">
                                <span class="font-bold text-gray-700 dark:text-gray-300">${pkg.author ? pkg.author.username : 'anonymous'}</span>
                                <span class="font-sans">published ${pkg.version || '1.0.0'}</span>
                                <span>•</span>
                                <span class="font-sans">${new Date(pkg.updatedAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>
                        `).join('') : '<p class="text-sm text-gray-500 py-4">No recent updates.</p>'}
                    </div>
                </div>
            </div>

        </div>
    `;
}

module.exports = function getHomeView(packages, user = null, stats = {packages:0, downloadsLastWeek:0, downloadsLastMonth:0}) {
    if (user) {
        return getDashboardView(packages, user, stats);
    }
    return getLandingView();
};
