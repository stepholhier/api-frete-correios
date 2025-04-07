const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const CEP_ORIGEM = process.env.CORREIOS_CEP_ORIGEM;
const USUARIO = process.env.CORREIOS_USUARIO;
const SENHA = process.env.CORREIOS_SENHA;
const CARTAO = process.env.CORREIOS_CARTAO;

app.get("/", (req, res) => {
  res.send("🚀 API Correios rodando!");
});

app.get("/status", (req, res) => {
  res.json({ status: "✅ API Correios está ativa!", hora: new Date().toISOString() });
});

app.post("/calcular-frete", async (req, res) => {
  const { cepDestino, peso, comprimento, largura, altura } = req.body;

  if (!cepDestino) return res.status(400).json({ error: "CEP de destino obrigatório" });

  try {
    const params = new URLSearchParams({
      nCdEmpresa: USUARIO,
      sDsSenha: SENHA,
      nCdServico: "04014,04510",
      sCepOrigem: CEP_ORIGEM,
      sCepDestino: cepDestino,
      nVlPeso: peso?.toString() || "1",
      nCdFormato: "1",
      nVlComprimento: comprimento?.toString() || "16",
      nVlAltura: altura?.toString() || "2",
      nVlLargura: largura?.toString() || "11",
      nVlDiametro: "0",
      sCdMaoPropria: "n",
      nVlValorDeclarado: "0",
      sCdAvisoRecebimento: "n",
      StrRetorno: "json"
    });

    const url = `https://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx?${params.toString()}`;
    const response = await fetch(url);
    const text = await response.text();

    console.log("🔎 Resposta Correios:", text);
    res.send(text);

  } catch (err) {
    console.error("❌ Erro ao consultar Correios:", err);
    res.status(500).json({ error: "Erro ao consultar frete nos Correios" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
