import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  dispatchedExternally: boolean;
  deliveryChannel: string;
}

function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
}

const SAMEENA_SYSTEM_INSTRUCTION = `You are the AI Portfolio Architect & Research Assistant for Sameena P.
Profile Summary:
- Name: Sameena P
- Role: AI & Data Science Engineer | Full-Stack Developer | AI/ML Enthusiast | UI/UX Designer | SEO Analyst
- Location: Chennai, Tamil Nadu, India
- Education: B.Tech in Artificial Intelligence and Data Science, DMI College of Engineering (CGPA: 8.5, Expected Graduation: 2028)
- Contact: sameena3437@gmail.com | Phone: 9940543897
- Skills: Python, JavaScript, HTML, CSS, Deep Learning, CNN, Data Preprocessing, Exploratory Data Analysis (EDA), Feature Normalization, Model Evaluation, TensorFlow, Streamlit, React.js, Node.js, Express.js, FastAPI, PostgreSQL, MongoDB, Logistic Regression, Decision Tree, Random Forest, K-Nearest Neighbors (KNN).
- Featured Projects:
  1. Diabetes Prediction System (Python, Machine Learning, Streamlit) — compares Logistic Regression, Decision Tree, Random Forest, and KNN after data preprocessing, EDA, and feature normalization.
  2. Brain Tumor Detection Using MRI (Python, TensorFlow, CNN, Streamlit) — CNN deep learning classification of cranial MRI scans.
  3. SEO Brilliance — AI SEO Website Analyzer (React.js, Node.js, PostgreSQL) — SaaS-style website SEO audit and recommendations platform.
  4. InstaGuard AI (React.js, Node.js, MongoDB) — AI-powered social media safety platform concept with harassment detection and incident analytics.
  5. Annapathiram Catering Web Application (React.js, FastAPI, MongoDB) — hospitality web platform with booking inquiries, authentication, media uploads, and analytics.
- Experience:
  - Tenam Software Solutions (June 2026 to Present): Business Analysis, Software Testing, Software Development, and SEO Analysis.
  - Paper Heroes (July to August 2026): Research and Development (R&D).
  - Vulture Lines (One-month internship): Artificial Intelligence and Machine Learning Intern.
- Achievements & Certifications:
  - First Prize — She Hackathon 2025 (March 8, 2025).
  - Participated in Neurothon Hackathon.
  - HCL Training: Networking, Identity and Access Management (IAM), Virtualization/Cybersecurity.
  - MSME: Computer Fundamentals.

Respond clearly, concisely, and professionally. Help recruiters, collaborators, and engineers explore Sameena's projects, machine learning architectures, bioinformatics biomarkers, and full-stack capabilities.`;

