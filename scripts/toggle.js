document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const body = document.body;
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            themeToggleButton.innerHTML = '☀️'; 
        } else {
            body.classList.remove('dark-mode');
            themeToggleButton.innerHTML = '🌙'; 
        }
    };
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    themeToggleButton.addEventListener('click', () => {
        let currentTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
        let newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
});
