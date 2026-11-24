import emailjs from '@emailjs/browser'
import { ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, LogOut, Mail, MapPin, Menu, Phone, Play, X } from 'lucide-react'
import { FaFacebookF, FaInstagram, FaYoutube } from 'react-icons/fa'
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { backendConfigured, getContent, loginAdmin, logoutAdmin, saveContent as persistContent, uploadImage, validateAdmin } from './api'
import { readContent, saveContent as cacheContent, type Founder, type GalleryGroup, type HeroSlide, type Play as PlayItem, type Production, type Show, type TheatreContent } from './content'
import './App.css'

const pages = [['About Us', '/about'], ['Productions', '/productions'], ['Tickets', '/tickets'], ['Founders', '/founders'], ['Plays', '/plays'], ['Gallery', '/gallery'], ['Contact', '/contact']]
const description = 'Peoples Little Theatre creates thoughtful, contemporary theatre through productions, performances, and community.'
function getLocalDate() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

function PageMeta({ title, text = description }: { title: string; text?: string }) {
  useEffect(() => {
    document.title = `${title} | Peoples Little Theatre`
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!tag) { tag = document.createElement('meta'); tag.name = 'description'; document.head.append(tag) }
    tag.content = text
  }, [title, text])
  return null
}

function Photo({ src, alt, className = '', loading = 'lazy' }: { src: string; alt: string; className?: string; loading?: 'lazy' | 'eager' }) {
  return <img src={src || '/images/theatre-placeholder.svg'} alt={alt} className={className} loading={loading} onError={(event) => {
    const image = event.currentTarget
    if (!image.src.endsWith('/theatre-placeholder.svg')) image.src = '/images/theatre-placeholder.svg'
  }} />
}

function Header() {
  const [open, setOpen] = useState(false)
  return <header className="site-header"><div className="header-inner">
    <Link to="/" className="brand" aria-label="Peoples Little Theatre home" onClick={() => setOpen(false)}><img src="/images/theatre-mark.svg" alt="" className="brand-mark" /><span className="brand-name">Peoples <span>Little Theatre</span></span></Link>
    <button className="mobile-menu-button" type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    <nav className={`main-nav flex items-center ${open ? 'main-nav-open' : ''}`} aria-label="Main navigation">{pages.map(([label, to]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>{label}</NavLink>)}<NavLink to="/tickets" className="nav-ticket" onClick={() => setOpen(false)}>Book a seat <ArrowUpRight size={14} /></NavLink></nav>
  </div></header>
}

function Footer({ data }: { data: TheatreContent }) {
  const [year] = useState(() => new Date().getFullYear())
  const { contact, footer } = data
  const socials = [
    { name: 'Instagram', url: contact.instagram, Icon: FaInstagram },
    { name: 'Facebook', url: contact.facebook, Icon: FaFacebookF },
    { name: 'YouTube', url: contact.youtube, Icon: FaYoutube },
  ]
  return <footer className="site-footer"><div className="footer-main">
    <div className="footer-about"><Link to="/" className="footer-brand"><img src="/images/theatre-mark.svg" alt="" />Peoples Little Theatre</Link><p>{footer.tagline}</p></div>
    <div className="footer-column"><span className="footer-label">{footer.exploreHeading}</span>{footer.links.map((item) => <Link key={item.id} to={item.url}>{item.label}</Link>)}</div>
    <div className="footer-column"><span className="footer-label">{footer.contactHeading}</span>{contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}{contact.phone && <a href={`tel:${contact.phone}`}>{contact.phone}</a>}{contact.address && <span>{contact.address}</span>}{!contact.email && !contact.phone && !contact.address && <Link to="/contact">Contact the theatre</Link>}</div>
    <div className="footer-column"><span className="footer-label">{footer.socialHeading}</span><div className="social-links">{socials.map(({ name, url, Icon }) => <a key={name} href={url || '/contact'} target={url ? '_blank' : undefined} rel={url ? 'noreferrer' : undefined} aria-label={name} title={name}><Icon size={17} /></a>)}</div><span className="sample-note">Sample links</span><Link to="/admin" className="admin-link">Admin</Link></div>
  </div><div className="footer-bottom"><span>© {year} Peoples Little Theatre</span><span>{footer.closingLine}</span></div></footer>
}

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) { return <span className={`eyebrow${light ? ' eyebrow-light' : ''}`}><i />{children}</span> }
function Intro({ tag, title, text }: { tag: string; title: string; text: string }) { return <div className="page-intro"><Eyebrow>{tag}</Eyebrow><h1>{title}</h1><p>{text}</p></div> }
function Empty({ title, text }: { title: string; text: string }) { return <div className="empty-state"><span>PLT <i>°</i></span><h2>{title}</h2><p>{text}</p></div> }

