import { create } from 'zustand';

const THEME_KEY = 'familia-theme';

const getInitialTheme = () => {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === 'dark' || saved === 'light') return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
        return 'light';
    }
};

const applyTheme = (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch { /* storage may be unavailable */ }
};

export const useUIStore = create((set, get) => ({
    sidebarCollapsed: false,
    theme: getInitialTheme(),
    isLoading: false,
    modals: {
        createPost: false,
        editProfile: false,
    },

    toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed
    })),

    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

    setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
    },

    toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
    },

    setLoading: (isLoading) => set({ isLoading }),

    openModal: (modalName) => set((state) => ({
        modals: { ...state.modals, [modalName]: true },
    })),

    closeModal: (modalName) => set((state) => ({
        modals: { ...state.modals, [modalName]: false },
    })),

    toggleModal: (modalName) => set((state) => ({
        modals: { ...state.modals, [modalName]: !state.modals[modalName] },
    })),
}));
