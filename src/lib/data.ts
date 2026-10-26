export type Climate = 'calido' | 'semicalido' | 'templado' | 'semifrio'
export type Level = 'alto' | 'medio' | 'popular'
export type Method = 'harmon' | 'demanda' | 'perfil'

export type ProjectType = {
  id: string
  name: string
  short: string
  unit: string
  quantityLabel: string
  rate: number | null
  rateLabel: string
  source: string
  sourceDetail: string
  days: number
  occupancy: number
  residential?: boolean
  profile: 'residential' | 'office' | 'continuous' | 'hotel' | 'school' | 'commerce'
}

export const CNA_2007 = 'CONAGUA, MAPAS, Datos básicos (2007)'
export const CNA_2015 = 'CONAGUA, MAPAS, Datos básicos para proyectos (2015)'
export const CNA_SEWER = 'CONAGUA, MAPAS, Alcantarillado sanitario (2015)'

export const residentialRates: Record<Climate, Record<Level, number>> = {
  calido: { alto: 400, medio: 230, popular: 185 },
  semicalido: { alto: 300, medio: 205, popular: 130 },
  templado: { alto: 250, medio: 195, popular: 100 },
  semifrio: { alto: 250, medio: 195, popular: 100 },
}

export const climateLabels: Record<Climate, string> = {
  calido: 'Cálido · > 22 °C',
  semicalido: 'Semicálido · 18–22 °C',
  templado: 'Templado · 12–17.9 °C',
  semifrio: 'Semifrío · 5–11.9 °C',
}

