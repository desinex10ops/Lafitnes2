import React, { useState } from 'react';
import { User } from '../types';
import { DatabaseService } from '../services/db';
import { Dumbbell, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [emailOrUser, setEmailOrUser] = useState('admin@lafitness.com.br');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  const availableUsers = DatabaseService.getUsers().filter(u => u.active);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const user = availableUsers.find(
        u => u.email.toLowerCase() === emailOrUser.toLowerCase().trim() ||
             u.name.toLowerCase().includes(emailOrUser.toLowerCase().trim())
      );

      if (!user) {
        setErrorMessage('USUÁRIO NÃO ENCONTRADO: Verifique o e-mail informado.');
        setIsLoading(false);
        return;
      }

      // Validação de senha
      if (user.passwordHash && password !== user.passwordHash) {
        setErrorMessage('SENHA INCORRETA: A senha digitada não confere.');
        setIsLoading(false);
        return;
      }

      DatabaseService.setCurrentUser(user);
      DatabaseService.logAudit('LOGIN', 'AUTENTICACAO', `Usuário ${user.name} (${user.role}) realizou login.`);
      setIsLoading(false);
      onLoginSuccess(user);
    }, 400);
  };


  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      {/* Card Principal de Login */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Topo com Identidade Visual Fitness */}
        <div className="bg-linear-to-r from-emerald-600 via-emerald-700 to-teal-800 p-6 text-center text-white relative">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg border border-emerald-400/40">
            <Dumbbell className="w-9 h-9 text-emerald-400" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-wider text-white">
            LA FITNESS
          </h1>
          <p className="text-xs text-emerald-100 font-semibold tracking-widest uppercase mt-0.5">
            SISTEMA PDV & GESTÃO COMERCIAL
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="p-6 md:p-8 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-700 text-red-200 text-xs rounded-lg flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              USUÁRIO OU E-MAIL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={emailOrUser}
                onChange={(e) => setEmailOrUser(e.target.value)}
                placeholder="exemplo@lafitness.com.br"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                SENHA
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                AUTENTICANDO...
              </span>
            ) : (
              <>
                <span>ENTRAR NO SISTEMA</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Mensagem Bíblica de Motivação para o Negócio */}
        <div className="p-5 bg-slate-950/95 border-t border-slate-800 text-center relative">
          <div className="flex items-center justify-center gap-1.5 mb-2 text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
              Palavra de Fé & Prosperidade
            </span>
          </div>
          <p className="text-xs italic text-slate-200 leading-relaxed font-serif">
            “Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos.”
          </p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/60 text-[10px] font-bold text-emerald-400 font-mono tracking-wider">
            Provérbios 16:3
          </span>
        </div>
      </div>

      {/* Versículo de Bênção no Rodapé */}
      <div className="mt-4 text-center max-w-sm px-4">
        <p className="text-[11px] text-slate-400 italic">
          “O Senhor te abençoará em tudo o que puseres a mão.” — <span className="text-slate-300 font-semibold not-italic">Deuteronômio 28:8</span>
        </p>
      </div>

      {/* Modal de Ajuda de Recuperação de Senha */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
              RECUPERAÇÃO DE SENHA
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Por medidas de segurança corporativa, a redefinição de senhas de operadores e gerentes é realizada diretamente pelo <strong className="text-white">Administrador</strong> do sistema na tela <strong className="text-white">14. USUÁRIOS</strong>.
            </p>
            <p className="text-xs text-slate-400">
              Senhas padrão de acesso:<br />
              • Admin (Layne): <code className="text-emerald-400 font-mono">admin123</code> (ou e-mail: admin@lafitness.com.br)<br />
              • Gerente: <code className="text-emerald-400 font-mono">gerente123</code><br />
              • Caixa: <code className="text-emerald-400 font-mono">caixa123</code>
            </p>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold uppercase"
            >
              ENTENDI
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
