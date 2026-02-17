export interface ContentSection {
    title: string;
    content: string;
}

export interface HomeContent {
    title: string;
    subtitle: string;
    paragraphs: string[];
}

const hi = {
    // Common
    app_name: 'श्री जी',
    ok: 'ठीक है',
    cancel: 'रद्द करें',
    error: 'त्रुटि',

    // Sidebar
    sidebar_home: 'होम',
    sidebar_naam_jap: 'नाम जप Counter',
    sidebar_daily_quote: 'आज का विचार',
    sidebar_theme: 'थीम बदलें',
    sidebar_language: 'भाषा बदलें',
    sidebar_share: 'ऐप शेयर करें',
    sidebar_privacy: 'गोपनीयता नीति',
    sidebar_terms: 'नियम और शर्तें',

    // Theme settings
    theme_header: 'थीम बदलें',
    theme_changed: 'थीम बदली गई',
    theme_changed_msg: 'नई थीम सफलतापूर्वक लागू हो गई है।',
    theme_error_msg: 'थीम बदलने में समस्या हुई। कृपया पुनः प्रयास करें।',
    theme_yellow: 'सुनहरा पीला (डिफ़ॉल्ट)',
    theme_saffron: 'केसरिया',
    theme_lotus: 'कमल गुलाबी',
    theme_peacock: 'मोर नीला',
    theme_tulsi: 'तुलसी हरा',
    theme_sandal: 'चंदन',

    // Language settings
    lang_header: 'भाषा बदलें',
    lang_hindi: 'हिन्दी',
    lang_english: 'English',
    lang_changed: 'भाषा बदली गई',
    lang_changed_msg: 'नई भाषा सफलतापूर्वक लागू हो गई है।',
    lang_error_msg: 'भाषा बदलने में समस्या हुई। कृपया पुनः प्रयास करें।',
    lang_picker_title: 'भाषा चुनें',
    lang_picker_subtitle: 'कृपया अपनी पसंदीदा भाषा चुनें',
    lang_continue: 'जारी रखें',

    // Daily Quote
    daily_quote_header: 'आज का विचार',
    daily_quote_today: 'आज का सुविचार',
    daily_quote_share: 'यह विचार शेयर करें',
    daily_quote_share_via: 'श्री जी ऐप से',
    daily_quote_share_failed: 'शेयर करने में समस्या हुई। कृपया पुनः प्रयास करें।',

    // Naam Jap Counter
    naam_jap_header: 'नाम जप Counter',
    naam_jap_today_mala: 'आज की माला गणना',
    naam_jap_my_rank: 'इस सप्ताह मेरी रैंक',

    // Naam Jap User Info Modal
    naam_jap_info_title: 'अपनी जानकारी भरें',
    naam_jap_info_subtitle: 'Top 100 users में अपना नाम देखने के लिए नाम और शहर भरें',
    naam_jap_name_label: 'नाम',
    naam_jap_name_placeholder: 'अपना नाम लिखें',
    naam_jap_city_label: 'शहर',
    naam_jap_city_placeholder: 'अपना शहर लिखें',
    naam_jap_save: 'सेव करें',
    naam_jap_info_required: 'आवश्यक',
    naam_jap_name_required: 'कृपया अपना नाम दर्ज करें',
    naam_jap_city_required: 'कृपया अपना शहर दर्ज करें',
    naam_jap_save_error: 'जानकारी सेव करने में समस्या हुई।',

    // Settings sheet
    settings_vibration: 'कंपन / हैप्टिक्स',
    settings_reset_current: 'वर्तमान माला रीसेट करें',
    settings_reset_current_sub: 'वर्तमान 108 गणना रीसेट करें',
    settings_reset_all: 'आज की सभी माला रीसेट करें',
    settings_reset_all_sub: 'गणना और माला 0 पर रीसेट करें',
    settings_auto_change_image: 'क्लिक पर छवि बदलें',
    settings_auto_change_image_sub: 'हर क्लिक पर छवि स्वतः बदलें',

    // Menu dropdown
    menu_pick_image: 'छवि चुनें',
    menu_analytics: 'विश्लेषण',
    menu_settings: 'सेटिंग्स',

    // Pick image sheet
    pick_image_header: 'एक छवि चुनें',
    pick_image_upload: 'गैलरी से छवि अपलोड करें',
    pick_image_my_uploads: 'मेरी अपलोड की गई छवियाँ',
    pick_image_presets: 'पहले से उपलब्ध छवियाँ',
    pick_image_delete: 'हटाएं',
    pick_image_no_uploads: 'अभी तक कोई छवि अपलोड नहीं की गई',

    // Analytics
    analytics_header: 'विश्लेषण',
    analytics_my_rank: 'इस सप्ताह मेरी रैंक',
    analytics_worldwide: 'विश्वव्यापी जप ट्रैकर',
    analytics_all_time_users: 'कुल उपयोगकर्ता',
    analytics_all_time_malas: 'कुल माला',
    analytics_users_week: 'इस सप्ताह उपयोगकर्ता',
    analytics_malas_week: 'इस सप्ताह माला',
    analytics_users_month: 'इस माह उपयोगकर्ता',
    analytics_malas_month: 'इस माह माला',
    analytics_top_200: 'इस सप्ताह शीर्ष 200 उपयोगकर्ता',
    analytics_user: 'उपयोगकर्ता',
    analytics_location: 'स्थान',
    analytics_malas: 'माला',
    analytics_view_more: 'और देखें',
    analytics_passbook: 'मेरी नाम जप पासबुक',
    analytics_highest_mala: 'एक दिन में मेरी सर्वाधिक माला',
    analytics_daily: 'दैनिक',
    analytics_weekly: 'साप्ताहिक',
    analytics_monthly: 'मासिक',
    analytics_mala_unit: 'माला',
    analytics_last_updated: 'अंतिम अपडेट',
    analytics_disclaimer: '**यदि आप ऐप को अनइंस्टॉल करते हैं या ऐप डेटा क्लियर/डिलीट करते हैं, तो आपकी माला संख्या का डेटा डिलीट हो जाएगा।',

    // Share app
    share_header: 'ऐप शेयर करें',
    share_tagline: 'जय श्री राधे 🙏',
    share_description: 'अपने प्रियजनों के साथ श्री जी ऐप शेयर करें और उन्हें भी नाम जप और आध्यात्मिक यात्रा में जोड़ें।',
    share_button: 'शेयर करें',
    share_copy_link: 'लिंक कॉपी करें',
    share_message: '🙏 श्री जी ऐप डाउनलोड करें!\n\nनाम जप काउंटर, आध्यात्मिक सामग्री और बहुत कुछ।\n\nजय श्री राधे! 🙏\n\nhttps://shreejii.app',
    share_failed_title: 'शेयर विफल',
    share_failed_msg: 'ऐप शेयर करने में समस्या हुई। कृपया पुनः प्रयास करें।',
    share_link_copied: 'लिंक कॉपी हो गया',
    share_link_copied_msg: 'ऐप का लिंक क्लिपबोर्ड पर कॉपी हो गया है।',
    share_copy_failed_title: 'कॉपी विफल',
    share_copy_failed_msg: 'लिंक कॉपी करने में समस्या हुई।',

    // Privacy Policy
    privacy_header: 'गोपनीयता नीति',
    privacy_last_updated: 'अंतिम अपडेट: फरवरी 2026',

    // Terms
    terms_header: 'नियम और शर्तें',
    terms_last_updated: 'अंतिम अपडेट: फरवरी 2026',

    // Step Tracker
    sidebar_step_tracker: 'स्टेप ट्रैकर',
    step_tracker_header: 'स्टेप ट्रैकर',
    step_tracker_steps: 'कदम',
    step_tracker_daily_goal: 'आज का लक्ष्य',
    step_tracker_completed: 'पूर्ण',
    step_tracker_not_available: 'इस डिवाइस पर पेडोमीटर उपलब्ध नहीं है। कदम मैन्युअल रूप से ट्रैक नहीं हो पाएंगे।',

    // Logout
    sidebar_logout: 'लॉगआउट',
    logout_confirm_title: 'लॉगआउट',
    logout_confirm_msg: 'क्या आप लॉगआउट करना चाहते हैं?',
    logout_success: 'सफलतापूर्वक लॉगआउट हो गया',
};