function readInquiries(): ContactInquiry[] {
  try {
    if (!fs.existsSync(INQUIRIES_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(INQUIRIES_FILE, 'utf-8');
    return JSON.parse(raw) as ContactInquiry[];
  } catch {
    return [];
  }
}

function saveInquiry(entry: ContactInquiry): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const existing = readInquiries();
    existing.unshift(entry);
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(existing.slice(0, 100), null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist inquiry locally:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // --- MULTI-TURN GEMINI CHATBOT ENDPOINT ---
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { messages, model } = req.body ?? {};
      const allowedModels = [
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash',
        'gemini-3.1-pro-preview',
      ];
      const selectedModel = allowedModels.includes(model) ? model : 'gemini-3.5-flash';

      if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Messages array is required.' });
        return;
      }

      const ai = getGenAIClient();

      const history = messages.slice(0, -1).map((m: { role: string; text: string }) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: String(m.text || '') }],
      }));

      const latestMessage = String(messages[messages.length - 1]?.text || '');

      const chat = ai.chats.create({
        model: selectedModel,
        history,
        config: {
          systemInstruction: SAMEENA_SYSTEM_INSTRUCTION,
        },
      });

      const response = await chat.sendMessage({
        message: latestMessage,
      });

      res.json({
        text: response.text || 'No response generated.',
        modelUsed: selectedModel,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Gemini Chat Error:', msg);
      res.status(500).json({
        error: `Gemini API Error: ${msg}. You can verify your API key in Settings > Secrets.`,
      });
    }
  });

  // --- GOOGLE SEARCH GROUNDING ENDPOINT (gemini-3.5-flash + googleSearch) ---
  app.post('/api/gemini/search-grounding', async (req, res) => {
    try {
      const { query } = req.body ?? {};
      const cleanQuery = typeof query === 'string' ? query.trim() : '';
      if (!cleanQuery) {
        res.status(400).json({ error: 'Search query is required.' });
        return;
      }

      const ai = getGenAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: cleanQuery,
        config: {
          systemInstruction:
            'You are a technical research analyst for Sameena P’s AI & Data Science portfolio. Provide accurate, up-to-date insights grounded in Google Search.',
          tools: [{ googleSearch: {} }],
        },
      });

      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = rawChunks
        .map((chunk: { web?: { uri?: string; title?: string } }) => {
          if (chunk.web?.uri) {
            return {
              uri: chunk.web.uri,
              title: chunk.web.title || chunk.web.uri,
            };
          }
          return null;
        })
        .filter(Boolean);

      res.json({
        text: response.text || 'No search summary returned.',
        sources,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Search Grounding Error:', msg);
      res.status(500).json({
        error: `Search Grounding failed: ${msg}`,
      });
    }
  });

  // --- GOOGLE MAPS GROUNDING ENDPOINT (gemini-3.5-flash + googleMaps) ---
  app.post('/api/gemini/maps-grounding', async (req, res) => {
    try {
      const { query, latitude, longitude } = req.body ?? {};
      const cleanQuery = typeof query === 'string' ? query.trim() : '';
      if (!cleanQuery) {
        res.status(400).json({ error: 'Maps query is required.' });
        return;
      }

      // Default to Chennai, Tamil Nadu, India coordinates if user geolocation is not provided
      const lat = typeof latitude === 'number' && !Number.isNaN(latitude) ? latitude : 13.0827;
      const lng = typeof longitude === 'number' && !Number.isNaN(longitude) ? longitude : 80.2707;

      const ai = getGenAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: cleanQuery,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: lat,
                longitude: lng,
              },
            },
          },
        },
      });

      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const places: Array<{
        uri: string;
        title: string;
        reviewSnippets: string[];
      }> = [];

      for (const chunk of rawChunks as Array<{
        maps?: {
          uri?: string;
          title?: string;
          placeAnswerSources?: {
            reviewSnippets?: Array<{ content?: string; text?: string } | string>;
          };
        };
      }>) {
        if (chunk.maps?.uri) {
          const rawSnippets = chunk.maps.placeAnswerSources?.reviewSnippets || [];
          const snippets = rawSnippets
            .map((s) => (typeof s === 'string' ? s : s?.content || s?.text || ''))
            .filter(Boolean);
          places.push({
            uri: chunk.maps.uri,
            title: chunk.maps.title || 'View on Google Maps',
            reviewSnippets: snippets,
          });
        }
      }

      res.json({
        text: response.text || 'No geographic details returned.',
        places,
        coordinatesUsed: { latitude: lat, longitude: lng },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Maps Grounding Error:', msg);
      res.status(500).json({
        error: `Maps Grounding failed: ${msg}`,
      });
    }
  });

  // --- CONTACT FORM ENDPOINTS ---
  app.get('/api/contact/status', (_req, res) => {
    const hasResend = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 5);
    const hasWebhook = Boolean(
      process.env.CONTACT_WEBHOOK_URL && process.env.CONTACT_WEBHOOK_URL.trim().startsWith('http')
    );
    const inquiries = readInquiries();
    res.json({
      emailServiceConfigured: hasResend || hasWebhook,
      provider: hasResend ? 'Resend API' : hasWebhook ? 'Webhook Relay' : 'Local Server Queue Only',
      recipientEmail: 'sameena3437@gmail.com',
      storedCount: inquiries.length,
    });
  });

  app.get('/api/contact/inquiries', (_req, res) => {
    const inquiries = readInquiries();
    res.json({ inquiries });
  });

  app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body ?? {};

    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim() : '';
    const cleanSubject = typeof subject === 'string' ? subject.trim() : '';
    const cleanMessage = typeof message === 'string' ? message.trim() : '';

    if (cleanName.length < 2) {
      res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    if (cleanSubject.length < 3) {
      res.status(400).json({ error: 'Please include a clear subject line (at least 3 characters).' });
      return;
    }

    if (cleanMessage.length < 10) {
      res.status(400).json({ error: 'Please write a message of at least 10 characters.' });
      return;
    }

    const hasResend = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 5);
    const hasWebhook = Boolean(
      process.env.CONTACT_WEBHOOK_URL && process.env.CONTACT_WEBHOOK_URL.trim().startsWith('http')
    );

    let dispatchedExternally = false;
    let deliveryChannel = 'local-server-log';
    let externalNotice = '';

    if (hasResend) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Portfolio Contact <onboarding@resend.dev>',
            to: ['sameena3437@gmail.com'],
            reply_to: cleanEmail,
            subject: `[Portfolio Inquiry] ${cleanSubject}`,
            text: `From: ${cleanName} (${cleanEmail})\nSubject: ${cleanSubject}\n\n${cleanMessage}`,
          }),
        });
        if (response.ok) {
          dispatchedExternally = true;
          deliveryChannel = 'resend-api';
        } else {
          externalNotice = 'Resend API returned a non-200 status; saved to local server queue.';
        }
      } catch {
        externalNotice = 'Could not reach Resend API; saved to local server queue.';
      }
    } else if (hasWebhook) {
      try {
        const response = await fetch(process.env.CONTACT_WEBHOOK_URL!.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            subject: cleanSubject,
            message: cleanMessage,
            recipient: 'sameena3437@gmail.com',
            timestamp: new Date().toISOString(),
          }),
        });
        if (response.ok) {
          dispatchedExternally = true;
          deliveryChannel = 'webhook';
        } else {
          externalNotice = 'Webhook endpoint returned an error; saved to local server queue.';
        }
      } catch {
        externalNotice = 'Webhook endpoint unreachable; saved to local server queue.';
      }
    }

    const inquiry: ContactInquiry = {
      id: `inq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
      dispatchedExternally,
      deliveryChannel,
    };

    saveInquiry(inquiry);

    res.status(200).json({
      ok: true,
      inquiry,
      dispatchedExternally,
      externalNotice:
        externalNotice ||
        (dispatchedExternally
          ? 'Email dispatched directly to sameena3437@gmail.com.'
          : 'Saved to the portfolio server queue. External SMTP/Resend email relay is not configured in environment variables yet—use the direct email button below to launch your mail client immediately.'),
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://127.0.0.1:${PORT}/\n`);
  });
}

startServer();
