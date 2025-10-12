import styles from "@/styles/component.module.css";
import Image from "next/image";
import LeftPanel from "../general/LeftPanel";
import RightPanel from "../general/RightPanel";

/**
 * DescriptionBox_Left - Non-clickable information display with logo on left
 * Used for presenting company info, work experience, or project details
 * without navigation functionality
 */
export default function DescriptionBox_Left({
  // Header details
  companyTitle,
  companySubTitles,
  location,
  timeframe,

  // Logo configuration
  logoSrc,
  logoAlt = "Company logo",
  logoSize = 80,

  // Content
  description,
  children,

  // Optional metadata badges/icons
  badges,
}) {
  return (
    <div className={styles.row}>
      <div className={styles.descriptionBox}>
        <div className={styles.rowInternalContainer}>
          {/* Left panel: Logo */}
          <LeftPanel>
            <div className={styles.descriptionBoxLogoContainer}>
              <Image
                width={logoSize}
                height={logoSize}
                src={logoSrc}
                alt={logoAlt}
                className={styles.descriptionBoxLogo}
                unoptimized
              />
            </div>
          </LeftPanel>

          {/* Right panel: Content */}
          <RightPanel wide>
            {/* Header with title, location, and timeframe */}
            <div className={styles.descriptionBoxHeader}>
              <p className={styles.title}>{companyTitle}</p>
              {(location || timeframe) && (
                <div className={styles.descriptionBoxMeta}>
                  {location && (
                    <span className={styles.descriptionBoxLocation}>
                      {location}
                    </span>
                  )}
                  {location && timeframe && (
                    <span className={styles.descriptionBoxMetaSeparator}>
                      {" • "}
                    </span>
                  )}
                  {timeframe && (
                    <span className={styles.descriptionBoxTimeframe}>
                      {timeframe}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Main description */}
            {description && <p className={styles.description}>{description}</p>}

            {/* Additional content/children */}
            {children}

            {/* Optional badges (tech stack, etc) */}
            {badges && (
              <div className={styles.descriptionBoxBadges}>{badges}</div>
            )}
          </RightPanel>
        </div>
      </div>
    </div>
  );
}
