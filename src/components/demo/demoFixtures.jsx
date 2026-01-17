// DEMO MODE — 100% static fixtures (ZERO DB calls)

export const demoLove = {
  fr: {
    mode: "Amour",
    modeIcon: "Heart",
    profile: {
      name: "Marie, 28 ans",
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      bio: "Passionnée de yoga et de voyages spirituels 🌙",
      interests: ["Yoga", "Astrologie", "Voyages", "Méditation", "Art"]
    },
    guidance: {
      title: "Guidance du jour",
      card: "L'Impératrice",
      message: "Aujourd'hui, la carte de L'Impératrice vous invite à embrasser votre sensualité et votre créativité. C'est le moment idéal pour exprimer vos désirs avec authenticité.",
      action: "💡 Action conseillée: Envoyez une intention à quelqu'un qui vous inspire. Osez montrer votre vulnérabilité."
    },
    matches: [
      { name: "Thomas", age: 30, compatibility: 92, distance: "8 km", interests: ["Yoga", "Voyages"], status: "Nouveau" },
      { name: "Lucas", age: 29, compatibility: 88, distance: "12 km", interests: ["Astrologie", "Méditation"], status: "Nouveau" },
      { name: "Alexandre", age: 31, compatibility: 85, distance: "15 km", interests: ["Art", "Voyages"], status: "Nouveau" }
    ],
    messages: [
      { from: "Thomas", preview: "Ton profil m'a vraiment touché... J'aimerais en savoir plus sur tes voyages spirituels 🌸", time: "Il y a 2h", unread: true },
      { from: "Lucas", preview: "Salut Marie ! Quelle belle énergie sur tes photos. Tu pratiques le yoga depuis longtemps ?", time: "Hier", unread: false }
    ],
    benefits: [
      "Matching basé sur compatibilité astrale + numérologie + centres d'intérêt",
      "Tirage quotidien personnalisé pour guider vos intentions",
      "Astrologie: signe solaire + compatibilité (optionnel, scope privé par défaut)",
      "Numérologie: chemin de vie + compatibilité (optionnel, scope privé par défaut)",
      "Chat sécurisé avec validation mutuelle (zéro ghosting)",
      "Blocage instantané et signalement rapide",
      "20 profils compatibles par jour (pas de swipe infini)",
      "Guidance pour oser la vulnérabilité authentique"
    ]
  },
  en: {
    mode: "Love",
    modeIcon: "Heart",
    profile: {
      name: "Marie, 28",
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      bio: "Yoga enthusiast & spiritual traveler 🌙",
      interests: ["Yoga", "Astrology", "Travel", "Meditation", "Art"]
    },
    guidance: {
      title: "Today's Guidance",
      card: "The Empress",
      message: "Today, The Empress card invites you to embrace your sensuality and creativity. It's the perfect time to express your desires with authenticity.",
      action: "💡 Suggested action: Send an intention to someone who inspires you. Dare to show your vulnerability."
    },
    matches: [
      { name: "Thomas", age: 30, compatibility: 92, distance: "5 mi", interests: ["Yoga", "Travel"], status: "New" },
      { name: "Lucas", age: 29, compatibility: 88, distance: "7.5 mi", interests: ["Astrology", "Meditation"], status: "New" },
      { name: "Alexandre", age: 31, compatibility: 85, distance: "9 mi", interests: ["Art", "Travel"], status: "New" }
    ],
    messages: [
      { from: "Thomas", preview: "Your profile really touched me... I'd love to know more about your spiritual travels 🌸", time: "2h ago", unread: true },
      { from: "Lucas", preview: "Hi Marie! Such beautiful energy in your photos. Have you been practicing yoga long?", time: "Yesterday", unread: false }
    ],
    benefits: [
      "Matching based on astral compatibility + numerology + shared interests",
      "Personalized daily reading to guide your intentions",
      "Astrology: sun sign + compatibility (optional, private scope by default)",
      "Numerology: life path + compatibility (optional, private scope by default)",
      "Secure chat with mutual validation (zero ghosting)",
      "Instant blocking and quick reporting",
      "20 compatible profiles per day (no infinite swipe)",
      "Guidance to dare authentic vulnerability"
    ]
  }
};

