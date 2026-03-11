import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Blaze Docs",
    srcDir: "source",
    lang: 'en-US',
    base: '/blaze/',
    description: "The original MeteorJS Frontend",
    head: [['link', {rel: 'icon', href: '/logo/icon.ico'}]],
    lastUpdated: true,
    sitemap: {
        hostname: "https://blazejs.org",
    },
    themeConfig: {
        siteTitle: "Docs",
        logo: '/logo/logo.png',
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            {
                text: 'Docs', items: [
                    {text: 'Guide', link: '/guide/introduction'},
                    {text: 'API', link: '/api/index'},
                    {text: 'Migrations', link: '/migrations'},

                ]
            },
            {
                text: "Ecosystem",
                activeMatch: `^/ecosystem/`,
                items: [
                    {
                        text: "Community & Help",
                        items: [
                            {
                                text: "Meteor Forums",
                                link: "https://forums.meteor.com",
                            },
                            {
                                text: "Meteor Lounge Discord",
                                link: "https://discord.gg/hZkTCaVjmT",
                            },
                            {
                                text: "GitHub Discussions",
                                link: "https://github.com/meteor/blaze/discussions",
                            },
                        ],
                    },
                    {
                        text: "Resources",
                        items: [
                            {
                                text: "Packages on Atmosphere",
                                link: "https://atmospherejs.com/",
                            },
                            {
                                text: "DevTools - Chrome Extension",
                                link: "https://chromewebstore.google.com/detail/ibniinmoafhgbifjojidlagmggecmpgf",
                            },
                            {
                                text: "DevTools - Firefox Extension",
                                link: "https://addons.mozilla.org/en-US/firefox/addon/meteor-devtools-evolved/",
                            },
                        ],
                    },
                    {
                        text: "Learning",
                        items: [
                            {
                                text: "Meteor University",
                                link: "https://university.meteor.com",
                            },
                            {
                                text: "Youtube Channel",
                                link: "https://www.youtube.com/@meteorsoftware",
                            },
                        ],
                    },
                    {
                        text: "News",
                        items: [
                            { text: "Blog on Dev.to", link: "https://dev.to/meteor" },
                            { text: "Blog on Medium", link: "https://blog.meteor.com" },
                            { text: "Twitter", link: "https://x.com/meteorjs" },
                            {
                                text: "LinkedIn",
                                link: "https://www.linkedin.com/company/meteor-software/",
                            },
                        ],
                    },
                ],
            },
            { text: "Galaxy Cloud", link: "https://galaxycloud.app" },
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
                    {text: 'Contributing', link: '/repo/CONTRIBUTING'},
                    {text: 'Code of Conduct', link: '/repo/CODE_OF_CONDUCT'},
                    {text: 'Security', link: '/repo/SECURITY'}
                ]
            }
        ],
        search: {
            provider: 'local'
        },
        socialLinks: [
            {icon: 'github', link: 'https://github.com/meteor/blaze'},
            { icon: "twitter", link: "https://x.com/meteorjs" },
            { icon: "discord", link: "https://discord.gg/hZkTCaVjmT" },
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
