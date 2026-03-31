'use client';

import { useState, useMemo } from 'react';
import { SHOWS, LAST_UPDATED } from './shows-data';

const CATEGORIES = [
  { id: 'all', label: 'All', sym: '⬡', color: '#E8C872' },
  { id: 'musical', label: 'Musicals', sym: '♪', color: '#E8C872' },
  { id: 'play', label: 'Plays', sym: '◈', color: '#8BA4B5' },
  { id: 'comedy', label: 'Comedy', sym: '◉', color: '#C4956A' },
  { id: 'ballet', label: 'Ballet', sym: '◎', color: '#B5819E' },
  { id: 'opera', label: 'Opera', sym: '◆', color: '#9B8EC4' },
  { id: 'immersive', label: 'Immersive', sym: '◐', color: '#6EA8A0' },
  { id: 'cabaret', label: 'Cabaret', sym: '✦', color: '#C4856A' },
  { id: 'dance', label: 'Dance', sym: '△', color: '#7BAA8E' },
];

const VENUE_TYPES = [
  { id: 'all', label: 'All Venues' },
  { id: 'west-end', label: 'West End' },
  { id: 'off-west-end', label: 'Off-West End' },
  { id: 'fringe', label: 'Fringe' },
];

const catColor = (id) => CATEGORIES.find((c) => c.id === id)?.color || '#E8C872';
const catInfo = (id) => CATEGORIES.find((c) => c.id === id);

