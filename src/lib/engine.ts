import { projectTypes, residentialRates, type Climate, type Level, type Method, type ProjectType } from './data'

export type ModuleInput = {
  id: string
  typeId: string
  quantity: number
  customRate?: number
  occupancy: number
  daysPerWeek: number
  returnCoeff: number
  saving: number
}

export type CalculationInput = {
  name: string
  stateId: string
  municipality: string
  climate: Climate
  level: Level
  method: Method
  cvd: number
  cvh: number
  safety: number
  minFactor: number
  additionalFlow: number
  uncertainty: number
  notes: string
  modules: ModuleInput[]
}

export type ModuleResult = {
  id: string
  type: ProjectType
  rate: number
  potableDay: number
  potableAverage: number
  wastewaterAverage: number
  occupancyFactor: number
  calendarFactor: number
}

export type CalculationResult = {
  modules: ModuleResult[]
  potableAverage: number
  wastewaterAverage: number
  wastewaterDay: number
  annualVolume: number
  qmedSanitary: number
  qmed: number
  qmin: number
  qmaxDaily: number
  qmax: number
  qextra: number
  peakFactor: number
  harmon: number
  equivalentPopulation: number
  profile: { hour: number; factor: number; flow: number }[]
  low: number
  high: number
  warnings: string[]
}

const baseProfiles: Record<ProjectType['profile'], number[]> = {
  residential: [0.35,0.25,0.2,0.18,0.25,0.55,1.1,1.65,1.55,1.05,0.8,0.75,0.85,0.8,0.7,0.75,0.9,1.15,1.5,1.75,1.5,1.1,0.75,0.5],
  office: [0.05,0.04,0.03,0.03,0.04,0.08,0.15,0.45,1.2,1.7,1.8,1.7,1.2,1.5,1.75,1.7,1.35,0.8,0.35,0.15,0.1,0.08,0.06,0.05],
  continuous: [0.55,0.5,0.45,0.45,0.5,0.65,0.85,1.1,1.25,1.3,1.25,1.2,1.25,1.2,1.15,1.15,1.2,1.3,1.35,1.2,1.0,0.85,0.7,0.6],
  hotel: [0.35,0.28,0.25,0.25,0.35,0.7,1.35,1.8,1.7,1.15,0.75,0.65,0.7,0.65,0.6,0.65,0.8,1.05,1.35,1.55,1.4,1.05,0.7,0.45],
  school: [0.02,0.02,0.02,0.02,0.02,0.05,0.15,0.7,1.6,2.0,2.1,1.8,1.1,1.8,2.0,1.4,0.5,0.15,0.05,0.03,0.02,0.02,0.02,0.02],
  commerce: [0.05,0.04,0.03,0.03,0.04,0.06,0.1,0.2,0.45,0.8,1.15,1.5,1.75,1.65,1.4,1.25,1.35,1.6,1.8,1.65,1.25,0.85,0.45,0.15],
}

function normalizedProfile(kind: ProjectType['profile']) {
  const values = baseProfiles[kind]
  const mean = values.reduce((a,b) => a+b,0) / 24
  return values.map(v => v/mean)
}

export function getModuleType(typeId: string) {
  return projectTypes.find(t => t.id === typeId) ?? projectTypes[0]
}

export function harmonCoefficient(population: number) {
  if (population < 1000) return 3.8
  if (population > 100000) return 2
  return 1 + 14 / (4 + Math.sqrt(population / 1000))
}

