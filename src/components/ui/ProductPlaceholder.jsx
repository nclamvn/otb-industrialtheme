'use client';

/**
 * Luxury fashion product placeholder images.
 * Renders a category-appropriate SVG illustration when no product photo is available.
 */

const Handbag = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bag1" x1="16" y1="20" x2="48" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#D4A76A" />
        <stop offset="1" stopColor="#8B6914" />
      </linearGradient>
      <linearGradient id="bag2" x1="20" y1="26" x2="44" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#C4975A" />
        <stop offset="1" stopColor="#7A5C38" />
      </linearGradient>
    </defs>
    {/* Handle */}
    <path d="M22 24C22 16 26 12 32 12C38 12 42 16 42 24" stroke="url(#bag1)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    {/* Body */}
    <rect x="14" y="24" width="36" height="28" rx="4" fill="url(#bag2)" />
    {/* Flap */}
    <path d="M14 28H50V32C50 34 48 36 46 36H18C16 36 14 34 14 32V28Z" fill="#D4A76A" opacity="0.6"/>
    {/* Clasp */}
    <rect x="28" y="33" width="8" height="5" rx="2.5" fill="#E8D5B0" stroke="#B8894E" strokeWidth="1"/>
    {/* Stitching */}
    <line x1="14" y1="42" x2="50" y2="42" stroke="#B8894E" strokeWidth="0.5" strokeDasharray="3 2" opacity="0.5"/>
    {/* Brand plate */}
    <rect x="24" y="44" width="16" height="4" rx="1" fill="#E8D5B0" opacity="0.4"/>
  </svg>
);

const Jacket = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="jkt1" x1="12" y1="8" x2="52" y2="58" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2C2417" />
        <stop offset="1" stopColor="#4A3D2E" />
      </linearGradient>
    </defs>
    {/* Collar */}
    <path d="M24 10L32 6L40 10" stroke="#6B5D4F" strokeWidth="2" strokeLinecap="round" fill="none"/>
    {/* Body */}
    <path d="M20 12L14 18V54H28V12H20Z" fill="url(#jkt1)" />
    <path d="M44 12L50 18V54H36V12H44Z" fill="url(#jkt1)" />
    {/* Center */}
    <rect x="28" y="12" width="8" height="42" fill="#3D3229" />
    {/* Lapels */}
    <path d="M28 12L22 22V12H28Z" fill="#4A3D2E" />
    <path d="M36 12L42 22V12H36Z" fill="#4A3D2E" />
    {/* Buttons */}
    <circle cx="32" cy="24" r="1.5" fill="#C4975A" />
    <circle cx="32" cy="32" r="1.5" fill="#C4975A" />
    <circle cx="32" cy="40" r="1.5" fill="#C4975A" />
    {/* Sleeves */}
    <path d="M14 18L8 24V46L14 48" stroke="#4A3D2E" strokeWidth="2" fill="#3D3229"/>
    <path d="M50 18L56 24V46L50 48" stroke="#4A3D2E" strokeWidth="2" fill="#3D3229"/>
    {/* Pocket */}
    <rect x="17" y="32" width="8" height="6" rx="1" stroke="#6B5D4F" strokeWidth="0.8" fill="none" opacity="0.5"/>
  </svg>
);

const Dress = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="drs1" x1="20" y1="4" x2="44" y2="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="#C4975A" />
        <stop offset="0.5" stopColor="#D4A76A" />
        <stop offset="1" stopColor="#8A6340" />
      </linearGradient>
    </defs>
    {/* Straps */}
    <line x1="26" y1="6" x2="28" y2="14" stroke="#B8894E" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="38" y1="6" x2="36" y2="14" stroke="#B8894E" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Bodice */}
    <path d="M24 14H40V30L42 30L38 32H26L22 30L24 30V14Z" fill="url(#drs1)" />
    {/* Waist */}
    <path d="M24 30Q32 34 40 30" stroke="#8A6340" strokeWidth="1" fill="none"/>
    {/* Skirt */}
    <path d="M22 30L16 58H48L42 30" fill="url(#drs1)" />
    {/* Drape folds */}
    <path d="M26 32Q28 44 24 58" stroke="#B8894E" strokeWidth="0.6" fill="none" opacity="0.4"/>
    <path d="M32 32Q32 44 32 58" stroke="#B8894E" strokeWidth="0.6" fill="none" opacity="0.3"/>
    <path d="M38 32Q36 44 40 58" stroke="#B8894E" strokeWidth="0.6" fill="none" opacity="0.4"/>
    {/* Neckline */}
    <path d="M28 14Q32 18 36 14" stroke="#E8D5B0" strokeWidth="0.8" fill="none"/>
  </svg>
);

