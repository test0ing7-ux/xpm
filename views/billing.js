module.exports = function getBillingView() {
    return `
        <div class="bg-gray-50 border-b border-gray-200 py-16">
            <div class="max-w-3xl mx-auto px-6 text-center">
                <h1 class="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Simple, transparent pricing</h1>
                <p class="text-lg text-gray-500">Host your public packages for free forever. Upgrade to Pro for private packages and team collaboration.</p>
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-6 py-16 w-full">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <!-- Free Tier -->
                <div class="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative">
                    <h3 class="text-xl font-bold text-gray-900 mb-2">Community</h3>
                    <p class="text-gray-500 text-sm mb-6">Perfect for open-source developers.</p>
                    <div class="mb-6">
                        <span class="text-4xl font-extrabold text-gray-900">$0</span>
                        <span class="text-gray-500">/forever</span>
                    </div>
                    <ul class="space-y-4 mb-8">
                        <li class="flex items-center gap-3 text-sm text-gray-700">
                            <i data-lucide="check-circle-2" class="w-5 h-5 text-indigo-500"></i> Unlimited public packages
                        </li>
                        <li class="flex items-center gap-3 text-sm text-gray-700">
                            <i data-lucide="check-circle-2" class="w-5 h-5 text-indigo-500"></i> Max 50MB per package
                        </li>
                        <li class="flex items-center gap-3 text-sm text-gray-700">
                            <i data-lucide="check-circle-2" class="w-5 h-5 text-indigo-500"></i> Community support
                        </li>
                    </ul>
                    <a href="/auth/google" class="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 rounded-xl transition-colors">Current Plan</a>
                </div>
                
                <!-- Pro Tier -->
                <div class="bg-black p-8 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden text-white transform md:-translate-y-4">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-20 -mt-20 pointer-events-none"></div>
                    <div class="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                    <h3 class="text-xl font-bold mb-2">Pro <span class="text-indigo-400 font-mono text-sm ml-2">(Phase 4)</span></h3>
                    <p class="text-gray-400 text-sm mb-6">For professional developers and teams.</p>
                    <div class="mb-6">
                        <span class="text-4xl font-extrabold">$12</span>
                        <span class="text-gray-400">/month</span>
                    </div>
                    <ul class="space-y-4 mb-8">
                        <li class="flex items-center gap-3 text-sm text-gray-300">
                            <i data-lucide="check-circle-2" class="w-5 h-5 text-indigo-400"></i> Private packages
                        </li>
                        <li class="flex items-center gap-3 text-sm text-gray-300">
                            <i data-lucide="check-circle-2" class="w-5 h-5 text-indigo-400"></i> Max 5GB per package
                        </li>
                        <li class="flex items-center gap-3 text-sm text-gray-300">
                            <i data-lucide="check-circle-2" class="w-5 h-5 text-indigo-400"></i> Priority email support
                        </li>
                        <li class="flex items-center gap-3 text-sm text-gray-300">
                            <i data-lucide="check-circle-2" class="w-5 h-5 text-indigo-400"></i> CI/CD Authentication Tokens
                        </li>
                    </ul>
                    <button onclick="alert('Billing integration is launching in Phase 4!')" class="block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg">Upgrade to Pro</button>
                </div>
            </div>
        </div>
    `;
};
