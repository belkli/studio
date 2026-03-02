import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/', '/about', '/available-now', '/musicians', '/donate', '/open-day', '/contact', '/events'],
                disallow: ['/dashboard/', '/admin/', '/api/'],
            },
        ],
        sitemap: 'https://harmonia.co.il/sitemap.xml',
    };
}
