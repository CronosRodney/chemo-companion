import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.df6338011f9346c2a7174709fe54b455',
  appName: 'chemo-companion',
  webDir: 'dist',
  server: {
    url: 'https://df633801-1f93-46c2-a717-4709fe54b455.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Browser: {
      presentationStyle: 'fullscreen',
      toolbarColor: '#1a1a1a'
    }
  }
};

export default config;
