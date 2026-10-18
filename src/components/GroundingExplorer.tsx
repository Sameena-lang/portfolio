import React, { useState } from 'react';
import { Compass, ExternalLink, Globe, Loader2, MapPin, Search } from 'lucide-react';

const SEARCH_PRESETS = [
  'Latest clinical machine learning benchmarks for diabetes & MRI brain tumor classification 2026',
  'Core Web Vitals & AI-driven technical SEO audit standards 2026',
  'FastAPI & React.js full-stack enterprise architecture best practices',
];

const MAPS_PRESETS = [
  'Top AI & Data Science research parks and IT hubs in Chennai, Tamil Nadu',
  'DMI College of Engineering and nearby technology innovation centers in Chennai',
  'Leading diagnostic imaging & neurology hospitals in Chennai, India',
];

export const GroundingExplorer: React.FC = () => {
  // Search Grounding State
  const [searchQuery, setSearchQuery] = useState<string>(SEARCH_PRESETS[0]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<{
    text: string;
    sources: Array<{ uri: string; title: string }>;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Maps Grounding State
  const [mapsQuery, setMapsQuery] = useState<string>(MAPS_PRESETS[0]);
  const [mapsLoading, setMapsLoading] = useState<boolean>(false);
  const [mapsResult, setMapsResult] = useState<{
    text: string;
    places: Array<{ uri: string; title: string; reviewSnippets: string[] }>;
  } | null>(null);
  const [mapsError, setMapsError] = useState<string | null>(null);

  const handleRunSearch = async (queryToRun: string) => {
    const q = queryToRun.trim();
    if (!q) return;
    setSearchLoading(true);
    setSearchError(null);

    try {
      const res = await fetch('/api/gemini/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error || 'Search grounding request failed.');
      } else {
        setSearchResult({
          text: data.text,
          sources: data.sources || [],
        });
      }
    } catch {
      setSearchError('Could not connect to server search grounding endpoint.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleRunMaps = async (queryToRun: string) => {
    const q = queryToRun.trim();
    if (!q) return;
    setMapsLoading(true);
    setMapsError(null);

    let lat = 13.0827;
    let lng = 80.2707;

    if ('geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 2500 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // Default to Chennai coordinates
      }
    }

    try {
      const res = await fetch('/api/gemini/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, latitude: lat, longitude: lng }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMapsError(data.error || 'Maps grounding request failed.');
      } else {
        setMapsResult({
          text: data.text,
          places: data.places || [],
        });
      }
    } catch {
      setMapsError('Could not connect to server maps grounding endpoint.');
    } finally {
      setMapsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Pane 1: Google Search Grounding (gemini-3.5-flash) */}
      <div className="p-6 sm:p-8 rounded-2xl glass-panel flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono-tabular text-[#C084FC]">
              GOOGLE SEARCH GROUNDING · GEMINI-3.5-FLASH
            </span>
            <Globe className="w-5 h-5 text-[#A855F7]" />
          </div>

          <h3 className="text-xl font-bold font-display text-[#FAF8FF]">
            Live AI, Clinical ML &amp; SEO Research Radar
          </h3>
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Query live web intelligence grounded with Google Search citations across AI/ML diagnostics, full-stack frameworks, and SEO engineering.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunSearch(searchQuery);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search live AI, Data Science, or SEO topics..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#050505]/90 border border-white/15 text-xs text-[#FAF8FF] focus:outline-none focus:border-[#A855F7]"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] text-xs font-semibold text-[#FAF8FF] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {searchLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>Search Web</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5">
            {SEARCH_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setSearchQuery(preset);
                  handleRunSearch(preset);
                }}
                className="text-left px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-[#A1A1AA] hover:text-[#FAF8FF] transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {searchError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200">
            {searchError}
          </div>
        )}

        {searchResult && (
          <div className="p-4 rounded-xl bg-[#050505]/85 border border-white/10 space-y-3">
            <div className="text-xs text-[#FAF8FF] leading-relaxed whitespace-pre-line">
              {searchResult.text}
            </div>
            {searchResult.sources.length > 0 && (
              <div className="pt-3 border-t border-white/10 space-y-1.5">
                <div className="text-[11px] font-mono-tabular text-[#C084FC]">
                  Verified Google Search Citations:
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchResult.sources.map((src, i) => (
                    <a
                      key={`${src.uri}-${i}`}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#C084FC] hover:underline"
                    >
                      <span>{src.title}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pane 2: Google Maps Grounding (gemini-3.5-flash) */}
      <div className="p-6 sm:p-8 rounded-2xl glass-panel flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono-tabular text-[#C084FC]">
              GOOGLE MAPS GROUNDING · CHENNAI ECOSYSTEM
            </span>
            <Compass className="w-5 h-5 text-[#C084FC]" />
          </div>

          <h3 className="text-xl font-bold font-display text-[#FAF8FF]">
            Chennai Tech Corridor &amp; Campus Explorer
          </h3>
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Explore technology parks, AI research institutions, and clinical centers around Chennai, Tamil Nadu using live Google Maps grounding.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunMaps(mapsQuery);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={mapsQuery}
              onChange={(e) => setMapsQuery(e.target.value)}
              placeholder="Find tech hubs, colleges, or centers in Chennai..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#050505]/90 border border-white/15 text-xs text-[#FAF8FF] focus:outline-none focus:border-[#A855F7]"
            />
            <button
              type="submit"
              disabled={mapsLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#9333EA] hover:bg-[#7E22CE] text-xs font-semibold text-[#FAF8FF] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {mapsLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <MapPin className="w-3.5 h-3.5" />
              )}
              <span>Explore Map</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5">
            {MAPS_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setMapsQuery(preset);
                  handleRunMaps(preset);
                }}
                className="text-left px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-[#A1A1AA] hover:text-[#FAF8FF] transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {mapsError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200">
            {mapsError}
          </div>
        )}

        {mapsResult && (
          <div className="p-4 rounded-xl bg-[#050505]/85 border border-white/10 space-y-3">
            <div className="text-xs text-[#FAF8FF] leading-relaxed whitespace-pre-line">
              {mapsResult.text}
            </div>
            {mapsResult.places.length > 0 && (
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="text-[11px] font-mono-tabular text-[#C084FC]">
                  Verified Google Maps Places:
                </div>
                <div className="space-y-2">
                  {mapsResult.places.map((place, idx) => (
                    <div
                      key={`${place.uri}-${idx}`}
                      className="p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1"
                    >
                      <a
                        href={place.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C084FC] hover:underline"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{place.title}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {place.reviewSnippets.length > 0 && (
                        <p className="text-[11px] text-[#A1A1AA]">
                          “{place.reviewSnippets[0]}”
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
