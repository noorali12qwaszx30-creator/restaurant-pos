/**
 * AppLogo — شعار النظام للإدارة المتكاملة
 * مخطط بياني صاعد + خط اتجاه + عقد بيانات متصلة
 */
export function AppLogo({ size = 80 }: { size?: number }) {
  const id = "logo";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 6px 16px rgba(20,83,45,0.45)) drop-shadow(0 2px 4px rgba(0,0,0,0.18))" }}
    >
      <defs>
        {/* خلفية متدرجة خضراء */}
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#22c55e" />
          <stop offset="55%"  stopColor="#16a34a" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>

        {/* تدرج الأعمدة من أسفل لأعلى */}
        <linearGradient id={`${id}-bar`} x1="0" y1="1" x2="0" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="white" stopOpacity="0.25" />
          <stop offset="100%" stopColor="white" stopOpacity="1"    />
        </linearGradient>

        {/* توهج العقدة العليا */}
        <filter id={`${id}-glow`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* توهج خفيف للعقد الصغيرة */}
        <filter id={`${id}-glow-sm`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* قطع دائري للخلفية */}
        <clipPath id={`${id}-clip`}>
          <rect width="80" height="80" rx="22" />
        </clipPath>
      </defs>

      {/* ── الخلفية الرئيسية ── */}
      <rect width="80" height="80" rx="22" fill={`url(#${id}-bg)`} />

      <g clipPath={`url(#${id}-clip)`}>
        {/* بريق زجاجي في الأعلى */}
        <ellipse cx="40" cy="-4" rx="40" ry="28" fill="white" fillOpacity="0.10" />

        {/* خطوط الشبكة الأفقية */}
        <line x1="11" y1="60" x2="69" y2="60" stroke="white" strokeOpacity="0.14" strokeWidth="0.8" />
        <line x1="11" y1="48" x2="69" y2="48" stroke="white" strokeOpacity="0.08" strokeWidth="0.6" />
        <line x1="11" y1="36" x2="69" y2="36" stroke="white" strokeOpacity="0.08" strokeWidth="0.6" />
        <line x1="11" y1="24" x2="69" y2="24" stroke="white" strokeOpacity="0.06" strokeWidth="0.5" />

        {/* ── الأعمدة البيانية الصاعدة ── */}
        {/* عمود 1 — قصير */}
        <rect x="11" y="51" width="10" height="9"  rx="3" fill={`url(#${id}-bar)`} fillOpacity="0.50" />
        {/* عمود 2 */}
        <rect x="25" y="41" width="10" height="19" rx="3" fill={`url(#${id}-bar)`} fillOpacity="0.65" />
        {/* عمود 3 */}
        <rect x="39" y="29" width="10" height="31" rx="3" fill={`url(#${id}-bar)`} fillOpacity="0.82" />
        {/* عمود 4 — أطول */}
        <rect x="53" y="15" width="10" height="45" rx="3" fill="white" fillOpacity="0.96" />

        {/* ── خط الاتجاه المنحني ── */}
        <path
          d="M 16 49 C 21 44 24 37 30 36 C 36 35 37 25 44 23 C 49 21 54 13 58 12"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity="0.95"
          fill="none"
        />

        {/* ── عقد البيانات ── */}
        {/* عقدة 1 */}
        <circle cx="16"  cy="49" r="3"   fill="white" fillOpacity="0.65" filter={`url(#${id}-glow-sm)`} />
        <circle cx="16"  cy="49" r="1.8" fill="white" fillOpacity="0.80" />

        {/* عقدة 2 */}
        <circle cx="30"  cy="36" r="3"   fill="white" fillOpacity="0.75" filter={`url(#${id}-glow-sm)`} />
        <circle cx="30"  cy="36" r="1.8" fill="white" fillOpacity="0.90" />

        {/* عقدة 3 */}
        <circle cx="44"  cy="23" r="3.5" fill="white" fillOpacity="0.85" filter={`url(#${id}-glow-sm)`} />
        <circle cx="44"  cy="23" r="2"   fill="white" />

        {/* ── عقدة القمة مع توهج قوي ── */}
        <circle cx="58" cy="12" r="7.5" fill="white" fillOpacity="0.18" filter={`url(#${id}-glow)`} />
        <circle cx="58" cy="12" r="5"   fill="white" fillOpacity="0.30" />
        <circle cx="58" cy="12" r="3.5" fill="white" filter={`url(#${id}-glow)`} />

        {/* سهم صاعد فوق العقدة العليا */}
        <path
          d="M 55 14 L 58 9.5 L 61 14"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeOpacity="0.95"
        />

        {/* ── نقاط بيانات صغيرة في الخلفية (تعطي عمقاً) ── */}
        <circle cx="68" cy="58" r="1.5" fill="white" fillOpacity="0.12" />
        <circle cx="64" cy="66" r="1"   fill="white" fillOpacity="0.10" />
        <circle cx="12" cy="68" r="1.5" fill="white" fillOpacity="0.10" />
        <circle cx="18" cy="64" r="1"   fill="white" fillOpacity="0.08" />

        {/* ── خط أفقي سفلي (قاعدة المخطط) ── */}
        <line x1="11" y1="61" x2="69" y2="61" stroke="white" strokeOpacity="0.25" strokeWidth="1.2" strokeLinecap="round" />

        {/* ── الإطار الزجاجي الخارجي ── */}
        <rect width="80" height="80" rx="22" fill="none" stroke="white" strokeOpacity="0.20" strokeWidth="1.2" />
      </g>
    </svg>
  );
}
