import { useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

interface AboutModalProps {
  onClose: () => void;
}

export function AboutModal({ onClose }: AboutModalProps) {
  const { t } = useLanguage();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-modal" onClick={(e) => e.stopPropagation()}>
        <div className="about-modal-header">
          <h2>{t.about.title}</h2>
          <button type="button" className="about-close" onClick={onClose} aria-label={t.myReportPanel.close}>
            ✕
          </button>
        </div>

        <section>
          <h3>{t.about.purposeTitle}</h3>
          <p>{t.about.purposeBody}</p>
        </section>

        <section>
          <h3>{t.about.rightTitle}</h3>
          <p>
            {t.about.rightBodyPre}
            <strong>{t.about.rightBodyStrong}</strong>
            {t.about.rightBodyPost}{" "}
            <a href="https://www.naturvardsverket.se/amnesomraden/allemansratten/" target="_blank" rel="noreferrer">
              {t.about.rightLinkText}
            </a>
            .
          </p>
        </section>

        <section>
          <h3>{t.about.reportTitle}</h3>
          <p>{t.about.reportBody}</p>
        </section>

        <section>
          <h3>{t.about.futureTitle}</h3>
          <p>{t.about.futureBody}</p>
        </section>
      </div>
    </div>
  );
}
