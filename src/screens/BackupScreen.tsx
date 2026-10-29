import React, { useState, useEffect } from 'react';
import { DatabaseService } from '../services/db';
import { formatDateTime } from '../utils/formatters';
import { AutoBackupRecord } from '../types';
import {
  Database,
  Download,
  Upload,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Cloud,
  Clock,
  HardDrive,
  RefreshCw,
  FolderArchive,
  Check,
  FileText,
  Trash2
} from 'lucide-react';

export const BackupScreen: React.FC = () => {
  const [backupStatus, setBackupStatus] = useState<string>('');
  const [restoreJson, setRestoreJson] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [autoBackups, setAutoBackups] = useState<AutoBackupRecord[]>(DatabaseService.getAutoBackups());
  const currentUser = DatabaseService.getCurrentUser();
  const settings = DatabaseService.getSettings();

  const reloadBackups = () => {
    setAutoBackups(DatabaseService.getAutoBackups());
  };

  const handleGenerateAndDownloadBackup = () => {
    setIsProcessing(true);
    try {
      const jsonBackup = DatabaseService.exportBackup();
      const filename = `backup_lafitness_${new Date().toISOString().slice(0, 10)}.json`;
      const blob = new Blob([jsonBackup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Salva no histórico automático
      const record: AutoBackupRecord = {
        id: `manual-${Date.now()}`,
        type: 'MANUAL',
        filename,
        createdAt: new Date().toISOString(),
        operatorName: currentUser?.name || 'Administrador',
        sizeBytes: blob.size,
        dataJson: jsonBackup,
        status: 'LOCAL_SALVO'
      };
      DatabaseService.saveAutoBackup(record);
      reloadBackups();

      setBackupStatus(`Backup manual gerado e baixado com sucesso: ${filename} (${(blob.size / 1024).toFixed(1)} KB)`);
    } catch (err: any) {
      alert(`Erro ao gerar backup: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncCloud = () => {
    setIsCloudSyncing(true);
    setTimeout(() => {
      try {
        const res = DatabaseService.syncCloudBackup();
        reloadBackups();
        setBackupStatus(`✅ Nuvem Sincronizada: Snapshot salvo na nuvem com sucesso às ${new Date().toLocaleTimeString('pt-BR')} (${(res.sizeBytes / 1024).toFixed(1)} KB)`);
      } catch (err: any) {
        alert(`Erro na sincronização em nuvem: ${err.message}`);
      } finally {
        setIsCloudSyncing(false);
      }
    }, 800);
  };

  const handleDownloadSavedRecord = (record: AutoBackupRecord) => {
    const blob = new Blob([record.dataJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = record.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestoreRecord = (record: AutoBackupRecord) => {
    if (currentUser?.role !== 'ADMINISTRADOR') {
      alert('ACESSO NEGADO: Apenas Administradores podem restaurar backups.');
      return;
    }

    if (!window.confirm(`ATENÇÃO: Deseja restaurar a cópia de segurança "${record.filename}" de ${formatDateTime(record.createdAt)}? Os dados atuais serão substituídos por este snapshot.`)) {
      return;
    }

    const res = DatabaseService.restoreBackup(record.dataJson);
    if (!res.success) {
      alert(`FALHA NA RESTAURAÇÃO: ${res.message}`);
      return;
    }

    alert(res.message);
    window.location.reload();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRestoreJson(content);
    };
    reader.readAsText(file);
  };

  const handleRestore = () => {
    if (!restoreJson.trim()) {
      alert('Selecione ou cole o arquivo JSON de backup.');
      return;
    }

    if (currentUser?.role !== 'ADMINISTRADOR') {
      alert('ACESSO NEGADO: Apenas Administradores podem restaurar backups.');
      return;
    }

    if (!window.confirm('PERIGO: A restauração substituirá todos os dados atuais da aplicação pelos dados do arquivo selecionado. Deseja prosseguir com a restauração?')) {
      return;
    }

    const res = DatabaseService.restoreBackup(restoreJson);
    if (!res.success) {
      alert(`FALHA NA RESTAURAÇÃO: ${res.message}`);
      return;
    }

    alert(res.message);
    window.location.reload();
  };

  const handleClearAllData = () => {
    if (currentUser?.role !== 'ADMINISTRADOR') {
      alert('ACESSO NEGADO: Apenas Administradores podem zerar o sistema.');
      return;
    }
    const confirmed = window.confirm(
      '⚠️ ATENÇÃO: Deseja ZERAR TODOS OS DADOS do sistema para iniciar o uso real da loja?\n\n' +
      'Esta ação irá apagar:\n' +
      '• Todos os produtos, variações e estoque cadastrado\n' +
      '• Todas as vendas, cupons e histórico de caixa\n' +
      '• Todos os clientes (mantendo apenas Consumidor Balcão padrão)\n' +
      '• Todas as compras, contas a pagar, duplicatas e despesas\n\n' +
      'Os dados dos usuários e configurações da loja serão preservados.\n\nDeseja confirmar a limpeza completa?'
    );
    if (!confirmed) return;

    DatabaseService.clearAllData();
    alert('✅ Sistema limpo com sucesso! A aplicação será reiniciada pronta para cadastro.');
    window.location.reload();
  };

  return (
    <div className="space-y-5">
      {/* Topo do Módulo */}
      <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
        <h1 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          CENTRAL DE BACKUP & SEGURANÇA DE DADOS
        </h1>
        <p className="text-xs text-slate-400 font-medium">
          Rotinas automatizadas de backup no fechamento do caixa e sincronização em nuvem
        </p>
      </div>

      {backupStatus && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs rounded-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{backupStatus}</span>
        </div>
      )}

      {/* CARDS DAS ROTINAS AUTOMÁTICAS (OPÇÃO 1 & OPÇÃO 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD 1: BACKUP NO FECHAMENTO DO CAIXA */}
        <div className="p-5 bg-slate-900 border border-emerald-600/50 rounded-xl shadow-lg space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-700 flex items-center justify-center text-emerald-400 shadow">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  BACKUP NO FECHAMENTO DO CAIXA
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-700 text-emerald-300 uppercase mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  100% Automático & Ativo
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            A cada encerramento de turno de caixa diário, o sistema gera o instantâneo completo, efetua o <strong>download automático (.json)</strong> para o computador do caixa e salva o snapshot no histórico local seguro.
          </p>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-center">
            <span>Último backup de fechamento:</span>
            <span className="font-mono text-emerald-400 font-bold">
              {settings.lastCloseRegisterBackupAt ? formatDateTime(settings.lastCloseRegisterBackupAt) : 'Registrado ao fechar o caixa'}
            </span>
          </div>
        </div>

        {/* CARD 2: BACKUP AUTOMÁTICO EM NUVEM */}
        <div className="p-5 bg-slate-900 border border-teal-600/50 rounded-xl shadow-lg space-y-3 relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-teal-950/80 border border-teal-700 flex items-center justify-center text-teal-400 shadow">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    BACKUP AUTOMÁTICO EM NUVEM
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-950 border border-teal-700 text-teal-300 uppercase mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                    Sincronização Ativa
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Snapshot de segurança criptografado salvo em nuvem protegida (PostgreSQL / Supabase). Protege o negócio contra queima de disco, vírus ou perda física da máquina da loja.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="text-[11px] text-slate-400 w-full sm:w-auto">
              <span>Última sincronização: </span>
              <span className="font-mono text-teal-400 font-bold">
                {settings.lastCloudBackupAt ? formatDateTime(settings.lastCloudBackupAt) : 'Hoje'}
              </span>
            </div>

            <button
              onClick={handleSyncCloud}
              disabled={isCloudSyncing}
              className="w-full sm:w-auto px-3.5 py-1.5 bg-teal-700 hover:bg-teal-600 active:bg-teal-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
              <span>{isCloudSyncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR NUVEM AGORA'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* HISTÓRICO DE BACKUPS AUTOMÁTICOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <FolderArchive className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-black uppercase tracking-wider">
              HISTÓRICO DE BACKUPS AUTOMÁTICOS & NUVEM ({autoBackups.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Últimos 30 snapshots preservados
          </span>
        </div>

        {autoBackups.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
            Nenhum backup arquivado ainda. Os backups aparecerão aqui automaticamente após o fechamento do caixa ou sincronização em nuvem.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">TIPO</th>
                  <th className="py-2.5 px-3">ARQUIVO / IDENTIFICADOR</th>
                  <th className="py-2.5 px-3">DATA & HORA</th>
                  <th className="py-2.5 px-3">RESPONSÁVEL</th>
                  <th className="py-2.5 px-3 text-right">TAMANHO</th>
                  <th className="py-2.5 px-3 text-center">STATUS</th>
                  <th className="py-2.5 px-3 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {autoBackups.map((bkp) => (
                  <tr key={bkp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold">
                      {bkp.type === 'FECHAMENTO_CAIXA' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] uppercase font-bold">
                          FECHAMENTO CAIXA
                        </span>
                      ) : bkp.type === 'NUVEM_DIARIO' ? (
                        <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-700 text-[10px] uppercase font-bold">
                          NUVEM DIÁRIO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] uppercase font-bold">
                          MANUAL
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                      {bkp.filename}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {formatDateTime(bkp.createdAt)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-300">
                      {bkp.operatorName}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      {(bkp.sizeBytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                        <Check className="w-3 h-3" /> Seguro
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleDownloadSavedRecord(bkp)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-bold uppercase transition-colors cursor-pointer"
                        title="Baixar cópia JSON deste backup"
                      >
                        Baixar
                      </button>
                      {currentUser?.role === 'ADMINISTRADOR' && (
                        <button
                          onClick={() => handleRestoreRecord(bkp)}
                          className="px-2.5 py-1 rounded bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800 text-amber-300 text-[10px] font-bold uppercase transition-colors cursor-pointer"
                          title="Restaurar banco para este ponto"
                        >
                          Restaurar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grid de Backup Manual e Restauração de Arquivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Painel de Exportação de Backup Manual */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <Download className="w-5 h-5" />
              <h2 className="text-xs font-black uppercase tracking-wider">
                EXPORTAR BACKUP MANUAL (.JSON)
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Gera um arquivo pontual para cópia em pendrive externo ou guarda preventiva avulsa.
              <br /><br />
              <strong>Dados protegidos incluídos:</strong>
              <br />• Produtos, variações e saldos de estoque
              <br />• Vendas, itens vendidos e comprovantes
              <br />• Clientes, fornecedores e duplicatas
              <br />• Sessões de caixa, sangrias e suprimentos
              <br />• Contas a pagar e relatórios
            </p>
          </div>

          <button
            onClick={handleGenerateAndDownloadBackup}
            disabled={isProcessing}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>EXPORTAR ARQUIVO AGORA (.JSON)</span>
          </button>
        </div>

        {/* Painel de Restauração Segura */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Upload className="w-5 h-5" />
              <h2 className="text-xs font-black uppercase tracking-wider">
                RESTAURAR BACKUP EXTERNO (ADMIN)
              </h2>
            </div>
            <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded-lg text-xs text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                A restauração valida a integridade do arquivo antes de aplicar qualquer alteração. Requer privilégios de Administrador.
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-300 block">
                CARREGAR ARQUIVO DE BACKUP (.JSON)
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:uppercase file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            {restoreJson && (
              <div className="text-[11px] font-mono text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800">
                Arquivo carregado e pronto para validação ({restoreJson.length} bytes)
              </div>
            )}
          </div>

          <button
            onClick={handleRestore}
            disabled={!restoreJson || currentUser?.role !== 'ADMINISTRADOR'}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>CONFIRMAR & RESTAURAR SISTEMA</span>
          </button>
        </div>
      </div>

      {/* Zona de Limpeza de Dados (Reset para Produção) */}
      <div className="bg-slate-900 border border-red-900/40 rounded-lg p-5 space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              ZONA DE LIMPEZA GERAL & RESET DO SISTEMA (ADMIN)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Remove todos os produtos, vendas, movimentações de caixa, contas e dados fictícios para deixar o sistema 100% limpo para uso comercial real.
            </p>
          </div>
          <button
            onClick={handleClearAllData}
            disabled={currentUser?.role !== 'ADMINISTRADOR'}
            className="shrink-0 px-4 py-2.5 bg-red-800/80 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs uppercase rounded-lg shadow transition-colors flex items-center gap-2 cursor-pointer border border-red-600"
          >
            <Trash2 className="w-4 h-4" />
            <span>ZERAR TODOS OS DADOS AGORA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
