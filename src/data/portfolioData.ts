import diabetesImg from '../assets/images/purple_diabetes_analytics_1791809091307.jpg';
import mriImg from '../assets/images/purple_mri_brain_tumor_1791809104821.jpg';
import seoImg from '../assets/images/purple_seo_brilliance_1791809117621.jpg';
import instaguardImg from '../assets/images/purple_instaguard_safety_1791809129331.jpg';
import cateringImg from '../assets/images/purple_annapathiram_catering_1791809141417.jpg';

export interface SkillItem {
  name: string;
  category: string;
  context: string;
}

export interface SkillCategory {
  id: string;
  title: string;
  subtitle: string;
  skills: SkillItem[];
}

export interface ProjectItem {
  id: string;
  index: string;
  title: string;
  category: 'AI & Machine Learning' | 'Full-Stack & SaaS' | 'Web Application';
  technologies: string[];
  description: string;
  visualConcept: string;
  image: string;
  architectureHighlights: string[];
  methodology: string;
  githubUrl: string | null;
  liveUrl: string | null;
}

export interface ExperienceItem {
  id: string;
  company: string;
  period: string;
  role: string;
  areas: string[];
  summary: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  organization: string;
  date: string;
  type: 'Hackathon Award' | 'Hackathon Participation' | 'Technical Certification' | 'Internship Credential';
  highlight?: boolean;
  details: string;
}

