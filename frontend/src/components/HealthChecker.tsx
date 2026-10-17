import React, { useEffect, useState, useCallback } from 'react';
import { systemService } from '../services/api';
import type { SystemHealthData } from '../types/api';
import { Activity, CheckCircle2, AlertTriangle, RefreshCw, Server, Clock, ShieldCheck } from 'lucide-react';

export const HealthChecker: React.FC = () => {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();
    try {
      const response = await systemService.checkHealth();
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      if (response.success && response.data) {
        setHealthData(response.data);
      } else {
        setError(response.message || 'Phản hồi không xác định từ máy chủ');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể kết nối đến Backend API';
      setError(message);
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return (
    <section id="system-health" className="py-12 bg-white rounded-3xl border border-stone-200/80 shadow-sm p-6 sm:p-8 my-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200/50">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif-title text-xl font-bold text-stone-900">
              Trạng Thái Kết Nối Hệ Thống (REST API Health)
            </h3>
            <p className="text-xs text-stone-500">
              Kiểm tra trực tiếp endpoint <code className="bg-stone-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">GET /api/health</code>
            </p>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 rounded-xl transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Kiểm tra lại
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-10 gap-3 text-stone-500">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-700" />
            <span className="text-sm font-medium">Đang truy vấn trạng thái máy chủ...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">Backend đang ngoại tuyến hoặc chưa khởi động</p>
                <p className="text-xs text-rose-700/80 leading-relaxed">
                  Lỗi: {error}. Hãy đảm bảo Spring Boot backend đang chạy tại port <code className="font-mono font-bold">8080</code> qua lệnh: <code className="font-mono bg-rose-100 px-1 rounded">mvn spring-boot:run</code>.
                </p>
              </div>
            </div>
          </div>
        ) : healthData ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status card */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-700 block">
                  Trạng thái
                </span>
                <span className="text-lg font-bold text-emerald-900">
                  {healthData.status} (ONLINE)
                </span>
              </div>
            </div>

            {/* Application */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-amber-800 shrink-0" />
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-stone-500 block">
                  Ứng dụng
                </span>
                <span className="text-sm font-bold text-stone-800 block truncate">
                  {healthData.application}
                </span>
                <span className="text-[11px] text-stone-500">Phiên bản {healthData.version}</span>
              </div>
            </div>

            {/* Latency */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-3">
              <Activity className="w-8 h-8 text-indigo-600 shrink-0" />
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-stone-500 block">
                  Độ trễ phản hồi
                </span>
                <span className="text-lg font-bold text-stone-900">
                  {latency !== null ? `${latency} ms` : '—'}
                </span>
                <span className="text-[11px] text-stone-500">{healthData.environment}</span>
              </div>
            </div>

            {/* Timestamp */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-3">
              <Clock className="w-8 h-8 text-amber-700 shrink-0" />
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-stone-500 block">
                  Thời gian máy chủ
                </span>
                <span className="text-xs font-semibold text-stone-800 block">
                  {new Date(healthData.systemTime).toLocaleTimeString('vi-VN')}
                </span>
                <span className="text-[10px] text-stone-500">
                  {new Date(healthData.systemTime).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};
