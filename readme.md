# 🌱 FoodLoop

*A sustainable food marketplace connecting communities to reduce waste and support local businesses*

**🏆 TSA Nationals 2025 Software Development Entry**  
*Nashville, Tennessee National Conference*

---

## 🌟 About FoodLoop

FoodLoop is a comprehensive mobile application that tackles food waste while building stronger communities. Our platform connects consumers with local businesses to purchase surplus food at discounted prices, creating a win-win solution for environmental sustainability and economic savings.

### 🎯 Our Mission
- **🌍 Reduce Food Waste** - Prevent quality food from ending up in landfills
- **💰 Save Money** - Offer consumers significant discounts on fresh food
- **🌱 Help the Environment** - Reduce CO₂ emissions from food waste
- **🏪 Support Local Businesses** - Create new revenue streams for partnerships

---

## ✨ Key Features

### 🛒 **Smart Marketplace**
- Real-time inventory of surplus food from local businesses
- Advanced filtering by category, price, location, and dietary preferences
- Smart cart system with instant updates and environmental impact tracking
- Secure checkout with integrated payment processing

### 🤖 **AI-Powered SmartPlate Advisor**
- Photo-based plant disease diagnosis using Google Gemini AI
- Personalized growing recommendations based on location and experience
- Real-time chat support for gardening questions
- Recipe suggestions using available marketplace items

### 🌱 **Personal Garden Management**
- Complete plant lifecycle tracking with check-in reminders
- Calendar system for watering, fertilizing, and harvesting schedules
- Weather integration with location-based growing advice
- Progress tracking with milestone celebrations

### 💬 **Community & Messaging**
- Real-time messaging system between buyers and sellers
- Community forums organized by topics and local groups
- Achievement system with gamified sustainability goals
- Neighborhood-based group management

### 📊 **Impact Dashboard**
- Personal environmental impact tracking (CO₂ saved, water conserved)
- Money saved analytics with spending insights
- Food waste prevention metrics and streak tracking
- Community impact comparisons and leaderboards

---

## 🛠 Technical Architecture

### **Modern Architecture**
- **React Native + Expo** - Cross-platform mobile development
- **TypeScript** - Type-safe development with enhanced IDE support
- **Supabase** - Full-stack backend with real-time capabilities
- **TailwindCSS + NativeWind** - Utility-first styling system

### **Advanced Features**
- **Real-time Updates** - Live messaging and cart synchronization
- **Offline Capabilities** - Cached data for seamless user experience
- **Smart Caching** - Optimized performance with intelligent data management
- **Comprehensive Testing** - Jest testing suite with 100% coverage on core utilities

### **User Experience**
- **Smooth Onboarding** - Multi-step guided setup with location services
- **Haptic Feedback** - Tactile responses for enhanced interaction
- **Dark/Light Mode** - Adaptive UI with user preference support
- **Accessibility** - Screen reader compatible with semantic markup

### **Security & Performance**
- **Row Level Security** - Database-level access control with Supabase RLS
- **Google OAuth Integration** - Secure authentication flow
- **Profanity Filtering** - Community content moderation
- **Optimized Queries** - Efficient database operations with indexing

---

## 🏗 Project Structure

```
foodloop/
├── app/                    # Expo Router navigation structure
│   ├── (protected)/        # Authenticated user screens
│   │   ├── (tabs)/         # Main app tabs (Home, Marketplace, etc.)
│   │   └── modals/         # Overlay screens and modals
│   ├── onboarding.tsx      # Multi-step user setup
│   └── welcome.tsx         # Landing and authentication
├── components/             # Reusable UI components
│   └── ui/                 # Design system components
├── context/                # Global state management
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and services
└── docs/                   # Comprehensive documentation
```

---

## � Getting Started

### Prerequisites
- Node.js 18+ and Bun package manager
- Expo CLI and development environment
- Supabase account with configured project

### Setup
1. **Clone and Install**
   ```bash
   git clone https://github.com/TechnoTalksDev/foodloop
   cd foodloop
   bun install
   ```

2. **Configure Environment**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Add your Supabase credentials
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start Development**
   ```bash
   bun run start
   ```

---

## 📚 Documentation

Our comprehensive documentation covers all aspects of the application:

- [🏗 Project Structure](docs/project-structure.md)
- [🛒 Cart System Integration](docs/cart-system.md)
- [⚡ Real-time Features](docs/realtime-implementation-summary.md)
- [🧪 Testing Framework](docs/testing-setup-summary.md)
- [🎨 UI Components & Styling](docs/components-and-styling.md)

---

## 🏆 TSA Competition Highlights

**Innovation & Problem Solving:**
- Addresses real-world food waste crisis affecting 40% of US food supply
- Combines environmental sustainability with economic incentives
- Integrates cutting-edge AI for personalized user experiences

**Technical Sophistication:**
- Real-time data synchronization across multiple user interactions
- Complex state management with optimistic updates
- Scalable architecture supporting thousands of concurrent users

**User-Centered Design:**
- Extensive user research informing intuitive interface design
- Accessibility considerations for inclusive user experience
- Gamification elements encouraging sustained engagement

**Community Impact:**
- Partnerships with local businesses including student stores
- Measurable environmental impact tracking
- Educational components promoting sustainable practices

---

## 📈 Future Roadmap

- **Expanded AI Capabilities** - Recipe generation and meal planning
- **Business Dashboard** - Analytics and inventory management for partners
- **Social Features** - Community challenges and sharing capabilities
- **IoT Integration** - Smart garden sensors and automation

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help makes FoodLoop better for everyone.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ for TSA Nationals 2025 • Nashville, Tennessee*
