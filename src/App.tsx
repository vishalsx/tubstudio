// App.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { LoginPage } from './pages/LoginPage';
import { MainApp } from './pages/MainApp';
import { useAuth } from './hooks/useAuth';
import './index.css'; // Import Tailwind CSS

const App: React.FC = () => {
  const auth = useAuth(); // Get the full auth object

  // Show loading spinner while checking authentication
  if (auth.isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFFFFF] via-[#E6F7FC] to-[#FDE6E0] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-[#00AEEF] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login page if not logged in
  if (!auth.isLoggedIn) {
    return <LoginPage authData={auth} />;
  }

  // Show main app if logged in
  return <MainApp authData={auth} />;
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);

export default App;