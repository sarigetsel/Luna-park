export interface HeroSlide {
  image: string;
  title: string;
  subtitle: string;
}

const LOCAL_IMAGE_FILES = [
  'nikolay-loubet-9K5-qe3thSg-unsplash.jpg',
  'dima-solomin-Ijk-A1OTlis-unsplash.jpg',
  'defne-kucukmustafa-1YPfL3kP-vM-unsplash.jpg',
  'hoyoun-lee-uD5YTXTzHAQ-unsplash.jpg',
  'nadiia-ganzhyi-Tc2gm1l6Doc-unsplash.jpg',
  'liz-sanchez-vegas-95RpzJy8ry4-unsplash.jpg',
  'andreas-rasmussen-ALfc4MXCAek-unsplash.jpg',
  'luna-wang-lVTz4Cpk9oA-unsplash.jpg',
  'jack-o-rourke-cfsFIWnL9Nk-unsplash.jpg',
  'clem-onojeghuo-MgRgzB58D44-unsplash.jpg',
];

const RIDE_IMAGE_BY_NAME: Record<string, string> = {
  'גלגל הענק לונה': 'nikolay-loubet-9K5-qe3thSg-unsplash.jpg',
  'רכבת ההרים אדרנלין': 'andreas-rasmussen-ALfc4MXCAek-unsplash.jpg',
  'קרוסלת הכוכבים': 'defne-kucukmustafa-1YPfL3kP-vM-unsplash.jpg',
  'מגלשת המים הכחולה': 'nadiia-ganzhyi-Tc2gm1l6Doc-unsplash.jpg',
  'בית האימה לילי': 'jack-o-rourke-cfsFIWnL9Nk-unsplash.jpg',
  'מופע האור והמוזיקה': 'luna-wang-lVTz4Cpk9oA-unsplash.jpg',
  'מכוניות מתנגשות': 'dima-solomin-Ijk-A1OTlis-unsplash.jpg',
  'ספינת השודדים': 'clem-onojeghuo-MgRgzB58D44-unsplash.jpg',
  'כוסות התה המטורפות': 'liz-sanchez-vegas-95RpzJy8ry4-unsplash.jpg',
  'מגדל הנפילה החופשית': 'andreas-rasmussen-ALfc4MXCAek-unsplash.jpg',
  'נהר הרפים': 'hoyoun-lee-uD5YTXTzHAQ-unsplash.jpg',
  'בריכת הגלים': 'nadiia-ganzhyi-Tc2gm1l6Doc-unsplash.jpg',
  'רכבות קרטינג מהירות': 'dima-solomin-Ijk-A1OTlis-unsplash.jpg',
  'בית הבלונים הקסום': 'liz-sanchez-vegas-95RpzJy8ry4-unsplash.jpg',
  'מסע בגלקסיה': 'luna-wang-lVTz4Cpk9oA-unsplash.jpg',
  'הגשר השקוף': 'jack-o-rourke-cfsFIWnL9Nk-unsplash.jpg',
};

function getBaseHref(): string {
  if (typeof document === 'undefined') return '/';
  const href = document.querySelector('base')?.getAttribute('href') || '/';
  return href.endsWith('/') ? href : `${href}/`;
}

function getPublicImageUrl(filename: string): string {
  return `${getBaseHref()}images/${filename}`;
}

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getHeroSlides(): HeroSlide[] {
  return [
    {
      image: getPublicImageUrl('nikolay-loubet-9K5-qe3thSg-unsplash.jpg'),
      title: 'אווירת לילה בפארק',
      subtitle: 'אורות, מוזיקה וריגושים בכל פינה',
    },
    {
      image: getPublicImageUrl('dima-solomin-Ijk-A1OTlis-unsplash.jpg'),
      title: 'אדרנלין בגובה',
      subtitle: 'רכבות הרים וחוויות מלאות אקשן',
    },
    {
      image: getPublicImageUrl('defne-kucukmustafa-1YPfL3kP-vM-unsplash.jpg'),
      title: 'מופעים ואטרקציות',
      subtitle: 'חוויות בלתי נשכחות לכל המשפחה',
    },
    {
      image: getPublicImageUrl('hoyoun-lee-uD5YTXTzHAQ-unsplash.jpg'),
      title: 'כיף לכל גיל',
      subtitle: 'מתקנים לילדים, לנוער ולמבוגרים',
    },
    {
      image: getPublicImageUrl('nadiia-ganzhyi-Tc2gm1l6Doc-unsplash.jpg'),
      title: 'חוויה צבעונית',
      subtitle: 'יום שלם של חיוכים וזיכרונות',
    },
    {
      image: getPublicImageUrl('liz-sanchez-vegas-95RpzJy8ry4-unsplash.jpg'),
      title: 'פארק חי ותוסס',
      subtitle: 'אווירה אנרגטית מהכניסה ועד היציאה',
    },
    {
      image: getPublicImageUrl('andreas-rasmussen-ALfc4MXCAek-unsplash.jpg'),
      title: 'מתקנים עוצמתיים',
      subtitle: 'מהירות, גובה והרבה התלהבות',
    },
    {
      image: getPublicImageUrl('luna-wang-lVTz4Cpk9oA-unsplash.jpg'),
      title: 'רגעים משפחתיים',
      subtitle: 'בילוי מושלם ביחד',
    },
    {
      image: getPublicImageUrl('jack-o-rourke-cfsFIWnL9Nk-unsplash.jpg'),
      title: 'פארק ביום ובלילה',
      subtitle: 'חוויה שונה בכל שעה',
    },
    {
      image: getPublicImageUrl('clem-onojeghuo-MgRgzB58D44-unsplash.jpg'),
      title: 'ההרפתקה מתחילה כאן',
      subtitle: 'בחרו מתקן והתחילו ליהנות',
    },
  ];
}

/** Local ride images served by the API — avoids broken external CDN links. */
export function getLocalParkImages(): string[] {
  return LOCAL_IMAGE_FILES.map((file) => getPublicImageUrl(file));
}

export function getRidePublicImage(rideName?: string): string {
  const images = getLocalParkImages();
  if (!images.length) {
    return getDefaultParkImage();
  }
  const key = (rideName || '').trim();
  if (!key) {
    return images[0];
  }
  const mapped = RIDE_IMAGE_BY_NAME[key];
  if (mapped) {
    return getPublicImageUrl(mapped);
  }
  return images[hashName(key) % images.length];
}

export function getDefaultParkImage(): string {
  return getPublicImageUrl('nikolay-loubet-9K5-qe3thSg-unsplash.jpg');
}

export function getAuthBackgroundImage(): string {
  return getPublicImageUrl('dima-solomin-Ijk-A1OTlis-unsplash.jpg');
}