export const PERSONAL_BRAND = {
  name: 'Sameena P',
  kicker: 'AI & Data Science Engineer',
  roles: [
    'AI & Data Science Engineer',
    'Full-Stack Developer',
    'AI/ML Enthusiast',
    'UI/UX Designer',
    'SEO Analyst',
  ],
  cyclingHeadlines: [
    'Building Intelligent Digital Experiences.',
    'Turning Ideas into AI-Powered Products.',
    'Engineering the Future, One Project at a Time.',
  ],
  intro:
    'I’m Sameena P, an AI and Data Science undergraduate passionate about building intelligent applications, modern web experiences, and meaningful technology solutions. I combine AI/ML, full-stack development, UI/UX, and analytical thinking to turn ideas into real products.',
  location: 'Chennai, Tamil Nadu, India',
  education: {
    degree: 'B.Tech in Artificial Intelligence and Data Science',
    institution: 'DMI College of Engineering',
    cgpa: 8.5,
    expectedGraduation: 2028,
  },
  email: 'sameena3437@gmail.com',
  phone: '9940543897',
  philosophy: 'Creative mind. AI-driven thinking. Full-stack execution.',
};

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: 'programming',
    title: 'Programming',
    subtitle: 'Core languages for algorithmic problem-solving and modern web interfaces',
    skills: [
      {
        name: 'Python',
        category: 'Programming',
        context: 'Primary language for machine learning pipelines, TensorFlow models, and FastAPI backends.',
      },
      {
        name: 'JavaScript',
        category: 'Programming',
        context: 'Interactive frontend state orchestration, asynchronous API integration, and Node.js services.',
      },
      {
        name: 'HTML',
        category: 'Programming',
        context: 'Semantic document structure, accessibility compliance, and search engine crawlability.',
      },
      {
        name: 'CSS',
        category: 'Programming',
        context: 'Responsive grid layouts, fluid typography, and glassmorphic design systems.',
      },
    ],
  },
  {
    id: 'ai-ml',
    title: 'AI and Machine Learning',
    subtitle: 'End-to-end data science workflows from raw preprocessing to neural architecture evaluation',
    skills: [
      {
        name: 'Deep Learning',
        category: 'AI and Machine Learning',
        context: 'Multi-layer neural network training and representation learning for diagnostic tasks.',
      },
      {
        name: 'CNN',
        category: 'AI and Machine Learning',
        context: 'Convolutional Neural Networks applied to cranial MRI scan classification and medical imaging.',
      },
      {
        name: 'Data Preprocessing',
        category: 'AI and Machine Learning',
        context: 'Handling missing values, outlier treatment, and dataset curation for clinical and web analytics.',
      },
      {
        name: 'Exploratory Data Analysis',
        category: 'AI and Machine Learning',
        context: 'Statistical distribution analysis, feature correlation mapping, and hypothesis validation.',
      },
      {
        name: 'Feature Normalization',
        category: 'AI and Machine Learning',
        context: 'Standardization and min-max scaling to stabilize gradient descent and distance-based classifiers.',
      },
      {
        name: 'Model Evaluation',
        category: 'AI and Machine Learning',
        context: 'Comparative benchmarking across accuracy, precision, recall, F1-score, and confusion matrices.',
      },
    ],
  },
  {
    id: 'frameworks',
    title: 'Frameworks and Libraries',
    subtitle: 'Production libraries for ML deployment, interactive UIs, and RESTful API backends',
    skills: [
      {
        name: 'TensorFlow',
        category: 'Frameworks and Libraries',
        context: 'Designing, training, and serializing deep convolutional networks for image classification.',
      },
      {
        name: 'Streamlit',
        category: 'Frameworks and Libraries',
        context: 'Rapid interactive analytical dashboards for real-time clinical and ML model inference.',
      },
      {
        name: 'React.js',
        category: 'Frameworks and Libraries',
        context: 'Component-driven single-page applications, SaaS dashboards, and responsive user experiences.',
      },
      {
        name: 'Node.js',
        category: 'Frameworks and Libraries',
        context: 'Scalable server-side JavaScript runtime for web analyzers and safety platforms.',
      },
      {
        name: 'Express.js',
        category: 'Frameworks and Libraries',
        context: 'Structured REST API routing, middleware pipelines, and backend service orchestration.',
      },
      {
        name: 'FastAPI',
        category: 'Frameworks and Libraries',
        context: 'High-performance asynchronous Python backend APIs with automatic schema validation.',
      },
    ],
  },
  {
    id: 'databases',
    title: 'Databases',
    subtitle: 'Relational and document data persistence for full-stack applications',
    skills: [
      {
        name: 'PostgreSQL',
        category: 'Databases',
        context: 'Relational schema design and structured querying for SEO audit reports and analytics.',
      },
      {
        name: 'MongoDB',
        category: 'Databases',
        context: 'Flexible document storage for social safety logs, catering bookings, and media metadata.',
      },
    ],
  },
  {
    id: 'ml-algorithms',
    title: 'Machine Learning Algorithms',
    subtitle: 'Supervised classification models benchmarked on structured clinical datasets',
    skills: [
      {
        name: 'Logistic Regression',
        category: 'Machine Learning Algorithms',
        context: 'Baseline probabilistic binary classification for clinical risk prediction.',
      },
      {
        name: 'Decision Tree',
        category: 'Machine Learning Algorithms',
        context: 'Interpretable rule-based feature splitting for non-linear diagnostic boundaries.',
      },
      {
        name: 'Random Forest',
        category: 'Machine Learning Algorithms',
        context: 'Ensemble bagging classifier reducing variance across multi-feature medical datasets.',
      },
      {
        name: 'K-Nearest Neighbors (KNN)',
        category: 'Machine Learning Algorithms',
        context: 'Distance-weighted instance classification over normalized clinical feature spaces.',
      },
    ],
  },
];

