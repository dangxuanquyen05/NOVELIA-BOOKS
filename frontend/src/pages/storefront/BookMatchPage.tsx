import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Compass,
  SlidersHorizontal,
  ShoppingBag,
  X,
  AlertCircle,
  HelpCircle,
  Bookmark,
  Trash2,
  RotateCcw,
  Wand2,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { BookMatchCard } from '../../components/bookmatch/BookMatchCard';
import { bookMatchService } from '../../services/bookMatchService';
import { bookService } from '../../services/bookService';
import { useAuth } from '../../contexts/AuthContext';
import type {
  BookMatchOptionsResponse,
  BookMatchSurveyRequest,
  BookMatchRecommendationResponse,
} from '../../types/bookMatch';
import type { Category } from '../../types/book';

export const BookMatchPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Wizard step: 0 = Intro, 1 = Goals, 2 = Categories, 3 = Level, 4 = Budget, 5 = Results
  const [step, setStep] = useState<number>(0);

  // Survey options from backend
  const [options, setOptions] = useState<BookMatchOptionsResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // User selections
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('INTERMEDIATE');
  const [selectedBudgetOption, setSelectedBudgetOption] = useState<string>('150k-250k');
  const [strictBudget, setStrictBudget] = useState<boolean>(false);
  const [requireInStock, setRequireInStock] = useState<boolean>(false);

  // Feedback & Personalization state
  const [dislikedBookIds, setDislikedBookIds] = useState<number[]>(() => {
    try {
      const stored = sessionStorage.getItem('novelia_bookmatch_disliked');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [hasSavedPref, setHasSavedPref] = useState<boolean>(false);
  const [isSavingPref, setIsSavingPref] = useState<boolean>(false);
  const [isDeletingPref, setIsDeletingPref] = useState<boolean>(false);
  const [prefNotification, setPrefNotification] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Result state
  const [recommendations, setRecommendations] = useState<BookMatchRecommendationResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Toast notification
  const [cartToast, setCartToast] = useState<{ show: boolean; bookTitle: string }>({
    show: false,
    bookTitle: '',
  });

  // AI Assistant state (Phase 7)
  const [aiQuery, setAiQuery] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiAssistantData, setAiAssistantData] = useState<import('../../types/bookMatch').AiAssistantResponse | null>(null);
  const [aiStatus, setAiStatus] = useState<import('../../types/bookMatch').AiStatusResponse | null>(null);


  // Load survey options & user preferences from backend
  useEffect(() => {
    const fetchSurveyMetadata = async () => {
      try {
        const [optRes, catRes] = await Promise.all([
          bookMatchService.getOptions(),
          bookService.getCategories(),
        ]);
        if (optRes.success) {
          setOptions(optRes.data);
        }
        if (catRes.success) {
          setCategories(catRes.data);
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu tùy chọn BookMatch:', err);
      }
    };
    fetchSurveyMetadata();

    // Fetch AI operational status
    bookMatchService
      .getAiStatus()
      .then((res) => {
        if (res.success && res.data) {
          setAiStatus(res.data);
        }
      })
      .catch(() => {});

    // If logged in, fetch saved preferences to pre-fill survey
    if (isAuthenticated) {
      bookMatchService
        .getUserPreferences()
        .then((res) => {
          if (res.success && res.data) {
            const p = res.data;
            if (p.readingGoals && p.readingGoals.length > 0) {
              setSelectedGoals(p.readingGoals);
              setHasSavedPref(true);
            }
            if (p.categoryIds && p.categoryIds.length > 0) {
              setSelectedCategoryIds(p.categoryIds);
              setHasSavedPref(true);
            }
            if (p.preferredLevel) {
              setSelectedLevel(p.preferredLevel);
            }
          }
        })
        .catch(() => {
          // Unauthenticated or not yet saved
        });
    }
  }, [isAuthenticated]);

  const handleToggleGoal = (code: string) => {
    setSelectedGoals((prev) =>
      prev.includes(code) ? prev.filter((g) => g !== code) : [...prev, code]
    );
  };

  const handleToggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const calculateBudgetValues = () => {
    switch (selectedBudgetOption) {
      case 'under-100k':
        return { targetBudget: 90000, maxBudget: 100000 };
      case '100k-150k':
        return { targetBudget: 125000, maxBudget: 150000 };
      case '150k-250k':
        return { targetBudget: 180000, maxBudget: 250000 };
      case 'over-250k':
        return { targetBudget: 280000, maxBudget: undefined };
      case 'any':
      default:
        return { targetBudget: undefined, maxBudget: undefined };
    }
  };

  const handleSubmitSurvey = async () => {
    setIsCalculating(true);
    setError(null);
    setStep(5);

    const { targetBudget, maxBudget } = calculateBudgetValues();

    const payload: BookMatchSurveyRequest = {
      readingGoals: selectedGoals.length > 0 ? selectedGoals : undefined,
      categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      preferredLevel: selectedLevel || undefined,
      targetBudget,
      maxBudget,
      strictBudget,
      requireInStock,
      language: 'vi',
      limit: 8,
      dislikedBookIds: dislikedBookIds.length > 0 ? dislikedBookIds : undefined,
    };

    try {
      const res = await bookMatchService.getRecommendationsBySurvey(payload);
      if (res.success) {
        setRecommendations(res.data);
      } else {
        setError(res.message || 'Không thể tính toán gợi ý lúc này');
      }
    } catch (err: any) {
      console.error('Lỗi khi gửi khảo sát BookMatch:', err);
      setError(err?.response?.data?.message || 'Có lỗi kết nối khi tính toán gợi ý. Vui lòng thử lại.');
    } finally {
      setIsCalculating(false);
    }
  };

  // AI Assistant Natural Language Query Handler (Phase 7)
  const handleAskAiAssistant = async (queryText?: string) => {
    const prompt = (queryText !== undefined ? queryText : aiQuery).trim();
    if (!prompt) return;
    setIsAiLoading(true);
    setError(null);
    setStep(5);

    try {
      const res = await bookMatchService.askAiAssistant(prompt);
      if (res.success && res.data) {
        setAiAssistantData(res.data);
        setRecommendations(res.data.recommendations);
        if (res.data.extractedCriteria) {
          const crit = res.data.extractedCriteria;
          if (crit.readingGoals && crit.readingGoals.length > 0) {
            setSelectedGoals(crit.readingGoals);
          }
          if (crit.categoryIds && crit.categoryIds.length > 0) {
            setSelectedCategoryIds(crit.categoryIds);
          }
          if (crit.preferredLevel) {
            setSelectedLevel(crit.preferredLevel);
          }
        }
      } else {
        setError(res.message || 'Không thể xử lý yêu cầu lúc này');
      }
    } catch (err: any) {
      console.error('Lỗi gọi trợ lý AI:', err);
      setError(err?.response?.data?.message || 'Có lỗi kết nối với trợ lý AI. Vui lòng thử lại.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Feedback handler (Hữu ích / Không phù hợp)
  const handleFeedback = async (bookId: number, type: 'HELPFUL' | 'NOT_RELEVANT') => {
    if (type === 'NOT_RELEVANT') {
      const updated = Array.from(new Set([...dislikedBookIds, bookId]));
      setDislikedBookIds(updated);
      try {
        sessionStorage.setItem('novelia_bookmatch_disliked', JSON.stringify(updated));
      } catch {
        // Safe guest fallback
      }
    }
    try {
      await bookMatchService.sendFeedback({ bookId, feedbackType: type });
    } catch (err) {
      console.warn('Lỗi ghi nhận feedback:', err);
    }
  };

  // Lưu sở thích vào tài khoản (Authenticated)
  const handleSavePreferences = async () => {
    if (!isAuthenticated) return;
    setIsSavingPref(true);
    setPrefNotification(null);
    const { targetBudget, maxBudget } = calculateBudgetValues();
    const payload: BookMatchSurveyRequest = {
      readingGoals: selectedGoals,
      categoryIds: selectedCategoryIds,
      preferredLevel: selectedLevel,
      targetBudget,
      maxBudget,
      strictBudget,
      requireInStock,
    };

    try {
      const res = await bookMatchService.saveUserPreferences(payload);
      if (res.success) {
        setHasSavedPref(true);
        setPrefNotification({
          text: 'Đã lưu sở thích vào tài khoản của bạn. Các gợi ý tiếp theo sẽ tự động đồng bộ.',
          type: 'success',
        });
      }
    } catch (err: any) {
      setPrefNotification({
        text: err?.response?.data?.message || 'Không thể lưu sở thích lúc này.',
        type: 'error',
      });
    } finally {
      setIsSavingPref(false);
      setTimeout(() => setPrefNotification(null), 5000);
    }
  };

  // Xóa sở thích và lịch sử phản hồi đã lưu (Right to be Forgotten)
  const handleDeletePreferences = async () => {
    if (!isAuthenticated) return;
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn xóa toàn bộ dữ liệu sở thích và lịch sử phản hồi gợi ý đã lưu trên hệ thống?'
      )
    ) {
      return;
    }
    setIsDeletingPref(true);
    setPrefNotification(null);

    try {
      const res = await bookMatchService.deleteUserPreferences();
      if (res.success) {
        setHasSavedPref(false);
        setDislikedBookIds([]);
        try {
          sessionStorage.removeItem('novelia_bookmatch_disliked');
        } catch {}
        setPrefNotification({
          text: 'Đã xóa toàn bộ sở thích và lịch sử phản hồi gợi ý của tài khoản.',
          type: 'info',
        });
      }
    } catch (err: any) {
      setPrefNotification({
        text: err?.response?.data?.message || 'Không thể xóa sở thích lúc này.',
        type: 'error',
      });
    } finally {
      setIsDeletingPref(false);
      setTimeout(() => setPrefNotification(null), 5000);
    }
  };

  // Làm lại bài gợi ý từ đầu
  const handleResetSurvey = () => {
    setSelectedGoals([]);
    setSelectedCategoryIds([]);
    setSelectedLevel('INTERMEDIATE');
    setSelectedBudgetOption('150k-250k');
    setStrictBudget(false);
    setRequireInStock(false);
    setStep(1);
  };

  const showCartToast = (title: string) => {
    setCartToast({ show: true, bookTitle: title });
    setTimeout(() => {
      setCartToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Preset reading goals if options API delayed
  const fallbackGoals = [
    { code: 'MINDSET', label: 'Khai phóng tư duy & Phát triển bản thân', desc: 'Thấu cảm, tôi luyện ý chí và mở rộng tầm nhìn.' },
    { code: 'REFLECTION', label: 'Chiêm nghiệm sâu sắc & Tĩnh tại nội tâm', desc: 'Lắng đọng tâm hồn, tìm kiếm sự bình yên và thấu hiểu cuộc đời.' },
    { code: 'PHILOSOPHY', label: 'Triết học & Khám phá tư tưởng', desc: 'Đối thoại với các tư tưởng vĩ đại từ Khắc Kỷ đến Hiện Sinh.' },
    { code: 'HEALING', label: 'Chữa lành & Cân bằng cảm xúc', desc: 'Xoa dịu những vết thương tinh thần bằng vẻ đẹp của ngôn từ.' },
    { code: 'ENTERTAINMENT', label: 'Giải trí kịch tính & Thư giãn nhẹ nhàng', desc: 'Những câu chuyện cuốn hút, đọc liền mạch không muốn dứt.' },
    { code: 'DETECTIVE', label: 'Trinh thám & Suy luận logic', desc: 'Những màn đấu trí nghẹt thở và suy luận khoa học đỉnh cao.' },
    { code: 'CLASSIC', label: 'Văn học kinh điển vượt thời gian', desc: 'Những áng văn bất hủ định hình nền văn minh nhân loại.' },
    { code: 'DYSTOPIA', label: 'Dystopia & Tiên tri xã hội', desc: 'Cảnh báo sâu sắc về trật tự xã hội và bản chất con người.' },
  ];

  const readingGoalsList = options?.readingGoals || fallbackGoals;

  return (
    <div className="py-8 sm:py-12 space-y-10 min-h-[75vh]">
      {/* Toast Notification khi thêm vào giỏ */}
      {cartToast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl bg-[#8C5D3B] text-white shadow-2xl border border-white/10 animate-fade-in max-w-md">
          <div className="w-8 h-8 rounded-full bg-[#B88E52] flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-white">Đã thêm vào giỏ hàng:</p>
            <p className="text-[#D4AF7A] line-clamp-1">{cartToast.bookTitle}</p>
          </div>
          <button
            onClick={() => setCartToast({ show: false, bookTitle: '' })}
            className="text-stone-300 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modern Multi-Step Milestone Stepper (Visible in wizard steps 1 - 4) */}
      {step >= 1 && step <= 4 && (
        <div className="max-w-3xl mx-auto py-3">
          <div className="relative flex items-center justify-between">
            {/* Connecting progress line background */}
            <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-[#E8E2D8] rounded-full z-0" />
            {/* Active connecting progress line */}
            <div
              className="absolute top-1/2 left-6 -translate-y-1/2 h-1 bg-gradient-to-r from-[#8C5D3B] to-[#B88E52] rounded-full transition-all duration-500 z-0"
              style={{
                width: `${((step - 1) / 3) * (100 - 10)}%`,
              }}
            />

            {[
              { num: 1, label: 'Mục Tiêu' },
              { num: 2, label: 'Thể Loại' },
              { num: 3, label: 'Độ Sâu' },
              { num: 4, label: 'Ngân Sách' },
            ].map((s) => {
              const isPassed = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div
                  key={s.num}
                  onClick={() => s.num < step && setStep(s.num)}
                  className={`relative z-10 flex flex-col items-center gap-1.5 ${
                    s.num < step ? 'cursor-pointer group' : ''
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-sm ${
                      isCurrent
                        ? 'bg-[#8C5D3B] text-white ring-4 ring-[#B88E52]/25 scale-110'
                        : isPassed
                        ? 'bg-gradient-to-r from-[#8C5D3B] to-[#2A5A42] text-white'
                        : 'bg-white text-stone-400 border-2 border-[#E8E2D8]'
                    }`}
                  >
                    {isPassed ? (
                      <Check className="w-4 h-4 text-[#E6C687]" />
                    ) : (
                      <span>{s.num}</span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-bold tracking-wider uppercase transition-colors ${
                      isCurrent
                        ? 'text-[#8C5D3B]'
                        : isPassed
                        ? 'text-stone-700'
                        : 'text-stone-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCREEN 0: INTRO HERO SCREEN */}
      {/* ------------------------------------------------------------- */}
      {step === 0 && (
        <div className="max-w-4xl mx-auto text-center space-y-8 py-6 sm:py-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8C5D3B]/10 text-[#8C5D3B] text-xs font-bold uppercase tracking-widest border border-[#8C5D3B]/20">
            <Sparkles className="w-4 h-4 text-[#B88E52]" />
            NOVELIA BOOKMATCH™ ENGINE
          </div>

          <h1 className="font-serif-title text-3xl sm:text-5xl lg:text-6xl font-bold text-[#1C1917] leading-tight max-w-3xl mx-auto">
            Tìm tác phẩm chạm đúng <span className="text-[#8C5D3B] italic underline decoration-[#B88E52]">tâm hồn bạn</span>
          </h1>

          <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed font-light">
            Mỗi cuốn sách đến với độc giả đều là một mối lương duyên. Trả lời nhanh 4 câu hỏi định vị gu đọc, hệ thống tính toán khoa học sẽ gợi ý cuốn sách tương thích nhất với bạn ngay hôm nay.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-3xl mx-auto pt-6">
            <div className="p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#8C5D3B]/10 flex items-center justify-center text-[#8C5D3B]">
                <Compass className="w-5 h-5 text-[#B88E52]" />
              </div>
              <h4 className="font-bold text-sm text-[#1C1917]">Cá Nhân Hóa Đa Chiều</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Phân tích sâu mục tiêu, thể loại, văn phong và ngân sách thực tế.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#8C5D3B]/10 flex items-center justify-center text-[#8C5D3B]">
                <CheckCircle2 className="w-5 h-5 text-[#8C5D3B]" />
              </div>
              <h4 className="font-bold text-sm text-[#1C1917]">Lý Do Khớp Minh Bạch</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Mỗi cuốn sách đề xuất đều có lý do giải thích cụ thể, có thể kiểm chứng.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#EAE3D8] shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#8C5D3B]/10 flex items-center justify-center text-[#8C5D3B]">
                <ShoppingBag className="w-5 h-5 text-[#B88E52]" />
              </div>
              <h4 className="font-bold text-sm text-[#1C1917]">Sẵn Sàng Giao Ngay</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Đồng bộ số lượng tồn kho và mức giá thực tế trên hệ thống.
              </p>
            </div>
          </div>

          {/* AI Natural Language Search Interactive Card */}
          <div className="max-w-2xl mx-auto p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-white to-[#FAF6EE] border-2 border-[#8C5D3B]/20 shadow-xl shadow-[#8C5D3B]/5 text-left space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#8C5D3B] flex items-center justify-center text-white">
                  <Wand2 className="w-4 h-4 text-[#E6C687]" />
                </div>
                <div>
                  <h3 className="font-serif-title font-bold text-base text-[#1C1917]">
                    Hỏi Trợ Lý AI (Ngôn Ngữ Tự Nhiên)
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Mô tả tự do nhu cầu, tâm trạng hoặc ngân sách của bạn
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#8C5D3B]/10 text-[#8C5D3B] flex items-center gap-1 border border-[#8C5D3B]/20">
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                {aiStatus?.provider === 'gemini' ? 'Gemini AI Sẵn sàng' : 'Offline Engine Sẵn sàng'}
              </span>
            </div>

            <div className="relative">
              <textarea
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value.slice(0, 300))}
                rows={3}
                placeholder="Ví dụ: 'Mình mới đi làm muốn tìm sách kỹ năng hoặc kinh doanh dưới 200k dễ hiểu' hoặc 'Stress quá muốn đọc cuốn gì nhẹ nhàng để chữa lành...'"
                className="w-full text-xs sm:text-sm p-3.5 rounded-2xl border border-[#D8D0C5] focus:outline-none focus:ring-2 focus:ring-[#8C5D3B]/40 focus:border-[#8C5D3B] resize-none bg-white shadow-inner"
              />
              <div className="flex items-center justify-between mt-1 text-[11px] text-stone-400">
                <span>Không chia sẻ dữ liệu cá nhân • Chỉ truy vấn sách thật</span>
                <span>{aiQuery.length}/300</span>
              </div>
            </div>

            {/* Quick Sample Prompts */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                Gợi ý câu hỏi mẫu:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'Sách kỹ năng kinh doanh & giao tiếp dưới 200k',
                  'Sách chữa lành tâm trạng, nhẹ nhàng dễ đọc',
                  'Triết học nhập môn dễ hiểu cho người mới',
                  'Trinh thám kịch tính cuốn hút ban đêm',
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAiQuery(sample);
                      handleAskAiAssistant(sample);
                    }}
                    className="text-[11px] px-3 py-1.5 rounded-xl bg-white border border-[#E0D7C9] text-stone-700 hover:border-[#8C5D3B] hover:text-[#8C5D3B] hover:bg-[#FAF8F5] transition-all"
                  >
                    💡 {sample}
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="md"
              disabled={isAiLoading || !aiQuery.trim()}
              onClick={() => handleAskAiAssistant()}
              className="w-full bg-[#8C5D3B] hover:bg-[#754C2F] text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {isAiLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang phân tích ý định & tìm kiếm sách thật...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#E6C687]" />
                  <span>Tìm sách với Trợ lý AI</span>
                </>
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 max-w-xl mx-auto my-6">
            <div className="flex-1 h-px bg-[#E2DBD0]" />
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
              HOẶC LÀM THEO TỪNG BƯỚC
            </span>
            <div className="flex-1 h-px bg-[#E2DBD0]" />
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-[#8C5D3B] text-[#8C5D3B] hover:bg-[#8C5D3B] hover:text-white px-8 py-4 rounded-2xl font-bold text-sm sm:text-base cursor-pointer transition-all duration-300"
              onClick={() => setStep(1)}
            >
              Làm bài khảo sát 4 bước (Truyền thống) <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCREEN 1: READING GOALS */}
      {/* ------------------------------------------------------------- */}
      {step === 1 && (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#1C1917]">
              1. Bạn đang tìm kiếm điều gì trong trang sách tiếp theo?
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Chọn một hoặc nhiều mục tiêu đọc mà bạn đang mong muốn (hoặc bỏ qua để xem tổng quát).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {readingGoalsList.map((goal) => {
              const isSelected = selectedGoals.includes(goal.code);
              return (
                <div
                  key={goal.code}
                  onClick={() => handleToggleGoal(goal.code)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-3.5 select-none ${
                    isSelected
                      ? 'bg-[#FAF7F2] border-[#8C5D3B] shadow-md ring-1 ring-[#8C5D3B]'
                      : 'bg-white border-[#EAE3D8] hover:border-[#8C5D3B]/40 hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                      isSelected
                        ? 'bg-[#8C5D3B] border-[#8C5D3B] text-white'
                        : 'border-stone-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm text-[#1C1917]">{goal.label}</h4>
                    {'desc' in goal && (
                      <p className="text-xs text-stone-500 leading-relaxed font-light">
                        {(goal as any).desc}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[#EAE3D8]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(0)}
              className="rounded-xl border-[#D8D0C5]"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Giới thiệu
            </Button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs text-stone-500 hover:text-stone-800 font-semibold px-3 py-2 cursor-pointer"
              >
                Bỏ qua bước này
              </button>
              <Button
                size="sm"
                onClick={() => setStep(2)}
                className="bg-[#8C5D3B] hover:bg-[#754C2F] text-white rounded-xl px-5"
              >
                Tiếp tục <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCREEN 2: FAVORITE CATEGORIES */}
      {/* ------------------------------------------------------------- */}
      {step === 2 && (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#1C1917]">
              2. Những thể loại hoặc chủ đề bạn thường bị cuốn hút?
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Chọn các danh mục sách bạn yêu thích để thuật toán ưu tiên chấm điểm cao hơn.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {categories.map((cat) => {
              const isSelected = selectedCategoryIds.includes(cat.id);
              return (
                <div
                  key={cat.id}
                  onClick={() => handleToggleCategory(cat.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-3.5 select-none ${
                    isSelected
                      ? 'bg-[#FAF7F2] border-[#8C5D3B] shadow-md ring-1 ring-[#8C5D3B]'
                      : 'bg-white border-[#EAE3D8] hover:border-[#8C5D3B]/40 hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                      isSelected
                        ? 'bg-[#8C5D3B] border-[#8C5D3B] text-white'
                        : 'border-stone-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm text-[#1C1917]">{cat.name}</h4>
                    {cat.description && (
                      <p className="text-xs text-stone-500 leading-relaxed font-light line-clamp-2">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[#EAE3D8]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              className="rounded-xl border-[#D8D0C5]"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay lại
            </Button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs text-stone-500 hover:text-stone-800 font-semibold px-3 py-2 cursor-pointer"
              >
                Bỏ qua bước này
              </button>
              <Button
                size="sm"
                onClick={() => setStep(3)}
                className="bg-[#8C5D3B] hover:bg-[#754C2F] text-white rounded-xl px-5"
              >
                Tiếp tục <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCREEN 3: READING LEVEL & DEPTH */}
      {/* ------------------------------------------------------------- */}
      {step === 3 && (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#1C1917]">
              3. Mức độ dày dặn và chiều sâu bạn mong muốn lúc này?
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Giúp BookMatch gợi ý những tác phẩm có dung lượng và độ khó vừa vặn với quỹ thời gian của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                code: 'BEGINNER',
                title: 'Dễ Tiếp Cận',
                badge: 'Dưới 250 trang',
                desc: 'Văn phong cô đọng, sáng sủa, thích hợp đọc thư giãn cuối tuần hoặc người mới bắt đầu.',
              },
              {
                code: 'INTERMEDIATE',
                title: 'Tiêu Chuẩn',
                badge: '250 - 450 trang',
                desc: 'Cân bằng hoàn hảo giữa cốt truyện hấp dẫn và chiều sâu tư tưởng, giàu cảm xúc.',
              },
              {
                code: 'ADVANCED',
                title: 'Chuyên Sâu / Đồ Sộ',
                badge: 'Trên 500 trang',
                desc: 'Tác phẩm trường thiên, giàu tầng nghĩa triết học hoặc phức cảm văn chương sâu sắc.',
              },
            ].map((lvl) => {
              const isSelected = selectedLevel === lvl.code;
              return (
                <div
                  key={lvl.code}
                  onClick={() => setSelectedLevel(lvl.code)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 select-none ${
                    isSelected
                      ? 'bg-[#FAF7F2] border-[#8C5D3B] shadow-md ring-2 ring-[#8C5D3B]'
                      : 'bg-white border-[#EAE3D8] hover:border-[#8C5D3B]/40 hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div className="space-y-1.5">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#8C5D3B]/10 text-[#8C5D3B]">
                      {lvl.badge}
                    </span>
                    <h4 className="font-bold text-base text-[#1C1917]">{lvl.title}</h4>
                    <p className="text-xs text-stone-500 leading-relaxed font-light">
                      {lvl.desc}
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-end">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        isSelected
                          ? 'bg-[#8C5D3B] border-[#8C5D3B] text-white'
                          : 'border-stone-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[#EAE3D8]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(2)}
              className="rounded-xl border-[#D8D0C5]"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay lại
            </Button>

            <Button
              size="sm"
              onClick={() => setStep(4)}
              className="bg-[#8C5D3B] hover:bg-[#754C2F] text-white rounded-xl px-5"
            >
              Tiếp tục <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCREEN 4: BUDGET & IN-STOCK PREFERENCE */}
      {/* ------------------------------------------------------------- */}
      {step === 4 && (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#1C1917]">
              4. Ngân sách dự kiến và ưu tiên đặt hàng
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Tùy chỉnh khoảng chi tiêu mong muốn và các điều kiện sẵn sàng giao hàng.
            </p>
          </div>

          <div className="space-y-6">
            {/* Budget options */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Khoảng ngân sách dự kiến:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'under-100k', label: 'Dưới 100.000 đ' },
                  { id: '100k-150k', label: '100k - 150k đ' },
                  { id: '150k-250k', label: '150k - 250k đ' },
                  { id: 'over-250k', label: 'Trên 250.000 đ' },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBudgetOption(b.id)}
                    className={`p-3.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      selectedBudgetOption === b.id
                        ? 'bg-[#8C5D3B] text-white border-[#8C5D3B] shadow-md'
                        : 'bg-white text-stone-700 border-[#EAE3D8] hover:border-[#8C5D3B]/40'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkboxes for Strict Filters */}
            <div className="p-5 rounded-2xl bg-white border border-[#EAE3D8] space-y-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={strictBudget}
                  onChange={(e) => setStrictBudget(e.target.checked)}
                  className="mt-0.5 rounded text-[#8C5D3B] focus:ring-[#8C5D3B] w-4 h-4 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-stone-900 block">
                    Giới hạn ngân sách cứng (Loại bỏ sách vượt mức giá)
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    Nếu bật, hệ thống sẽ loại bỏ hoàn toàn các cuốn sách có giá bán vượt mức trần đã chọn.
                  </span>
                </div>
              </label>

              <div className="border-t border-[#F0EBE1]" />

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requireInStock}
                  onChange={(e) => setRequireInStock(e.target.checked)}
                  className="mt-0.5 rounded text-[#8C5D3B] focus:ring-[#8C5D3B] w-4 h-4 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-stone-900 block">
                    Chỉ lấy sách đang còn hàng trong kho (Giao ngay)
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    Nếu tắt, sách tạm hết hàng vẫn có thể được đề xuất (nhưng nhận 0 điểm tồn kho).
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[#EAE3D8]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(3)}
              className="rounded-xl border-[#D8D0C5]"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay lại
            </Button>

            <Button
              size="lg"
              onClick={handleSubmitSurvey}
              className="bg-[#8C5D3B] hover:bg-[#754C2F] text-white rounded-2xl px-8 font-bold shadow-lg shadow-[#8C5D3B]/20"
            >
              <Sparkles className="w-4 h-4 mr-2 text-[#E6C687]" /> Khám phá kết quả BookMatch
            </Button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCREEN 5: RESULTS SCREEN */}
      {/* ------------------------------------------------------------- */}
      {step === 5 && (
        <div className="space-y-6 animate-fade-in">
          {/* Preference Status Notification */}
          {prefNotification && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center justify-between border animate-fadeIn ${
                prefNotification.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : prefNotification.type === 'info'
                  ? 'bg-stone-100 border-stone-300 text-stone-700'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {prefNotification.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-stone-500 shrink-0" />
                )}
                <span className="font-medium">{prefNotification.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setPrefNotification(null)}
                className="p-1 hover:opacity-70"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Header & Filter Summary */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white border border-[#EAE3D8] shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#B88E52]" />
                <span className="text-xs uppercase tracking-widest font-bold text-[#8C6D3B]">
                  KẾT QUẢ GỢI Ý CÁ NHÂN HÓA
                </span>
                {dislikedBookIds.length > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                    Đã loại {dislikedBookIds.length} cuốn không phù hợp
                  </span>
                )}
              </div>
              <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#1C1917]">
                Tác phẩm tương thích nhất dành cho bạn
              </h2>
              {recommendations?.appliedFiltersSummary && (
                <p className="text-xs text-stone-500 italic">
                  {recommendations.appliedFiltersSummary}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                className="rounded-xl border-[#D8D0C5] text-xs hover:bg-[#FAF7F2]"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" /> Sửa tiêu chí
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetSurvey}
                className="rounded-xl border-[#D8D0C5] text-xs hover:bg-[#FAF7F2]"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Làm lại bài gợi ý
              </Button>

              {/* Personalization & Privacy Actions for Logged-in Users */}
              {isAuthenticated && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSavingPref}
                    onClick={handleSavePreferences}
                    title="Lưu tiêu chí sở thích vào tài khoản để dùng cho các lần sau"
                    className="rounded-xl border-[#8C5D3B]/40 text-[#8C5D3B] text-xs hover:bg-[#8C5D3B]/5 font-semibold"
                  >
                    <Bookmark className="w-3.5 h-3.5 mr-1.5 text-[#B88E52]" />
                    {isSavingPref ? 'Đang lưu...' : hasSavedPref ? 'Cập nhật sở thích' : 'Lưu sở thích'}
                  </Button>

                  {hasSavedPref && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isDeletingPref}
                      onClick={handleDeletePreferences}
                      title="Xóa dữ liệu sở thích và lịch sử phản hồi đã lưu khỏi hệ thống"
                      className="rounded-xl border-rose-200 text-rose-700 text-xs hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      {isDeletingPref ? 'Đang xóa...' : 'Xóa dữ liệu'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* AI Natural Insight Banner (Visible if query was made via AI Assistant) */}
          {aiAssistantData && !isCalculating && !isAiLoading && (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#FAF7EE] via-white to-[#F5EFE0] border-2 border-[#B88E52]/30 shadow-md space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#8C5D3B] flex items-center justify-center text-white">
                    <Sparkles className="w-3.5 h-3.5 text-[#E6C687]" />
                  </div>
                  <span className="font-serif-title font-bold text-sm text-[#8C5D3B]">
                    Phân Tích Đọc Từ Trợ Lý AI NOVELIA
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {aiAssistantData.providerUsed === 'gemini' ? 'Google Gemini AI' : 'Rule-based NLP Engine (Offline)'}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    {aiAssistantData.executionTimeMs}ms
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-light italic">
                "{aiAssistantData.naturalInsight}"
              </p>

              <div className="pt-2 border-t border-[#EAE3D8] flex items-center justify-between flex-wrap gap-2 text-[11px] text-stone-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Xác thực 100% với danh mục sách & tồn kho thật NOVELIA (0% dữ liệu ảo)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="font-bold text-[#8C5D3B] hover:text-[#8C6D3B] hover:underline"
                >
                  Chuyển sang tinh chỉnh 4 bước →
                </button>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {(isCalculating || isAiLoading) && (
            <div className="space-y-6">
              <div className="text-center py-8 space-y-3">
                <div className="w-10 h-10 border-4 border-[#8C5D3B] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-bold text-[#8C5D3B]">
                  {isAiLoading
                    ? 'Trợ lý AI đang phân tích ý định đọc & truy vấn danh mục sách thật...'
                    : 'Đang đối sánh sở thích với kho tri thức NOVELIA BOOKS...'}
                </p>
                <p className="text-xs text-stone-500 font-light">
                  Chuẩn hóa điểm phù hợp và tổng hợp lý do gợi ý khoa học
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-3xl bg-white border border-[#EAE3D8] animate-pulse p-6" />
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {!isCalculating && error && (
            <div className="p-8 rounded-3xl bg-red-50 border border-red-200 text-center space-y-4 max-w-xl mx-auto">
              <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-red-900 text-base">Không thể hoàn tất gợi ý</h4>
                <p className="text-xs text-red-700">{error}</p>
              </div>
              <Button
                size="sm"
                className="bg-red-700 hover:bg-red-800 text-white rounded-xl"
                onClick={handleSubmitSurvey}
              >
                Thử lại ngay
              </Button>
            </div>
          )}

          {/* Empty State: No matches found */}
          {!isCalculating && !error && recommendations && recommendations.totalMatches === 0 && (
            <div className="p-10 rounded-3xl bg-white border border-[#EAE3D8] text-center space-y-6 max-w-xl mx-auto shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700 mx-auto border border-amber-200">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif-title text-2xl font-bold text-[#1C1917]">
                  Chưa tìm thấy tác phẩm phù hợp tuyệt đối
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-light">
                  Các tiêu chí hiện tại (đặc biệt là lọc cứng ngân sách hoặc bắt buộc còn hàng) có thể đang quá chặt chẽ so với danh mục hiện có.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] text-xs text-stone-600 text-left space-y-1.5">
                <span className="font-bold text-[#8C5D3B] block">Gợi ý điều chỉnh:</span>
                <p>• Bỏ chọn "Giới hạn ngân sách cứng" để thuật toán gợi ý thêm các tác phẩm gần tầm giá.</p>
                <p>• Mở rộng thêm 1 - 2 thể loại sách yêu thích ở Bước 2.</p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  size="sm"
                  className="bg-[#8C5D3B] hover:bg-[#754C2F] text-white rounded-xl px-5"
                  onClick={() => setStep(4)}
                >
                  Điều chỉnh ngân sách
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-[#D8D0C5]"
                  onClick={() => navigate('/books')}
                >
                  Xem toàn bộ kho sách
                </Button>
              </div>
            </div>
          )}

          {/* Results Grid with Feedback controls */}
          {!isCalculating && !error && recommendations && recommendations.totalMatches > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.items.map((item) => (
                <BookMatchCard
                  key={item.bookId}
                  item={item}
                  onAddedToCart={showCartToast}
                  onFeedback={handleFeedback}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
