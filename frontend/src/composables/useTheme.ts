import { ref, watch } from 'vue';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'chat-theme';
const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
// Load theme from localStorage or default to 'light'
const currentTheme = ref<Theme>(savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light');

// Function to apply theme to DOM
const applyThemeToDOM = (theme: Theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
};

// Watch for theme changes and persist to localStorage
watch(currentTheme, (newTheme) => {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyThemeToDOM(newTheme);
});

// Apply initial theme
applyThemeToDOM(currentTheme.value);

export function useTheme() {
    const setTheme = (theme: Theme) => {
        currentTheme.value = theme;
    };

    const toggleTheme = () => {
        currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light';
    };

    const isDark = () => currentTheme.value === 'dark';

    return {
        theme: currentTheme,
        setTheme,
        toggleTheme,
        isDark,
    };
}