export const demoFriend = {
  fr: {
    mode: "Amitié",
    modeIcon: "Users",
    profile: {
      name: "Sophie, 32 ans",
      photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
      bio: "Nouvelle en ville, en quête d'amitiés sincères 🌻",
      interests: ["Randonnée", "Lecture", "Cuisine", "Jeux de société", "Concerts"]
    },
    guidance: {
      title: "Guidance du jour",
      card: "Le Trois de Coupes",
      message: "Le Trois de Coupes annonce des célébrations et des connexions joyeuses. Aujourd'hui, sortez de votre zone de confort pour rencontrer de nouvelles personnes.",
      action: "💡 Action conseillée: Proposez une activité de groupe à vos nouvelles affinités (brunch, rando, visite musée)."
    },
    matches: [
      { name: "Claire", age: 30, compatibility: 94, distance: "6 km", interests: ["Randonnée", "Cuisine"], status: "En ligne" },
      { name: "Emma", age: 33, compatibility: 89, distance: "10 km", interests: ["Lecture", "Concerts"], status: "Nouveau" },
      { name: "Julie", age: 31, compatibility: 86, distance: "8 km", interests: ["Jeux de société", "Cuisine"], status: "Nouveau" }
    ],
    messages: [
      { from: "Claire", preview: "Hey Sophie ! J'organise une rando dimanche dans les Calanques, ça te dit ? On sera 4-5 😊", time: "Il y a 1h", unread: true },
      { from: "Emma", preview: "J'adore ta bio ! Je cherche aussi des amitiés authentiques. Tu as lu quoi récemment ?", time: "Hier", unread: false }
    ],
    benefits: [
      "Matching basé sur centres d'intérêt + synergies astro/num (optionnel) + proximité",
      "Guidance quotidienne pour oser sortir de l'isolement",
      "Suggestions d'activités de groupe (brunch, rando, ciné)",
      "Chat sécurisé pour organiser vos sorties",
      "Zéro pression romantique, juste de l'authenticité",
      "Passer de 'seul(e)' à 'cercle d'amis' durable"
    ]
  },
  en: {
    mode: "Friendship",
    modeIcon: "Users",
    profile: {
      name: "Sophie, 32",
      photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
      bio: "New in town, seeking genuine friendships 🌻",
      interests: ["Hiking", "Reading", "Cooking", "Board games", "Concerts"]
    },
    guidance: {
      title: "Today's Guidance",
      card: "Three of Cups",
      message: "The Three of Cups announces celebrations and joyful connections. Today, step out of your comfort zone to meet new people.",
      action: "💡 Suggested action: Propose a group activity to your new connections (brunch, hike, museum visit)."
    },
    matches: [
      { name: "Claire", age: 30, compatibility: 94, distance: "4 mi", interests: ["Hiking", "Cooking"], status: "Online" },
      { name: "Emma", age: 33, compatibility: 89, distance: "6 mi", interests: ["Reading", "Concerts"], status: "New" },
      { name: "Julie", age: 31, compatibility: 86, distance: "5 mi", interests: ["Board games", "Cooking"], status: "New" }
    ],
    messages: [
      { from: "Claire", preview: "Hey Sophie! I'm organizing a hike Sunday in the Calanques, interested? We'll be 4-5 😊", time: "1h ago", unread: true },
      { from: "Emma", preview: "Love your bio! I'm also looking for authentic friendships. What have you been reading lately?", time: "Yesterday", unread: false }
    ],
    benefits: [
      "Matching based on shared interests + astro/numerology synergies (optional) + proximity",
      "Daily guidance to dare stepping out of isolation",
      "Group activity suggestions (brunch, hike, movies)",
      "Secure chat to organize your outings",
      "Zero romantic pressure, just authenticity",
      "Go from 'alone' to 'lasting friend circle'"
    ]
  }
};

