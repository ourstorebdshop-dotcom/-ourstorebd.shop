import { createSlice } from '@reduxjs/toolkit'

export const defaultHeaderFooterData = {
    header: {
        logoType: 'text', // 'text' | 'image'
        logoTextPrefix: 'Our',
        logoTextMiddle: 'Store',
        logoTextSuffix: 'BD',
        logoImageUrl: '',
        showSearch: true,
        searchPlaceholder: 'Search products...',
        showCategoriesDropdown: true,
        categoriesDropdownLabel: 'Categories',
        categoriesDropdownAllText: 'সকল প্রোডাক্ট দেখুন',
        showWishlist: true,
        wishlistLabel: 'Wishlist',
        showCart: true,
        cartLabel: 'Cart',
        showLogin: true,
        loginLabel: 'Login',
        isSticky: true,
        navLinks: [
            { id: 'nav_home', label: 'Home', path: '/', isExternal: false, isEnabled: true, order: 1 },
            { id: 'nav_shop', label: 'Shop', path: '/shop', isExternal: false, isEnabled: true, order: 2 },
            { id: 'nav_about', label: 'About', path: '/about', isExternal: false, isEnabled: true, order: 3 },
            { id: 'nav_contact', label: 'Contact', path: '/contact', isExternal: false, isEnabled: true, order: 4 },
        ],
    },
    footer: {
        showFooter: true,
        brand: {
            showBrand: true,
            titlePrefix: 'Our',
            titleMiddle: 'Store',
            titleSuffix: 'BD',
            logoUrl: '',
            description: 'Our Store BD is your trusted online electronics and gadgets shop in Bangladesh. We bring you 100% authentic tech products, smartphones, wireless earbuds, smartwatches, and lifestyle audio with fast nationwide home delivery across all 64 districts.',
        },
        social: {
            showSocial: true,
            links: [
                { id: 'soc_fb', platform: 'facebook', name: 'Facebook', url: 'https://www.facebook.com', isEnabled: true },
                { id: 'soc_ig', platform: 'instagram', name: 'Instagram', url: 'https://www.instagram.com', isEnabled: true },
                { id: 'soc_tw', platform: 'twitter', name: 'Twitter', url: 'https://twitter.com', isEnabled: true },
                { id: 'soc_li', platform: 'linkedin', name: 'LinkedIn', url: 'https://www.linkedin.com', isEnabled: true },
                { id: 'soc_yt', platform: 'youtube', name: 'YouTube', url: 'https://www.youtube.com', isEnabled: false },
                { id: 'soc_wa', platform: 'whatsapp', name: 'WhatsApp', url: 'https://wa.me/8801712345678', isEnabled: false },
                { id: 'soc_tk', platform: 'tiktok', name: 'TikTok', url: 'https://www.tiktok.com', isEnabled: false },
            ],
        },
        sections: [
            {
                id: 'sec_quick',
                title: 'QUICK NAVIGATION',
                isEnabled: true,
                links: [
                    { id: 'l_1', text: 'Home (হোম)', path: '/', isEnabled: true },
                    { id: 'l_2', text: 'Shop All Products (সকল পণ্য)', path: '/shop', isEnabled: true },
                    { id: 'l_3', text: 'About Us (আমাদের সম্পর্কে)', path: '/about', isEnabled: true },
                    { id: 'l_4', text: 'Contact & Helpline (যোগাযোগ)', path: '/contact', isEnabled: true },
                    { id: 'l_5', text: 'Customer Profile (প্রোফাইল)', path: '/profile', isEnabled: true },
                    { id: 'l_6', text: 'Track Order (অর্ডার ট্র্যাকিং)', path: '/profile?tab=orders', isEnabled: true },
                ],
            },
            {
                id: 'sec_contact',
                title: 'CONTACT INFO',
                isEnabled: true,
                links: [
                    { id: 'c_phone', iconType: 'phone', text: '+880 1712-345678', path: 'tel:+8801712345678', isEnabled: true },
                    { id: 'c_email', iconType: 'email', text: 'ourstorebd.shop@gmail.com', path: 'mailto:ourstorebd.shop@gmail.com', isEnabled: true },
                    { id: 'c_address', iconType: 'address', text: 'Dhanmondi, Dhaka-1209, Bangladesh', path: '/contact', isEnabled: true },
                ],
            },
        ],
        bottomBar: {
            showBottomBar: true,
            copyrightText: 'Copyright {year} © Our Store BD. All Rights Reserved. Made for Bangladesh 🇧🇩',
            showBadges: true,
            badgesText: '100% Authentic Products • Cash on Delivery • 7-Day Easy Return',
        },
    },
}

