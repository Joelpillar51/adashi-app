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

### Frontend
- **Framework**: React Native with Expo SDK 53
- **Language**: TypeScript
- **Navigation**: React Navigation v6 (Native Stack & Tabs)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand with AsyncStorage persistence
- **Animations**: React Native Reanimated v3
- **Gestures**: React Native Gesture Handler
- **Icons**: Expo Vector Icons (Ionicons)
- **Date Handling**: date-fns with WAT timezone support

### Backend & Database
- **Backend-as-a-Service**: Supabase
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth with email/password and Google OAuth
- **Email Verification**: OTP-based email confirmation
- **Real-time**: Supabase real-time subscriptions
- **Security**: JWT tokens, RLS policies, secure API endpoints

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

1. **Copy environment template**:
```bash
cp .env.example .env
```

2. **Configure Supabase** (Required for full functionality):
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Set up database**: 
   - **Quick Setup**: Follow the [SQL Setup Guide](./sql/README.md) - **START HERE**
   - **Detailed Guide**: [Supabase Setup Guide](./SUPABASE_SETUP.md)

**IMPORTANT**: You must run the SQL files in the `sql/` folder for the app to work with real user data. Without this, the app will only show mock data.

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
│   ├── authStore.ts        # Supabase authentication
│   ├── groupStore.ts       # Groups and payments
│   ├── userStore.ts        # User profile
│   ├── notificationStore.ts # Notifications
│   └── mockData.ts         # Development data
├── config/             # Configuration files
│   └── supabase.ts         # Supabase client setup
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

## 📋 Roadmap

### Phase 1: Core Authentication ✅
- [x] Supabase authentication integration
- [x] Email/password signup and signin
- [x] Google OAuth integration
- [x] OTP email verification
- [x] User profile management
- [x] Row Level Security implementation

### Phase 2: Group Management (In Progress)
- [ ] Group creation and management
- [ ] Member invitation system
- [ ] Position assignment (manual/raffle)
- [ ] Group settings and permissions
- [ ] Real-time group updates

### Phase 3: Financial Tracking
- [ ] Contribution recording
- [ ] Payment verification
- [ ] Payout distribution
- [ ] Transaction history
- [ ] Financial reporting

### Phase 4: Advanced Features
- [ ] Push notifications
- [ ] Real-time messaging
- [ ] Advanced analytics
- [ ] Payment gateway integration
- [ ] Offline support
- [ ] Multi-language support
- [ ] Dark mode theme

## 📚 Documentation

- [Supabase Setup Guide](./SUPABASE_SETUP.md) - Complete backend setup instructions
- [Database Schema](./DATABASE_SCHEMA.md) - Comprehensive database documentation
- [OTP Setup Guide](./OTP_SETUP.md) - Email verification implementation
- [Development Guide](./ReadMeKen.md) - Development best practices and common issues

## 🐛 Known Issues

- ✅ Date picker on iOS wheel display (resolved)
- ✅ Navigation context issues in nested screens (resolved)
- ✅ Supabase auth trigger permissions (resolved - using upsert_profile function)
- [ ] Bank details validation needs enhancement
- [ ] Real-time updates for group changes

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