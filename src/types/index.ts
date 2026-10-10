export type BuildingType = 'shed' | 'garage' | 'house';
export type ThermalType = 'cold' | 'warm' | 'residential';
export type RoofType = 'mono' | 'gable' | 'mansard';
export type LumberType = 'planed40' | 'planed45' | 'sawn50';
export type CommercialLength = 4000 | 4500 | 6000 | 0; // 0 means 'auto'
export type SheathingType = 'none' | 'osb9' | 'osb12' | 'osb15' | 'mdvp20';
export type FloorType = 'slab' | 'wooden';
export type WallSide = 'front' | 'back' | 'left' | 'right';
export type OpeningType = 'window' | 'door' | 'garage_door';
export type WallThicknessOption = 100 | 120 | 150 | 180 | 200 | 250;

export interface Opening {
  id: string;
  name: string;
  type: OpeningType;
  wall: WallSide;
  offsetFromCorner: number;
  width: number;
  height: number;
  bottomOffset: number;
}

export interface BuildingInputs {
  buildingType: BuildingType;
  thermalType: ThermalType;
  
  // Dimensions in meters
  length: number;
  width: number;
  wallHeight: number; // Base or uniform wall height (m)
  
  // Custom Individual Wall Heights
  isCustomWallHeights: boolean; // if true, each wall has its own height
  wallHeights: {
    front: number;
    back: number;
    left: number;
    right: number;
  };
  
  // Backward compatibility helpers
  isUnevenWalls: boolean;
  wallHeightHigh: number;
  highWallSide: WallSide;
  
  // Lumber choices
  lumberType: LumberType;
  commercialLength: CommercialLength;
  
  // Wall structure & Thickness
  studSpacing: 400 | 600 | 625;
  studWidth: WallThicknessOption;
  
  floorJoistWidth: 100 | 150 | 200 | 250;
  floorJoistSpacing: 400 | 600;
  floorType: FloorType;
  
  // Roof
  roofType: RoofType;
  roofPitchAngle: number;
  rafterWidth: 100 | 150 | 200 | 250;
  rafterSpacing: 600 | 800;
  overhangLength: number;
  
  // Dynamic Openings with custom position & wall
  openings: Opening[];
  
  // Sheathing & finishes
  wallSheathing: SheathingType;
  roofSheathing: 'osb12' | 'osb15' | 'osb18' | 'planks' | 'metal_direct';
  
  // Price estimates (UAH)
  prices: {
    lumberPerM3: number;
    osbSheet: number;
    insulationPerM3: number;
    membranePerM2: number;
    nails90PerKg: number;
    nails60PerKg: number;
    anchorM12Each: number;
    bracketEach: number;
  };
}

export interface NormativeAlert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  normReference: string;
  recommendation?: string;
}

export interface LumberBillItem {
  section: string;
  description: string;
  stockLengthM: number;
  piecesNeeded: number;
  volumeM3: number;
  wastePercent: number;
}

export interface HardwareBill {
  nails90Kg: number;
  nails90Pcs: number;
  nails60Kg: number;
  nails60Pcs: number;
  anchorsM12Pcs: number;
  rafterBracketsPcs: number;
  perforatedPlatesPcs: number;
}

export interface ThermalSummary {
  wallR: number;
  roofR: number;
  dbnRequiredRWall: number;
  dbnRequiredRRoof: number;
  isCompliant: boolean;
  peakHeatLossKw: number;
  recommendedHeaterKw: number;
  estimatedWinterMonthlyCostUah: number;
}

export interface CalculationResult {
  lumberItems: LumberBillItem[];
  totalLumberM3: number;
  hardware: HardwareBill;
  sheathingWallSheets: number;
  sheathingRoofSheets: number;
  insulationM3: number;
  vaporBarrierM2: number;
  windBarrierM2: number;
  diagonalM: number;
  calculatedPitchAngle: number;
  deltaHeightM: number;
  thermal: ThermalSummary;
  alerts: NormativeAlert[];
  costs: {
    lumberTotal: number;
    sheathingTotal: number;
    insulationTotal: number;
    membranesTotal: number;
    hardwareTotal: number;
    grandTotal: number;
  };
}
