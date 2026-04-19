const { useState, useEffect, useRef } = React;

// --- Tweaks bootstrap ---
const TWEAK_DEFAULTS = JSON.parse(
  document.getElementById('tweak-defaults').textContent.match(/\{[\s\S]*\}/)[0]
);

function useTweaks() {
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onMsg = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode') setOpen(true);
      if (e.data.type === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const setKey = (k, v) => {
    setTweaks(t => ({ ...t, [k]: v }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
  };
  return { tweaks, open, setKey };
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { setY(window.scrollY); raf = 0; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return y;
}

function useReveal(threshold = 0.2) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return [ref, shown];
}

// ----- NAV -----
function Nav({ accent }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', on);
    on();
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 48px',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      background: scrolled ? 'rgba(5,6,11,0.75)' : 'transparent',
      borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
      transition: 'all .3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <img src="assets/logo-wordmark.png" alt="땡겨요" style={{ height: 26, filter: 'brightness(1.05)' }} />
        <span className="mono" style={{
          fontSize: 10, opacity: 0.45, marginLeft: 6,
          borderLeft: '1px solid var(--line)', paddingLeft: 12
        }}>SHINHAN · DELIVERY</span>
      </div>
      <div style={{ display: 'flex', gap: 32, alignItems: 'center', fontSize: 14, whiteSpace: 'nowrap' }} className="label-kr">
        <a href="#story" style={{ whiteSpace: 'nowrap' }}>스토리</a>
        <a href="#mission" style={{ whiteSpace: 'nowrap' }}>몰리</a>
        <a href="#benefits" style={{ whiteSpace: 'nowrap' }}>혜택</a>
        <a href="#download" style={{ whiteSpace: 'nowrap' }}>
          <button style={{
            padding: '11px 20px', borderRadius: 999, background: accent, color: '#0a0a0a',
            fontWeight: 700, fontSize: 13, letterSpacing: '-0.01em', whiteSpace: 'nowrap'
          }}>앱 다운로드 →</button>
        </a>
      </div>
    </nav>
  );
}

// ----- HERO -----
function HeroVideo({ tweaks }) {
  const videoRef = useRef(null);
  const y = useScrollY();
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (videoRef.current) videoRef.current.play().catch(() => {});
  }, []);

  const parallax = Math.min(y * 0.4, 300);
  const fade = Math.max(0, 1 - y / 600);

  return (
    <section style={{
      position: 'relative', height: '100vh', minHeight: 720,
      overflow: 'hidden', zIndex: 1
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        transform: `translateY(${parallax}px) scale(${1 + y * 0.0003})`,
      }}>
        <video
          ref={videoRef}
          src="assets/hero.mp4"
          autoPlay muted={muted} loop playsInline
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            filter: 'brightness(0.72) contrast(1.08)'
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(5,6,11,0.35) 0%, rgba(5,6,11,0.1) 40%, rgba(5,6,11,0.55) 80%, var(--bg) 100%)'
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5,6,11,0.55) 100%)'
        }} />
      </div>

      {/* HUD */}
      <div style={{
        position: 'absolute', top: 108, left: 48, right: 48,
        display: 'flex', justifyContent: 'space-between',
        opacity: fade, pointerEvents: fade < 0.3 ? 'none' : 'auto'
      }} className="mono">
        <div style={{ fontSize: 11, opacity: 0.65, lineHeight: 1.9 }}>
          <div>◉ REC · 00:29 SHORT FILM</div>
          <div>LAT 37.5665°· LON 126.9780°</div>
          <div style={{ color: 'var(--accent)' }}>{tweaks.chapter}</div>
        </div>
        <div style={{ fontSize: 11, opacity: 0.65, textAlign: 'right', lineHeight: 1.9 }}>
          <div>ORBITAL DELIVERY SYS.</div>
          <div>CH 01 / 04 · SIGNAL 98%</div>
          <div>2026 · 29초 영화제 출품작</div>
        </div>
      </div>

      {/* Centerpiece copy */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-end',
        paddingBottom: 116, textAlign: 'center',
        opacity: fade, transform: `translateY(${-y * 0.15}px)`
      }}>
        <div className="mono" style={{
          fontSize: 12, letterSpacing: '0.32em', opacity: 0.75, marginBottom: 28,
          color: 'var(--accent-soft)'
        }}>
          A SPACE ODYSSEY OF CRAVINGS
        </div>
        <h1 className="h-display" style={{
          fontSize: 'clamp(54px, 8.2vw, 132px)',
          textShadow: '0 4px 40px rgba(0,0,0,0.55)',
          maxWidth: 1200,
          letterSpacing: '-0.05em',
          lineHeight: 1.0
        }}>
          음식이 땡기는 순간,<br/>
          <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>땡겨요.</span>
        </h1>
        <p className="body-kr" style={{
          marginTop: 30, fontSize: 18, opacity: 0.78, maxWidth: 520
        }}>
          우주 끝까지, 30분 안에.<br/>배달의 중력을 벗어나다.
        </p>
      </div>

      <button onClick={() => setMuted(m => !m)} style={{
        position: 'absolute', bottom: 40, right: 48, zIndex: 5,
        padding: '10px 16px', borderRadius: 999,
        border: '1px solid var(--line)',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)',
        fontSize: 11, fontFamily: 'Space Mono, monospace',
        letterSpacing: '0.18em'
      }}>
        {muted ? '♪ SOUND OFF' : '♫ SOUND ON'}
      </button>

      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        opacity: fade
      }}>
        <span className="mono" style={{ fontSize: 10, opacity: 0.5, letterSpacing: '0.28em' }}>SCROLL</span>
        <div style={{
          width: 1, height: 40, background: 'linear-gradient(180deg, transparent, var(--ink))',
          animation: 'scrollCue 2s ease-in-out infinite'
        }} />
      </div>
      <style>{`
        @keyframes scrollCue {
          0%, 100% { opacity: 0.3; transform: scaleY(0.6); transform-origin: top; }
          50% { opacity: 1; transform: scaleY(1); }
        }
      `}</style>
    </section>
  );
}