function Home({ data }: { data: TheatreContent }) {
  const featuredProductions = data.productions.slice(0, 3)
  const today = getLocalDate()
  const nextShow = [...data.shows].filter((show) => show.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0]
  const [activeSlide, setActiveSlide] = useState(0)
  const slides = data.heroSlides
  const visibleSlide = activeSlide % Math.max(1, slides.length)
  useEffect(() => {
    if (slides.length < 2) return
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), 6500)
    return () => window.clearInterval(timer)
  }, [slides.length])
  const galleryImages = data.gallery.flatMap((group) => group.images.map((image) => ({ image, title: group.title }))).slice(0, 4)
  const socialLinks = [
    { name: 'Instagram', url: data.contact.instagram, Icon: FaInstagram },
    { name: 'Facebook', url: data.contact.facebook, Icon: FaFacebookF },
    { name: 'YouTube', url: data.contact.youtube, Icon: FaYoutube },
  ]

  return <main><PageMeta title="Home" /><section className="home-hero">
    {slides.map((slide, index) => <Photo key={slide.id} src={slide.image} alt={slide.alt} className={`hero-image${visibleSlide === index ? ' hero-image-active' : ''}`} loading={index === 0 ? 'eager' : 'lazy'} />)}
    <div className="hero-shade" /><div className="hero-copy"><Eyebrow light>Independent theatre · Since the beginning</Eyebrow><h1>Every story<br /><em>needs a stage.</em></h1><p>Peoples Little Theatre brings people together through the rare, electric alchemy of live performance.</p><div className="hero-actions mt-8 flex flex-wrap items-center gap-6"><Link to="/productions" className="button button-gold">Explore productions <ArrowRight size={16} /></Link><Link to="/about" className="text-link text-link-light">Our story <ArrowDownRight size={16} /></Link></div></div>
    <div className="hero-caption"><span>The house is open</span><span>Stories belong to everyone</span></div>
    {slides.length > 1 && <div className="hero-controls"><button type="button" className="hero-arrow" aria-label="Previous hero image" onClick={() => setActiveSlide((visibleSlide + slides.length - 1) % slides.length)}><ChevronLeft size={17} /></button><div className="hero-pagination" aria-label="Choose hero image">{slides.map((slide, index) => <button key={slide.id} type="button" className={`hero-dot${visibleSlide === index ? ' hero-dot-active' : ''}`} aria-label={`Show image ${index + 1}`} aria-pressed={visibleSlide === index} onClick={() => setActiveSlide(index)}><span /></button>)}</div><button type="button" className="hero-arrow" aria-label="Next hero image" onClick={() => setActiveSlide((visibleSlide + 1) % slides.length)}><ChevronRight size={17} /></button></div>}
    <a className="hero-scroll" href="#now-showing"><i />Scroll to discover</a>
  </section>

    <section className="home-intro section-pad" id="now-showing"><div className="section-kicker"><span>01</span><i />The stage is yours</div><div className="intro-content"><h2>We make theatre<br />that <em>stays with you.</em></h2><div><p>From the first rehearsal to the final bow, we believe the best stories are the ones we experience together. Come as you are. Leave a little changed.</p><Link to="/about" className="text-link">Meet the theatre <ArrowUpRight size={15} /></Link></div></div></section>

    <section className="home-about-preview"><div className="home-about-image"><Photo src={data.aboutImage} alt="Theatre makers at work" /></div><div className="home-about-copy"><Eyebrow>02 / About us</Eyebrow><h2>{data.aboutHeading}</h2><p>{data.aboutText}</p><Link to="/about" className="text-link">The story behind the stage <ArrowUpRight size={15} /></Link></div></section>

    <section className="home-productions section-pad"><div className="home-section-heading"><div><Eyebrow>03 / From the archive</Eyebrow><h2>Landmark productions.</h2></div><Link to="/productions" className="text-link">All productions <ArrowUpRight size={15} /></Link></div>{featuredProductions.length ? <div className="home-production-grid">{featuredProductions.map((production, index) => <article className="home-production-card" key={production.id}><Link to="/productions" className="home-production-poster" aria-label={`Explore ${production.title}`}><Photo src={production.image} alt={`${production.title}, ${production.year} — PLT archive poster`} /><span>{production.year}</span></Link><div className="home-production-copy"><Eyebrow>PLT archive · {String(index + 1).padStart(2, '0')}</Eyebrow><h3>{production.title}</h3><p>{production.description}</p></div></article>)}</div> : <Empty title="A new story is taking shape." text="Our productions will be announced here." />}</section>

    <section className="home-ticket-preview"><div className="ticket-preview-copy"><Eyebrow>04 / Tickets</Eyebrow><h2>Your seat<br /><em>is waiting.</em></h2><p>{nextShow ? nextShow.title : 'Join us for the next live performance.'}</p><Link to="/tickets" className="button button-gold">{nextShow ? 'View show details' : 'See upcoming shows'} <ArrowRight size={15} /></Link></div><div className="ticket-preview-image"><Photo src={nextShow?.image || '/images/stage.webp'} alt={nextShow?.title || 'An empty theatre stage'} /><div className="ticket-preview-stamp"><CalendarDays size={17} /><span>{nextShow?.date || 'New dates soon'}</span></div></div><div className="ticket-preview-facts"><span><Clock3 size={15} />{nextShow?.time || 'Evening performances'}</span><span><MapPin size={15} />{nextShow?.venue || 'Details announced soon'}</span><strong>{nextShow?.price || 'Tickets coming soon'}</strong></div></section>

    <section className="home-founders section-pad"><div className="home-section-heading"><div><Eyebrow>05 / Founders</Eyebrow><h2>The people behind the curtain.</h2></div><Link to="/founders" className="text-link">Meet the founders <ArrowUpRight size={15} /></Link></div><div className="home-founder-grid">{(data.founders.length ? data.founders.slice(0, 3) : [{ id: 'founder-placeholder', name: 'A theatre starts with people.', role: 'Founders & makers', biography: 'Meet the people who imagined Peoples Little Theatre.', image: '/images/founder.webp' }]).map((founder) => <Link to="/founders" className="home-founder" key={founder.id}><Photo src={founder.image} alt={founder.name} /><span><small>{founder.role || 'Founder'}</small>{founder.name}<ArrowUpRight size={15} /></span></Link>)}</div></section>

    <section className="home-plays"><div className="home-section-heading section-pad"><div><Eyebrow>06 / Plays</Eyebrow><h2>Keep the play going.</h2></div><Link to="/plays" className="text-link">Watch the archive <ArrowUpRight size={15} /></Link></div><div className="home-play-grid">{(data.plays.length ? data.plays.slice(0, 2) : [{ id: 'play-placeholder', title: 'Performances, stories, and moments from our stage.', year: 'Video archive', duration: '', description: '', youtubeUrl: '' }]).map((play, index) => <Link to="/plays" className="home-play" key={play.id}><Photo src={index % 2 ? '/images/stage.webp' : '/images/production.webp'} alt="A scene from the theatre archive" /><span className="home-play-icon"><Play size={18} fill="currentColor" /></span><span className="home-play-caption"><small>{play.year || 'From the archive'}</small>{play.title}<ArrowUpRight size={15} /></span></Link>)}</div></section>

    <section className="home-gallery section-pad"><div className="home-section-heading"><div><Eyebrow>07 / Gallery</Eyebrow><h2>Life between the lines.</h2></div><Link to="/gallery" className="text-link">Open the gallery <ArrowUpRight size={15} /></Link></div><div className="home-gallery-grid">{(galleryImages.length ? galleryImages : [{ image: '/images/rehearsal.webp', title: 'In the rehearsal room' }, { image: '/images/production.webp', title: 'On stage' }]).map((item, index) => <Link to="/gallery" className="home-gallery-image" key={`${item.image}-${index}`}><Photo src={item.image} alt={item.title} /><span>{item.title} <ArrowUpRight size={14} /></span></Link>)}</div></section>

    <section className="home-quote"><span className="quote-mark">“</span><p>Theatre is the meeting place<br />between who we are and who<br />we might become.</p><span className="quote-rule" /></section>

    <section className="home-contact"><div className="home-contact-copy"><Eyebrow>08 / Contact</Eyebrow><h2>Come say<br /><em>hello.</em></h2><p>Questions, collaborations, or a simple love of theatre? We would be glad to hear from you.</p><Link to="/contact" className="button button-gold">Get in touch <ArrowRight size={15} /></Link></div><div className="home-contact-details"><a href={`mailto:${data.contact.email}`}><Mail size={18} /><span><small>Email (sample)</small>{data.contact.email}</span><ArrowUpRight size={14} /></a><a href={`tel:${data.contact.phone}`}><Phone size={18} /><span><small>Phone (sample)</small>{data.contact.phone}</span><ArrowUpRight size={14} /></a><div className="home-social"><span>Follow the theatre</span><div className="social-links">{socialLinks.map(({ name, url, Icon }) => <a key={name} href={url || '/contact'} target={url ? '_blank' : undefined} rel={url ? 'noreferrer' : undefined} aria-label={name} title={name}><Icon size={18} /></a>)}</div></div><small className="sample-note">Sample contact details and social links. Replace them in Admin → Contact.</small></div></section>
  </main>
}

