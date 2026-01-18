interface EuroFormatOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  spacing?: "normal" | "none" | "nbsp";
  negativeStyle?: "after-symbol" | "before-symbol";
  
  // ✨ NUOVA OPZIONE: Default true (comportamento attuale)
  fromCents?: boolean; 
}

export const useCurrencyFormatter = (globalOptions: EuroFormatOptions = {}) => {
  const baseConfig: EuroFormatOptions = {
    locale: "it-IT",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    spacing: "normal",
    negativeStyle: "after-symbol",
    fromCents: true, // Di default assume che siano centesimi (RETROCOMPATIBILE)
    ...globalOptions,
  };

  /**
   * FORMAT: accetta importo → restituisce stringa (€ 00,00)
   */
  const format = (amount: number | null | undefined, opts: EuroFormatOptions = {}): string => {
    // Gestione sicurezza null/undefined
    if (amount === undefined || amount === null) return '-';

    const config = { ...baseConfig, ...opts };

    // 💡 LOGICA INTELLIGENTE: Dividiamo solo se fromCents è true
    const value = config.fromCents 
        ? Math.abs(amount) / 100 
        : Math.abs(amount);

    const number = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: config.minimumFractionDigits,
      maximumFractionDigits: config.maximumFractionDigits,
    }).format(value);

    // Tipo di spazio
    const space =
      config.spacing === "none" ? "" : config.spacing === "nbsp" ? "\u00A0" : " ";

    // Negativi personalizzati
    if (amount < 0) {
      if (config.negativeStyle === "after-symbol") {
        return `€${space}-${number}`;
      } else {
        return `-${space}€${space}${number}`.trim();
      }
    }

    // Positivi
    return `€${space}${number}`;
  };

  return {
    euro: format,
    format,
  };
};