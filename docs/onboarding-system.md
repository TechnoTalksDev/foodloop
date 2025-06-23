# Onboarding System

## Overview

The FoodLoop app now includes a comprehensive onboarding system that guides new users through a series of questions to personalize their experience. This system is integrated with Supabase authentication and user management.

## Architecture

### Components

1. **Onboarding Screen** (`/app/onboarding.tsx`)
   - Multi-step form with progress indicator
   - Dynamic question types (single-choice, multiple-choice)
   - Beautiful UI with icons and animations
   - Validates minimum selections for multiple-choice questions

2. **Onboarding Complete Screen** (`/app/onboarding-complete.tsx`)
   - Congratulations screen shown after completion
   - Showcases app benefits
   - Redirects to main app

3. **useOnboarding Hook** (`/lib/useOnboarding.ts`)
   - Reusable hook for managing onboarding state
   - Handles completion logic
   - Provides loading states and error handling

### Flow

1. **User Authentication**: User signs in with Google via the welcome screen
2. **Profile Creation**: Auth provider automatically creates user profile in Supabase
3. **Onboarding Check**: System checks `onboarding_complete` field in user table
4. **Onboarding Flow**: If incomplete, user is redirected to onboarding screens
5. **Completion**: After finishing, `onboarding_complete` is set to `true`
6. **Future Logins**: Users skip onboarding on subsequent logins

## Database Schema

The onboarding system uses the existing `users` table with the following relevant fields:

```sql
create table public.users (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  username text null,
  name text null,
  avatar text null,
  email text null,
  onboarding_complete boolean not null default false,
  -- ... other fields
);
```

## Onboarding Questions

Currently includes four placeholder questions:

1. **Food Interests** (Multiple Choice)
   - Fruits, Vegetables, Bakery, Dairy, etc.
   - Minimum 3 selections required

2. **Primary Goal** (Single Choice)
   - Save money, reduce waste, discover local businesses, etc.

3. **Location Selection** (Location Input)
   - Current location detection button
   - Google Places autocomplete text input (filtered to cities only)
   - Shows selected location with confirmation
   - Requires `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable

4. **Shopping Frequency** (Single Choice)
   - Daily, weekly, monthly, etc.

## Customization

### Adding New Questions

To add new onboarding questions, modify the `onboardingSteps` array in `/app/onboarding.tsx`:

```typescript
const onboardingSteps = [
  // ... existing steps
  {
    id: 5,
    title: "New Question Title",
    subtitle: "Question description",
    type: "single-choice", // or "multiple-choice" or "location"
    options: [
      { id: "option1", label: "Option 1", icon: "🎯" },
      // ... more options (empty array for location type)
    ],
  },
];
```

**Supported Question Types:**
- `single-choice`: User selects one option from a list
- `multiple-choice`: User selects multiple options (minimum 3 required)
- `location`: Special type with current location detection and text input with autocomplete

### Storing Answers

Currently, answers are logged to the console. To store them in the database:

1. Add columns to the `users` table for specific answers
2. Modify the `completeOnboarding` function in `/lib/useOnboarding.ts`
3. Update the onboarding screen to pass answers to the completion function

### Styling

The onboarding screens use the app's existing design system:
- Tailwind CSS classes for styling
- Consistent with app's dark theme and green accent colors
- Responsive design for different screen sizes

## Configuration

### Environment Variables

The location selection step requires Google Places API configuration:

```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Google Places API Setup:**
1. Enable the Google Places API in your Google Cloud Console
2. Create an API key with proper restrictions
3. Add the key to your environment variables

### Location Filtering

The Google Places autocomplete is configured to show cities only using the `types: "(cities)"` parameter. This ensures users can only select proper city locations rather than specific addresses or landmarks.

## Technical Implementation

### Routing Logic

The authentication provider (`/context/supabase-provider.tsx`) handles the routing logic:

```typescript
const checkOnboardingStatus = async () => {
  // Check if user has completed onboarding
  // Route to /onboarding or / accordingly
};
```

### State Management

- Local state for onboarding progress and answers
- Supabase for persistent onboarding completion status
- React hooks for reusable onboarding logic

### Error Handling

- Graceful error handling for database operations
- Fallback routing if onboarding check fails
- Loading states for async operations

## Future Enhancements

1. **Answer Storage**: Store user answers in database for personalization
2. **Skip Option**: Allow users to skip onboarding (with confirmation)
3. **Progress Persistence**: Save progress if user navigates away
4. **Dynamic Questions**: Load questions from database/CMS
5. **A/B Testing**: Different onboarding flows for testing
6. **Analytics**: Track completion rates and drop-off points
