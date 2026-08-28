import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import { OrganizationProvider } from './providers/OrganizationProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import AppRouter from './router/AppRouter';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <OrganizationProvider>
              <AppRouter />
            </OrganizationProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;