export default function Home() {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');
  const [saved, setSaved] = useState([]);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefs, setPrefs] = useState({ categories: [], email: '' });

  const filtered = useMemo(() => {
    return SHOWS.filter((s) => {
      if (activeCat !== 'all' && s.category !== activeCat) return false;
      if (venueFilter !== 'all' && s.venueType !== venueFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.venue.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) || (s.cast || []).some((c) => c.toLowerCase().includes(q));
    });
  }, [search, activeCat, venueFilter]);

  const toggleSave = (id) => setSaved((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const togglePref = (key, val) => setPrefs((p) => {
    const arr = p[key] || [];
    return { ...p, [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] };
  });

  const updatedDate = new Date(LAST_UPDATED).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      {/* Header */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.logoArea}>
            <span style={S.logoMark}>S</span>
            <div>
              <h1 style={S.logoText}>STAGE</h1>
              <p style={S.logoSub}>LONDON</p>
            </div>
          </div>
          <button onClick={() => setPrefsOpen(true)} style={S.headerBtn}>
            Preferences{saved.length > 0 && <span style={S.badge}>{saved.length}</span>}
          </button>
        </div>
      </header>

      {/* Hero */}
      <div style={S.hero}>
        <div style={S.heroInner}>
          <p style={S.heroEyebrow}>London Live Performance Guide</p>
          <h2 style={S.heroTitle}>{"What's playing tonight"}</h2>
          <p style={S.heroSub}>{SHOWS.length} shows across West End, Off-West End & Fringe · Updated {updatedDate}</p>
        </div>
        <div style={S.heroLine} />
      </div>

      {/* Filters */}
      <div style={S.filtersWrap}>
        <div style={S.filtersInner}>
          <div style={S.catRow}>
            {CATEGORIES.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                style={{ ...S.catBtn, ...(activeCat === cat.id ? S.catBtnActive : {}) }}>
                <span style={{ opacity: activeCat === cat.id ? 1 : 0.5 }}>{cat.sym}</span>{cat.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <div style={S.venueRow}>
              {VENUE_TYPES.map((v) => (
                <button key={v.id} onClick={() => setVenueFilter(v.id)}
                  style={{ ...S.venueBtn, ...(venueFilter === v.id ? S.venueBtnActive : {}) }}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px 14px' }}>
          <div style={S.searchRow}>
            <input type="text" placeholder="Search shows, venues, cast…" value={search}
              onChange={(e) => setSearch(e.target.value)} style={S.searchInput} />
            {search && <button onClick={() => setSearch('')} style={S.searchClear}>×</button>}
          </div>
        </div>
      </div>

      {/* Main */}
      <main style={S.main}>
        <div style={S.resultsBar}>
          <span style={S.resultsCount}>
            {filtered.length} show{filtered.length !== 1 ? 's' : ''}
            {activeCat !== 'all' ? ` · ${catInfo(activeCat)?.label}` : ''}
            {venueFilter !== 'all' ? ` · ${VENUE_TYPES.find(v => v.id === venueFilter)?.label}` : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div style={S.emptyState}><p style={{ color: '#666' }}>No shows match your search.</p></div>
        ) : (
          <div style={S.grid}>
            {filtered.map((show, i) => {
              const color = catColor(show.category);
              const cat = catInfo(show.category);
              const isSaved = saved.includes(show.id);
              const venueLabel = show.venueType === 'fringe' ? 'Fringe' : show.venueType === 'off-west-end' ? 'Off-West End' : 'West End';
              return (
                <div key={show.id} style={{ ...S.card, animationDelay: `${i * 0.04}s` }} className="show-card">
                  <div style={{ height: 3, background: color }} />
                  <div style={S.cardBody}>
                    <div style={S.cardTop}>
                      <span style={{ ...S.cardCat, color }}>{cat?.sym} {cat?.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={S.venueTag}>{venueLabel}</span>
                        <button onClick={() => toggleSave(show.id)}
                          style={{ ...S.saveBtn, color: isSaved ? '#E8C872' : '#555' }}>
                          {isSaved ? '★' : '☆'}
                        </button>
                      </div>
                    </div>
                    <h3 style={S.cardTitle}>{show.title}</h3>
                    <p style={S.cardVenue}>{show.venue}</p>
                    <p style={S.cardDesc}>{show.description}</p>
                    {show.cast && show.cast.length > 0 && (
                      <p style={S.cardCast}>
                        <span style={{ color: '#999' }}>Starring</span>{' '}
                        {show.cast.join(' · ')}
                      </p>
                    )}
                    <div style={S.cardMeta}>
                      {show.priceRange && <span style={S.metaTag}>{show.priceRange}</span>}
                      {show.dates && <span style={S.metaTag}>{show.dates}</span>}
                      {show.duration && <span style={S.metaTag}>{show.duration}</span>}
                    </div>
                    {show.ticketUrl && (
                      <a href={show.ticketUrl} target="_blank" rel="noopener noreferrer"
                        style={{ ...S.ticketBtn, borderColor: color, color }}>Book Tickets →</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={S.footer}>
        <p>STAGE LONDON · {SHOWS.length} shows · Last updated {updatedDate} · Data from westendtheatre.com, londonboxoffice.co.uk, visitlondon.com, timeout.com, sohotheatre.com</p>
      </footer>

      {/* Preferences Panel */}
      {prefsOpen && (
        <div style={S.overlay} onClick={() => setPrefsOpen(false)}>
          <div style={S.prefsPanel} onClick={(e) => e.stopPropagation()}>
            <div style={S.prefHeader}>
              <h2 style={S.prefTitle}>Preferences</h2>
              <button onClick={() => setPrefsOpen(false)} style={S.prefClose}>×</button>
            </div>
            <div style={S.prefBody}>
              <div style={S.prefSection}>
                <h3 style={S.prefSecTitle}>Saved shows ({saved.length})</h3>
                {saved.length === 0
                  ? <p style={{ color: '#555', fontSize: 13 }}>Click ☆ on any show card to save it.</p>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {saved.map((id) => {
                      const s = SHOWS.find((x) => x.id === id);
                      return s ? (
                        <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#1a1a1a', borderRadius: 4 }}>
                          <div>
                            <span style={{ color: '#ccc', fontSize: 13 }}>{s.title}</span>
                            <span style={{ color: '#555', fontSize: 11, marginLeft: 8 }}>{s.venue}</span>
                          </div>
                          <button onClick={() => toggleSave(id)} style={{ background: 'none', border: 'none', color: '#C46A6A', cursor: 'pointer', fontSize: 12 }}>Remove</button>
                        </div>
                      ) : null;
                    })}
                  </div>
                }
              </div>
              <div style={S.prefSection}>
                <h3 style={S.prefSecTitle}>Favourite categories</h3>
                <div style={S.prefGrid}>
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
                    const on = (prefs.categories || []).includes(cat.id);
                    return (
                      <button key={cat.id} onClick={() => togglePref('categories', cat.id)}
                        style={{ ...S.prefChip, ...(on ? { background: cat.color, color: '#111', borderColor: cat.color } : {}) }}>
                        {cat.sym} {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={S.prefSection}>
                <h3 style={S.prefSecTitle}>Email alerts</h3>
                <p style={{ color: '#555', fontSize: 13, marginBottom: 12 }}>Get notified about new shows. Coming soon.</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="email" placeholder="you@email.com" value={prefs.email || ''}
                    onChange={(e) => setPrefs((p) => ({ ...p, email: e.target.value }))} style={S.prefInput} />
                  <button style={{ ...S.prefEmailBtn, opacity: prefs.email ? 1 : 0.4 }}>Subscribe</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const S = {
  header:{background:'#0a0a0a',borderBottom:'1px solid #1e1e1e',position:'sticky',top:0,zIndex:100},
  headerInner:{maxWidth:1200,margin:'0 auto',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'},
  logoArea:{display:'flex',alignItems:'center',gap:12},
  logoMark:{fontFamily:"'Instrument Serif',serif",fontSize:28,color:'#E8C872',width:38,height:38,display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid #E8C872',borderRadius:4},
  logoText:{fontFamily:"'Geist Mono',monospace",fontSize:14,fontWeight:500,color:'#fff',letterSpacing:'0.2em',lineHeight:1},
  logoSub:{fontFamily:"'Geist Mono',monospace",fontSize:10,color:'#E8C872',letterSpacing:'0.35em',marginTop:1},
  headerBtn:{background:'transparent',border:'1px solid #333',color:'#aaa',padding:'7px 18px',borderRadius:4,cursor:'pointer',fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:500},
  badge:{background:'#E8C872',color:'#111',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:99,marginLeft:8},
  hero:{background:'#0a0a0a',padding:'48px 28px 32px'},
  heroInner:{maxWidth:1200,margin:'0 auto'},
  heroEyebrow:{fontFamily:"'Geist Mono',monospace",fontSize:11,color:'#E8C872',letterSpacing:'0.25em',textTransform:'uppercase',marginBottom:16},
  heroTitle:{fontFamily:"'Instrument Serif',serif",fontSize:'clamp(32px,5vw,56px)',fontWeight:400,color:'#fff',lineHeight:1.05,fontStyle:'italic'},
  heroSub:{fontSize:14,color:'#666',marginTop:14},
  heroLine:{height:1,background:'linear-gradient(90deg,#E8C872 0%,#333 40%,transparent 100%)',maxWidth:1200,margin:'0 auto'},
  filtersWrap:{background:'#0f0f0f',borderBottom:'1px solid #1a1a1a',position:'sticky',top:53,zIndex:90},
  filtersInner:{maxWidth:1200,margin:'0 auto',padding:'14px 28px',display:'flex',flexWrap:'wrap',gap:12,alignItems:'center',justifyContent:'space-between'},
  catRow:{display:'flex',gap:4,overflowX:'auto',flexShrink:0},
  catBtn:{background:'transparent',border:'1px solid transparent',color:'#777',padding:'6px 14px',borderRadius:4,cursor:'pointer',fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:500,transition:'all 0.2s',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:6},
  catBtnActive:{borderColor:'#333',color:'#E8C872',background:'rgba(232,200,114,0.06)'},
  venueRow:{display:'flex',gap:2},
  venueBtn:{background:'transparent',border:'1px solid #222',color:'#666',padding:'5px 12px',borderRadius:4,cursor:'pointer',fontSize:11,fontFamily:"'Geist Mono',monospace",transition:'all 0.2s',whiteSpace:'nowrap'},
  venueBtnActive:{borderColor:'#E8C872',color:'#E8C872',background:'rgba(232,200,114,0.06)'},
  searchRow:{position:'relative',maxWidth:480},
  searchInput:{width:'100%',padding:'8px 14px',fontSize:14,border:'1px solid #222',borderRadius:4,outline:'none',fontFamily:"'DM Sans',sans-serif",background:'#161616',color:'#ddd'},
  searchClear:{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#666',cursor:'pointer',fontSize:16},
  main:{maxWidth:1200,margin:'0 auto',padding:'24px 28px 80px'},
  resultsBar:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20},
  resultsCount:{fontSize:13,color:'#666',fontFamily:"'Geist Mono',monospace"},
  grid:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:16},
  card:{background:'#161616',borderRadius:8,overflow:'hidden',border:'1px solid #1e1e1e',cursor:'default'},
  cardBody:{padding:'18px 22px 22px'},
  cardTop:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10},
  cardCat:{fontSize:12,fontFamily:"'Geist Mono',monospace",letterSpacing:'0.06em',textTransform:'uppercase'},
  venueTag:{fontSize:10,fontFamily:"'Geist Mono',monospace",color:'#555',padding:'2px 8px',border:'1px solid #222',borderRadius:3},
  saveBtn:{background:'none',border:'none',cursor:'pointer',fontSize:18,padding:4,transition:'color 0.2s'},
  cardTitle:{fontFamily:"'Instrument Serif',serif",fontSize:22,fontWeight:400,color:'#fff',lineHeight:1.2,marginBottom:4,fontStyle:'italic'},
  cardVenue:{fontSize:13,color:'#666',marginBottom:12},
  cardDesc:{fontSize:14,color:'#888',lineHeight:1.55,marginBottom:14},
  cardCast:{fontSize:13,color:'#aaa',marginBottom:14,lineHeight:1.4},
  cardMeta:{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16},
  metaTag:{fontSize:11,color:'#888',padding:'4px 10px',background:'#111',borderRadius:3,fontFamily:"'Geist Mono',monospace",border:'1px solid #1e1e1e'},
  ticketBtn:{display:'inline-block',padding:'9px 18px',borderRadius:4,fontSize:13,fontWeight:600,textDecoration:'none',border:'1px solid',fontFamily:"'DM Sans',sans-serif",transition:'all 0.2s',cursor:'pointer',position:'relative',zIndex:1},
  emptyState:{textAlign:'center',padding:'60px 28px'},
  footer:{textAlign:'center',padding:'24px 28px',color:'#444',fontSize:11,borderTop:'1px solid #1a1a1a',fontFamily:"'Geist Mono',monospace",lineHeight:1.6},
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',justifyContent:'flex-end'},
  prefsPanel:{width:'min(420px,90vw)',background:'#141414',height:'100%',overflowY:'auto',borderLeft:'1px solid #1e1e1e'},
  prefHeader:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px',borderBottom:'1px solid #1e1e1e'},
  prefTitle:{fontFamily:"'Instrument Serif',serif",fontSize:22,color:'#fff',fontStyle:'italic'},
  prefClose:{background:'none',border:'none',color:'#666',fontSize:22,cursor:'pointer'},
  prefBody:{padding:24},
  prefSection:{marginBottom:28},
  prefSecTitle:{fontSize:12,fontFamily:"'Geist Mono',monospace",color:'#E8C872',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:14},
  prefGrid:{display:'flex',flexWrap:'wrap',gap:8},
  prefChip:{padding:'7px 14px',borderRadius:4,border:'1px solid #333',background:'transparent',cursor:'pointer',fontSize:13,fontFamily:"'DM Sans',sans-serif",color:'#aaa',fontWeight:500,transition:'all 0.2s'},
  prefInput:{flex:1,padding:'9px 12px',border:'1px solid #333',borderRadius:4,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:'none',background:'#111',color:'#ddd'},
  prefEmailBtn:{background:'#E8C872',color:'#111',border:'none',padding:'9px 18px',borderRadius:4,fontWeight:700,cursor:'pointer',fontSize:13,fontFamily:"'DM Sans',sans-serif"},
};
