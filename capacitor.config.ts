import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wonde.reps',
  appName: 'Reps',
  webDir: 'build',
  server: {
    url: 'http://localhost:3000',
    cleartext: true
  }
};

export default config;
