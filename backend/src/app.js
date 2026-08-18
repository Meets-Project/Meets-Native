import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from './db.js';
import { makeRepository } from './repository.js';
import { requireAuth, signToken } from './auth.js';

const app = express();
const repo = makeRepository({ query });
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '20mb' }));

const credentials = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128)
});
const profileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.string().trim().max(80).optional(),
  city: z.string().trim().max(120).optional(),
  avatar: z.string().max(20).optional(),
  bio: z.string().max(1000).optional()
}).strict();

app.get('/health', async (_req,res) => {
  try { await query('SELECT 1'); res.json({ok:true, database:'postgresql'}); }
  catch { res.status(503).json({ok:false, database:'postgresql'}); }
});

app.post('/auth/signup', async (req,res,next) => {
  try {
    const data=credentials.parse(req.body);
    if(!data.name) return res.status(400).json({message:'Nome é obrigatório.'});
    const exists=await repo.findUserByEmail(data.email);
    if(exists) return res.status(409).json({message:'E-mail já cadastrado.'});
    const passwordHash=await bcrypt.hash(data.password,12);
    const user=await repo.createUser({name:data.name,email:data.email.toLowerCase(),passwordHash});
    await repo.updateSettings(user.id,{});
    await repo.createNotification(user.id,{title:'Bem-vindo ao Meets',body:'Sua conta foi criada e seus dados estão persistidos.'});
    const token=signToken(user);
    res.status(201).json({data:{token,user}});
  } catch(e){ next(e); }
});

app.post('/auth/login', async (req,res,next) => {
  try {
    const data=credentials.omit({name:true}).parse(req.body);
    const user=await repo.findUserByEmail(data.email);
    if(!user || !(await bcrypt.compare(data.password,user.password_hash)))
      return res.status(401).json({message:'E-mail ou senha inválidos.'});
    const safe=await repo.getUser(user.id);
    res.json({data:{token:signToken(user),user:safe}});
  } catch(e){ next(e); }
});

app.get('/users/me', requireAuth, async(req,res,next)=>{
  try { const user=await repo.getUser(req.auth.sub); if(!user) return res.status(404).json({message:'Usuário não encontrado.'}); res.json({data:user}); }
  catch(e){next(e);}
});
app.put('/users/me', requireAuth, async(req,res,next)=>{
  try { const data=profileSchema.parse(req.body); const user=await repo.updateUser(req.auth.sub,data); res.json({data:user}); }
  catch(e){next(e);}
});

app.get('/search',requireAuth,async(req,res,next)=>{try{const q=String(req.query.q||'').trim();res.json({data:q?await repo.search(q):[]});}catch(e){next(e);}});
app.get('/chats',requireAuth,async(req,res,next)=>{try{res.json({data:await repo.listChats(req.auth.sub)});}catch(e){next(e);}});
app.get('/feed', requireAuth, async(_req,res,next)=>{try{res.json({data:await repo.listPosts()});}catch(e){next(e);}});
app.post('/posts', requireAuth, async(req,res,next)=>{
  try {
    const data=z.object({content:z.string().trim().min(1).max(5000),image:z.string().max(15000000).optional()}).parse(req.body);
    const post=await repo.createPost(req.auth.sub,data); await repo.addHistory(req.auth.sub,{type:'post',title:'Publicou uma atualização',subtitle:data.content.slice(0,120)});
    res.status(201).json({data:post});
  } catch(e){next(e);}
});
app.post('/posts/:id/like',requireAuth,async(req,res,next)=>{try{res.json({data:await repo.toggleLike(req.auth.sub,req.params.id)});}catch(e){next(e);}});
app.post('/posts/:id/save',requireAuth,async(req,res,next)=>{try{res.json({data:{saved:await repo.toggleSave(req.auth.sub,req.params.id)}});}catch(e){next(e);}});
app.post('/posts/:id/favorite',requireAuth,async(req,res,next)=>{try{res.json({data:{favorite:await repo.toggleFavorite(req.auth.sub,req.params.id)}});}catch(e){next(e);}});
app.get('/favorites',requireAuth,async(req,res,next)=>{try{res.json({data:await repo.listFavorites(req.auth.sub)});}catch(e){next(e);}});
app.get('/saves',requireAuth,async(req,res,next)=>{try{res.json({data:await repo.listSaved(req.auth.sub)});}catch(e){next(e);}});
app.get('/history',requireAuth,async(req,res,next)=>{try{res.json({data:await repo.listHistory(req.auth.sub)});}catch(e){next(e);}});

app.post('/content',requireAuth,async(req,res,next)=>{
  try {
    const data=z.object({mode:z.enum(['event','live','post']),title:z.string().trim().min(1).max(160),description:z.string().max(5000).optional(),image:z.string().max(15000000).optional()}).parse(req.body);
    const item=await repo.createContent(req.auth.sub,data.mode,data);
    await repo.addHistory(req.auth.sub,{type:data.mode,title:data.title,subtitle:data.description||''});
    res.status(201).json({data:item});
  } catch(e){next(e);}
});

app.get('/notifications',requireAuth,async(req,res,next)=>{try{res.json({data:await repo.listNotifications(req.auth.sub)});}catch(e){next(e);}});
app.post('/notifications/:id/read',requireAuth,async(req,res,next)=>{try{const n=await repo.markNotificationRead(req.auth.sub,req.params.id);res.json({data:n});}catch(e){next(e);}});
app.get('/settings',requireAuth,async(req,res,next)=>{try{res.json({data:await repo.listSettings(req.auth.sub)});}catch(e){next(e);}});
app.put('/settings',requireAuth,async(req,res,next)=>{try{const d=z.object({notificationsEnabled:z.boolean().optional(),darkMode:z.boolean().optional()}).parse(req.body);res.json({data:await repo.updateSettings(req.auth.sub,d)});}catch(e){next(e);}});

app.use((err,_req,res,_next)=>{
  if(err instanceof z.ZodError) return res.status(400).json({message:'Dados inválidos.',details:err.issues});
  if(err.code==='23505') return res.status(409).json({message:'Registro duplicado.'});
  if(err.code==='23503') return res.status(404).json({message:'Registro relacionado não encontrado.'});
  console.error(err);
  res.status(500).json({message:'Erro interno do servidor.'});
});
export { app };