function About({ data }: { data: TheatreContent }) {
  return <main className="page-shell"><PageMeta title="About Us" text="The history of People’s Little Theatre, founded in Kolkata in 1971 and shaped by the progressive Group Theatre Movement." /><Intro tag="A brief history · Kolkata · 1971" title="Theatre with a people’s purpose." text="A pioneering company in the making of modern Indian theatre, built on collaboration, experimentation and a belief in the power of the stage." /><section className="about-layout"><div className="about-photo"><Photo src={data.aboutImage} alt="Theatre makers at work" /><span className="image-index">PEOPLES LITTLE THEATRE</span></div><div className="about-copy"><Eyebrow>Our point of view</Eyebrow><h2>{data.aboutHeading}</h2><p>{data.aboutText}</p><Link to="/founders" className="text-link">Meet the founding members <ArrowUpRight size={15} /></Link></div></section><section className="history-sections"><article><Eyebrow>01 · The beginnings</Eyebrow><h2>From IPTA and LTG to PLT</h2><p>People’s Little Theatre was founded in Kolkata in 1971 by a collective that included Utpal Dutt, Sova Sen, Satya Bandyopadhyay, Mrinal Ghosh, Asit Basu, Samir Mazumdar, Chhanda Chatterjee and others. PLT continued the progressive traditions of the Indian People’s Theatre Association (IPTA) and the Little Theatre Group (LTG), helping to shape what became known as the Group Theatre Movement.</p></article><article><Eyebrow>02 · A stage for debate</Eyebrow><h2>A repertoire that faced its time</h2><p>LTG’s Minerva Theatre years made the stage a place for public debate. Angar (1959), Ferrari Fauj (1961) and Kallol (1965) drew audiences while challenging the elitism of the new Indian state. Manusher Adhikare (1968) addressed civil rights in the United States; Invincible Vietnam (1966) turned to the post-war world. PLT carried this breadth forward, exploring contemporary questions, anti-colonial movements and local, national and international histories.</p></article><article><Eyebrow>03 · The work on stage</Eyebrow><h2>Making a whole theatrical world</h2><p>PLT’s landmark early productions included Tiner Talawar (1971), Barricade (1972) and Duswapner Nagari (1974). Its performances brought stellar individual work together with ensemble acting, scenography, light and sound. Working without a permanent auditorium, the company adapted hired spaces into vivid stage worlds through levels, rostra, screens and revolving forms, developed with collaborators including Tapas Sen, Suresh Dutta and Monu Datta.</p></article><article><Eyebrow>04 · A living legacy</Eyebrow><h2>Beyond the city and across borders</h2><p>PLT’s contribution includes new dramatic writing for post-colonial India, non-commercial amateur organisation, actor training and ambitious scenographic design. The company has performed across the Bengal countryside and inspired theatre groups in suburban and other towns. Its festival appearances have included the German Democratic Republic (1985), the India Festival in the USSR (1988) and Bangladesh (1998).</p></article></section><section className="values-row"><article><span>01</span><h3>Collaborative</h3><p>A shared artistic vision carried forward by an ensemble.</p></article><article><span>02</span><h3>Progressive</h3><p>Theatre that engages with the social and political questions of its time.</p></article><article><span>03</span><h3>Experimental</h3><p>New forms, stagecraft and dramatic worlds made for live audiences.</p></article></section></main>
}

function Productions({ data }: { data: TheatreContent }) {
  return <main className="page-shell"><PageMeta title="Productions" /><Intro tag="On stage & in the archive" title="Our productions." text="From landmark productions to new work, explore People’s Little Theatre’s stage history." /><section className="production-grid">{data.productions.map((item, i) => <article className="production-card" key={item.id}><Link to="/tickets" className="production-image-link" aria-label={`View tickets for ${item.title}`}><Photo src={item.image} alt={`${item.title}, ${item.year} — PLT archive poster`} className="production-image" /><span className="card-count">{String(i + 1).padStart(2, '0')}</span><span className="image-arrow"><ArrowUpRight size={18} /></span></Link><div className="production-meta"><span>{item.year}</span><span>Peoples Little Theatre</span></div><h2>{item.title}</h2><p>{item.description}</p></article>)}</section>{!data.productions.length && <Empty title="A new story is taking shape." text="Check back soon for our next production." />}<section className="production-cta"><Eyebrow>The next chapter</Eyebrow><h2>Meet us in the room.</h2><Link to="/tickets" className="button button-gold">Find a performance <ArrowRight size={16} /></Link></section></main>
}

function Reserve({ show, phone }: { show: Show; phone: string }) {
  const [message, setMessage] = useState('')
  const today = getLocalDate()
  function reserve() {
    const number = phone.replace(/\D/g, '')
    if (!number) { setMessage('WhatsApp booking is not configured yet. Please contact the theatre directly.'); return }
    const text = `Hello, I would like to book tickets for ${show.title} on ${show.date} at ${show.time}.`
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
    setMessage('WhatsApp booking opened in a new tab.')
  }
  return <div className="booking-action">{show.date >= today ? <><button type="button" className="button button-gold" onClick={reserve}>Book now <ArrowUpRight size={15} /></button>{message && <p className="form-message" role="status">{message}</p>}</> : <span className="show-past">Booking closed</span>}</div>
}

function Tickets({ data }: { data: TheatreContent }) {
  return <main className="page-shell"><PageMeta title="Tickets" /><Intro tag="Join us in the room" title="Your seat is waiting." text="Choose a performance and get in touch to reserve your place." /><section className="ticket-list">{data.shows.map((show, i) => <article className="ticket-card" key={show.id}><Photo src={show.image} alt={show.title} className="ticket-image" /><span className="ticket-number">{String(i + 1).padStart(2, '0')}</span><div className="ticket-info"><Eyebrow>Performance</Eyebrow><h2>{show.title}</h2><p>{show.description}</p><div className="ticket-facts"><span><CalendarDays size={15} />{show.date}</span><span><Clock3 size={15} />{show.time}</span><span><MapPin size={15} />{show.venue}</span></div></div><div className="ticket-buy"><span className="ticket-price">{show.price}</span><Reserve show={show} phone={data.contact.whatsapp} /></div></article>)}</section>{!data.shows.length && <Empty title="No performances are listed just yet." text="New dates will appear here as soon as they are announced." />}<p className="ticket-note">For access requirements or group bookings, <Link to="/contact">contact the theatre</Link>.</p></main>
}

function Founders({ data }: { data: TheatreContent }) {
  return <main className="page-shell"><PageMeta title="Founders" text="Meet the founding members of People’s Little Theatre and learn about the progressive theatre traditions they carried forward." /><Intro tag="The founding collective · 1971" title="A theatre is its people." text="PLT was founded not as the vision of one person, but as a collective endeavour rooted in progressive theatre and shared artistic purpose." /><section className="founders-history"><Eyebrow>Before PLT · The Little Theatre Group</Eyebrow><h2>A legacy of theatre as public life</h2><p>The Little Theatre Group (LTG) dissolved in 1969 and surrendered its lease of Minerva Theatre. In the years before, its productions helped establish a bold political theatre in India: Angar (1959), Ferrari Fauj (1961) and Kallol (1965) played to full houses and opened space for debate about power and inequality in the new nation. LTG also looked beyond India, with Manusher Adhikare (1968) engaging with civil rights in the United States and Invincible Vietnam (1966) responding to the post-war world.</p><p>When PLT was founded in 1971, its members carried this progressive inheritance into a new company. Their collaborative, non-commercial practice made room for a repertoire spanning urgent contemporary issues, anti-colonial movements and histories close to home and far beyond it.</p><p>Without a permanent auditorium, the company hired spaces and transformed them through acting, lighting, sets and scenography. Working with collaborators including Tapas Sen, Suresh Dutta and Monu Datta, PLT made the stage itself part of the storytelling. That collective spirit remains central to the company’s history.</p></section><div className="founders-list-heading"><Eyebrow>Founding members</Eyebrow><p>Life dates appear where confirmed; otherwise, the card notes PLT’s founding year, 1971.</p></div><section className="founder-grid">{data.founders.map((founder, i) => <article className="founder-card" key={founder.id}><div className="founder-image-wrap"><Photo src={founder.image} alt={`Typographic nameplate for ${founder.name}`} className="founder-image" /><span>{String(i + 1).padStart(2, '0')}</span></div><Eyebrow>{founder.role}</Eyebrow><h2>{founder.name}</h2>{founder.dates && <p className="founder-dates">{founder.dates}</p>}<p>{founder.biography}</p></article>)}</section>{!data.founders.length && <Empty title="The people behind the theatre." text="Founder profiles will be shared here soon." />}</main>
}

function getYoutubeId(value: string) {
  try {
    const url = new URL(value)
    const id = url.hostname === 'youtu.be'
      ? url.pathname.slice(1)
      : ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(url.hostname)
        ? url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).at(-1) || ''
        : ''
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : ''
  } catch { return '' }
}

