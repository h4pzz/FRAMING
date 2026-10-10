import { BuildingInputs } from '../types';

export const DEFAULT_INPUTS: BuildingInputs = {
  buildingType: 'garage',
  thermalType: 'warm',
  length: 6.0,
  width: 4.0,
  wallHeight: 2.7,
  
  isCustomWallHeights: false,
  wallHeights: {
    front: 2.7,
    back: 2.7,
    left: 2.7,
    right: 2.7
  },
  
  isUnevenWalls: false,
  wallHeightHigh: 3.2,
  highWallSide: 'front',
  
  lumberType: 'planed40',
  commercialLength: 6000,
  
  studSpacing: 600,
  studWidth: 150,
  
  floorType: 'slab',
  floorJoistWidth: 150,
  floorJoistSpacing: 600,
  
  roofType: 'gable',
  roofPitchAngle: 25,
  rafterWidth: 200,
  rafterSpacing: 600,
  overhangLength: 0.5,
  
  openings: [
    {
      id: 'op_1',
      name: 'Гаражні ворота',
      type: 'garage_door',
      wall: 'front',
      offsetFromCorner: 0.6,
      width: 2.8,
      height: 2.2,
      bottomOffset: 0
    },
    {
      id: 'op_2',
      name: 'Вхідні двері',
      type: 'door',
      wall: 'left',
      offsetFromCorner: 0.8,
      width: 0.9,
      height: 2.05,
      bottomOffset: 0
    },
    {
      id: 'op_3',
      name: 'Вікно майстерні',
      type: 'window',
      wall: 'back',
      offsetFromCorner: 2.0,
      width: 1.2,
      height: 1.0,
      bottomOffset: 1.0
    }
  ],
  
  wallSheathing: 'osb12',
  roofSheathing: 'planks',
  
  prices: {
    lumberPerM3: 9500,
    osbSheet: 480,
    insulationPerM3: 2200,
    membranePerM2: 35,
    nails90PerKg: 95,
    nails60PerKg: 110,
    anchorM12Each: 45,
    bracketEach: 28
  }
};

export const PRESETS: { name: string; icon: string; desc: string; inputs: Partial<BuildingInputs> }[] = [
  {
    name: 'Хозблок 3×4 м (Різні стіни, односкатний)',
    icon: '🛖',
    desc: 'Односкатний дах, перепад висот стін, авто-кут',
    inputs: {
      buildingType: 'shed',
      thermalType: 'cold',
      length: 4.0,
      width: 3.0,
      wallHeight: 2.0,
      isCustomWallHeights: true,
      wallHeights: {
        front: 2.5, // 250 cm
        back: 2.0,  // 200 cm
        left: 2.25,
        right: 2.25
      },
      isUnevenWalls: true,
      wallHeightHigh: 2.5,
      highWallSide: 'front',
      lumberType: 'planed40',
      commercialLength: 4500,
      studSpacing: 600,
      studWidth: 100,
      roofType: 'mono',
      roofPitchAngle: 9.5,
      rafterWidth: 150,
      floorType: 'wooden',
      floorJoistWidth: 150,
      floorJoistSpacing: 600,
      openings: [
        {
          id: 'shed_door',
          name: 'Двері сараю',
          type: 'door',
          wall: 'front',
          offsetFromCorner: 0.5,
          width: 0.9,
          height: 1.95,
          bottomOffset: 0
        },
        {
          id: 'shed_window',
          name: 'Кватирка',
          type: 'window',
          wall: 'left',
          offsetFromCorner: 1.0,
          width: 0.8,
          height: 0.6,
          bottomOffset: 1.2
        }
      ],
      wallSheathing: 'osb9'
    }
  },
  {
    name: 'Гараж 6×4 м (з воротами 2.8 м)',
    icon: '🚗',
    desc: 'Теплий гараж/майстерня, ворота 2.8м, плита по ґрунту',
    inputs: {
      buildingType: 'garage',
      thermalType: 'warm',
      length: 6.0,
      width: 4.0,
      wallHeight: 2.7,
      isCustomWallHeights: false,
      wallHeights: {
        front: 2.7,
        back: 2.7,
        left: 2.7,
        right: 2.7
      },
      isUnevenWalls: false,
      lumberType: 'planed40',
      commercialLength: 6000,
      studSpacing: 600,
      studWidth: 150,
      roofType: 'gable',
      roofPitchAngle: 25,
      rafterWidth: 200,
      floorType: 'slab',
      openings: [
        {
          id: 'gar_door',
          name: 'Ворота підйомні',
          type: 'garage_door',
          wall: 'front',
          offsetFromCorner: 0.6,
          width: 2.8,
          height: 2.2,
          bottomOffset: 0
        },
        {
          id: 'gar_side_door',
          name: 'Бічні двері',
          type: 'door',
          wall: 'left',
          offsetFromCorner: 1.0,
          width: 0.9,
          height: 2.05,
          bottomOffset: 0
        }
      ],
      wallSheathing: 'osb12'
    }
  },
  {
    name: 'Житловий будинок / Дача 6×8 м',
    icon: '🏡',
    desc: 'Цілорічне проживання за ДБН (утеплення 200мм)',
    inputs: {
      buildingType: 'house',
      thermalType: 'residential',
      length: 8.0,
      width: 6.0,
      wallHeight: 2.8,
      isCustomWallHeights: false,
      wallHeights: {
        front: 2.8,
        back: 2.8,
        left: 2.8,
        right: 2.8
      },
      isUnevenWalls: false,
      lumberType: 'planed40',
      commercialLength: 6000,
      studSpacing: 600,
      studWidth: 200,
      roofType: 'gable',
      roofPitchAngle: 30,
      rafterWidth: 200,
      floorType: 'wooden',
      floorJoistWidth: 200,
      floorJoistSpacing: 400,
      openings: [
        {
          id: 'h_door',
          name: 'Вхідні двері',
          type: 'door',
          wall: 'front',
          offsetFromCorner: 1.0,
          width: 1.0,
          height: 2.1,
          bottomOffset: 0
        },
        {
          id: 'h_win_front',
          name: 'Вікно фасадне',
          type: 'window',
          wall: 'front',
          offsetFromCorner: 3.5,
          width: 1.6,
          height: 1.4,
          bottomOffset: 0.85
        },
        {
          id: 'h_win_back',
          name: 'Вікно спальні',
          type: 'window',
          wall: 'back',
          offsetFromCorner: 2.0,
          width: 1.4,
          height: 1.4,
          bottomOffset: 0.85
        }
      ],
      wallSheathing: 'osb12'
    }
  }
];