const headerFooterSlice = createSlice({
    name: 'headerFooter',
    initialState: defaultHeaderFooterData,
    reducers: {
        hydrateHeaderFooter: (state, action) => {
            if (action.payload && typeof action.payload === 'object') {
                return {
                    header: {
                        ...defaultHeaderFooterData.header,
                        ...(action.payload.header || {}),
                        navLinks: action.payload.header?.navLinks || defaultHeaderFooterData.header.navLinks,
                    },
                    footer: {
                        ...defaultHeaderFooterData.footer,
                        ...(action.payload.footer || {}),
                        brand: {
                            ...defaultHeaderFooterData.footer.brand,
                            ...(action.payload.footer?.brand || {}),
                        },
                        social: {
                            ...defaultHeaderFooterData.footer.social,
                            ...(action.payload.footer?.social || {}),
                            links: action.payload.footer?.social?.links || defaultHeaderFooterData.footer.social.links,
                        },
                        sections: action.payload.footer?.sections || defaultHeaderFooterData.footer.sections,
                        bottomBar: {
                            ...defaultHeaderFooterData.footer.bottomBar,
                            ...(action.payload.footer?.bottomBar || {}),
                        },
                    },
                }
            }
            return state
        },

        // ===== HEADER ACTIONS =====
        updateHeader: (state, action) => {
            state.header = {
                ...state.header,
                ...action.payload,
            }
        },
        addHeaderNavLink: (state, action) => {
            const newLink = {
                id: `nav_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                label: action.payload.label || 'New Link',
                path: action.payload.path || '/',
                isExternal: !!action.payload.isExternal,
                isEnabled: action.payload.isEnabled !== false,
                order: state.header.navLinks.length + 1,
            }
            state.header.navLinks.push(newLink)
        },
        updateHeaderNavLink: (state, action) => {
            const { id, updates } = action.payload
            const link = state.header.navLinks.find(l => l.id === id)
            if (link) {
                Object.assign(link, updates)
            }
        },
        deleteHeaderNavLink: (state, action) => {
            state.header.navLinks = state.header.navLinks.filter(l => l.id !== action.payload)
        },
        toggleHeaderNavLink: (state, action) => {
            const link = state.header.navLinks.find(l => l.id === action.payload)
            if (link) {
                link.isEnabled = !link.isEnabled
            }
        },
        reorderHeaderNavLinks: (state, action) => {
            if (Array.isArray(action.payload)) {
                state.header.navLinks = action.payload
            }
        },

        // ===== FOOTER ACTIONS =====
        updateFooter: (state, action) => {
            state.footer = {
                ...state.footer,
                ...action.payload,
            }
        },
        updateFooterBrand: (state, action) => {
            state.footer.brand = {
                ...state.footer.brand,
                ...action.payload,
            }
        },
        updateFooterSocialSettings: (state, action) => {
            state.footer.social = {
                ...state.footer.social,
                ...action.payload,
            }
        },
        addFooterSocialLink: (state, action) => {
            const newSocial = {
                id: `soc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                platform: action.payload.platform || 'facebook',
                name: action.payload.name || 'Social Link',
                url: action.payload.url || 'https://',
                isEnabled: action.payload.isEnabled !== false,
            }
            state.footer.social.links.push(newSocial)
        },
        updateFooterSocialLink: (state, action) => {
            const { id, updates } = action.payload
            const link = state.footer.social.links.find(l => l.id === id)
            if (link) {
                Object.assign(link, updates)
            }
        },
        deleteFooterSocialLink: (state, action) => {
            state.footer.social.links = state.footer.social.links.filter(l => l.id !== action.payload)
        },
        toggleFooterSocialLink: (state, action) => {
            const link = state.footer.social.links.find(l => l.id === action.payload)
            if (link) {
                link.isEnabled = !link.isEnabled
            }
        },

        // ===== FOOTER SECTIONS ACTIONS =====
        addFooterSection: (state, action) => {
            const newSection = {
                id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                title: action.payload.title || 'NEW SECTION',
                isEnabled: true,
                links: action.payload.links || [],
            }
            state.footer.sections.push(newSection)
        },
        updateFooterSection: (state, action) => {
            const { id, updates } = action.payload
            const sec = state.footer.sections.find(s => s.id === id)
            if (sec) {
                Object.assign(sec, updates)
            }
        },
        deleteFooterSection: (state, action) => {
            state.footer.sections = state.footer.sections.filter(s => s.id !== action.payload)
        },
        toggleFooterSection: (state, action) => {
            const sec = state.footer.sections.find(s => s.id === action.payload)
            if (sec) {
                sec.isEnabled = !sec.isEnabled
            }
        },

        // Links inside Footer Sections
        addFooterSectionLink: (state, action) => {
            const { sectionId, link } = action.payload
            const sec = state.footer.sections.find(s => s.id === sectionId)
            if (sec) {
                sec.links.push({
                    id: `l_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                    text: link.text || 'New Link',
                    path: link.path || '/',
                    iconType: link.iconType || null,
                    isEnabled: link.isEnabled !== false,
                })
            }
        },
        updateFooterSectionLink: (state, action) => {
            const { sectionId, linkId, updates } = action.payload
            const sec = state.footer.sections.find(s => s.id === sectionId)
            if (sec) {
                const item = sec.links.find(l => l.id === linkId)
                if (item) {
                    Object.assign(item, updates)
                }
            }
        },
        deleteFooterSectionLink: (state, action) => {
            const { sectionId, linkId } = action.payload
            const sec = state.footer.sections.find(s => s.id === sectionId)
            if (sec) {
                sec.links = sec.links.filter(l => l.id !== linkId)
            }
        },
        toggleFooterSectionLink: (state, action) => {
            const { sectionId, linkId } = action.payload
            const sec = state.footer.sections.find(s => s.id === sectionId)
            if (sec) {
                const item = sec.links.find(l => l.id === linkId)
                if (item) {
                    item.isEnabled = !item.isEnabled
                }
            }
        },

        // ===== FOOTER BOTTOM BAR =====
        updateFooterBottomBar: (state, action) => {
            state.footer.bottomBar = {
                ...state.footer.bottomBar,
                ...action.payload,
            }
        },

        // ===== RESET TO DEFAULTS =====
        resetHeaderFooter: () => {
            return JSON.parse(JSON.stringify(defaultHeaderFooterData))
        },
    },
})

export const {
    hydrateHeaderFooter,
    updateHeader,
    addHeaderNavLink,
    updateHeaderNavLink,
    deleteHeaderNavLink,
    toggleHeaderNavLink,
    reorderHeaderNavLinks,
    updateFooter,
    updateFooterBrand,
    updateFooterSocialSettings,
    addFooterSocialLink,
    updateFooterSocialLink,
    deleteFooterSocialLink,
    toggleFooterSocialLink,
    addFooterSection,
    updateFooterSection,
    deleteFooterSection,
    toggleFooterSection,
    addFooterSectionLink,
    updateFooterSectionLink,
    deleteFooterSectionLink,
    toggleFooterSectionLink,
    updateFooterBottomBar,
    resetHeaderFooter,
} = headerFooterSlice.actions

export default headerFooterSlice.reducer
