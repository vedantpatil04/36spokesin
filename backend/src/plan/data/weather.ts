import type { DailyWeather, LatLon, WeatherData } from "../plan.types.js";
import { TtlCache } from "../support/ttl-cache.js";
import { type FetchLike, UpstreamError, fetchJson } from "../support/upstream.js";

/** How far ahead the forecast reaches, counting today as day 0. */
export const FORECAST_DAYS_AHEAD = 15;

/** WMO weather interpretation codes, as Open-Meteo reports them, in plain words. */
const CONDITIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Light freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light rain showers",
  81: "Rain showers",
  82: "Violent rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

export const describeWeatherCode = (code: number | null | undefined): string | null =>
  code === null || code === undefined ? null : (CONDITIONS[code] ?? null);

type OpenMeteoLocation = {
  daily?: {
    time?: string[];
    weather_code?: (number | null)[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    precipitation_probability_max?: (number | null)[];
    wind_speed_10m_max?: (number | null)[];
  };
};

export type WeatherOptions = { baseUrl: string; userAgent: string; fetchFn?: FetchLike };
export type WeatherRequestPoint = LatLon & { label: string; kmFromStart: number };

const TIMEOUT_MS = 12_000;
const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Daily forecasts from an Open-Meteo-compatible service for a few points along
 * the route. Never guesses: outside the forecast range, or when the service
 * fails, it reports the weather as unavailable with the reason.
 */
export class WeatherForecaster {
  readonly source = "Open-Meteo";
  private readonly cache = new TtlCache<WeatherData>(3600 * 1000, 300);

  constructor(
    private readonly options: WeatherOptions,
    private readonly today: () => Date = () => new Date(),
  ) {}

  async forecast(
    points: WeatherRequestPoint[],
    startDate: string,
    endDate: string,
  ): Promise<WeatherData> {
    const lastForecastDate = toIsoDate(
      new Date(this.today().getTime() + FORECAST_DAYS_AHEAD * 24 * 3600 * 1000),
    );
    if (startDate > lastForecastDate) {
      return {
        available: false,
        reason: `Forecasts only reach ${FORECAST_DAYS_AHEAD} days ahead. Check again closer to your ride.`,
      };
    }
    // A long trip may run past the forecast: ask only for the days it covers.
    const lastDate = endDate > lastForecastDate ? lastForecastDate : endDate;
    const key = `${points.map((p) => `${p.lat.toFixed(2)},${p.lon.toFixed(2)}`).join("|")}:${startDate}:${lastDate}`;
    try {
      return await this.cache.getOrLoad(key, () => this.fetchForecast(points, startDate, lastDate));
    } catch (error) {
      const outOfRange = error instanceof UpstreamError && error.status === 400;
      return {
        available: false,
        reason: outOfRange
          ? "The weather service has no forecast for these dates."
          : "The weather service didn't respond.",
      };
    }
  }

  private async fetchForecast(
    points: WeatherRequestPoint[],
    startDate: string,
    endDate: string,
  ): Promise<WeatherData> {
    const params = new URLSearchParams({
      latitude: points.map((point) => point.lat.toFixed(4)).join(","),
      longitude: points.map((point) => point.lon.toFixed(4)).join(","),
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
      timezone: "auto",
      start_date: startDate,
      end_date: endDate,
    });
    const body = await fetchJson<OpenMeteoLocation | OpenMeteoLocation[]>(
      {
        service: "weather",
        url: `${this.options.baseUrl}/v1/forecast?${params.toString()}`,
        userAgent: this.options.userAgent,
        timeoutMs: TIMEOUT_MS,
      },
      this.options.fetchFn,
    );
    // One location comes back as an object, several as an array in request order.
    const locations = Array.isArray(body) ? body : [body];
    const weatherPoints = points.flatMap((point, index) => {
      const daily = locations[index]?.daily;
      if (!daily?.time?.length) return [];
      const days: DailyWeather[] = daily.time.map((date, day) => ({
        date,
        tempMaxC: daily.temperature_2m_max?.[day] ?? null,
        tempMinC: daily.temperature_2m_min?.[day] ?? null,
        rainChancePct: daily.precipitation_probability_max?.[day] ?? null,
        windKph: daily.wind_speed_10m_max?.[day] ?? null,
        condition: describeWeatherCode(daily.weather_code?.[day]),
      }));
      return [{ ...point, days }];
    });
    if (weatherPoints.length === 0) {
      return { available: false, reason: "The weather service returned no forecast." };
    }
    return { available: true, points: weatherPoints };
  }
}
