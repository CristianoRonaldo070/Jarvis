

## JARVIS AI Frontend — Implementation Plan

### Theme & Visual Style
- **Iron Man JARVIS** aesthetic: dark background (#0a0e17), cyan/blue glowing HUD elements, circular arc reactor-style animations, holographic card effects, futuristic sans-serif fonts (Orbitron/Rajdhani)

### Flow & Pages

**1. Splash/Loading Screen (first visit)**
- Full-screen dark background with a glowing arc reactor animation in center
- "J.A.R.V.I.S." text with a typing/glitch reveal effect
- Auto-transitions to Login page after ~3 seconds

**2. Login & Signup Pages**
- Glassmorphic card with cyan borders/glow
- Email + password fields with glowing focus states
- Toggle between Login and Signup modes
- On submit → full-screen loading animation (HUD-style scanning effect) before redirecting to dashboard
- All frontend-only with localStorage for mock auth

**3. Onboarding Dashboard (after signup)**
- **Step 1: Select Interests** (max 5)
  - Grid of interest chips covering tech & lifestyle: AI, Programming, Robotics, Blockchain, Gaming, Music, Travel, Fitness, Movies, Science, Art, Food, Space, Photography, Crypto, etc.
  - Search bar to filter interests
  - Glowing selected state, counter showing X/5 selected
  - Submit button

- **Step 2: Set Username**
  - "What should JARVIS call you?" prompt
  - Text input with cyan glow, JARVIS-style confirmation animation

**4. Main Dashboard**
- **Header**: "J.A.R.V.I.S." logo with glow effect + Logout button
- **Center**: Large glowing AI orb/waveform visualizer (voice visualizer style)
  - Idle state: subtle pulsing glow
  - Active state (on click): animated audio waveform bars, cyan energy waves
  - A sleek, fading "Activate" button below the orb
- **Greeting**: "Good evening, {username}" in JARVIS style
- **Footer**: Minimal futuristic footer with subtle HUD lines

### State Management
- localStorage for user data (login state, username, interests)
- React state for animations and UI flow
- No backend — fully mock/frontend

### Key Animations
- CSS keyframe animations for glows, pulses, and wave effects
- Canvas or CSS-based voice visualizer waveform
- Smooth page transitions with fade/scale effects

