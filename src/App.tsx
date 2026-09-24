/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { I18nProvider, useI18n } from './i18n/I18nContext.tsx';
import { db } from './data/storage.ts';
import { SlicerId } from './types/index.ts';

// Layout & Components
import { Header } from './components/Header.tsx';
import { NavDrawer } from './components/NavDrawer.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { RigSwitcherModal } from './components/RigSwitcherModal.tsx';

// Views
import { DashboardView } from './views/DashboardView.tsx';
import { CalibrateWorkflowView } from './views/CalibrateWorkflowView.tsx';
import { MvsCalibrationView } from './views/MvsCalibrationView.tsx';
import { MasterProfileView } from './views/MasterProfileView.tsx';
import { HistoryView } from './views/HistoryView.tsx';
import { SettingsView } from './views/SettingsView.tsx';
import { HardwareManagerView } from './views/HardwareManagerView.tsx';
import { SlicersManagerView } from './views/SlicersManagerView.tsx';

function MainApp() {
  const { t } = useI18n();
  const [, setRevision] = useState(0);

  // App Navigation State
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isRigSwitcherOpen, setIsRigSwitcherOpen] = useState<boolean>(false);

  // Subscribe to reactive database changes
  useEffect(() => {
    return db.subscribe(() => {
      setRevision((r) => r + 1);
    });
  }, []);

  // Live state from local storage repository
  const settings = db.getSettings();
  const slicers = db.getSlicers();
  const printers = db.getPrinters();
  const filaments = db.getFilaments();
  const calibrationItems = db.getCalibrationItems();
  const resultsHistory = db.getResultsHistory();
  const masterProfile = db.getMasterProfile();

  const activeSlicer = slicers.find((s) => s.id === settings.activeSlicerId) || slicers[0];
  const activePrinter = printers.find((p) => p.id === settings.activePrinterId) || printers[0];
  const activeFilament = filaments.find((f) => f.id === settings.activeFilamentId) || filaments[0];

  // Path label helper
  const getPathName = () => {
    switch (currentView) {
      case 'dashboard':
        return t('nav.dashboard');
      case 'calibrate':
        return t('nav.calibrate');
      case 'mvs-test':
        return 'MVS Test';
      case 'master':
        return t('nav.master');
      case 'history':
        return t('nav.history');
      case 'settings':
        return t('nav.settings');
      case 'printers':
        return t('nav.printers');
      case 'filaments':
        return t('nav.filaments');
      case 'slicers':
        return t('nav.slicers');
      default:
        return '3DCP';
    }
  };

  const handleSelectSlicer = (id: SlicerId) => {
    db.setActiveRig(id, undefined, undefined);
  };

  const handleSelectPrinter = (id: string) => {
    db.setActiveRig(undefined, id, undefined);
  };

  const handleSelectFilament = (id: string) => {
    db.setActiveRig(undefined, undefined, id);
  };

  const handleOpenTest = (testType: string) => {
    if (testType === 'MVS') {
      setCurrentView('mvs-test');
    } else {
      // Direct navigation to calibrate view anchored to tests
      setCurrentView('calibrate');
      setTimeout(() => {
        const el = document.getElementById('step-tests');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans selection:bg-primary/30 selection:text-primary">
      {/* Fixed Sticky Header */}
      <Header
        currentPathName={getPathName()}
        activePrinter={activePrinter}
        activeFilament={activeFilament}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenRigSwitcher={() => setIsRigSwitcherOpen(true)}
        onStartCalibration={() => setCurrentView('calibrate')}
        onOpenSettings={() => setCurrentView('settings')}
      />

      {/* Navigation Drawer */}
      <NavDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        activePrinter={activePrinter}
        activeFilament={activeFilament}
      />

      {/* Quick Rig Switcher Modal */}
      <RigSwitcherModal
        isOpen={isRigSwitcherOpen}
        onClose={() => setIsRigSwitcherOpen(false)}
        printers={printers}
        activePrinter={activePrinter}
        onSelectPrinter={handleSelectPrinter}
        filaments={filaments}
        activeFilament={activeFilament}
        onSelectFilament={handleSelectFilament}
        slicers={slicers}
        activeSlicer={activeSlicer}
        onSelectSlicer={handleSelectSlicer}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-20 transition-opacity duration-200">
        {currentView === 'dashboard' && (
          <DashboardView
            activePrinter={activePrinter}
            activeFilament={activeFilament}
            activeSlicer={activeSlicer}
            calibrationItems={calibrationItems}
            recentHistory={resultsHistory}
            onStartCalibration={() => setCurrentView('calibrate')}
            onOpenTest={handleOpenTest}
            onSwitchRig={() => setIsRigSwitcherOpen(true)}
            onViewAllHistory={() => setCurrentView('history')}
            onViewMaster={() => setCurrentView('master')}
          />
        )}

        {currentView === 'calibrate' && (
          <CalibrateWorkflowView
            slicers={slicers}
            activeSlicer={activeSlicer}
            onSelectSlicer={handleSelectSlicer}
            printers={printers}
            activePrinter={activePrinter}
            onSelectPrinter={handleSelectPrinter}
            onAddNewPrinter={() => setCurrentView('printers')}
            filaments={filaments}
            activeFilament={activeFilament}
            onSelectFilament={handleSelectFilament}
            onAddNewFilament={() => setCurrentView('filaments')}
            calibrationItems={calibrationItems}
            onOpenTest={handleOpenTest}
            onViewMasterProfile={() => setCurrentView('master')}
          />
        )}

        {currentView === 'mvs-test' && (
          <MvsCalibrationView
            activePrinter={activePrinter}
            activeFilament={activeFilament}
            activeSlicer={activeSlicer}
            onBackToWorkflow={() => setCurrentView('calibrate')}
            onSavedToMaster={() => setCurrentView('master')}
          />
        )}

        {currentView === 'master' && (
          <MasterProfileView
            masterProfile={masterProfile}
            activePrinter={activePrinter}
            activeFilament={activeFilament}
            activeSlicer={activeSlicer}
            onCalibrateParam={(param) => handleOpenTest(param)}
            onRefresh={() => setRevision((r) => r + 1)}
          />
        )}

        {currentView === 'history' && (
          <HistoryView
            history={resultsHistory}
            onOpenTest={handleOpenTest}
            onRefresh={() => setRevision((r) => r + 1)}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView onRefreshAll={() => setRevision((r) => r + 1)} />
        )}

        {currentView === 'printers' && (
          <HardwareManagerView
            initialTab="printers"
            printers={printers}
            activePrinter={activePrinter}
            filaments={filaments}
            activeFilament={activeFilament}
            onSelectPrinter={handleSelectPrinter}
            onSelectFilament={handleSelectFilament}
            onRefresh={() => setRevision((r) => r + 1)}
          />
        )}

        {currentView === 'filaments' && (
          <HardwareManagerView
            initialTab="filaments"
            printers={printers}
            activePrinter={activePrinter}
            filaments={filaments}
            activeFilament={activeFilament}
            onSelectPrinter={handleSelectPrinter}
            onSelectFilament={handleSelectFilament}
            onRefresh={() => setRevision((r) => r + 1)}
          />
        )}

        {currentView === 'slicers' && (
          <SlicersManagerView
            slicers={slicers}
            activeSlicer={activeSlicer}
            onSelectSlicer={handleSelectSlicer}
          />
        )}
      </main>

      {/* Touch-Friendly Bottom Bar */}
      <BottomNav
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
      />
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <MainApp />
    </I18nProvider>
  );
}
