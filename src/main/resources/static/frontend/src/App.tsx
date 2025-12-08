import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { MoonIcon, SunIcon } from './components/Icons';
import AuthModal from './components/AuthModal';
import { useAuth } from './contexts/AuthContext';
import OperationLogPanel from './components/OperationLogPanel';

const navigation = [
  { label: 'Home', path: '/' },
  { label: 'Students', path: '/students' },
  { label: 'Modules', path: '/modules' },
  { label: 'History', path: '/history' },
  { label: 'APIs hub', path: '/doc-api/' },
];

type AppContext = {
  refreshOps: () => void;
};

const App = () => {
  const { user, openAuth, logout } = useAuth();
  const location = useLocation();
  const preferredTheme = useMemo<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }, []);

  const [theme, setTheme] = useState<'light' | 'dark'>(preferredTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const [operationRefresh, setOperationRefresh] = useState(0);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'light' : 'dark');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  const refreshOps = () => setOperationRefresh((prev) => prev + 1);
  const showOperationLog = location.pathname === '/';

  const themeIcon = theme === 'light' ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />;
  const themeLabel = theme === 'light' ? 'Dark mode' : 'Light mode';

  return (
    <div className={`app-shell ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-14">
        <header className="glass-panel relative z-20 flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 text-white text-lg font-bold">
              U
            </div>
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.2em] font-bold text-secondary">UCL COMP0010</p>
              <p className="text-lg font-bold tracking-tight text-primary">Management Centre</p>
            </div>
          </div>
          <nav className="order-3 flex w-full flex-wrap items-center justify-center gap-1 rounded-full bg-black/20 p-1.5 backdrop-blur-md sm:order-none sm:w-auto border border-white/10">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-white text-black shadow-md scale-105'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`
                }
                end={item.path === '/'}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex flex-1 items-center justify-end gap-3" ref={menuRef}>
            {user ? (
              <div className="hidden rounded-full bg-black/20 px-3 py-1.5 text-xs font-medium text-slate-300 border border-white/5 sm:block backdrop-blur-sm">
                Signed in as <span className="text-white font-semibold">{user.username}</span>
              </div>
            ) : (
              <div className="hidden rounded-full bg-black/20 px-3 py-1.5 text-xs font-medium text-slate-300 border border-white/5 sm:block backdrop-blur-sm">
                Read-only
              </div>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="icon-button"
                aria-label="User menu"
              >
                <span aria-hidden>👤</span>
                <span className="hidden sm:inline">User</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-30 mt-2 w-48 rounded-2xl menu-surface p-2 text-sm">
                  <button
                    type="button"
                    className="w-full rounded-xl px-3 py-2 text-left hover:bg-white/10 transition-colors"
                    onClick={() => {
                      setMenuOpen(false);
                      openAuth('login');
                    }}
                  >
                    {user ? 'Switch user / log in' : 'Log in'}
                  </button>
                  {user && (
                    <button
                      type="button"
                      className="w-full rounded-xl px-3 py-2 text-left hover:bg-white/10 transition-colors text-red-400 hover:text-red-300"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                    >
                      Log out
                    </button>
                  )}
                </div>
              )}
            </div>
            <button type="button" onClick={toggleTheme} className="icon-button compact" aria-label={themeLabel}>
              {themeIcon}
            </button>
          </div>
        </header>

        {showOperationLog && (
          <OperationLogPanel refreshToken={operationRefresh} onReverted={refreshOps} />
        )}
        <Outlet context={{ refreshOps } satisfies AppContext} />
        <AuthModal />
      </div>
    </div>
  );
};

export default App;

