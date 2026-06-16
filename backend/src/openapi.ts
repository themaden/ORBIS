// Elle yazılmış minimal OpenAPI 3 spec — Swagger UI için.
export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "ORBIS API",
    version: "1.0.0",
    description:
      "Turkish Airlines IRROPS karar destek sistemi. JWT için /api/auth/login ile token al; korumalı uçlara `Authorization: Bearer <token>` ile gönder.",
  },
  servers: [{ url: "http://localhost:4000" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  paths: {
    "/health": {
      get: { summary: "Sağlık kontrolü", responses: { 200: { description: "ok" } } },
    },
    "/api/auth/login": {
      post: {
        summary: "JWT giriş",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: { username: { type: "string" }, password: { type: "string" } },
                example: { username: "ahmet", password: "orbis123" },
              },
            },
          },
        },
        responses: {
          200: { description: "token + kullanıcı" },
          401: { description: "hatalı bilgi" },
        },
      },
    },
    "/api/flights": {
      get: {
        summary: "Uçuş listesi",
        parameters: [{ name: "status", in: "query", schema: { type: "string" } }],
        responses: { 200: { description: "Liste" } },
      },
    },
    "/api/flights/{id}": {
      get: {
        summary: "Uçuş detayı",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Detay" }, 404: { description: "Bulunamadı" } },
      },
    },
    "/api/disruptions": {
      get: {
        summary: "IRROPS olayları",
        responses: { 200: { description: "Liste" } },
      },
      post: {
        summary: "Yeni IRROPS olayı oluştur (uçuşu iptal işaretler)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["flightId"],
                properties: {
                  flightId: { type: "string" },
                  type: { type: "string", enum: ["WEATHER", "TECHNICAL", "CREW", "AIRPORT"] },
                  reason: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Oluşturuldu" },
          400: { description: "Geçersiz" },
          401: { description: "Yetkisiz" },
        },
      },
    },
    "/api/disruptions/{id}/passengers": {
      get: {
        summary: "Etkilenen yolcular",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Yolcu listesi" } },
      },
    },
    "/api/disruptions/{id}/recommend": {
      post: {
        summary: "AI öneri motorunu çalıştır (atama + care + brifing)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Sıralı öneriler" },
          401: { description: "Yetkisiz" },
        },
      },
    },
    "/api/disruptions/{id}/apply": {
      post: {
        summary: "Bir öneriyi uygula (booking taşı + audit log)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["passengerId", "toFlightId"],
                properties: {
                  passengerId: { type: "string" },
                  toFlightId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Uygulandı" },
          400: { description: "Geçersiz" },
          401: { description: "Yetkisiz" },
          404: { description: "Bulunamadı" },
        },
      },
    },
    "/api/disruptions/{id}/proposals": {
      get: {
        summary: "Kayıtlı öneriler + care aksiyonları",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Liste" } },
      },
    },
    "/api/kpi/summary": {
      get: {
        summary: "Risk endeksi + özet istatistikler",
        responses: { 200: { description: "KPI" } },
      },
    },
    "/api/model/info": {
      get: {
        summary: "ML modeli metrikleri (holdout)",
        responses: {
          200: { description: "MAE/RMSE/AUC + feature importance" },
          503: { description: "AI servisi kapalı" },
        },
      },
    },
    "/api/risk/flights": {
      get: {
        summary: "Proaktif risk — sıradaki uçuşların ML tahmini",
        responses: { 200: { description: "Olasılığa göre sıralı liste" } },
      },
    },
  },
};
