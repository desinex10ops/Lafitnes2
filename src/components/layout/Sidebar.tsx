import React from 'react';
import { UserRole } from '../../types';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Truck,
  Users,
  Building2,
  Wallet,
  Receipt,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  ClipboardList,
  Database,
  UserCheck,
  Settings,
  Dumbbell
} from 'lucide-react';

export type ScreenId =
  | 'INICIO'
  | 'VENDAS'
  | 'ESTOQUE'
  | 'COMPRAS'
  | 'CLIENTES'
  | 'FORNECEDORES'
  | 'CAIXA'
  | 'DESPESAS'
  | 'CONTAS_A_PAGAR'
  | 'CONTAS_A_RECEBER'
  | 'RELATORIOS'
  | 'INVENTARIO'
  | 'BACKUP'
  | 'USUARIOS'
  | 'CONFIGURACOES';

interface SidebarProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  currentUserRole?: UserRole;
}

interface MenuItem {
  id: ScreenId;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export const isScreenAllowed = (screen: ScreenId, role?: UserRole): boolean => {
  if (!role || role === 'ADMINISTRADOR') return true;
  if (role === 'GERENTE') {
    return screen !== 'USUARIOS' && screen !== 'CONFIGURACOES';
  }
  // OPERADOR: sem acesso a USUARIOS, CONFIGURACOES, BACKUP, RELATORIOS
  return screen !== 'USUARIOS' && screen !== 'CONFIGURACOES' && screen !== 'BACKUP' && screen !== 'RELATORIOS';
};

const MENU_ITEMS: MenuItem[] = [
  { id: 'INICIO', label: '1. INÍCIO', icon: LayoutDashboard },
  { id: 'VENDAS', label: '2. VENDAS', icon: ShoppingCart, badge: 'PDV' },
  { id: 'ESTOQUE', label: '3. ESTOQUE', icon: Boxes },
  { id: 'COMPRAS', label: '4. COMPRAS', icon: Truck },
  { id: 'CLIENTES', label: '5. CLIENTES', icon: Users },
  { id: 'FORNECEDORES', label: '6. FORNECEDORES', icon: Building2 },
  { id: 'CAIXA', label: '7. CAIXA', icon: Wallet },
  { id: 'DESPESAS', label: '8. DESPESAS', icon: Receipt },
  { id: 'CONTAS_A_PAGAR', label: '9. CONTAS A PAGAR', icon: ArrowDownCircle },
  { id: 'CONTAS_A_RECEBER', label: '10. CONTAS A RECEBER', icon: ArrowUpCircle },
  { id: 'RELATORIOS', label: '11. RELATÓRIOS', icon: BarChart3 },
  { id: 'INVENTARIO', label: '12. INVENTÁRIO', icon: ClipboardList },
  { id: 'BACKUP', label: '13. BACKUP', icon: Database },
  { id: 'USUARIOS', label: '14. USUÁRIOS', icon: UserCheck },
  { id: 'CONFIGURACOES', label: '15. CONFIGURAÇÕES', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onSelectScreen,
  isOpenMobile,
  onCloseMobile,
  currentUserRole
}) => {
  return (
    <>
      {/* Overlay para celular */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Identidade Visual Loja */}
        <div className="h-16 px-4 flex items-center gap-3 border-b border-slate-800 bg-slate-900/80">
          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md font-extrabold text-xl">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm font-black tracking-wider text-emerald-400 truncate">
              LA FITNESS
            </h1>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest truncate">
              PDV & GESTÃO VAREJO
            </p>
          </div>
        </div>

        {/* Lista de Navegação Principal */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {MENU_ITEMS.filter((item) => isScreenAllowed(item.id, currentUserRole)).map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectScreen(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-normal ${
                      isActive ? 'bg-white text-emerald-800' : 'bg-emerald-900 text-emerald-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Rodapé do Menu com Versão */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/50 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Versão 1.0 (PWA)</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        </div>
      </aside>
    </>
  );
};
