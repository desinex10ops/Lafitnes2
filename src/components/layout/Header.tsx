import React, { useState, useEffect } from 'react';
import { User, RegisterSession } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Menu, LogOut, Wallet, Shield, Clock, Eye, EyeOff } from 'lucide-react';
import { ScreenId } from './Sidebar';
import { DatabaseService } from '../../services/db';

interface HeaderProps {
  currentUser: User | null;
  activeRegister: RegisterSession | null;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
  onNavigate: (screen: ScreenId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeRegister,
  onLogout,
  onOpenMobileMenu,
  onNavigate
}) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date().toISOString());
  const [hideBalances, setHideBalances] = useState<boolean>(DatabaseService.getHideBalances());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date().toISOString());
    }, 1000);

    const handlePrivacyChange = (e: any) => {
      setHideBalances(e.detail);
    };
    window.addEventListener('balance_privacy_changed', handlePrivacyChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener('balance_privacy_changed', handlePrivacyChange);
    };
  }, []);

  const toggleHideBalances = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVal = !hideBalances;
    setHideBalances(nextVal);
    DatabaseService.setHideBalances(nextVal);
  };

  const isRegisterOpen = activeRegister && activeRegister.status === 'ABERTO';

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 text-slate-100 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Botão Mobile & Título */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-md hover:bg-slate-800 text-slate-300 md:hidden"
          title="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex flex-col">
          <span className="text-xs font-black tracking-widest text-emerald-400 uppercase">
            LA FITNESS MODA ESPORTIVA
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            SISTEMA INTEGRADO DE FRENTE DE CAIXA E RETAGUARDA
          </span>
        </div>
      </div>

      {/* Indicadores de Caixa, Usuário e Ações */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Caixa com Opção de Ocultar Saldo (Estilo App de Banco) */}
        <div className="flex items-center">
          <button
            onClick={() => onNavigate('CAIXA')}
            className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-l text-xs font-bold transition-all border ${
              isRegisterOpen
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 hover:bg-emerald-900'
                : 'bg-red-950/80 border-red-600 text-red-300 hover:bg-red-900'
            }`}
            title="Clique para gerenciar o caixa"
          >
            <Wallet className="w-3.5 h-3.5 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="leading-none text-[11px]">
                {isRegisterOpen ? 'CAIXA ABERTO' : 'CAIXA FECHADO'}
              </span>
              {isRegisterOpen && (
                <span className="text-[10px] text-emerald-200 font-mono mt-0.5">
                  Espécie: {hideBalances ? 'R$ •••••' : formatCurrency(activeRegister.expectedCash)}
                </span>
              )}
            </div>
          </button>

          {/* Botão Olho - Ocultar/Exibir Saldo */}
          <button
            type="button"
            onClick={toggleHideBalances}
            className={`p-2 py-2.5 rounded-r border-y border-r transition-colors flex items-center justify-center ${
              isRegisterOpen
                ? 'bg-emerald-900/90 border-emerald-600 text-emerald-300 hover:bg-emerald-800 hover:text-white'
                : 'bg-red-900/90 border-red-600 text-red-300 hover:bg-red-800 hover:text-white'
            }`}
            title={hideBalances ? 'Mostrar valores (Modo Privacidade Ativo)' : 'Ocultar valores do caixa'}
          >
            {hideBalances ? (
              <EyeOff className="w-3.5 h-3.5 text-amber-300" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Relógio Digital */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatDateTime(currentDateTime)}</span>
        </div>

        {/* Usuário Logado */}
        {currentUser && (
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-200 truncate max-w-[140px]">
                {currentUser.name}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center justify-end gap-1">
                <Shield className="w-2.5 h-2.5" />
                {currentUser.role}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-800/60 transition-colors"
              title="Encerrar Sessão (Sair)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
