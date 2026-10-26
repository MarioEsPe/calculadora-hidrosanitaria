import { describe, expect, it } from 'vitest'
import { calculate, defaultInput, harmonCoefficient, type CalculationInput } from './engine'

const base = (): CalculationInput => ({ ...defaultInput(), modules: [{ id:'1', typeId:'vivienda', quantity:450, occupancy:100, daysPerWeek:7, returnCoeff:75, saving:0 }] })

describe('motor hidrosanitario', () => {
  it('reproduce conversiones y aritmética base', () => {
    const r = calculate(base())
    expect(r.potableAverage).toBeCloseTo(450*205,8)
    expect(r.wastewaterAverage).toBeCloseTo(450*205*.75,8)
    expect(r.qmed).toBeCloseTo(450*205*.75/86400,8)
    expect(r.qmin).toBeCloseTo(r.qmed*.5,8)
    expect(r.qmax).toBeCloseTo(r.qmed*3.8,8)
    expect(r.qextra).toBeCloseTo(r.qmax*1.5,8)
    expect(r.qmin).toBeLessThanOrEqual(r.qmed)
    expect(r.qmed).toBeLessThanOrEqual(r.qmaxDaily)
  })
  it('aplica límites Harmon MAPAS 2015', () => {
    expect(harmonCoefficient(999)).toBe(3.8)
    expect(harmonCoefficient(100001)).toBe(2)
    expect(harmonCoefficient(1972)).toBeCloseTo(3.59054,4)
  })
  it('contrasta con el ejemplo CONAGUA de 1,972 habitantes', () => {
    const i = base(); i.modules = [{ id:'c', typeId:'vivienda', quantity:1972, customRate:100, occupancy:100, daysPerWeek:7, returnCoeff:75, saving:0 }]
    const r = calculate(i)
    expect(r.qmed).toBeCloseTo(1.71,2)
    expect(r.qmin).toBeCloseTo(.86,2)
    expect(r.qmax).toBeCloseTo(6.15,2)
    expect(r.qextra).toBeCloseTo(9.22,2)
  })
  it('convierte día laborable en promedio anual', () => {
    const i = base(); i.modules = [{ id:'o', typeId:'oficinas', quantity:1000, occupancy:100, daysPerWeek:5, returnCoeff:75, saving:0 }]
    const r = calculate(i)
    expect(r.potableAverage).toBeCloseTo(20000*5/7,8)
    expect(r.wastewaterAverage).toBeCloseTo(20000*5/7*.75,8)
  })
  it('suma usos mixtos sin alterar unidades', () => {
    const i = base(); i.modules.push({ id:'r', typeId:'restaurante', quantity:500, occupancy:100, daysPerWeek:6, returnCoeff:75, saving:0 })
    const r = calculate(i)
    expect(r.wastewaterAverage).toBeCloseTo(450*205*.75 + 500*12*6/7*.75,8)
  })
  it('normaliza el perfil horario y agrega infiltración una sola vez', () => {
    const i = base(); i.additionalFlow = .2; i.method = 'perfil'
    const r = calculate(i)
    const mean = r.profile.reduce((s,p) => s+p.flow,0)/24
    expect(mean).toBeCloseTo(r.qmed,8)
    expect(r.qmed).toBeCloseTo(r.qmedSanitary+.2,8)
    expect(r.qextra).toBeCloseTo(r.qmedSanitary*r.peakFactor*1.5+.2,8)
  })
  it('la sensibilidad conserva el caudal adicional', () => {
    const i = base(); i.additionalFlow = .2; i.uncertainty = 15
    const r = calculate(i)
    expect(r.low).toBeCloseTo(r.qmedSanitary*.85+.2,8)
    expect(r.high).toBeCloseTo(r.qmedSanitary*1.15+.2,8)
  })
})
