import { MetadataRoute } from 'next';
import { BRAND_DOMAIN } from '@/lib/brand';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/', '/about', '/available-now', '/musicians', '/donate', '/open-day', '/contact', '/events'],
                disallow: ['/dashboard/', '/admin/', '/api/'],
            },
        ],
        sitemap: `${BRAND_DOMAIN}/sitemap.xml`,
    };
}
