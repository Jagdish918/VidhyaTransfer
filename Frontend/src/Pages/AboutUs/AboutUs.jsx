import React from "react";
import "./AboutUs.css";
import { FaBullseye, FaEye, FaUsers } from "react-icons/fa";

const AboutUs = () => {
  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.heroSection}>
        <h1 style={styles.heroTitle}>About Vidya Transfer</h1>
        <p style={styles.heroSubtitle}>
          Reimagining peer-to-peer learning through innovative technology and community-driven knowledge sharing.
        </p>
      </div>

      {/* Main Content Section */}
      <div style={styles.contentSection}>
        <div style={styles.contentWrapper}>
          {/* Left Side - Mission and Vision Cards */}
          <div style={styles.cardsContainer}>
            {/* Mission Card */}
            <div style={styles.card}>
              <div style={styles.cardIcon} className="mission-icon">
                <FaBullseye style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <h2 style={styles.cardTitle}>Our Mission</h2>
              <p style={styles.cardText}>
                To democratize learning by creating a platform where anyone can share their knowledge and learn from others. 
                We believe that everyone has something valuable to teach and something meaningful to learn, breaking down 
                traditional barriers to education.
              </p>
            </div>

            {/* Vision Card */}
            <div style={styles.card}>
              <div style={styles.cardIcon} className="vision-icon">
                <FaEye style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <h2 style={styles.cardTitle}>Our Vision</h2>
              <p style={styles.cardText}>
                To build a global community where knowledge is accessible, learning is collaborative, and every interaction 
                creates value for both teachers and students. We envision a future where skills are shared freely and 
                communities grow stronger through collective wisdom.
              </p>
            </div>
          </div>

          {/* Right Side - Community Visual */}
          <div style={styles.communityCard}>
            <div style={styles.communityImageWrapper}>
              <img 
                src="https://media.licdn.com/dms/image/v2/D4D12AQF8Zym1URlUdw/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1675779883789?e=2147483647&v=beta&t=Sdl1tnLrAV89A5FJHCK95ruH4oA8kWjvL7YfPLRFDH4" 
                alt="Community" 
                style={styles.communityImage}
              />
            </div>
            <div style={styles.communityBadge}>
              <FaUsers style={{ fontSize: '20px', color: '#3B82F6' }} />
              <span style={styles.badgeText}>10,000+ Community Members</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 50%, #F9FAFB 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  heroSection: {
    padding: '100px 24px 80px',
    textAlign: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  heroTitle: {
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontWeight: '900',
    background: 'linear-gradient(135deg, #14B8A6 0%, #3B82F6 50%, #10B981 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '24px',
    letterSpacing: '-2px',
  },
  heroSubtitle: {
    fontSize: 'clamp(1rem, 2vw, 1.25rem)',
    color: '#475569',
    lineHeight: '1.7',
    maxWidth: '800px',
    margin: '0 auto',
  },
  contentSection: {
    padding: '0 24px 100px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  contentWrapper: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
    alignItems: 'start',
  },
  cardsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    padding: '40px',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    position: 'relative',
    transition: 'all 0.3s ease',
  },
  cardIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: '16px',
  },
  cardText: {
    fontSize: '1rem',
    color: '#475569',
    lineHeight: '1.7',
    margin: 0,
  },
  communityCard: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    padding: '32px',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  communityImageWrapper: {
    width: '100%',
    borderRadius: '16px',
    overflow: 'hidden',
    background: '#F1F5F9',
  },
  communityImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  communityBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  badgeText: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1E293B',
  },
};

// Add CSS for icon colors
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  .mission-icon {
    background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  }
  .vision-icon {
    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  }
  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12) !important;
  }
  @media (max-width: 1024px) {
    .content-wrapper {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default AboutUs;
