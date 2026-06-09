import { useState, useRef, useEffect } from "react";
import {
  BotMessageSquare, Send, User, Trash2, BarChart3,
  ShoppingBag, MapPin, DollarSign, Clock, Package
} from "lucide-react";
import { useOrders, type LiveOrder } from "@/contexts/OrderContext";
import { useMenuData } from "@/hooks/useMenuData";
import { cn } from "@/lib/utils";

/* ─── Context builder ────────────────────────────────────────── */
function buildContext(orders: LiveOrder[], totalProducts = 0, totalCategories = 0) {
  const delivered = orders.filter(o => o.status === "delivered");
  const revenue   = delivered.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.unitPrice * i.quantity, 0), 0);
  const pending   = orders.filter(o => o.status === "pending").length;
  const preparing = orders.filter(o => o.status === "preparing").length;
  const cancelled = orders.filter(o => o.status === "cancelled").length;
  const zones     = [...new Set(orders.map(o => o.zone).filter(Boolean))];

  // Product sales
  const itemMap: Record<string, number> = {};
  delivered.forEach(o => o.items.forEach(i => { itemMap[i.name] = (itemMap[i.name] ?? 0) + i.quantity; }));
  const topItems = Object.entries(itemMap).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([n, q]) => `${n}(${q})`).join(", ");

  return {
    totalOrders: orders.length,
    delivered: delivered.length,
    pending, preparing, cancelled,
    revenue: Math.round(revenue),
    topItems,
    zones: zones.join(", ") || "غير محدد",
    totalProducts,
    totalCategories,
  };
}

/* ─── Simple rule-based AI ───────────────────────────────────── */
function respond(q: string, ctx: ReturnType<typeof buildContext>): string {
  const lower = q.toLowerCase().replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/[ىئ]/g,"ي");

  if (/ايراد|إيراد|دخل|ربح|مبيعات/.test(lower))
    return `إجمالي إيرادات المطعم من الطلبات المسلّمة: **${ctx.revenue.toLocaleString("ar-SA")} د.ع**\n(${ctx.delivered} طلب مسلّم من أصل ${ctx.totalOrders} طلب إجمالي)`;

  if (/طلب.*انتظار|كم.*انتظار|pending/.test(lower))
    return `يوجد حالياً **${ctx.pending} طلب** في الانتظار بحاجة لمراجعة.`;

  if (/تحضير|مطبخ/.test(lower))
    return `**${ctx.preparing} طلب** قيد التحضير في المطبخ الآن.`;

  if (/الغ|ملغ|cancel/.test(lower))
    return `عدد الطلبات الملغاة: **${ctx.cancelled}** من إجمالي ${ctx.totalOrders} طلب (${Math.round(ctx.cancelled/ctx.totalOrders*100)}%).`;

  if (/اكثر.*مباع|اعلى.*مبيع|الاكثر|الأكثر.*طلب|ايه.*مشهور/.test(lower))
    return `أكثر المنتجات مبيعاً بناءً على الطلبات المسلّمة:\n${ctx.topItems || "لا بيانات كافية"}`;

  if (/منطق|توصيل.*منطق|zone/.test(lower))
    return `مناطق التوصيل النشطة: **${ctx.zones}**`;

  if (/كم.*منتج|عدد.*منتج|قائم/.test(lower))
    return `القائمة تحتوي على **${ctx.totalProducts} منتج** موزعة على **${ctx.totalCategories} فئة**.`;

  if (/ملخص|overview|تقرير سريع|خلاصه|خلاصة/.test(lower))
    return `ملخص اليوم:\n- إجمالي الطلبات: **${ctx.totalOrders}**\n- مسلّمة: **${ctx.delivered}**\n- انتظار: **${ctx.pending}**\n- تحضير: **${ctx.preparing}**\n- ملغاة: **${ctx.cancelled}**\n- الإيرادات: **${ctx.revenue.toLocaleString("ar-SA")} د.ع**`;

  if (/مساء|صباح|اهلا|مرحبا|هلا|السلام/.test(lower))
    return "أهلاً بك! أنا المساعد الذكي للوحة الإدارة. يمكنني الإجابة على أسئلة حول الطلبات، الإيرادات، المنتجات، والمناطق.";

  if (/شكر|ممتاز|رائع|عظيم/.test(lower))
    return "شكراً! أنا هنا دائماً لمساعدتك في إدارة المطعم بكفاءة.";

  if (/ماذا.*تستطيع|ايش.*تقدر|مساعد.*ماذا/.test(lower))
    return "أستطيع مساعدتك في:\n- استعراض الإيرادات والمبيعات\n- إحصائيات الطلبات (انتظار، تحضير، مسلّمة، ملغاة)\n- أكثر المنتجات مبيعاً\n- مناطق التوصيل\n- ملخصات سريعة عن أداء المطعم\n\nجرّب سؤالاً مثل: \"ما إيرادات اليوم؟\" أو \"كم طلب في الانتظار؟\"";

  return "لم أفهم السؤال تماماً. يمكنك السؤال عن: الإيرادات، الطلبات، المنتجات الأكثر مبيعاً، مناطق التوصيل، أو اطلب ملخصاً سريعاً.";
}