export const FEATURED_PROJECTS: ProjectItem[] = [
  {
    id: 'diabetes-prediction',
    index: '01',
    title: 'Diabetes Prediction System',
    category: 'AI & Machine Learning',
    technologies: ['Python', 'Machine Learning', 'Streamlit'],
    description:
      'Built a diabetes prediction application featuring data preprocessing, exploratory data analysis, feature normalization, and comparison of Logistic Regression, Decision Tree, Random Forest, and KNN models.',
    visualConcept: 'A futuristic healthcare analytics dashboard with data visualizations.',
    image: diabetesImg,
    architectureHighlights: [
      'Structured data preprocessing pipeline with missing-value imputation and outlier inspection',
      'Exploratory Data Analysis (EDA) visualizing feature correlations and biomarker distributions',
      'Feature normalization ensuring uniform scale across distance-based and linear classifiers',
      'Side-by-side benchmarking of Logistic Regression, Decision Tree, Random Forest, and KNN through an interactive Streamlit interface',
    ],
    methodology:
      'Engineered an end-to-end supervised learning workflow in Python that transforms raw clinical attributes into normalized feature vectors, evaluates four distinct classification algorithms, and exposes interactive inference controls via Streamlit.',
    githubUrl: null,
    liveUrl: null,
  },
  {
    id: 'brain-tumor-detection',
    index: '02',
    title: 'Brain Tumor Detection Using MRI',
    category: 'AI & Machine Learning',
    technologies: ['Python', 'TensorFlow', 'CNN', 'Streamlit'],
    description:
      'Developed a CNN-based deep learning application to classify brain tumor images from MRI scans through a Streamlit interface.',
    visualConcept: 'A scientific medical-imaging interface with MRI visualizations.',
    image: mriImg,
    architectureHighlights: [
      'Convolutional Neural Network (CNN) architecture implemented in TensorFlow for spatial feature extraction',
      'MRI image preprocessing pipeline including resizing, intensity scaling, and tensor batching',
      'Automated classification of cranial MRI scans with clear diagnostic output presentation',
      'Interactive Streamlit web interface enabling direct MRI scan upload and real-time model inference',
    ],
    methodology:
      'Trained a deep convolutional network in TensorFlow tailored for cranial MRI imagery and wrapped the inference pipeline in an accessible Streamlit diagnostic workstation.',
    githubUrl: null,
    liveUrl: null,
  },
  {
    id: 'seo-brilliance',
    index: '03',
    title: 'SEO Brilliance — AI SEO Website Analyzer',
    category: 'Full-Stack & SaaS',
    technologies: ['React.js', 'Node.js', 'PostgreSQL'],
    description:
      'Developed a SaaS-style website analyzer focused on SEO audits and intelligent SEO recommendations.',
    visualConcept: 'A dark analytics dashboard featuring website performance insights and search optimization reports.',
    image: seoImg,
    architectureHighlights: [
      'SaaS-style analytical dashboard built with React.js for inspecting technical SEO health',
      'Node.js backend service orchestrating page metadata inspection and audit generation',
      'PostgreSQL relational storage persisting historical website audit reports and optimization checklists',
      'Actionable SEO recommendation engine surfacing metadata, structure, and search visibility improvements',
    ],
    methodology:
      'Combined domain expertise in SEO analysis with full-stack React.js, Node.js, and PostgreSQL engineering to deliver structured website audits and optimization guidance.',
    githubUrl: null,
    liveUrl: null,
  },
  {
    id: 'instaguard-ai',
    index: '04',
    title: 'InstaGuard AI',
    category: 'Full-Stack & SaaS',
    technologies: ['React.js', 'Node.js', 'MongoDB'],
    description:
      'Designed an AI-powered social media safety platform concept featuring harassment detection, content analysis, incident reporting, and safety analytics.',
    visualConcept: 'A futuristic digital safety dashboard with clear data visualization.',
    image: instaguardImg,
    architectureHighlights: [
      'Automated harassment detection and harmful content analysis workflow',
      'Structured incident reporting system for documenting and triaging online safety violations',
      'React.js safety analytics dashboard visualizing moderation trends and content classifications',
      'Node.js and MongoDB backend architecture for storing incident records and analysis logs',
    ],
    methodology:
      'Architected a full-stack digital safety concept combining React.js visualization, Node.js API services, and MongoDB document persistence to address online harassment and content moderation.',
    githubUrl: null,
    liveUrl: null,
  },
  {
    id: 'annapathiram-catering',
    index: '05',
    title: 'Annapathiram Catering Web Application',
    category: 'Web Application',
    technologies: ['React.js', 'FastAPI', 'MongoDB'],
    description:
      'Built a catering website featuring menus, gallery, testimonials, and booking inquiries, supported by backend functionality for bookings, authentication, media uploads, and dashboard analytics.',
    visualConcept: 'An elegant catering and hospitality website preview.',
    image: cateringImg,
    architectureHighlights: [
      'Customer-facing React.js experience showcasing curated menus, event gallery, and client testimonials',
      'End-to-end event booking inquiry workflow connected to a Python FastAPI backend',
      'Administrative authentication, media upload handling, and MongoDB persistence',
      'Management dashboard analytics tracking booking inquiries and hospitality operations',
    ],
    methodology:
      'Delivered a complete full-stack hospitality platform pairing a refined React.js frontend with an asynchronous Python FastAPI and MongoDB backend supporting authentication, media management, and booking analytics.',
    githubUrl: null,
    liveUrl: null,
  },
];

