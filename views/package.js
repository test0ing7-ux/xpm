module.exports = function getPackageView(pkg) {
    const readmeContent = pkg.readme ? JSON.stringify(pkg.readme) : JSON.stringify('# ' + pkg.name + '\\n\\nNo README provided.');
    
    return `
        <div class="bg-white border-b border-gray-200 pt-12 pb-0">
            <div class="max-w-7xl mx-auto px-6">
                <div class="flex items-center gap-4 mb-3">
                    <div class="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
                        <i data-lucide="package" class="w-6 h-6 text-indigo-600"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-3">
                            <h1 class="text-3xl font-extrabold tracking-tight text-gray-900">${pkg.name}</h1>
                            <span class="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full font-mono border border-indigo-200">v${pkg.version}</span>
                        </div>
                        <p class="text-gray-500 text-sm mt-1 flex items-center gap-2">
                            <i data-lucide="calendar" class="w-4 h-4"></i> Published ${new Date(pkg.updatedAt || pkg.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                
                <div class="flex gap-8 text-sm font-semibold border-b border-gray-200 mt-10">
                    <button class="text-indigo-600 border-b-2 border-indigo-600 pb-3 px-1 flex items-center gap-2">
                        <i data-lucide="book-open" class="w-4 h-4"></i> Readme
                    </button>
                    <button onclick="alert('Code Explorer is launching in Phase 2!')" class="text-gray-500 hover:text-gray-700 pb-3 px-1 flex items-center gap-2 transition-colors">
                        <i data-lucide="file-code" class="w-4 h-4"></i> Code (Coming Soon)
                    </button>
                    <button onclick="alert('Dependency View is launching in Phase 2!')" class="text-gray-500 hover:text-gray-700 pb-3 px-1 flex items-center gap-2 transition-colors">
                        <i data-lucide="git-merge" class="w-4 h-4"></i> Dependencies (Coming Soon)
                    </button>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-6 py-10 flex flex-col lg:flex-row gap-12 w-full">
            <!-- Left: Readme -->
            <div class="flex-1 min-w-0">
                <div id="readme" class="markdown-body bg-white border border-gray-100 p-8 rounded-2xl shadow-sm"></div>
            </div>
            
            <!-- Right: Sidebar -->
            <div class="w-full lg:w-80 shrink-0">
                <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-24">
                    <h3 class="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <i data-lucide="terminal-square" class="w-4 h-4 text-gray-500"></i> Install
                    </h3>
                    <div class="flex items-center justify-between border border-gray-200 bg-gray-50 rounded-xl p-3 mb-6 hover:border-gray-300 transition-colors cursor-text group" onclick="navigator.clipboard.writeText('xpm install ${pkg.name}');">
                        <code class="text-sm font-mono text-gray-800">xpm install ${pkg.name}</code>
                        <div class="bg-white border border-gray-200 p-1.5 rounded-md group-hover:shadow-sm">
                            <i data-lucide="copy" class="w-4 h-4 text-gray-400 group-hover:text-black cursor-pointer"></i>
                        </div>
                    </div>

                    <div class="space-y-5">
                        <div class="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><i data-lucide="download" class="w-3.5 h-3.5"></i> Downloads</h3>
                            <p class="text-lg font-bold text-gray-900">${pkg.downloads}</p>
                        </div>
                        
                        <div class="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><i data-lucide="database" class="w-3.5 h-3.5"></i> Size</h3>
                            <p class="text-sm font-bold text-gray-900">${pkg.tarballSize ? (pkg.tarballSize/1024/1024).toFixed(2) + ' MB' : '0.00 MB'}</p>
                        </div>
                        
                        <div class="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><i data-lucide="tag" class="w-3.5 h-3.5"></i> Version</h3>
                            <p class="text-sm font-bold text-gray-900">${pkg.version}</p>
                        </div>

                        <div class="pt-2">
                            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Publisher</h3>
                            <div class="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <img src="${pkg.author?.avatarUrl || 'https://ui-avatars.com/api/?name=Unknown'}" class="w-10 h-10 rounded-full border border-gray-200">
                                <div>
                                    <span class="text-sm font-bold text-gray-900 block">${pkg.author?.displayName || 'Unknown'}</span>
                                    <span class="text-xs text-gray-500 block">Verified Author</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            document.getElementById('readme').innerHTML = marked.parse(${readmeContent});
        </script>
    `;
};
