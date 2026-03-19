'use client';

import { useEffect, useState, useRef } from 'react';
import { getProgress, saveProgress, exportProgress, importProgress } from '@/lib/storage';
import { useTheme } from '@/components/ThemeProvider';
import { DailyGoal } from '@/types/question';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [goal, setGoal] = useState<DailyGoal>({ cardsPerDay: 20, questionsPerDay: 10 });
  const [exportData, setExportData] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showQR, setShowQR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const progress = getProgress();
    if (progress.dailyGoal) {
      setGoal(progress.dailyGoal);
    }
  }, []);

  const saveGoal = (newGoal: DailyGoal) => {
    setGoal(newGoal);
    const progress = getProgress();
    progress.dailyGoal = newGoal;
    saveProgress(progress);
  };

  const handleExport = () => {
    const data = exportProgress();
    setExportData(data);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chizai-drill-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (importProgress(text)) {
        setImportStatus('success');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  const handleImportText = (text: string) => {
    if (importProgress(text)) {
      setImportStatus('success');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      setImportStatus('error');
    }
  };

  const handleCopySync = () => {
    const data = exportProgress();
    navigator.clipboard.writeText(data).then(() => {
      setShowQR(true);
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">設定</h1>

      {/* Theme */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
        <h2 className="font-bold">テーマ</h2>
        <div className="flex gap-3">
          <button
            onClick={() => theme === 'dark' && toggleTheme()}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              theme === 'light' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            ☀️ ライト
          </button>
          <button
            onClick={() => theme === 'light' && toggleTheme()}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              theme === 'dark' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            🌙 ダーク
          </button>
        </div>
      </div>

      {/* Daily Goals */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
        <h2 className="font-bold">日々の目標</h2>
        <div>
          <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">
            暗記カード（枚/日）
          </label>
          <div className="flex gap-2">
            {[5, 10, 20, 30].map((v) => (
              <button
                key={v}
                onClick={() => saveGoal({ ...goal, cardsPerDay: v })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  goal.cardsPerDay === v
                    ? 'bg-accent text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {v}枚
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">
            問題数（問/日）
          </label>
          <div className="flex gap-2">
            {[5, 10, 20, 30].map((v) => (
              <button
                key={v}
                onClick={() => saveGoal({ ...goal, questionsPerDay: v })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  goal.questionsPerDay === v
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {v}問
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data Export/Import */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
        <h2 className="font-bold">データ管理</h2>

        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-blue-900 transition-colors"
          >
            データをエクスポート（JSON）
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            JSONファイルをインポート
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
            aria-label="JSONファイルを選択"
          />

          {importStatus === 'success' && (
            <p className="text-sm text-success font-medium">インポート成功！ページを再読み込みします...</p>
          )}
          {importStatus === 'error' && (
            <p className="text-sm text-error font-medium">インポートに失敗しました。有効なJSONファイルを使用してください。</p>
          )}
        </div>
      </div>

      {/* Multi-device Sync */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
        <h2 className="font-bold">デバイス間同期</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          別のデバイスにデータを転送するには、エクスポートしたデータをコピーして貼り付けます。
        </p>

        <div className="space-y-2">
          <button
            onClick={handleCopySync}
            className="w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
          >
            データをクリップボードにコピー
          </button>

          {showQR && (
            <p className="text-sm text-success font-medium text-center">
              クリップボードにコピーしました！別のデバイスで下のテキストエリアに貼り付けてインポートしてください。
            </p>
          )}

          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">
              データを貼り付けてインポート
            </label>
            <textarea
              className="w-full h-24 p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              placeholder="JSONデータをここに貼り付けてください..."
              onPaste={(e) => {
                const text = e.clipboardData.getData('text');
                if (text) handleImportText(text);
              }}
            />
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-error/30 space-y-3">
        <h2 className="font-bold text-error">データリセット</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          全ての学習データを削除します。この操作は取り消せません。
        </p>
        <button
          onClick={() => {
            if (confirm('本当にすべてのデータを削除しますか？')) {
              localStorage.removeItem('chizai-drill-progress');
              window.location.reload();
            }
          }}
          className="w-full py-3 bg-error text-white rounded-lg font-medium"
        >
          全データを削除する
        </button>
      </div>
    </div>
  );
}
