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

    // Code Explorer UI
    let codeHTML = '<div class="flex h-[600px] border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">';
    
    // Sidebar (File Tree)
    codeHTML += '<div class="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto py-4 px-2">';
    codeHTML += '<div class="px-3 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-200">Files</div>';
    if (pkg.fileTree && pkg.fileTree.length > 0) {
        pkg.fileTree.forEach(file => {
            const isSelected = requestedFile === file;
            const icon = file.endsWith('.js') ? 'file-json-2' : (file.endsWith('.json') ? 'braces' : 'file-text');
            codeHTML += `
                <a href="/package/${pkg.name}?tab=code&file=${encodeURIComponent(file)}" 
                   class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${isSelected ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-200'}">
                   <i data-lucide="${icon}" class="w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}"></i>
                   ${file}
                </a>
            `;
        });
    } else {
        codeHTML += '<div class="px-3 text-sm text-gray-500 italic">No files available</div>';
    }
    codeHTML += '</div>';

    // Main area (File Content)
    codeHTML += '<div class="flex-1 bg-white overflow-hidden flex flex-col">';
    if (requestedFile) {
        codeHTML += `<div class="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2 text-sm font-medium text-gray-700">
            <i data-lucide="file" class="w-4 h-4 text-gray-400"></i> ${requestedFile}
        </div>`;
        if (fileContent !== null) {
            // Escape HTML characters
            const escapedContent = fileContent.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            codeHTML += `<div class="flex-1 overflow-auto bg-gray-50 p-4"><pre><code class="text-xs text-gray-800 font-mono">${escapedContent}</code></pre></div>`;
        } else {
            codeHTML += `<div class="flex-1 flex items-center justify-center text-gray-500 italic">Could not read file. (May be a binary)</div>`;
        }
    } else {
        codeHTML += `<div class="flex-1 flex flex-col items-center justify-center text-gray-400">
            <i data-lucide="mouse-pointer-click" class="w-12 h-12 mb-3 text-gray-300"></i>
            <p>Select a file to view its contents.</p>
        </div>`;
    }
    codeHTML += '</div></div>';

    // Tabs logic
    const tabs = {
        'readme': `<div id="readme" class="markdown-body bg-white border border-gray-100 p-8 rounded-2xl shadow-sm"></div>`,
        'code': codeHTML,
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
                    <a href="?tab=readme" class="${activeTab === 'readme' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'} pb-3 px-1 flex items-center gap-2 transition-colors">
                        <i data-lucide="book-open" class="w-4 h-4"></i> Readme
                    </a>
                    <a href="?tab=code" class="${activeTab === 'code' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'} pb-3 px-1 flex items-center gap-2 transition-colors">
                        <i data-lucide="file-code" class="w-4 h-4"></i> Code
                    </a>
                    <a href="?tab=dependencies" class="${activeTab === 'dependencies' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'} pb-3 px-1 flex items-center gap-2 transition-colors">
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
            if (document.getElementById('readme')) {
                document.getElementById('readme').innerHTML = marked.parse(${readmeContent});
            }
        </script>
    `;
};