const Shoe = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shoe1" x1="8" y1="24" x2="56" y2="50" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2C2417" />
        <stop offset="1" stopColor="#4A3D2E" />
      </linearGradient>
    </defs>
    {/* Heel */}
    <path d="M12 44L8 56H16L14 44" fill="#3D3229" />
    {/* Sole */}
    <path d="M8 48H56V52C56 54 54 56 52 56H12C10 56 8 54 8 52V48Z" fill="#1A1510" />
    {/* Upper */}
    <path d="M10 48C10 36 14 28 20 24L40 20C48 20 54 28 56 38V48H10Z" fill="url(#shoe1)" />
    {/* Tongue */}
    <path d="M20 24L18 18C18 16 20 14 22 14L30 16L40 20L20 24Z" fill="#4A3D2E" />
    {/* Laces */}
    <line x1="22" y1="22" x2="34" y2="20" stroke="#C4975A" strokeWidth="0.6" opacity="0.6"/>
    <line x1="21" y1="26" x2="36" y2="22" stroke="#C4975A" strokeWidth="0.6" opacity="0.6"/>
    <line x1="20" y1="30" x2="38" y2="24" stroke="#C4975A" strokeWidth="0.6" opacity="0.6"/>
    {/* Logo accent */}
    <circle cx="46" cy="38" r="3" fill="#C4975A" opacity="0.3"/>
  </svg>
);

const Watch = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wtch1" x1="20" y1="16" x2="44" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E8D5B0" />
        <stop offset="1" stopColor="#C4975A" />
      </linearGradient>
      <radialGradient id="wtch2" cx="32" cy="32" r="12" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFFDF8" />
        <stop offset="1" stopColor="#F5EDE0" />
      </radialGradient>
    </defs>
    {/* Strap top */}
    <rect x="26" y="4" width="12" height="16" rx="2" fill="#6B5D4F" />
    <line x1="28" y1="8" x2="36" y2="8" stroke="#8C8178" strokeWidth="0.5" opacity="0.5"/>
    <line x1="28" y1="12" x2="36" y2="12" stroke="#8C8178" strokeWidth="0.5" opacity="0.5"/>
    {/* Strap bottom */}
    <rect x="26" y="44" width="12" height="16" rx="2" fill="#6B5D4F" />
    <line x1="28" y1="48" x2="36" y2="48" stroke="#8C8178" strokeWidth="0.5" opacity="0.5"/>
    <line x1="28" y1="52" x2="36" y2="52" stroke="#8C8178" strokeWidth="0.5" opacity="0.5"/>
    {/* Case */}
    <circle cx="32" cy="32" r="14" fill="url(#wtch1)" stroke="#B8894E" strokeWidth="1.5"/>
    {/* Face */}
    <circle cx="32" cy="32" r="11" fill="url(#wtch2)" />
    {/* Markers */}
    <line x1="32" y1="22" x2="32" y2="24" stroke="#6B5D4F" strokeWidth="1" strokeLinecap="round"/>
    <line x1="32" y1="40" x2="32" y2="42" stroke="#6B5D4F" strokeWidth="1" strokeLinecap="round"/>
    <line x1="22" y1="32" x2="24" y2="32" stroke="#6B5D4F" strokeWidth="1" strokeLinecap="round"/>
    <line x1="40" y1="32" x2="42" y2="32" stroke="#6B5D4F" strokeWidth="1" strokeLinecap="round"/>
    {/* Hands */}
    <line x1="32" y1="32" x2="32" y2="25" stroke="#2C2417" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="32" y1="32" x2="37" y2="30" stroke="#2C2417" strokeWidth="0.8" strokeLinecap="round"/>
    <circle cx="32" cy="32" r="1.5" fill="#C4975A" />
    {/* Crown */}
    <rect x="45" y="30" width="3" height="4" rx="1" fill="#C4975A" />
  </svg>
);

const Sunglasses = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sg1" x1="4" y1="24" x2="60" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2C2417" />
        <stop offset="1" stopColor="#4A3D2E" />
      </linearGradient>
    </defs>
    {/* Left temple */}
    <path d="M6 26L4 24C2 22 2 20 4 20L14 22" stroke="#6B5D4F" strokeWidth="2" strokeLinecap="round" fill="none"/>
    {/* Right temple */}
    <path d="M58 26L60 24C62 22 62 20 60 20L50 22" stroke="#6B5D4F" strokeWidth="2" strokeLinecap="round" fill="none"/>
    {/* Bridge */}
    <path d="M28 28Q32 32 36 28" stroke="#6B5D4F" strokeWidth="2" fill="none"/>
    {/* Left lens */}
    <ellipse cx="20" cy="32" rx="12" ry="10" fill="url(#sg1)" stroke="#6B5D4F" strokeWidth="1.5"/>
    <ellipse cx="20" cy="32" rx="10" ry="8" fill="none" stroke="#8C8178" strokeWidth="0.3" opacity="0.3"/>
    {/* Right lens */}
    <ellipse cx="44" cy="32" rx="12" ry="10" fill="url(#sg1)" stroke="#6B5D4F" strokeWidth="1.5"/>
    <ellipse cx="44" cy="32" rx="10" ry="8" fill="none" stroke="#8C8178" strokeWidth="0.3" opacity="0.3"/>
    {/* Reflection */}
    <path d="M14 28Q16 26 20 27" stroke="white" strokeWidth="0.8" opacity="0.2" fill="none"/>
    <path d="M38 28Q40 26 44 27" stroke="white" strokeWidth="0.8" opacity="0.2" fill="none"/>
  </svg>
);

