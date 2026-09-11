const app = require("./app");

const PORT = process.env.PORT || 3005;
const DOMAIN = process.env.DOMAIN || "localhost";

app.listen(PORT, () => {
  console.log(`Servidor ejecutandose en http://${DOMAIN}:${PORT}`);
});
