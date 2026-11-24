export interface Production {
  id: string
  title: string
  description: string
  image: string
  year: string
}

export interface Show {
  id: string
  title: string
  date: string
  time: string
  venue: string
  price: string
  description: string
  image: string
}

export interface Founder {
  id: string
  name: string
  role: string
  dates?: string
  biography: string
  image: string
}

export interface Play {
  id: string
  title: string
  year: string
  duration: string
  description: string
  blog?: string
  youtubeUrl: string
}

export interface GalleryGroup {
  id: string
  title: string
  images: string[]
}

export interface HeroSlide {
  id: string
  image: string
  alt: string
}

export interface TheatreContent {
  aboutHeading: string
  aboutText: string
  aboutImage: string
  heroSlides: HeroSlide[]
  productions: Production[]
  shows: Show[]
  founders: Founder[]
  plays: Play[]
  gallery: GalleryGroup[]
  footer: {
    tagline: string
    exploreHeading: string
    contactHeading: string
    socialHeading: string
    closingLine: string
    links: { id: string; label: string; url: string }[]
  }
  contact: {
    email: string
    phone: string
    address: string
    whatsapp: string
    instagram: string
    facebook: string
    youtube: string
  }
}

const storageKey = 'peoples-little-theatre-content-v1'

const historicProductions: Production[] = [
  {
    id: 'prod-tiner-talawar',
    title: 'Tiner Talawar',
    description: 'A landmark People’s Little Theatre production from 1971.',
    image: '/images/productions/tiner-talawar.png',
    year: '1971',
  },
  {
    id: 'prod-barricade',
    title: 'Barricade',
    description: 'A landmark People’s Little Theatre production from 1972.',
    image: '/images/productions/barricade.png',
    year: '1972',
  },
  {
    id: 'prod-duswapner-nagari',
    title: 'Duswapner Nagari',
    description: 'A landmark People’s Little Theatre production from 1974.',
    image: '/images/productions/duswapner-nagari.png',
    year: '1974',
  },
]