function Plays({ data }: { data: TheatreContent }) {
  return <main className="page-shell"><PageMeta title="Plays" /><Intro tag="Watch & read" title="The play goes on." text="Watch recorded performances and read stories from People’s Little Theatre’s stage history." /><section className="plays-grid">{data.plays.map((play) => { const video = getYoutubeId(play.youtubeUrl); return <article className="play-card" key={play.id}>{video && <div className="video-frame"><iframe src={`https://www.youtube-nocookie.com/embed/${video}`} title={play.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>}<div className="play-details"><div className="play-meta"><span>{play.year}</span>{play.duration && <span>{play.duration}</span>}</div><h2>{play.title}</h2><p>{play.description}</p>{play.blog && <div className="play-blog">{play.blog}</div>}</div></article>})}</section>{!data.plays.length && <Empty title="The archive is waiting for its first story." text="Recorded performances and stories about past productions will appear here." />}</main>
}

function Gallery({ data }: { data: TheatreContent }) {
  const [active, setActive] = useState('')
  return <main className="page-shell"><PageMeta title="Gallery" /><Intro tag="A life in the wings" title="Moments between the lines." text="From first read-through to final bow, a little of what happens when we make theatre together." /><section className="gallery-groups">{data.gallery.map((group) => <div className="gallery-group" key={group.id}><div className="gallery-group-heading"><Eyebrow>The album</Eyebrow><h2>{group.title}</h2></div><div className="gallery-grid">{group.images.map((image, i) => <button type="button" className={`gallery-image gallery-image-${i % 3}`} key={`${image}-${i}`} onClick={() => setActive(image)} aria-label={`View image ${i + 1} from ${group.title}`}><Photo src={image} alt={`${group.title}, image ${i + 1}`} /><span><ArrowUpRight size={16} /></span></button>)}</div></div>)}</section>{!data.gallery.length && <Empty title="The gallery lights are coming up." text="Photographs from shows and rehearsals will be collected here." />}{active && <div className="lightbox" role="dialog" aria-modal="true" aria-label="Gallery image" onClick={() => setActive('')}><button className="lightbox-close" type="button" aria-label="Close image"><X /></button><Photo src={active} alt="Selected theatre gallery image" className="lightbox-image" /></div>}</main>
}

function Contact({ data }: { data: TheatreContent }) {
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [sending, setSending] = useState(false)
  const socialLinks = [
    { name: 'Instagram', url: data.contact.instagram, Icon: FaInstagram },
    { name: 'Facebook', url: data.contact.facebook, Icon: FaFacebookF },
    { name: 'YouTube', url: data.contact.youtube, Icon: FaYoutube },
  ]

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    const { VITE_EMAILJS_SERVICE_ID: service, VITE_EMAILJS_TEMPLATE_ID: template, VITE_EMAILJS_PUBLIC_KEY: key } = import.meta.env
    if (!service || !template || !key) {
      setNotice({ type: 'error', text: 'Email is not configured yet. Please contact us by phone or email instead.' })
      return
    }
    const form = event.currentTarget
    const values = new FormData(form)
    setSending(true)
    try {
      await emailjs.send(service, template, {
        from_name: values.get('name'),
        reply_to: values.get('email'),
        subject: values.get('subject'),
        message: values.get('message'),
      }, { publicKey: key })
      form.reset()
      setNotice({ type: 'success', text: 'Your message has been sent. Thank you for reaching out.' })
    } catch {
      setNotice({ type: 'error', text: 'Your message could not be sent. Please try again or contact us directly.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="page-shell">
      <PageMeta title="Contact Us" />
      <Intro tag="The conversation starts here" title="Come say hello." text="Questions about a performance, a collaboration, or just want to talk theatre? We would love to hear from you." />
      <section className="contact-layout">
        <div className="contact-details">
          <Eyebrow>Find the theatre</Eyebrow>
          <h2>Let's make<br /><em>something happen.</em></h2>
          {data.contact.email && <a className="contact-item" href={`mailto:${data.contact.email}`}><Mail /><span><small>Email</small>{data.contact.email}</span><ArrowUpRight size={15} /></a>}
          {data.contact.phone && <a className="contact-item" href={`tel:${data.contact.phone}`}><Phone /><span><small>Phone</small>{data.contact.phone}</span><ArrowUpRight size={15} /></a>}
          {data.contact.address && <div className="contact-item"><MapPin /><span><small>Location</small>{data.contact.address}</span></div>}
          <div className="social-links contact-socials">
            {socialLinks.map(({ name, url, Icon }) => <a key={name} href={url || '/contact'} target={url ? '_blank' : undefined} rel={url ? 'noreferrer' : undefined} aria-label={name} title={name}><Icon size={18} /></a>)}
          </div>
          <p className="sample-note">Edit contact details and social links in Admin → Contact.</p>
        </div>
        <form className="contact-form" onSubmit={submit}>
          <div className="form-heading"><Eyebrow>Send a note</Eyebrow><span>We usually reply within a few days.</span></div>
          <label>Your name<input name="name" required autoComplete="name" /></label>
          <label>Email address<input name="email" type="email" required autoComplete="email" /></label>
          <label>Subject<input name="subject" required /></label>
          <label>Your message<textarea name="message" rows={5} required /></label>
          <button type="submit" className="button button-gold" disabled={sending}>{sending ? 'Sending…' : 'Send message'} <ArrowRight size={15} /></button>
          {notice && <p className={`form-message ${notice.type}`} role="status">{notice.text}</p>}
        </form>
      </section>
    </main>
  )
}

function NotFound() { return <main className="not-found"><PageMeta title="Page not found" text="The page you are looking for could not be found." /><Eyebrow>The house is still open</Eyebrow><div className="not-found-number">404</div><h1>This scene isn't in the script.</h1><p>The page may have moved, or the link may have missed its cue.</p><Link to="/" className="button button-gold">Return to the home page <ArrowRight size={15} /></Link></main> }

function Field({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) { return <label className="admin-field">{label}<input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label> }
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="admin-field">{label}<textarea value={value} rows={4} onChange={(event) => onChange(event.target.value)} /></label> }

function ImageUpload({ onImage, notify }: { onImage: (image: string) => void; notify: (text: string, error?: boolean) => void }) {
  async function upload(file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) { notify('Choose an image file.', true); return }
    try {
      const bitmap = await createImageBitmap(file); const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale)
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close()
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Image compression failed.')), 'image/webp', 0.8))
      const token = window.localStorage.getItem('plt-admin-session')
      if (!token) throw new Error('Sign in again before uploading images.')
      const result = await uploadImage(new File([blob], 'theatre-image.webp', { type: 'image/webp' }), token)
      onImage(result.url)
      notify('Image uploaded to Supabase Storage.')
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Image upload failed.', true)
    }
  }
  return <label className="image-upload">Upload image to Supabase<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { void upload(event.target.files?.[0]); event.currentTarget.value = '' }} /></label>
}

type AdminTab = 'About' | 'Hero slider' | 'Productions' | 'Tickets' | 'Founders' | 'Plays' | 'Gallery' | 'Footer' | 'Contact'
function Admin({ data, setData }: { data: TheatreContent; setData: (data: TheatreContent) => void }) {
  const [tab, setTab] = useState<AdminTab>('About'); const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null)
  const notify = (text: string, error = false) => setNotice({ text, error })
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(backendConfigured)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveRetry, setSaveRetry] = useState(0)
  const lastSavedContent = useRef(JSON.stringify(data))
  const latestContentRef = useRef(data)
  const saveQueue = useRef(Promise.resolve())
  useEffect(() => { latestContentRef.current = data }, [data])
  useEffect(() => {
    if (!backendConfigured) {
      setAuthLoading(false)
      return
    }
    let active = true
    const savedToken = window.localStorage.getItem('plt-admin-session')
    if (!savedToken) {
      setAuthLoading(false)
      return
    }
    void validateAdmin(savedToken).then(async () => {
      if (!active) return
      const latestContent = await getContent()
      lastSavedContent.current = JSON.stringify(latestContent)
      latestContentRef.current = latestContent
      setData(latestContent)
      setAccessToken(savedToken)
    }).catch((error: unknown) => {
      if (active) setLoginError(error instanceof Error ? error.message : 'Could not verify the admin session.')
      window.localStorage.removeItem('plt-admin-session')
    }).finally(() => { if (active) setAuthLoading(false) })
    return () => { active = false }
  }, [setData])
  useEffect(() => {
    if (!accessToken) return
    const snapshot = JSON.stringify(data)
    if (snapshot === lastSavedContent.current) return
    let active = true
    const timer = window.setTimeout(() => {
      setSaving(true)
      setSaveError('')
      const task = saveQueue.current.catch(() => undefined).then(async () => {
        await persistContent(data, accessToken)
        lastSavedContent.current = snapshot
        try { cacheContent(data) } catch (error) { console.warn('The website update was published, but the browser cache could not be refreshed:', error) }
        if (active) setSaving(false)
      })
      saveQueue.current = task.catch((error: unknown) => {
        if (active) {
          setSaving(false)
          setSaveError(error instanceof Error ? error.message : 'Could not save your changes.')
        }
      })
    }, 700)
    return () => { active = false; window.clearTimeout(timer) }
  }, [accessToken, data, saveRetry])
  useEffect(() => {
    if (!accessToken) return
    return () => {
      const content = latestContentRef.current
      if (JSON.stringify(content) === lastSavedContent.current) return
      void saveQueue.current.catch(() => undefined).then(() => persistContent(content, accessToken)).catch((error: unknown) => {
        console.error('Could not finish saving admin changes before leaving the editor:', error)
      })
    }
  }, [accessToken])
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoginError('')
    if (!backendConfigured) { setLoginError('The website backend is not configured.'); return }
    setAuthLoading(true)
    try {
      const { token } = await loginAdmin(email, password)
      const latestContent = await getContent()
      lastSavedContent.current = JSON.stringify(latestContent)
      latestContentRef.current = latestContent
      setData(latestContent)
      await validateAdmin(token)
      window.localStorage.setItem('plt-admin-session', token)
      setAccessToken(token)
      setPassword('')
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Sign in failed.')
    } finally {
      setAuthLoading(false)
    }
  }
  async function signOut() {
    if (accessToken) {
      await logoutAdmin(accessToken).catch(() => undefined)
    }
    window.localStorage.removeItem('plt-admin-session')
    setAccessToken(null)
  }
  const update = (patch: Partial<TheatreContent>) => {
    const updated = { ...data, ...patch }
    latestContentRef.current = updated
    setData(updated)
    notify('Changes queued for publishing.')
  }
  const updateContact = (key: keyof TheatreContent['contact'], value: string) => update({ contact: { ...data.contact, [key]: value } })
  const remove = (key: 'productions' | 'shows' | 'founders' | 'plays' | 'gallery' | 'heroSlides', id: string) => {
    if (key === 'heroSlides' && data.heroSlides.length <= 1) { notify('Keep at least one hero image on the home page.', true); return }
    update({ [key]: data[key].filter((item) => item.id !== id) } as Partial<TheatreContent>)
    notify('Entry removed.')
  }
  const add = (key: 'productions' | 'shows' | 'founders' | 'plays' | 'gallery' | 'heroSlides', item: Production | Show | Founder | PlayItem | GalleryGroup | HeroSlide) => {
    if (key === 'shows') {
      const show = item as Show
      if (!/^\d{4}-\d{2}-\d{2}$/.test(show.date) || !show.time || !show.venue.trim() || !show.price.trim()) {
        notify('Add a valid show date, time, venue, and ticket price.', true)
        return
      }
    }
    update({ [key]: [...data[key], item] } as Partial<TheatreContent>)
    notify('Entry added.')
  }
  const patchItem = <T extends { id: string }>(key: 'productions' | 'shows' | 'founders' | 'plays' | 'gallery' | 'heroSlides', id: string, patch: Partial<T>) => {
    const list = data[key] as unknown as T[]; update({ [key]: list.map((item) => item.id === id ? { ...item, ...patch } : item) } as Partial<TheatreContent>)
  }
  const moveProduction = (index: number, by: number) => { const list = [...data.productions]; const target = index + by; if (target < 0 || target >= list.length) return; [list[index], list[target]] = [list[target], list[index]]; update({ productions: list }); notify('Production order updated.') }
  const moveFounder = (index: number, by: number) => { const list = [...data.founders]; const target = index + by; if (target < 0 || target >= list.length) return; [list[index], list[target]] = [list[target], list[index]]; update({ founders: list }); notify('Founder order updated.') }
  const moveHeroSlide = (index: number, by: number) => { const list = [...data.heroSlides]; const target = index + by; if (target < 0 || target >= list.length) return; [list[index], list[target]] = [list[target], list[index]]; update({ heroSlides: list }); notify('Hero image order updated.') }
  const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const [productionDraft, setProduction] = useState({ title: '', description: '', image: '/images/production.webp', year: '' })
  const [productionPosition, setProductionPosition] = useState(0)
  const [showDraft, setShow] = useState({ title: '', date: '', time: '', venue: '', price: '', description: '', image: '/images/stage.webp' })
  const [founderDraft, setFounder] = useState({ name: '', role: '', biography: '', image: '/images/founder.webp' })
  const [playDraft, setPlay] = useState({ title: '', year: '', duration: '', description: '', youtubeUrl: '' })
  const [blogDraft, setBlog] = useState({ title: '', year: '', description: '', blog: '', youtubeUrl: '' })
  const [galleryDraft, setGallery] = useState({ title: '', images: '' })
  const [heroDraft, setHero] = useState({ image: '', alt: '' })
  const [footerLinkDraft, setFooterLink] = useState({ label: '', url: '' })

  if (!accessToken) return <main className="page-shell admin-page"><PageMeta title="Admin sign in" text="Secure admin access for Peoples Little Theatre." /><div className="admin-heading"><Eyebrow>Site administration</Eyebrow><h1>Sign in to manage the theatre.</h1><p>Admin access is restricted to the configured project credentials.</p></div>{!backendConfigured && <div className="admin-warning"><span>!</span><p><strong>Backend setup required.</strong> Set the Supabase URL and anon key and the deployed Render API URL in the frontend environment before signing in.</p></div>}{authLoading ? <p className="admin-notice" role="status">Connecting to the API and checking your admin session. A sleeping Render free instance can take around 50 seconds to wake.</p> : <form className="contact-form admin-login" onSubmit={(event) => { void signIn(event) }}><Field label="Admin email" type="email" value={email} onChange={setEmail} /><Field label="Password" type="password" value={password} onChange={setPassword} /><button type="submit" className="button button-gold" disabled={!backendConfigured}>Sign in <ArrowRight size={15} /></button>{loginError && <p className="form-message error" role="alert">{loginError}</p>}<p className="sample-note">The admin credentials are coded in the project API. Public registration is not enabled. The first sign-in after the API sleeps may take up to 75 seconds.</p></form>}</main>

  return <main className="page-shell admin-page"><PageMeta title="Admin" text="Manage Peoples Little Theatre website content." /><div className="admin-heading"><Eyebrow>Site editor</Eyebrow><h1>Good evening, theatre-maker.</h1><p>Edit content, upload imagery, and publish updates to the shared website.</p></div>
    <div className="admin-session-row"><span className={saveError ? 'admin-sync-status admin-sync-error' : 'admin-sync-status'} role="status">{saveError ? `Save failed: ${saveError}` : saving ? 'Saving changes to Supabase…' : 'Connected to the shared content database.'}</span>{saveError && <button type="button" className="admin-signout" onClick={() => setSaveRetry((current) => current + 1)}>Retry save</button>}<button type="button" className="admin-signout" onClick={() => { void signOut() }}>Sign out <LogOut size={14} /></button></div>
    <div className="admin-tabs" role="tablist" aria-label="Edit website sections">{(['About', 'Hero slider', 'Productions', 'Tickets', 'Founders', 'Plays', 'Gallery', 'Footer', 'Contact'] as AdminTab[]).map((name) => <button type="button" role="tab" aria-selected={tab === name} className={tab === name ? 'admin-tab active' : 'admin-tab'} onClick={() => { setTab(name); setNotice(null) }} key={name}>{name}</button>)}</div>
    {notice && <p className={`admin-notice${notice.error ? ' admin-notice-error' : ''}`} role="status">{notice.text}</p>}
    {tab === 'Footer' && <section className="admin-panel"><div className="admin-section-heading"><h2>Footer content</h2><p>Update the footer tagline, navigation labels, contact heading, social heading, and closing line.</p></div><Field label="Tagline" value={data.footer.tagline} onChange={(tagline) => update({ footer: { ...data.footer, tagline } })} /><Field label="Explore heading" value={data.footer.exploreHeading} onChange={(exploreHeading) => update({ footer: { ...data.footer, exploreHeading } })} /><Field label="Contact heading" value={data.footer.contactHeading} onChange={(contactHeading) => update({ footer: { ...data.footer, contactHeading } })} /><Field label="Social links heading" value={data.footer.socialHeading} onChange={(socialHeading) => update({ footer: { ...data.footer, socialHeading } })} /><Field label="Closing line" value={data.footer.closingLine} onChange={(closingLine) => update({ footer: { ...data.footer, closingLine } })} /></section>}
    {tab === 'Footer' && <section className="admin-panel"><div className="admin-section-heading"><h2>Footer navigation links</h2><p>Manage the links shown in the footer. Use internal routes such as /gallery or full external URLs.</p></div><div className="admin-add-form"><div className="admin-fields"><Field label="Link label" value={footerLinkDraft.label} onChange={(label) => setFooterLink({ ...footerLinkDraft, label })} /><Field label="Link URL" value={footerLinkDraft.url} onChange={(url) => setFooterLink({ ...footerLinkDraft, url })} /></div><button type="button" className="button button-gold" onClick={() => { if (!footerLinkDraft.label.trim() || !footerLinkDraft.url.trim()) return notify('Add a link label and URL first.', true); update({ footer: { ...data.footer, links: [...data.footer.links, { ...footerLinkDraft, id: id() }] } }); setFooterLink({ label: '', url: '' }) }}>Add footer link <ArrowRight size={15} /></button></div><div className="admin-entry-list">{data.footer.links.map((item) => <div className="admin-order-row" key={item.id}><Field label="Label" value={item.label} onChange={(label) => update({ footer: { ...data.footer, links: data.footer.links.map((link) => link.id === item.id ? { ...link, label } : link) } })} /><Field label="URL" value={item.url} onChange={(url) => update({ footer: { ...data.footer, links: data.footer.links.map((link) => link.id === item.id ? { ...link, url } : link) } })} /><button type="button" className="button button-danger" onClick={() => update({ footer: { ...data.footer, links: data.footer.links.filter((link) => link.id !== item.id) } })}>Remove link</button></div>)}</div></section>}
    {tab === 'Founders' && <section className="admin-panel"><div className="admin-section-heading"><h2>Founder display order</h2><p>Use the arrows to change the order shown on the Founders page and home page.</p></div><div className="admin-entry-list">{data.founders.map((founder, index) => <div className="admin-order-row" key={founder.id}><span className="sequence-controls"><button type="button" aria-label={`Move ${founder.name} up`} disabled={index === 0} onClick={() => moveFounder(index, -1)}>↑</button><button type="button" aria-label={`Move ${founder.name} down`} disabled={index === data.founders.length - 1} onClick={() => moveFounder(index, 1)}>↓</button></span><span>{String(index + 1).padStart(2, '0')} · {founder.name}</span></div>)}</div></section>}
    {tab === 'Plays' && <section className="admin-panel"><div className="admin-section-heading"><h2>Play stories & blog posts</h2><p>Publish a write-up about a previous production. Add a YouTube URL if the post should also include a video.</p></div><div className="admin-add-form"><h3>Write a play story</h3><div className="admin-fields"><Field label="Title" value={blogDraft.title} onChange={(title) => setBlog({ ...blogDraft, title })} /><Field label="Year" value={blogDraft.year} onChange={(year) => setBlog({ ...blogDraft, year })} /><Field label="Optional YouTube URL" value={blogDraft.youtubeUrl} onChange={(youtubeUrl) => setBlog({ ...blogDraft, youtubeUrl })} placeholder="https://youtu.be/..." /><TextField label="Short introduction" value={blogDraft.description} onChange={(description) => setBlog({ ...blogDraft, description })} /><TextField label="Story / blog article" value={blogDraft.blog} onChange={(blog) => setBlog({ ...blogDraft, blog })} /></div><button type="button" className="button button-gold" onClick={() => { if (!blogDraft.title.trim() || !blogDraft.blog.trim()) return notify('Add a title and story before publishing.', true); add('plays', { ...blogDraft, duration: '', id: id() }); setBlog({ title: '', year: '', description: '', blog: '', youtubeUrl: '' }) }}>Publish play story <ArrowRight size={15} /></button></div><div className="admin-entry-list">{data.plays.map((play) => <details className="admin-entry" key={`blog-${play.id}`}><summary>{play.title} · story</summary><TextField label="Story / blog article" value={play.blog ?? ''} onChange={(blog) => patchItem<PlayItem>('plays', play.id, { blog })} /><button type="button" className="button button-danger" onClick={() => remove('plays', play.id)}>Remove story</button></details>)}</div></section>}
    <section className="admin-panel">
      {tab === 'About' && <><div className="admin-section-heading"><h2>About the theatre</h2><p>Shape the introduction visitors see across the site.</p></div><Field label="Heading" value={data.aboutHeading} onChange={(value) => update({ aboutHeading: value })} /><TextField label="About text" value={data.aboutText} onChange={(value) => update({ aboutText: value })} /><div className="admin-image-field"><Field label="Image path in public/ or image URL" value={data.aboutImage} onChange={(value) => update({ aboutImage: value })} /><ImageUpload notify={notify} onImage={(image) => update({ aboutImage: image })} /></div></>}
      {tab === 'Hero slider' && <><div className="admin-section-heading"><h2>Hero slider images</h2><p>Upload images to Supabase Storage, edit their accessible descriptions, and change their display order.</p></div><div className="admin-add-form"><h3>Add a slide</h3><div className="admin-fields"><Field label="Image URL" value={heroDraft.image} onChange={(image) => setHero({ ...heroDraft, image })} /><Field label="Image description" value={heroDraft.alt} onChange={(alt) => setHero({ ...heroDraft, alt })} /><ImageUpload notify={notify} onImage={(image) => setHero({ ...heroDraft, image })} /></div><button type="button" className="button button-gold" onClick={() => { if (!heroDraft.image.trim()) return notify('Upload an image or enter an image URL first.', true); add('heroSlides', { ...heroDraft, id: id() }); setHero({ image: '', alt: '' }) }}>Add hero image <ArrowRight size={15} /></button></div><div className="admin-entry-list">{data.heroSlides.map((slide, index) => <details className="admin-entry" key={slide.id}><summary><span className="sequence-controls"><button type="button" aria-label="Move hero image up" disabled={index === 0} onClick={(event) => { event.preventDefault(); moveHeroSlide(index, -1) }}>↑</button><button type="button" aria-label="Move hero image down" disabled={index === data.heroSlides.length - 1} onClick={(event) => { event.preventDefault(); moveHeroSlide(index, 1) }}>↓</button></span><span>{String(index + 1).padStart(2, '0')} · {slide.alt || 'Hero image'}</span></summary><Field label="Image URL" value={slide.image} onChange={(image) => patchItem<HeroSlide>('heroSlides', slide.id, { image })} /><Field label="Image description" value={slide.alt} onChange={(alt) => patchItem<HeroSlide>('heroSlides', slide.id, { alt })} /><ImageUpload notify={notify} onImage={(image) => patchItem<HeroSlide>('heroSlides', slide.id, { image })} /><button type="button" className="button button-danger" onClick={() => remove('heroSlides', slide.id)}>Remove slide</button></details>)}</div></>}
      {tab === 'Productions' && <><div className="admin-section-heading"><h2>Productions</h2><p>Choose an insertion position or use the arrows to change the display sequence.</p></div><div className="admin-add-form"><h3>Add a production</h3><div className="admin-fields"><Field label="Heading" value={productionDraft.title} onChange={(title) => setProduction({ ...productionDraft, title })} /><Field label="Year / status" value={productionDraft.year} onChange={(year) => setProduction({ ...productionDraft, year })} /><label className="admin-field">Display position<select value={productionPosition} onChange={(event) => setProductionPosition(Number(event.target.value))}>{Array.from({ length: data.productions.length + 1 }, (_, index) => <option value={index} key={index}>{index + 1}</option>)}</select></label><TextField label="Description" value={productionDraft.description} onChange={(description) => setProduction({ ...productionDraft, description })} /><div className="admin-image-field"><Field label="Thumbnail path" value={productionDraft.image} onChange={(image) => setProduction({ ...productionDraft, image })} /><ImageUpload notify={notify} onImage={(image) => setProduction({ ...productionDraft, image })} /></div></div><button type="button" className="button button-gold" onClick={() => { if (!productionDraft.title.trim()) return notify('Add a production heading first.', true); const list = [...data.productions]; list.splice(productionPosition, 0, { ...productionDraft, id: id() }); update({ productions: list }); notify('Production added at the selected position.'); setProduction({ title: '', description: '', image: '/images/production.webp', year: '' }) }}>Add production <ArrowRight size={15} /></button></div><div className="admin-entry-list">{data.productions.map((item, index) => <details className="admin-entry" key={item.id}><summary><span className="sequence-controls"><button type="button" aria-label="Move production up" disabled={index === 0} onClick={(event) => { event.preventDefault(); moveProduction(index, -1) }}>↑</button><button type="button" aria-label="Move production down" disabled={index === data.productions.length - 1} onClick={(event) => { event.preventDefault(); moveProduction(index, 1) }}>↓</button></span><span>{String(index + 1).padStart(2, '0')} · {item.title}</span></summary><Field label="Heading" value={item.title} onChange={(title) => patchItem<Production>('productions', item.id, { title })} /><Field label="Year / status" value={item.year} onChange={(year) => patchItem<Production>('productions', item.id, { year })} /><TextField label="Description" value={item.description} onChange={(description) => patchItem<Production>('productions', item.id, { description })} /><div className="admin-image-field"><Field label="Thumbnail path" value={item.image} onChange={(image) => patchItem<Production>('productions', item.id, { image })} /><ImageUpload notify={notify} onImage={(image) => patchItem<Production>('productions', item.id, { image })} /></div><button type="button" className="button button-danger" onClick={() => remove('productions', item.id)}>Remove</button></details>)}</div></>}
      {tab === 'Tickets' && <><div className="admin-section-heading"><h2>Show listings</h2><p>Dates, venue, price, image, and booking details for each performance.</p></div><div className="admin-add-form"><h3>Add a show</h3><div className="admin-fields"><Field label="Show title" value={showDraft.title} onChange={(title) => setShow({ ...showDraft, title })} /><Field label="Date" type="date" value={showDraft.date} onChange={(date) => setShow({ ...showDraft, date })} /><Field label="Time" type="time" value={showDraft.time} onChange={(time) => setShow({ ...showDraft, time })} /><Field label="Venue" value={showDraft.venue} onChange={(venue) => setShow({ ...showDraft, venue })} /><Field label="Ticket price" value={showDraft.price} onChange={(price) => setShow({ ...showDraft, price })} /><TextField label="Details" value={showDraft.description} onChange={(description) => setShow({ ...showDraft, description })} /><div className="admin-image-field"><Field label="Show image path" value={showDraft.image} onChange={(image) => setShow({ ...showDraft, image })} /><ImageUpload notify={notify} onImage={(image) => setShow({ ...showDraft, image })} /></div></div><button type="button" className="button button-gold" onClick={() => { if (!showDraft.title.trim()) return notify('Add a show title first.', true); add('shows', { ...showDraft, id: id() }); setShow({ title: '', date: '', time: '', venue: '', price: '', description: '', image: '/images/stage.webp' }) }}>Add show <ArrowRight size={15} /></button></div><div className="admin-entry-list">{data.shows.map((item) => <details className="admin-entry" key={item.id}><summary>{item.title} · {item.date || 'Date to be set'}</summary><Field label="Show title" value={item.title} onChange={(title) => patchItem<Show>('shows', item.id, { title })} /><Field label="Date" type="date" value={item.date} onChange={(date) => patchItem<Show>('shows', item.id, { date })} /><Field label="Time" type="time" value={item.time} onChange={(time) => patchItem<Show>('shows', item.id, { time })} /><Field label="Venue" value={item.venue} onChange={(venue) => patchItem<Show>('shows', item.id, { venue })} /><Field label="Ticket price" value={item.price} onChange={(price) => patchItem<Show>('shows', item.id, { price })} /><TextField label="Details" value={item.description} onChange={(description) => patchItem<Show>('shows', item.id, { description })} /><div className="admin-image-field"><Field label="Image path" value={item.image} onChange={(image) => patchItem<Show>('shows', item.id, { image })} /><ImageUpload notify={notify} onImage={(image) => patchItem<Show>('shows', item.id, { image })} /></div><button type="button" className="button button-danger" onClick={() => remove('shows', item.id)}>Remove show</button></details>)}</div><div className="admin-add-form"><h3>WhatsApp booking number</h3><Field label="International format, digits only" value={data.contact.whatsapp} onChange={(value) => updateContact('whatsapp', value)} placeholder="Country code + number" /></div></>}
      {tab === 'Founders' && <><div className="admin-section-heading"><h2>Founders</h2><p>Tell visitors about the people who started the company.</p></div><div className="admin-add-form"><h3>Add a founder</h3><div className="admin-fields"><Field label="Name" value={founderDraft.name} onChange={(name) => setFounder({ ...founderDraft, name })} /><Field label="Role / heading" value={founderDraft.role} onChange={(role) => setFounder({ ...founderDraft, role })} /><TextField label="Biography" value={founderDraft.biography} onChange={(biography) => setFounder({ ...founderDraft, biography })} /><div className="admin-image-field"><Field label="Image path" value={founderDraft.image} onChange={(image) => setFounder({ ...founderDraft, image })} /><ImageUpload notify={notify} onImage={(image) => setFounder({ ...founderDraft, image })} /></div></div><button type="button" className="button button-gold" onClick={() => { if (!founderDraft.name.trim()) return notify('Add a founder name first.', true); add('founders', { ...founderDraft, id: id() }); setFounder({ name: '', role: '', biography: '', image: '/images/founder.webp' }) }}>Add founder <ArrowRight size={15} /></button></div><div className="admin-entry-list">{data.founders.map((item) => <details className="admin-entry" key={item.id}><summary>{item.name}</summary><Field label="Name" value={item.name} onChange={(name) => patchItem<Founder>('founders', item.id, { name })} /><Field label="Role" value={item.role} onChange={(role) => patchItem<Founder>('founders', item.id, { role })} /><TextField label="Biography" value={item.biography} onChange={(biography) => patchItem<Founder>('founders', item.id, { biography })} /><div className="admin-image-field"><Field label="Image path" value={item.image} onChange={(image) => patchItem<Founder>('founders', item.id, { image })} /><ImageUpload notify={notify} onImage={(image) => patchItem<Founder>('founders', item.id, { image })} /></div><button type="button" className="button button-danger" onClick={() => remove('founders', item.id)}>Remove</button></details>)}</div></>}
      {tab === 'Plays' && <><div className="admin-section-heading"><h2>Video archive</h2><p>Paste a YouTube URL; videos are embedded with their own description.</p></div><div className="admin-add-form"><h3>Add a play or video</h3><div className="admin-fields"><Field label="Title" value={playDraft.title} onChange={(title) => setPlay({ ...playDraft, title })} /><Field label="Year" value={playDraft.year} onChange={(year) => setPlay({ ...playDraft, year })} /><Field label="Duration" value={playDraft.duration} onChange={(duration) => setPlay({ ...playDraft, duration })} /><Field label="YouTube URL" value={playDraft.youtubeUrl} onChange={(youtubeUrl) => setPlay({ ...playDraft, youtubeUrl })} placeholder="https://www.youtube.com/watch?v=..." /><TextField label="Description" value={playDraft.description} onChange={(description) => setPlay({ ...playDraft, description })} /></div><button type="button" className="button button-gold" onClick={() => { if (!playDraft.title.trim() || !playDraft.youtubeUrl.trim()) return notify('Add a title and YouTube URL first.', true); add('plays', { ...playDraft, id: id() }); setPlay({ title: '', year: '', duration: '', description: '', youtubeUrl: '' }) }}>Add video <ArrowRight size={15} /></button></div><div className="admin-entry-list">{data.plays.map((item) => <details className="admin-entry" key={item.id}><summary>{item.title}</summary><Field label="Title" value={item.title} onChange={(title) => patchItem<PlayItem>('plays', item.id, { title })} /><Field label="YouTube URL" value={item.youtubeUrl} onChange={(youtubeUrl) => patchItem<PlayItem>('plays', item.id, { youtubeUrl })} /><Field label="Year" value={item.year} onChange={(year) => patchItem<PlayItem>('plays', item.id, { year })} /><Field label="Duration" value={item.duration} onChange={(duration) => patchItem<PlayItem>('plays', item.id, { duration })} /><TextField label="Description" value={item.description} onChange={(description) => patchItem<PlayItem>('plays', item.id, { description })} /><button type="button" className="button button-danger" onClick={() => remove('plays', item.id)}>Remove video</button></details>)}</div></>}
      {tab === 'Gallery' && <><div className="admin-section-heading"><h2>Gallery albums</h2><p>Create a heading, then add as many compressed images as you need.</p></div><div className="admin-add-form"><h3>Create an album</h3><Field label="Album heading" value={galleryDraft.title} onChange={(title) => setGallery({ ...galleryDraft, title })} /><button type="button" className="button button-gold" onClick={() => { if (!galleryDraft.title.trim()) return notify('Add an album heading first.', true); add('gallery', { id: id(), title: galleryDraft.title, images: [] }); setGallery({ title: '', images: '' }) }}>Create album <ArrowRight size={15} /></button></div><div className="admin-entry-list">{data.gallery.map((item) => <details className="admin-entry" key={item.id}><summary>{item.title} · {item.images.length} images</summary><Field label="Album heading" value={item.title} onChange={(title) => patchItem<GalleryGroup>('gallery', item.id, { title })} /><div className="gallery-admin-images">{item.images.map((image, index) => <div key={`${item.id}-${index}`} className="gallery-admin-image"><Photo src={image} alt="Gallery image preview" /><button type="button" className="button button-danger" onClick={() => patchItem<GalleryGroup>('gallery', item.id, { images: item.images.filter((_, imageIndex) => imageIndex !== index) })}>Remove image</button></div>)}</div><ImageUpload notify={notify} onImage={(image) => patchItem<GalleryGroup>('gallery', item.id, { images: [...item.images, image] })} /><TextField label="Image paths in public/ (one per line)" value={item.images.join('\n')} onChange={(text) => patchItem<GalleryGroup>('gallery', item.id, { images: text.split('\n').map((line) => line.trim()).filter(Boolean) })} /><button type="button" className="button button-danger" onClick={() => remove('gallery', item.id)}>Remove album</button></details>)}</div></>}
      {tab === 'Contact' && <><div className="admin-section-heading"><h2>Contact & social links</h2><p>These details appear on the contact page, home page, and footer. Current email, phone, address, and social links are sample placeholders; replace them before launch.</p></div><div className="admin-fields"><Field label="Public email" type="email" value={data.contact.email} onChange={(value) => updateContact('email', value)} /><Field label="Phone number" value={data.contact.phone} onChange={(value) => updateContact('phone', value)} /><Field label="WhatsApp booking number (international format)" value={data.contact.whatsapp} onChange={(value) => updateContact('whatsapp', value)} /><Field label="Address" value={data.contact.address} onChange={(value) => updateContact('address', value)} /><Field label="Instagram URL" value={data.contact.instagram} onChange={(value) => updateContact('instagram', value)} /><Field label="Facebook URL" value={data.contact.facebook} onChange={(value) => updateContact('facebook', value)} /><Field label="YouTube URL" value={data.contact.youtube} onChange={(value) => updateContact('youtube', value)} /></div></>}
    </section>{tab === 'Founders' && <section className="admin-panel founder-date-admin"><div className="admin-section-heading"><h2>Founder dates</h2><p>Enter confirmed lifespan dates, or founding context when lifespan dates are unavailable.</p></div>{data.founders.map((item) => <div className="founder-date-field" key={item.id}><strong>{item.name}</strong><Field label="Dates / context" value={item.dates ?? ''} onChange={(dates) => patchItem<Founder>('founders', item.id, { dates })} placeholder="1929–1993 or Kolkata · 1971" /></div>)}</section>}</main>
}

