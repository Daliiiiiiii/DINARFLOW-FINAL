const PUBLIC_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const getFileUrl = (path) => {
    if (!path) return ''
    return path.startsWith('http') ? path : `${PUBLIC_URL}${path}`
}

export const getImageUrl = (path, options = {}) => {
    if (!path) return '';

    // If it's already a full URL, return it as is
    if (path.startsWith('http')) return path;

    // Remove any leading slashes to prevent double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Get the base URL from environment variables
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    let url = `${baseUrl}/${cleanPath}`;

    const { width, height, quality = 80 } = options;
    if (width || height) {
        const params = new URLSearchParams();
        if (width) params.append('w', width);
        if (height) params.append('h', height);
        params.append('q', quality);

        url = `${url}?${params.toString()}`;
    }

    return url;
}

export const getAssetUrl = (path) => {
    if (!path) return ''
    return path.startsWith('http') ? path : `${PUBLIC_URL}/assets${path}`
} 
