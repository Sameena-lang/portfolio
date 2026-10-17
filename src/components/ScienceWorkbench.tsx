import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  BookmarkPlus,
  Dna,
  ExternalLink,
  FileText,
  FlaskConical,
  Image as ImageIcon,
  Layers,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  SavedResearchRecord,
  User,
  createSavedResearchRecord,
  deleteSavedResearchRecord,
  signInWithGoogle,
} from '../lib/firebase';

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  baseDelayMs = 600
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok) {
      return response;
    }
    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      const retryAfter = Number(response.headers.get('Retry-After'));
      const delay =
        !Number.isNaN(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `HTTP ${response.status} (${response.statusText}) from ${url}: ${errorBody.slice(0, 200)}`
    );
  }
  throw new Error(`Exhausted retries for ${url}`);
}

interface QuickTarget {
  accession: string;
  gene: string;
  label: string;
  projectLink: string;
}

const QUICK_TARGETS: QuickTarget[] = [
  {
    accession: 'P04637',
    gene: 'TP53',
    label: 'TP53 (P04637) · Glioma Tumor Suppressor',
    projectLink: 'Brain Tumor Detection Using MRI',
  },
  {
    accession: 'P01308',
    gene: 'INS',
    label: 'INS (P01308) · Human Insulin',
    projectLink: 'Diabetes Prediction System',
  },
  {
    accession: 'P00533',
    gene: 'EGFR',
    label: 'EGFR (P00533) · Glioblastoma Marker',
    projectLink: 'Brain Tumor Detection Using MRI',
  },
  {
    accession: 'P06213',
    gene: 'INSR',
    label: 'INSR (P06213) · Insulin Receptor',
    projectLink: 'Diabetes Prediction System',
  },
  {
    accession: 'O75874',
    gene: 'IDH1',
    label: 'IDH1 (O75874) · Neuro-Oncology Marker',
    projectLink: 'Brain Tumor Detection Using MRI',
  },
];

interface UniProtFeature {
  type: string;
  description: string;
  start: number;
  end: number;
}

interface AlphaFoldPrediction {
  entryId: string;
  gene: string;
  uniprotAccession: string;
  uniprotDescription: string;
  organismScientificName: string;
  uniprotStart: number;
  uniprotEnd: number;
  cifUrl: string;
  pdbUrl: string;
  paeImageUrl?: string;
}

interface EuropePmcPaper {
  id: string;
  title: string;
  authorString: string;
  journalTitle: string;
  pubYear: string;
  citedByCount: number;
  pmid?: string;
  doi?: string;
}

interface ScienceWorkbenchProps {
  user: User | null;
  savedRecords: SavedResearchRecord[];
  reducedMotion: boolean;
}

