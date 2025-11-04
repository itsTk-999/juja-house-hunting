import React, { createContext, useState, useEffect, useContext } from 'react';

// 1. Create the context
const ThemeContext = createContext();

// 2. Create the provider component
export const ThemeProvider = ({ children }) => {
  // Get initial theme from localStorage or default to 'light'
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    // You could also check OS preference here, but 'light' is a safe default
    return 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // 3. Effect to apply theme
  useEffect(() => {
    // Save preference to localStorage
    localStorage.setItem('theme', theme);
    // Apply the theme to the <html> tag for Bootstrap 5.3+ to read
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  // 4. Toggle function
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // 5. Provide the theme and toggle function to children
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 6. Create a custom hook to easily use the context
export const useTheme = () => useContext(ThemeContext);