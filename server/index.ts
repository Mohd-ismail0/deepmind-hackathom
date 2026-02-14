import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errorHandler, createError } from './middleware/errorHandler.js';
import { firebaseAdminAuth } from './middleware/firebaseAdminAuth.js';
import adminRoutes from './routes/admin.js';
import templateRoutes from './routes/templates.js';
import chatRoutes from './routes/chat.js';
import automationRoutes from './routes/automation.js';
import whatsappWebhookRoutes from './routes/whatsappWebhook.js';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok' });
});

app.use('/api/v1/admin', firebaseAdminAuth, adminRoutes);
app.use('/api/v1/templates', firebaseAdminAuth, templateRoutes);
app.use('/api/v1', chatRoutes);
app.use('/api/v1/automation', automationRoutes);
app.use('/webhook/whatsapp', whatsappWebhookRoutes);

app.use((_req, _res, next) => {
  next(createError('Not found', 'NOT_FOUND', 404));
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`GovAuto server listening on port ${PORT}`);
});