/* ─── Message components ─────────────────────────────────────── */
interface Message { id: string; role: "user" | "assistant"; text: string; time: Date; }

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  // Render **bold** markdown
  const parts = msg.text.split(/\*\*(.*?)\*\*/g);
  const content = parts.map((p, i) =>
    i % 2 === 1 ? <strong key={i} className="font-bold">{p}</strong> : p.split("\n").map((line, j, arr) =>
      j < arr.length - 1 ? [line, <br key={`br-${j}`} />] : line
    )
  );

  return (
    <div className={cn("flex gap-2 items-end", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0",
        isUser ? "bg-primary/10" : "bg-primary/15")}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-primary" />
          : <BotMessageSquare className="w-3.5 h-3.5 text-primary" />}
      </div>
      <div className={cn("max-w-[78%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed shadow-sm",
        isUser
          ? "bg-primary text-primary-foreground rounded-bl-sm"
          : "bg-surface border border-border text-text-primary rounded-br-sm"
      )}>
        {content}
        <p className={cn("text-[9px] mt-1 opacity-60", isUser ? "text-right" : "text-left")}>
          {msg.time.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

/* ─── Suggestion chips ───────────────────────────────────────── */
const SUGGESTIONS = [
  { icon: DollarSign, text: "ما إيرادات اليوم؟" },
  { icon: Clock,      text: "كم طلب في الانتظار؟" },
  { icon: Package,    text: "أكثر المنتجات مبيعاً" },
  { icon: BarChart3,  text: "ملخص سريع" },
  { icon: MapPin,     text: "مناطق التوصيل" },
  { icon: ShoppingBag,text: "كم طلب ملغى؟" },
];

/* ─── Main Page ──────────────────────────────────────────────── */
export function AdminAssistantPage() {
  const { orders } = useOrders();
  const { items: menuItems, categories: menuCats } = useMenuData();
  const ctx = buildContext(orders, menuItems.length, menuCats.length);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "مرحباً! أنا المساعد الذكي للوحة الإدارة.\n\nأستطيع الإجابة على أسئلتك حول الطلبات، الإيرادات، المنتجات، والمناطق. جرّب أحد الاقتراحات أدناه أو اكتب سؤالك.",
      time: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function sendMessage(text: string) {
    const q = text.trim();
    if (!q) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text: q, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const reply = respond(q, ctx);
      const botMsg: Message = { id: `b-${Date.now()}`, role: "assistant", text: reply, time: new Date() };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 700 + Math.random() * 500);
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-var(--nav-height)-var(--header-height,56px))]">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-elevated shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <BotMessageSquare className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">المساعد الذكي</p>
            <p className="text-[10px] text-status-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success inline-block" />
              متصل · يعمل
            </p>
          </div>
        </div>
        <button
          onClick={() => setMessages(prev => prev.slice(0, 1))}
          className="w-8 h-8 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:text-status-error transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {isTyping && (
          <div className="flex gap-2 items-end">
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <BotMessageSquare className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-surface border border-border rounded-2xl rounded-br-sm px-3 py-2.5">
              <div className="flex gap-1 items-center h-4">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-text-muted/50 animate-bounce"
                    style={{ animationDelay: `${i*150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {SUGGESTIONS.map(s => (
              <button key={s.text} onClick={() => sendMessage(s.text)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-surface-elevated border border-border rounded-xl text-[11px] text-text-secondary font-medium hover:border-primary/40 hover:text-primary transition-all active:scale-[0.97]">
                <s.icon className="w-3 h-3" />{s.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-surface shrink-0">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !isTyping && sendMessage(input)}
            placeholder="اسأل عن الطلبات، الإيرادات، المنتجات..."
            disabled={isTyping}
            className="flex-1 bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-xs text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 transition-all active:scale-[0.95] shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