const Scarf = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="scf1" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#C4975A" />
        <stop offset="0.5" stopColor="#D4A76A" />
        <stop offset="1" stopColor="#8A6340" />
      </linearGradient>
    </defs>
    {/* Draped scarf body */}
    <path d="M16 10Q8 20 12 32Q16 44 20 56" stroke="url(#scf1)" strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.8"/>
    <path d="M28 8Q20 18 24 30Q32 46 28 58" stroke="url(#scf1)" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.6"/>
    {/* Fringe */}
    <line x1="18" y1="54" x2="16" y2="60" stroke="#B8894E" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
    <line x1="20" y1="55" x2="19" y2="61" stroke="#B8894E" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
    <line x1="22" y1="56" x2="22" y2="62" stroke="#B8894E" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
    {/* Pattern detail */}
    <path d="M14 18Q18 22 14 26" stroke="#E8D5B0" strokeWidth="0.6" fill="none" opacity="0.4"/>
    <path d="M14 30Q18 34 14 38" stroke="#E8D5B0" strokeWidth="0.6" fill="none" opacity="0.4"/>
    {/* Knot */}
    <ellipse cx="20" cy="24" rx="6" ry="4" fill="#D4A76A" stroke="#B8894E" strokeWidth="0.8"/>
  </svg>
);

const Wallet = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wlt1" x1="10" y1="16" x2="54" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6B5D4F" />
        <stop offset="1" stopColor="#3D3229" />
      </linearGradient>
    </defs>
    {/* Body */}
    <rect x="10" y="16" width="44" height="32" rx="3" fill="url(#wlt1)" />
    {/* Flap */}
    <path d="M10 16H54V28C54 30 52 32 50 32H14C12 32 10 30 10 28V16Z" fill="#7A6B5C" />
    {/* Stitching */}
    <rect x="13" y="19" width="38" height="26" rx="2" stroke="#8C8178" strokeWidth="0.5" strokeDasharray="2 1.5" fill="none" opacity="0.4"/>
    {/* Snap */}
    <circle cx="32" cy="30" r="3" fill="#C4975A" stroke="#B8894E" strokeWidth="0.8"/>
    <circle cx="32" cy="30" r="1.2" fill="#E8D5B0"/>
    {/* Card slots */}
    <rect x="16" y="36" width="14" height="2" rx="1" fill="#8C8178" opacity="0.3"/>
    <rect x="16" y="40" width="14" height="2" rx="1" fill="#8C8178" opacity="0.2"/>
  </svg>
);

// Map keywords to product types
const CATEGORY_MAP = {
  // Bags
  bag: 'bag', handbag: 'bag', tote: 'bag', clutch: 'bag', backpack: 'bag', crossbody: 'bag', satchel: 'bag', purse: 'bag',
  // Outerwear / Jackets
  outerwear: 'jacket', jacket: 'jacket', coat: 'jacket', blazer: 'jacket', parka: 'jacket', trench: 'jacket', bomber: 'jacket', vest: 'jacket',
  // Dresses / RTW
  dress: 'dress', gown: 'dress', rtw: 'dress', 'ready to wear': 'dress', skirt: 'dress', blouse: 'dress', top: 'dress', shirt: 'dress', pants: 'dress', trouser: 'dress',
  // Shoes
  shoe: 'shoe', shoes: 'shoe', sneaker: 'shoe', boot: 'shoe', loafer: 'shoe', sandal: 'shoe', heel: 'shoe', mule: 'shoe', slipper: 'shoe', footwear: 'shoe',
  // Watches
  watch: 'watch', watches: 'watch', timepiece: 'watch',
  // Eyewear
  eyewear: 'sunglasses', sunglasses: 'sunglasses', glasses: 'sunglasses', optical: 'sunglasses',
  // Scarves / Accessories
  scarf: 'scarf', scarves: 'scarf', shawl: 'scarf', stole: 'scarf', tie: 'scarf', belt: 'scarf',
  // Small Leather Goods
  wallet: 'wallet', 'small leather': 'wallet', slg: 'wallet', cardholder: 'wallet', 'card holder': 'wallet', pouch: 'wallet', 'key ring': 'wallet',
  // Accessories fallback
  accessories: 'wallet', accessory: 'wallet', jewelry: 'watch', jewellery: 'watch',
};

const COMPONENTS = {
  bag: Handbag,
  jacket: Jacket,
  dress: Dress,
  shoe: Shoe,
  watch: Watch,
  sunglasses: Sunglasses,
  scarf: Scarf,
  wallet: Wallet,
};

function resolveType(category, subCategory, productType) {
  const text = `${category || ''} ${subCategory || ''} ${productType || ''}`.toLowerCase();
  for (const [keyword, type] of Object.entries(CATEGORY_MAP)) {
    if (text.includes(keyword)) return type;
  }
  return 'bag'; // default luxury item
}

export default function ProductPlaceholder({ size = 24, category, subCategory, productType, className = '' }) {
  const type = resolveType(category, subCategory, productType);
  const Component = COMPONENTS[type] || Handbag;

  return (
    <div className={className}>
      <Component size={size} />
    </div>
  );
}
