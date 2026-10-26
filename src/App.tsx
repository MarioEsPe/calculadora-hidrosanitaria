import { useEffect, useMemo, useRef, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownToLine, BookOpen, Check, ChevronDown, CircleHelp, Database, FlaskConical, FolderOpen, HardDrive, Info, Plus, Printer, RotateCcw, Save, ShieldCheck, Trash2, Waves, WifiOff, X } from 'lucide-react'
import { calculate, defaultInput, getModuleType, type CalculationInput, type ModuleInput } from './lib/engine'
import { climateLabels, CNA_2007, CNA_2015, CNA_SEWER, projectTypes, residentialRates, sources, states, type Climate, type Level, type Method } from './lib/data'
import './App.css'

type Tab = 'calculator' | 'scenarios' | 'library'
type SavedScenario = { id: string; savedAt: string; input: CalculationInput }

const STORAGE = 'cauce-mx-proyecto-v1'
const SCENARIOS = 'cauce-mx-escenarios-v1'
const nf = (value: number, digits = 2) => new Intl.NumberFormat('es-MX', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0)

function readLocal<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback }
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>
}

function NumberField({ label, value, onChange, unit, hint, min = 0, max, step = 1 }: { label: string; value: number; onChange: (v: number) => void; unit?: string; hint?: string; min?: number; max?: number; step?: number }) {
  return <Field label={label} hint={hint}><span className="number-wrap"><input type="number" inputMode="decimal" value={Number.isFinite(value) ? value : 0} min={min} max={max} step={step} onChange={e => onChange(Number.isFinite(e.target.valueAsNumber) ? e.target.valueAsNumber : 0)} /><span>{unit}</span></span></Field>
}

function SelectField({ label, value, onChange, children, hint }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode; hint?: string }) {
  return <Field label={label} hint={hint}><span className="select-wrap"><select value={value} onChange={e => onChange(e.target.value)}>{children}</select><ChevronDown size={16} aria-hidden="true" /></span></Field>
}