function AppRoutes() {
  const [data, setData] = useState<TheatreContent>(() => readContent())
  const [curtain, setCurtain] = useState(true)
  const location = useLocation()
  const adminHasLoadedContent = useRef(false)
  useEffect(() => {
    let active = true
    void getContent().then((content) => {
      if (!active || adminHasLoadedContent.current) return
      setData(content)
      try { cacheContent(content) } catch (error) { console.warn('The latest website content could not be cached in this browser:', error) }
    }).catch((error: unknown) => {
      console.warn('Using the locally cached theatre content because the content API is unavailable:', error)
    })
    return () => { active = false }
  }, [])
  const loadAdminContent = useCallback((content: TheatreContent) => { adminHasLoadedContent.current = true; setData(content) }, [setData])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [location.pathname])
  useEffect(() => { const timer = window.setTimeout(() => setCurtain(false), 2300); return () => window.clearTimeout(timer) }, [])
  return <>{curtain && <div className="curtain" aria-hidden="true"><div className="curtain-valance" /><div className="curtain-panel curtain-left" /><div className="curtain-panel curtain-right" /><span className="curtain-wordmark">Peoples Little Theatre</span></div>}<Header /><Routes>
    <Route path="/" element={<Home data={data} />} /><Route path="/about" element={<About data={data} />} /><Route path="/productions" element={<Productions data={data} />} /><Route path="/tickets" element={<Tickets data={data} />} /><Route path="/founders" element={<Founders data={data} />} /><Route path="/plays" element={<Plays data={data} />} /><Route path="/gallery" element={<Gallery data={data} />} /><Route path="/contact" element={<Contact data={data} />} /><Route path="/admin" element={<Admin data={data} setData={loadAdminContent} />} /><Route path="*" element={<NotFound />} />
  </Routes><Footer data={data} /></>
}

export default function App() { return <BrowserRouter><div className="min-h-screen bg-(--paper) text-(--ink)"><AppRoutes /></div></BrowserRouter> }
