from pathlib import Path

path = Path(''Frontend/src/app.jsx'')
text = path.read_text(encoding='utf-8')
start = text.index(''function Navigation({'')
end = text.index(''function HomeSection'', start)
new_block = '''function Navigation({
  currentSection,
  setCurrentSection,
  mobileMenuOpen,
  setMobileMenuOpen,
  theme,
  setTheme,
  language,
  setLanguage,
  t,
}) {
  const navItems = [
    { id: 'home', label: t('nav_home'), icon: Home },
    { id: 'about', label: t('nav_about'), icon: Users },
    { id: 'features', label: t('nav_features'), icon: Award },
    { id: 'diagnostic', label: t('nav_diag'), icon: Stethoscope },
  ];
  const languages = [
    { value: 'en', label: 'English' },
    { value: 'ru', label: 'Russian' },
    { value: 'ar', label: 'Arabic' },
  ];
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">DiagnoAI</h1>
              <p className="text-xs text-gray-500">Pancreas Diagnostic</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentSection(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentSection === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <select
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {languages.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              onClick={toggleTheme}
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
            <div className="px-2 pt-2 pb-3 space-y-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium ${
                    currentSection === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}

              <div className="px-3 py-2">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                  {t('language')}
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {languages.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={toggleTheme}
                className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
'''
text = text[:start] + new_block.replace('\n', '\r\n') + text[end:]
path.write_text(text, encoding='utf-8')
