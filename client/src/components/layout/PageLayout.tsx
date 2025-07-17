import { ReactNode } from 'react';
import CollapsibleSidebar from './CollapsibleSidebar';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function PageLayout({ children, title }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <CollapsibleSidebar />
      
      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4 lg:p-8">
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>
          )}
          
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}