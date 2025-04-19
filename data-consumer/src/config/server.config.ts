export const serverConfig = {
    port: parseInt(process.env.API_PORT || '8080', 10),
    apiKey: process.env.API_KEY || 'default-insecure-key', // Fallback, should be set via env
    corsOrigin: process.env.FRONTEND_URL || '*', 
};

if (serverConfig.apiKey === 'default-insecure-key' && process.env.NODE_ENV === 'production') {
    console.warn("WARNING: Using default insecure API key in production!");
    
}