// ----- TICKER -----
function TickerStrip({ accent }) {
  const items = [
    '신한은행 공식 배달앱',
    '우주 어디든 30분',
    '최대 3만원 할인',
    '음식이 땡기는 순간',
    '땡겨요 × 29초 영화제',
    'HAIL DELIVERY'
  ];
  return (
    <div style={{
      borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
      padding: '22px 0', overflow: 'hidden', background: 'var(--bg-deep)',
      position: 'relative', zIndex: 2
    }}>
      <div style={{
        display: 'flex', gap: 72, animation: 'ticker 30s linear infinite',
        whiteSpace: 'nowrap', width: 'max-content'
      }}>
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} style={{
            fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 72,
            color: i % 2 ? 'var(--muted)' : accent,
            letterSpacing: '-0.01em', fontWeight: 600
          }}>
            {t} <span style={{ color: 'var(--muted)', fontSize: 10 }}>✦</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-33.33%); } }`}</style>
    </div>
  );
}

// ----- CHAPTER -----
function Chapter({ id, chapter, num, imgSrc, imgAlt, title, body, reverse, accent, imgPos = 'center' }) {
  const [ref, shown] = useReveal();
  const y = useScrollY();
  const [sectionTop, setSectionTop] = useState(0);
  useEffect(() => {
    if (ref.current) setSectionTop(ref.current.offsetTop);
  }, [ref]);
  const rel = y - sectionTop + 800;
  const imgY = Math.max(-80, Math.min(80, rel * 0.08));

  return (
    <section ref={ref} id={id} style={{
      position: 'relative', padding: '140px 48px', zIndex: 2, overflow: 'hidden'
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80,
        maxWidth: 1400, margin: '0 auto', alignItems: 'center',
        direction: reverse ? 'rtl' : 'ltr'
      }}>
        <div style={{
          direction: 'ltr',
          position: 'relative', aspectRatio: '4/3', borderRadius: 20,
          overflow: 'hidden', border: '1px solid var(--line)',
          transform: shown ? 'translateY(0) scale(1)' : 'translateY(60px) scale(0.96)',
          opacity: shown ? 1 : 0,
          transition: 'all 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}>
          <img src={imgSrc} alt={imgAlt} style={{
            width: '100%', height: '120%', objectFit: 'cover', objectPosition: imgPos,
            transform: `translateY(${imgY}px)`,
            transition: 'transform 0.1s linear'
          }} />
          <div className="mono" style={{
            position: 'absolute', top: 16, left: 16,
            padding: '6px 10px', borderRadius: 6,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
            fontSize: 10, letterSpacing: '0.22em', opacity: 0.9
          }}>
            CH {String(num).padStart(2,'0')} · {chapter}
          </div>
          <div className="mono" style={{
            position: 'absolute', bottom: 16, right: 16,
            fontSize: 10, opacity: 0.7, letterSpacing: '0.15em'
          }}>
            ◉ 00:{String(num * 7).padStart(2,'0')}
          </div>
        </div>

        <div style={{ direction: 'ltr' }}>
          <div className="mono" style={{
            fontSize: 11, letterSpacing: '0.28em', color: accent, marginBottom: 28,
            opacity: shown ? 1 : 0, transform: shown ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all .8s ease'
          }}>
            CHAPTER {String(num).padStart(2, '0')} / 04
          </div>
          <h2 className="h-chapter" style={{
            fontSize: 'clamp(40px, 5vw, 72px)',
            marginBottom: 30,
            opacity: shown ? 1 : 0, transform: shown ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s ease .1s'
          }}>
            {title}
          </h2>
          <p className="body-kr" style={{
            fontSize: 17, color: 'var(--muted)', maxWidth: 520,
            opacity: shown ? 1 : 0, transform: shown ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s ease .2s'
          }}>
            {body}
          </p>
        </div>
      </div>
    </section>
  );
}

// ----- TYPE BREAK -----
function TypeBreak({ line1, line2, accent }) {
  const [ref, shown] = useReveal();
  return (
    <section ref={ref} style={{
      padding: '160px 48px', textAlign: 'center', position: 'relative', zIndex: 2
    }}>
      <div className="h-display" style={{
        fontSize: 'clamp(68px, 12vw, 180px)',
        letterSpacing: '-0.055em',
        lineHeight: 1.0,
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(60px)',
        transition: 'all 1.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
      }}>
        {line1}<br/>
        <span style={{ color: accent, fontStyle: 'italic' }}>{line2}</span>
      </div>
    </section>
  );
}

// ----- MEET MOLLY -----
function MeetMolly({ accent, purple }) {
  const [ref, shown] = useReveal();
  const y = useScrollY();
  const [top, setTop] = useState(0);
  useEffect(() => { if (ref.current) setTop(ref.current.offsetTop); }, [ref]);
  const rel = y - top + 400;
  const floatY = Math.max(-40, Math.min(40, rel * 0.04));

  return (
    <section ref={ref} id="mission" style={{
      position: 'relative', padding: '180px 48px', zIndex: 2,
      background: 'linear-gradient(180deg, var(--bg) 0%, #0a0816 50%, var(--bg) 100%)',
      overflow: 'hidden'
    }}>
      {/* subtle ring */}
      <div style={{
        position: 'absolute', left: '10%', top: '30%',
        width: 600, height: 600, borderRadius: '50%',
        border: `1px dashed ${accent}`, opacity: 0.08,
        transform: `rotate(${y * 0.02}deg)`
      }} />

      <div style={{
        maxWidth: 1400, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 60,
        alignItems: 'center'
      }}>
        {/* Molly image */}
        <div style={{
          position: 'relative', textAlign: 'center',
          transform: `translateY(${floatY}px)`,
          transition: 'transform 0.1s linear'
        }}>
          <div style={{
            position: 'absolute', inset: '15% 10%',
            background: `radial-gradient(circle, ${purple}55 0%, transparent 65%)`,
            filter: 'blur(40px)', zIndex: 0
          }} />
          <img src="assets/molly-scooter.png" alt="몰리 스쿠터" style={{
            position: 'relative', zIndex: 1,
            width: '100%', maxWidth: 540,
            filter: `drop-shadow(0 40px 80px ${purple}44)`,
            opacity: shown ? 1 : 0,
            transform: shown ? 'scale(1)' : 'scale(0.9)',
            transition: 'all 1.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
          }} />
          {/* orbital label */}
          <div className="mono" style={{
            position: 'absolute', top: 40, right: 20,
            fontSize: 10, opacity: 0.6, letterSpacing: '0.2em',
            color: accent, zIndex: 2
          }}>
            UNIT 001 · MOLLY
          </div>
          <div className="mono" style={{
            position: 'absolute', bottom: 80, left: 20,
            fontSize: 10, opacity: 0.6, letterSpacing: '0.2em', zIndex: 2
          }}>
            STATUS: ACTIVE · ONLINE
          </div>
        </div>

        <div>
          <div className="mono" style={{
            fontSize: 11, letterSpacing: '0.28em', color: accent, marginBottom: 28,
            opacity: shown ? 1 : 0, transition: 'opacity .8s ease'
          }}>
            MEET THE CREW · 001
          </div>
          <h2 className="h-chapter" style={{
            fontSize: 'clamp(44px, 5.6vw, 88px)',
            marginBottom: 36,
            opacity: shown ? 1 : 0, transform: shown ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s ease .1s'
          }}>
            <span style={{ color: purple }}>몰리</span>는<br/>
            우주에서도<br/>
            당신을 찾아냅니다.
          </h2>
          <p className="body-kr" style={{
            fontSize: 17, color: 'var(--muted)', marginBottom: 44, maxWidth: 520,
            opacity: shown ? 1 : 0, transform: shown ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s ease .2s'
          }}>
            빨간 헬멧을 쓴 우리 동네 배달 메이트, 몰리. 스쿠터를 타고 골목을 누비다가도, 심우주 궤도 너머까지 김이 오르는 한 봉지를 놓치지 않고 가져다 줍니다. 거리는 몰리에게 숫자일 뿐이에요.
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28,
            padding: '28px 0',
            borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)'
          }}>
            {[['24/7','궤도 운행'], ['−40°C','보온 유지'], ['0G','흘리지 않음']].map(([v, l]) => (
              <div key={l}>
                <div style={{
                  fontFamily: 'Archivo Black', fontSize: 34, color: accent,
                  letterSpacing: '-0.02em', lineHeight: 1
                }}>{v}</div>
                <div className="label-kr" style={{
                  fontSize: 12, opacity: 0.6, marginTop: 10, letterSpacing: '0.02em'
                }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ----- BENEFITS -----
function BenefitsGrid({ accent, purple }) {
  const [ref, shown] = useReveal();
  const items = [
    { k: '01', t: '최대 30,000원 할인', d: '신한 SOL 페이 연동 시 월 3만원까지 자동 할인이 적용돼요.', tag: 'SAVE' },
    { k: '02', t: '2.2% 낮은 수수료', d: '업계 최저 수수료로, 사장님과 라이더에게 더 많이 돌아가는 구조예요.', tag: 'FAIR' },
    { k: '03', t: '지역화폐 연계', d: '서울사랑상품권으로 결제하고 추가 혜택까지 동시에 받을 수 있어요.', tag: 'LOCAL' },
    { k: '04', t: '30분 도착 약속', d: '조리 · 픽업 · 배송까지 실시간 추적. 늦으면 쿠폰으로 돌려드려요.', tag: 'FAST' }
  ];
  return (
    <section id="benefits" ref={ref} style={{
      padding: '160px 48px', position: 'relative', zIndex: 2,
      borderTop: '1px solid var(--line)'
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: 80, flexWrap: 'wrap', gap: 24
        }}>
          <div>
            <div className="mono" style={{
              fontSize: 11, letterSpacing: '0.28em', color: accent, marginBottom: 22
            }}>
              § MISSION BRIEFING
            </div>
            <h2 className="h-chapter" style={{
              fontSize: 'clamp(48px, 6vw, 92px)',
              maxWidth: 900
            }}>
              중력을 벗어난<br/>
              배달 경험, <span style={{ color: accent }}>네 가지</span>.
            </h2>
          </div>
          <p className="body-kr" style={{
            fontSize: 14, color: 'var(--muted)', maxWidth: 320
          }}>
            신한은행이 만든 공식 배달 플랫폼.<br/>금융과 배달이 만나 혜택이 달라집니다.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 1, background: 'var(--line)'
        }}>
          {items.map((it, i) => (
            <div key={it.k} className="benefit-card" style={{
              padding: '56px 44px', background: 'var(--bg)',
              position: 'relative', minHeight: 320,
              opacity: shown ? 1 : 0,
              transform: shown ? 'translateY(0)' : 'translateY(40px)',
              transition: `all .8s ease ${0.1 + i * 0.08}s`,
              overflow: 'hidden'
            }}>
              <div className="mono" style={{
                fontSize: 11, opacity: 0.5, marginBottom: 48,
                display: 'flex', justifyContent: 'space-between', letterSpacing: '0.18em'
              }}>
                <span>№ {it.k}</span>
                <span style={{ color: accent }}>[ {it.tag} ]</span>
              </div>
              <h3 className="h-sub" style={{
                fontSize: 34,
                marginBottom: 18,
                letterSpacing: '-0.03em',
                lineHeight: 1.2
              }}>
                {it.t}
              </h3>
              <p className="body-kr" style={{
                fontSize: 15, color: 'var(--muted)', maxWidth: 440
              }}>{it.d}</p>

              <div style={{
                position: 'absolute', right: -80, bottom: -80,
                width: 240, height: 240, borderRadius: '50%',
                border: `1px dashed ${i === 0 ? accent : 'var(--line)'}`,
                opacity: 0.3
              }} />
              <div style={{
                position: 'absolute', right: 40, bottom: 40,
                width: 8, height: 8, borderRadius: '50%',
                background: i === 0 ? accent : purple
              }} />
            </div>
          ))}
        </div>
      </div>
      <style>{`.benefit-card:hover { background: #0b0d15 !important; }`}</style>
    </section>
  );
}

