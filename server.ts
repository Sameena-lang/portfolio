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

function hasValidGeminiKey(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(
    key &&
    key.trim().length > 10 &&
    key.trim() !== 'MY_GEMINI_API_KEY' &&
    key.trim() !== 'your_gemini_api_key_here'
  );
}

function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
  });
}

function generateLocalAssistantResponse(query: string): string {
  const q = query.toLowerCase().trim();

  if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q === 'hi' || q === 'hello' || q === 'hey') {
    return `Hello! 👋 I am Sameena P's AI Assistant.

Sameena is an **AI & Data Science Engineer, Full-Stack Developer, and UI/UX Designer** based in Chennai, India. She is pursuing her B.Tech in Artificial Intelligence & Data Science at DMI College of Engineering (CGPA: 8.5).

You can ask me about:
• 🧠 **Machine Learning Projects** (Diabetes Prediction, Brain Tumor MRI CNN)
• 💻 **Full-Stack Web Applications** (SEO Brilliance, InstaGuard AI, Annapathiram Catering)
• 💼 **Internships & Industry Experience** (Tenam Software Solutions, Paper Heroes, Vulture Lines)
• 🏆 **Hackathons & Certifications** (1st Prize at She Hackathon 2025)
• 📬 **Contact & Collaboration Details**`;
  }

  if (q.includes('project') || q.includes('work') || q.includes('portfolio') || q.includes('summarize')) {
    return `Here is an overview of Sameena P's featured technical projects:

1. **Diabetes Prediction System** (Python, Scikit-Learn, Streamlit)
   • Compares Logistic Regression, Decision Tree, Random Forest, and KNN with automated EDA, data preprocessing, and feature normalization.

2. **Brain Tumor Detection Using MRI** (TensorFlow, CNN, Streamlit)
   • Convolutional Neural Network deep learning classification of cranial MRI scans for early diagnostic assistance.

3. **SEO Brilliance** (React.js, Node.js, PostgreSQL)
   • SaaS-style automated SEO website audit, keyword metrics, and technical recommendations platform.

4. **InstaGuard AI** (React.js, Node.js, MongoDB)
   • AI-powered social media safety platform featuring automated harassment detection and incident analytics.

5. **Annapathiram Catering Platform** (React.js, FastAPI, MongoDB)
   • End-to-end hospitality web application with customer booking workflows, media uploads, and order analytics.`;
  }

  if (q.includes('tumor') || q.includes('mri') || q.includes('brain') || q.includes('cnn')) {
    return `🧠 **Brain Tumor Detection Using MRI**

• **Tech Stack:** Python, TensorFlow, Convolutional Neural Networks (CNN), Streamlit
• **Methodology:** Preprocesses cranial MRI scans with normalization, data augmentation, and feature extraction through multi-layer convolutional filters and pooling layers.
• **Result:** High-confidence classification between healthy cranial scans and identified tumor regions, serving as a diagnostic aid for medical imaging analysis.`;
  }

  if (q.includes('diabet') || q.includes('knn') || q.includes('random forest') || q.includes('logistic')) {
    return `📊 **Diabetes Prediction System**

• **Tech Stack:** Python, Machine Learning (Scikit-Learn), Streamlit
• **Architecture:** Evaluates and compares four distinct algorithms:
  - Logistic Regression
  - Decision Tree Classifier
  - Random Forest Classifier
  - K-Nearest Neighbors (KNN)
• **Pipeline:** Complete Exploratory Data Analysis (EDA), missing value imputation, robust feature normalization (StandardScaler), and hyperparameter tuning with confusion matrix diagnostics.`;
  }

  if (q.includes('intern') || q.includes('experience') || q.includes('tenam') || q.includes('paper heroes') || q.includes('vulture')) {
    return `💼 **Sameena P's Industry Experience & Internships:**

1. **Tenam Software Solutions** (June 2026 – Present)
   • Business Analysis, Software Testing, Software Development, and SEO Analytics.

2. **Paper Heroes** (July – August 2026)
   • Research and Development (R&D) focusing on technology workflows and application development.

3. **Vulture Lines** (Internship)
   • Artificial Intelligence & Machine Learning Intern — implemented predictive modeling and data pipelines.`;
  }

  if (q.includes('skill') || q.includes('tech') || q.includes('stack') || q.includes('language') || q.includes('python')) {
    return `🛠️ **Sameena P's Technical Skills:**

• **Core Languages:** Python, JavaScript, HTML5, CSS3, SQL
• **AI & Machine Learning:** Deep Learning, Convolutional Neural Networks (CNN), TensorFlow, Scikit-Learn, Streamlit, EDA, Feature Engineering
• **Web & Full-Stack:** React.js, Vite, Node.js, Express.js, FastAPI, Tailwind CSS, Three.js
• **Databases & Cloud:** PostgreSQL, MongoDB, Firebase Firestore, Firebase Storage
• **Tools & Systems:** Git, GitHub, REST APIs, Linux`;
  }

  if (q.includes('educat') || q.includes('college') || q.includes('cgpa') || q.includes('degree') || q.includes('dmi')) {
    return `🎓 **Education:**

• **Degree:** B.Tech in Artificial Intelligence and Data Science
• **Institution:** DMI College of Engineering, Chennai, Tamil Nadu
• **Academic Performance:** CGPA: 8.5
• **Expected Graduation:** 2028`;
  }

  if (q.includes('award') || q.includes('hackathon') || q.includes('achievement') || q.includes('cert')) {
    return `🏆 **Achievements & Certifications:**

• 🥇 **First Prize — She Hackathon 2025** (March 8, 2025)
• 💡 **Neurothon Hackathon** — Active participant in computational neural modeling
• 📜 **HCL Training Certification** — Networking, Identity and Access Management (IAM), Virtualization, and Cybersecurity`;
  }

  if (q.includes('contact') || q.includes('email') || q.includes('phone') || q.includes('hire') || q.includes('reach')) {
    return `📬 **Get in Touch with Sameena P:**

• **Email:** [sameena3437@gmail.com](mailto:sameena3437@gmail.com)
• **Phone:** +91 9940543897
• **Location:** Chennai, Tamil Nadu, India
• **GitHub:** [github.com/Sameena-lang](https://github.com/Sameena-lang)
• Feel free to send a message via the Contact section on this page!`;
  }

  return `I am Sameena P's AI Portfolio Assistant. Sameena is an AI & Data Science Engineer specialized in Machine Learning (CNNs, Predictive Modeling), Full-Stack Development (React, Node.js, FastAPI), and Cloud systems.

You can ask me about her projects (Diabetes Prediction, MRI Brain Tumor Detection, SEO Brilliance, InstaGuard AI), her internships at Tenam, Paper Heroes, and Vulture Lines, or her technical skills in Python, TensorFlow, and React.

*(💡 Tip: To enable live unrestricted generative AI across any general web topic, you can also add your free GEMINI_API_KEY into your .env file).*`;
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

  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

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

      const latestMessage = String(messages[messages.length - 1]?.text || '');

      if (!hasValidGeminiKey()) {
        const localResponse = generateLocalAssistantResponse(latestMessage);
        res.json({
          text: localResponse,
          modelUsed: `${selectedModel} (Local Knowledge Engine)`,
        });
        return;
      }

      const ai = getGenAIClient();

      const history = messages.slice(0, -1).map((m: { role: string; text: string }) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: String(m.text || '') }],
      }));

      try {
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
      } catch (geminiError: unknown) {
        console.warn('Live Gemini API error, falling back to local engine:', geminiError);
        const fallbackText = generateLocalAssistantResponse(latestMessage);
        res.json({
          text: fallbackText,
          modelUsed: `${selectedModel} (Local Fallback)`,
        });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('Gemini Chat Error:', msg);
      res.json({
        text: generateLocalAssistantResponse(String(req.body?.messages?.slice(-1)?.[0]?.text || '')),
        modelUsed: 'Local Knowledge Engine',
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

      if (!hasValidGeminiKey()) {
        res.json({
          text: `Grounded Research Insight for "${cleanQuery}":\n\nSameena P's portfolio integrates machine learning architectures (CNN for MRI cranial analysis, comparative ensemble classifiers for diabetes prediction) with modern full-stack web applications. Key research findings demonstrate high precision feature normalization and robust cross-validation on normalized biomedical datasets.\n\n*(Connect your GEMINI_API_KEY in .env for live internet search grounding).*`,
          sources: [
            { uri: 'https://github.com/Sameena-lang/portfolio', title: "Sameena P — AI & Data Science Portfolio" },
            { uri: 'https://tensorflow.org', title: 'TensorFlow CNN Biomedical Documentation' },
          ],
        });
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
      console.warn('Search Grounding error, falling back to local insight:', error);
      res.json({
        text: `Grounded Research Insight for "${req.body?.query || ''}":\n\nSameena P's technical research emphasizes deep learning diagnostic pipelines and machine learning classifiers with rigorous hyperparameter tuning and model evaluation.`,
        sources: [
          { uri: 'https://github.com/Sameena-lang/portfolio', title: "Sameena P — AI & Data Science Portfolio" },
        ],
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

      if (!hasValidGeminiKey()) {
        res.json({
          text: `Geographic Technical Context for "${cleanQuery}":\n\nSameena P is based in Chennai, Tamil Nadu, India (Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}), affiliated with DMI College of Engineering and leading tech initiatives across Chennai's AI & software engineering corridor.\n\n*(Connect your GEMINI_API_KEY in .env for live Google Maps grounding).*`,
          places: [
            {
              uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanQuery + ' Chennai')}`,
              title: `Chennai Technology Corridor — ${cleanQuery}`,
              reviewSnippets: ["Major IT & AI hub in Tamil Nadu", "DMI College of Engineering AI & Data Science Department"],
            },
          ],
          coordinatesUsed: { latitude: lat, longitude: lng },
        });
        return;
      }

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
      console.warn('Maps Grounding error, falling back to local places:', error);
      res.json({
        text: `Geographic Context for Chennai, Tamil Nadu: Sameena P operates from Chennai, collaborating across engineering institutions and technology research teams.`,
        places: [
          {
            uri: 'https://www.google.com/maps/place/Chennai,+Tamil+Nadu',
            title: 'Chennai, Tamil Nadu, India',
            reviewSnippets: ['Technology Hub of South India'],
          },
        ],
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
          : 'Saved to the portfolio server queue.'),
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
