import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiShoppingBag, FiTrendingUp, FiAward, FiShield,
  FiStar, FiHeart, FiArrowRight, FiZap,
} from "react-icons/fi";
import Button from "../../components/common/Button";
import "./Home.css";

/* ─── Animated counter ───────────────────────────────────────────────────── */
const useCountUp = (target, duration = 1800) => {
  const ref    = useRef(null);
  const hasRun = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true;
          const isDecimal = String(target).includes(".");
          const numeric   = parseFloat(String(target).replace(/[^0-9.]/g, ""));
          const suffix    = String(target).replace(/[0-9.,]/g, "");
          const start     = performance.now();
          const tick = (now) => {
            const p    = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            el.textContent = isDecimal
              ? (numeric * ease).toFixed(1) + suffix
              : Math.floor(numeric * ease).toLocaleString() + suffix;
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);
  return ref;
};

/* ─── Scroll reveal ──────────────────────────────────────────────────────── */
const useScrollReveal = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { el.classList.add("is-visible"); observer.disconnect(); }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
};

/* ─── Hero slides ────────────────────────────────────────────────────────── */
const HERO_SLIDES = [
  {
    url:     "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=700&q=85",
    label:   "Deportes",
    caption: "Zapatillas Runner Pro",
  },
  {
    url:     "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&q=85",
    label:   "Calzado",
    caption: "Nike Air Max Collection",
  },
  {
    url:     "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=700&q=85",
    label:   "Sneakers",
    caption: "Edición Limitada",
  },
  {
    url:     "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=700&q=85",
    label:   "Running",
    caption: "Gear de alto rendimiento",
  },
];

const SLIDE_INTERVAL = 3800; // ms