const en: typeof hi = {
    // Common
    app_name: 'Shree Ji',
    ok: 'OK',
    cancel: 'Cancel',
    error: 'Error',

    // Sidebar
    sidebar_home: 'Home',
    sidebar_naam_jap: 'Naam Jap Counter',
    sidebar_daily_quote: 'Daily Quote',
    sidebar_theme: 'Change Theme',
    sidebar_language: 'Change Language',
    sidebar_share: 'Share App',
    sidebar_privacy: 'Privacy Policy',
    sidebar_terms: 'Terms & Conditions',

    // Theme settings
    theme_header: 'Change Theme',
    theme_changed: 'Theme Changed',
    theme_changed_msg: 'New theme has been applied successfully.',
    theme_error_msg: 'Failed to change theme. Please try again.',
    theme_yellow: 'Golden Yellow (Default)',
    theme_saffron: 'Saffron Orange',
    theme_lotus: 'Lotus Pink',
    theme_peacock: 'Peacock Blue',
    theme_tulsi: 'Tulsi Green',
    theme_sandal: 'Sandalwood',

    // Language settings
    lang_header: 'Change Language',
    lang_hindi: 'हिन्दी',
    lang_english: 'English',
    lang_changed: 'Language Changed',
    lang_changed_msg: 'New language has been applied successfully.',
    lang_error_msg: 'Failed to change language. Please try again.',
    lang_picker_title: 'Choose Language',
    lang_picker_subtitle: 'Please select your preferred language',
    lang_continue: 'Continue',

    // Daily Quote
    daily_quote_header: 'Daily Quote',
    daily_quote_today: "Today's Quote",
    daily_quote_share: 'Share this Quote',
    daily_quote_share_via: 'via Shree Ji App',
    daily_quote_share_failed: 'Failed to share. Please try again.',

    // Naam Jap Counter
    naam_jap_header: 'Naam Jap Counter',
    naam_jap_today_mala: "Today's Mala Count",
    naam_jap_my_rank: 'My Rank this Week',

    // Naam Jap User Info Modal
    naam_jap_info_title: 'Enter Your Details',
    naam_jap_info_subtitle: 'Fill your name and city to see your name in Top 100 users',
    naam_jap_name_label: 'Name',
    naam_jap_name_placeholder: 'Enter your name',
    naam_jap_city_label: 'City',
    naam_jap_city_placeholder: 'Enter your city',
    naam_jap_save: 'Save',
    naam_jap_info_required: 'Required',
    naam_jap_name_required: 'Please enter your name',
    naam_jap_city_required: 'Please enter your city',
    naam_jap_save_error: 'Failed to save information.',

    // Settings sheet
    settings_vibration: 'Vibration / Haptics',
    settings_reset_current: 'Reset Current Mala',
    settings_reset_current_sub: 'Reset the current 108 count',
    settings_reset_all: 'Reset All Malas Done Today',
    settings_reset_all_sub: 'Reset count and malas to 0',
    settings_auto_change_image: 'Change Image on Click',
    settings_auto_change_image_sub: 'Auto-change image on every tap',

    // Menu dropdown
    menu_pick_image: 'Pick Image',
    menu_analytics: 'Analytics',
    menu_settings: 'Settings',

    // Pick image sheet
    pick_image_header: 'Select an Image',
    pick_image_upload: 'Upload from Gallery',
    pick_image_my_uploads: 'My Uploaded Images',
    pick_image_presets: 'Preset Images',
    pick_image_delete: 'Delete',
    pick_image_no_uploads: 'No images uploaded yet',

    // Analytics
    analytics_header: 'Analytics',
    analytics_my_rank: 'My Rank this Week',
    analytics_worldwide: 'Worldwide Japa Tracker',
    analytics_all_time_users: 'All-Time Users',
    analytics_all_time_malas: 'All-Time Malas',
    analytics_users_week: 'Users This Week',
    analytics_malas_week: 'Malas This Week',
    analytics_users_month: 'Users This Month',
    analytics_malas_month: 'Malas This Month',
    analytics_top_200: 'Top 200 Users This Week',
    analytics_user: 'User',
    analytics_location: 'Location',
    analytics_malas: 'Malas',
    analytics_view_more: 'View More',
    analytics_passbook: 'My Naam Jap Passbook',
    analytics_highest_mala: 'My Highest Mala Count In A Day',
    analytics_daily: 'Daily',
    analytics_weekly: 'Weekly',
    analytics_monthly: 'Monthly',
    analytics_mala_unit: 'mala',
    analytics_last_updated: 'Last updated',
    analytics_disclaimer: '**Your mala count data will be deleted if you uninstall the app or clear app data.',

    // Share app
    share_header: 'Share App',
    share_tagline: 'Jai Shri Radhe 🙏',
    share_description: 'Share the Shree Ji app with your loved ones and invite them to join the spiritual journey of Naam Jap.',
    share_button: 'Share',
    share_copy_link: 'Copy Link',
    share_message: '🙏 Download Shree Ji App!\n\nNaam Jap Counter, spiritual content and much more.\n\nJai Shri Radhe! 🙏\n\nhttps://shreejii.app',
    share_failed_title: 'Share Failed',
    share_failed_msg: 'Failed to share the app. Please try again.',
    share_link_copied: 'Link Copied',
    share_link_copied_msg: 'App link has been copied to clipboard.',
    share_copy_failed_title: 'Copy Failed',
    share_copy_failed_msg: 'Failed to copy the link.',

    // Privacy Policy
    privacy_header: 'Privacy Policy',
    privacy_last_updated: 'Last updated: February 2026',

    // Terms
    terms_header: 'Terms & Conditions',
    terms_last_updated: 'Last updated: February 2026',

    // Step Tracker
    sidebar_step_tracker: 'Step Tracker',
    step_tracker_header: 'Step Tracker',
    step_tracker_steps: 'steps',
    step_tracker_daily_goal: 'Daily Goal',
    step_tracker_completed: 'completed',
    step_tracker_not_available: 'Pedometer is not available on this device. Steps cannot be tracked automatically.',

    // Logout
    sidebar_logout: 'Logout',
    logout_confirm_title: 'Logout',
    logout_confirm_msg: 'Are you sure you want to logout?',
    logout_success: 'Logged out successfully',
};