export const initialContent: TheatreContent = {
  aboutHeading: 'A legacy shaped by a collective vision.',
  aboutText:
    'Founded in Kolkata in 1971, People’s Little Theatre (PLT) grew from the progressive traditions of IPTA and the Little Theatre Group. Its collaborative, non-commercial practice helped shape the Group Theatre Movement and a new chapter in Indian theatre.',
  aboutImage: '/images/rehearsal.webp',
  heroSlides: [
    { id: 'hero-stage', image: '/images/hero-stage.webp', alt: 'Performers silhouetted behind a glowing theatre curtain' },
    { id: 'hero-production', image: '/images/production.webp', alt: 'A scene from a People’s Little Theatre production' },
    { id: 'hero-rehearsal', image: '/images/rehearsal.webp', alt: 'Theatre makers at work in rehearsal' },
  ],
  productions: historicProductions,
  shows: [
    {
      id: 'show-preview',
      title: 'An Evening at the Theatre',
      date: '2026-11-14',
      time: '18:30',
      venue: 'Venue details to be announced',
      price: 'Price on request',
      description:
        'A sample listing. Update this show with your confirmed date, venue, and ticket information.',
      image: '/images/stage.webp',
    },
  ],
  founders: [
    {
      id: 'founder-utpal-dutt',
      name: 'Utpal Dutt',
      role: 'Founder · actor, playwright & director',
      dates: '1929–1993',
      biography:
        'A central creative force in the company, Dutt wrote and directed work that brought social, economic and political questions to the stage. His plays formed a major part of PLT’s repertoire and helped define its ambitious political theatre.',
      image: '/images/founders/utpal-dutt.png',
    },
    {
      id: 'founder-sova-sen',
      name: 'Sova Sen',
      role: 'Founding member · actor',
      dates: '1923–2017',
      biography:
        'Sen was part of the founding circle that carried a collaborative, progressive theatre practice into PLT. Her work belonged to an ensemble committed to challenging plays and a broad, engaged public.',
      image: '/images/founders/sova-sen.png',
    },
    {
      id: 'founder-satya-bandyopadhyay',
      name: 'Satya Bandyopadhyay',
      role: 'Founding member · actor',
      dates: '1933–2006',
      biography:
        'Bandyopadhyay helped establish PLT’s founding ensemble. The company’s practice brought individual performance together with collective acting to make theatre that spoke directly to its time.',
      image: '/images/founders/satya-bandyopadhyay.png',
    },
    {
      id: 'founder-mrinal-ghosh',
      name: 'Mrinal Ghosh',
      role: 'Founding member',
      dates: '1939–2010',
      biography:
        'Ghosh was among the artists who built PLT around a shared vision. The group’s work combined new dramatic writing, ensemble practice and an engaged relationship with audiences.',
      image: '/images/founders/mrinal-ghosh.png',
    },
    {
      id: 'founder-asit-basu',
      name: 'Asit Basu',
      role: 'Founding member',
      dates: 'PLT founded 1971',
      biography:
        'Basu was part of the founding collective that carried forward progressive theatre traditions in a new company. PLT’s collaborative spirit and non-commercial practice were central to that undertaking.',
      image: '/images/founders/asit-basu.png',
    },
    {
      id: 'founder-samir-mazumdar',
      name: 'Samir Mazumdar',
      role: 'Founding member',
      dates: 'PLT founded 1971',
      biography:
        'Mazumdar joined the artists who established PLT in 1971. Their collective work helped create a lasting company and a repertoire reaching across local, national and international histories.',
      image: '/images/founders/samir-mazumdar.png',
    },
    {
      id: 'founder-chhanda-chatterjee',
      name: 'Chhanda Chatterjee',
      role: 'Founding member',
      dates: 'PLT founded 1971',
      biography:
        'Chatterjee was among the founding members who shaped PLT’s shared vision. The company they helped build made space for collaborative performance, experimentation and a wide-ranging public repertoire.',
      image: '/images/founders/chhanda-chatterjee.png',
    },
  ],
  plays: [],
  gallery: [
    {
      id: 'gallery-rehearsals',
      title: 'In the rehearsal room',
      images: ['/images/rehearsal.webp', '/images/production.webp'],
    },
  ],
  footer: {
    tagline: 'Stories made for the room we share.',
    exploreHeading: 'Explore',
    contactHeading: 'Find us',
    socialHeading: 'Follow',
    closingLine: 'Made for the live moment.',
    links: [
      { id: 'footer-about', label: 'About us', url: '/about' },
      { id: 'footer-productions', label: 'Productions', url: '/productions' },
      { id: 'footer-tickets', label: 'Tickets', url: '/tickets' },
      { id: 'footer-gallery', label: 'Gallery', url: '/gallery' },
    ],
  },
  contact: {
    email: 'hello@peopleslittletheatre.example',
    phone: '+1 202-555-0142',
    address: 'Kolkata, India (sample location)',
    whatsapp: '',
    instagram: 'https://example.com/plt-instagram',
    facebook: 'https://example.com/plt-facebook',
    youtube: 'https://example.com/plt-youtube',
  },
}

export function readContent(): TheatreContent {
  try {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return initialContent
    const parsed = JSON.parse(saved) as Partial<TheatreContent> & { contentVersion?: number }
    const savedContact = parsed.contact
    const savedProductions = parsed.productions ?? initialContent.productions
    const productions =
      (parsed.contentVersion ?? 0) < 3
        ? [
            ...historicProductions.filter(
              (production) => !savedProductions.some((savedProduction) => savedProduction.id === production.id),
            ),
            ...savedProductions.filter(
              (production) => !['prod-open-curtain', 'prod-after-light'].includes(production.id),
            ),
          ]
        : savedProductions
    return {
      ...initialContent,
      ...parsed,
      productions,
      founders:
        parsed.contentVersion !== 2 && (!parsed.founders || parsed.founders.length === 0)
          ? initialContent.founders
          : parsed.founders ?? initialContent.founders,
      contact: {
        ...initialContent.contact,
        ...savedContact,
        email: savedContact?.email || initialContent.contact.email,
        phone: savedContact?.phone || initialContent.contact.phone,
        address: savedContact?.address || initialContent.contact.address,
        instagram: savedContact?.instagram || initialContent.contact.instagram,
        facebook: savedContact?.facebook || initialContent.contact.facebook,
        youtube: savedContact?.youtube || initialContent.contact.youtube,
      },
    }
  } catch {
    return initialContent
  }
}

export function saveContent(content: TheatreContent) {
  localStorage.setItem(storageKey, JSON.stringify({ ...content, contentVersion: 3 }))
}
