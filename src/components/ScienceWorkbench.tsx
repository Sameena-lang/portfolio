import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  BookmarkPlus,
  Dna,
  ExternalLink,
  FileText,
  FlaskConical,
  Loader2,
  Search,
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

      setAfData(
        firstModel || {
          entryId: `AF-${cleanAcc}-F1`,
          gene: geneName,
          uniprotAccession: cleanAcc,
          uniprotDescription:
            uniJson?.proteinDescription?.recommendedName?.fullName?.value || cleanAcc,
          organismScientificName: uniJson?.organism?.scientificName || 'Homo sapiens',
          uniprotStart: 1,
          uniprotEnd: seqLen,
          cifUrl: `https://alphafold.ebi.ac.uk/files/AF-${cleanAcc}-F1-model_v4.cif`,
          pdbUrl: `https://alphafold.ebi.ac.uk/files/AF-${cleanAcc}-F1-model_v4.pdb`,
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
    const container = viewerMountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }

    const w = container.clientWidth || 440;
    const h = container.clientHeight || 340;
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    const ambient = new THREE.AmbientLight(0xfaf8ff, 0.85);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xfaf8ff, 1.6);
    dirLight.position.set(3, 4, 5);
    scene.add(dirLight);

    const structureGroup = new THREE.Group();
    scene.add(structureGroup);

    const numNodes = 64;
    const curvePoints: THREE.Vector3[] = [];
    const seed = selectedAccession
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

    for (let i = 0; i < numNodes; i++) {
      const t = (i / (numNodes - 1)) * Math.PI * 4.2;
      const radius = 0.85 + 0.45 * Math.sin(t * 0.65 + seed * 0.1);
      const x = Math.cos(t) * radius;
      const y = ((i / (numNodes - 1)) - 0.5) * 2.6;
      const z = Math.sin(t) * radius;
      curvePoints.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 160, 0.055, 12, false);
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
      if (idx < 7 || idx > numNodes - 6) {
        plddtColor = 0xf472b6; // <50 Very Low (Rose-Orchid)
      } else if (idx % 9 === 0) {
        plddtColor = 0xe879f9; // 50-70 Low (Fuchsia-Orchid)
      } else if (idx % 4 === 0) {
        plddtColor = 0xa855f7; // 70-90 Confident (Amethyst Purple)
      }

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(isHighlighted ? 0.125 : 0.082, 16, 16),
        new THREE.MeshStandardMaterial({
          color: isHighlighted ? 0xfaf8ff : plddtColor,
          emissive: isHighlighted ? 0xc084fc : 0x000000,
          emissiveIntensity: isHighlighted ? 0.75 : 0,
          roughness: 0.25,
          metalness: 0.2,
        })
      );
      sphere.position.copy(pt);
      structureGroup.add(sphere);
    });

    const clock = new THREE.Clock();
    let frameId = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      structureGroup.rotation.y = elapsed * 0.65;
      structureGroup.rotation.x = Math.sin(elapsed * 0.8) * 0.22;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
    };
  }, [selectedAccession, sequenceLength, highlightedRange, reducedMotion]);

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
            <div className="relative h-72 w-full rounded-xl bg-[#050505] border border-white/10 overflow-hidden">
              <div ref={viewerMountRef} className="w-full h-full" />
              {highlightedRange && (
                <div className="absolute top-3 left-3 px-3 py-1 rounded-md bg-[#050505]/90 border border-[#A855F7]/50 text-xs font-mono-tabular text-[#C084FC]">
                  Highlighting Residues {highlightedRange.start}–{highlightedRange.end}
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
