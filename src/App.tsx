import React, { useState, useEffect } from 'react';
import { User, RegisterSession } from './types';
import { DatabaseService } from './services/db';
import { Sidebar, ScreenId, isScreenAllowed } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Telas do Sistema
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { SalesScreen } from './screens/SalesScreen';
import { StockScreen } from './screens/StockScreen';
import { PurchasesScreen } from './screens/PurchasesScreen';
import { CustomersScreen } from './screens/CustomersScreen';
import { SuppliersScreen } from './screens/SuppliersScreen';
import { CashRegisterScreen } from './screens/CashRegisterScreen';
import { ExpensesScreen } from './screens/ExpensesScreen';
import { AccountsPayableScreen } from './screens/AccountsPayableScreen';
import { AccountsReceivableScreen } from './screens/AccountsReceivableScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { BackupScreen } from './screens/BackupScreen';
import { UsersScreen } from './screens/UsersScreen';
import { SettingsScreen } from './screens/SettingsScreen';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(DatabaseService.getCurrentUser());
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('INICIO');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeRegister, setActiveRegister] = useState<RegisterSession | null>(DatabaseService.getActiveRegister());

  // Atualiza estado do caixa periodicamente ou em navegações
  useEffect(() => {
    const checkRegister = () => {
      setActiveRegister(DatabaseService.getActiveRegister());
    };
    checkRegister();
    const interval = setInterval(checkRegister, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentScreen('INICIO');
  };

  const handleLogout = () => {
    DatabaseService.setCurrentUser(null);
    setCurrentUser(null);
  };

  // Se não autenticado, renderiza a tela de login
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Renderizador dinâmico de telas com proteção de rotas (RBAC)
  const renderScreen = () => {
    if (!isScreenAllowed(currentScreen, currentUser?.role)) {
      return (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl max-w-md mx-auto my-12 space-y-4">
          <div className="w-12 h-12 bg-red-950/80 border border-red-700 text-red-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-base font-bold uppercase tracking-wider text-white">ACESSO RESTRITO</h2>
          <p className="text-xs text-slate-300">
            Seu perfil ({currentUser?.role}) não possui permissão para acessar este módulo.
          </p>
          <button
            onClick={() => setCurrentScreen('INICIO')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase cursor-pointer"
          >
            Voltar ao Início
          </button>
        </div>
      );
    }

    switch (currentScreen) {
      case 'INICIO':
        return <DashboardScreen onNavigate={(screen) => setCurrentScreen(screen)} />;
      case 'VENDAS':
        return <SalesScreen onOpenCashRegister={() => setCurrentScreen('CAIXA')} />;
      case 'ESTOQUE':
        return <StockScreen />;
      case 'COMPRAS':
        return <PurchasesScreen />;
      case 'CLIENTES':
        return <CustomersScreen />;
      case 'FORNECEDORES':
        return <SuppliersScreen />;
      case 'CAIXA':
        return <CashRegisterScreen />;
      case 'DESPESAS':
        return <ExpensesScreen />;
      case 'CONTAS_A_PAGAR':
        return <AccountsPayableScreen />;
      case 'CONTAS_A_RECEBER':
        return <AccountsReceivableScreen />;
      case 'RELATORIOS':
        return <ReportsScreen />;
      case 'INVENTARIO':
        return <InventoryScreen />;
      case 'BACKUP':
        return <BackupScreen />;
      case 'USUARIOS':
        return <UsersScreen />;
      case 'CONFIGURACOES':
        return <SettingsScreen />;
      default:
        return <DashboardScreen onNavigate={(screen) => setCurrentScreen(screen)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* 1. Menu Lateral Fixo com 15 Itens Obrigatórios em Maiúsculas */}
      <Sidebar
        currentScreen={currentScreen}
        onSelectScreen={(screen) => setCurrentScreen(screen)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        currentUserRole={currentUser?.role}
      />

      {/* Conteúdo Principal com Topbar e Área de Telas */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Header
          currentUser={currentUser}
          activeRegister={activeRegister}
          onLogout={handleLogout}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onNavigate={(screen) => setCurrentScreen(screen)}
        />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {renderScreen()}
        </main>
      </div>
    </div>
  );
};

export default App;