export function calculate(input: CalculationInput): CalculationResult {
  const modules = input.modules.map(module => {
    const type = getModuleType(module.typeId)
    const rate = module.customRate !== undefined && Number.isFinite(module.customRate)
      ? Math.max(0, module.customRate)
      : type.residential ? residentialRates[input.climate][input.level] : type.rate ?? 0
    const occupancyFactor = Math.min(100, Math.max(0, module.occupancy)) / 100
    const calendarFactor = Math.min(7, Math.max(0, module.daysPerWeek)) / 7
    const savingFactor = 1 - Math.min(95, Math.max(0, module.saving)) / 100
    const potableDay = Math.max(0, module.quantity) * rate * occupancyFactor * savingFactor
    const potableAverage = potableDay * calendarFactor
    const wastewaterAverage = potableAverage * Math.min(1.2, Math.max(0, module.returnCoeff / 100))
    return { id: module.id, type, rate, potableDay, potableAverage, wastewaterAverage, occupancyFactor, calendarFactor }
  })

  const potableAverage = modules.reduce((sum,m) => sum + m.potableAverage, 0)
  const wastewaterAverage = modules.reduce((sum,m) => sum + m.wastewaterAverage, 0)
  const wastewaterDay = modules.reduce((sum,m) => sum + m.potableDay * (input.modules.find(x => x.id === m.id)?.returnCoeff ?? 75) / 100, 0)
  const qmedSanitary = wastewaterAverage / 86400
  const referenceRate = residentialRates[input.climate][input.level]
  const equivalentPopulation = referenceRate > 0 ? modules.reduce((sum,m) => {
    if (m.type.residential) {
      const raw = input.modules.find(x => x.id === m.id)!
      return sum + Math.max(0,raw.quantity) * m.occupancyFactor * m.calendarFactor
    }
    return sum + m.potableAverage / referenceRate
  },0) : 0
  const harmon = harmonCoefficient(equivalentPopulation)

  const combined = Array(24).fill(0) as number[]
  modules.forEach(module => {
    const profile = normalizedProfile(module.type.profile)
    profile.forEach((value,h) => { combined[h] += value * module.wastewaterAverage })
  })
  const profileMean = combined.reduce((a,b) => a+b,0)/24
  const factors = combined.map(value => profileMean > 0 ? value/profileMean : 1)
  const profilePeak = Math.max(...factors, 1)
  const peakFactor = input.method === 'harmon' ? harmon : input.method === 'demanda' ? input.cvd * input.cvh : profilePeak

  const additional = Math.max(0,input.additionalFlow)
  const qmed = qmedSanitary + additional
  const qmin = qmedSanitary * Math.max(0,input.minFactor) + additional
  const qmaxDaily = qmedSanitary * Math.max(1,input.cvd) + additional
  const qmax = qmedSanitary * Math.max(1,peakFactor) + additional
  const qextra = qmedSanitary * Math.max(1,peakFactor) * Math.max(1,input.safety) + additional
  const uncertainty = Math.min(50,Math.max(0,input.uncertainty))/100
  const warnings: string[] = []
  if (input.modules.some(m => m.customRate !== undefined)) warnings.push('Hay consumos editados: conservar la evidencia que sustenta cada cambio.')
  if (input.additionalFlow > 0 && input.safety > 1) warnings.push('Infiltración adicional y coeficiente extraordinario están activos: revisar que no representen el mismo fenómeno.')
  if (input.method === 'perfil') warnings.push('El perfil horario es una hipótesis normalizada, no una curva medida ni un coeficiente CONAGUA.')
  if (input.modules.some(m => m.returnCoeff !== 75)) warnings.push('La aportación difiere de 75 %; justificar el balance consumo–descarga por uso.')
  if (input.modules.some(m => m.typeId.startsWith('hotel') && m.occupancy < 50)) warnings.push('Ocupación hotelera baja: verificar también el escenario de máxima ocupación para dimensionar puntas.')

  return {
    modules, potableAverage, wastewaterAverage, wastewaterDay,
    annualVolume: wastewaterAverage*365/1000,
    qmedSanitary, qmed, qmin, qmaxDaily, qmax, qextra, peakFactor, harmon, equivalentPopulation,
    profile: factors.map((factor,hour) => ({ hour, factor, flow:qmedSanitary*factor+additional })),
    low: qmedSanitary*(1-uncertainty)+additional,
    high: qmedSanitary*(1+uncertainty)+additional,
    warnings,
  }
}

export const defaultInput = (): CalculationInput => ({
  name: 'Desarrollo habitacional norte',
  stateId: 'nl',
  municipality: '',
  climate: 'semicalido',
  level: 'medio',
  method: 'harmon',
  cvd: 1.3,
  cvh: 1.55,
  safety: 1.5,
  minFactor: 0.5,
  additionalFlow: 0,
  uncertainty: 15,
  notes: '',
  modules: [{ id:crypto.randomUUID(), typeId:'vivienda', quantity:450, occupancy:100, daysPerWeek:7, returnCoeff:75, saving:0 }],
})
