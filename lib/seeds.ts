import type { Capture } from '../components/CaptureCard'

function d(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const SEED_CAPTURES: Capture[] = [
  {
    id: 'seed-revenuecat-setup',
    title: 'How to integrate RevenueCat for iOS subscriptions in React Native',
    sourceUrl: 'https://www.revenuecat.com/docs/getting-started/installation/reactnative',
    sourceType: 'video',
    creator: '@revenuecat',
    platform: 'RevenueCat Docs',
    date: d(3),
    stars: 0,
    starred: false,
    isPublic: false,
    pushed: false,
    pinned: false,
    category: 'technical',
    preview: '• expo install react-native-purchases — use expo install, not npm, to avoid native version mismatches\n• Initialize once at app root: Purchases.configure({ apiKey: RC_IOS_KEY, appUserID: userId })\n• Check entitlements via customerInfo.entitlements.active[\'your_entitlement_id\'] — returns active object or undefined\n• Always call restorePurchases() on app launch to sync across devices\n• Offerings come from RevenueCat dashboard — change prices/products without an app update',
    concepts: [
      'expo install react-native-purchases — always use expo install, not npm/yarn, to avoid native SDK version mismatches that cause SIGABRT crashes',
      'RevenueCat uses Entitlements (what the user can access), Products (what they buy in App Store), and Offerings (which products to show) as three separate concepts',
      'Purchases.configure() must be called once before any other RC method — do it in your root layout before any navigation happens',
      'customerInfo.entitlements.active is a dictionary — if the key exists, the user has access; if missing or expired, they don\'t',
      'Offerings are configured in the RevenueCat dashboard and fetched at runtime — you can run A/B tests and change pricing without a new app build',
      'Customer Center is a pre-built support screen that lets users manage subscriptions, request refunds, and contact support — wired with one line',
    ],
    actions: [
      'Run: expo install react-native-purchases react-native-purchases-ui',
      'Add "react-native-purchases" to plugins array in app.json',
      'Call Purchases.configure({ apiKey: RC_IOS_KEY }) in root _layout.tsx before auth check',
      'Create entitlement in RevenueCat dashboard (e.g. "pro") → attach your App Store subscription products to it',
      'Gate features with: const info = await Purchases.getCustomerInfo(); const hasAccess = !!info.entitlements.active["pro"]',
      'Add CustomerCenter sheet: import { presentCustomerCenter } from "react-native-purchases-ui"; await presentCustomerCenter()',
    ],
    quotes: [
      '"Configure once, check entitlements everywhere — never hardcode subscription state in local storage."',
      '"Offerings are fetched from RevenueCat servers, so you can change your paywall without shipping a new build."',
    ],
    transcript: `How to integrate RevenueCat in a React Native / Expo app

INSTALLATION

Use expo install, not npm or yarn:
  expo install react-native-purchases react-native-purchases-ui

Do NOT add react-native-purchases to plugins in app.json — it has no config plugin in v10.

This is a native module — it requires an EAS build to test. It will not work in Expo Go.

CONFIGURATION

Call this once in your root layout before any navigation:

  import Purchases, { LOG_LEVEL } from 'react-native-purchases'
  import { Platform } from 'react-native'

  const RC_IOS_KEY = 'appl_YOUR_IOS_KEY_HERE'
  const RC_ANDROID_KEY = 'goog_YOUR_ANDROID_KEY_HERE'

  Purchases.setLogLevel(LOG_LEVEL.ERROR)
  Purchases.configure({
    apiKey: Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY,
    appUserID: userId ?? null,
  })

ENTITLEMENT CHECKING

  const checkAccess = async () => {
    const customerInfo = await Purchases.getCustomerInfo()
    const hasPro = !!customerInfo.entitlements.active['pro']
    return hasPro
  }

PURCHASING

  const purchase = async (pkg: PurchasesPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg)
      if (customerInfo.entitlements.active['pro']) {
        // unlock features
      }
    } catch (e: any) {
      if (!e.userCancelled) Alert.alert('Purchase failed', e.message)
    }
  }

FETCHING OFFERINGS

  const offerings = await Purchases.getOfferings()
  const packages = offerings.current?.availablePackages ?? []

RESTORE PURCHASES

  const restore = async () => {
    const customerInfo = await Purchases.restorePurchases()
    return !!customerInfo.entitlements.active['pro']
  }

CUSTOMER CENTER (support + refunds, built-in UI)

  import { presentCustomerCenter } from 'react-native-purchases-ui'
  await presentCustomerCenter()

DASHBOARD SETUP ORDER
1. Create Entitlement (e.g. "pro", "creator")
2. Create Products (reference your App Store subscription IDs)
3. Attach Products to Entitlement
4. Create Offering and add packages
5. Set Offering as Default

PRODUCTS SETUP IN APP STORE CONNECT
- Go to App Store Connect → your app → Subscriptions
- Create a Subscription Group
- Add products with your chosen identifiers
- Set prices, reference name, and localization
- Submit for review (first submission requires a screenshot)
`,
  },
  {
    id: 'seed-expo-eas-build',
    title: 'EAS Build: how to ship a React Native app to the App Store',
    sourceUrl: 'https://docs.expo.dev/build/introduction/',
    sourceType: 'image',
    creator: '@expo',
    platform: 'Expo Docs',
    date: d(3),
    stars: 0,
    starred: false,
    isPublic: false,
    pushed: false,
    pinned: false,
    category: 'technical',
    preview: '• eas build --platform ios --profile production — triggers a cloud build, no Mac required\n• autoIncrement: true in eas.json auto-bumps build number on every build\n• eas submit --platform ios auto-uploads the IPA to App Store Connect after build\n• Development builds replace Expo Go — install once, test all native modules\n• OTA updates via eas update push JS changes instantly without App Store review',
    concepts: [
      'EAS Build runs on Expo\'s cloud servers — you don\'t need Xcode or a Mac to produce an IPA',
      'Three build profiles: development (dev client), preview (internal TestFlight), production (App Store)',
      'autoIncrement: true in eas.json automatically bumps the build number so you never get "build number already exists" rejections',
      'eas submit --platform ios uploads the built IPA directly to App Store Connect, no manual Transporter needed',
      'EAS Update pushes JS/asset changes over-the-air — users get fixes instantly without downloading a new version from the App Store',
    ],
    actions: [
      'Run: npm install -g eas-cli && eas login',
      'Run: eas build --platform ios --profile production (first build takes ~15 min)',
      'Run: eas submit --platform ios --latest to upload to TestFlight',
      'Set autoIncrement: true in eas.json production profile to avoid build number conflicts',
      'Use eas update --branch production --message "fix: login bug" for OTA JS fixes',
    ],
    quotes: [
      '"EAS Build means any team member can trigger an App Store build from any machine — no Mac required."',
    ],
    transcript: '',
  },
  {
    id: 'seed-app-store-aso',
    title: 'App Store ASO: how to write listing copy that gets found and converts',
    sourceUrl: '',
    sourceType: 'video',
    creator: '@appfollow',
    platform: 'Paste',
    date: d(3),
    stars: 0, starred: false, isPublic: false, pushed: false, pinned: false,
    category: 'marketing',
    preview: '• Your first 3 words of the app name carry 90% of search weight — put the category keyword there\n• The subtitle (30 chars) is indexed by Apple — treat it like a second title, not a tagline\n• Screenshots sell more than the description — show outcome screens, not your onboarding flow\n• Reviews answer "is this safe to download?" — 4.7+ rating with 50+ reviews removes all friction\n• A/B test creatives via App Store Connect Product Page Optimization before your next big push',
    concepts: [
      'Apple indexes the App Name (30 chars) and Subtitle (30 chars) in search — every character must be a high-volume keyword, not marketing copy',
      'The first screenshot frame is shown in search results before users tap — it must communicate the core value in under 2 seconds',
      'Reviews drive conversion: apps with 4.7+ and 50+ reviews convert 2-3x more than apps with fewer reviews or lower scores',
      'The "What\'s New" section is indexed by Apple — update it with relevant keywords on every release',
      'App Store Connect Product Page Optimization lets you A/B test icons, screenshots, and preview videos with live traffic before committing to a change',
      'Keyword field (100 chars, not shown to users) should contain words NOT already in your app name or subtitle — no repeats, comma-separated, no spaces after commas',
    ],
    actions: [
      'Put your highest-volume category keyword in the first 2-3 words of your App Name',
      'Fill the 30-char Subtitle with your #2 and #3 keywords (e.g. "AI Launch Tracker for Indie Devs")',
      'Replace onboarding screenshots with outcome screens showing the "after" state — what users accomplish',
      'Send an in-app review prompt 3 days after first meaningful action (not on first launch)',
      'Run an A/B test in App Store Connect with 2 screenshot variants for 7 days, then ship the winner',
    ],
    quotes: [
      '"Your app name is your SEO title tag. Every character is a keyword opportunity you can\'t afford to waste."',
      '"Nobody reads your description. They look at screenshots and scroll to reviews."',
    ],
    transcript: '',
  },
  {
    id: 'seed-product-hunt-launch',
    title: 'How to get 300+ upvotes on Product Hunt on launch day',
    sourceUrl: '',
    sourceType: 'video',
    creator: '@levelsio',
    platform: 'Paste',
    date: d(3),
    stars: 0, starred: false, isPublic: false, pushed: false, pinned: false,
    category: 'launch',
    preview: '• Launch at 12:01 AM PST Tuesday-Thursday — the week resets, competition is lower than Monday\n• Pre-build a launch list of 200+ supporters in your maker community before you post\n• Your first 50 upvotes in 2 hours determine if PH algorithm surfaces you in the top 5\n• Write your description like a tweet — 2 sentences, clear problem, clear solution\n• The hunter matters less than the maker community you\'ve built before launch day',
    concepts: [
      'Product Hunt resets at 12:01 AM PST — launch then to get the full 24-hour voting window',
      'Tuesday through Thursday are optimal: Monday has the most competition, Friday has too little traffic',
      'The first 2 hours are algorithmic — if you get 50+ upvotes fast, PH will feature you in their "Trending" section',
      'Your launch post needs a 3-second hook: "We built X so you can Y without Z" — no jargon, no adjectives',
      'Pre-launch Slack/Discord communities of indie hackers (IH, Makerpad, Vibecoded) are better than asking friends who don\'t use PH',
      'A launch on PH in the top 5 products of the day typically drives 300-1500 signups — but the community momentum after is what matters',
    ],
    actions: [
      'Create your PH maker account at least 2 weeks before launch (new accounts are flagged for manipulation)',
      'Build a list of 200+ indie hackers and past PH users who will support you — warm them up 1 week before',
      'Schedule your post for exactly 12:01 AM PST on a Tuesday or Wednesday',
      'Write your tagline as: "[App name] — [what it does] for [who]" in under 60 characters',
      'Respond to every single comment within the first 6 hours — engagement drives the algorithm',
      'Post your launch story in r/SideProject and r/Entrepreneur simultaneously with your PH link',
    ],
    quotes: [
      '"Product Hunt is not about your product. It\'s about the community you built before launch day."',
      '"Your first 50 upvotes in 2 hours is everything. After that, momentum carries you."',
    ],
    transcript: '',
  },
  {
    id: 'seed-pricing-psychology',
    title: 'SaaS pricing psychology: why anchoring makes everything else sell better',
    sourceUrl: '',
    sourceType: 'video',
    creator: '@priceintelligently',
    platform: 'Paste',
    date: d(3),
    stars: 0, starred: false, isPublic: false, pushed: false, pinned: false,
    category: 'pricing',
    preview: '• 3-tier pricing always outperforms 2-tier — the middle option gets 60-70% of purchases\n• Anchor with an enterprise tier even if you never sell it — it makes your mid tier feel like a deal\n• Monthly vs annual: show both always, with annual saving prominently displayed in green\n• Freemium works when the free tier creates a habit, not when it gives away the product\n• Price based on value delivered, never on cost to build — "we use 3 servers" is not a pricing strategy',
    concepts: [
      'The Goldilocks effect is real: in 3-tier pricing, 60-70% of buyers choose the middle option — position your best margin product there',
      'Anchoring works by making users compare options rather than decide if they want to pay at all — an expensive top tier makes the middle tier feel reasonable',
      'Charging per seat creates misaligned incentives — users hide licenses, avoid inviting teammates; per-team or per-project pricing scales with your customer\'s growth instead',
      'Annual plans should show "Save 40%" (or whatever your % is) not "pay yearly" — loss aversion means saving money is more motivating than paying less often',
      'Freemium only works when the free tier makes the paid tier obvious — e.g. Slack (you hit archive limits), not when free gives unlimited core features',
      'Value-based pricing: what does your product save or earn the customer? Price at 10-20% of that value — if you save them $5,000/mo, $499/mo is an easy sale',
    ],
    actions: [
      'Switch to 3-tier pricing with your best margin product in the middle tier',
      'Add an "Enterprise — Contact us" tier even if you don\'t have enterprise customers yet — it anchors everything below it',
      'Show annual pricing as the default with a "Save X%" badge; monthly should be opt-in',
      'Calculate the value you deliver per user per month, then price at 10-20% of that number',
      'A/B test: raise your price by 30% on half your traffic for 2 weeks — you may find conversion stays flat',
    ],
    quotes: [
      '"Your pricing page is not informational — it\'s persuasion. Design it like a sales page, not a menu."',
      '"If nobody is pushing back on your price, you\'re charging too little."',
    ],
    transcript: '',
  },
  {
    id: 'seed-first-10-users',
    title: 'How to find your first 10 users manually (without ads or Product Hunt)',
    sourceUrl: '',
    sourceType: 'video',
    creator: '@paulgraham',
    platform: 'Paste',
    date: d(3),
    stars: 0, starred: false, isPublic: false, pushed: false, pinned: false,
    category: 'launch',
    preview: '• Do things that don\'t scale — hand-pick, call, and onboard every early user yourself\n• Your first users come from 3 places: your network, niche communities, and direct outreach\n• DM 50 people who complained about your exact problem on Twitter/X in the last 30 days\n• Offer to set up the product for them for free in exchange for a 30-min feedback call\n• One user who tells 5 friends is worth 100 users who churned silently',
    concepts: [
      'YC\'s core principle: do things that don\'t scale. Call users, set up accounts for them, do their first job manually if needed — this is how you learn what product to build',
      'Twitter/X advanced search for complaints about your problem space (e.g. "hate managing invoices") surfaces 50-100 perfect early prospects per week',
      'Reddit niche communities are goldmines: find subreddits where your target user lives, read their posts for 2 weeks, then share your solution when it\'s genuinely relevant to a thread',
      'Warm intro converts 10x better than cold outreach — one mutual connection asking on your behalf beats 50 cold DMs',
      'The bar for first users is low: if someone will use your product even when it\'s broken, you have real pull; if they only use it when it\'s perfect, you have no product-market fit',
    ],
    actions: [
      'List your first 10 target users by name — not personas, actual people you can contact today',
      'Search Twitter/X for "I wish there was" or "why is there no app that" + your problem space, DM the posters',
      'Post in 3 relevant subreddits where your user lives — lead with the problem, not the product',
      'Offer free 1:1 onboarding calls to first 10 users in exchange for 20 min of feedback',
      'Set up a simple Tally or Typeform to capture beta signups and email each person personally when you\'re ready',
    ],
    quotes: [
      '"The first version of every successful product was terrible. Your first users are forgiving because the problem matters to them."',
      '"You need to be so in love with your users that you\'ll go to embarrassing lengths to help them."',
    ],
    transcript: '',
  },
  {
    id: 'seed-stripe-webhooks',
    title: 'Setting up Stripe webhooks in Python/FastAPI — the complete guide',
    sourceUrl: '',
    sourceType: 'video',
    creator: '@stripe',
    platform: 'Paste',
    date: d(3),
    stars: 0, starred: false, isPublic: false, pushed: false, pinned: false,
    category: 'technical',
    preview: '• Always verify the webhook signature — skip this and anyone can fake a payment\n• Handle checkout.session.completed to provision access, not payment_intent.succeeded\n• Use idempotency keys so retried webhooks don\'t double-provision users\n• Stripe retries failed webhooks for 3 days with exponential backoff — your endpoint must return 200 fast\n• Use the Stripe CLI locally: stripe listen --forward-to localhost:8000/webhook',
    concepts: [
      'stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET) must be called on every webhook — without it, anyone can POST fake payment events to your endpoint',
      'checkout.session.completed fires when payment succeeds AND the customer completes the checkout UI — use this, not payment_intent.succeeded, to provision subscriptions',
      'Stripe retries webhooks that don\'t return 2xx for up to 3 days — your handler must be idempotent (safe to run twice) and return 200 immediately, doing heavy work async or in background',
      'Store the stripe_customer_id on your user record the first time you see it — you\'ll need it for every future API call, cancellation, and customer portal session',
      'The Stripe CLI lets you forward live events to localhost: stripe listen --forward-to localhost:8000/webhook — no tunnel or ngrok needed during development',
    ],
    actions: [
      'Set STRIPE_WEBHOOK_SECRET as an env var — find it in Stripe Dashboard → Webhooks → your endpoint → Signing secret',
      'Verify every webhook: event = stripe.Webhook.construct_event(await request.body(), sig, WEBHOOK_SECRET)',
      'Listen for checkout.session.completed and customer.subscription.deleted as minimum viable events',
      'Store stripe_customer_id, stripe_subscription_id, and subscription_status on your user row',
      'Run locally: stripe listen --forward-to localhost:8000/webhook during development',
      'Add a processed_events table or Redis set to track event IDs and skip duplicates',
    ],
    quotes: [
      '"Never trust a payment webhook you haven\'t verified. Stripe gives you a signature for a reason — use it."',
      '"Return 200 immediately, do the work after. Stripe will retry if you take too long."',
    ],
    transcript: '',
  },
  {
    id: 'seed-landing-page-copy',
    title: 'The AIDA formula for landing page copy that converts cold traffic',
    sourceUrl: '',
    sourceType: 'video',
    creator: '@copyhackers',
    platform: 'Paste',
    date: d(3),
    stars: 0, starred: false, isPublic: false, pushed: false, pinned: false,
    category: 'marketing',
    preview: '• Your headline must answer "what is this, who is it for, why should I care" in under 8 words\n• The hero section alone determines 80% of bounce rate — get it right before anything else\n• Social proof near the CTA converts better than social proof at the bottom\n• Features tell, benefits sell — rewrite every bullet as "so you can X" to find the real copy\n• One CTA per page — multiple options cause decision paralysis and kill conversion',
    concepts: [
      'AIDA: Attention (headline hooks them), Interest (problem section makes them feel understood), Desire (benefits make them want it), Action (CTA asks for the single next step)',
      'The hero section headline must contain: what you do, who it\'s for, and the outcome — not your company\'s mission statement or how it works',
      'Social proof placement matters more than quantity: put a testimonial directly above or below your primary CTA, not just at the bottom of the page',
      '"Features tell, benefits sell" — a feature is "AI-powered summarization"; the benefit is "so you never forget what you learned from a video" — users buy benefits',
      'Specificity converts: "10x faster" is vague; "captures a YouTube video in 45 seconds" is believable and concrete — use real numbers from your own experience',
      'Every additional CTA on a page reduces conversion — remove the nav bar, remove secondary links, keep one action above the fold',
    ],
    actions: [
      'Rewrite your headline as: "[verb] [outcome] for [specific person] — without [main pain point]"',
      'Move your strongest testimonial to directly above or below your primary CTA button',
      'Rewrite every feature bullet as "so you can [benefit]" and delete the feature part if the benefit is clearer on its own',
      'Remove your nav bar on landing pages — it\'s an escape hatch from your conversion funnel',
      'Add one specific number to your hero section (time saved, cost reduced, results achieved) — estimate if you have to, verify later',
    ],
    quotes: [
      '"Your headline is the ad for the rest of the page. If it doesn\'t hook them, nothing below matters."',
      '"Specificity is credibility. Generic claims are ignored. A real number, even a small one, is trusted."',
    ],
    transcript: '',
  },
  {
    id: 'seed-building-in-public',
    title: 'Building in public: the strategy that drives 10x more followers than posting results',
    sourceUrl: '',
    sourceType: 'video',
    creator: '@marc_louvion',
    platform: 'Paste',
    date: d(3),
    stars: 0, starred: false, isPublic: false, pushed: false, pinned: false,
    category: 'marketing',
    preview: '• Post the journey, not the destination — failures get 3x more engagement than success posts\n• Weekly revenue screenshots + context outperform product announcement posts every time\n• Tag your stack in every post — developers and makers follow you because of what you\'re using\n• Reply to every comment for 90 days — the algorithm treats replies as signals of quality content\n• The goal is not followers, it\'s warm traffic: 500 followers who want to buy > 50,000 who don\'t care',
    concepts: [
      'Building in public is a distribution strategy, not a vanity metric play — every post builds a warm audience who already trusts you before your product exists',
      'Failure posts outperform success posts 3:1 on engagement because vulnerability is rare and relatable — "what I got wrong shipping v1" beats "we hit $1k MRR"',
      'Consistency beats quality: a mediocre post every day for 90 days compounds into an audience; a perfect post once a month is forgotten',
      'The "10/80/10 rule": 10% product posts, 80% process/learning posts, 10% personal — product-only accounts feel like ads, not people worth following',
      'Tagging your tech stack (Expo, FastAPI, Railway, Supabase) puts your posts in front of niche communities who build the same way and share recommendations',
    ],
    actions: [
      'Commit to posting once per day on X for 90 days — set a daily 8 AM alarm labeled "ship the post"',
      'Share your weekly revenue/signups/builds every Sunday with context on what changed — real numbers build trust',
      'Write "what I learned this week" threads every Friday — this format consistently gets saves and reposts',
      'Reply to every comment and mention for 90 days — this builds the algorithm\'s trust in your account',
      'Cross-post to LinkedIn with the same content — LinkedIn algo is less competitive, same effort, 3x the reach',
    ],
    quotes: [
      '"Your future customers are watching you build. The longer they\'ve watched, the less you have to sell."',
      '"Post the failure. Everyone is pretending to win. The person who admits they\'re figuring it out is the most followed."',
    ],
    transcript: '',
  },
  {
    id: 'seed-expo-push-notifications',
    title: 'Expo push notifications: complete guide for iOS and Android',
    sourceUrl: '',
    sourceType: 'video',
    creator: '@expo',
    platform: 'Paste',
    date: d(3),
    stars: 0, starred: false, isPublic: false, pushed: false, pinned: false,
    category: 'technical',
    preview: '• expo-notifications requires an EAS build — it will not work in Expo Go\n• Request permissions before calling getExpoPushTokenAsync — iOS will silently fail without them\n• Store the push token on your server per device — users can have multiple devices\n• Expo Push API limits to 100 tokens per request — batch your sends\n• Android needs a notification channel created before sending — iOS does not',
    concepts: [
      'expo-notifications is a native module — it requires eas build, not Expo Go, for the push token to actually work on a real device',
      'The Expo Push Token is device + app specific — store it in your database keyed to user_id, not on the device, so you can send from your server',
      'requestPermissionsAsync() must be called before getExpoPushTokenAsync() — on iOS, if you don\'t have permission, getExpoPushTokenAsync throws silently',
      'Android requires Notifications.setNotificationChannelAsync() to be called at app startup — without a channel, notifications are silently dropped on Android 8+',
      'Expo\'s Push API accepts up to 100 tokens per POST request — build batching logic if you have more than 100 users to notify at once',
      'setNotificationHandler at the app root controls behavior when a notification arrives while the app is foregrounded — if missing, notifications are silently swallowed',
    ],
    actions: [
      'Install: expo install expo-notifications expo-device',
      'Request permission THEN get token: const { status } = await Notifications.requestPermissionsAsync(); if (status === "granted") { const { data } = await Notifications.getExpoPushTokenAsync({ projectId }) }',
      'Add to Android startup: await Notifications.setNotificationChannelAsync("default", { name: "default", importance: Notifications.AndroidImportance.MAX })',
      'Set handler at app root: Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true }) })',
      'Send from server via Expo Push API: POST https://exp.host/--/api/v2/push/send with { to: token, title, body }',
      'Store push token in DB: save per device, update on each login (token can change after OS reinstall)',
    ],
    quotes: [
      '"The push token is not permanent. It can change. Store it every login, overwrite the old one."',
      '"Test push notifications on a real device from day one — the simulator behavior is not representative of production."',
    ],
    transcript: '',
  },
  {
    id: 'seed-posthog-analytics',
    title: 'PostHog analytics in React Native: setup, identify, and track custom events',
    sourceUrl: '',
    sourceType: 'video',
    creator: '@posthog',
    platform: 'Paste',
    date: d(3),
    stars: 0, starred: false, isPublic: false, pushed: false, pinned: false,
    category: 'technical',
    preview: '• posthog-react-native needs the AsyncStorage and UUID peer dependencies to work\n• Wrap your root layout in PostHogProvider with your project API key and host\n• Call posthog.identify(userId, { email, name }) immediately after login\n• Track events with posthog.capture("event_name", { key: value }) — use snake_case names\n• Session replay is available — enable it in the dashboard, not code, to start recording',
    concepts: [
      'posthog-react-native requires @react-native-async-storage/async-storage and react-native-uuid as peer deps — install them with expo install',
      'PostHogProvider must wrap your entire app (at root _layout.tsx level) — components below it can then use usePostHog() to get the posthog instance',
      'posthog.identify() ties all future events to a known user — call it right after login with userId as the first arg and user properties as the second',
      'Anonymous events before identify() are retroactively linked to the user once identify() is called — you don\'t lose pre-login data',
      'Event names should be action-based and snake_case: "capture_created", "thread_replied", "paywall_viewed" — not "CaptureCreated" or "capture created"',
      'Feature flags in PostHog let you roll out changes to % of users and roll back instantly from the dashboard — no code deploy needed for rollbacks',
    ],
    actions: [
      'Install: expo install posthog-react-native @react-native-async-storage/async-storage react-native-uuid',
      'Wrap root in: <PostHogProvider apiKey={POSTHOG_KEY} options={{ host: "https://us.i.posthog.com" }}>',
      'After login: const posthog = usePostHog(); posthog.identify(user.id, { email: user.email, name: user.name })',
      'On logout: posthog.reset() — this clears the identity so the next user starts fresh',
      'Track key funnel events: capture_started, capture_completed, paywall_viewed, subscription_started, thread_posted',
      'Enable Session Replay in PostHog dashboard settings → it will start recording immediately on next build without code changes',
    ],
    quotes: [
      '"If you\'re not tracking your funnel, you\'re guessing. Track the 5 events that matter most, ignore the rest."',
      '"PostHog replaces Mixpanel, LaunchDarkly, and Hotjar for an indie hacker. One install, full stack."',
    ],
    transcript: '',
  },
  {
    id: 'seed-fastapi-railway',
    title: 'Deploying a FastAPI backend to Railway in under 10 minutes',
    sourceUrl: '',
    sourceType: 'video',
    creator: '@railway',
    platform: 'Paste',
    date: d(3),
    stars: 0, starred: false, isPublic: false, pushed: false, pinned: false,
    category: 'technical',
    preview: '• Railway auto-detects Python and installs requirements.txt — no Dockerfile needed\n• Set PORT env var in your FastAPI uvicorn command: uvicorn main:app --host 0.0.0.0 --port $PORT\n• Add a /health endpoint that returns 200 — Railway uses it to know your app is alive\n• Environment variables in Railway are set per service, not per project — don\'t confuse the two\n• Free plan has a $5/mo credit — enough for a low-traffic API with 1 service',
    concepts: [
      'Railway detects Python projects via requirements.txt and auto-installs dependencies — no Dockerfile or Procfile needed for basic FastAPI deployments',
      'uvicorn must bind to 0.0.0.0 and use the $PORT env var Railway injects: uvicorn main:app --host 0.0.0.0 --port $PORT',
      'A health check endpoint (GET /health → {"status": "ok"}) is required for Railway to know your service is running — without it, Railway may cycle restarts',
      'Environment variables are set per Service (not per Project) in Railway dashboard → your service → Variables tab',
      'Railway auto-redeploys on every git push to your connected branch — no manual deploy step, but you must push to trigger it',
      'Neon Postgres integrates natively with Railway — create a Neon project, copy the DATABASE_URL connection string, paste it as a Railway variable',
    ],
    actions: [
      'Add a start command in Railway: uvicorn main:app --host 0.0.0.0 --port $PORT',
      'Add GET /healthz route that returns {"status": "ok"} — Railway\'s health check hits this',
      'Set all secrets as Railway service variables — never commit .env files',
      'Connect your GitHub repo in Railway → push to main to trigger auto-deploy',
      'Check logs in Railway dashboard → your service → Deployments → the latest deployment → View logs',
      'Use asyncpg with ssl="require" to connect to Neon Postgres from Railway',
    ],
    quotes: [
      '"Railway is the closest thing to Heroku that doesn\'t make you want to cry. Push to git, it\'s deployed."',
    ],
    transcript: '',
  },
  {
    id: 'seed-privacy-policy',
    title: 'What your privacy policy must include to avoid App Store rejection and legal trouble',
    sourceUrl: '',
    sourceType: 'video',
    creator: '@iubenda',
    platform: 'Paste',
    date: d(3),
    stars: 0, starred: false, isPublic: false, pushed: false, pinned: false,
    category: 'founder',
    preview: '• Apple requires a privacy policy URL before App Store approval — no exceptions\n• Must disclose what data you collect, how you store it, and who you share it with\n• If you use analytics (PostHog, Mixpanel) or auth (Firebase), those third parties must be listed\n• GDPR applies to any EU user regardless of where your company is incorporated\n• Use iubenda, Termly, or Commonpaper to generate compliant docs in minutes — don\'t write from scratch',
    concepts: [
      'Apple requires a privacy policy URL in App Store Connect before your app can be submitted — a broken or missing URL is an immediate rejection',
      'Your privacy policy must disclose: what data you collect (email, device info, usage data), how you use it, how long you retain it, and with whom you share it',
      'Every third-party SDK you integrate (Firebase, PostHog, RevenueCat, Sentry) must be listed in your privacy policy as a "data processor"',
      'GDPR applies to any user in the EU regardless of where your business is — if you accept EU users, you need a GDPR-compliant policy and must honor data deletion requests',
      'CCPA (California) applies if you have California users and collect personal data — you must provide a "Do Not Sell My Personal Information" option',
      'iubenda, Termly, and Commonpaper generate compliant privacy policies for ~$30/year and update them when laws change — writing your own from scratch is a false economy',
    ],
    actions: [
      'Generate a privacy policy at iubenda.com or termly.io before submitting to App Store',
      'Host the policy at yourdomain.com/privacy — not a Google Doc, which can be deleted or changed',
      'Add every third-party SDK to the policy: PostHog (analytics), RevenueCat (payments), Sentry (crash reporting), Expo (push notifications)',
      'Add your privacy policy URL to App Store Connect → App Information → Privacy Policy URL field',
      'Add a DELETE ACCOUNT option in your app settings — Apple requires it for apps that allow account creation',
      'Set up a hello@yourdomain.com inbox and add it to the policy for data requests',
    ],
    quotes: [
      '"You don\'t need a lawyer to get a privacy policy. You need one to get it right after you\'ve been sued."',
      '"Delete account is not optional since 2023. Apple will reject without it."',
    ],
    transcript: '',
  },
  {
    id: 'seed-cold-email',
    title: 'The cold email framework that gets 40%+ open rates from founders and PMs',
    sourceUrl: '',
    sourceType: 'video',
    creator: '@alexhormozi',
    platform: 'Paste',
    date: d(3),
    stars: 0, starred: false, isPublic: false, pushed: false, pinned: false,
    category: 'marketing',
    preview: '• Subject line must be 4 words or fewer — any longer and it reads like a newsletter\n• Personalize the first sentence with a specific observation about them, not a compliment\n• Ask for something tiny: a 15-min call, one question answered — never pitch in the first email\n• Follow up 3x over 10 days — most replies come from the 2nd or 3rd message\n• Send from a personal Gmail or domain email, never a tool like Mailchimp — it triggers spam filters',
    concepts: [
      'Subject lines under 4 words get 2x the open rate — "Quick question", "Saw your post", "Intro?" all outperform anything that reads like a marketing email',
      'Personalization is the difference between a cold email and a spam email — reference something specific: a post they wrote, a feature you noticed, a problem they publicly mentioned',
      'The goal of a cold email is a reply, not a sale — ask for something with zero commitment: one question, a 15-minute call, a reaction to an idea',
      '80% of replies to cold outreach come from the 2nd or 3rd follow-up — people who don\'t respond aren\'t saying no, they\'re busy and forgot',
      'Sending cold email from a personal address (you@yourdomain.com or gmail) dramatically outperforms marketing tools because it passes spam filters and feels human',
    ],
    actions: [
      'Write your subject line last — aim for 2-4 words, no exclamation marks, no question marks',
      'Start the email body with one specific sentence about them: "Saw your post about [X] — interesting point on [Y]"',
      'Keep the email under 5 sentences — if it\'s longer, it\'ll be skimmed and forgotten',
      'Ask for one small thing in the last sentence: "Would a 15-min call next week work?"',
      'Follow up at day 3, day 7, and day 10 with a one-liner: "Just bumping this in case it got buried"',
      'Track open rates with a tool like Streak or Superhuman — if under 30%, fix the subject line; if under 5% reply rate, fix the body',
    ],
    quotes: [
      '"Cold email is not spam. Spam is irrelevant. Cold email is relevant — just to a stranger. Make it relevant."',
      '"The follow-up is where the money is. Most people send one email, feel rejected, and quit. Send three."',
    ],
    transcript: '',
  },
  {
    id: 'seed-supabase-auth',
    title: 'Supabase Auth in React Native: email + Google OAuth setup from scratch',
    sourceUrl: '',
    sourceType: 'video',
    creator: '@supabase',
    platform: 'Paste',
    date: d(3),
    stars: 0, starred: false, isPublic: false, pushed: false, pinned: false,
    category: 'technical',
    preview: '• supabase-js v2 works in React Native with AsyncStorage as the session store\n• signInWithOAuth triggers a browser — you must handle the deep link redirect back to your app\n• Row Level Security (RLS) must be enabled on every table or any user can read all data\n• The anon key is public and safe to commit — the service_role key is a root credential, never expose it\n• supabase.auth.getSession() on startup restores the user session from AsyncStorage automatically',
    concepts: [
      'supabase-js works in React Native but requires AsyncStorage as the session storage adapter — without it, sessions are lost on app restart',
      'Row Level Security is off by default — every table you create in Supabase is readable and writable by anyone with your anon key until you add RLS policies',
      'OAuth in React Native requires a redirect URI (your app\'s deep link) — configure it in Supabase Auth settings and in your app.json scheme',
      'The anon (public) key is meant to be in your client code — it\'s restricted by RLS; the service_role key bypasses RLS and should never leave your server',
      'supabase.auth.onAuthStateChange() fires on login, logout, and token refresh — use this as your single source of truth for auth state, not manual session checks',
    ],
    actions: [
      'Install: expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill',
      'Initialize: createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true } })',
      'Enable RLS on every new table: in Supabase dashboard → Table → RLS → Enable, then add policies',
      'Add your app scheme to Supabase Auth → URL Configuration → Redirect URLs: exp://localhost/--/callback and yourapp://callback',
      'Listen for auth changes: supabase.auth.onAuthStateChange((event, session) => { if (session) setUser(session.user) })',
      'Never expose service_role key in app code — use it only in backend/serverless functions',
    ],
    quotes: [
      '"Enabling RLS and forgetting to add policies is worse than not enabling it — you lock everyone including yourself out. Always add at least one policy."',
    ],
    transcript: '',
  },
]
