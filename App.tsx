import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Students from './screens/Students';
import Schedule from './screens/Schedule';
import Lessons from './screens/Lessons';
import Earnings from './screens/Earnings';
import Settings from './screens/Settings';
import Layout from './components/Layout';
import { DemoDataProvider } from './contexts/DemoDataContext';
import { UserProfileProvider } from './contexts/UserProfileContext';
import { ScheduleProvider } from './contexts/ScheduleContext';
import { StudentsProvider } from './contexts/StudentsContext';
import { EarningsProvider } from './contexts/EarningsContext';

const App: React.FC = () => {
    return (
        <UserProfileProvider>
        <DemoDataProvider>
        <StudentsProvider>
        <ScheduleProvider>
        <EarningsProvider>
        <HashRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route 
                    path="/dashboard" 
                    element={
                        <Layout>
                            <Dashboard />
                        </Layout>
                    } 
                />
                <Route 
                    path="/students" 
                    element={
                        <Layout>
                            <Students />
                        </Layout>
                    } 
                />
                <Route 
                    path="/schedule" 
                    element={
                        <Layout>
                            <Schedule />
                        </Layout>
                    } 
                />
                <Route 
                    path="/lessons" 
                    element={
                        <Layout>
                            <Lessons />
                        </Layout>
                    } 
                />
                 <Route 
                    path="/earnings" 
                    element={
                        <Layout>
                            <Earnings />
                        </Layout>
                    } 
                />
                 <Route 
                    path="/settings" 
                    element={
                        <Layout>
                            <Settings />
                        </Layout>
                    } 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </HashRouter>
        </EarningsProvider>
        </ScheduleProvider>
        </StudentsProvider>
        </DemoDataProvider>
        </UserProfileProvider>
    );
};

export default App;
