import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 lg:ml-64 pt-4 pb-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
