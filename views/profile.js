module.exports = function getProfileView(user, userPackages) {
    const packageRows = userPackages.map(pkg => `
        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap">
                <a href="/package/${pkg.name}" class="text-sm font-bold text-gray-900 hover:text-indigo-600 flex items-center gap-2">
                    <i data-lucide="package" class="w-4 h-4 text-gray-400"></i> ${pkg.name}
                </a>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">v${pkg.version}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${pkg.downloads}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${pkg.tarballSize ? (pkg.tarballSize/1024/1024).toFixed(2) + ' MB' : '0.00 MB'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="deletePackage('${pkg.name}')" class="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ml-auto">
                    <i data-lucide="trash-2" class="w-4 h-4"></i> Delete
                </button>
            </td>
        </tr>
    `).join('') || `
        <tr>
            <td colspan="5" class="px-6 py-12 text-center text-gray-500 font-medium">
                <div class="flex flex-col items-center gap-3">
                    <i data-lucide="package-open" class="w-8 h-8 text-gray-300"></i>
                    You haven't published any packages yet.
                </div>
            </td>
        </tr>
    `;

    return `
        <div class="bg-white border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-6 py-12 flex items-center justify-between">
                <div class="flex items-center gap-5">
                    <img src="${user.avatarUrl}" class="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900 tracking-tight">${user.displayName}</h1>
                        <p class="text-gray-500 flex items-center gap-2 mt-1">
                            <i data-lucide="mail" class="w-4 h-4"></i> ${user.email}
                        </p>
                    </div>
                </div>
                <div>
                    <a href="/logout" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                        <i data-lucide="log-out" class="w-4 h-4"></i> Log out
                    </a>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-6 py-12 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Sidebar: CLI Token -->
            <div class="lg:col-span-1 space-y-6">
                <div class="bg-gray-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-gray-800">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 pointer-events-none"></div>
                    <div class="flex items-center gap-2 mb-4 relative z-10">
                        <i data-lucide="key" class="w-5 h-5 text-indigo-400"></i>
                        <h2 class="text-lg font-bold">CLI Auth Token</h2>
                    </div>
                    <p class="text-gray-400 text-sm mb-5 relative z-10">Use this secret token to log in from your terminal. Do not share it.</p>
                    
                    <div class="relative z-10">
                        <input type="password" id="cliToken" readonly value="${user.cliToken}" class="w-full bg-black border border-gray-700 text-gray-300 text-xs font-mono p-3 rounded-lg focus:outline-none mb-3">
                        <button onclick="
                            const el = document.getElementById('cliToken'); 
                            el.type = 'text'; 
                            navigator.clipboard.writeText(el.value); 
                            this.innerHTML = '<i data-lucide=\\'check\\' class=\\'w-4 h-4\\'></i> Copied!'; 
                            lucide.createIcons();
                            this.classList.add('bg-green-600', 'text-white', 'border-green-600'); 
                            setTimeout(() => { 
                                el.type = 'password'; 
                                this.innerHTML = '<i data-lucide=\\'copy\\' class=\\'w-4 h-4\\'></i> Copy Token'; 
                                lucide.createIcons();
                                this.classList.remove('bg-green-600', 'text-white', 'border-green-600'); 
                            }, 2000);
                        " class="w-full bg-white text-black border border-gray-200 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 text-sm">
                            <i data-lucide="copy" class="w-4 h-4"></i> Copy Token
                        </button>
                    </div>
                </div>
            </div>

            <!-- Main: Package Manager -->
            <div class="lg:col-span-2">
                <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div class="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                        <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <i data-lucide="boxes" class="w-5 h-5 text-gray-500"></i>
                            Your Published Packages
                        </h2>
                        <span class="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">${userPackages.length} total</span>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th class="px-6 py-3">Package Name</th>
                                    <th class="px-6 py-3">Version</th>
                                    <th class="px-6 py-3">Downloads</th>
                                    <th class="px-6 py-3">Size</th>
                                    <th class="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                ${packageRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <script>
            async function deletePackage(pkgName) {
                if (!confirm('Are you absolutely sure you want to permanently delete ' + pkgName + '? This action cannot be undone.')) return;
                
                try {
                    // Since UI handles it, we can use the backend session instead of CLI token!
                    // Wait, our backend DELETE /package/:name route expects Authorization header with CLI token.
                    // We can pass the CLI token from the UI since it's injected here.
                    const token = document.getElementById('cliToken').value;
                    const res = await fetch('/package/' + pkgName, {
                        method: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    
                    if (res.ok) {
                        window.location.reload();
                    } else {
                        const data = await res.json();
                        alert('Error: ' + data.error);
                    }
                } catch(e) {
                    alert('Failed to delete package.');
                }
            }
        </script>
    `;
};
