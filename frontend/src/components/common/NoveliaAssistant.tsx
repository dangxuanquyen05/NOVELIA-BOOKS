import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, BookOpen, Bot, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  time: string;
  suggestions?: string[];
}

export const NoveliaAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Xin chào! 👋\nMình là NOVELIA Assistant - trợ lý ảo của NOVELIA BOOKS. Mình có thể giúp bạn tìm sách, tư vấn thể loại, tra cứu đơn hàng và giải đáp các thắc mắc về cửa hàng.',
      time: 'Vừa xong',
      suggestions: [
        'Tìm sách theo chủ đề',
        'Sách dưới 200.000đ',
        'Tra cứu đơn hàng',
        'Chính sách mua hàng',
      ],
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      let replyText = '';
      let nextSuggestions: string[] | undefined = undefined;

      const lower = text.toLowerCase();
      if (lower.includes('chủ đề') || lower.includes('thể loại')) {
        replyText = 'NOVELIA BOOKS có 10 danh mục phong phú: Văn học kinh điển, Kinh tế - Quản trị, Kỹ năng sống, Tâm lý học, Khoa học, Công nghệ, và Sức khỏe. Bạn thích chủ đề nào nhất?';
        nextSuggestions = ['Văn học', 'Kinh tế', 'Kỹ năng sống', 'Tâm lý học'];
      } else if (lower.includes('dưới 200') || lower.includes('giá rẻ') || lower.includes('giá tốt')) {
        replyText = 'Hiện tại chúng mình có các tựa sách bán chạy dưới 200.000đ như: Đắc nhân tâm (99.000đ), Nhà giả kim (89.000đ), Thói quen nguyên tử (119.000đ), Đi tìm lẽ sống (109.000đ).';
        nextSuggestions = ['Xem Đắc nhân tâm', 'Xem Nhà giả kim', 'Đến trang Tất cả sách'];
      } else if (lower.includes('đơn hàng') || lower.includes('tra cứu')) {
        replyText = 'Bạn có thể vào mục "Tài khoản của tôi" > "Đơn hàng của tôi" để xem trạng thái giao vận theo thời gian thực (Đang giao, Đã giao, Đã hủy). Hoặc cung cấp mã đơn hàng dạng #DH123456 nhé!';
        nextSuggestions = ['Đến trang đơn hàng của tôi'];
      } else if (lower.includes('chính sách') || lower.includes('đổi trả') || lower.includes('vận chuyển')) {
        replyText = 'Chính sách mua sắm tại NOVELIA BOOKS:\n✓ Miễn phí giao hàng cho đơn từ 500.000đ\n✓ Đổi trả trong 7 ngày nếu sách lỗi do nhà xuất bản\n✓ Cam kết 100% sách chính hãng có bản quyền kèm bookmark độc quyền.';
        nextSuggestions = ['Tìm sách theo chủ đề', 'Khám phá ngay'];
      } else if (lower.includes('đắc nhân tâm')) {
        replyText = 'Tác phẩm "Đắc nhân tâm" của Dale Carnegie hiện đang có giá ưu đãi 99.000đ (giảm 15%). Bạn có muốn mình dẫn đến trang chi tiết không?';
        nextSuggestions = ['Mở trang Đắc nhân tâm'];
      } else if (lower.includes('nhà giả kim')) {
        replyText = 'Tác phẩm "Nhà giả kim" của Paulo Coelho đang có sẵn với giá 89.000đ. Cuốn sách kể về hành trình tìm kiếm kho báu và lẽ sống của Santiago.';
        nextSuggestions = ['Mở trang Nhà giả kim'];
      } else {
        replyText = `Cảm ơn bạn đã nhắn: "${text}". Mình có thể dẫn bạn đến tủ sách phù hợp hoặc bạn có thể thử tính năng trắc nghiệm thông minh BookMatch™ nhé!`;
        nextSuggestions = ['Trắc nghiệm BookMatch™', 'Tất cả sách', 'Sách bán chạy nhất'];
      }

      const botReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: replyText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestions: nextSuggestions,
      };

      setMessages((prev) => [...prev, botReply]);
      setIsTyping(false);
    }, 700);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === 'Mở trang Đắc nhân tâm') {
      navigate('/books/dac-nhan-tam');
      setIsOpen(false);
      return;
    }
    if (suggestion === 'Mở trang Nhà giả kim') {
      navigate('/books/nha-gia-kim');
      setIsOpen(false);
      return;
    }
    if (suggestion === 'Đến trang Tất cả sách') {
      navigate('/books');
      setIsOpen(false);
      return;
    }
    if (suggestion === 'Đến trang đơn hàng của tôi') {
      navigate('/customer/profile');
      setIsOpen(false);
      return;
    }
    if (suggestion === 'Trắc nghiệm BookMatch™') {
      navigate('/bookmatch');
      setIsOpen(false);
      return;
    }
    handleSend(suggestion);
  };

  return (
    <>
      {/* Floating trigger button (visible on all screens bottom right) */}
      <div className="fixed bottom-20 sm:bottom-8 right-5 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Mở NOVELIA Assistant"
          className="relative w-13 h-13 rounded-full bg-[#3D2C1E] hover:bg-[#2A1D13] text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-108 active:scale-95 border-2 border-[#E7DFD5]/40 cursor-pointer group"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white transition-transform group-hover:rotate-90" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6 text-[#F5EDE4]" />
              <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#3D2C1E] animate-pulse" />
            </>
          )}
        </button>
      </div>

      {/* Floating Assistant Modal / Drawer (matches top right of design image) */}
      {isOpen && (
        <div className="fixed inset-x-4 bottom-24 sm:bottom-24 sm:right-6 sm:left-auto sm:w-[380px] z-50 animate-scale-up origin-bottom-right">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E8E2D8] overflow-hidden flex flex-col h-[520px] max-h-[80vh]">
            {/* Header: Dark style with status */}
            <div className="bg-[#1C1917] text-white px-5 py-3.5 flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#3D2C1E] border border-white/20 flex items-center justify-center text-[#E6C687]">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                    NOVELIA Assistant
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Đang hoạt động</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-300 hover:text-white transition cursor-pointer"
                aria-label="Đóng trợ lý"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FBF9F5]/70">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  <div className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-[#3D2C1E] text-white flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-xs">
                        <Bot className="w-4 h-4 text-[#E6C687]" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-[#3D2C1E] text-white rounded-br-none'
                          : 'bg-[#F2ECE4] text-[#1C1917] rounded-tl-none border border-[#E5DDD2]'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                      <span className={`block text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-stone-300 text-right' : 'text-stone-500'}`}>
                        {msg.time}
                      </span>
                    </div>

                    {msg.sender === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-[#8C5D3B] text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Quick Action Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="pl-9 flex flex-col gap-2 pt-1">
                      {msg.suggestions.map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSuggestionClick(sug)}
                          className="w-full text-left px-3.5 py-2 rounded-xl bg-white hover:bg-[#F2ECE4] border border-[#DDD3C4] text-[#2C241D] text-xs font-medium transition-all shadow-xs hover:border-[#B88E52] cursor-pointer"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2.5 items-center pl-9 text-xs text-stone-500">
                  <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-stone-400 italic">Trợ lý đang phản hồi...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-[#EAE3D8]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2 bg-[#FAF7F2] rounded-full px-4 py-1.5 border border-[#E5DDD2] focus-within:border-[#3D2C1E] focus-within:ring-1 focus-within:ring-[#3D2C1E]/20 transition"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Nhập tin nhắn của bạn..."
                  className="flex-1 bg-transparent text-xs text-[#1C1917] placeholder-stone-400 focus:outline-hidden py-1.5"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  aria-label="Gửi tin nhắn"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    inputText.trim()
                      ? 'bg-[#3D2C1E] hover:bg-[#2A1D13] text-white cursor-pointer active:scale-95'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