export const projectTypes: ProjectType[] = [
  { id: 'vivienda', name: 'Vivienda / desarrollo habitacional', short: 'Vivienda', unit: 'hab', quantityLabel: 'Habitantes de proyecto', rate: null, rateLabel: 'Según clima y nivel socioeconómico', source: `${CNA_2007} · tablas 5.3 y 5.4`, sourceDetail: 'Valores per cápita domésticos. En semifrío se adopta el valor de templado, como indica la nota de la tabla 5.3.', days: 7, occupancy: 100, residential: true, profile: 'residential' },
  { id: 'hotel13', name: 'Hotel de 1 a 3 estrellas', short: 'Hotel 1–3★', unit: 'cuarto', quantityLabel: 'Cuartos', rate: 1000, rateLabel: 'L/cuarto/día · rango tabulado 400–1000', source: `${CNA_2007} · tabla 5.6`, sourceDetail: 'Se precarga el valor superior del rango. Ajustar por categoría, servicios, lavandería, alberca y ocupación medida.', days: 7, occupancy: 70, profile: 'hotel' },
  { id: 'hotel45', name: 'Hotel de 4 a 5 estrellas', short: 'Hotel 4–5★', unit: 'cuarto', quantityLabel: 'Cuartos', rate: 1500, rateLabel: 'L/cuarto/día · rango tabulado 750–1500', source: `${CNA_2007} · tabla 5.6`, sourceDetail: 'Se precarga el valor superior del rango. No incluye automáticamente usos extraordinarios o fuentes alternas.', days: 7, occupancy: 70, profile: 'hotel' },
  { id: 'oficinas', name: 'Edificio de oficinas', short: 'Oficinas', unit: 'm²', quantityLabel: 'Área de oficinas', rate: 20, rateLabel: 'L/m²/día', source: `${CNA_2007} · tabla 5.5`, sourceDetail: 'Consumo mínimo en comercios. Confirmar si el área es rentable, total o efectivamente ocupada.', days: 5, occupancy: 90, profile: 'office' },
  { id: 'comercio', name: 'Locales comerciales', short: 'Comercio', unit: 'm²', quantityLabel: 'Área comercial', rate: 6, rateLabel: 'L/m²/día', source: `${CNA_2007} · tabla 5.5`, sourceDetail: 'Consumo mínimo en comercios; giros intensivos requieren una partida independiente.', days: 6, occupancy: 100, profile: 'commerce' },
  { id: 'mercado', name: 'Mercado', short: 'Mercado', unit: 'local', quantityLabel: 'Locales', rate: 100, rateLabel: 'L/local/día', source: `${CNA_2007} · tabla 5.5`, sourceDetail: 'Consumo mínimo. Separar restaurantes, lavado de pisos y procesos con mayor demanda.', days: 6, occupancy: 100, profile: 'commerce' },
  { id: 'restaurante', name: 'Restaurante / alimentos y bebidas', short: 'Restaurante', unit: 'comida', quantityLabel: 'Comidas servidas por día', rate: 12, rateLabel: 'L/comida', source: `${CNA_2007} · tabla 5.8`, sourceDetail: 'Dato de alimentos y bebidas. Capturar comidas, no sólo comensales, cuando hay más de un servicio.', days: 6, occupancy: 100, profile: 'commerce' },
  { id: 'escuela', name: 'Escuela / educación', short: 'Escuela', unit: 'alumno·turno', quantityLabel: 'Alumnos por turno', rate: 20, rateLabel: 'L/alumno/turno', source: `${CNA_2007} · tabla 5.8`, sourceDetail: 'Aplica a educación elemental, media y superior en la referencia. Sumar turnos como partidas independientes.', days: 5, occupancy: 95, profile: 'school' },
  { id: 'hospital', name: 'Hospital / clínica', short: 'Salud', unit: 'cama', quantityLabel: 'Camas', rate: 800, rateLabel: 'L/cama/día', source: `${CNA_2007} · tabla 5.8`, sourceDetail: 'No sustituye el balance de procesos, lavandería, cocina, consulta externa o fuentes propias.', days: 7, occupancy: 85, profile: 'continuous' },
  { id: 'deportivo', name: 'Club deportivo privado', short: 'Deportivo', unit: 'asistente', quantityLabel: 'Asistentes por día', rate: 150, rateLabel: 'L/asistente/día', source: `${CNA_2007} · tabla 5.5`, sourceDetail: 'Clubes deportivos y servicios privados. Albercas requieren balance independiente de reposición.', days: 6, occupancy: 100, profile: 'commerce' },
  { id: 'cine', name: 'Cine / teatro', short: 'Cine / teatro', unit: 'asistente', quantityLabel: 'Asistentes por día', rate: 6, rateLabel: 'L/asistente/día', source: `${CNA_2007} · tabla 5.5`, sourceDetail: 'Para cines y teatros; considerar funciones y ocupación real.', days: 6, occupancy: 80, profile: 'commerce' },
  { id: 'lavanderia', name: 'Lavandería de autoservicio', short: 'Lavandería', unit: 'kg ropa', quantityLabel: 'Kilogramos de ropa seca por día', rate: 40, rateLabel: 'L/kg de ropa seca', source: `${CNA_2007} · tabla 5.5`, sourceDetail: 'Verificar eficiencia de equipos y eventual recirculación; el proceso puede cambiar la aportación.', days: 6, occupancy: 100, profile: 'commerce' },
  { id: 'industria', name: 'Industria · servicio al personal', short: 'Industria', unit: 'trabajador·jornada', quantityLabel: 'Trabajadores por jornada', rate: 30, rateLabel: 'L/trabajador/jornada', source: `${CNA_2007} · tabla 5.7`, sourceDetail: 'Sólo “otras industrias”. Para desaseo manifiesto usar 100; agregar proceso industrial por separado.', days: 5, occupancy: 100, profile: 'office' },
  { id: 'transporte', name: 'Estación de transporte', short: 'Transporte', unit: 'pasajero', quantityLabel: 'Pasajeros por día', rate: 10, rateLabel: 'L/pasajero/día', source: `${CNA_2007} · tabla 5.8`, sourceDetail: 'Consumo de la instalación por pasajero. Revisar andenes, lavado y comercios por separado.', days: 7, occupancy: 100, profile: 'continuous' },
  { id: 'personalizado', name: 'Otro uso / dato medido', short: 'Personalizado', unit: 'unidad', quantityLabel: 'Unidades de consumo', rate: 100, rateLabel: 'L/unidad/día · editable', source: 'Dato del proyecto · captura del responsable', sourceDetail: 'Usar únicamente con memoria, reglamento local, aforo o balance hídrico identificable.', days: 7, occupancy: 100, profile: 'continuous' },
]