export const demoPro = {
  fr: {
    mode: "Professionnel",
    modeIcon: "Briefcase",
    profile: {
      name: "Marc, 35 ans",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
      bio: "CEO startup EdTech • Scaling • Recherche mentors & co-fondateurs",
      interests: ["SaaS", "Levée de fonds", "Growth", "AI", "Leadership"]
    },
    guidance: {
      title: "Guidance du jour",
      card: "Le Chariot",
      message: "Le Chariot symbolise la détermination et la victoire. Aujourd'hui, avancez avec confiance vers vos objectifs stratégiques. Ne perdez pas de temps en réseau passif.",
      action: "💡 Action conseillée: Envoyez 3 intentions ciblées à des profils clés (investisseurs, mentors, co-fondateurs potentiels)."
    },
    matches: [
      { name: "Isabelle D.", title: "Partner @ VC Fund", compatibility: 91, interests: ["EdTech", "Seed stage"], status: "Nouveau" },
      { name: "Pierre M.", title: "CTO • Ex-Google", compatibility: 88, interests: ["AI", "SaaS"], status: "Nouveau" },
      { name: "Caroline L.", title: "Serial entrepreneur", compatibility: 85, interests: ["Growth", "Scaling"], status: "Nouveau" }
    ],
    messages: [
      { from: "Isabelle D.", preview: "Bonjour Marc, votre projet EdTech m'intéresse. Seriez-vous disponible pour un call rapide cette semaine ?", time: "Il y a 3h", unread: true },
      { from: "Pierre M.", preview: "Salut Marc ! J'ai vu ton profil. Je cherche justement un projet EdTech à rejoindre en tant que CTO. On échange ?", time: "Hier", unread: false }
    ],
    benefits: [
      "Matching basé sur secteur d'activité + synergies astro/num (optionnel) + objectifs",
      "Guidance quotidienne pour passer à l'action (pas de procrastination)",
      "Accès à investisseurs, mentors, co-fondateurs",
      "Chat sécurisé pour qualifier rapidement les opportunités",
      "Relances automatiques pour maintenir le momentum",
      "Réseau qualitatif sans forcing ni pitch agressif"
    ]
  },
  en: {
    mode: "Professional",
    modeIcon: "Briefcase",
    profile: {
      name: "Marc, 35",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
      bio: "EdTech startup CEO • Scaling • Seeking mentors & co-founders",
      interests: ["SaaS", "Fundraising", "Growth", "AI", "Leadership"]
    },
    guidance: {
      title: "Today's Guidance",
      card: "The Chariot",
      message: "The Chariot symbolizes determination and victory. Today, move forward with confidence toward your strategic goals. Don't waste time on passive networking.",
      action: "💡 Suggested action: Send 3 targeted intentions to key profiles (investors, mentors, potential co-founders)."
    },
    matches: [
      { name: "Isabelle D.", title: "Partner @ VC Fund", compatibility: 91, interests: ["EdTech", "Seed stage"], status: "New" },
      { name: "Pierre M.", title: "CTO • Ex-Google", compatibility: 88, interests: ["AI", "SaaS"], status: "New" },
      { name: "Caroline L.", title: "Serial entrepreneur", compatibility: 85, interests: ["Growth", "Scaling"], status: "New" }
    ],
    messages: [
      { from: "Isabelle D.", preview: "Hi Marc, your EdTech project interests me. Would you be available for a quick call this week?", time: "3h ago", unread: true },
      { from: "Pierre M.", preview: "Hey Marc! Saw your profile. I'm actually looking for an EdTech project to join as CTO. Let's connect?", time: "Yesterday", unread: false }
    ],
    benefits: [
      "Matching based on industry sector + astro/numerology synergies (optional) + objectives",
      "Daily guidance to take action (no procrastination)",
      "Access to investors, mentors, co-founders",
      "Secure chat to quickly qualify opportunities",
      "Automatic follow-ups to maintain momentum",
      "Quality network without forcing or aggressive pitching"
    ]
  }
};