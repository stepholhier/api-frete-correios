const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const xml2js = require("xml2js");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const parser = new xml2js.Parser({ explicitArray: false });

const {
  CORREIOS_CEP_ORIGEM,
  CORREIOS_USUARIO,
  CORREIOS_SENHA,
  CORREIOS_CARTAO
} = process.env;

app.get("/", (req, res) => {
  res.send("🚀 API Correios via XML rodando com sucesso!");
});

app.get("/status", (req, res) => {
  res.json({ status: "✅ API está rodando!", hora: new Date().toISOString() });
});

app.post("/calcular-frete", async (req, res) => {
  const { cepDestino, peso, comprimento, largura, altura } = req.body;

  if (!cepDestino) {
    return res.status(400).json({ error: "CEP de destino é obrigatório" });
  }

  const params = new URLSearchParams({
    nCdEmpresa: CORREIOS_USUARIO,
    sDsSenha: CORREIOS_SENHA,
    sCepOrigem: CORREIOS_CEP_ORIGEM,
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
    nCdServico: "04510,04014", // PAC e SEDEX
    StrRetorno: "xml"
  });

  const url = `https://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx?${params.toString()}`;

  try {
    const response = await fetch(url);
    const xml = await response.text();

    parser.parseString(xml, (err, result) => {
      if (err) {
        console.error("Erro ao converter XML:", err);
        return res.status(500).json({ error: "Erro ao processar resposta dos Correios" });
      }

      const servicos = result?.Servicos?.cServico || [];

      // Normaliza se vier só um serviço
      const lista = Array.isArray(servicos) ? servicos : [servicos];

      const fretes = lista.map(item => ({
        codigo: item.Codigo,
        servico: item.Codigo === "04014" ? "SEDEX" : "PAC",
        valor: item.Valor,
        prazo: item.PrazoEntrega + " dias úteis",
        erro: item.Erro !== "0" ? item.MsgErro : null
      }));

      res.json(fretes);
    });
  } catch (error) {
    console.error("Erro ao consultar frete:", error);
    res.status(500).json({ error: "Erro ao consultar frete com os Correios" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