// ----- CTA -----
function CTASection({ accent, purple }) {
  const [ref, shown] = useReveal();
  const y = useScrollY();
  const [top, setTop] = useState(0);
  useEffect(() => { if (ref.current) setTop(ref.current.offsetTop); }, [ref]);
  const rel = y - top + 400;
  const mollyY = Math.max(-60, Math.min(60, rel * 0.05));

  return (
    <section ref={ref} id="download" style={{
      position: 'relative', padding: '180px 48px 140px', zIndex: 2,
      overflow: 'hidden', textAlign: 'center'
    }}>
      {/* planet */}
      <div style={{
        position: 'absolute', left: '50%', top: '55%',
        width: 900, height: 900, borderRadius: '50%',
        transform: 'translate(-50%, -20%)',
        background: `radial-gradient(circle at 35% 30%, ${purple} 0%, #3b2a6b 40%, #0a0714 70%)`,
        filter: 'blur(1px)', opacity: 0.35, zIndex: 0
      }} />
      <div style={{
        position: 'absolute', left: '50%', top: '55%',
        width: 1200, height: 1200, borderRadius: '50%',
        transform: 'translate(-50%, -20%)',
        border: `1px dashed ${accent}`, opacity: 0.2, zIndex: 0
      }} />

      {/* floating molly */}
      <img src="assets/molly-scooter-clean.png" alt="몰리" style={{
        position: 'absolute', right: '8%', top: '18%',
        width: 180, zIndex: 2,
        transform: `translateY(${mollyY}px) rotate(-8deg)`,
        filter: `drop-shadow(0 20px 40px ${purple}55)`,
        opacity: shown ? 1 : 0,
        transition: 'opacity 1s ease .3s, transform .1s linear'
      }} />

      <div style={{
        position: 'relative', zIndex: 3,
        maxWidth: 900, margin: '0 auto',
        opacity: shown ? 1 : 0, transform: shown ? 'translateY(0)' : 'translateY(40px)',
        transition: 'all 1s ease'
      }}>
        <div className="mono" style={{
          fontSize: 12, letterSpacing: '0.36em', color: accent, marginBottom: 32
        }}>
          ▲ BOARDING NOW
        </div>
        <h2 className="h-display" style={{
          fontSize: 'clamp(64px, 9vw, 160px)',
          letterSpacing: '-0.055em',
          lineHeight: 0.95,
          marginBottom: 44
        }}>
          지금,<br/>
          <span style={{ color: accent, fontStyle: 'italic' }}>땡기세요.</span>
        </h2>
        <p className="body-kr" style={{
          fontSize: 18, color: 'var(--muted)', marginBottom: 52
        }}>
          앱을 설치하고 첫 주문 <span style={{ color: accent, fontWeight: 700 }}>5,000원 즉시 할인</span> 받기.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#" onClick={(e) => e.preventDefault()}>
            <button className="cta-btn" style={{
              padding: '20px 34px', borderRadius: 999, background: accent, color: '#0a0a0a',
              fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12,
              letterSpacing: '-0.005em'
            }}>
              <AppleIcon /> App Store
            </button>
          </a>
          <a href="#" onClick={(e) => e.preventDefault()}>
            <button className="cta-btn-alt" style={{
              padding: '20px 34px', borderRadius: 999,
              border: '1px solid var(--line)', background: 'rgba(255,255,255,0.03)',
              fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12,
              backdropFilter: 'blur(10px)', letterSpacing: '-0.005em'
            }}>
              <PlayIcon /> Google Play
            </button>
          </a>
        </div>
        <div className="mono" style={{
          marginTop: 60, fontSize: 10, opacity: 0.4, letterSpacing: '0.28em'
        }}>
          TRANSMISSION · END OF FILE · 00:29
        </div>
      </div>
      <style>{`
        .cta-btn { transition: transform .2s; }
        .cta-btn:hover { transform: translateY(-2px); }
        .cta-btn-alt { transition: background .2s; }
        .cta-btn-alt:hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>
    </section>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 20.5V3.5c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.25-.84-.76-.84-1.35zm13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27zm3.35-4.31l-2.35-1.35-2.58 2.54 2.58 2.54 2.39-1.35c.71-.56.71-1.75-.04-2.38zM6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z"/>
    </svg>
  );
}

// ----- FOOTER -----
function Footer({ accent }) {
  return (
    <footer style={{
      borderTop: '1px solid var(--line)', padding: '64px 48px 44px',
      position: 'relative', zIndex: 2, background: 'var(--bg-deep)'
    }}>
      <div style={{
        maxWidth: 1400, margin: '0 auto',
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 44,
        alignItems: 'flex-start'
      }}>
        <div style={{ maxWidth: 360 }}>
          <img src="assets/logo-wordmark.png" alt="땡겨요" style={{ height: 28 }} />
          <p className="body-kr" style={{
            fontSize: 13, opacity: 0.55, marginTop: 18, lineHeight: 1.7
          }}>
            너도 살고 나도 사는 우리동네 배달앱.<br/>
            신한은행 공식 배달 플랫폼 · 2026.
          </p>
          <p className="mono" style={{
            fontSize: 10, opacity: 0.35, marginTop: 14, letterSpacing: '0.18em'
          }}>
            ALL RIGHTS RESERVED · SHINHAN BANK
          </p>
        </div>
        <div style={{ display: 'flex', gap: 56, fontSize: 13 }} className="label-kr">
          <div>
            <div className="mono" style={{
              fontSize: 10, opacity: 0.4, marginBottom: 16, letterSpacing: '0.22em'
            }}>SERVICE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a>배달 주문</a><a>포장 주문</a><a>사장님 센터</a>
            </div>
          </div>
          <div>
            <div className="mono" style={{
              fontSize: 10, opacity: 0.4, marginBottom: 16, letterSpacing: '0.22em'
            }}>COMPANY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a>회사 소개</a><a>공지사항</a><a>문의하기</a>
            </div>
          </div>
          <div>
            <div className="mono" style={{
              fontSize: 10, opacity: 0.4, marginBottom: 16, letterSpacing: '0.22em'
            }}>LEGAL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a>이용약관</a><a>개인정보처리방침</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ----- TWEAKS -----
function TweaksPanel({ tweaks, setKey, open }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 100,
      width: 320, background: 'rgba(10,11,18,0.95)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16,
      padding: 20, fontFamily: 'Pretendard, sans-serif',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
    }}>
      <div className="mono" style={{
        fontSize: 11, letterSpacing: '0.22em', opacity: 0.6, marginBottom: 16
      }}>
        · TWEAKS ·
      </div>
      <TweakField label="헤드라인 카피">
        <input value={tweaks.headline} onChange={e => setKey('headline', e.target.value)} style={inpStyle} />
      </TweakField>
      <TweakField label="챕터 라벨">
        <input value={tweaks.chapter} onChange={e => setKey('chapter', e.target.value)} style={inpStyle} />
      </TweakField>
      <TweakField label="포인트 컬러">
        <div style={{ display: 'flex', gap: 8 }}>
          {['#FF5B2E','#FFB400','#FF3B6A','#7BE4B4','#A78BEA'].map(c => (
            <button key={c} onClick={() => setKey('accentColor', c)} style={{
              width: 30, height: 30, borderRadius: 8, background: c,
              border: tweaks.accentColor === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)'
            }} />
          ))}
        </div>
      </TweakField>
      <TweakField label="몰리 컬러">
        <div style={{ display: 'flex', gap: 8 }}>
          {['#A78BEA','#FF9FD5','#9FD8FF','#C9FF9F'].map(c => (
            <button key={c} onClick={() => setKey('mascotColor', c)} style={{
              width: 30, height: 30, borderRadius: 8, background: c,
              border: tweaks.mascotColor === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)'
            }} />
          ))}
        </div>
      </TweakField>
      <TweakField label="별 애니메이션">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={tweaks.showStars} onChange={e => setKey('showStars', e.target.checked)} />
          Show starfield
        </label>
      </TweakField>
    </div>
  );
}
const inpStyle = {
  width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
  color: '#fff', fontSize: 13, fontFamily: 'inherit'
};
function TweakField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6, letterSpacing: '-0.005em' }}>{label}</div>
      {children}
    </div>
  );
}

function App() {
  const { tweaks, open, setKey } = useTweaks();
  const accent = tweaks.accentColor;
  const purple = tweaks.mascotColor;

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--purple', purple);
    const starsEl = document.querySelector('.stars');
    if (starsEl) starsEl.style.display = tweaks.showStars ? '' : 'none';
  }, [accent, purple, tweaks.showStars]);

  return (
    <>
      <Nav accent={accent} />
      <HeroVideo tweaks={tweaks} />
      <TickerStrip accent={accent} />

      <Chapter
        id="story" num={1} chapter="THE ISOLATION"
        imgSrc="assets/astronaut-station.png"
        imgAlt="우주 정거장에서 떠도는 우주비행사"
        title={<>광활한 우주,<br/>혼자 떠도는 어느 날.</>}
        body="임무 3,142일차. 우주정거장 밖은 −270°C, 소리가 닿지 않는 진공. 그 순간 기억이 떠오릅니다. 매콤한 국물, 김 오르는 한 입 — 그 냄새가 문득, 땡깁니다."
        accent={accent}
      />

      <TypeBreak line1="그리고 우주는" line2="땡기기 시작했다." accent={accent} />

      <Chapter
        id="ch2" num={2} chapter="THE SIGNAL" reverse
        imgSrc="assets/delivery-closeup.png"
        imgAlt="헬멧 앞에 나타난 떡볶이 봉지"
        title={<>헬멧 너머로<br/>뜻밖의 손이 닿는다.</>}
        body="유리창 너머, 보라색 손이 내민 붉은 한 봉지. 진공 속에서도 뜨끈함이 전해집니다. 지구에서 주문한 떡볶이가 30분 만에 — 광년을 건너온 순간."
        accent={accent}
      />

      <MeetMolly accent={accent} purple={purple} />

      <TypeBreak line1="음식이 땡기는 순간," line2="땡겨요." accent={accent} />

      <BenefitsGrid accent={accent} purple={purple} />

      <CTASection accent={accent} purple={purple} />

      <Footer accent={accent} />

      <TweaksPanel tweaks={tweaks} setKey={setKey} open={open} />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
