const http = require("http");
const PORT = 8000;

// Números de teste que "têm WhatsApp" — adicione seus próprios números reais aqui
// Formato: apenas dígitos, com DDD e 55 (ex: 5511999999999)
const WHATSAPP_TEST_NUMBERS = new Set([
  "5511999999999",
]);

function simulateHasWhatsApp(phone) {
  // 1. Verifica na lista de números reais conhecidos
  const digits = phone.replace(/\D/g, "");
  if (WHATSAPP_TEST_NUMBERS.has(digits)) return true;
  // 2. Fallback: baseado no último dígito (7, 8, 9 = tem WhatsApp)
  const lastDigit = parseInt(digits[digits.length - 1], 10);
  return lastDigit >= 7;
}
http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.writeHead(200).end();
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === "/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ready", phone: "5511999999999", connected: true }));
    return;
  }
  if (url.pathname === "/check-number" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const { phone } = JSON.parse(body);
      const hasWhatsApp = simulateHasWhatsApp(phone);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ exists: hasWhatsApp, hasWhatsApp, number: phone }));
    });
    return;
  }
  res.writeHead(404).end();
}).listen(PORT, () => console.log(`Mock OpenWA running on http://localhost:${PORT}`));