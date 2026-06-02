# Air Quality Monitor — ESP32 + MQ-2

Monitor de calidad del aire con un sensor MQ-2 sobre ESP32. El ESP32 lee la
parte analógica, calcula voltaje, resistencia (Rs), razón Rs/Ro y PPM, enciende
un LED cuando detecta gas/humo, y expone los datos por HTTP. Un servidor
Node.js corriendo en tu Mac consulta al ESP32 periódicamente, guarda las
lecturas en SQLite vía Prisma (retención de 14 días por defecto) y sirve un
dashboard de visualización.

```
air-quality-monitor/
├── firmware/air_quality_monitor/   Sketch modular para Arduino IDE
└── server/                          Node.js + Prisma + SQLite + dashboard
```

---

## 1. Hardware y cableado

| Componente            | Pin ESP32            | Nota                                  |
|-----------------------|----------------------|---------------------------------------|
| MQ-2 AO               | GPIO 34 (ADC1, input)| Vía divisor de voltaje                 |
| LED (azul)            | GPIO 25              | En serie con resistencia de 220 Ω      |
| MQ-2 VCC              | 5V (VIN)             | El calentador del MQ-2 requiere ~5V    |
| MQ-2 GND / LED GND    | GND                  | Tierra común                           |

### Divisor de voltaje obligatorio en la línea analógica

El MQ-2 alimentado a 5V entrega en AO un voltaje que puede acercarse a 5V. El
ADC del ESP32 tolera como máximo 3.3V, así que conectar AO directo puede dañar
el pin. Arma este divisor:

```
AO ──[ R1 = 10kΩ ]──┬── a GPIO 34
                    │
                  [ R2 = 20kΩ ]
                    │
                   GND
```

Con 10k/20k la relación es `R2/(R1+R2) = 0.66`, que es justo el valor de
`DIVIDER_RATIO` en `config.h`. Si usas otros resistores, recalcula y actualiza
esa constante. Los resistores de 220 Ω son solo para el LED; para el divisor
necesitas el par 10k/20k.

Alternativa más simple pero menos precisa: alimentar el MQ-2 a 3.3V. Así AO
nunca supera 3.3V y no necesitas divisor, pero el calentador queda subalimentado
y las lecturas pierden exactitud. Si tomas esta ruta, pon `DIVIDER_RATIO = 1.0`
y `SENSOR_SUPPLY_VOLTAGE = 3.3`.

### Notas de calibración (importante)

- Un MQ-2 nuevo necesita burn-in de 24–48 h encendido antes de dar lecturas
  estables. En cada arranque además hay un warm-up corto (configurado en 20 s).
- `Ro` se calcula al arrancar asumiendo aire limpio (`Rs/Ro = 9.83`). Haz la
  primera calibración en un ambiente ventilado y sin gases.
- El PPM absoluto del MQ-2 es una estimación: las constantes `PPM_CURVE_A/B`
  vienen de la curva LPG del datasheet y no equivalen a una calibración contra
  concentraciones conocidas. La **tendencia** de `Rs/Ro` y del PPM relativo es
  mucho más confiable que el número absoluto. El ADC del ESP32 también es no
  lineal, lo que añade error.

---

## 2. Firmware (Arduino IDE)

1. Instala el core de ESP32: Arduino IDE → Preferences → Additional Boards URL:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   y luego Boards Manager → instala "esp32".
2. Abre la carpeta `firmware/air_quality_monitor` (el `.ino` y los `.h/.cpp`
   deben quedar en el mismo folder; el IDE los compila juntos).
3. En `config.h` ajusta `WIFI_SSID`, `WIFI_PASSWORD` y, si hace falta,
   `TIMEZONE` (por defecto `CST6` para Ciudad de México, sin horario de verano).
4. Selecciona tu placa (ej. "ESP32 Dev Module") y el puerto, y sube el sketch.
5. Abre el Monitor Serie a 115200 baud. Verás la IP asignada y la `Ro` calibrada.

Endpoints del ESP32:
- `GET /` → página live mínima con auto-refresh.
- `GET /api/readings` → JSON con epoch, timestamp y el sensor.

Gracias a mDNS, el dispositivo queda accesible como `http://esp32-airquality.local`.

---

## 3. Servidor Node.js en tu Mac

### Verificar / instalar Node.js

```bash
node -v
```

Si no está o es menor a v18:

```bash
brew install node
node -v
```

### SQLite

Prisma trae su propio motor SQLite, así que **no necesitas instalar SQLite para
que el proyecto funcione**. Si quieres el CLI `sqlite3` para inspeccionar la base
a mano, es opcional:

```bash
brew install sqlite
```

### Instalar dependencias y Prisma

```bash
cd server
cp .env.example .env
npm install
```

Edita `.env` y pon la dirección del ESP32 en `ESP32_HOST`
(`http://esp32-airquality.local` o la IP que viste en el Monitor Serie). El
archivo de base de datos se guardará en `server/prisma/data/airquality.db`
(dentro de tu Mac), según `DATABASE_URL`.

Genera el cliente y crea la base con la migración inicial:

```bash
npm run prisma:migrate
npm run prisma:generate
```

### Arrancar

```bash
npm run dev
```

- Dashboard: `http://localhost:4000`
- API: `/api/readings`, `/api/readings/latest`, `/api/readings/stats`, `/api/events`

El servidor consulta al ESP32 cada `POLL_INTERVAL_MS`, guarda cada lectura y
borra automáticamente lo que supere `RETENTION_DAYS` (14 por defecto; ponlo en 7
si quieres el mínimo de una semana).

Inspección opcional de la base:

```bash
npm run prisma:studio
```

---

## 4. Configuración ajustable

| Dónde            | Variable                | Para qué                                |
|------------------|-------------------------|-----------------------------------------|
| `config.h`       | `PPM_ALERT_THRESHOLD`   | PPM a partir del cual enciende el LED    |
| `config.h`       | `DIVIDER_RATIO`         | Relación del divisor de voltaje          |
| `config.h`       | `CLEAN_AIR_RATIO`       | Factor Rs/Ro de aire limpio (MQ-2 ≈ 9.83)|
| `config.h`       | `READING_INTERVAL_MS`   | Frecuencia de muestreo del ESP32         |
| `.env`           | `POLL_INTERVAL_MS`      | Cada cuánto el servidor pide datos       |
| `.env`           | `RETENTION_DAYS`        | Días de historial a conservar            |
