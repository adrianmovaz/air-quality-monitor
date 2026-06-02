#ifndef CONFIG_H
#define CONFIG_H

static const char *WIFI_SSID = "Wifi_Isla";
static const char *WIFI_PASSWORD = "fQfK65uH2#%";
static const char *DEVICE_HOSTNAME = "esp32-airquality";

static const char *NTP_SERVER = "pool.ntp.org";
static const char *TIMEZONE = "CST6";
static const long NTP_SYNC_INTERVAL_MS = 3600000;

static const int HTTP_SERVER_PORT = 80;

static const int SENSOR_ONE_ANALOG_PIN = 34;
static const int SENSOR_ONE_LED_PIN = 25;

static const float ADC_REFERENCE_VOLTAGE = 3.3f;
static const float ADC_MAX_VALUE = 4095.0f;

static const float DIVIDER_RATIO = 0.66f;

static const float SENSOR_SUPPLY_VOLTAGE = 5.0f;
static const float LOAD_RESISTANCE_KOHM = 5.0f;
static const float CLEAN_AIR_RATIO = 9.83f;

static const float PPM_CURVE_A = 574.25f;
static const float PPM_CURVE_B = -2.222f;

static const float PPM_ALERT_THRESHOLD = 300.0f;

static const int SAMPLES_PER_READING = 16;
static const int CALIBRATION_SAMPLES = 64;
static const unsigned long WARMUP_DELAY_MS = 20000;
static const unsigned long READING_INTERVAL_MS = 2000;

#endif
