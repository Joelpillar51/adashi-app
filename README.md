# Adashi - Nigerian ROSCA/Tontine Mobile App

A comprehensive React Native application for managing rotating savings and credit associations (ROSCAs/Tontine) specifically designed for Nigerian communities.

## 🏆 Features

### Core ROSCA Management
- **Digital Savings Circles**: Create and join rotating savings groups
- **Automated Tracking**: Eliminate manual record-keeping and disputes
- **Position Management**: Automated and manual rotation assignment
- **Payment Tracking**: Complete contribution and collection history
- **Nigerian Banking**: Integrated with major Nigerian banks

### Smart Notifications
- **Payment Reminders**: Timely alerts for upcoming contributions
- **Collection Alerts**: Notifications when it's your turn to collect
- **Group Updates**: Real-time updates on group activity
- **Member Activity**: Track when members join or leave groups

### User Experience
- **Intuitive Interface**: Clean, Nigerian-context design
- **Multiple Groups**: Participate in multiple savings circles
- **Secure Banking**: Safe bank account integration
- **Real-time Chat**: Group communication features
- **Progress Tracking**: Visual cycle progress and statistics

### Nigerian Context
- **Naira Formatting**: Proper Nigerian currency display
- **Local Banks**: Pre-configured Nigerian bank list
- **Cultural Understanding**: Built for traditional savings groups
- **West Africa Time**: Proper timezone handling

## 📱 Screenshots

*Screenshots will be added here*

## 🚀 Tech Stack

- **Framework**: React Native with Expo SDK 53
- **Language**: TypeScript
- **Navigation**: React Navigation v6 (Native Stack & Tabs)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand with AsyncStorage persistence
- **Animations**: React Native Reanimated v3
- **Gestures**: React Native Gesture Handler
- **Icons**: Expo Vector Icons (Ionicons)
- **Date Handling**: date-fns with WAT timezone support

## 📦 Installation

### Prerequisites
- Node.js 18+ or Bun
- Expo CLI
- iOS Simulator or Android Emulator
- Git

### Setup
```bash
# Clone the repository
git clone [repository-url]
cd adashi-app

# Install dependencies
bun install
# or
npm install

# Start the development server
bun start
# or
expo start
```

### Environment Setup
The app comes with pre-configured environment variables. No additional API keys are required for development.

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── navigation/          # Navigation configuration
│   ├── AppNavigator.tsx     # Main stack navigator
│   ├── TabNavigator.tsx     # Bottom tab navigation
│   └── RootNavigator.tsx    # Root navigation with auth
├── screens/            # Application screens
│   ├── auth/               # Authentication screens
│   ├── groups/             # Group management
│   ├── payments/           # Payment handling
│   └── profile/            # User profile
├── state/              # State management
│   ├── authStore.ts        # Authentication state
│   ├── groupStore.ts       # Groups and payments
│   ├── userStore.ts        # User profile
│   ├── notificationStore.ts # Notifications
│   └── mockData.ts         # Development data
├── types/              # TypeScript definitions
├── utils/              # Utility functions
│   ├── currency.ts         # Naira formatting
│   ├── date.ts             # WAT timezone utilities
│   └── cn.ts               # Tailwind class merger
└── api/                # External integrations
    ├── anthropic.ts        # AI integration
    ├── openai.ts           # AI integration
    └── grok.ts             # AI integration
```

## 💡 Key Features Implementation

### ROSCA/Tontine Logic
- Monthly contribution tracking
- Automated rotation calculations
- Position assignment (manual & raffle)
- Cycle progress monitoring
- Collection scheduling

### Nigerian Banking Integration
- Major Nigerian banks pre-configured
- Account validation
- Transfer instructions
- Payment confirmations

### Smart Notifications
- Contextual notification types
- Priority-based alerts
- Navigation integration
- Read/unread tracking

### User Profile Management
- Comprehensive profile editing
- Notification preferences
- Security settings
- Statistics tracking

## 🎨 Design System

The app follows Apple's Human Interface Design guidelines with Nigerian context:

- **Colors**: Blue primary, contextual status colors
- **Typography**: System fonts with proper hierarchy
- **Spacing**: Consistent 4px grid system
- **Components**: Reusable design tokens
- **Accessibility**: Proper contrast and touch targets

## 🔧 Development

### Available Scripts
```bash
# Start development server
bun start

# Run on iOS
bun ios

# Run on Android
bun android

# Run tests
bun test

# Type checking
bun tsc

# Linting
bun lint
```

### Contributing Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 TODO

- [ ] Real backend integration
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] Offline support
- [ ] Payment gateway integration
- [ ] Multi-language support
- [ ] Dark mode theme

## 🐛 Known Issues

- Date picker on iOS needs proper wheel display (partially resolved)
- Navigation context issues in nested screens (resolved)
- Bank details validation needs enhancement

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Team

Built with ❤️ for Nigerian communities

## 📞 Support

For support and questions:
- Email: support@adashi.ng
- Phone: +234 1 234 5678
- WhatsApp: +234 809 123 4567

---

**Adashi** - Empowering Nigerian communities through digital savings circles.