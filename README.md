# SafePath Bronx - Intelligent Safety Navigation

Find the safest walking routes in the Bronx using real-time crime data and community reports.

## Features

- 🗺️ **Interactive Map**: Google Maps focused on the Bronx
- 🛡️ **Safe Route Planning**: AI-powered route analysis using crime data
- 📊 **Real-time Crime Data**: NYC Open Data integration
- 🏘️ **Community Reports**: User-generated safety alerts
- 🌐 **Multi-language Support**: 6 languages (EN, ES, FR, ZH, AR, RU)
- 📱 **Responsive Design**: Works on desktop and mobile

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd hackthebronx
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Google Maps API Key

1. Get your API key from [Google Cloud Console](https://developers.google.com/maps/documentation/javascript/get-api-key)
2. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Directions API
3. Create a `.env.local` file in the root directory:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Google Maps JavaScript API
- **Data**: NYC Open Data API
- **Storage**: Browser SessionStorage (for testing)

## Data Sources

- **Crime Data**: NYC Open Data (January 2024 - May 2024)
- **Community Reports**: User-generated, session-based storage

## Security Notes

- API keys are stored in environment variables
- No sensitive data is committed to the repository
- Community reports use session storage for privacy

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project was created for educational purposes and hackathon participation.
