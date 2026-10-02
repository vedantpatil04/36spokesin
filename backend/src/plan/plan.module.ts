import { Logger, Module } from "@nestjs/common";
import { AppConfigService } from "../config/app-config.service.js";
import type { AiProvider } from "./ai/ai-provider.js";
import { AiService } from "./ai/ai.service.js";
import { GeminiProvider } from "./ai/gemini.provider.js";
import { OllamaProvider } from "./ai/ollama.provider.js";
import { Geocoder } from "./data/geocoder.js";
import { PlaceFinder } from "./data/places.js";
import { RouteFinder } from "./data/router.js";
import { WeatherForecaster } from "./data/weather.js";
import { JourneyPlanController, MyJourneysController } from "./plan.controller.js";
import { PlanService } from "./plan.service.js";
import { SavedJourneysService } from "./saved-journeys.service.js";
import { PlanSigner } from "./support/plan-signature.js";

/**
 * Journey planner (PLAN): real travel data, an AI itinerary on top, and saved
 * journeys. Every provider URL and key comes from configuration; clients can
 * never choose where requests go.
 */
@Module({
  controllers: [JourneyPlanController, MyJourneysController],
  providers: [
    PlanService,
    SavedJourneysService,
    {
      provide: Geocoder,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) =>
        new Geocoder({
          baseUrl: config.plan.geocoderUrl,
          userAgent: config.plan.userAgent,
          countryCodes: config.plan.geocoderCountryCodes,
        }),
    },
    {
      provide: RouteFinder,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) =>
        new RouteFinder({ baseUrl: config.plan.routerUrl, userAgent: config.plan.userAgent }),
    },
    {
      provide: WeatherForecaster,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) =>
        new WeatherForecaster({
          baseUrl: config.plan.weatherUrl,
          userAgent: config.plan.userAgent,
        }),
    },
    {
      provide: PlaceFinder,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) =>
        new PlaceFinder({ baseUrls: config.plan.placesUrls, userAgent: config.plan.userAgent }),
    },
    {
      provide: AiService,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const { ai, plan } = config;
        const byName: Record<(typeof ai.order)[number], () => AiProvider> = {
          gemini: () =>
            new GeminiProvider({
              apiKey: ai.gemini.apiKey,
              model: ai.gemini.model,
              baseUrl: ai.gemini.baseUrl,
              timeoutMs: ai.timeoutMs,
              userAgent: plan.userAgent,
            }),
          ollama: () =>
            new OllamaProvider({
              baseUrl: ai.ollama.baseUrl,
              model: ai.ollama.model,
              timeoutMs: ai.timeoutMs,
              userAgent: plan.userAgent,
            }),
        };
        return new AiService(
          ai.order.map((name) => byName[name]()),
          new Logger(AiService.name),
        );
      },
    },
    {
      provide: PlanSigner,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => new PlanSigner(config.auth.jwtSecret),
    },
  ],
})
export class PlanModule {}