function App() {
  const [tab, setTab] = useState<Tab>('calculator')
  const [input, setInput] = useState<CalculationInput>(() => readLocal(STORAGE, defaultInput()))
  const [scenarios, setScenarios] = useState<SavedScenario[]>(() => readLocal(SCENARIOS, []))
  const [toast, setToast] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const deferredPrompt = useRef<any>(null)
  const result = useMemo(() => calculate(input), [input])
  const currentState = states.find(s => s.id === input.stateId) ?? states[0]

  useEffect(() => { localStorage.setItem(STORAGE, JSON.stringify(input)) }, [input])
  useEffect(() => { localStorage.setItem(SCENARIOS, JSON.stringify(scenarios)) }, [scenarios])
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    const prompt = (e: Event) => { e.preventDefault(); deferredPrompt.current = e }
    window.addEventListener('online', on); window.addEventListener('offline', off); window.addEventListener('beforeinstallprompt', prompt)
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => undefined)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); window.removeEventListener('beforeinstallprompt', prompt) }
  }, [])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3200); return () => clearTimeout(t) }, [toast])
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowHelp(false) }
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key)
  }, [])

  const patch = <K extends keyof CalculationInput>(key: K, value: CalculationInput[K]) => setInput(prev => ({ ...prev, [key]: value }))
  const patchModule = (id: string, changes: Partial<ModuleInput>) => setInput(prev => ({ ...prev, modules: prev.modules.map(m => m.id === id ? { ...m, ...changes } : m) }))
  const changeType = (id: string, typeId: string) => {
    const type = getModuleType(typeId)
    patchModule(id, { typeId, occupancy:type.occupancy, daysPerWeek:type.days, customRate:undefined })
  }
  const addModule = () => {
    const type = projectTypes[3]
    patch('modules', [...input.modules, { id:crypto.randomUUID(), typeId:type.id, quantity:1000, occupancy:type.occupancy, daysPerWeek:type.days, returnCoeff:75, saving:0 }])
  }
  const removeModule = (id: string) => { if (input.modules.length > 1) patch('modules', input.modules.filter(m => m.id !== id)); else setToast('El proyecto necesita al menos una partida.') }
  const changeState = (id: string) => {
    const state = states.find(s => s.id === id)!
    setInput(prev => ({ ...prev, stateId:id, climate:state.climate }))
  }
  const reset = () => { if (window.confirm('¿Restablecer los datos del cálculo actual? Los escenarios guardados no se eliminarán.')) { setInput(defaultInput()); setToast('Cálculo restablecido.') } }
  const saveScenario = () => {
    const scenario = { id:crypto.randomUUID(), savedAt:new Date().toISOString(), input:JSON.parse(JSON.stringify(input)) }
    setScenarios(prev => [scenario, ...prev]); setToast('Escenario guardado en este dispositivo.')
  }

  const exportCSV = () => {
    const rows: (string|number)[][] = [
      ['CAUCE MX — Memoria de cálculo'], ['Proyecto', input.name], ['Entidad', currentState.name], ['Municipio / localidad', input.municipality], ['Fecha de exportación', new Date().toLocaleString('es-MX')], [],
      ['Parámetro','Valor','Unidad / criterio'], ['Clima', climateLabels[input.climate]], ['Nivel socioeconómico', input.level], ['Método de punta', input.method], ['CVd',input.cvd], ['CVh',input.cvh], ['Coeficiente extraordinario',input.safety], ['Caudal adicional',input.additionalFlow,'L/s'], [],
      ['Partida','Cantidad','Unidad','Consumo unitario L/unidad/día','Ocupación %','Días/semana','Aportación %','Ahorro %','Agua potable media L/día','Agua residual media L/día','Fuente'],
      ...result.modules.map(m => { const raw = input.modules.find(x => x.id === m.id)!; return [m.type.name,raw.quantity,m.type.unit,m.rate,raw.occupancy,raw.daysPerWeek,raw.returnCoeff,raw.saving,m.potableAverage.toFixed(2),m.wastewaterAverage.toFixed(2),m.type.source] }), [],
      ['Resultado','Valor','Unidad'], ['Población equivalente',result.equivalentPopulation.toFixed(1),'hab'], ['Coeficiente de Harmon',result.harmon.toFixed(3)], ['Agua residual media',result.wastewaterAverage.toFixed(2),'L/día'], ['Volumen anual',result.annualVolume.toFixed(2),'m³/año'], ['Q mínimo',result.qmin.toFixed(4),'L/s'], ['Q medio',result.qmed.toFixed(4),'L/s'], ['Q máximo diario',result.qmaxDaily.toFixed(4),'L/s'], ['Q máximo instantáneo',result.qmax.toFixed(4),'L/s'], ['Q máximo extraordinario',result.qextra.toFixed(4),'L/s'], ['Sensibilidad inferior',result.low.toFixed(4),'L/s'], ['Sensibilidad superior',result.high.toFixed(4),'L/s'], [],
      ['Notas',input.notes], ['Alcance','Estimación de anteproyecto. Validar contra norma local, organismo operador y mediciones.']
    ]
    const csv = '\uFEFF' + rows.map(row => row.map(cell => `"${String(cell ?? '').replaceAll('"','""')}"`).join(',')).join('\n')
    download(csv, `${safeName(input.name)}-memoria.csv`, 'text/csv;charset=utf-8')
  }
  const exportJSON = () => download(JSON.stringify(input,null,2), `${safeName(input.name)}.cauce.json`, 'application/json')
  const importJSON = (file?: File) => {
    if (!file) return
    file.text().then(text => { const parsed = JSON.parse(text); if (!parsed.modules || !parsed.stateId) throw new Error(); setInput(parsed); setTab('calculator'); setToast('Proyecto importado correctamente.') }).catch(() => setToast('El archivo no contiene un proyecto CAUCE válido.'))
  }
  const install = async () => {
    if (deferredPrompt.current) { await deferredPrompt.current.prompt(); deferredPrompt.current = null }
    else setToast('En el menú del navegador elige “Instalar aplicación” o “Añadir a inicio”. Abre una vez antes de desconectarte.')
  }

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setTab('calculator')} aria-label="CAUCE MX, ir a calculadora"><span className="brand-mark"><Waves size={21}/></span><span>CAUCE <b>MX</b></span></button>
      <nav className="main-nav" aria-label="Secciones">
        <button className={tab === 'calculator' ? 'active' : ''} onClick={() => setTab('calculator')}><FlaskConical size={16}/>Calculadora</button>
        <button className={tab === 'scenarios' ? 'active' : ''} onClick={() => setTab('scenarios')}><FolderOpen size={16}/>Escenarios <span>{scenarios.length}</span></button>
        <button className={tab === 'library' ? 'active' : ''} onClick={() => setTab('library')}><BookOpen size={16}/>Base técnica</button>
      </nav>
      <div className="header-actions"><span className="local-badge"><span className={online ? 'status-dot' : 'status-dot offline'}/>{online ? 'Datos locales' : 'Modo sin conexión'}</span><button className="icon-button" onClick={() => setShowHelp(true)} aria-label="Ayuda y alcance"><CircleHelp size={20}/></button></div>
    </header>

    {tab === 'calculator' && <main className="workspace">
      <section className="editor" aria-label="Datos del proyecto">
        <div className="editor-heading"><div><p className="mono-kicker">MEMORIA DE CÁLCULO · MÉXICO</p><h1>Descarga de aguas residuales</h1><p>Estima volúmenes y gastos de diseño con supuestos visibles, editables y trazables.</p></div><button className="text-button" onClick={reset}><RotateCcw size={16}/>Restablecer</button></div>

        <section className="form-section">
          <div className="section-title"><span>01</span><h2>Contexto del proyecto</h2></div>
          <div className="form-grid two">
            <Field label="Nombre del proyecto"><input value={input.name} onChange={e => patch('name',e.target.value)} maxLength={90}/></Field>
            <SelectField label="Entidad federativa" value={input.stateId} onChange={changeState}>{states.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</SelectField>
            <Field label="Municipio o localidad" hint="El preajuste estatal no sustituye el clima municipal."><input value={input.municipality} placeholder="Ej. Monterrey" onChange={e => patch('municipality',e.target.value)}/></Field>
            <SelectField label="Clima · temperatura media anual" value={input.climate} onChange={v => patch('climate',v as Climate)}>{Object.entries(climateLabels).map(([k,v]) => <option value={k} key={k}>{v}</option>)}</SelectField>
          </div>
          <div className="state-note"><Info size={17}/><div><strong>Orientación para {currentState.name}</strong><p>Tipologías frecuentes sugeridas: {currentState.suggestions.map(id => getModuleType(id).short).join(' · ')}. Es una guía de captura, no una estadística de construcción ni un factor normativo.</p></div></div>
        </section>

        <section className="form-section">
          <div className="section-title action-title"><div><span>02</span><h2>Usos y consumos</h2></div><button className="secondary-button" onClick={addModule}><Plus size={17}/>Añadir uso</button></div>
          <p className="section-intro">Combina partidas para un desarrollo de uso mixto. La ocupación y el calendario convierten el día de operación en promedio anual.</p>
          <div className="module-list">{input.modules.map((module,index) => {
            const type = getModuleType(module.typeId)
            const moduleResult = result.modules.find(m => m.id === module.id)!
            return <article className="module" key={module.id}>
              <div className="module-head"><span className="module-index">U{String(index+1).padStart(2,'0')}</span><div className="module-select"><select aria-label={`Tipo de uso ${index+1}`} value={module.typeId} onChange={e => changeType(module.id,e.target.value)}>{projectTypes.map(t => <option value={t.id} key={t.id}>{t.name}</option>)}</select><ChevronDown size={16}/></div><button className="icon-button danger" onClick={() => removeModule(module.id)} aria-label={`Eliminar uso ${index+1}`}><Trash2 size={17}/></button></div>
              <div className="form-grid three">
                <NumberField label={type.quantityLabel} unit={type.unit} value={module.quantity} min={0} step={type.unit === 'm²' ? 10 : 1} onChange={v => patchModule(module.id,{quantity:v})}/>
                <NumberField label="Consumo unitario" unit={`L/${type.unit}/d`} value={module.customRate ?? moduleResult.rate} min={0} step={1} hint={type.residential ? `${residentialRates[input.climate][input.level]} según tabla; editable` : type.rateLabel} onChange={v => patchModule(module.id,{customRate:v})}/>
                <NumberField label="Aportación al drenaje" unit="%" value={module.returnCoeff} min={0} max={120} step={1} hint="Referencia general: 75 %" onChange={v => patchModule(module.id,{returnCoeff:v})}/>
                <NumberField label="Ocupación / utilización" unit="%" value={module.occupancy} min={0} max={100} step={1} onChange={v => patchModule(module.id,{occupancy:v})}/>
                <NumberField label="Operación semanal" unit="días" value={module.daysPerWeek} min={0} max={7} step={0.5} onChange={v => patchModule(module.id,{daysPerWeek:v})}/>
                <NumberField label="Ahorro por muebles eficientes" unit="%" value={module.saving} min={0} max={95} step={1} hint="Sólo si está justificado" onChange={v => patchModule(module.id,{saving:v})}/>
              </div>
              <div className="module-foot"><span>{type.source}</span><strong>{nf(moduleResult.wastewaterAverage/1000)} m³/d <small>promedio</small></strong></div>
            </article>
          })}</div>
          {input.modules.some(m => getModuleType(m.typeId).residential) && <div className="level-control"><span>Nivel socioeconómico para vivienda</span><div className="segmented">{(['popular','medio','alto'] as Level[]).map(level => <button key={level} className={input.level === level ? 'selected' : ''} onClick={() => patch('level',level)}>{level === 'popular' ? 'Bajo / popular' : level === 'medio' ? 'Medio' : 'Alto / residencial'}</button>)}</div><p>Afecta el consumo base de vivienda y la población equivalente. No se vuelve a multiplicar por un “factor de ingreso”.</p></div>}
        </section>

        <section className="form-section">
          <div className="section-title"><span>03</span><h2>Variación y condiciones de descarga</h2></div>
          <div className="method-options">{([{id:'harmon',name:'Harmon',desc:'Población equivalente; redes sanitarias.'},{id:'demanda',name:'CVd × CVh',desc:'Variación diaria y horaria de demanda.'},{id:'perfil',name:'Perfil horario',desc:'Hipótesis según uso y costumbre.'}] as {id:Method;name:string;desc:string}[]).map(m => <button key={m.id} className={input.method === m.id ? 'method selected' : 'method'} onClick={() => patch('method',m.id)}><span className="radio-dot"/><strong>{m.name}</strong><small>{m.desc}</small></button>)}</div>
          <div className="form-grid three coefficients">
            <NumberField label="Coef. variación diaria" value={input.cvd} min={1} max={3} step={0.05} hint="CONAGUA: 1.20–1.40" onChange={v => patch('cvd',v)}/>
            <NumberField label="Coef. variación horaria" value={input.cvh} min={1} max={4} step={0.05} hint="Referencia media: 1.55" onChange={v => patch('cvh',v)}/>
            <NumberField label="Coef. gasto extraordinario" value={input.safety} min={1} max={3} step={0.1} hint="1.5 si existe aportación pluvial" onChange={v => patch('safety',v)}/>
            <NumberField label="Factor de gasto mínimo" value={input.minFactor} min={0} max={1} step={0.05} hint="Qmin = factor × Qmed" onChange={v => patch('minFactor',v)}/>
            <NumberField label="Infiltración / aporte adicional" unit="L/s" value={input.additionalFlow} min={0} step={0.05} hint="Caudal continuo, no porcentaje" onChange={v => patch('additionalFlow',v)}/>
            <NumberField label="Sensibilidad de consumo" unit="± %" value={input.uncertainty} min={0} max={50} step={5} hint="Intervalo determinista" onChange={v => patch('uncertainty',v)}/>
          </div>
          <Field label="Notas y evidencia del proyecto"><textarea rows={3} value={input.notes} onChange={e => patch('notes',e.target.value)} placeholder="Aforos, recibos, norma local, criterio del organismo operador…"/></Field>
        </section>
      </section>

      <aside className="results-panel" aria-label="Resultados del cálculo">
        <div className="results-top"><div><p className="mono-kicker">RESULTADO · ACTUALIZACIÓN LOCAL</p><h2>{input.name || 'Proyecto sin nombre'}</h2><p>{currentState.name}{input.municipality ? ` · ${input.municipality}` : ''} · {input.modules.length} {input.modules.length === 1 ? 'partida' : 'partidas'}</p></div><span className="verified"><ShieldCheck size={17}/>Motor verificado</span></div>
        <div className="hero-result"><span>Gasto máximo instantáneo</span><div><strong>{nf(result.qmax,3)}</strong><b>L/s</b></div><p>{input.method === 'harmon' ? `Harmon M = ${nf(result.harmon,3)} · P equivalente = ${nf(result.equivalentPopulation,0)} hab` : input.method === 'demanda' ? `CVd × CVh = ${nf(result.peakFactor,3)}` : `Pico del perfil = ${nf(result.peakFactor,3)} × Q medio`}</p></div>
        <div className="metric-grid">
          <div><span>Gasto medio</span><strong>{nf(result.qmed,3)} <small>L/s</small></strong><p>{nf(result.wastewaterAverage/1000)} m³/d</p></div>
          <div><span>Gasto mínimo</span><strong>{nf(result.qmin,3)} <small>L/s</small></strong><p>{nf(input.minFactor,2)} × Q medio</p></div>
          <div><span>Máximo diario</span><strong>{nf(result.qmaxDaily,3)} <small>L/s</small></strong><p>CVd = {nf(input.cvd,2)}</p></div>
          <div><span>Máx. extraordinario</span><strong>{nf(result.qextra,3)} <small>L/s</small></strong><p>Seguridad = {nf(input.safety,2)}</p></div>
        </div>
        <div className="sensitivity"><div><span>Sensibilidad del gasto medio</span><strong>{nf(result.low,3)} — {nf(result.high,3)} L/s</strong></div><p>Variación de ±{input.uncertainty} % en consumo y aportación. No es un intervalo probabilístico.</p></div>
        <div className="chart-block"><div className="chart-title"><div><span>Perfil horario relativo</span><strong>Curva de hipótesis · no medición</strong></div><span>L/s</span></div><div className="chart" role="img" aria-label="Perfil horario calculado de descarga en litros por segundo"><ResponsiveContainer width="100%" height="100%"><AreaChart data={result.profile} margin={{top:8,right:4,bottom:0,left:-16}}><defs><linearGradient id="flowFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--cobalt)" stopOpacity={0.26}/><stop offset="100%" stopColor="var(--cobalt)" stopOpacity={0.02}/></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--line)"/><XAxis dataKey="hour" tickFormatter={h => `${h}:00`} ticks={[0,6,12,18,23]} tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false} tickFormatter={v => nf(v,1)}/><Tooltip formatter={(v) => [`${nf(Number(v),3)} L/s`,'Descarga']} labelFormatter={h => `${h}:00 h`} contentStyle={{border:'1px solid var(--line)',borderRadius:4,background:'var(--paper)',color:'var(--ink)'}}/><Area type="monotone" dataKey="flow" stroke="var(--cobalt)" strokeWidth={2} fill="url(#flowFill)" isAnimationActive={false}/></AreaChart></ResponsiveContainer></div></div>
        {result.warnings.length > 0 && <div className="warnings"><strong><Info size={16}/>Revisión de supuestos</strong>{result.warnings.map(w => <p key={w}>{w}</p>)}</div>}
        <details className="calc-detail"><summary>Ver memoria y ecuaciones <ChevronDown size={16}/></summary><div className="formula-list">
          <div><span>Consumo medio</span><code>C = Σ(q × d × ocupación × días/7 × ahorro)</code></div>
          <div><span>Aportación</span><code>AR = C × Ca;  Ca de referencia = 0.75</code></div>
          <div><span>Gasto medio</span><code>Qmed = AR / 86,400 + Qadicional</code></div>
          <div><span>Población equivalente</span><code>Peq = habitantes + C no doméstico / consumo doméstico de referencia</code></div>
          <div><span>Harmon</span><code>M = 1 + 14 / (4 + √(P/1000))</code><small>M = 3.8 si P &lt; 1,000; M = 2.0 si P &gt; 100,000 (MAPAS 2015).</small></div>
          <div><span>Extraordinario</span><code>Qextra = Cs × Qmáx instantáneo + Qadicional</code></div>
          <div><span>Volumen anual</span><strong>{nf(result.annualVolume,1)} m³/año</strong></div>
        </div></details>
        <div className="result-actions"><button className="primary-button" onClick={saveScenario}><Save size={17}/>Guardar escenario</button><button className="secondary-button" onClick={exportCSV}><ArrowDownToLine size={17}/>CSV</button><button className="icon-button bordered" onClick={() => window.print()} aria-label="Imprimir o guardar PDF"><Printer size={18}/></button></div>
        <p className="result-disclaimer">Anteproyecto. Validar con el organismo operador, normativa local y aforos. No sustituye la firma de un responsable técnico.</p>
      </aside>
    </main>}

    {tab === 'scenarios' && <main className="page-container">
      <div className="page-heading"><div><p className="mono-kicker">ARCHIVO LOCAL</p><h1>Escenarios guardados</h1><p>Compara alternativas sin depender de una cuenta o servidor. Los datos permanecen en este navegador.</p></div><div className="heading-actions"><button className="secondary-button" onClick={exportJSON}><ArrowDownToLine size={17}/>Exportar actual</button><label className="primary-button file-button"><FolderOpen size={17}/>Importar proyecto<input type="file" accept=".json" onChange={e => importJSON(e.target.files?.[0])}/></label></div></div>
      <div className="local-notice"><HardDrive size={20}/><div><strong>Persistencia sólo en este dispositivo</strong><p>No se sincroniza entre celular y computadora. Exporta el archivo .cauce.json para respaldar o trasladar un proyecto; borrar los datos del navegador elimina los escenarios.</p></div></div>
      {scenarios.length === 0 ? <div className="empty-state"><Database size={35}/><h2>Aún no hay escenarios</h2><p>Guarda el cálculo actual para crear una alternativa y conservar sus supuestos.</p><button className="primary-button" onClick={() => setTab('calculator')}>Ir a la calculadora</button></div> : <div className="scenario-list">{scenarios.map(s => { const r = calculate(s.input); return <article className="scenario-row" key={s.id}><div className="scenario-date">{new Date(s.savedAt).toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'})}</div><div className="scenario-main"><h2>{s.input.name}</h2><p>{states.find(x => x.id === s.input.stateId)?.name} · {s.input.modules.length} partidas · {s.input.method}</p></div><div className="scenario-value"><strong>{nf(r.qmax,3)} L/s</strong><span>Q máx. instantáneo</span></div><div className="scenario-actions"><button className="secondary-button" onClick={() => { setInput(JSON.parse(JSON.stringify(s.input))); setTab('calculator'); setToast('Escenario cargado.') }}><FolderOpen size={16}/>Abrir</button><button className="icon-button danger" onClick={() => { if(window.confirm('¿Eliminar este escenario guardado?')) setScenarios(prev => prev.filter(x => x.id !== s.id)) }} aria-label={`Eliminar ${s.input.name}`}><Trash2 size={17}/></button></div></article>})}</div>}
    </main>}

    {tab === 'library' && <main className="page-container library">
      <div className="page-heading"><div><p className="mono-kicker">FUENTES · CRITERIOS · LÍMITES</p><h1>Base técnica verificable</h1><p>Los datos están incorporados en la aplicación. Las referencias externas son para consulta documental y no se requieren para calcular.</p></div></div>
      <section className="library-section"><div className="section-title"><span>A</span><h2>Jerarquía de evidencia</h2></div><div className="evidence-grid"><div><b>1</b><h3>Medición local</h3><p>Aforos, macromedición, recibos y registros representativos por temporada y tipo de usuario.</p></div><div><b>2</b><h3>Norma aplicable</h3><p>Reglamento municipal o estatal y criterios del organismo operador con jurisdicción en el predio.</p></div><div><b>3</b><h3>MAPAS / CONAGUA</h3><p>Valores de referencia cuando no existe información local suficiente, declarando edición y tabla.</p></div><div><b>4</b><h3>Hipótesis explícita</h3><p>Perfiles de uso y ocupación no medidos. Se muestran como tales y nunca como valores normativos.</p></div></div></section>
      <section className="library-section"><div className="section-title"><span>B</span><h2>Referencias incorporadas</h2></div><div className="source-list">{sources.map(s => <article key={s.id}><span className="source-id">{s.id}</span><div><h3>{s.title}</h3><p className="source-org">{s.org}</p><p>{s.use}</p><a href={s.url} target="_blank" rel="noreferrer">Consultar documento original <span>↗</span></a></div></article>)}</div></section>
      <section className="library-section"><div className="section-title"><span>C</span><h2>Datos domésticos · L/habitante/día</h2></div><div className="table-scroll"><table><thead><tr><th>Clima</th><th>Alto / residencial</th><th>Medio</th><th>Bajo / popular</th></tr></thead><tbody>{(Object.keys(residentialRates) as Climate[]).map(c => <tr key={c}><td>{climateLabels[c]}</td><td>{residentialRates[c].alto}</td><td>{residentialRates[c].medio}</td><td>{residentialRates[c].popular}</td></tr>)}</tbody></table></div><p className="table-caption">{CNA_2007}, tablas 5.3 y 5.4. La clasificación por temperatura se muestra para evitar elegir clima sólo por percepción.</p></section>
      <section className="library-section"><div className="section-title"><span>D</span><h2>Criterios de cálculo y control de error</h2></div><div className="methodology"><div><h3>Separación de conceptos</h3><p><strong>Consumo</strong> es agua usada; <strong>dotación</strong> incluye demanda y pérdidas del sistema; <strong>aportación</strong> es la fracción que llega al drenaje. La aplicación parte de consumo por unidad de proyecto y no agrega pérdidas de red municipal a la descarga del predio.</p></div><div><h3>Puntas y población equivalente</h3><p>Harmon se calcula con población equivalente del conjunto. MAPAS 2015 limita M a 3.8 para menos de 1,000 habitantes y a 2.0 por encima de 100,000. Ediciones anteriores usan otros límites superiores; por eso se declara la edición.</p></div><div><h3>Usos no domésticos</h3><p>Los índices de {CNA_2007} son valores mínimos o rangos de referencia, no una medición del inmueble. Procesos industriales, riego, albercas, lavanderías y fuentes alternas requieren balances independientes.</p></div><div><h3>Validación aritmética</h3><p>1 m³/d = 0.011574 L/s; Qmin ≤ Qmed ≤ Qmáx diario; el gasto extraordinario no es menor que el instantáneo cuando Cs ≥ 1. El motor conserva precisión completa y redondea sólo al presentar.</p></div></div></section>
      <section className="library-section checklist"><div className="section-title"><span>E</span><h2>Antes de emitir proyecto ejecutivo</h2></div><ul><li><Check size={17}/>Confirmar norma y coeficiente de aportación con el organismo operador.</li><li><Check size={17}/>Estratificar consumos por tipo de usuario, clima, nivel y temporada.</li><li><Check size={17}/>Contrastar el período de diseño y la ocupación futura, no sólo la inicial.</li><li><Check size={17}/>Medir o justificar curvas horarias y descargas concentradas.</li><li><Check size={17}/>Revisar infiltración, conexiones pluviales y hermeticidad sin duplicar cargas.</li><li><Check size={17}/>Documentar fuentes propias, reuso y procesos que no tributan al sanitario.</li></ul><p>{CNA_2015} recomienda registros y estudios de demanda; {CNA_SEWER} sustenta los gastos de alcantarillado. La recomendación socrática es conservar una respuesta para: ¿qué dato sé, de dónde proviene, qué supuse y qué medición podría refutarlo?</p></section>
    </main>}

    <footer className="app-footer"><span>CAUCE MX · Cálculo hidrosanitario local</span><button onClick={install}><ArrowDownToLine size={15}/>Instalar para uso sin conexión</button><span>v1.0 · Sin nube</span></footer>
    {toast && <div className="toast" role="status"><Check size={17}/>{toast}<button onClick={() => setToast('')} aria-label="Cerrar aviso"><X size={15}/></button></div>}
    {showHelp && <div className="modal-backdrop" onMouseDown={e => { if(e.target === e.currentTarget) setShowHelp(false) }}><section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title"><button className="icon-button modal-close" autoFocus onClick={() => setShowHelp(false)} aria-label="Cerrar ayuda"><X size={19}/></button><WifiOff size={28}/><p className="mono-kicker">USO LOCAL Y ALCANCE</p><h2 id="help-title">Trabaja sin conexión, con supuestos a la vista</h2><p>Tras abrir la aplicación una vez e instalarla, el motor, las tablas y los escenarios funcionan sin internet. La primera apertura o instalación sí requiere disponer de los archivos de la aplicación.</p><h3>Qué calcula</h3><p>Consumo medio, aportación residual, gastos mínimo, medio, máximo diario, máximo instantáneo y extraordinario; además de una sensibilidad determinista.</p><h3>Qué no calcula</h3><p>No dimensiona tuberías, plantas de tratamiento ni calidad del efluente; no sustituye NOM de descarga, estudio de factibilidad, normativa local ni validación profesional.</p><button className="primary-button" onClick={() => { setShowHelp(false); setTab('library') }}><BookOpen size={17}/>Revisar base técnica</button></section></div>}
  </div>
}

function safeName(value: string) { return (value || 'proyecto-cauce').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9-_ ]/g,'').trim().replaceAll(' ','-').toLowerCase() }
function download(content: string, name: string, type: string) { const blob = new Blob([content],{type}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(() => URL.revokeObjectURL(url),500) }

export default App
