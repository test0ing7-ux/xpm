module.exports = function getPackageView(pkg, activeTab = 'readme', requestedFile = null, fileContent = null) {
    const readmeContent = pkg.readme ? JSON.stringify(pkg.readme) : JSON.stringify('# ' + pkg.name + '\\n\\nNo README provided.');
    
    // Dependencies Tab UI
    let depsHTML = '<div class="py-12 text-center text-gray-500"><i data-lucide="box" class="w-12 h-12 mx-auto text-gray-300 mb-4"></i> No dependencies found.</div>';
    if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
        depsHTML = '<div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"><table class="w-full text-left text-sm"><thead class="bg-gray-50 text-gray-500 uppercase font-semibold"><tr><th class="px-6 py-3">Package</th><th class="px-6 py-3">Version</th></tr></thead><tbody class="divide-y divide-gray-100">';
        for (const [dep, ver] of Object.entries(pkg.dependencies)) {
            depsHTML += `<tr class="hover:bg-gray-50"><td class="px-6 py-4 font-mono font-bold text-gray-900">${dep}</td><td class="px-6 py-4 text-gray-500 font-mono">${ver}</td></tr>`;
        }
        depsHTML += '</tbody></table></div>';
    }

    
    // Versions UI
    let versionsHTML = '<div class="bg-white border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">';
    versionsHTML += '<div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111]"><h3 class="font-bold text-gray-900 dark:text-white">Version History</h3></div>';
    versionsHTML += '<div class="divide-y divide-gray-100 dark:divide-gray-800">';
    
    if (pkg.versions && pkg.versions.length > 0) {
        // Sort descending
        const sortedVersions = [...pkg.versions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        sortedVersions.forEach(v => {
            const dateStr = new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            versionsHTML += `
                <div class="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#151515] transition-colors">
                    <div class="flex items-center gap-4">
                        <span class="font-bold text-[16px] text-gray-900 dark:text-gray-100">${v.version}</span>
                        ${pkg.distTags && pkg.distTags.get('latest') === v.version ? '<span class="px-2 py-0.5 bg-[#cb3837]/10 text-[#cb3837] text-xs font-bold rounded-md">latest</span>' : ''}
                    </div>
                    <div class="flex items-center gap-8">
                        <span class="text-sm text-gray-500 font-mono">${(v.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span class="text-sm text-gray-500">${dateStr}</span>
                        <a href="/download/${pkg.name}/${v.version}" class="flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a1a] hover:bg-gray-100 dark:hover:bg-[#252525] px-3 py-1.5 rounded-md text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors">
                            <i data-lucide="download" class="w-3 h-3"></i> Download
                        </a>
                        <div class="flex items-center gap-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-black px-3 py-1.5 rounded-md cursor-pointer hover:border-gray-400" onclick="navigator.clipboard.writeText('xpm install ${pkg.name}@${v.version}')">
                            <code class="text-xs font-mono text-gray-700 dark:text-gray-300">xpm install ${pkg.name}@${v.version}</code>
                            <i data-lucide="copy" class="w-3 h-3 text-gray-400"></i>
                        </div>
                    </div>
                </div>
            `;
        });
    } else {
        versionsHTML += '<div class="px-6 py-8 text-center text-gray-500 italic">No version history available.</div>';
    }
    versionsHTML += '</div></div>';


    // Tabs logic
    const tabs = {
        'readme': `<div id="readme" class="markdown-body bg-white border border-gray-100 p-8 rounded-2xl shadow-sm"></div>`,
        'versions': versionsHTML,
        'dependencies': depsHTML
    };

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
                    <a href="?tab=readme" class="${activeTab === 'readme' ? 'text-[#cb3837] border-b-2 border-[#cb3837] font-bold' : 'text-gray-500 hover:text-gray-700'} pb-3 px-1 flex items-center gap-2 transition-colors">
                        <i data-lucide="book-open" class="w-4 h-4"></i> Readme
                    </a>
                    <a href="?tab=versions" class="${activeTab === 'versions' ? 'text-[#cb3837] border-b-2 border-[#cb3837]' : 'text-gray-500 hover:text-gray-700'} pb-3 px-1 flex items-center gap-2 transition-colors font-bold text-sm">
        <i data-lucide="layers" class="w-4 h-4"></i> Versions
    </a>
                    <a href="?tab=dependencies" class="${activeTab === 'dependencies' ? 'text-[#cb3837] border-b-2 border-[#cb3837] font-bold' : 'text-gray-500 hover:text-gray-700'} pb-3 px-1 flex items-center gap-2 transition-colors">
                        <i data-lucide="git-merge" class="w-4 h-4"></i> Dependencies
                    </a>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-6 py-10 flex flex-col lg:flex-row gap-12 w-full">
            <div class="flex-1 min-w-0">
                ${tabs[activeTab] || tabs['readme']}
            </div>
            
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
                            <a href="${pkg.author?.username ? '/user/' + pkg.author.username : '#'}" class="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 p-3 rounded-xl border border-gray-100 transition-colors">
                                <img src="${pkg.author?.avatarUrl || 'https://ui-avatars.com/api/?name=Unknown'}" class="w-10 h-10 rounded-full border border-gray-200">
                                <div>
                                    <span class="text-sm font-bold text-gray-900 block">${pkg.author?.username ? '@' + pkg.author.username : 'Anonymous Publisher'}</span>
                                    <span class="text-xs text-gray-500 block">Verified Author</span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            if (document.getElementById('readme')) {
                document.getElementById('readme').innerHTML = marked.parse(${readmeContent});
            }
        </script>
    `;
};