export type TranslationKeys = keyof typeof hi;

export const translations = { hi, en };

// Privacy Policy Sections
export const privacySections: Record<string, ContentSection[]> = {
    hi: [
        { title: '1. परिचय', content: 'श्री जी ऐप ("ऐप") आपकी गोपनीयता का सम्मान करता है। यह गोपनीयता नीति बताती है कि हम आपकी व्यक्तिगत जानकारी कैसे एकत्र, उपयोग, संग्रहित और सुरक्षित करते हैं। इस ऐप का उपयोग करके, आप इस नीति से सहमत होते हैं।' },
        { title: '2. एकत्रित जानकारी', content: 'हम निम्नलिखित जानकारी एकत्र कर सकते हैं:\n\n• नाम और ईमेल पता (ऑनबोर्डिंग के दौरान)\n• डिवाइस की जानकारी (ऑपरेटिंग सिस्टम, डिवाइस मॉडल)\n• ऐप उपयोग डेटा (नाम जप काउंटर, माला गणना)\n• स्थान डेटा (केवल आपकी अनुमति से)\n\nहम कोई भी संवेदनशील वित्तीय या स्वास्थ्य डेटा एकत्र नहीं करते।' },
        { title: '3. जानकारी का उपयोग', content: 'आपकी जानकारी का उपयोग:\n\n• ऐप अनुभव को व्यक्तिगत बनाने के लिए\n• ऐप की कार्यक्षमता सुधारने के लिए\n• तकनीकी सहायता प्रदान करने के लिए\n• ऐप के प्रदर्शन का विश्लेषण करने के लिए\n\nहम आपकी जानकारी किसी तीसरे पक्ष को नहीं बेचते।' },
        { title: '4. डेटा संग्रहण', content: 'आपका डेटा आपके डिवाइस पर स्थानीय रूप से संग्रहित किया जाता है। हम उद्योग-मानक सुरक्षा उपायों का उपयोग करते हैं। डेटा को एन्क्रिप्टेड स्टोरेज में रखा जाता है।' },
        { title: '5. तृतीय पक्ष सेवाएं', content: 'ऐप निम्नलिखित तृतीय पक्ष सेवाओं का उपयोग कर सकता है:\n\n• Expo (ऐप विकास और अपडेट)\n• AsyncStorage (स्थानीय डेटा संग्रहण)\n\nइन सेवाओं की अपनी गोपनीयता नीतियां हैं।' },
        { title: '6. आपके अधिकार', content: 'आपको निम्नलिखित अधिकार हैं:\n\n• अपनी जानकारी देखने का अधिकार\n• अपनी जानकारी सुधारने का अधिकार\n• अपनी जानकारी हटाने का अधिकार\n• डेटा संग्रहण से ऑप्ट-आउट करने का अधिकार\n\nऐप को अनइंस्टॉल करने से सभी स्थानीय डेटा हटा दिया जाएगा।' },
        { title: '7. बच्चों की गोपनीयता', content: 'यह ऐप 13 वर्ष से कम उम्र के बच्चों से जानबूझकर जानकारी एकत्र नहीं करता। यदि आपको लगता है कि किसी बच्चे ने हमें जानकारी प्रदान की है, तो कृपया हमसे संपर्क करें।' },
        { title: '8. नीति में परिवर्तन', content: 'हम समय-समय पर इस गोपनीयता नीति को अपडेट कर सकते हैं। किसी भी परिवर्तन को ऐप के माध्यम से सूचित किया जाएगा। इस नीति का अंतिम अपडेट: फरवरी 2026।' },
        { title: '9. संपर्क', content: 'गोपनीयता संबंधी किसी भी प्रश्न के लिए, कृपया हमसे ऐप के माध्यम से संपर्क करें।' },
    ],
    en: [
        { title: '1. Introduction', content: 'The Shree Ji app ("App") respects your privacy. This privacy policy explains how we collect, use, store, and protect your personal information. By using this App, you agree to this policy.' },
        { title: '2. Information Collected', content: 'We may collect the following information:\n\n• Name and email address (during onboarding)\n• Device information (operating system, device model)\n• App usage data (Naam Jap counter, Mala count)\n• Location data (only with your permission)\n\nWe do not collect any sensitive financial or health data.' },
        { title: '3. Use of Information', content: 'Your information is used to:\n\n• Personalize the app experience\n• Improve app functionality\n• Provide technical support\n• Analyze app performance\n\nWe do not sell your information to any third party.' },
        { title: '4. Data Storage', content: 'Your data is stored locally on your device. We use industry-standard security measures. Data is kept in encrypted storage.' },
        { title: '5. Third Party Services', content: 'The App may use the following third-party services:\n\n• Expo (app development and updates)\n• AsyncStorage (local data storage)\n\nThese services have their own privacy policies.' },
        { title: '6. Your Rights', content: 'You have the following rights:\n\n• Right to view your information\n• Right to correct your information\n• Right to delete your information\n• Right to opt-out of data collection\n\nUninstalling the app will delete all local data.' },
        { title: '7. Children\'s Privacy', content: 'This App does not knowingly collect information from children under the age of 13. If you believe a child has provided us with information, please contact us.' },
        { title: '8. Changes to Policy', content: 'We may update this privacy policy from time to time. Any changes will be communicated through the App. Last update of this policy: February 2026.' },
        { title: '9. Contact', content: 'For any privacy-related questions, please contact us through the App.' },
    ],
};

