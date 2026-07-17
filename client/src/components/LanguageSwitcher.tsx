import { languages } from "../i18n/translations";
import { useLanguage } from "../context/LanguageContext";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-switcher" role="group" aria-label="Språk / Language">
      {languages.map((lang) => (
        <button
          key={lang}
          type="button"
          className={`language-switcher-button${lang === language ? " active" : ""}`}
          onClick={() => setLanguage(lang)}
          aria-pressed={lang === language}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
