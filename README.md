# CAUCE MX

Aplicación web local para estimar descargas de aguas residuales de proyectos constructivos en México. Calcula consumo medio, aportación, gastos mínimo, medio, máximo diario, máximo instantáneo y extraordinario, con usos mixtos y sensibilidad determinista.

## Uso local

La compilación está en `dist/`. No necesita API, base de datos ni conexión una vez cargados sus archivos.

```bash
python3 -m http.server 8080 --directory dist
```

Abrir `http://localhost:8080`. Para instalarla como PWA en computadora o teléfono, abrirla una vez y elegir **Instalar aplicación** o **Añadir a inicio**. El service worker conserva los recursos para recargas sin conexión. No abrir mediante `file://`, porque los service workers requieren HTTP(S).

Los escenarios se guardan en `localStorage` del navegador: no se sincronizan y se pierden al borrar los datos del sitio. La opción **Exportar actual** genera un archivo `.cauce.json` para respaldo o traslado.

## Desarrollo y validación

```bash
npm install
npm run dev
npx vitest run
npm run build
```

Las pruebas cubren conversiones, límites de Harmon, calendario de operación, usos mixtos, perfiles normalizados, infiltración y un ejemplo numérico CONAGUA de 1,972 habitantes.

## Estructura

- `src/lib/data.ts`: catálogo de entidades, tipologías, índices y referencias.
- `src/lib/engine.ts`: motor de cálculo sin dependencias de interfaz.
- `src/lib/engine.test.ts`: casos de control aritmético.
- `src/App.tsx`: captura, resultados, escenarios y base técnica.
- `public/sw.js`: funcionamiento sin conexión.

## Alcance técnico

Herramienta de anteproyecto. Los índices identifican fuente y edición; los perfiles horarios se declaran como hipótesis, no como mediciones. El resultado debe contrastarse con normativa local, organismo operador, aforos y responsable técnico. No dimensiona tuberías, tratamiento ni calidad de efluente.

Referencias principales: CONAGUA, *Manual de Agua Potable, Alcantarillado y Saneamiento* (MAPAS), Datos básicos (2007 y 2015) y Alcantarillado sanitario (2015). Las tipografías Manrope e IBM Plex Mono se distribuyen con la aplicación mediante sus paquetes `@fontsource`, sin solicitudes a servicios externos.
