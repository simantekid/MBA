import { createApp } from './app';
import { config } from './config/env';

const app = createApp();

app.listen(config.port, () => {
  console.log(`MBA module server running on port ${config.port}`);
});
