import { config } from "dotenv";
config();

import app from "./app";

const PORT = process.env.PORT || 4000;

// Start server
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});


