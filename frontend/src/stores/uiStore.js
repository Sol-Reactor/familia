import { create } from 'zustand';

export const useUIStore = create((set) => ({
    sidebarCollapsed: false,
    theme: 'light',
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
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        set({ theme });
    },

    toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        return { theme: newTheme };
    }),

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
