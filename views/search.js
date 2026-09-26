module.exports = function getSearchView(query, packages) {
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
    `).join('') || `
        <div class="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-200">
                <i data-lucide="search-x" class="w-8 h-8 text-gray-400"></i>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-1">No packages found</h3>
            <p class="text-gray-500 max-w-sm">We couldn't find any packages matching "<span class="font-semibold">${query}</span>". Try a different search term.</p>
        </div>
    `;

    return `
        <div class="bg-white border-b border-gray-200 py-10">
            <div class="max-w-7xl mx-auto px-6">
                <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <i data-lucide="search" class="w-6 h-6 text-gray-400"></i>
                    Search Results for "${query}"
                </h1>
                <p class="text-gray-500 mt-2">${packages.length} packages found</p>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-6 py-12 w-full">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                ${packageCards}
            </div>
        </div>
    `;
};
