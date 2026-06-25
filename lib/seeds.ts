import type { Capture } from '../components/CaptureCard'

export const SEED_CAPTURES: Capture[] = [
  {
    id: 'seed-revenuecat-setup',
    title: 'How to integrate RevenueCat for iOS subscriptions in React Native',
    sourceUrl: 'https://www.revenuecat.com/docs/getting-started/installation/reactnative',
    sourceType: 'video',
    creator: '@revenuecat',
    platform: 'RevenueCat Docs',
    date: 'Jun 25',
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

Add to app.json plugins:
  "react-native-purchases"

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
    appUserID: userId ?? null, // pass your user's ID for cross-device sync
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
  // Each package has: package.product.identifier, package.localizedPriceString

RESTORE PURCHASES

  const restore = async () => {
    const customerInfo = await Purchases.restorePurchases()
    return !!customerInfo.entitlements.active['pro']
  }

CUSTOMER CENTER (support + refunds, no code needed on your end)

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
- Create a Subscription Group (e.g. "Grimoire Plans")
- Add products: grimoire_creator_monthly, grimoire_creator_annual, grimoire_pro_monthly, grimoire_pro_annual
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
    date: 'Jun 25',
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
]