export type StateInfo = { id: string; name: string; climate: Climate; suggestions: string[] }
export const states: StateInfo[] = [
  { id:'ags', name:'Aguascalientes', climate:'semicalido', suggestions:['vivienda','industria','comercio'] },
  { id:'bc', name:'Baja California', climate:'semicalido', suggestions:['vivienda','industria','hotel13'] },
  { id:'bcs', name:'Baja California Sur', climate:'calido', suggestions:['hotel45','vivienda','comercio'] },
  { id:'cam', name:'Campeche', climate:'calido', suggestions:['vivienda','hotel13','comercio'] },
  { id:'chis', name:'Chiapas', climate:'calido', suggestions:['vivienda','comercio','hotel13'] },
  { id:'chih', name:'Chihuahua', climate:'semicalido', suggestions:['industria','vivienda','comercio'] },
  { id:'cdmx', name:'Ciudad de México', climate:'templado', suggestions:['vivienda','oficinas','comercio'] },
  { id:'coah', name:'Coahuila', climate:'semicalido', suggestions:['industria','vivienda','comercio'] },
  { id:'col', name:'Colima', climate:'calido', suggestions:['vivienda','hotel13','comercio'] },
  { id:'dur', name:'Durango', climate:'semicalido', suggestions:['vivienda','industria','comercio'] },
  { id:'gto', name:'Guanajuato', climate:'semicalido', suggestions:['industria','vivienda','hotel13'] },
  { id:'gro', name:'Guerrero', climate:'calido', suggestions:['vivienda','hotel45','comercio'] },
  { id:'hgo', name:'Hidalgo', climate:'templado', suggestions:['vivienda','comercio','industria'] },
  { id:'jal', name:'Jalisco', climate:'semicalido', suggestions:['vivienda','industria','hotel45'] },
  { id:'mex', name:'Estado de México', climate:'templado', suggestions:['vivienda','industria','comercio'] },
  { id:'mich', name:'Michoacán', climate:'semicalido', suggestions:['vivienda','comercio','industria'] },
  { id:'mor', name:'Morelos', climate:'semicalido', suggestions:['vivienda','hotel13','comercio'] },
  { id:'nay', name:'Nayarit', climate:'calido', suggestions:['hotel45','vivienda','comercio'] },
  { id:'nl', name:'Nuevo León', climate:'semicalido', suggestions:['industria','vivienda','oficinas'] },
  { id:'oax', name:'Oaxaca', climate:'semicalido', suggestions:['vivienda','hotel13','comercio'] },
  { id:'pue', name:'Puebla', climate:'templado', suggestions:['vivienda','industria','hotel13'] },
  { id:'qro', name:'Querétaro', climate:'semicalido', suggestions:['industria','vivienda','oficinas'] },
  { id:'qroo', name:'Quintana Roo', climate:'calido', suggestions:['hotel45','vivienda','comercio'] },
  { id:'slp', name:'San Luis Potosí', climate:'semicalido', suggestions:['industria','vivienda','comercio'] },
  { id:'sin', name:'Sinaloa', climate:'calido', suggestions:['vivienda','hotel45','comercio'] },
  { id:'son', name:'Sonora', climate:'calido', suggestions:['industria','vivienda','comercio'] },
  { id:'tab', name:'Tabasco', climate:'calido', suggestions:['vivienda','industria','comercio'] },
  { id:'tamps', name:'Tamaulipas', climate:'calido', suggestions:['industria','vivienda','comercio'] },
  { id:'tlax', name:'Tlaxcala', climate:'templado', suggestions:['vivienda','industria','comercio'] },
  { id:'ver', name:'Veracruz', climate:'calido', suggestions:['vivienda','industria','hotel13'] },
  { id:'yuc', name:'Yucatán', climate:'calido', suggestions:['vivienda','hotel45','comercio'] },
  { id:'zac', name:'Zacatecas', climate:'semicalido', suggestions:['vivienda','comercio','hotel13'] },
]

export const sources = [
  { id:'S1', title:'MAPAS · Datos básicos para proyectos de agua potable y alcantarillado', org:'Comisión Nacional del Agua · 2015 · ISBN 978-607-626-036-4', use:'Consumo por clima y nivel socioeconómico, necesidad de medición, CVd = 1.20–1.40 y CVh = 1.55.', url:'https://files.conagua.gob.mx/conagua/mapas/SGAPDS-1-15-Libro4.pdf' },
  { id:'S2', title:'MAPAS · Alcantarillado sanitario', org:'Comisión Nacional del Agua · 2015 · ISBN 978-607-626-009-8', use:'Aportación, gasto medio y mínimo, coeficiente de Harmon y gasto extraordinario.', url:'https://files.conagua.gob.mx/conagua/mapas/SGAPDS-1-15-Libro20.pdf' },
  { id:'S3', title:'MAPAS · Datos básicos', org:'Comisión Nacional del Agua · edición 2007', use:'Tablas 5.3–5.8: consumos domésticos, comercios, hoteles, industria de servicio y usos públicos.', url:'https://www.conagua.gob.mx/conagua07/publicaciones/publicaciones/libros/05datosbasicos.pdf' },
  { id:'S4', title:'Normas y lineamientos técnicos de Los Cabos', org:'OOMSAPAS Los Cabos · criterio local de contraste', use:'Contraste de Qmín = 0.5 Qmed, aportación y gastos de diseño. No se aplica fuera de su jurisdicción sin revisar la norma local.', url:'https://aguapotabledeloscabos.gob.mx/archivos/leyes/Normas-y-Lineamientos-Tecnicos.pdf' },
]