// Terms & Conditions Sections
export const termsSections: Record<string, ContentSection[]> = {
    hi: [
        { title: '1. स्वीकृति', content: 'श्री जी ऐप ("ऐप") को डाउनलोड, इंस्टॉल या उपयोग करके, आप इन नियमों और शर्तों से बाध्य होने के लिए सहमत होते हैं। यदि आप इन शर्तों से सहमत नहीं हैं, तो कृपया ऐप का उपयोग न करें।' },
        { title: '2. सेवा का विवरण', content: 'श्री जी एक आध्यात्मिक ऐप है जो निम्नलिखित सेवाएं प्रदान करती है:\n\n• नाम जप काउंटर (माला गणना)\n• आध्यात्मिक सामग्री (हिंदी और अंग्रेजी में)\n• दैनिक साधना ट्रैकिंग\n• व्यक्तिगत थीम और सेटिंग्स' },
        { title: '3. उपयोगकर्ता की जिम्मेदारियां', content: 'उपयोगकर्ता के रूप में, आप सहमत हैं कि:\n\n• आप सटीक जानकारी प्रदान करेंगे\n• आप ऐप का दुरुपयोग नहीं करेंगे\n• आप ऐप की सामग्री को बिना अनुमति कॉपी या वितरित नहीं करेंगे\n• आप ऐप का उपयोग केवल वैध उद्देश्यों के लिए करेंगे' },
        { title: '4. बौद्धिक संपदा', content: 'ऐप में सभी सामग्री, डिज़ाइन, लोगो, ग्राफिक्स और टेक्स्ट श्री जी की संपत्ति है और कॉपीराइट कानूनों द्वारा संरक्षित है। बिना पूर्व लिखित अनुमति के किसी भी सामग्री का पुनरुत्पादन वर्जित है।' },
        { title: '5. सामग्री अस्वीकरण', content: 'ऐप में प्रदान की गई आध्यात्मिक सामग्री केवल शैक्षिक और भक्ति उद्देश्यों के लिए है। हम सामग्री की सटीकता या पूर्णता की गारंटी नहीं देते। उपयोगकर्ताओं को अपने विवेक का उपयोग करना चाहिए।' },
        { title: '6. सेवा की उपलब्धता', content: 'हम ऐप को निरंतर उपलब्ध रखने का प्रयास करते हैं, लेकिन:\n\n• तकनीकी समस्याओं के कारण सेवा बाधित हो सकती है\n• हम बिना सूचना के ऐप को अपडेट या संशोधित कर सकते हैं\n• हम किसी भी समय सेवा बंद करने का अधिकार सुरक्षित रखते हैं' },
        { title: '7. दायित्व की सीमा', content: 'श्री जी ऐप किसी भी प्रत्यक्ष, अप्रत्यक्ष, आकस्मिक या परिणामी क्षति के लिए उत्तरदायी नहीं होगा जो ऐप के उपयोग या उपयोग करने में असमर्थता से उत्पन्न होती है।' },
        { title: '8. शर्तों में परिवर्तन', content: 'हम किसी भी समय इन शर्तों को संशोधित करने का अधिकार सुरक्षित रखते हैं। परिवर्तन ऐप में प्रकाशित होने पर तुरंत प्रभावी होंगे। निरंतर उपयोग का अर्थ है कि आप संशोधित शर्तों से सहमत हैं।' },
        { title: '9. शासी कानून', content: 'ये नियम और शर्तें भारत के कानूनों के अनुसार शासित और व्याख्यायित होंगी। किसी भी विवाद को भारतीय न्यायालयों के अधिकार क्षेत्र में निपटाया जाएगा।' },
        { title: '10. संपर्क', content: 'इन शर्तों के बारे में किसी भी प्रश्न के लिए, कृपया हमसे ऐप के माध्यम से संपर्क करें।' },
    ],
    en: [
        { title: '1. Acceptance', content: 'By downloading, installing, or using the Shree Ji app ("App"), you agree to be bound by these terms and conditions. If you do not agree to these terms, please do not use the App.' },
        { title: '2. Service Description', content: 'Shree Ji is a spiritual app that provides the following services:\n\n• Naam Jap Counter (Mala counting)\n• Spiritual content (in Hindi and English)\n• Daily Sadhana tracking\n• Personal themes and settings' },
        { title: '3. User Responsibilities', content: 'As a user, you agree that:\n\n• You will provide accurate information\n• You will not misuse the App\n• You will not copy or distribute App content without permission\n• You will use the App only for lawful purposes' },
        { title: '4. Intellectual Property', content: 'All content, designs, logos, graphics, and text in the App are the property of Shree Ji and are protected by copyright laws. Reproduction of any content without prior written permission is prohibited.' },
        { title: '5. Content Disclaimer', content: 'The spiritual content provided in the App is for educational and devotional purposes only. We do not guarantee the accuracy or completeness of the content. Users should use their own discretion.' },
        { title: '6. Service Availability', content: 'We strive to keep the App continuously available, but:\n\n• Service may be interrupted due to technical issues\n• We may update or modify the App without notice\n• We reserve the right to discontinue the service at any time' },
        { title: '7. Limitation of Liability', content: 'The Shree Ji App shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use the App.' },
        { title: '8. Changes to Terms', content: 'We reserve the right to modify these terms at any time. Changes will be effective immediately upon publication in the App. Continued use means you agree to the revised terms.' },
        { title: '9. Governing Law', content: 'These terms and conditions shall be governed and construed in accordance with the laws of India. Any disputes shall be settled under the jurisdiction of Indian courts.' },
        { title: '10. Contact', content: 'For any questions about these terms, please contact us through the App.' },
    ],
};

