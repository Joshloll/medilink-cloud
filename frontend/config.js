// Supabase Configuration
// ⚠️ IMPORTANT: Replace these with your actual Supabase project credentials
// Get these from: https://supabase.com/dashboard/project/YOUR-PROJECT-ID/settings/api
const SUPABASE_CONFIG = {
    URL: 'https://zczlhrsmlecannuqknju.supabase.co', // 🔧 REPLACE with your Project URL
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjemxocnNtbGVjYW5udXFrbmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0Njk3MjEsImV4cCI6MjA4ODA0NTcyMX0.bymF387OBZ_5JNojgm2cbm8rAUMyUfdaSKScrjnvMfc' // 🔧 REPLACE with your anon public key
};

// Frontend Configuration  
const APP_CONFIG = {
    FRONTEND_URL: 'http://localhost:3000',
    API_URL: 'http://localhost:5000'
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG, APP_CONFIG };
} else {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
    window.APP_CONFIG = APP_CONFIG;
}
