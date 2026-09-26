module.exports = function getHelpView() {
    return `
        <div class="bg-indigo-600 border-b border-indigo-700 py-16">
            <div class="max-w-7xl mx-auto px-6 text-center">
                <h1 class="text-3xl font-extrabold text-white mb-4">How can we help you?</h1>
                <div class="max-w-xl mx-auto relative">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i data-lucide="search" class="w-5 h-5 text-gray-400"></i>
                    </div>
                    <input type="text" placeholder="Search documentation..." class="block w-full pl-11 pr-3 py-3 border-0 rounded-xl bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all shadow-lg">
                </div>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-6 py-16 w-full">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="bg-white p-6 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer">
                    <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                        <i data-lucide="terminal" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2">Getting Started</h3>
                    <p class="text-gray-500 text-sm">Learn how to install the XPM CLI, log in, and configure your local environment for Windows.</p>
                </div>
                
                <!-- Card 2 -->
                <div class="bg-white p-6 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer">
                    <div class="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4">
                        <i data-lucide="package-plus" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2">Publishing Packages</h3>
                    <p class="text-gray-500 text-sm">A step-by-step guide to writing your package.json, bundling assets, and running 'xpm publish'.</p>
                </div>
                
                <!-- Card 3 -->
                <div class="bg-white p-6 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer">
                    <div class="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                        <i data-lucide="shield-alert" class="w-6 h-6"></i>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2">Security & Malware</h3>
                    <p class="text-gray-500 text-sm">How we use GridFS and automated scanning to keep the Windows registry safe and secure.</p>
                </div>
            </div>
            
            <div class="mt-16 text-center">
                <h3 class="text-xl font-bold text-gray-900 mb-4">Still need help?</h3>
                <p class="text-gray-500 mb-6">Our support team is available 24/7 to help you out.</p>
                <a href="mailto:support@xpm.dev" class="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-md">
                    <i data-lucide="mail" class="w-4 h-4"></i> Contact Support
                </a>
            </div>
        </div>
    `;
};
