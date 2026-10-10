import { BuildingInputs, CalculationResult, LumberBillItem, NormativeAlert, HardwareBill, ThermalSummary, Opening } from '../types';

export function calculateBuilding(inputs: BuildingInputs): CalculationResult {
  const alerts: NormativeAlert[] = [];

  // 1. Thickness in mm of chosen lumber
  const lumberThickness = inputs.lumberType === 'planed40' ? 40 : inputs.lumberType === 'planed45' ? 45 : 50;

  // 2. Resolve heights for each wall
  let hFront = inputs.wallHeight;
  let hBack = inputs.wallHeight;
  let hLeft = inputs.wallHeight;
  let hRight = inputs.wallHeight;

  if (inputs.isCustomWallHeights && inputs.wallHeights) {
    hFront = inputs.wallHeights.front || inputs.wallHeight;
    hBack = inputs.wallHeights.back || inputs.wallHeight;
    hLeft = inputs.wallHeights.left || ((hFront + hBack) / 2);
    hRight = inputs.wallHeights.right || ((hFront + hBack) / 2);
  } else if (inputs.roofType === 'mono' && inputs.isUnevenWalls) {
    const low = Math.min(inputs.wallHeight, inputs.wallHeightHigh || inputs.wallHeight);
    const high = Math.max(inputs.wallHeight, inputs.wallHeightHigh || inputs.wallHeight);
    if (inputs.highWallSide === 'front') {
      hFront = high;
      hBack = low;
      hLeft = (high + low) / 2;
      hRight = (high + low) / 2;
    } else if (inputs.highWallSide === 'back') {
      hFront = low;
      hBack = high;
      hLeft = (high + low) / 2;
      hRight = (high + low) / 2;
    } else if (inputs.highWallSide === 'left') {
      hLeft = high;
      hRight = low;
      hFront = (high + low) / 2;
      hBack = (high + low) / 2;
    } else {
      hLeft = low;
      hRight = high;
      hFront = (high + low) / 2;
      hBack = (high + low) / 2;
    }
  }

  const hMin = Math.min(hFront, hBack, hLeft, hRight);
  const hMax = Math.max(hFront, hBack, hLeft, hRight);
  const avgWallHeight = (hFront + hBack + hLeft + hRight) / 4;

  // Automatic Slope and Angle calculation for Mono-pitch roof:
  let deltaHeightM = 0;
  let calculatedPitchAngle = inputs.roofPitchAngle;
  let slopeSpan = inputs.width;

  const isFrontBackDiff = Math.abs(hFront - hBack) > 0.01;
  const isLeftRightDiff = Math.abs(hLeft - hRight) > 0.01;

  if (inputs.roofType === 'mono') {
    if (isFrontBackDiff) {
      deltaHeightM = Number(Math.abs(hFront - hBack).toFixed(2));
      slopeSpan = inputs.width;
      calculatedPitchAngle = Number(((Math.atan2(deltaHeightM, slopeSpan) * 180) / Math.PI).toFixed(1));
    } else if (isLeftRightDiff) {
      deltaHeightM = Number(Math.abs(hLeft - hRight).toFixed(2));
      slopeSpan = inputs.length;
      calculatedPitchAngle = Number(((Math.atan2(deltaHeightM, slopeSpan) * 180) / Math.PI).toFixed(1));
    } else {
      deltaHeightM = 0;
      calculatedPitchAngle = inputs.roofPitchAngle;
    }
  }

  // 3. Wall Areas
  const frontArea = inputs.length * hFront;
  const backArea = inputs.length * hBack;
  const leftArea = inputs.width * hLeft;
  const rightArea = inputs.width * hRight;
  const wallGrossArea = frontArea + backArea + leftArea + rightArea;
  const perimeter = 2 * (inputs.length + inputs.width);

  // Total Openings Area & Validation
  let totalOpeningsArea = 0;
  let totalOpeningStudsLinearM = 0;
  let totalHeadersLinearM = 0;
  let totalSillsLinearM = 0;
  let totalCripplesLinearM = 0;
  let openingNails90 = 0;
  let totalInterruptedStuds = 0;

  inputs.openings.forEach((op: Opening) => {
    const wallLength = (op.wall === 'front' || op.wall === 'back') ? inputs.length : inputs.width;
    const wallName = op.wall === 'front' ? 'Фасадній' : op.wall === 'back' ? 'Задній' : op.wall === 'left' ? 'Лівій' : 'Правій';

    // Position check
    if (op.offsetFromCorner + op.width > wallLength) {
      alerts.push({
        id: `opening_overflow_${op.id}`,
        type: 'danger',
        title: `Проріз «${op.name}» (${op.width}м) виходить за межі стіни!`,
        message: `На ${wallName} стіні довжиною ${wallLength} м проріз із відступом ${op.offsetFromCorner} м та шириною ${op.width} м перевищує габарити стіни на ${(op.offsetFromCorner + op.width - wallLength).toFixed(2)} м.`,
        normReference: 'Геометрія каркасу',
        recommendation: `Зменшіть відступ від кута або ширину прорізу.`
      });
    } else if (op.offsetFromCorner < 0.2) {
      alerts.push({
        id: `opening_too_close_corner_${op.id}`,
        type: 'warning',
        title: `Проріз «${op.name}» занадто близько до кута (${op.offsetFromCorner}м)`,
        message: `Для монтажу кутової зв'язки (California corner або 3-х стійкового кута) та правильного утеплення рекомендується відступ від кута мінімум 250–300 мм.`,
        normReference: 'СП 31-105-2002 п. 7.2.5',
        recommendation: `Збільшіть відступ до 0.3 м.`
      });
    }

    if (op.width >= 1.8) {
      alerts.push({
        id: `wide_header_${op.id}`,
        type: 'warning',
        title: `Широкий проріз «${op.name}» (${op.width}м): потрібен посилений хедер`,
        message: `За нормами IRC Table R602.7(1) / СП 31-105 для прорізу понад 1.8 м потрібен подвійний хедер мінімум ${lumberThickness}×200 мм та по 2 опорні стійки (Jack Studs) з кожного боку.`,
        normReference: 'IRC Table R602.7(1) / СП 31-105 табл. Б.11',
        recommendation: `Використовуйте здвоєний хедер ${lumberThickness}×200 мм.`
      });
    }

    totalOpeningsArea += (op.width * op.height);

    // Track interrupted studs
    const studSpacingM = inputs.studSpacing / 1000;
    const interruptedByThisOp = Math.floor(op.width / studSpacingM);
    totalInterruptedStuds += interruptedByThisOp;

    // Height of host wall for this opening
    const opHostHeight = op.wall === 'front' ? hFront : op.wall === 'back' ? hBack : op.wall === 'left' ? hLeft : hRight;

    totalOpeningStudsLinearM += 2 * opHostHeight;

    const jackStudsCount = op.width > 1.8 ? 4 : 2;
    const jackHeight = Math.max(0.2, (op.bottomOffset + op.height));
    totalOpeningStudsLinearM += jackStudsCount * jackHeight;

    const headerSpan = op.width + (jackStudsCount * (lumberThickness / 1000));
    totalHeadersLinearM += 2 * headerSpan;

    if (op.bottomOffset > 0) {
      totalSillsLinearM += op.width;
    }

    const crippleColumns = Math.max(1, interruptedByThisOp || 1);
    const topCrippleHeight = Math.max(0.1, opHostHeight - (op.bottomOffset + op.height) - 0.2);
    totalCripplesLinearM += crippleColumns * topCrippleHeight;
    if (op.bottomOffset > 0) {
      totalCripplesLinearM += crippleColumns * Math.max(0.1, op.bottomOffset - 0.05);
    }

    openingNails90 += Math.ceil(jackHeight / 0.3) * 2 * jackStudsCount;
    openingNails90 += 16;
    openingNails90 += crippleColumns * 8;
  });

  if (totalInterruptedStuds > 0) {
    alerts.push({
      id: 'studs_overlap_accounted',
      type: 'info',
      title: `Перекриття стійок прорізами: враховано ${totalInterruptedStuds} перерваних стійок`,
      message: `Прорізи перекривають ${totalInterruptedStuds} рядових стійок кроку ${inputs.studSpacing} мм. Їх автоматично віднято від цільних дощок стін та враховано як коротиші (Cripples) над хедерами та під підвіконнями.`,
      normReference: 'СП 31-105-2002 п. 7.2.13 / IRC R602.3'
    });
  }

  const wallNetArea = Math.max(0, wallGrossArea - totalOpeningsArea);

  // Roof geometry
  let rafterLength = 0;
  let roofAreaGross = 0;

  if (inputs.roofType === 'mono') {
    if (deltaHeightM > 0) {
      rafterLength = Math.sqrt(slopeSpan * slopeSpan + deltaHeightM * deltaHeightM) + (2 * inputs.overhangLength);
      const alongRoofSide = isFrontBackDiff ? inputs.length : inputs.width;
      roofAreaGross = (alongRoofSide + 2 * inputs.overhangLength) * rafterLength;
    } else {
      const pitchRad = (inputs.roofPitchAngle * Math.PI) / 180;
      rafterLength = (inputs.width / Math.cos(pitchRad)) + (2 * inputs.overhangLength);
      roofAreaGross = (inputs.length + 2 * inputs.overhangLength) * rafterLength;
    }
  } else {
    // Gable / Mansard
    const pitchRad = (inputs.roofPitchAngle * Math.PI) / 180;
    const rafterSpanHalf = inputs.width / 2;
    rafterLength = (rafterSpanHalf / Math.cos(pitchRad)) + inputs.overhangLength;
    roofAreaGross = 2 * (inputs.length + 2 * inputs.overhangLength) * rafterLength;
  }

  const diagonalM = Math.sqrt(inputs.length * inputs.length + inputs.width * inputs.width);

  // ==========================================
  // 3. NORMATIVE LINTER CHECKS
  // ==========================================

  // A. Floor Joist Check
  if (inputs.floorType === 'wooden') {
    const floorSpan = inputs.width;
    let maxSafeSpan = 2.0;
    if (inputs.floorJoistWidth === 100) {
      maxSafeSpan = inputs.floorJoistSpacing === 400 ? 2.2 : 1.85;
    } else if (inputs.floorJoistWidth === 150) {
      maxSafeSpan = inputs.floorJoistSpacing === 400 ? 3.4 : 2.9;
    } else if (inputs.floorJoistWidth === 200) {
      maxSafeSpan = inputs.floorJoistSpacing === 400 ? 4.5 : 3.9;
    } else if (inputs.floorJoistWidth === 250) {
      maxSafeSpan = inputs.floorJoistSpacing === 400 ? 5.5 : 4.8;
    }

    if (floorSpan > maxSafeSpan) {
      alerts.push({
        id: 'joist_span_exceeded',
        type: 'danger',
        title: `Критичний прогин перекриття: дошка ${lumberThickness}×${inputs.floorJoistWidth} на прольоті ${floorSpan.toFixed(1)} м!`,
        message: `Для прольоту ${floorSpan.toFixed(1)} м дошка перерізом ${lumberThickness}×${inputs.floorJoistWidth} з кроком ${inputs.floorJoistSpacing} мм не відповідає нормам жорсткості. Прогин перевищить допустимі 1/250, підлога буде вібрувати («ефект батута»).`,
        normReference: 'ДБН В.2.6-161:2017 табл. 6.2 / IRC Таблиця R502.3.1(2)',
        recommendation: floorSpan <= 3.4 
          ? `Рекомендується збільшити висоту балки до ${lumberThickness}×150 мм (при кроці 400 мм) або до ${lumberThickness}×200 мм (при кроці 600 мм).`
          : `Рекомендується висота балки мінімум ${lumberThickness}×200 мм або встановлення проміжної несучої балки/фундаменту.`
      });
    } else {
      alerts.push({
        id: 'joist_span_ok',
        type: 'success',
        title: `Балки перекриття відповідають нормам жорсткості`,
        message: `Переріз ${lumberThickness}×${inputs.floorJoistWidth} з кроком ${inputs.floorJoistSpacing} мм забезпечує допустимий прогин (≤ L/360) на прольоті ${floorSpan.toFixed(1)} м.`,
        normReference: 'ДБН В.2.6-161:2017'
      });
    }
  }

  // B. Wall Stud Height Check
  if (hMax > 3.0 && inputs.studWidth < 150) {
    alerts.push({
      id: 'stud_height_exceeded',
      type: 'warning',
      title: `Стійки високої стіни: висота ${hMax.toFixed(2)} м занадто велика для дошки ${inputs.studWidth} мм`,
      message: `При висоті стін понад 3.0 м стійки ${lumberThickness}×${inputs.studWidth} схильні до втрати поздовжньої стійкості від вітрового навантаження.`,
      normReference: 'СП 31-105-2002 п. 7.2.3 / IRC Table R602.3(5)',
      recommendation: `Збільшіть ширину стійки до ${lumberThickness}×150 мм або зменшіть крок між стійками до 400 мм.`
    });
  }

  // C. Roof Pitch Warning
  if (inputs.roofType === 'mono' && calculatedPitchAngle < 8) {
    alerts.push({
      id: 'roof_pitch_low',
      type: 'warning',
      title: `Замалий ухил односкатної покрівлі (${calculatedPitchAngle}°)`,
      message: `Перепад висот ${deltaHeightM} м на прольоті ${slopeSpan} м дає ухил лише ${calculatedPitchAngle}°. Мінімальний ухил для металопрофілю/металочерепиці — 8–10°, інакше вода застоюватиметься на стиках.`,
      normReference: 'ДБН В.2.6-220:2017 «Покрівлі»',
      recommendation: `Збільшіть перепад висот між стінами хоча б до ${(slopeSpan * Math.tan((8.5 * Math.PI) / 180)).toFixed(2)} м для досягнення кута ≥8.5°.`
    });
  }

  // ==========================================
  // 4. THERMAL ANALYSIS
  // ==========================================
  const wallInsulationThickness = inputs.thermalType === 'cold' ? 0 : inputs.studWidth / 1000;
  const roofInsulationThickness = inputs.thermalType === 'cold' ? 0 : (inputs.thermalType === 'residential' ? Math.max(inputs.rafterWidth, 200) / 1000 : inputs.rafterWidth / 1000);
  
  const rWall = inputs.thermalType === 'cold' ? 0.35 : Number((wallInsulationThickness / 0.038 + 0.15).toFixed(2));
  const rRoof = inputs.thermalType === 'cold' ? 0.35 : Number((roofInsulationThickness / 0.038 + 0.2).toFixed(2));
  
  const dbnRequiredRWall = 3.3;
  const dbnRequiredRRoof = 4.95;
  const isCompliant = inputs.thermalType === 'cold' || (rWall >= dbnRequiredRWall && rRoof >= dbnRequiredRRoof);

  if (inputs.thermalType === 'residential' && !isCompliant) {
    alerts.push({
      id: 'thermal_below_dbn',
      type: 'warning',
      title: `Теплоізоляція стін (R=${rWall}) нижча за норми ДБН (R≥${dbnRequiredRWall})`,
      message: `Для житлового цілорічного будинку товщини каркасу ${inputs.studWidth} мм недостатньо для проходження чинного ДБН В.2.6-31:2021. Будуть підвищені витрати на опалення.`,
      normReference: 'ДБН В.2.6-31:2021 «Теплова ізоляція та енергоефективність будівель»',
      recommendation: `Рекомендується товщина 200 мм (150мм + 50мм контрутеплення).`
    });
  }

  const deltaT = 42;
  const wallLossW = (wallNetArea / (rWall || 0.5)) * deltaT;
  const roofLossW = (roofAreaGross / (rRoof || 0.5)) * deltaT;
  const ventilationLossW = (inputs.length * inputs.width * avgWallHeight * 0.5 * 0.34) * deltaT;
  const peakHeatLossKw = inputs.thermalType === 'cold' ? 0 : Number(((wallLossW + roofLossW + ventilationLossW) / 1000).toFixed(1));
  const recommendedHeaterKw = inputs.thermalType === 'cold' ? 0 : Number((peakHeatLossKw * 1.25).toFixed(1));
  const avgKw = peakHeatLossKw * (21 / 42);
  const estimatedWinterMonthlyCostUah = inputs.thermalType === 'cold' ? 0 : Math.round(avgKw * 24 * 30 * 4.32 * 0.7);

  const thermal: ThermalSummary = {
    wallR: rWall,
    roofR: rRoof,
    dbnRequiredRWall,
    dbnRequiredRRoof,
    isCompliant,
    peakHeatLossKw,
    recommendedHeaterKw,
    estimatedWinterMonthlyCostUah
  };

  // ==========================================
  // 5. LUMBER & CUTTING CALCULATOR
  // ==========================================
  let stockLengthM = inputs.commercialLength === 0 ? 6.0 : inputs.commercialLength / 1000;
  if (inputs.commercialLength === 0) {
    if (hMax <= 2.2) stockLengthM = 4.5;
    else if (hMax <= 2.95) stockLengthM = 6.0;
    else stockLengthM = 6.0;
  }

  const lumberItems: LumberBillItem[] = [];

  // A. Wall Framing Members:
  const totalPlatesLinearM = 3 * perimeter;
  const plateBoardsCount = Math.ceil((totalPlatesLinearM / stockLengthM) * 1.05);

  const studSpacingM = inputs.studSpacing / 1000;
  const rawStudsCount = Math.ceil(perimeter / studSpacingM) + 4;
  // Deduct full-height studs that are interrupted by window/door openings:
  const regularStudsCount = Math.max(4, rawStudsCount - totalInterruptedStuds);
  const studsPerBoard = Math.floor(stockLengthM / avgWallHeight) || 1;
  const regularStudBoardsCount = Math.ceil(regularStudsCount / studsPerBoard);

  const openingsExtraLinearM = totalOpeningStudsLinearM + totalSillsLinearM + totalCripplesLinearM;
  const openingsBoardsCount = Math.ceil((openingsExtraLinearM / stockLengthM) * 1.1);

  const wallBoardsTotal = plateBoardsCount + regularStudBoardsCount + openingsBoardsCount;
  const wallVolumeM3 = wallBoardsTotal * stockLengthM * (lumberThickness / 1000) * (inputs.studWidth / 1000);
  const wallWastePercent = Math.max(3, Math.round(((stockLengthM - (studsPerBoard * avgWallHeight)) / stockLengthM) * 100));

  lumberItems.push({
    section: `${lumberThickness}×${inputs.studWidth}`,
    description: deltaHeightM > 0
      ? `Стійки різної висоти (${hMin.toFixed(2)}м – ${hMax.toFixed(2)}м), подвійна обв'язка, косі стійки та прорізи`
      : `Стійки стін (${inputs.wallHeight.toFixed(2)}м), подвійна верхня обв'язка, кути та прорізи`,
    stockLengthM,
    piecesNeeded: wallBoardsTotal,
    volumeM3: Number(wallVolumeM3.toFixed(2)),
    wastePercent: wallWastePercent
  });

  // B. Headers
  if (totalHeadersLinearM > 0) {
    const headerSectionWidth = Math.max(inputs.studWidth, 150);
    const headerBoardsCount = Math.ceil((totalHeadersLinearM / stockLengthM) * 1.15);
    const headerVolumeM3 = headerBoardsCount * stockLengthM * (lumberThickness / 1000) * (headerSectionWidth / 1000);
    
    lumberItems.push({
      section: `${lumberThickness}×${headerSectionWidth}`,
      description: `Хедери над вікнами та дверима (подвійні дошки на ребро)`,
      stockLengthM,
      piecesNeeded: headerBoardsCount,
      volumeM3: Number(headerVolumeM3.toFixed(2)),
      wastePercent: 8
    });
  }

  // C. Floor Joists (if wooden)
  if (inputs.floorType === 'wooden') {
    const joistSpacingM = inputs.floorJoistSpacing / 1000;
    const joistsCount = Math.ceil(inputs.length / joistSpacingM) + 1;
    const rimJoistsLinearM = 2 * (inputs.length + inputs.width);
    const rimBoardsCount = Math.ceil(rimJoistsLinearM / stockLengthM);
    
    const joistsPerBoard = Math.floor(stockLengthM / inputs.width) || 1;
    const mainJoistBoardsCount = Math.ceil(joistsCount / joistsPerBoard);
    const totalFloorBoards = rimBoardsCount + mainJoistBoardsCount;
    const floorVolumeM3 = totalFloorBoards * stockLengthM * (lumberThickness / 1000) * (inputs.floorJoistWidth / 1000);
    const floorWaste = Math.max(3, Math.round(((stockLengthM - (joistsPerBoard * inputs.width)) / stockLengthM) * 100));

    lumberItems.push({
      section: `${lumberThickness}×${inputs.floorJoistWidth}`,
      description: `Лаги перекриття підлоги (проліт ${inputs.width.toFixed(1)} м, крок ${inputs.floorJoistSpacing} мм) + обв'язка`,
      stockLengthM,
      piecesNeeded: totalFloorBoards,
      volumeM3: Number(floorVolumeM3.toFixed(2)),
      wastePercent: floorWaste
    });
  }

  // D. Roof Rafters
  const rafterSpacingM = inputs.rafterSpacing / 1000;
  const alongRoofLength = isFrontBackDiff ? inputs.length : inputs.width;
  const rafterPairsCount = Math.ceil(alongRoofLength / rafterSpacingM) + 1;
  const totalRafters = inputs.roofType === 'mono' ? rafterPairsCount : rafterPairsCount * 2;
  
  const raftersPerBoard = Math.floor(stockLengthM / rafterLength) || 1;
  const rafterBoardsCount = Math.ceil(totalRafters / raftersPerBoard);
  
  const collarTiesCount = inputs.roofType === 'gable' ? rafterPairsCount : 0;
  const tiesBoardsCount = Math.ceil((collarTiesCount * (inputs.width * 0.6)) / stockLengthM);
  const totalRoofLumberBoards = rafterBoardsCount + tiesBoardsCount;
  const roofVolumeM3 = totalRoofLumberBoards * stockLengthM * (lumberThickness / 1000) * (inputs.rafterWidth / 1000);
  const roofWaste = Math.max(4, Math.round(((stockLengthM - (raftersPerBoard * rafterLength)) / stockLengthM) * 100));

  lumberItems.push({
    section: `${lumberThickness}×${inputs.rafterWidth}`,
    description: `Крокви даху (довжина крокви ${rafterLength.toFixed(2)} м, ${totalRafters} крокв)`,
    stockLengthM,
    piecesNeeded: totalRoofLumberBoards,
    volumeM3: Number(roofVolumeM3.toFixed(2)),
    wastePercent: roofWaste
  });

  // E. Obreshitka
  const obreshitkaLinearM = (roofAreaGross / 0.35) * 1.05;
  const obreshitkaBoards = Math.ceil(obreshitkaLinearM / stockLengthM);
  const obreshitkaM3 = obreshitkaBoards * stockLengthM * 0.025 * 0.100;

  lumberItems.push({
    section: `25×100 (або 30×100)`,
    description: `Обрешітка покрівлі (крок 350 мм)`,
    stockLengthM,
    piecesNeeded: obreshitkaBoards,
    volumeM3: Number(obreshitkaM3.toFixed(2)),
    wastePercent: 5
  });

  const totalLumberM3 = lumberItems.reduce((acc, it) => acc + it.volumeM3, 0);

  // ==========================================
  // 6. HARDWARE
  // ==========================================
  let nailsPerStudEnd = 2;
  if (inputs.studWidth >= 200) nailsPerStudEnd = 4;
  else if (inputs.studWidth >= 150) nailsPerStudEnd = 3;

  const studNails = (regularStudsCount + 4) * nailsPerStudEnd * 2;
  const doublePlateNails = Math.ceil(perimeter / 0.4) * 2;
  const cornerNails = 4 * 12;
  const rafterNails = totalRafters * 4;
  
  const totalNails90Pcs = Math.round((studNails + doublePlateNails + cornerNails + rafterNails + openingNails90) * 1.15);
  const nails90Kg = Number((totalNails90Pcs / 100).toFixed(1));

  const osbSheetArea = 1.25 * 2.5;
  const sheathingWallSheets = inputs.wallSheathing === 'none' ? 0 : Math.ceil((wallNetArea / osbSheetArea) * 1.1);
  const sheathingRoofSheets = inputs.roofSheathing.startsWith('osb') ? Math.ceil((roofAreaGross / osbSheetArea) * 1.08) : 0;
  const totalOsbSheets = sheathingWallSheets + sheathingRoofSheets;
  
  const totalNails60Pcs = totalOsbSheets * 40;
  const nails60Kg = Number((totalNails60Pcs / 320).toFixed(1));

  const anchorsM12Pcs = Math.ceil(perimeter / 1.3) + 8 + (inputs.openings.filter(o => o.bottomOffset === 0).length * 2);
  const rafterBracketsPcs = totalRafters * 2;
  const perforatedPlatesPcs = rafterPairsCount * 2;

  const hardware: HardwareBill = {
    nails90Kg,
    nails90Pcs: totalNails90Pcs,
    nails60Kg,
    nails60Pcs: totalNails60Pcs,
    anchorsM12Pcs,
    rafterBracketsPcs,
    perforatedPlatesPcs
  };

  // ==========================================
  // 7. INSULATION & MEMBRANES
  // ==========================================
  const wallInsulationM3 = inputs.thermalType === 'cold' ? 0 : wallNetArea * (inputs.studWidth / 1000);
  const roofInsulationM3 = inputs.thermalType === 'cold' ? 0 : roofAreaGross * (inputs.rafterWidth / 1000);
  const insulationM3 = Number((wallInsulationM3 + roofInsulationM3).toFixed(2));

  const vaporBarrierM2 = inputs.thermalType === 'cold' ? 0 : Math.round((wallNetArea + roofAreaGross) * 1.15);
  const windBarrierM2 = Math.round((wallNetArea + roofAreaGross) * 1.15);

  // ==========================================
  // 8. COSTS SUMMARY
  // ==========================================
  const lumberTotal = Math.round(totalLumberM3 * inputs.prices.lumberPerM3);
  const sheathingTotal = Math.round(totalOsbSheets * inputs.prices.osbSheet);
  const insulationTotal = Math.round(insulationM3 * inputs.prices.insulationPerM3);
  const membranesTotal = Math.round((vaporBarrierM2 + windBarrierM2) * inputs.prices.membranePerM2);
  const hardwareTotal = Math.round(
    (nails90Kg * inputs.prices.nails90PerKg) +
    (nails60Kg * inputs.prices.nails60PerKg) +
    (anchorsM12Pcs * inputs.prices.anchorM12Each) +
    (rafterBracketsPcs * inputs.prices.bracketEach)
  );
  const grandTotal = lumberTotal + sheathingTotal + insulationTotal + membranesTotal + hardwareTotal;

  return {
    lumberItems,
    totalLumberM3: Number(totalLumberM3.toFixed(2)),
    hardware,
    sheathingWallSheets,
    sheathingRoofSheets,
    insulationM3,
    vaporBarrierM2,
    windBarrierM2,
    diagonalM: Number(diagonalM.toFixed(2)),
    calculatedPitchAngle,
    deltaHeightM,
    thermal,
    alerts,
    costs: {
      lumberTotal,
      sheathingTotal,
      insulationTotal,
      membranesTotal,
      hardwareTotal,
      grandTotal
    }
  };
}
