import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { ViewState } from './types';
import { DashboardPage } from './pages/Dashboard';
import { PlanningPage } from './pages/Planning';
import { StudentsPage } from './pages/Students';
import { InstructorsPage } from './pages/Instructors';
import { SettingsPage } from './pages/Settings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD': return <DashboardPage />;
      case 'PLANNING': return <PlanningPage />;
      case 'STUDENTS': return <StudentsPage />;
      case 'INSTRUCTORS': return <InstructorsPage />;
      case 'SETTINGS': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default App;