export const EXPERIENCE_TIMELINE: ExperienceItem[] = [
  {
    id: 'tenam-software',
    company: 'Tenam Software Solutions',
    period: 'June 2026 — Present',
    role: 'Software Engineering & Analysis Intern',
    areas: ['Business Analysis', 'Software Testing', 'Software Development', 'SEO Analysis'],
    summary:
      'Contributing across the software delivery lifecycle including business requirements analysis, quality assurance and software testing, application development, and technical SEO analysis.',
  },
  {
    id: 'paper-heroes',
    company: 'Paper Heroes',
    period: 'July 2026 — August 2026',
    role: 'Research and Development (R&D)',
    areas: ['Research and Development (R&D)'],
    summary:
      'Focused on applied research and development initiatives, exploring technical concepts, prototyping solutions, and evaluating implementation feasibility.',
  },
  {
    id: 'vulture-lines',
    company: 'Vulture Lines',
    period: 'One-Month Internship',
    role: 'Artificial Intelligence and Machine Learning Intern',
    areas: ['Artificial Intelligence', 'Machine Learning'],
    summary:
      'Completed intensive hands-on internship training in Artificial Intelligence and Machine Learning workflows, model development, and data-driven problem solving.',
  },
];

export const ACHIEVEMENTS_AND_CERTS: AchievementItem[] = [
  {
    id: 'she-hackathon-2025',
    title: 'First Prize — She Hackathon 2025',
    organization: 'She Hackathon',
    date: 'March 8, 2025',
    type: 'Hackathon Award',
    highlight: true,
    details:
      'Awarded First Prize at She Hackathon 2025 on March 8, 2025, recognizing technical execution, problem-solving innovation, and end-to-end product presentation.',
  },
  {
    id: 'neurothon-hackathon',
    title: 'Neurothon Hackathon Participant',
    organization: 'Neurothon',
    date: 'Hackathon Participation',
    type: 'Hackathon Participation',
    details:
      'Collaborated in a competitive engineering sprint at the Neurothon Hackathon to design and prototype technology solutions under time constraints.',
  },
  {
    id: 'hcl-training',
    title: 'Networking, IAM & Virtualization/Cybersecurity Training',
    organization: 'HCL',
    date: 'Technical Training',
    type: 'Technical Certification',
    details:
      'Completed technical training with HCL covering enterprise Networking, Identity and Access Management (IAM), and Virtualization / Cybersecurity fundamentals.',
  },
  {
    id: 'msme-fundamentals',
    title: 'Computer Fundamentals Certification',
    organization: 'MSME',
    date: 'Certification',
    type: 'Technical Certification',
    details:
      'Certified by MSME in core Computer Fundamentals, foundational computing architecture, and digital systems.',
  },
  {
    id: 'vulture-lines-cert',
    title: 'AI/ML Internship Credential',
    organization: 'Vulture Lines',
    date: 'One-Month Internship',
    type: 'Internship Credential',
    details:
      'Completed one-month Artificial Intelligence and Machine Learning internship program at Vulture Lines.',
  },
  {
    id: 'tenam-internship-cert',
    title: 'Software Development, Testing, BA & SEO Internship',
    organization: 'Tenam Software Solutions',
    date: 'June 2026 — Present',
    type: 'Internship Credential',
    details:
      'Ongoing multi-disciplinary internship spanning Business Analysis, Software Testing, Software Development, and SEO Analysis at Tenam Software Solutions.',
  },
];
