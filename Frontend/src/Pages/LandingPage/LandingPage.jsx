import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUsers, FaBook, FaStar, FaClock, FaCoins } from "react-icons/fa";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleStartLearning = () => {
    navigate('/register');
  };

  const handleExploreSkills = () => {
    // Scroll to features section
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <div style={styles.heroLeft}>
            <h1 style={styles.mainTitle}>
              Learn & Share Skills with Your Community
            </h1>
            <p style={styles.heroDescription}>
              Exchange knowledge, earn credits, and grow together. Connect with learners and experts in a collaborative platform designed for everyone.
            </p>
            <div style={styles.buttonGroup}>
              <button 
                onClick={handleStartLearning}
                style={styles.primaryButton}
              >
                Start Learning
              </button>
              <button 
                onClick={handleExploreSkills}
                style={styles.secondaryButton}
              >
                Explore Skills
              </button>
            </div>
            <div style={styles.statsBar}>
              <div style={styles.statItem}>
                <div style={styles.statIcon}>
                  <FaUsers style={{ fontSize: '24px', color: '#F59E0B' }} />
                </div>
                <span style={styles.statText}>10,000+ Active Members</span>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statIcon}>
                  <FaBook style={{ fontSize: '24px', color: '#F59E0B' }} />
                </div>
                <span style={styles.statText}>500+ Skills Available</span>
              </div>
            </div>
          </div>
          <div style={styles.heroRight}>
            <div style={styles.floatingCard}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.cardName}>Sarah Johnson</div>
                  <div style={styles.cardRole}>Graphic Designer</div>
                </div>
                <div style={styles.activeBadge}>Active</div>
              </div>
              <div style={styles.cardStatus}>Teaching Now</div>
              <div style={styles.cardSkill}>Advanced Photoshop Techniques</div>
              <div style={styles.cardDetails}>
                <div style={styles.cardDetailItem}>
                  <FaClock style={{ fontSize: '16px', color: '#6B7280' }} />
                  <span style={styles.cardDetailText}>45 min session</span>
                </div>
                <div style={styles.cardDetailItem}>
                  <FaCoins style={{ fontSize: '16px', color: '#6B7280' }} />
                  <span style={styles.cardDetailText}>+50 Credits</span>
                </div>
              </div>
              <div style={styles.cardRating}>
                <div style={styles.ratingNumber}>4.9</div>
                <div style={styles.ratingStars}>
                  <FaStar style={{ fontSize: '20px', color: '#F59E0B' }} />
                </div>
                <div style={styles.ratingText}>Avg Rating</div>
                <div style={styles.ratingStudents}>120 students enrolled</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" style={styles.howItWorksSection}>
        <h2 style={styles.sectionTitle}>Features</h2>
        <p style={styles.sectionSubtitle}>
          Discover what makes SkillSwap the perfect platform for skill exchange and learning.
        </p>
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <FaUsers style={{ fontSize: '48px', color: '#3B82F6' }} />
            </div>
            <h3 style={styles.featureTitle}>Connect with Experts</h3>
            <p style={styles.featureDescription}>
              Find and connect with skilled professionals who are ready to share their expertise with you.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <FaCoins style={{ fontSize: '48px', color: '#F59E0B' }} />
            </div>
            <h3 style={styles.featureTitle}>Credit System</h3>
            <p style={styles.featureDescription}>
              Earn credits by teaching and use them to learn new skills from others in the community.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <FaBook style={{ fontSize: '48px', color: '#10B981' }} />
            </div>
            <h3 style={styles.featureTitle}>Diverse Skills</h3>
            <p style={styles.featureDescription}>
              Access hundreds of skills across various domains, from technical to creative.
            </p>
          </div>
        </div>
      </div>

      {/* How SkillSwap Works Section */}
      <div id="how-it-works" style={styles.howItWorksSection}>
        <h2 style={styles.sectionTitle}>How SkillSwap Works</h2>
        <p style={styles.sectionSubtitle}>
          A simple, credit-based system that makes learning and teaching accessible to everyone.
        </p>
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <FaUsers style={{ fontSize: '48px', color: '#3B82F6' }} />
            </div>
            <h3 style={styles.featureTitle}>Create Your Profile</h3>
            <p style={styles.featureDescription}>
              Set up your profile, showcase your skills, and let others know what you can teach or want to learn.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <FaCoins style={{ fontSize: '48px', color: '#F59E0B' }} />
            </div>
            <h3 style={styles.featureTitle}>Earn Credits</h3>
            <p style={styles.featureDescription}>
              Teach others and earn credits that you can use to learn new skills from experts in your community.
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <FaBook style={{ fontSize: '48px', color: '#10B981' }} />
            </div>
            <h3 style={styles.featureTitle}>Learn & Grow</h3>
            <p style={styles.featureDescription}>
              Connect with mentors, attend sessions, and continuously expand your knowledge base.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #F9FAFB 0%, #E5E7EB 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  heroSection: {
    padding: '80px 24px 60px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  heroContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '60px',
    alignItems: 'center',
  },
  heroLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  mainTitle: {
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: '1.2',
    margin: 0,
    letterSpacing: '-1px',
  },
  heroDescription: {
    fontSize: '1.125rem',
    color: '#6B7280',
    lineHeight: '1.7',
    margin: 0,
    maxWidth: '600px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '16px',
    marginTop: '8px',
  },
  primaryButton: {
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },
  secondaryButton: {
    padding: '14px 32px',
    background: 'white',
    color: '#3B82F6',
    border: '2px solid #3B82F6',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  statsBar: {
    display: 'flex',
    gap: '40px',
    marginTop: '8px',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: '#FEF3C7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1F2937',
  },
  heroRight: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  floatingCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid #E5E7EB',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  cardName: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: '4px',
  },
  cardRole: {
    fontSize: '0.875rem',
    color: '#6B7280',
  },
  activeBadge: {
    padding: '6px 12px',
    background: '#D1FAE5',
    color: '#065F46',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  cardStatus: {
    fontSize: '0.875rem',
    color: '#6B7280',
    marginBottom: '8px',
  },
  cardSkill: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: '20px',
  },
  cardDetails: {
    display: 'flex',
    gap: '24px',
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid #E5E7EB',
  },
  cardDetailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardDetailText: {
    fontSize: '0.875rem',
    color: '#6B7280',
  },
  cardRating: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  ratingNumber: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#1F2937',
  },
  ratingStars: {
    display: 'flex',
    gap: '2px',
  },
  ratingText: {
    fontSize: '0.875rem',
    color: '#6B7280',
    marginLeft: '8px',
  },
  ratingStudents: {
    fontSize: '0.75rem',
    color: '#9CA3AF',
    marginLeft: 'auto',
  },
  howItWorksSection: {
    padding: '80px 24px',
    background: 'white',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: '16px',
  },
  sectionSubtitle: {
    fontSize: '1.125rem',
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: '700px',
    margin: '0 auto 60px',
    lineHeight: '1.7',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  featureCard: {
    background: 'white',
    borderRadius: '20px',
    padding: '40px 32px',
    border: '1px solid #E5E7EB',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  },
  featureIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    background: '#F3F4F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  featureTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: '12px',
  },
  featureDescription: {
    fontSize: '1rem',
    color: '#6B7280',
    lineHeight: '1.7',
    margin: 0,
  },
};

// Add hover effects
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4) !important;
  }
  .feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
  }
`;
document.head.appendChild(styleSheet);

export default LandingPage;