/* ─── Data ───────────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { emoji: "💻", label: "Electrónica", color: "#3b82f6", bg: "rgba(59,130,246,0.10)"  },
  { emoji: "👗", label: "Moda",        color: "#ec4899", bg: "rgba(236,72,153,0.10)"  },
  { emoji: "🏠", label: "Hogar",       color: "#f59e0b", bg: "rgba(245,158,11,0.10)"  },
  { emoji: "⚽", label: "Deportes",    color: "#22c55e", bg: "rgba(34,197,94,0.10)"   },
  { emoji: "✨", label: "Belleza",     color: "#a78bfa", bg: "rgba(167,139,250,0.10)" },
  { emoji: "🎮", label: "Gaming",      color: "#06b6d4", bg: "rgba(6,182,212,0.10)"   },
];

const PRODUCTS = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    name: "Reloj Premium Series X",
    price: "₡89,900", originalPrice: "₡120,000",
    rating: 4.8, reviews: 342, badge: "Más vendido", badgeColor: "blue",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400",
    name: "Kit Cuidado Personal Deluxe",
    price: "₡34,500", originalPrice: null,
    rating: 4.6, reviews: 118, badge: "Nuevo", badgeColor: "green",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400",
    name: "Zapatillas Runner Pro",
    price: "₡59,000", originalPrice: "₡72,000",
    rating: 4.9, reviews: 521, badge: "Oferta", badgeColor: "red",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    name: "Audífonos Noise-Cancel BT",
    price: "₡74,900", originalPrice: null,
    rating: 4.7, reviews: 209, badge: null, badgeColor: null,
  },
];

const MARQUEE_ITEMS = [
  "✦ Envío gratis en compras mayores a ₡20,000",
  "✦ +500 vendedores verificados",
  "✦ Garantía de devolución 30 días",
  "✦ Soporte 24/7",
  "✦ Pagos 100% seguros",
  "✦ Nuevos productos cada día",
];

/* ─── Hero Slideshow ─────────────────────────────────────────────────────── */
const HeroSlideshow = () => {
  const [current, setCurrent]   = useState(0);
  const [prev,    setPrev]      = useState(null);
  const [dir,     setDir]       = useState("next"); // "next" | "prev"
  const [paused,  setPaused]    = useState(false);
  const timerRef = useRef(null);

  const goTo = useCallback((idx, direction = "next") => {
    setPrev(current);
    setDir(direction);
    setCurrent(idx);
  }, [current]);

  const next = useCallback(() => {
    goTo((current + 1) % HERO_SLIDES.length, "next");
  }, [current, goTo]);

  const goIndex = (i) => {
    if (i === current) return;
    goTo(i, i > current ? "next" : "prev");
  };

  /* Auto-advance */
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, SLIDE_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [paused, next]);

  /* Progress bar key — resets on slide change */
  const [progressKey, setProgressKey] = useState(0);
  useEffect(() => { setProgressKey(k => k + 1); }, [current]);

  return (
    <div
      className="hero-slideshow"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {HERO_SLIDES.map((slide, i) => {
        const isActive = i === current;
        const isPrev   = i === prev;
        return (
          <div
            key={i}
            className={[
              "slide",
              isActive ? `slide--active slide--enter-${dir}` : "",
              isPrev   ? `slide--exit-${dir}` : "",
            ].join(" ").trim()}
            aria-hidden={!isActive}
          >
            <img src={slide.url} alt={slide.caption} loading={i === 0 ? "eager" : "lazy"} />
            {/* Slide caption */}
            <div className={`slide-caption${isActive ? " slide-caption--visible" : ""}`}>
              <span className="slide-label">{slide.label}</span>
              <span className="slide-title">{slide.caption}</span>
            </div>
          </div>
        );
      })}

      {/* Thumbnails / dot nav */}
      <div className="slide-thumbs">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={i}
            className={`slide-thumb${i === current ? " slide-thumb--active" : ""}`}
            onClick={() => goIndex(i)}
            aria-label={slide.caption}
          >
            <img src={slide.url} alt={slide.caption} />
            {i === current && (
              <span
                key={progressKey}
                className="slide-thumb-progress"
                style={{ animationDuration: `${SLIDE_INTERVAL}ms` }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Glow ring */}
      <div className="hero-glow-ring" aria-hidden="true" />
    </div>
  );
};

/* ─── Sub-components ─────────────────────────────────────────────────────── */
const StatItem = ({ value, label, icon }) => {
  const countRef = useCountUp(value);
  const wrapRef  = useScrollReveal();
  return (
    <div className="stat-item reveal-up" ref={wrapRef}>
      <div className="stat-icon">{icon}</div>
      <h3 ref={countRef}>0</h3>
      <p>{label}</p>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, delay }) => {
  const ref = useScrollReveal();
  return (
    <div className="feature-card reveal-up" ref={ref} style={{ "--delay": `${delay}ms` }}>
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

const CategoryCard = ({ emoji, label, color, bg, delay }) => {
  const ref = useScrollReveal();
  return (
    <Link
      to={`/categorias/${label.toLowerCase()}`}
      className="category-card reveal-up"
      ref={ref}
      style={{ "--delay": `${delay}ms`, "--cat-color": color, "--cat-bg": bg }}
    >
      <div className="category-emoji-wrap">
        <span className="category-emoji">{emoji}</span>
      </div>
      <span className="category-label">{label}</span>
    </Link>
  );
};

const ProductCard = ({ product, delay }) => {
  const ref = useScrollReveal();
  return (
    <Link
      to={`/productos/${product.id}`}
      className="product-card reveal-up"
      ref={ref}
      style={{ "--delay": `${delay}ms` }}
    >
      {product.badge && (
        <span className={`product-badge product-badge--${product.badgeColor}`}>
          {product.badge}
        </span>
      )}
      <button className="product-wishlist" aria-label="Guardar" onClick={e => e.preventDefault()}>
        <FiHeart />
      </button>
      <div className="product-image">
        <img src={product.image} alt={product.name} loading="lazy" />
      </div>
      <div className="product-body">
        <h4 className="product-name">{product.name}</h4>
        <div className="product-rating">
          <FiStar className="star-icon" />
          <span className="rating-num">{product.rating}</span>
          <span className="review-count">({product.reviews} reseñas)</span>
        </div>
        <div className="product-footer">
          <div className="product-prices">
            <span className="product-price">{product.price}</span>
            {product.originalPrice && <span className="product-original">{product.originalPrice}</span>}
          </div>
          <button className="product-add" aria-label="Agregar al carrito" onClick={e => e.preventDefault()}>
            <FiShoppingBag />
          </button>
        </div>
      </div>
    </Link>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   HOME PAGE
   ════════════════════════════════════════════════════════════════════════════ */
const Home = () => {
  const heroRef        = useRef(null);
  const heroContentRef = useRef(null);
  const heroImageRef   = useRef(null);
  const ctaRef         = useScrollReveal();
  const catTitleRef    = useScrollReveal();
  const prodTitleRef   = useScrollReveal();
  const featTitleRef   = useScrollReveal();

  /* Hero entrance */
  useEffect(() => {
    const content = heroContentRef.current;
    const image   = heroImageRef.current;
    if (!content || !image) return;
    requestAnimationFrame(() => {
      content.classList.add("hero-content--visible");
      setTimeout(() => image.classList.add("hero-image--visible"), 180);
    });
  }, []);

  /* Hero parallax on orbs */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const fn = (e) => {
      const x = (e.clientX / window.innerWidth  - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 14;
      hero.style.setProperty("--mx", `${x}px`);
      hero.style.setProperty("--my", `${y}px`);
    };
    hero.addEventListener("mousemove", fn);
    return () => hero.removeEventListener("mousemove", fn);
  }, []);

  return (
    <div className="home-page">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="hero-section" ref={heroRef}>
        <div className="orbs" aria-hidden="true">
          <span className="orb orb--1" /><span className="orb orb--2" />
          <span className="orb orb--3" /><span className="orb orb--4" />
        </div>
        <div className="hero-grid" aria-hidden="true" />

        <div className="container">
          <div className="hero-content" ref={heroContentRef}>
            <span className="hero-badge">
              <FiZap className="badge-zap" />
              <span className="badge-dot" />
              Nuevo · Marketplace 2025
            </span>
            <h1 className="hero-title">
              Descubre el
              <br />
              <span className="gradient-text">Marketplace</span>
              <br />
              más completo
            </h1>
            <p className="hero-subtitle">
              Miles de productos de vendedores verificados. Compra seguro,
              recibe rápido y disfruta de soporte post-venta de calidad.
            </p>
            <div className="hero-trust">
              <span className="trust-item"><FiStar className="trust-icon gold" /> 4.8 / 5 rating</span>
              <span className="trust-sep" />
              <span className="trust-item">🔒 Pago seguro</span>
              <span className="trust-sep" />
              <span className="trust-item">🚚 Envío rápido</span>
            </div>
            <div className="hero-actions">
              <Link to="/productos">
                <Button variant="primary" size="large" icon={<FiShoppingBag />}>
                  Explorar Productos
                </Button>
              </Link>
              <Link to="/registro">
                <Button variant="secondary" size="large">
                  Registrarse Gratis
                </Button>
              </Link>
            </div>
          </div>

          {/* ── Slideshow ─────────────────────────────────────────────────── */}
          <div className="hero-image" ref={heroImageRef}>
            <HeroSlideshow />
            <div className="hero-badge-card hero-badge-card--a">
              <span className="badge-card-icon">🛍️</span>
              <div><strong>10k+</strong><small>Productos</small></div>
            </div>
            <div className="hero-badge-card hero-badge-card--b">
              <span className="badge-card-icon">⭐</span>
              <div><strong>4.8 / 5</strong><small>Calificación</small></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee ───────────────────────────────────────────────────────── */}
      <div className="marquee-band" aria-hidden="true">
        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="marquee-item">{item}</span>
          ))}
        </div>
      </div>

      {/* ── Categories ────────────────────────────────────────────────────── */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <div>
              <p className="section-eyebrow">Navega rápido</p>
              <h2 className="section-title reveal-up" ref={catTitleRef}>Explorar por categoría</h2>
            </div>
            <Link to="/categorias" className="section-link">Ver todas <FiArrowRight /></Link>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map((cat, i) => <CategoryCard key={cat.label} {...cat} delay={i * 55} />)}
          </div>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────────────────── */}
      <section className="products-section">
        <div className="container">
          <div className="section-header">
            <div>
              <p className="section-eyebrow">Selección curada</p>
              <h2 className="section-title reveal-up" ref={prodTitleRef}>Productos destacados</h2>
            </div>
            <Link to="/productos" className="section-link">Ver todos <FiArrowRight /></Link>
          </div>
          <div className="products-grid">
            {PRODUCTS.map((p, i) => <ProductCard key={p.id} product={p} delay={i * 75} />)}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="features-section">
        <div className="container">
          <div className="features-header">
            <p className="section-eyebrow">Nuestras ventajas</p>
            <h2 className="section-title reveal-up" ref={featTitleRef}>¿Por qué elegirnos?</h2>
          </div>
          <div className="features-grid">
            <FeatureCard icon={<FiShoppingBag />} title="Múltiples Vendedores"
              description="Accede a miles de productos de diferentes vendedores verificados en un solo lugar." delay={0} />
            <FeatureCard icon={<FiShield />} title="Compra Segura"
              description="Todos los pagos están protegidos. Tu información está segura con nosotros." delay={80} />
            <FeatureCard icon={<FiTrendingUp />} title="Mejores Precios"
              description="Compara precios entre vendedores y encuentra las mejores ofertas del mercado." delay={160} />
            <FeatureCard icon={<FiAward />} title="Soporte 24/7"
              description="Nuestro equipo de soporte está disponible para ayudarte en todo momento." delay={240} />
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="cta-orbs" aria-hidden="true">
          <span className="cta-orb cta-orb--1" /><span className="cta-orb cta-orb--2" /><span className="cta-orb cta-orb--3" />
        </div>
        <div className="container">
          <div className="cta-content reveal-up" ref={ctaRef}>
            <span className="cta-badge">Para vendedores</span>
            <h2>¿Listo para vender?</h2>
            <p>Únete a nuestra plataforma y alcanza miles de clientes potenciales. Gestiona tu inventario, órdenes y ventas desde un solo lugar.</p>
            <div className="cta-actions">
              <Link to="/registro">
                <Button variant="primary" size="large">Vender en Marketplace</Button>
              </Link>
              <div className="cta-social-proof">
                <div className="cta-avatars">
                  {["A","B","C","D"].map(l => <span key={l} className="cta-avatar">{l}</span>)}
                </div>
                <span>+500 vendedores activos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <StatItem value="10,000+" label="Productos activos"  icon="📦" />
            <StatItem value="500+"    label="Vendedores"         icon="🏪" />
            <StatItem value="50,000+" label="Clientes felices"   icon="😊" />
            <StatItem value="4.8/5"   label="Calificación media" icon="⭐" />
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;