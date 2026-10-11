module.exports = function getPackageView(pkg, activeTab = 'readme', dependents = [], requestedFile = null, fileContent = null) {
    const latestVer = (pkg.versions && pkg.versions.length > 0) ? (pkg.versions.find(v => v.version === (pkg.distTags?.get('latest') || pkg.version)) || pkg.versions[pkg.versions.length - 1]) : null;
    const effectiveReadme = pkg.readme || latestVer?.readme || ('# ' + pkg.name + '\n\nNo README provided.');
    const effectiveDeps = (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) ? pkg.dependencies : (latestVer?.dependencies || {});
    const readmeContent = JSON.stringify(effectiveReadme);
    
    // Dependencies Tab UI
    let depsHTML = '<div class="py-16 text-center text-gray-500 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-gray-800"><i data-lucide="box" class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3"></i><p class="font-medium">No dependencies declared.</p></div>';
    if (effectiveDeps && Object.keys(effectiveDeps).length > 0) {
        depsHTML = '<div class="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"><table class="w-full text-left text-sm"><thead class="bg-gray-50 dark:bg-[#111] text-gray-500 uppercase font-semibold text-xs border-b border-gray-200 dark:border-gray-800"><tr><th class="px-6 py-3.5">Package</th><th class="px-6 py-3.5">Version Range</th></tr></thead><tbody class="divide-y divide-gray-100 dark:divide-gray-800">';
        for (const [dep, ver] of Object.entries(effectiveDeps)) {
            depsHTML += `<tr class="hover:bg-gray-50 dark:hover:bg-[#151515] transition-colors"><td class="px-6 py-4 font-mono font-bold text-gray-900 dark:text-gray-100"><a href="/package/${dep}" class="hover:text-[#cb3837] hover:underline">${dep}</a></td><td class="px-6 py-4 text-gray-500 font-mono">${ver}</td></tr>`;
        }
        depsHTML += '</tbody></table></div>';
    }

    // Dependents Tab UI
    let dependentsHTML = '<div class="py-16 text-center text-gray-500 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-gray-800"><i data-lucide="share-2" class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3"></i><p class="font-medium">0 packages depend on ' + pkg.name + ' yet.</p></div>';
    if (dependents && dependents.length > 0) {
        dependentsHTML = '<div class="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">';
        dependents.forEach(dep => {
            dependentsHTML += `
                <div class="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#151515] transition-colors">
                    <div>
                        <a href="/package/${dep.name}" class="text-lg font-bold text-[#cb3837] hover:underline">${dep.name}</a>
                        <p class="text-sm text-gray-500 mt-1">${dep.description || 'No description provided.'}</p>
                    </div>
                    <span class="text-xs font-mono font-semibold px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md">v${dep.version || '1.0.0'}</span>
                </div>
            `;
        });
        dependentsHTML += '</div>';
    }
    
    // Versions UI
    let versionsHTML = '<div class="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">';
    versionsHTML += '<div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111]"><h3 class="font-bold text-gray-900 dark:text-white">Version History</h3></div>';
    versionsHTML += '<div class="divide-y divide-gray-100 dark:divide-gray-800">';
    
    if (pkg.versions && pkg.versions.length > 0) {
        const sortedVersions = [...pkg.versions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        sortedVersions.forEach(v => {
            const dateStr = new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            versionsHTML += `
                <div class="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-[#151515] transition-colors">
                    <div class="flex items-center gap-3">
                        <span class="font-bold text-[16px] text-gray-900 dark:text-gray-100 font-mono">${v.version}</span>
                        ${pkg.distTags && pkg.distTags.get('latest') === v.version ? '<span class="px-2 py-0.5 bg-[#cb3837]/10 text-[#cb3837] text-xs font-bold rounded-md">latest</span>' : ''}
                    </div>
                    <div class="flex items-center gap-4 sm:gap-6 flex-wrap">
                        <span class="text-sm text-gray-500 font-mono">${(v.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span class="text-sm text-gray-500">${dateStr}</span>
                        <a href="/download/${pkg.name}/${v.version}" class="flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a1a] hover:bg-gray-100 dark:hover:bg-[#252525] px-3 py-1.5 rounded-md text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors">
                            <i data-lucide="download" class="w-3.5 h-3.5"></i> Download
                        </a>
                        <div class="flex items-center gap-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-black px-3 py-1.5 rounded-md cursor-pointer hover:border-gray-400" onclick="navigator.clipboard.writeText('xpm i ${pkg.name}@${v.version}')">
                            <code class="text-xs font-mono text-gray-700 dark:text-gray-300">xpm i ${pkg.name}@${v.version}</code>
                            <i data-lucide="copy" class="w-3.5 h-3.5 text-gray-400"></i>
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
        'readme': `<div id="readme" class="markdown-body bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 p-8 rounded-2xl shadow-sm text-gray-900 dark:text-gray-100 min-h-[300px]"></div>`,
        'versions': versionsHTML,
        'dependencies': depsHTML,
        'dependents': dependentsHTML
    };

    const depCount = Object.keys(effectiveDeps).length;
    const verCount = pkg.versions ? pkg.versions.length : 1;
    const depntCount = dependents.length;

    return `
        <div class="bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-gray-800 pt-12 pb-0">
            <div class="max-w-7xl mx-auto px-6">
                <div class="flex items-center gap-4 mb-3">
                    <div class="w-12 h-12 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-xl flex items-center justify-center">
                        <i data-lucide="package" class="w-6 h-6 text-[#cb3837]"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-3">
                            <h1 class="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">${pkg.name}</h1>
                            <span class="bg-red-50 dark:bg-red-950/60 text-[#cb3837] text-xs font-bold px-3 py-1 rounded-full font-mono border border-red-200 dark:border-red-900">v${pkg.version || '1.0.0'}</span>
                        </div>
                        <p class="text-gray-500 text-sm mt-1 flex items-center gap-2">
                            <i data-lucide="calendar" class="w-4 h-4"></i> Published ${new Date(pkg.updatedAt || pkg.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                
                <div class="flex gap-8 text-sm font-semibold border-b border-gray-200 dark:border-gray-800 mt-10 overflow-x-auto">
                    <a href="?tab=readme" class="${activeTab === 'readme' ? 'text-[#cb3837] border-b-2 border-[#cb3837] font-bold' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'} pb-3 px-1 flex items-center gap-2 transition-colors whitespace-nowrap">
                        <i data-lucide="book-open" class="w-4 h-4"></i> Readme
                    </a>
                    <a href="?tab=versions" class="${activeTab === 'versions' ? 'text-[#cb3837] border-b-2 border-[#cb3837] font-bold' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'} pb-3 px-1 flex items-center gap-2 transition-colors whitespace-nowrap">
                        <i data-lucide="layers" class="w-4 h-4"></i> Versions (${verCount})
                    </a>
                    <a href="?tab=dependencies" class="${activeTab === 'dependencies' ? 'text-[#cb3837] border-b-2 border-[#cb3837] font-bold' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'} pb-3 px-1 flex items-center gap-2 transition-colors whitespace-nowrap">
                        <i data-lucide="git-merge" class="w-4 h-4"></i> Dependencies (${depCount})
                    </a>
                    <a href="?tab=dependents" class="${activeTab === 'dependents' ? 'text-[#cb3837] border-b-2 border-[#cb3837] font-bold' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'} pb-3 px-1 flex items-center gap-2 transition-colors whitespace-nowrap">
                        <i data-lucide="share-2" class="w-4 h-4"></i> Dependents (${depntCount})
                    </a>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-6 py-10 flex flex-col lg:flex-row gap-12 w-full">
            <div class="flex-1 min-w-0">
                ${tabs[activeTab] || tabs['readme']}
            </div>
            
            <div class="w-full lg:w-80 shrink-0">
                <div class="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm sticky top-24">
                    <h3 class="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <i data-lucide="terminal-square" class="w-4 h-4 text-gray-500"></i> Install
                    </h3>
                    <div class="flex items-center justify-between border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#111] rounded-xl p-3 mb-3 hover:border-gray-300 transition-colors cursor-text group" onclick="navigator.clipboard.writeText('xpm i ${pkg.name}');">
                        <code class="text-sm font-mono text-gray-800 dark:text-gray-200">xpm i ${pkg.name}</code>
                        <div class="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 p-1.5 rounded-md group-hover:shadow-sm">
                            <i data-lucide="copy" class="w-4 h-4 text-gray-400 group-hover:text-black dark:group-hover:text-white cursor-pointer"></i>
                        </div>
                    </div>

                    <h3 class="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 mt-4">
                        <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-500"></i> Run Instantly (No Install)
                    </h3>
                    <div class="flex items-center justify-between border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#111] rounded-xl p-3 mb-6 hover:border-gray-300 transition-colors cursor-text group" onclick="navigator.clipboard.writeText('xpx -y ${pkg.name}');">
                        <code class="text-sm font-mono text-gray-800 dark:text-gray-200">xpx -y ${pkg.name}</code>
                        <div class="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 p-1.5 rounded-md group-hover:shadow-sm">
                            <i data-lucide="copy" class="w-4 h-4 text-gray-400 group-hover:text-black dark:group-hover:text-white cursor-pointer"></i>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><i data-lucide="download" class="w-3.5 h-3.5"></i> Downloads</h3>
                            <p class="text-base font-bold text-gray-900 dark:text-white">${pkg.downloads || 0}</p>
                        </div>
                        
                        <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><i data-lucide="database" class="w-3.5 h-3.5"></i> Size</h3>
                            <p class="text-sm font-bold text-gray-900 dark:text-white">${pkg.tarballSize ? (pkg.tarballSize/1024/1024).toFixed(2) + ' MB' : '0.00 MB'}</p>
                        </div>
                        
                        <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><i data-lucide="tag" class="w-3.5 h-3.5"></i> Version</h3>
                            <p class="text-sm font-bold text-gray-900 dark:text-white font-mono">${pkg.version || '1.0.0'}</p>
                        </div>

                        <div class="pt-2">
                            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Publisher</h3>
                            <a href="${pkg.author?.username ? '/user/' + pkg.author.username : '#'}" class="flex items-center gap-3 bg-gray-50 dark:bg-[#111] hover:bg-gray-100 dark:hover:bg-[#151515] p-3 rounded-xl border border-gray-100 dark:border-gray-800 transition-colors">
                                <img src="${pkg.author?.avatarUrl || 'https://ui-avatars.com/api/?name=User'}" class="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700">
                                <div>
                                    <span class="text-sm font-bold text-gray-900 dark:text-white block">${pkg.author?.username ? '@' + pkg.author.username : 'Verified Publisher'}</span>
                                    <span class="text-xs text-gray-500 block">Verified Author</span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            if (document.getElementById('readme') && typeof marked !== 'undefined') {
                document.getElementById('readme').innerHTML = marked.parse(${readmeContent});
            } else if (document.getElementById('readme')) {
                document.getElementById('readme').textContent = ${readmeContent};
            }
        </script>
    `;
};
