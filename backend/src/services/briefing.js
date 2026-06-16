// LLM ile doğal dil operatör brifingi (Anthropic Claude).
// ANTHROPIC_API_KEY tanımlı değilse, yapısal veriden şablon brifing üretilir.

const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-haiku-4-5-20251001";

function fallback(rec) {
  const lines = [];
  lines.push(
    `${rec.flightNo} aksaklığı: ${rec.affectedCount} yolcu etkilendi, ${rec.alternativeCount} alternatif uçuş mevcut. Atama yöntemi: ${rec.method}.`
  );
  const top = rec.passengers.slice(0, 3);
  for (const p of top) {
    const best = p.options?.[0];
    const where = best ? `${best.toFlightNo} (+${best.addedDelayMin} dk)` : "alternatif yok";
    const care = p.care ? ` · ${p.care.note}` : "";
    lines.push(`• ${p.fullName} (öncelik ${p.score}, ${p.loyalty}) → ${where}${care}`);
  }
  const careCount = rec.passengers.filter((p) => p.care).length;
  if (careCount) lines.push(`Toplam ${careCount} yolcuya care aksiyonu önerildi.`);
  return { source: "fallback", briefing: lines.join("\n") };
}

export async function generateBriefing(rec) {
  if (!KEY) return fallback(rec);
  const summary = {
    ucus: rec.flightNo,
    etkilenen: rec.affectedCount,
    alternatif: rec.alternativeCount,
    yontem: rec.method,
    ornekler: rec.passengers.slice(0, 6).map((p) => ({
      ad: p.fullName,
      oncelik: p.score,
      sadakat: p.loyalty,
      sinif: p.ticketClass,
      baglantili: p.hasConnection,
      ozel: p.specialNeed,
      onerilen: p.options?.[0]
        ? { ucus: p.options[0].toFlightNo, ekDakika: p.options[0].addedDelayMin }
        : null,
      care: p.care?.note ?? null,
    })),
  };

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content:
              "Aşağıdaki IRROPS özetini Türkçe, 4-6 cümlelik kısa bir OPERATÖR BRİFİNGİNE çevir. Toplu durumu, en öncelikli 2-3 vakayı ve dikkat edilecek tek bir uyarıyı belirt. Süslemeden, profesyonel ton:\n\n" +
              JSON.stringify(summary),
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`Claude ${r.status}`);
    const data = await r.json();
    const text = data.content?.[0]?.text?.trim();
    if (!text) throw new Error("boş yanıt");
    return { source: "claude", briefing: text };
  } catch {
    return fallback(rec);
  }
}
