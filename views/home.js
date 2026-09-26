module.exports = function getHomeView(packages, user) {
    const packageCards = packages.map(pkg => `
        <div onclick="window.location.href='/package/${pkg.name}'" class="cursor-pointer group block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1">
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                    <i data-lucide="box" class="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors"></i>
                    ${pkg.name}
                </h3>
                <span class="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold px-2 py-0.5 rounded-md font-mono">v${pkg.version}</span>
            </div>
            <p class="text-gray-500 text-sm mb-5 line-clamp-2 h-10">${pkg.description || 'A powerful executable distributed via XPM.'}</p>
            <div class="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                <a href="${pkg.author?.username ? '/user/' + pkg.author.username : '#'}" class="flex items-center gap-2 hover:opacity-80 transition-opacity" onclick="event.stopPropagation();">
                    <img src="${pkg.author?.avatarUrl || 'https://ui-avatars.com/api/?name=Unknown'}" class="w-6 h-6 rounded-full border border-gray-200">
                    <span class="text-xs font-medium text-gray-600 hover:text-indigo-600 transition-colors">${pkg.author?.username ? '@' + pkg.author.username : 'Anonymous Publisher'}</span>
                </a>
                <div class="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                    ${pkg.downloads}
                </div>
            </div>
        </div>
    `).join('') || '<div class="col-span-full text-center py-24 text-gray-400 font-medium">No packages published yet. Be the first!</div>';

    return `
        <div class="pt-24 pb-20 px-6 text-center relative overflow-hidden bg-white border-b border-gray-100">
            <!-- Background Orbs -->
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-50 to-white blur-3xl rounded-full pointer-events-none -z-10"></div>
            
            <h1 class="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 relative z-10 text-gray-900">
                Build perfect<br>
                <span class="gradient-text">Windows workflows.</span>
            </h1>
            <p class="text-lg text-gray-500 max-w-2xl mx-auto mb-10 relative z-10 leading-relaxed">
                XPM is the blazing fast package registry for Windows. Publish your CLI tools instantly, execute them seamlessly, and manage your projects with unparalleled developer experience.
            </p>
            
            <!-- Command Box -->
            <div class="flex items-center justify-center gap-4 relative z-10 max-w-lg mx-auto">
                <div class="w-full bg-gray-900 text-white pl-5 pr-2 py-2 rounded-xl flex items-center justify-between shadow-2xl border border-gray-800 ring-4 ring-gray-900/5">
                    <div class="flex items-center gap-3">
                        <i data-lucide="terminal" class="w-4 h-4 text-gray-400"></i>
                        <code class="font-mono text-sm text-gray-200">winget install test0ing7-ux.xpm</code>
                    </div>
                    <button onclick="navigator.clipboard.writeText('winget install test0ing7-ux.xpm'); this.innerHTML='<i data-lucide=\\'check\\' class=\\'w-4 h-4 text-green-400\\'></i>'; lucide.createIcons(); setTimeout(() => { this.innerHTML='<i data-lucide=\\'copy\\' class=\\'w-4 h-4 text-gray-400\\'></i>'; lucide.createIcons(); }, 2000);" class="bg-gray-800 hover:bg-gray-700 p-2.5 rounded-lg transition-colors flex items-center justify-center">
                        <i data-lucide="copy" class="w-4 h-4 text-gray-400"></i>
                    </button>
                </div>
            </div>
            <div class="mt-8 flex items-center justify-center gap-6 text-sm font-medium text-gray-500">
                <span class="flex items-center gap-1.5"><i data-lucide="zap" class="w-4 h-4 text-amber-500"></i> Lightning Fast</span>
                <span class="flex items-center gap-1.5"><i data-lucide="shield-check" class="w-4 h-4 text-green-500"></i> Secure GridFS</span>
                <span class="flex items-center gap-1.5"><i data-lucide="layout-grid" class="w-4 h-4 text-indigo-500"></i> Easy Management</span>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-6 py-16 w-full">
            <div class="flex items-center justify-between mb-8">
                <h2 class="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <i data-lucide="trending-up" class="w-5 h-5 text-indigo-600"></i>
                    Trending Packages
                </h2>
                <a href="/search?q=" class="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    Explore all <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </a>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                ${packageCards}
            </div>
        </div>
    `;
};
