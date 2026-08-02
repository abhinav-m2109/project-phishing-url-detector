function extractURLFeatures(urlString) {
    const url = new URL(urlString);
    
    return [
        urlString.length,                        // Length of URL
        (urlString.match(/\./g) || []).length,   // Count of dots
        (urlString.match(/-/g) || []).length,    // Count of hyphens
        (urlString.match(/@/g) || []).length,    // Presence of '@'
        urlString.startsWith("https") ? 1 : 0,   // HTTPS flag
        /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url.hostname) ? 1 : 0, // IP in hostname
        url.hostname.split('.').length - 1       // Subdomain count
    ];
}
