import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const locales = ['he', 'en', 'ar', 'ru'];
    const publicRoutes = ['', '/about', '/available-now', '/musicians', '/donate', '/open-day', '/contact', '/privacy', '/accessibility'];
    
    const entries: MetadataRoute.Sitemap = [];
    for (const locale of locales) {
        for (const route of publicRoutes) {
            entries.push({
                url: `https://harmonia.co.il/${locale}${route}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: route === '' ? 1.0 : 0.8,
            });
        }
    }
    return entries;
}
