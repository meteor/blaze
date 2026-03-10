import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Blaze",
    srcDir: "source",
    lang: 'en-US',
    base: '/blaze/',
    description: "The original MeteorJS Frontend",
    head: [['link', {rel: 'icon', href: '/logo/icon.ico'}]],
    themeConfig: {
        logo: '/logo/logo.png',
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            {text: 'Guide', link: '/guide/introduction'},
            {text: 'API', link: '/api/index'},
            {text: 'Migrations', link: '/migrations'},
            {text: 'Meteor Forums', link: 'https://forums.meteor.com/c/blaze'},
        ],

        sidebar: [
            {
                text: 'Guide',
                items: [
                    {text: 'Getting started', link: '/guide/introduction'},
                    {text: 'Templates', link: '/guide/spacebars'},
                    {text: 'Reusable Components', link: '/guide/reusable-components'},
                    {text: 'Smart Components', link: '/guide/smart-components'},
                    {text: 'Reusing Code', link: '/guide/reusing-code'},
                    {text: 'Routing', link: '/guide/routing'},
                    {text: 'Testing', link: '/guide/testing'},
                    {text: 'Understanding Blaze', link: '/guide/understanding-blaze'},
                ]
            },
            {
                text: 'API',
                items: [
                    {text: 'Overview', link: '/api/index'},
                    {text: 'Blaze', link: '/api/blaze'},
                    {text: 'Spacebars', link: '/api/spacebars'},
                    {text: 'Templates', link: '/api/templates'},
                ]
            },
            {
                text: 'Development',
                items: [
                    {text: 'Contributing', link: '/repo/CONTRIBUTING'}
                ]
            }
        ],
        search: {
            provider: 'local'
        },
        socialLinks: [
            {icon: 'github', link: 'https://github.com/meteor/blaze'}
        ],
        editLink: {
            pattern: 'https://github.com/meteor/blaze/edit/master/site/sources/:path'
        }
    },
    vite: {
        resolve: {
            preserveSymlinks: true
        }
    }
})
