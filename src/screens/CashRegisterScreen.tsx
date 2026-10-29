import React, { useState, useEffect } from 'react';
import { RegisterSession, RegisterMovement, StoreSettings } from '../types';
import { DatabaseService } from '../services/db';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Lock,
  Unlock,
  Printer,
  History,
  AlertTriangle,
  Receipt,
  FileCheck2,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';

export const CashRegisterScreen: React.FC = () => {
  const [activeRegister, setActiveRegister] = useState<RegisterSession | null>(DatabaseService.getActiveRegister());
  const [pastRegisters, setPastRegisters] = useState<RegisterSession[]>(
    DatabaseService.getRegisters().filter(r => r.status === 'FECHADO')
  );
  const currentUser = DatabaseService.getCurrentUser();
  const settings = DatabaseService.getSettings();
  const [hideBalances, setHideBalances] = useState<boolean>(DatabaseService.getHideBalances());

  const refreshRegisters = () => {
    setActiveRegister(DatabaseService.getActiveRegister());
    setPastRegisters(DatabaseService.getRegisters().filter(r => r.status === 'FECHADO'));
  };

  useEffect(() => {
    const handlePrivacyChange = (e: any) => {
      setHideBalances(e.detail);
    };
    window.addEventListener('balance_privacy_changed', handlePrivacyChange);
    return () => window.removeEventListener('balance_privacy_changed', handlePrivacyChange);
  }, []);

  // Modais
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<'SUPRIMENTO' | 'SANGRIA'>('SUPRIMENTO');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPrintCloseModal, setShowPrintCloseModal] = useState(false);
  const [selectedPastSession, setSelectedPastSession] = useState<RegisterSession | null>(null);

  // Estados dos formulários
  const [initialCashInput, setInitialCashInput] = useState('200.00');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDescription, setMovementDescription] = useState('');
  const [countedCashInput, setCountedCashInput] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  const isRegisterOpen = activeRegister && activeRegister.status === 'ABERTO';

  // Abrir Caixa
  const handleOpenRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(parseFloat(initialCashInput) || 0);
    const opId = currentUser?.id || 'admin';
    const opName = currentUser?.name || 'Administrador';

    const res = DatabaseService.openRegister(opId, opName, amount);
    if (!res.success) {
      alert(`ERRO: ${res.message}`);
      return;
    }

    refreshRegisters();
    alert(res.message);
    setShowOpenModal(false);
  };

  // Registrar Movimentação (Suprimento / Sangria)
  const handleRegisterMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(parseFloat(movementAmount) || 0);
    if (amount <= 0) {
      alert('Informe um valor válido.');
      return;
    }
    if (!movementDescription.trim()) {
      alert('Informe a justificativa.');
      return;
    }

    const res = DatabaseService.addRegisterMovement(movementType, amount, movementDescription);
    if (!res.success) {
      alert(`ERRO: ${res.message}`);
      return;
    }

    refreshRegisters();
    alert(res.message);
    setMovementAmount('');
    setMovementDescription('');
    setShowMovementModal(false);
  };

  // Fechar Caixa
  const handleOpenCloseModal = () => {
    if (!activeRegister) return;
    setCountedCashInput(activeRegister.expectedCash.toFixed(2));
    setCloseNotes('');
    setShowCloseModal(true);
  };

  const handleConfirmCloseRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const counted = Number(parseFloat(countedCashInput) || 0);
    const res = DatabaseService.closeRegister(counted, closeNotes);
    if (!res.success) {
      alert(`ERRO: ${res.message}`);
      return;
    }

    refreshRegisters();
    if (res.backupData) {
      // Dispara o download automático da cópia no computador do caixa (Opção 1)
      const blob = new Blob([res.backupData.json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = res.backupData.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`Caixa fechado com sucesso!\n\n🛡️ BACKUP AUTOMÁTICO EXECUTADO (OPÇÕES 1 & 2):\n• Cópia de segurança gerada: ${res.backupData.filename}\n• Download automático realizado para este computador.\n• Sincronização em nuvem registrada com sucesso.`);
    } else {
      alert(res.message);
    }

    setShowCloseModal(false);
    setSelectedPastSession(res.session!);
    setShowPrintCloseModal(true);
  };

  return (
    <div className="space-y-5">
      {/* Topo do Módulo de Caixa */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-lg border border-slate-800">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            CONTROLE DE CAIXA POR OPERADOR & TURNO
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Abertura, suprimento, sangria e fechamento com conferência física cega ou informada
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isRegisterOpen ? (
            <button
              onClick={() => setShowOpenModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase shadow cursor-pointer transition-colors"
            >
              <Unlock className="w-4 h-4" />
              ABRIR SESSÃO DE CAIXA
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setMovementType('SUPRIMENTO');
                  setShowMovementModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg text-xs font-bold uppercase cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                + REFORÇO / SUPRIMENTO
              </button>
              <button
                onClick={() => {
                  setMovementType('SANGRIA');
                  setShowMovementModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-red-400 border border-slate-700 rounded-lg text-xs font-bold uppercase cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                - SANGRIA / RETIRADA
              </button>
              <button
                onClick={handleOpenCloseModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold uppercase shadow cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                FECHAR CAIXA
              </button>
            </>
          )}
        </div>
      </div>

      {/* PAINEL DA SESSÃO ATIVA (SE ABERTO) */}
      {isRegisterOpen ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Saldo Esperado em Espécie */}
            <div className="bg-slate-900 border border-emerald-600/60 rounded-lg p-5 flex flex-col justify-between shadow-lg">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  SALDO EM DINHEIRO ESPERADO
                </span>
                <button
                  type="button"
                  onClick={() => DatabaseService.setHideBalances(!hideBalances)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title={hideBalances ? 'Mostrar valores' : 'Ocultar valores'}
                >
                  {hideBalances ? <EyeOff className="w-4 h-4 text-amber-300" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="my-2">
                <span className="text-3xl font-black text-white font-mono">
                  {hideBalances ? 'R$ •••••••' : formatCurrency(activeRegister.expectedCash)}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex justify-between">
                <span>Fundo inicial:</span>
                <span className="font-mono text-slate-200">
                  {hideBalances ? 'R$ •••••' : formatCurrency(activeRegister.initialCash)}
                </span>
              </div>
            </div>

            {/* Vendas no Dinheiro */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between shadow-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">VENDAS EM ESPÉCIE</span>
                <Receipt className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold text-emerald-400 font-mono">
                  {formatCurrency(activeRegister.totalCashSales)}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex justify-between">
                <span>Operador:</span>
                <span className="font-bold text-slate-200">{activeRegister.operatorName}</span>
              </div>
            </div>

            {/* Suprimentos & Entradas */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between shadow-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">ENTRADAS / REFORÇO</span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold text-emerald-400 font-mono">
                  +{formatCurrency(activeRegister.totalCashInflows)}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex justify-between">
                <span>Abertura:</span>
                <span className="font-mono text-slate-200">{formatDateTime(activeRegister.openedAt)}</span>
              </div>
            </div>

            {/* Sangrias & Despesas Pagas */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between shadow-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">SANGRIAS & DESPESAS</span>
                <ArrowUpRight className="w-4 h-4 text-red-400" />
              </div>
              <div className="my-2">
                <span className="text-2xl font-bold text-red-400 font-mono">
                  -{formatCurrency(activeRegister.totalCashOutflows)}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex justify-between">
                <span>Status:</span>
                <span className="font-black text-emerald-400 uppercase">ABERTO</span>
              </div>
            </div>
          </div>

          {/* Vendas Eletrônicas do Turno (Não afetam dinheiro físico) */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              VENDAS ELETRÔNICAS DO TURNO (NÃO CONTABILIZADAS NO GAVETEIRO FÍSICO):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">PIX</span>
                <span className="text-base font-bold text-white">{formatCurrency(activeRegister.totalPixSales)}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">CARTÃO DE DÉBITO</span>
                <span className="text-base font-bold text-white">{formatCurrency(activeRegister.totalDebitSales)}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">CARTÃO DE CRÉDITO</span>
                <span className="text-base font-bold text-white">{formatCurrency(activeRegister.totalCreditSales)}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">DUPLICATAS (A PRAZO)</span>
                <span className="text-base font-bold text-amber-400">{formatCurrency(activeRegister.totalDuplicataSales)}</span>
              </div>
            </div>
          </div>

          {/* Extrato de Movimentações da Sessão */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
            <div className="p-3 bg-slate-950 border-b border-slate-800 text-xs text-slate-400 font-bold uppercase">
              EXTRATO DE MOVIMENTAÇÕES DO CAIXA ATIVO
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">HORÁRIO</th>
                    <th className="py-2.5 px-3 text-center">TIPO</th>
                    <th className="py-2.5 px-3">JUSTIFICATIVA / DESCRIÇÃO</th>
                    <th className="py-2.5 px-3 text-right">VALOR</th>
                    <th className="py-2.5 px-3">RESPONSÁVEL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {activeRegister.movements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {formatDateTime(mov.createdAt)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                            mov.type === 'SUPRIMENTO' || mov.type === 'RECEBIMENTO_DUPLICATA'
                              ? 'bg-emerald-950 text-emerald-300'
                              : 'bg-red-950 text-red-300'
                          }`}
                        >
                          {mov.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium">
                        {mov.description}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-sm">
                        <span className={mov.type === 'SUPRIMENTO' || mov.type === 'RECEBIMENTO_DUPLICATA' ? 'text-emerald-400' : 'text-red-400'}>
                          {mov.type === 'SANGRIA' || mov.type === 'DESPESA' ? '-' : '+'}
                          {formatCurrency(mov.amount)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {mov.userName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Caixa Fechado */
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-red-950/60 border border-red-800 text-red-400 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold uppercase text-white tracking-wider">
            NENHUM CAIXA ABERTO NO MOMENTO
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Para iniciar o turno, realizar vendas no PDV e lançar despesas, realize a abertura do caixa informando o valor inicial em dinheiro.
          </p>
          <button
            onClick={() => setShowOpenModal(true)}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase shadow-lg"
          >
            Abrir Caixa Agora
          </button>
        </div>
      )}

      {/* HISTÓRICO DE FECHAMENTOS ANTERIORES */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
        <div className="p-3 bg-slate-950 border-b border-slate-800 text-xs text-slate-400 font-bold uppercase flex justify-between items-center">
          <span>HISTÓRICO DE FECHAMENTOS ANTERIORES</span>
          <span className="text-[11px] font-mono">{pastRegisters.length} fechamentos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
              <tr>
                <th className="py-2.5 px-3">ABERTURA</th>
                <th className="py-2.5 px-3">FECHAMENTO</th>
                <th className="py-2.5 px-3">OPERADOR</th>
                <th className="py-2.5 px-3 text-right">ESPERADO</th>
                <th className="py-2.5 px-3 text-right">CONTADO</th>
                <th className="py-2.5 px-3 text-right">DIFERENÇA</th>
                <th className="py-2.5 px-3 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {pastRegisters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 font-bold uppercase">
                    Nenhum fechamento registrado no histórico.
                  </td>
                </tr>
              ) : (
                pastRegisters.map(sess => (
                  <tr key={sess.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{formatDateTime(sess.openedAt)}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{formatDateTime(sess.closedAt)}</td>
                    <td className="py-2.5 px-3 font-bold uppercase text-white">{sess.operatorName}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(sess.expectedCash)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">{formatCurrency(sess.countedCash)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={(sess.cashDifference || 0) < 0 ? 'text-red-400' : (sess.cashDifference || 0) > 0 ? 'text-emerald-400' : 'text-slate-400'}>
                        {formatCurrency(sess.cashDifference)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedPastSession(sess);
                          setShowPrintCloseModal(true);
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400"
                        title="Reimprimir Comprovante de Fechamento"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE ABERTURA DE CAIXA */}
      <Modal
        isOpen={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        title="ABERTURA DE CAIXA / TURNO"
        maxWidth="md"
      >
        <form onSubmit={handleOpenRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-300 block">
              VALOR INICIAL EM DINHEIRO (FUNDO DE TROCO)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={initialCashInput}
              onChange={(e) => setInitialCashInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-emerald-400 font-mono font-black text-lg focus:border-emerald-500"
            />
          </div>

          <div className="text-xs text-slate-400 space-y-1 p-3 bg-slate-950 rounded border border-slate-800">
            <p>Operador: <strong className="text-white">{currentUser?.name || 'Administrador'}</strong></p>
            <p>Caixa: <strong className="text-white">PDV 01</strong></p>
            <p>Data & Hora: <strong className="text-white">{formatDateTime(new Date().toISOString())}</strong></p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowOpenModal(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs font-bold uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold uppercase shadow"
            >
              Confirmar Abertura
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE MOVIMENTAÇÃO (SUPRIMENTO / SANGRIA) */}
      <Modal
        isOpen={showMovementModal}
        onClose={() => setShowMovementModal(false)}
        title={`LANÇAR ${movementType} DE CAIXA`}
        maxWidth="md"
      >
        <form onSubmit={handleRegisterMovement} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-300 block">
              VALOR EM DINHEIRO (R$)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={movementAmount}
              onChange={(e) => setMovementAmount(e.target.value)}
              placeholder="0,00"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono font-bold text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-300 block">
              JUSTIFICATIVA / MOTIVO (OBRIGATÓRIO)
            </label>
            <textarea
              required
              rows={2}
              value={movementDescription}
              onChange={(e) => setMovementDescription(e.target.value)}
              placeholder={movementType === 'SUPRIMENTO' ? 'Ex: Reforço de troco em moedas...' : 'Ex: Retirada para cofre / pagamento de despesa...'}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowMovementModal(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs font-bold uppercase"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded text-xs font-bold uppercase shadow text-white ${
                movementType === 'SUPRIMENTO' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              Confirmar {movementType}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE FECHAMENTO DE CAIXA COM CONFERÊNCIA FÍSICA */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="FECHAMENTO DE CAIXA & CONFERÊNCIA FÍSICA"
        maxWidth="lg"
      >
        <form onSubmit={handleConfirmCloseRegister} className="space-y-4">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">VALOR ESPERADO EM ESPÉCIE:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {formatCurrency(activeRegister?.expectedCash)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">TOTAL VENDAS EM DINHEIRO:</span>
              <span className="font-mono text-slate-200">{formatCurrency(activeRegister?.totalCashSales)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">REFORÇOS (+) / SANGRIA (-):</span>
              <span className="font-mono text-slate-200">
                +{formatCurrency(activeRegister?.totalCashInflows)} / -{formatCurrency(activeRegister?.totalCashOutflows)}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-300 block">
              VALOR CONTADO EM DINHEIRO PELO OPERADOR (R$)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={countedCashInput}
              onChange={(e) => setCountedCashInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono font-black text-lg focus:border-emerald-500"
            />
            {activeRegister && (
              <div className="text-xs font-mono font-bold mt-1">
                Diferença (Quebra/Sobra):{' '}
                <span className={parseFloat(countedCashInput) - activeRegister.expectedCash < 0 ? 'text-red-400' : 'text-emerald-400'}>
                  {formatCurrency(parseFloat(countedCashInput || '0') - activeRegister.expectedCash)}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-300 block">
              OBSERVAÇÕES DO FECHAMENTO
            </label>
            <textarea
              rows={2}
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              placeholder="Ex: Turno encerrado sem pendências, valores conferidos..."
              className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowCloseModal(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs font-bold uppercase"
            >
              Voltar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold uppercase shadow"
            >
              Confirmar Fechamento de Turno
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL DE IMPRESSÃO DO COMPROVANTE DE FECHAMENTO */}
      <Modal
        isOpen={showPrintCloseModal}
        onClose={() => setShowPrintCloseModal(false)}
        title="COMPROVANTE DE FECHAMENTO DE CAIXA"
        maxWidth="md"
      >
        {selectedPastSession && (
          <div className="space-y-4">
            <div className="bg-white text-black p-5 rounded font-mono text-xs leading-relaxed border border-slate-300 space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-gray-400">
                <p className="font-bold text-sm uppercase">{settings.storeName}</p>
                <p>RELATÓRIO DE FECHAMENTO DE CAIXA</p>
                <p>DATA: {formatDateTime(selectedPastSession.closedAt)}</p>
              </div>

              <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                <p>OPERADOR: <strong>{selectedPastSession.operatorName}</strong></p>
                <p>ABERTURA: {formatDateTime(selectedPastSession.openedAt)}</p>
                <p>FECHAMENTO: {formatDateTime(selectedPastSession.closedAt)}</p>
              </div>

              <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                <p className="font-bold">CONFERÊNCIA EM ESPÉCIE:</p>
                <div className="flex justify-between">
                  <span>(+) Fundo Inicial:</span>
                  <span>{formatCurrency(selectedPastSession.initialCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(+) Vendas em Dinheiro:</span>
                  <span>{formatCurrency(selectedPastSession.totalCashSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(+) Reforços:</span>
                  <span>{formatCurrency(selectedPastSession.totalCashInflows)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(-) Sangrias / Despesas:</span>
                  <span>{formatCurrency(selectedPastSession.totalCashOutflows)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-gray-200">
                  <span>(=) VALOR ESPERADO:</span>
                  <span>{formatCurrency(selectedPastSession.expectedCash)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>VALOR CONTADO:</span>
                  <span>{formatCurrency(selectedPastSession.countedCash)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>DIFERENÇA:</span>
                  <span>{formatCurrency(selectedPastSession.cashDifference)}</span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                <p className="font-bold">OUTRAS FORMAS:</p>
                <div className="flex justify-between">
                  <span>PIX:</span>
                  <span>{formatCurrency(selectedPastSession.totalPixSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cartão Débito:</span>
                  <span>{formatCurrency(selectedPastSession.totalDebitSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cartão Crédito:</span>
                  <span>{formatCurrency(selectedPastSession.totalCreditSales)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duplicatas:</span>
                  <span>{formatCurrency(selectedPastSession.totalDuplicataSales)}</span>
                </div>
              </div>

              <div className="text-center pt-3 text-[10px] text-gray-600">
                <p>Assinatura do Operador: ______________________</p>
                <p className="mt-2">Assinatura da Gerência: ______________________</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPrintCloseModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs font-bold uppercase"
              >
                Fechar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-emerald-600 text-white rounded text-xs font-bold uppercase shadow"
              >
                Imprimir Fechamento
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