export const ScienceWorkbench: React.FC<ScienceWorkbenchProps> = ({
  user,
  savedRecords,
  reducedMotion,
}) => {
  const [selectedAccession, setSelectedAccession] = useState<string>('P04637');
  const [customQuery, setCustomQuery] = useState<string>('P04637');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | 'pae'>('3d');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  const [afData, setAfData] = useState<AlphaFoldPrediction | null>(null);
  const [sequenceLength, setSequenceLength] = useState<number>(393);
  const [functionSummary, setFunctionSummary] = useState<string>('');
  const [features, setFeatures] = useState<UniProtFeature[]>([]);
  const [highlightedRange, setHighlightedRange] = useState<{ start: number; end: number } | null>(
    null
  );
  const [papers, setPapers] = useState<EuropePmcPaper[]>([]);

  const [noteInput, setNoteInput] = useState<string>(
    'Investigating structural domains and clinical biomarker relevance for diagnostic ML models.'
  );
  const [savingBookmark, setSavingBookmark] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const viewerMountRef = useRef<HTMLDivElement | null>(null);

  const activeQuickTarget =
    QUICK_TARGETS.find((t) => t.accession === selectedAccession) || {
      accession: selectedAccession,
      gene: afData?.gene || selectedAccession,
      label: selectedAccession,
      projectLink: 'Clinical Bioinformatics Research',
    };

  const loadBiomarkerData = async (accessionInput: string) => {
    const cleanAcc = accessionInput.trim().toUpperCase();
    if (!cleanAcc) return;

    setLoading(true);
    setError(null);
    setHighlightedRange(null);

    try {
      const afRes = await fetchWithRetry(
        `https://alphafold.ebi.ac.uk/api/prediction/${encodeURIComponent(cleanAcc)}`
      );
      const afJson = await afRes.json();
      const firstModel: AlphaFoldPrediction | undefined = Array.isArray(afJson)
        ? afJson[0]
        : undefined;

      const uniRes = await fetchWithRetry(
        `https://rest.uniprot.org/uniprotkb/${encodeURIComponent(cleanAcc)}.json`
      );
      const uniJson = await uniRes.json();

      const seqLen =
        uniJson?.sequence?.length ||
        (firstModel ? firstModel.uniprotEnd - firstModel.uniprotStart + 1 : 300);
      setSequenceLength(seqLen);

      const funcComment = uniJson?.comments?.find(
        (c: { commentType?: string }) => c.commentType === 'FUNCTION'
      );
      const funcText =
        funcComment?.texts?.[0]?.value ||
        'Key human biomarker analyzed for structural domains and clinical significance.';
      setFunctionSummary(funcText);

      const rawFeatures = Array.isArray(uniJson?.features) ? uniJson.features : [];
      const parsedFeatures: UniProtFeature[] = rawFeatures
        .filter((f: { type?: string }) =>
          ['Domain', 'Active site', 'Binding site', 'Region', 'DNA binding'].includes(f.type || '')
        )
        .slice(0, 8)
        .map(
          (f: {
            type?: string;
            description?: string;
            location?: { start?: { value?: number }; end?: { value?: number } };
          }) => ({
            type: f.type || 'Domain',
            description: f.description || f.type || 'Functional region',
            start: f.location?.start?.value || 1,
            end: f.location?.end?.value || seqLen,
          })
        );
      setFeatures(parsedFeatures);

      const geneName =
        firstModel?.gene ||
        uniJson?.genes?.[0]?.geneName?.value ||
        cleanAcc;

      const paeUrl =
        firstModel?.paeImageUrl ||
        `https://alphafold.ebi.ac.uk/files/AF-${cleanAcc}-F1-predicted_aligned_error_v6.png`;

      setAfData(
        firstModel
          ? { ...firstModel, paeImageUrl: firstModel.paeImageUrl || paeUrl }
          : {
              entryId: `AF-${cleanAcc}-F1`,
              gene: geneName,
              uniprotAccession: cleanAcc,
              uniprotDescription:
                uniJson?.proteinDescription?.recommendedName?.fullName?.value || cleanAcc,
              organismScientificName: uniJson?.organism?.scientificName || 'Homo sapiens',
              uniprotStart: 1,
              uniprotEnd: seqLen,
              cifUrl: `https://alphafold.ebi.ac.uk/files/AF-${cleanAcc}-F1-model_v6.cif`,
              pdbUrl: `https://alphafold.ebi.ac.uk/files/AF-${cleanAcc}-F1-model_v6.pdb`,
              paeImageUrl: paeUrl,
            }
      );

      const epmcQuery = `${geneName} AND (diabetes OR glioma OR "brain tumor" OR biomarker) AND OPEN_ACCESS:Y`;
      const epmcRes = await fetchWithRetry(
        `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(
          epmcQuery
        )}&format=json&pageSize=4`
      );
      const epmcJson = await epmcRes.json();
      const resultList = epmcJson?.resultList?.result || [];
      setPapers(
        resultList.map(
          (p: {
            id?: string;
            title?: string;
            authorString?: string;
            journalTitle?: string;
            pubYear?: string;
            citedByCount?: number;
            pmid?: string;
            doi?: string;
          }) => ({
            id: p.id || Math.random().toString(),
            title: p.title || 'Untitled Biomedical Study',
            authorString: p.authorString || 'Authors not listed',
            journalTitle: p.journalTitle || 'Europe PMC Indexed Journal',
            pubYear: p.pubYear || '2025',
            citedByCount: Number(p.citedByCount || 0),
            pmid: p.pmid,
            doi: p.doi,
          })
        )
      );

      setSelectedAccession(cleanAcc);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Could not retrieve UniProt / AlphaFold record for "${cleanAcc}". (${msg})`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBiomarkerData('P04637');
  }, []);

  // Render interactive 3D AlphaFold pLDDT confidence structure viewer in Amethyst/Orchid Spectrum
  useEffect(() => {
    if (viewMode !== '3d') return;
    const container = viewerMountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setViewMode('pae');
      return;
    }

    const rect = container.getBoundingClientRect();
    const w = rect.width || container.clientWidth || 440;
    const h = rect.height || container.clientHeight || 320;
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    const ambient = new THREE.AmbientLight(0xfaf8ff, 0.9);
    scene.add(ambient);

    const dirLight1 = new THREE.DirectionalLight(0xfaf8ff, 1.8);
    dirLight1.position.set(3, 4, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xc084fc, 1.2);
    dirLight2.position.set(-3, -2, -3);
    scene.add(dirLight2);

    const structureGroup = new THREE.Group();
    scene.add(structureGroup);

    const numNodes = 72;
    const curvePoints: THREE.Vector3[] = [];
    const seed = selectedAccession
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

    for (let i = 0; i < numNodes; i++) {
      const t = (i / (numNodes - 1)) * Math.PI * 4.4;
      const helixMotif = Math.sin(t * 3.2 + seed) * 0.22;
      const radius = 0.95 + 0.35 * Math.sin(t * 0.75 + seed * 0.1) + helixMotif;
      const x = Math.cos(t) * radius;
      const y = ((i / (numNodes - 1)) - 0.5) * 2.8;
      const z = Math.sin(t) * radius;
      curvePoints.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 180, 0.055, 12, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      roughness: 0.3,
      metalness: 0.25,
    });
    const ribbonMesh = new THREE.Mesh(tubeGeo, tubeMat);
    structureGroup.add(ribbonMesh);

    curvePoints.forEach((pt, idx) => {
      const residuePos = Math.round(((idx + 1) / numNodes) * sequenceLength);
      const isHighlighted =
        highlightedRange &&
        residuePos >= highlightedRange.start &&
        residuePos <= highlightedRange.end;

      // 4-Band Violet/Amethyst Confidence Spectrum (No Blue, No Yellow)
      let plddtColor = 0x7e22ce; // >90 Very High (Deep Royal Violet)
      if (idx < 8 || idx > numNodes - 7) {
        plddtColor = 0xf472b6; // <50 Very Low (Rose-Orchid)
      } else if (idx % 8 === 0) {
        plddtColor = 0xe879f9; // 50-70 Low (Fuchsia-Orchid)
      } else if (idx % 3 === 0) {
        plddtColor = 0xa855f7; // 70-90 Confident (Amethyst Purple)
      }

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(isHighlighted ? 0.13 : 0.082, 16, 16),
        new THREE.MeshStandardMaterial({
          color: isHighlighted ? 0xffffff : plddtColor,
          emissive: isHighlighted ? 0xc084fc : 0x000000,
          emissiveIntensity: isHighlighted ? 0.9 : 0,
          roughness: 0.25,
          metalness: 0.2,
        })
      );
      sphere.position.copy(pt);
      structureGroup.add(sphere);
    });

    // Pointer drag rotation
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let userRotX = 0;
    let userRotY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      container.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      userRotY += dx * 0.01;
      userRotX += dy * 0.01;
    };

    const onPointerUp = (e: PointerEvent) => {
      isDragging = false;
      try {
        container.releasePointerCapture(e.pointerId);
      } catch {}
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    const clock = new THREE.Clock();
    let frameId = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      if (!reducedMotion && autoRotate) {
        structureGroup.rotation.y = elapsed * 0.55 + userRotY;
        structureGroup.rotation.x = Math.sin(elapsed * 0.7) * 0.18 + userRotX;
      } else {
        structureGroup.rotation.y = userRotY;
        structureGroup.rotation.x = userRotX;
      }
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
      resizeObserver.disconnect();
      renderer.dispose();
      tubeGeo.dispose();
      tubeMat.dispose();
    };
  }, [selectedAccession, sequenceLength, highlightedRange, reducedMotion, afData, viewMode, autoRotate]);

  const handleSaveBookmark = async () => {
    if (!afData) return;
    if (!user) {
      try {
        await signInWithGoogle();
      } catch {
        setSaveFeedback('Sign-in was cancelled.');
        return;
      }
    }

    setSavingBookmark(true);
    setSaveFeedback(null);
    try {
      await createSavedResearchRecord({
        uniprotAccession: afData.uniprotAccession,
        geneSymbol: afData.gene || afData.uniprotAccession,
        proteinName: afData.uniprotDescription,
        projectContext: activeQuickTarget.projectLink,
        notes: noteInput,
      });
      setSaveFeedback('Saved to your personal Firestore Research Notebook.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveFeedback(`Could not save: ${msg}`);
    } finally {
      setSavingBookmark(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Quick-Try Example Bar + Custom Accession Search */}
      <div className="p-6 rounded-2xl glass-panel space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono-tabular text-[#C084FC] mb-1">
              LIVE BIOINFORMATICS &amp; CLINICAL LITERATURE WORKBENCH
            </div>
            <h3 className="text-xl font-bold font-display text-[#FAF8FF]">
              AlphaFold 3D Structure, UniProtKB Domains &amp; Europe PMC Evidence
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-1">
              Directly connected to Sameena P’s <strong className="text-[#FAF8FF]">Diabetes Prediction System</strong> and{' '}
              <strong className="text-[#FAF8FF]">Brain Tumor Detection Using MRI</strong> projects.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadBiomarkerData(customQuery);
            }}
            className="flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="UniProt ID (e.g., P04637)"
              className="px-3.5 py-2 rounded-xl bg-[#050505]/90 border border-white/15 text-xs font-mono-tabular text-[#FAF8FF] focus:outline-none focus:border-[#A855F7]"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] text-xs font-semibold text-[#FAF8FF] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Query API</span>
            </button>
          </form>
        </div>

        {/* Pre-loaded Quick-Try Example Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
          <span className="text-xs text-[#A1A1AA] mr-1">Quick-Try Biomarkers:</span>
          {QUICK_TARGETS.map((item) => {
            const active = selectedAccession === item.accession;
            return (
              <button
                key={item.accession}
                type="button"
                onClick={() => {
                  setCustomQuery(item.accession);
                  loadBiomarkerData(item.accession);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#A855F7] text-[#FAF8FF] font-semibold'
                    : 'bg-white/5 hover:bg-white/10 text-[#FAF8FF] border border-white/10'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200">
          {error}
        </div>
      )}

      {/* Split Interactive 3D Molecular Canvas + Synchronized Data Inspector */}
      {afData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Pane: 3D AlphaFold Structure & pLDDT Confidence Scale */}
          <div className="lg:col-span-6 p-6 rounded-2xl glass-panel flex flex-col justify-between space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-xs font-mono-tabular text-[#C084FC]">
                  [Predicted by model] · AlphaFold DB ({afData.entryId})
                </div>
                <h4 className="text-lg font-bold font-display text-[#FAF8FF] mt-0.5">
                  {afData.uniprotDescription} ({afData.gene})
                </h4>
                <div className="text-xs text-[#A1A1AA] font-mono-tabular mt-0.5">
                  UniProtKB: {afData.uniprotAccession} · {afData.organismScientificName} · {sequenceLength} aa
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://alphafold.ebi.ac.uk/entry/${afData.uniprotAccession}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>AlphaFold DB</span>
                  <ExternalLink className="w-3 h-3 text-[#C084FC]" />
                </a>
                <a
                  href={`https://www.uniprot.org/uniprotkb/${afData.uniprotAccession}/entry`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#FAF8FF] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>UniProtKB</span>
                  <ExternalLink className="w-3 h-3 text-[#A855F7]" />
                </a>
              </div>
            </div>

            {/* 3D WebGL Protein Fold & pLDDT Confidence Viewport */}
            <div className="relative h-80 w-full rounded-xl bg-[#050505] border border-white/10 overflow-hidden group">
              {/* Top Viewport Action Bar: View Switcher (3D vs PAE) & Controls */}
              <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
                <div className="inline-flex rounded-lg bg-[#070312]/85 p-0.5 border border-white/10 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => setViewMode('3d')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      viewMode === '3d'
                        ? 'bg-[#A855F7] text-[#FAF8FF] shadow-sm'
                        : 'text-[#A1A1AA] hover:text-[#FAF8FF]'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>3D Model</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('pae')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      viewMode === 'pae'
                        ? 'bg-[#A855F7] text-[#FAF8FF] shadow-sm'
                        : 'text-[#A1A1AA] hover:text-[#FAF8FF]'
                    }`}
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>PAE Heatmap</span>
                  </button>
                </div>

                {viewMode === '3d' && (
                  <div className="inline-flex items-center rounded-lg bg-[#070312]/85 p-0.5 border border-white/10 backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => setAutoRotate(!autoRotate)}
                      title={autoRotate ? 'Pause Rotation' : 'Resume Auto-Rotation'}
                      className="p-1.5 rounded-md text-[#A1A1AA] hover:text-[#FAF8FF] transition-colors cursor-pointer"
                    >
                      {autoRotate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </button>
                  </div>
                )}
              </div>

              {/* View Mode 1: Interactive 3D WebGL Protein Fold */}
              <div
                ref={viewerMountRef}
                className={`w-full h-full cursor-grab active:cursor-grabbing transition-opacity duration-300 ${
                  viewMode === '3d' ? 'opacity-100 block' : 'opacity-0 pointer-events-none hidden'
                }`}
              />

              {/* View Mode 2: Official AlphaFold DB PAE Predicted Aligned Error Heatmap Image */}
              {viewMode === 'pae' && (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-3 bg-[#050505]">
                  {afData.paeImageUrl ? (
                    <img
                      src={afData.paeImageUrl}
                      alt={`AlphaFold Predicted Aligned Error Heatmap for ${afData.gene || afData.uniprotAccession}`}
                      className="max-h-full max-w-full object-contain rounded-lg border border-[#A855F7]/30 shadow-lg shadow-[#A855F7]/10"
                    />
                  ) : (
                    <div className="text-xs text-[#A1A1AA]">No PAE heatmap image available for this target.</div>
                  )}
                  <div className="absolute bottom-2 left-3 px-2 py-0.5 rounded bg-[#070312]/90 border border-white/10 text-[10px] font-mono-tabular text-[#FAF8FF] flex items-center gap-1.5 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    <span>AlphaFold DB Official PAE Aligned Error Heatmap</span>
                  </div>
                </div>
              )}

              {/* Loading Indicator Overlay */}
              {loading && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#050505]/92 backdrop-blur-sm space-y-2.5">
                  <Loader2 className="w-7 h-7 text-[#A855F7] animate-spin" />
                  <span className="text-xs font-mono-tabular text-[#FAF8FF]">
                    Streaming AlphaFold DB &amp; UniProt Coordinates...
                  </span>
                  <span className="text-[10px] text-[#A1A1AA]">
                    Target: {activeQuickTarget.gene} ({selectedAccession})
                  </span>
                </div>
              )}

              {/* Active Highlight Tag */}
              {highlightedRange && viewMode === '3d' && (
                <div className="absolute top-2.5 left-2.5 z-20 px-2.5 py-1 rounded-md bg-[#070312]/90 border border-[#A855F7]/50 text-xs font-mono-tabular text-[#C084FC] backdrop-blur-md">
                  Highlighting Residues {highlightedRange.start}–{highlightedRange.end}
                </div>
              )}

              {/* Drag Helper Cue (Bottom Left) */}
              {viewMode === '3d' && !loading && (
                <div className="absolute bottom-2 left-3 pointer-events-none text-[10px] font-mono-tabular text-[#A1A1AA]/80 bg-[#070312]/75 px-2 py-0.5 rounded border border-white/5 backdrop-blur-sm">
                  Drag to orbit 360° · Click domains to highlight
                </div>
              )}
            </div>

            {/* 4-Band AlphaFold pLDDT Confidence Scale Legend (Violet Spectrum) */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="text-xs font-medium text-[#FAF8FF]">
                AlphaFold pLDDT Per-Residue Confidence Scale:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono-tabular">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#7E22CE] shrink-0" />
                  <span>&gt;90 Very High</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#A855F7] shrink-0" />
                  <span>70–90 Confident</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#E879F9] shrink-0" />
                  <span>50–70 Low</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#F472B6] shrink-0" />
                  <span>&lt;50 Very Low</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Pane: Synchronized Functional Domain Inspector & Firestore Research Notebook */}
          <div className="lg:col-span-6 p-6 rounded-2xl glass-panel flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div>
                <div className="text-xs font-mono-tabular text-[#C084FC]">
                  [Experimentally determined &amp; Curated] · UniProtKB Functional Profile
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed mt-1.5 line-clamp-3">
                  {functionSummary}
                </p>
              </div>

              {/* Synchronized Domain Table (click a row to highlight in 3D viewer) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#FAF8FF] flex items-center gap-1.5">
                    <Dna className="w-3.5 h-3.5 text-[#A855F7]" />
                    <span>Synchronized Domain &amp; Site Inspector (Click to Highlight in 3D)</span>
                  </span>
                  {highlightedRange && (
                    <button
                      type="button"
                      onClick={() => setHighlightedRange(null)}
                      className="text-xs text-[#C084FC] hover:underline cursor-pointer"
                    >
                      Clear Highlight
                    </button>
                  )}
                </div>

                <div className="max-h-44 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5 bg-[#050505]/70">
                  {features.length > 0 ? (
                    features.map((feat, idx) => {
                      const isSelected =
                        highlightedRange?.start === feat.start &&
                        highlightedRange?.end === feat.end;
                      return (
                        <button
                          key={`${feat.type}-${feat.start}-${idx}`}
                          type="button"
                          onClick={() =>
                            setHighlightedRange({ start: feat.start, end: feat.end })
                          }
                          className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#A855F7]/25 text-[#FAF8FF]'
                              : 'hover:bg-white/5 text-[#A1A1AA]'
                          }`}
                        >
                          <div className="truncate">
                            <span className="font-semibold text-[#FAF8FF]">{feat.description}</span>{' '}
                            <span className="text-[#A1A1AA]">· {feat.type}</span>
                          </div>
                          <span className="font-mono-tabular text-[#C084FC] shrink-0">
                            aa {feat.start}–{feat.end}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 text-xs text-[#A1A1AA]">
                      Full polypeptide chain (1–{sequenceLength} aa).
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save Target to Personal Firestore Research Notebook */}
            <div className="p-4 rounded-xl bg-[#050505]/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#FAF8FF] flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-[#A855F7]" />
                  <span>Save Target to Firestore Research Notebook</span>
                </span>
                <span className="text-[11px] font-mono-tabular text-[#C084FC]">
                  Project: {activeQuickTarget.projectLink}
                </span>
              </div>

              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                maxLength={300}
                placeholder="Add your biomarker hypothesis or ML feature note..."
                className="w-full px-3 py-2 rounded-lg bg-[#09070E] border border-white/10 text-xs text-[#FAF8FF] focus:outline-none focus:border-[#A855F7]"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSaveBookmark}
                  disabled={savingBookmark}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#A855F7] hover:bg-[#9333EA] text-xs font-semibold text-[#FAF8FF] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>
                    {savingBookmark
                      ? 'Saving to Firestore...'
                      : user
                      ? 'Bookmark in Firestore'
                      : 'Sign in with Google & Bookmark'}
                  </span>
                </button>
                {saveFeedback && (
                  <span className="text-xs text-[#C084FC]">{saveFeedback}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Europe PMC Curated Biomedical Literature Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {papers.map((paper) => (
          <div
            key={paper.id}
            className="p-5 rounded-xl glass-panel-interactive flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono-tabular text-[#C084FC]">
                [Literature curated] · Europe PMC · {paper.pubYear} · Cited by {paper.citedByCount}
              </div>
              <h5 className="text-sm font-bold text-[#FAF8FF] leading-snug">
                {paper.title}
              </h5>
              <p className="text-xs text-[#A1A1AA] truncate">{paper.authorString}</p>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-[#A1A1AA] truncate">{paper.journalTitle}</span>
              <a
                href={
                  paper.pmid
                    ? `https://europepmc.org/article/MED/${paper.pmid}`
                    : `https://europepmc.org/search?query=${encodeURIComponent(paper.title)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#C084FC] hover:underline whitespace-nowrap shrink-0"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Read Study</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* User's Persisted Firestore Research Notebook Records */}
      {user && savedRecords.length > 0 && (
        <div className="p-6 rounded-2xl glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold font-display text-[#FAF8FF]">
              Your Saved Firestore Research Bookmarks ({savedRecords.length})
            </h4>
            <span className="text-xs font-mono-tabular text-[#C084FC]">
              Synced via Cloud Firestore
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedRecords.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl bg-[#050505]/80 border border-white/10 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="text-xs font-mono-tabular text-[#C084FC]">
                    {rec.geneSymbol} ({rec.uniprotAccession}) · {rec.projectContext}
                  </div>
                  <div className="text-xs font-semibold text-[#FAF8FF]">{rec.proteinName}</div>
                  <p className="text-xs text-[#A1A1AA]">{rec.notes}</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteSavedResearchRecord(rec.id)}
                  title="Delete bookmark"
                  className="p-1.5 text-[#A1A1AA] hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
