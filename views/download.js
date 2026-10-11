module.exports = function getDownloadView() {
    return `
        <div class="bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-gray-800 py-16">
            <div class="max-w-5xl mx-auto px-6 text-center">
                <div class="inline-flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-full text-xs font-semibold text-[#cb3837] mb-6">
                    <span class="w-2 h-2 rounded-full bg-[#cb3837] animate-pulse"></span>
                    Universal Distribution Ready
                </div>
                <h1 class="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
                    Download & Install XPM
                </h1>
                <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Install the XPM Command Line Interface natively on Windows, macOS, or Linux via your terminal or standalone installer.
                </p>
            </div>
        </div>

        <div class="max-w-5xl mx-auto px-6 py-12">
            
            <!-- Quick Terminal Selector Tabs -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                
                <!-- Windows Card -->
                <div class="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-all flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold text-xl">
                                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
                            </div>
                            <span class="text-xs font-semibold px-2.5 py-1 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800">x64 Ready</span>
                        </div>
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">Windows</h2>
                        <p class="text-sm text-gray-500 mb-4">Windows 10, 11 & Windows Server</p>
                        
                        <div class="mb-4">
                            <span class="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-1.5">Terminal One-Liner (PowerShell)</span>
                            <div class="flex items-center justify-between bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 cursor-pointer hover:border-gray-400 transition-colors" onclick="navigator.clipboard.writeText('irm https://edvu.in/install.ps1 | iex')">
                                <code class="text-xs font-mono text-gray-800 dark:text-gray-200 truncate">irm https://edvu.in/install.ps1 | iex</code>
                                <i data-lucide="copy" class="w-4 h-4 text-gray-400 shrink-0 ml-2"></i>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <a href="/xpm.exe" download class="w-full bg-[#cb3837] hover:bg-[#a12928] text-white font-semibold py-2.5 px-4 rounded-xl text-center text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
                            <i data-lucide="download" class="w-4 h-4"></i> Download xpm.exe (Standalone)
                        </a>
                        <a href="/install.bat" download class="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-xl text-center text-xs transition-colors flex items-center justify-center gap-1.5">
                            <i data-lucide="file-code" class="w-3.5 h-3.5"></i> Download install.bat
                        </a>
                    </div>
                </div>

                <!-- macOS Card -->
                <div class="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-all flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 flex items-center justify-center font-bold text-xl">
                                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.18c.63-.77 1.06-1.84.94-2.91-1 .04-2.18.66-2.87 1.47-.6.7-1.13 1.79-1 2.86 1.12.09 2.29-.59 2.93-1.42z"/></svg>
                            </div>
                            <span class="text-xs font-semibold px-2.5 py-1 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400 rounded-full border border-purple-200 dark:border-purple-800">Intel & Apple Silicon</span>
                        </div>
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">macOS</h2>
                        <p class="text-sm text-gray-500 mb-4">macOS 12 Monterey or later</p>
                        
                        <div class="mb-4">
                            <span class="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-1.5">Terminal One-Liner (Zsh / Bash)</span>
                            <div class="flex items-center justify-between bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 cursor-pointer hover:border-gray-400 transition-colors" onclick="navigator.clipboard.writeText('curl -fsSL https://edvu.in/install.sh | bash')">
                                <code class="text-xs font-mono text-gray-800 dark:text-gray-200 truncate">curl -fsSL https://edvu.in/install.sh | bash</code>
                                <i data-lucide="copy" class="w-4 h-4 text-gray-400 shrink-0 ml-2"></i>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <a href="/xpm-macos" download class="w-full bg-gray-900 hover:bg-black text-white font-semibold py-2.5 px-4 rounded-xl text-center text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
                            <i data-lucide="download" class="w-4 h-4"></i> Download xpm-macos
                        </a>
                        <div class="text-center text-xs text-gray-400 py-1">
                            Requires <code>chmod +x xpm-macos</code>
                        </div>
                    </div>
                </div>

                <!-- Linux Card -->
                <div class="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-all flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold text-xl">
                                <i data-lucide="terminal" class="w-6 h-6"></i>
                            </div>
                            <span class="text-xs font-semibold px-2.5 py-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800">glibc x86_64</span>
                        </div>
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">Linux</h2>
                        <p class="text-sm text-gray-500 mb-4">Ubuntu, Debian, Fedora, Arch, Alpine</p>
                        
                        <div class="mb-4">
                            <span class="text-xs font-bold uppercase text-gray-400 tracking-wider block mb-1.5">Terminal One-Liner (Bash / Sh)</span>
                            <div class="flex items-center justify-between bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 cursor-pointer hover:border-gray-400 transition-colors" onclick="navigator.clipboard.writeText('curl -fsSL https://edvu.in/install.sh | bash')">
                                <code class="text-xs font-mono text-gray-800 dark:text-gray-200 truncate">curl -fsSL https://edvu.in/install.sh | bash</code>
                                <i data-lucide="copy" class="w-4 h-4 text-gray-400 shrink-0 ml-2"></i>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <a href="/xpm-linux" download class="w-full bg-gray-900 hover:bg-black text-white font-semibold py-2.5 px-4 rounded-xl text-center text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
                            <i data-lucide="download" class="w-4 h-4"></i> Download xpm-linux
                        </a>
                        <div class="text-center text-xs text-gray-400 py-1">
                            Requires <code>chmod +x xpm-linux</code>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Alternative Universal NPM option -->
            <div class="bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-gray-800 rounded-2xl p-8 mb-12">
                <div class="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div class="flex items-center gap-2.5 mb-2">
                            <span class="px-2.5 py-0.5 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 rounded-md text-xs font-bold">NPM Package</span>
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Already have Node.js installed?</h3>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            You can install the official XPM CLI globally across any operating system via npm with zero compilation steps.
                        </p>
                    </div>
                    <div class="flex items-center gap-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3 cursor-pointer shrink-0 hover:border-gray-400 transition-colors" onclick="navigator.clipboard.writeText('npm i -g xpm-cli')">
                        <code class="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">npm i -g xpm-cli</code>
                        <i data-lucide="copy" class="w-4 h-4 text-gray-400"></i>
                    </div>
                </div>
            </div>

            <!-- Verification & Next Steps -->
            <div class="border-t border-gray-200 dark:border-gray-800 pt-12">
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Verify Your Installation</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-[#1a1a1a]">
                        <span class="text-xs font-bold text-[#cb3837] uppercase tracking-wider block mb-1">Step 1: Check Version</span>
                        <code class="text-sm font-mono block bg-gray-50 dark:bg-[#111] p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 mb-2">xpm --version</code>
                        <p class="text-xs text-gray-500">Confirms the binary is in your PATH and ready for use.</p>
                    </div>

                    <div class="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-[#1a1a1a]">
                        <span class="text-xs font-bold text-[#cb3837] uppercase tracking-wider block mb-1">Step 2: Authenticate</span>
                        <code class="text-sm font-mono block bg-gray-50 dark:bg-[#111] p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 mb-2">xpm login</code>
                        <p class="text-xs text-gray-500">Opens your browser to securely link your CLI with your XPM profile.</p>
                    </div>

                    <div class="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-[#1a1a1a]">
                        <span class="text-xs font-bold text-[#cb3837] uppercase tracking-wider block mb-1">Step 3: Publish</span>
                        <code class="text-sm font-mono block bg-gray-50 dark:bg-[#111] p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 mb-2">xpm publish</code>
                        <p class="text-xs text-gray-500">Secures your upload with WebAuthn/Passkey verification and uploads to GridFS.</p>
                    </div>
                </div>
            </div>

        </div>
    `;
};
