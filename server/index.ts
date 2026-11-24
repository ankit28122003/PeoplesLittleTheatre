import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import 'dotenv/config'
import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import multer from 'multer'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { initialContent } from '../src/content.js'

const port = Number(process.env.PORT ?? 3000)
const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminEmail = 'kamaleshadmin@peopleslittletheatre.com'
const adminPassword = 'Kamalesh@peopleslittletheatre'
const adminSessions = new Set<string>()
const allowedOrigins = (process.env.CLIENT_ORIGINS ?? process.env.CLIENT_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const nonEmptyString = z.string().max(20_000)
const contentSchema = z.object({
  aboutHeading: z.string().max(300),
  aboutText: nonEmptyString,
  aboutImage: z.string().max(2_000),
  heroSlides: z.array(z.object({ id: z.string().min(1).max(100), image: z.string().max(2_000), alt: z.string().max(300) })).max(20),
  productions: z.array(z.object({ id: z.string().min(1).max(100), title: z.string().max(300), description: nonEmptyString, image: z.string().max(2_000), year: z.string().max(100) })).max(500),
  shows: z.array(z.object({ id: z.string().min(1).max(100), title: z.string().max(300), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().max(10), venue: z.string().max(500), price: z.string().max(300), description: nonEmptyString, image: z.string().max(2_000) })).max(500),
  founders: z.array(z.object({ id: z.string().min(1).max(100), name: z.string().max(300), role: z.string().max(300), dates: z.string().max(100).optional(), biography: nonEmptyString, image: z.string().max(2_000) })).max(500),
  plays: z.array(z.object({ id: z.string().min(1).max(100), title: z.string().max(300), year: z.string().max(100), duration: z.string().max(100), description: nonEmptyString, blog: z.string().max(100_000).optional(), youtubeUrl: z.string().max(2_000) })).max(500),
  gallery: z.array(z.object({ id: z.string().min(1).max(100), title: z.string().max(300), images: z.array(z.string().max(2_000)).max(100) })).max(100),
  footer: z.object({
    tagline: z.string().max(500), exploreHeading: z.string().max(100), contactHeading: z.string().max(100), socialHeading: z.string().max(100), closingLine: z.string().max(500),
    links: z.array(z.object({ id: z.string().min(1).max(100), label: z.string().max(100), url: z.string().max(2_000) })).max(30),
  }),
  contact: z.object({
    email: z.string().max(500), phone: z.string().max(100), address: z.string().max(1_000), whatsapp: z.string().max(100),
    instagram: z.string().max(2_000), facebook: z.string().max(2_000), youtube: z.string().max(2_000),
  }),
}).strict()

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && allowedOrigins.length === 0)) {
      callback(null, true)
      return
    }
    callback(new Error('This website origin is not allowed by the API.'))
  },
  methods: ['GET', 'PUT', 'POST', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}))
app.use(express.json({ limit: '2mb' }))
app.use('/api/admin', rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false }))

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))

app.get('/api/content', async (_request, response, next) => {
  try {
    const { data, error } = await supabase.from('site_content').select('content').eq('id', 'public').maybeSingle()
    if (error) throw error
    response.set('Cache-Control', 'no-store').json(data?.content ?? initialContent)
  } catch (error) {
    next(error)
  }
})

async function requireAdmin(request: Request, response: Response, next: NextFunction) {
  const authorization = request.header('authorization')
  const token = authorization?.match(/^Bearer (.+)$/i)?.[1]
  if (!token) {
    response.status(401).json({ error: 'Sign in to administer this website.' })
    return
  }
  if (!adminSessions.has(token)) {
    response.status(401).json({ error: 'Your admin session is invalid or has expired.' })
    return
  }
  next()
}

app.post('/api/admin/login', async (request, response) => {
  const result = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }).safeParse(request.body)
  if (!result.success) {
    response.status(400).json({ error: 'Enter a valid admin email and password.' })
    return
  }
  if (result.data.email.trim().toLowerCase() !== adminEmail || result.data.password !== adminPassword) {
    response.status(401).json({ error: 'The admin email or password is incorrect.' })
    return
  }
  const token = randomUUID()
  adminSessions.add(token)
  response.json({ token })
})

app.post('/api/admin/logout', requireAdmin, (request, response) => {
  const token = request.header('authorization')?.match(/^Bearer (.+)$/i)?.[1]
  if (token) adminSessions.delete(token)
  response.json({ ok: true })
})

app.get('/api/admin/session', requireAdmin, (_request, response) => response.json({ ok: true }))

app.put('/api/admin/content', requireAdmin, async (request, response, next) => {
  const result = contentSchema.safeParse(request.body)
  if (!result.success) {
    response.status(400).json({ error: 'The submitted website content is invalid.', details: result.error.flatten() })
    return
  }
  try {
    const { data, error } = await supabase
      .from('site_content')
      .upsert({ id: 'public', content: result.data, updated_at: new Date().toISOString() })
      .select('updated_at')
      .single()
    if (error) throw error
    response.json({ ok: true, updatedAt: data.updated_at })
  } catch (error) {
    next(error)
  }
})

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter(_request, file, callback) {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      callback(new Error('Only JPEG, PNG, WebP, or GIF images can be uploaded.'))
      return
    }
    callback(null, true)
  },
})

app.post('/api/admin/upload', requireAdmin, upload.single('image'), async (request, response, next) => {
  if (!request.file) {
    response.status(400).json({ error: 'Choose an image to upload.' })
    return
  }
  const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }[request.file.mimetype]
  try {
    const { data, error } = await supabase.storage
      .from('site-assets')
      .upload(`${randomUUID()}.${extension}`, request.file.buffer, { contentType: request.file.mimetype, cacheControl: '31536000', upsert: false })
    if (error) throw error
    const { data: publicUrl } = supabase.storage.from('site-assets').getPublicUrl(data.path)
    response.status(201).json({ url: publicUrl.publicUrl })
  } catch (error) {
    next(error)
  }
})

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    response.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Images must be no larger than 8 MB.' : error.message })
    return
  }
  const requestError = error as { status?: unknown; type?: unknown }
  if (requestError.type === 'entity.too.large' || requestError.status === 413) {
    response.status(413).json({ error: 'The request is too large. Reduce the image or content size and try again.' })
    return
  }
  if (requestError.status === 400) {
    response.status(400).json({ error: 'The request body is invalid.' })
    return
  }
  if (error instanceof Error && error.message === 'This website origin is not allowed by the API.') {
    response.status(403).json({ error: error.message })
    return
  }
  if (error instanceof Error && error.message.startsWith('Only JPEG')) {
    response.status(400).json({ error: error.message })
    return
  }
  console.error('API request failed:', error)
  response.status(500).json({ error: 'The server could not complete this request. Please try again.' })
})

const server = createServer(app)
server.requestTimeout = 120_000
server.headersTimeout = 125_000
server.listen(port, '0.0.0.0', () => console.log(`PLT API listening on port ${port}`))
