import { useEffect } from "react";

interface AboutModalProps {
  onClose: () => void;
}

export function AboutModal({ onClose }: AboutModalProps) {
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
          <h2>Om Tältkartan</h2>
          <button type="button" className="about-close" onClick={onClose} aria-label="Stäng">
            ✕
          </button>
        </div>

        <section>
          <h3>Syfte</h3>
          <p>
            Tältkartan är en karta över fria tältplatser i den svenska naturen - skog, fjäll, vid vatten
            och vägkanter. Det handlar om platser man kan slå upp tältet gratis med stöd av allemansrätten,
            inte betalda campingplatser eller anläggningar.
          </p>
        </section>

        <section>
          <h3>Allemansrätten och ditt ansvar</h3>
          <p>
            Allemansrätten ger dig rätt att vistas i naturen, men den kommer med skyldigheter: håll avstånd
            till bostadshus, undvik skyddad natur och privat tomtmark, och lämna inga spår. Platser på
            Tältkartan är inlagda av användare och är <strong>inte verifierade</strong> av oss. Det är alltid
            ditt eget ansvar att kontrollera att en plats faktiskt är laglig att tälta på innan du åker dit.
            Läs gärna mer hos{" "}
            <a href="https://www.naturvardsverket.se/amnesomraden/allemansratten/" target="_blank" rel="noreferrer">
              Naturvårdsverket
            </a>
            .
          </p>
        </section>

        <section>
          <h3>Rapportering</h3>
          <p>
            Ser du en plats som är felaktig, på privat mark eller olämplig av något annat skäl? Klicka på
            "Rapportera" för att flagga den. Varje plats går att rapportera en gång per besökare, för att
            hålla systemet till nytta och inte till spam.
          </p>
        </section>

        <section>
          <h3>Framtid</h3>
          <p>
            Tältkartan är just nu i ett tidigt skede med en användare. Planen är att så småningom öppna upp
            för fler användare med egna konton, så att fler kan bidra med platser tillsammans.
          </p>
        </section>
      </div>
    </div>
  );
}