// Home Content
export const homeContent: Record<string, HomeContent> = {
    hi: {
        title: 'भगवद् प्राप्ति दुर्लभ नहीं, दुर्लभ है भगवद् प्राप्त महापुरुषों का मिलना',
        subtitle: '(पूज्य श्री हित प्रेमानन्द गोविन्द शरण जी महाराज)',
        paragraphs: [
            'श्री धाम वृंदावन में विराजमान श्रीश्यामा-श्याम के नाम, रूप, लीला, धाम निष्ठ रसिक संत श्री हित प्रेमानन्द गोविन्द शरण जी महाराज अध्यात्म जगत् की एक विशिष्टतम विभूति हैं। वह निरन्तर अपने सत्संग व सद्विचारों के द्वारा परमार्थ पथ की ओर अगसर साधकों का मार्गदर्शन कर रहे हैं एवं व्यवहार-प्रपंच, विषय-भोगों में फंसे लोगों में आध्यात्मिक चेतना का संचार कर रहे हैं।',
            'पूज्य महाराज जी भगवत् साक्षात्कार की प्रबल लालसा लेकर 13 वर्ष की अल्पायु में ही गृहत्याग कर साधन पथ पर चल पड़े थे तथा उन्होंने सन्यास लेकर अपना अधिकांश जीवन ब्रह्मबोध प्राप्ति की इच्छा से उत्कट वैराग्य पूर्वक गंगा किनारे व्यतीत किया। कालान्तर में काशी में आयोजित श्रीयुगल सरकार श्यामा-श्याम की रासलीला से आकर्षित होकर विश्वनाथ भगवान् की प्रेरणा से वे काशी से वृंदावन आये और विगत कई वर्षों से धाम निष्ठा के साथ श्रीहित हरिवंश महाप्रभु द्वारा प्रकट प्रिया-प्रियतम की रसोपासना में निमग्न हैं।',
            'महाराज श्री को अपना भारत देश बहुत प्रिय है और उनका एकमात्र लक्ष्य यही है कि हमारे देशवासी अशान्ति, दु:ख, कलेश और भय प्रदान करने वाले असत् आचरणों (जुआ, मांस-मदिरा, हिंसा, व्यभिचार आदि) का त्याग कर, अपने कर्तव्य कर्मों का दृढ़तापूर्वक भगवद् समर्पित करते हुए पालन करें एवं इस संसार में भी सुख-शान्तिमय जीवन व्यतीत कर मानव जीवन के चरम लक्ष्य भवबंधन से मुक्ति अर्थात् भगवान् की प्राप्ति करें।',
            'महाराज जी भगवद् प्राप्ति करने के लिए सभी को समान रूप से पात्र मानते हैं। उनका कहना है कि हम सभी भगवान् के अंश हैं और प्रभु की प्राप्ति करने में समानाधिकार रखते हैं अर्थात् प्रभु के प्रेम की प्राप्ति या भगवद् प्राप्ति में किसी प्रकार का भेदभाव नहीं है।',
            'महाराज श्री समस्त शास्त्रों, सिद्धान्तों व उपदेशों का सार यही बताते हैं कि भगवद् आश्रित होकर निरन्तर भगवान् के नाम का जप करते रहो, मंगलमय प्रभु के प्रत्येक विधान में संतुष्ट रहो, गन्दे आचरणों का त्याग करो एवं भगवद् भाव से सबकी सेवा करो।',
        ],
    },
    en: {
        title: 'It is not difficult to attain God, but it is rare to meet God-realized saints',
        subtitle: '(Pujya Shri Hit Premanand Govind Sharan Ji Maharaj)',
        paragraphs: [
            'Shri Hit Premanand Govind Sharan Ji Maharaj, residing in the sacred land of Vrindavan, is one of the most distinguished spiritual luminaries of the spiritual world. He is a devotee immersed in the name, form, pastimes, and divine abode of Shri Shyama-Shyam.',
            'Pujya Maharaj Ji left home at the tender age of 13 with an intense desire for divine realization and took sanyas, spending most of his life in intense renunciation along the banks of the Ganga. Later, attracted by the Raslila of Shri Yugal Sarkar Shyama-Shyam organized in Kashi, and inspired by Lord Vishwanath, he came from Kashi to Vrindavan.',
            'Maharaj Shri loves his country India dearly, and his sole aim is that our countrymen should give up sinful activities and surrender their duties to the Lord, living a peaceful and happy life while attaining the ultimate goal of liberation from worldly bondage.',
            'Maharaj Ji considers everyone equally eligible for attaining God. He says that we are all parts of the Lord and have equal rights in attaining His love and grace, without any discrimination.',
            'Maharaj Shri explains the essence of all scriptures: take shelter of the Lord, constantly chant His name, remain content in His divine will, give up impure conduct, and serve everyone with devotion.',
        ],
    },
};
