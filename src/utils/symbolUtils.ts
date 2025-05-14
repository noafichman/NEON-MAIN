import ms from 'milsymbol';

export const createSymbol = (sidc: string, options: any = {}) => {
  const symbol = new ms.Symbol(sidc, {
    size: options.size || 35,
    uniqueDesignation: options.uniqueDesignation || '',
    ...options
  });
  
  return symbol.asSVG();
};

interface SymbolInfo {
  symbolHtml: string;
  affiliation: string;
  echelon: string;
  description: string;
}

export const getSymbolInfo = (sidc: string): SymbolInfo => {
  const symbol = new ms.Symbol(sidc, {
    size: 40
  });
  
  // Determine affiliation (friendly, hostile, neutral, unknown)
  const affiliations: Record<string, string> = {
    "F": "Friendly",
    "H": "Hostile",
    "N": "Neutral",
    "U": "Unknown",
    "P": "Pending",
    "A": "Assumed Friend",
    "S": "Suspect",
    "G": "Exercise Pending",
    "W": "Exercise Unknown",
    "D": "Exercise Friend",
    "L": "Exercise Neutral",
    "M": "Exercise Assumed Friend",
    "J": "Joker",
    "K": "Faker"
  };
  
  // Determine echelon if available
  const echelons: Record<string, string> = {
    "A": "Team/Crew",
    "B": "Squad",
    "C": "Section",
    "D": "Platoon/Detachment",
    "E": "Company/Battery/Troop",
    "F": "Battalion/Squadron",
    "G": "Regiment/Group",
    "H": "Brigade",
    "I": "Division",
    "J": "Corps/MEF",
    "K": "Army",
    "L": "Army Group/Front",
    "M": "Region/Theater",
    "N": "Command"
  };
  
  const affiliation = affiliations[sidc.charAt(1)] || "Unknown";
  const echelon = echelons[sidc.charAt(11)] || "";
  
  return {
    symbolHtml: symbol.asSVG(),
    affiliation,
    echelon,
    description: "Symbol Description Unavailable"
  };
};