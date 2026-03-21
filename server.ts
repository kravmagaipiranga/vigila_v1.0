import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { initializeApp, getApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

const adminApp = getApps().length === 0 
  ? initializeApp({ projectId: firebaseConfig.projectId })
  : getApp();

const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(adminApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(adminApp);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Mercado Pago Client
const mpClient = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '' 
});

// API Routes
app.post('/api/checkout', async (req, res) => {
  const { userId, email, plan } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: 'Missing userId or email' });
  }

  try {
    const preference = new Preference(mpClient);
    
    let title = 'VIGILA PRO - Acesso Vitalício';
    let unit_price = 49.90;

    if (plan === '7days') {
      title = 'VIGILA PRO - 7 Dias';
      unit_price = 9.90;
    } else if (plan === '1year') {
      title = 'VIGILA PRO - 1 Ano';
      unit_price = 29.90;
    }

    const response = await preference.create({
      body: {
        items: [
          {
            id: plan || 'lifetime',
            title,
            quantity: 1,
            unit_price,
            currency_id: 'BRL'
          }
        ],
        payer: {
          email: email
        },
        back_urls: {
          success: `${process.env.APP_URL}/settings?payment=success`,
          failure: `${process.env.APP_URL}/settings?payment=failure`,
          pending: `${process.env.APP_URL}/settings?payment=pending`
        },
        auto_return: 'approved',
        notification_url: `${process.env.APP_URL}/api/webhook/mercadopago`,
        external_reference: userId, // Store userId here to retrieve it in webhook
        metadata: {
          user_id: userId,
          plan: plan || 'lifetime'
        }
      }
    });

    res.json({ id: response.id, init_point: response.init_point });
  } catch (error) {
    console.error('Error creating preference:', error);
    res.status(500).json({ error: 'Failed to create preference' });
  }
});

app.post('/api/webhook/mercadopago', async (req, res) => {
  const { query } = req;
  const topic = query.topic || query.type;
  const id = query.id || (req.body && req.body.data && req.body.data.id);

  console.log('Webhook received:', { topic, id });

  if (topic === 'payment') {
    try {
      const payment = new Payment(mpClient);
      const paymentData = await payment.get({ id: String(id) });

      if (paymentData.status === 'approved') {
        const userId = paymentData.external_reference;
        const plan = paymentData.metadata?.plan || 'lifetime';

        console.log(`Payment approved for user ${userId}, plan ${plan}`);

        if (userId) {
          const userRef = db.collection('users').doc(userId);
          
          const updateData: any = {
            isPro: true,
            updatedAt: FieldValue.serverTimestamp()
          };

          if (plan !== 'lifetime') {
            const expirationDate = new Date();
            if (plan === '7days') {
              expirationDate.setDate(expirationDate.getDate() + 7);
            } else if (plan === '1year') {
              expirationDate.setFullYear(expirationDate.getFullYear() + 1);
            }
            updateData.proExpirationDate = expirationDate.toISOString();
          } else {
            // For lifetime, we can clear expiration if it exists
            updateData.proExpirationDate = null;
          }

          await userRef.set(updateData, { merge: true });
          console.log(`User ${userId} updated to PRO`);
        }
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
    }
  }

  res.sendStatus(200);
});

// Vite middleware for development
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
