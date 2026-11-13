import { Link } from "react-router-dom";

import {
  BookOpen,
  BrainCircuit,
  Users,
  Search,
  Target,
  Eye,
  GraduationCap,
  LibraryBig,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import "../App.css";

function AboutPage() {
  return (
    <div className="about-page">
      {/* Navigation */}
      <header className="navbar">
        <Link to="/" className="brand">
          <span className="brand-icon">S</span>
          <span>SmartShelf</span>
        </Link>

        <nav className="about-nav">
          <Link to="/">Home</Link>
          <Link to="/explore">Explore Books</Link>
          <Link to="/about" className="active">
            About
          </Link>
        </nav>

        <div className="about-nav-actions">
          <Link to="/login" className="about-login">
            Login
          </Link>

          <Link to="/register" className="about-get-started">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <span className="about-eyebrow">
            <Sparkles size={16} />
            ABOUT SMARTSHELF
          </span>

          <h1>
            Making knowledge
            <span>easier to discover.</span>
          </h1>

          <p>
            SmartShelf is an AI-powered library discovery and recommendation
            system designed to make finding, exploring and accessing knowledge
            easier for university students and lecturers.
          </p>

          <Link to="/explore" className="about-primary-button">
            Explore Our Collection
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="about-hero-visual">
          <div className="about-visual-circle">
            <LibraryBig size={100} strokeWidth={1.2} />
          </div>

          <div className="about-floating-card">
            <BrainCircuit size={24} />

            <div>
              <strong>AI-Powered</strong>
              <span>Smarter discovery</span>
            </div>
          </div>

          <div className="about-floating-book">
            <BookOpen size={24} />
            Discover. Learn. Borrow.
          </div>
        </div>
      </section>

      {/* About Introduction */}
      <section className="about-intro">
        <div className="about-section-heading">
          <span className="about-section-label">OUR STORY</span>

          <h2>A smarter way to explore your university library.</h2>
        </div>

        <p>
          Finding the right learning resources should be simple. SmartShelf
          brings library discovery and intelligent recommendations together in
          one digital platform. Instead of spending time searching through
          resources, users can explore books and discover learning materials
          that match their interests and needs.
        </p>
      </section>

      {/* Features Section */}
      <section className="about-features">
        <div className="about-section-heading centered">
          <span className="about-section-label">WHAT WE OFFER</span>

          <h2>Designed to make learning easier</h2>

          <p>
            Discover the tools that make SmartShelf a smarter library
            experience.
          </p>
        </div>

        <div className="about-feature-grid">
          <article className="about-feature-card">
            <div className="about-feature-icon">
              <Search size={27} />
            </div>

            <h3>Easy Book Discovery</h3>

            <p>
              Explore library resources through a simple and user-friendly
              discovery experience.
            </p>
          </article>

          <article className="about-feature-card">
            <div className="about-feature-icon">
              <BrainCircuit size={27} />
            </div>

            <h3>AI-Powered Recommendations</h3>

            <p>
              Discover relevant reading materials with intelligent
              recommendations.
            </p>
          </article>

          <article className="about-feature-card">
            <div className="about-feature-icon">
              <BookOpen size={27} />
            </div>

            <h3>Library Access</h3>

            <p>
              Find book information and explore available library resources in
              one place.
            </p>
          </article>

          <article className="about-feature-card">
            <div className="about-feature-icon">
              <Users size={27} />
            </div>

            <h3>For the University Community</h3>

            <p>
              A platform designed to support students, lecturers and library
              staff.
            </p>
          </article>
        </div>
      </section>

      {/* Mission and Vision */}
      <section className="about-purpose">
        <article className="about-purpose-card">
          <div className="about-purpose-icon">
            <Target size={30} />
          </div>

          <span>OUR MISSION</span>

          <h2>Make knowledge accessible.</h2>

          <p>
            To simplify library discovery and help university communities find
            useful learning resources through an accessible and intelligent
            digital platform.
          </p>
        </article>

        <article className="about-purpose-card vision">
          <div className="about-purpose-icon">
            <Eye size={30} />
          </div>

          <span>OUR VISION</span>

          <h2>Inspire a smarter learning journey.</h2>

          <p>
            To create a connected and intelligent library experience where
            discovering knowledge becomes easier, more meaningful and more
            engaging.
          </p>
        </article>
      </section>

      {/* University Identity and Community */}
      <section className="about-community">
        <div className="about-community-icon">
          <GraduationCap size={42} />
        </div>

        <span>FACULTY OF TECHNOLOGY</span>

        <h2>Supporting a smarter learning community.</h2>

        <p>
          Developed for the Faculty of Technology Library, University of Sri
          Jayewardenepura, SmartShelf brings library discovery and intelligent
          recommendations into one convenient digital experience.
        </p>

        <div className="about-university-tag">
          <LibraryBig size={19} />
          <span>University of Sri Jayewardenepura</span>
        </div>

        <Link to="/explore" className="about-primary-button">
          Start Exploring
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <Link to="/" className="brand">
          <span className="brand-icon">S</span>
          <span>SmartShelf</span>
        </Link>

        <nav className="about-footer-links">
          <Link to="/">Home</Link>
          <Link to="/explore">Explore Books</Link>
          <Link to="/about">About</Link>
        </nav>

        <div className="about-footer-info">
          <p>Discover. Learn. Borrow.</p>
          <span>© 2026 SmartShelf. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

export default AboutPage;
