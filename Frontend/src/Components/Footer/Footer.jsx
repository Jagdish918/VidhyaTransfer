import React from "react";

const Footer = () => {
  return (
    <>
      <style>{`
        .footer-link:hover {
          color: #6B7280 !important;
        }
        @media (max-width: 768px) {
          .footer-container {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
        }
      `}</style>
      <footer style={styles.footer}>
        <div style={styles.container} className="footer-container">
          <div style={styles.copyright}>
            © 2025 SkillSwap. All rights reserved.
          </div>
          <div style={styles.links}>
            <a href="#" className="footer-link" style={styles.link}>Privacy Policy</a>
            <a href="#" className="footer-link" style={styles.link}>Terms of Service</a>
          </div>
        </div>
      </footer>
    </>
  );
};

const styles = {
  footer: {
    background: '#F9FAFB',
    borderTop: '1px solid #E5E7EB',
    padding: '32px 0',
    marginTop: 'auto',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyright: {
    fontSize: '0.875rem',
    color: '#9CA3AF',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  links: {
    display: 'flex',
    gap: '24px',
  },
  link: {
    fontSize: '0.875rem',
    color: '#9CA3AF',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
};


export default Footer;
