module.exports = function getUserView(userProfile, packages) {
    const packageCards = packages.map(pkg => `
        <a href="/package/${pkg.name}" class="group block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1">
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                    <i data-lucide="box" class="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors"></i>
                    ${pkg.name}
                </h3>
                <span class="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold px-2 py-0.5 rounded-md font-mono">v${pkg.version}</span>
            </div>
            <p class="text-gray-500 text-sm mb-5 line-clamp-2 h-10">${pkg.description || 'A powerful executable distributed via XPM.'}</p>
            <div class="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                <div class="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                    ${pkg.downloads} downloads
                </div>
            </div>
        </a>
    `).join('') || `
        <div class="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-200">
                <i data-lucide="package-x" class="w-8 h-8 text-gray-400"></i>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-1">No packages</h3>
            <p class="text-gray-500 max-w-sm">This user hasn't published any packages yet.</p>
        </div>
    `;

    return `
        <div class="bg-white border-b border-gray-200 py-16">
            <div class="max-w-7xl mx-auto px-6 text-center flex flex-col items-center">
                <img src="${userProfile.avatarUrl || 'https://ui-avatars.com/api/?name=Unknown'}" class="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover mb-5">
                <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">${userProfile.username ? '@' + userProfile.username : 'Anonymous Publisher'}</h1>
                <div class="mt-6 flex items-center gap-4 text-sm font-medium text-gray-500">
                    <span class="flex items-center gap-1.5"><i data-lucide="boxes" class="w-4 h-4"></i> ${packages.length} Packages</span>
                    <span class="flex items-center gap-1.5"><i data-lucide="calendar" class="w-4 h-4"></i> Joined ${new Date(userProfile.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-6 py-12 w-full">
            <h2 class="text-xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4 flex items-center gap-2">
                <i data-lucide="layout-grid" class="w-5 h-5 text-indigo-500"></i>
                Published Packages
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                ${packageCards}
            </div>
        </div>
    `;
};
