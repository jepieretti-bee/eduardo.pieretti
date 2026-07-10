import app from './app.js';

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Controle de Ponto API rodando em http://localhost:${PORT}`);
});
