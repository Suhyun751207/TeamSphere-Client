import React from 'react';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* 로고 및 회사 정보 */}
          <div className={styles.brandSection}>
            <div className={styles.logoContainer}>
              <img 
                src="/iconTitle.png" 
                alt="TeamSphere Logo" 
                className={styles.logo}
              />
              <span className={styles.brandName}>TeamSphere</span>
            </div>
            <p className={styles.description}>
              팀 협업을 위한 통합 플랫폼
            </p>
          </div>

          {/* 연락처 정보 */}
          <div className={styles.contactSection}>
            <h4 className={styles.sectionTitle}>연락처</h4>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>이메일:</span>
                <a href="mailto:23s607h0659@gmail.com" className={styles.contactLink}>
                  23s607h0659@gmail.com
                </a>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>전화:</span>
                <a href="tel:010-8497-1645" className={styles.contactLink}>
                  010-8497-1645
                </a>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>주소:</span>
                <span className={styles.contactText}>서울세명컴퓨터고등학교</span>
              </div>
            </div>
          </div>

          {/* 링크 섹션 */}
          <div className={styles.linksSection}>
            <h4 className={styles.sectionTitle}>바로가기</h4>
            <div className={styles.links}>
              <a href="#" className={styles.link}>개인정보처리방침</a>
              <a href="#" className={styles.link}>이용약관</a>
              <a href="#" className={styles.link}>도움말</a>
              <a href="#" className={styles.link}>지원센터</a>
            </div>
          </div>

          {/* 소셜 미디어 */}
          <div className={styles.socialSection}>
            <h4 className={styles.sectionTitle}>소셜 미디어</h4>
            <div className={styles.socialLinks}>
              <a 
                href="https://github.com/Suhyun751207" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialLink}
                title="GitHub"
              >
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* 저작권 정보 */}
        <div className={styles.copyright}>
          <p>&copy; 2025 TeamSphere. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
