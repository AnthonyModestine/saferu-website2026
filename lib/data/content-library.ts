export interface SocialPost {
  id: string
  title: string
  image?: string // URL to the paired graphic for this post (optional; some posts are caption-only)
  message?: string // optional; use captions.facebook when missing
  captions: {
    facebook: string
    instagram: string
    twitter: string
  }
}

export interface Article {
  id: string
  title: string
  description: string
  posts: SocialPost[]
}

export interface Subcategory {
  id: string
  title: string
  description: string
  icon: string
  articles: Article[]
}

export interface Category {
  id: string
  title: string
  description: string
  subcategories: Subcategory[]
}

export const contentLibrary: Category[] = [
  {
    id: "crime-prevention",
    title: "Crime Prevention",
    description: "Offer advice on crime prevention, suspicious activity, and security tips.",
    subcategories: [
      {
        id: "home",
        title: "Home",
        description: "Home security and residential safety tips",
        icon: "Home",
        articles: [
          {
            id: "burglary-prevention",
            title: "Burglary Prevention",
            description: "Tips to prevent home break-ins and burglaries",
            posts: [
              {
                id: "bp-1",
                title: "Lock It Up",
                image: "/images/posts/lock-it-up.jpg",
                captions: {
                  facebook: "Did you know most burglars enter through unlocked doors and windows? Always lock up, even when you're home. A simple habit can prevent a break-in. Share this with your neighbors!\n\n#SaferNeighborhoodsTogether #SaferU #HomeSecurity #CrimePrevention #LockUp",
                  instagram: "Lock your doors. Lock your windows. Every time. It's the simplest way to protect your home.\n\n#SaferNeighborhoodsTogether #SaferU #HomeSecurity #SafetyFirst #BurglaryPrevention",
                  twitter: "Most burglars enter through unlocked doors. Lock up every time - even when you're home! #SaferNeighborhoodsTogether #SaferU #HomeSecurity",
                }
              },
              {
                id: "bp-2",
                title: "Light It Up",
                image: "/images/posts/light-it-up.jpg",
                captions: {
                  facebook: "A well-lit home is a safer home! Use motion-sensor lights around entry points, keep some interior lights on timers, and trim bushes that could provide hiding spots. Burglars prefer darkness - don't give it to them.\n\n#SaferNeighborhoodsTogether #SaferU #HomeSafety #CrimePrevention",
                  instagram: "Burglars love the dark. Don't make it easy for them! Motion lights + trimmed bushes + interior timers = a safer home.\n\n#SaferNeighborhoodsTogether #SaferU #LightItUp #HomeSecurity",
                  twitter: "Motion lights, trimmed bushes, interior timers. Make your home a hard target for burglars. #SaferNeighborhoodsTogether #SaferU",
                }
              },
              {
                id: "bp-3",
                title: "Know Your Neighbors",
                image: "/images/posts/know-your-neighbors.jpg",
                captions: {
                  facebook: "Your neighbors are your best security system! Get to know the people on your street. Look out for each other. Report suspicious activity. A connected community is a safer community.\n\n#SaferNeighborhoodsTogether #SaferU #NeighborhoodWatch #CommunitySafety",
                  instagram: "The best alarm system? Neighbors who look out for each other. Build those connections!\n\n#SaferNeighborhoodsTogether #SaferU #CommunityFirst #NeighborhoodWatch",
                  twitter: "Know your neighbors. Watch out for each other. A connected community is a safer community. #SaferNeighborhoodsTogether #SaferU",
                }
              },
              {
                id: "bp-4",
                title: "Secure Your Doors",
                image: "/images/posts/secure-your-doors.jpg",
                captions: {
                  facebook: "Is your front door secure? Use a solid core door, install a deadbolt, and consider a reinforced strike plate. Your door is your first line of defense!\n\n#SaferNeighborhoodsTogether #SaferU #DoorSecurity #HomeSafety #CrimePrevention",
                  instagram: "Solid door + deadbolt + reinforced strike plate = a door that says 'not today' to burglars.\n\n#SaferNeighborhoodsTogether #SaferU #HomeSecurity #ProtectYourHome",
                  twitter: "Deadbolts, solid doors, reinforced strike plates. Make your entry points burglar-resistant! #SaferNeighborhoodsTogether #SaferU",
                }
              },
            ]
          },
          {
            id: "vacation-safety",
            title: "Vacation Safety",
            description: "Keep your home safe while you're away",
            posts: [
              {
                id: "vs-1",
                title: "Don't Advertise Your Absence",
                captions: {
                  facebook: "Planning a vacation? Don't post about it until you're back! Burglars monitor social media looking for empty homes. Share your photos when you return. #VacationSafety #SocialMediaSafety #TravelTips",
                  instagram: "Vacation tip: Save those beach photos for when you get home. Don't advertise an empty house! #TravelSmart #VacationSafety",
                  twitter: "Post vacation photos AFTER you return. Don't advertise an empty home on social media! #VacationSafety",
                }
              },
              {
                id: "vs-2",
                title: "Stop Your Mail",
                captions: {
                  facebook: "Going on vacation? Stop your mail and newspaper delivery, or have a trusted neighbor collect them. Piled up mail is a clear sign no one's home. #VacationPrep #HomeSecurity",
                  instagram: "Vacation checklist: Stop mail, have neighbor grab packages, set light timers. Make your home look lived-in! #VacationReady #SafetyFirst",
                  twitter: "Stop mail, use light timers, ask neighbors to grab packages. Make your home look occupied while away! #VacationSafety",
                }
              },
              {
                id: "vs-3",
                title: "Trusted Neighbor Check-In",
                captions: {
                  facebook: "Heading out of town? Ask a trusted neighbor to check on your home, park in your driveway occasionally, and keep an eye out for anything unusual. Community helps keep us safe! #NeighborHelp #VacationSafety",
                  instagram: "Your neighbor parking in your driveway while you're away? Smart move! Makes your home look occupied. #GoodNeighbors #VacationTips",
                  twitter: "Ask a neighbor to park in your driveway, check on your home, and report anything suspicious while you're away. #VacationSafety",
                }
              },
            ]
          },
        ]
      },
      {
        id: "vehicle",
        title: "Vehicle",
        description: "Auto theft and vehicle break-in prevention",
        icon: "Car",
        articles: [
          {
            id: "auto-theft",
            title: "Auto Theft Prevention",
            description: "Protect your vehicle from being stolen",
            posts: [
              {
                id: "at-1",
                title: "Take Your Keys",
                captions: {
                  facebook: "Never leave your keys in your car - not even for a quick errand! Auto theft often happens in seconds. Take your keys, lock your doors, every single time. #AutoTheft #CarSafety #LockIt",
                  instagram: "Quick stop? Still take your keys. Auto theft happens in seconds. Don't make it easy. #CarSafety #AutoTheft",
                  twitter: "Never leave keys in your car. Not even for a minute. Auto theft happens fast! #LockItUp #CarSafety",
                }
              },
              {
                id: "at-2",
                title: "Park Smart",
                captions: {
                  facebook: "Where you park matters! Choose well-lit areas, park near entrances or security cameras when possible, and avoid isolated spots. Smart parking = safer vehicle. #ParkSmart #AutoSafety",
                  instagram: "Well-lit + busy area + near cameras = smart parking. Make your car a hard target! #ParkSmart #CarSecurity",
                  twitter: "Park in well-lit areas near entrances and cameras. Smart parking prevents auto crime! #CarSafety",
                }
              },
              {
                id: "at-3",
                title: "Anti-Theft Devices",
                captions: {
                  facebook: "Consider anti-theft devices for your vehicle: steering wheel locks, brake pedal locks, or aftermarket alarm systems. Visible deterrents make thieves think twice! #AntiTheft #CarSecurity",
                  instagram: "Steering wheel lock = visible deterrent. Thieves see it and move on. Simple and effective! #CarSecurity #AntiTheft",
                  twitter: "Visible anti-theft devices deter car thieves. Steering wheel locks, alarms, tracking devices. Protect your ride! #AutoSafety",
                }
              },
            ]
          },
          {
            id: "vehicle-break-ins",
            title: "Vehicle Break-Ins",
            description: "Prevent smash-and-grab thefts from your vehicle",
            posts: [
              {
                id: "vb-1",
                title: "Hide Valuables",
                captions: {
                  facebook: "If they can see it, they'll steal it! Never leave valuables visible in your car - purses, electronics, bags, even spare change. Put items in the trunk BEFORE you arrive at your destination. #SmashAndGrab #CarSafety",
                  instagram: "See that laptop on your seat? So does every thief walking by. Hide it before you park - not after. #HideIt #CarCrime",
                  twitter: "Put valuables in your trunk BEFORE arriving. Thieves watch parking lots. Don't let them see you hide items! #CarSafety",
                }
              },
              {
                id: "vb-2",
                title: "Nothing of Value Sign",
                captions: {
                  facebook: "Some people leave 'No Valuables Inside' notes on their cars. Better idea: actually leave nothing of value inside AND keep your car looking clean and empty. An empty-looking car is less tempting. #AutoBreakIn #Prevention",
                  instagram: "Clean car = less tempting target. No bags, no electronics, no loose change visible. Nothing to steal, nothing to break in for. #CarSafety #SmartMoves",
                  twitter: "Keep your car interior clean and empty-looking. Nothing visible = no reason to break in. #CarBreakIn #Prevention",
                }
              },
            ]
          },
        ]
      },
      {
        id: "cyber",
        title: "Cyber",
        description: "Online safety and digital security",
        icon: "Shield",
        articles: [
          {
            id: "password-safety",
            title: "Password Safety",
            description: "Create and manage strong passwords",
            posts: [
              {
                id: "ps-1",
                title: "Strong Passwords",
                captions: {
                  facebook: "Is your password on the most-hacked list? '123456' and 'password' are still the most common! Use unique, complex passwords for every account. Consider a password manager to keep track. #CyberSecurity #PasswordSafety",
                  instagram: "Your password shouldn't be: your birthday, pet's name, or '123456'. Make it long, random, and unique for each account! #PasswordTips #CyberSafe",
                  twitter: "Strong passwords: 12+ characters, mix of letters/numbers/symbols, unique for each account. Use a password manager! #CyberSecurity",
                }
              },
              {
                id: "ps-2",
                title: "Two-Factor Authentication",
                captions: {
                  facebook: "Two-factor authentication (2FA) adds an extra layer of security to your accounts. Even if someone gets your password, they can't log in without the second factor. Enable it everywhere you can! #2FA #AccountSecurity",
                  instagram: "Password + 2FA = much harder to hack. Turn on two-factor authentication for your important accounts today! #CyberSecurity #2FA",
                  twitter: "Enable two-factor authentication on all important accounts. It's your second line of defense! #2FA #SecurityTip",
                }
              },
            ]
          },
          {
            id: "social-media-safety",
            title: "Social Media Safety",
            description: "Protect yourself on social platforms",
            posts: [
              {
                id: "sms-1",
                title: "Privacy Settings",
                captions: {
                  facebook: "When did you last check your privacy settings? Review who can see your posts, your friend list, and your personal info. Limit what strangers can learn about you! #PrivacyMatters #SocialMediaSafety",
                  instagram: "Public profile? Anyone can see your posts, your tagged locations, your daily routine. Review those privacy settings! #PrivacyCheck #StaySafe",
                  twitter: "Check your privacy settings on all social platforms. Limit what strangers can see about you! #PrivacyMatters",
                }
              },
              {
                id: "sms-2",
                title: "Oversharing Dangers",
                captions: {
                  facebook: "Oversharing online can put you at risk! Avoid posting your full birthdate, home address, vacation plans, work schedule, or daily routines. Criminals use this info! #ThinkBeforeYouPost #OnlineSafety",
                  instagram: "That 'I'm at the airport!' post tells everyone your home is empty. Think before you share! #OverSharing #SafetyFirst",
                  twitter: "Don't post: vacation dates, home address, work schedule, kids' school info. Criminals use social media too! #OnlineSafety",
                }
              },
            ]
          },
        ]
      },
      {
        id: "scams",
        title: "Scams",
        description: "Recognize and avoid common scams",
        icon: "AlertTriangle",
        articles: [
          {
            id: "phone-scams",
            title: "Phone Call Scams",
            description: "Identify and avoid phone scams",
            posts: [
              {
                id: "pcs-1",
                title: "IRS Scam Calls",
                captions: {
                  facebook: "The IRS will NEVER call demanding immediate payment, threaten arrest, or ask for gift cards. If you get such a call, hang up! It's a scam. Report it to the FTC. #IRSScam #PhoneScam #DontFallForIt",
                  instagram: "IRS calling? Demanding gift cards? Threatening jail? IT'S A SCAM. Hang up! The real IRS sends letters. #ScamAlert #IRSScam",
                  twitter: "IRS never demands immediate payment by phone or asks for gift cards. These calls are scams. Hang up! #IRSScam #ScamAlert",
                }
              },
              {
                id: "pcs-2",
                title: "Grandparent Scam",
                captions: {
                  facebook: "Scammers call pretending to be grandchildren in trouble, begging for money and secrecy. Always verify! Call your grandchild directly using a number you know. Don't let emotions override caution. #GrandparentScam #FamilySafety",
                  instagram: "Grandparent scam: 'Grandma, I'm in jail, send money, don't tell mom!' Verify first. Call them directly. Don't wire money! #ScamAlert #ProtectSeniors",
                  twitter: "Grandparent scam: Caller claims to be grandchild in trouble. Always verify by calling them directly! #ScamAlert",
                }
              },
              {
                id: "pcs-3",
                title: "Tech Support Scams",
                captions: {
                  facebook: "Microsoft, Apple, and your internet provider will NEVER call you about a virus. These are scams! Never give remote access to your computer to unsolicited callers. Hang up and call the company directly if concerned. #TechScam #CyberSafety",
                  instagram: "Pop-up says call this number? Phone call about a 'virus'? SCAM! Real tech companies don't do this. #TechScam #DontCall",
                  twitter: "Real tech companies don't cold-call about viruses. Never give remote access to unsolicited callers! #TechScam",
                }
              },
            ]
          },
          {
            id: "text-scams",
            title: "Text Message Scams",
            description: "Spot fake text messages",
            posts: [
              {
                id: "ts-1",
                title: "Delivery Scam Texts",
                captions: {
                  facebook: "Getting texts about package delivery issues with suspicious links? Don't click! Scammers impersonate USPS, FedEx, and UPS. Go directly to the carrier's official website to track packages. #TextScam #PhishingAlert",
                  instagram: "'Your package couldn't be delivered. Click here.' STOP! Don't click random links. Go to the real carrier website. #DeliveryScam #TextScam",
                  twitter: "Fake delivery texts are everywhere. Never click links in texts. Go directly to carrier websites to track packages! #ScamAlert",
                }
              },
              {
                id: "ts-2",
                title: "Bank Alert Scams",
                captions: {
                  facebook: "Text saying your bank account is compromised? Don't click the link or call the number in the text! Call your bank using the number on your card or statement. Scammers create convincing fake alerts. #BankScam #Phishing",
                  instagram: "'Suspicious activity on your account!' Before you panic, call your bank using the number on your card - not the one in the text. #BankScam #StaySafe",
                  twitter: "Bank alert text? Call your bank using the number on your card, not the number in the message! #BankScam #PhishingAlert",
                }
              },
            ]
          },
          {
            id: "email-scams",
            title: "Email Scams",
            description: "Identify phishing and email fraud",
            posts: [
              {
                id: "es-1",
                title: "Phishing Emails",
                captions: {
                  facebook: "Phishing emails look real but aren't! Check the sender's actual email address, hover over links before clicking, and never download unexpected attachments. When in doubt, go directly to the company's website. #Phishing #EmailSafety",
                  instagram: "That email from 'Amazon' about your order? Check the sender address. Hover over links. Don't click if it looks suspicious! #PhishingEmail #CyberSafe",
                  twitter: "Phishing tip: Hover over links before clicking. Check sender's actual email address. Go directly to websites, don't click email links! #Phishing",
                }
              },
              {
                id: "es-2",
                title: "Business Email Compromise",
                captions: {
                  facebook: "Businesses beware: Email from your 'CEO' asking for urgent wire transfer? Verify by phone before sending any money! Business email compromise costs companies millions. Always verify unusual requests. #BEC #BusinessSafety",
                  instagram: "Boss emailing about urgent wire transfer? Call to verify. Business email scams cost companies millions! #BEC #BusinessSecurity",
                  twitter: "Urgent wire transfer request from your 'boss'? Always verify by phone. Business email compromise is real! #BEC #CyberCrime",
                }
              },
            ]
          },
          {
            id: "job-scams",
            title: "Job Scams",
            description: "Avoid employment fraud",
            posts: [
              {
                id: "js-1",
                title: "Too Good to Be True",
                captions: {
                  facebook: "Job scam red flags: High pay for little work, vague job descriptions, requests for payment upfront, interviews only via text. If it sounds too good to be true, it probably is! #JobScam #JobSearch",
                  instagram: "$5000/week working from home with no experience? Major red flag! Research companies before applying. #JobScam #ScamAlert",
                  twitter: "Job scam signs: Pays upfront fee, high salary/low work, text-only interviews, vague descriptions. Research employers! #JobScam",
                }
              },
              {
                id: "js-2",
                title: "Check Overpayment Scam",
                captions: {
                  facebook: "New job sent a check to buy supplies and wire back the extra? SCAM! The check will bounce and you'll lose the money you sent. Legitimate employers don't do this. #CheckScam #JobFraud",
                  instagram: "They sent a check, asked you to deposit and wire money back? Classic scam! That check will bounce. #OverpaymentScam #JobScam",
                  twitter: "Check overpayment scam: Deposit check, wire extra back, check bounces, you lose money. Legitimate jobs don't work this way! #Scam",
                }
              },
            ]
          },
          {
            id: "check-scams",
            title: "Check Scams",
            description: "Recognize fake check fraud",
            posts: [
              {
                id: "cs-1",
                title: "Fake Check Warning",
                captions: {
                  facebook: "Received an unexpected check? Be careful! Fake checks can look completely real. Banks make funds available before verifying the check - if it bounces, YOU owe the money. Never send money back from a check you weren't expecting. #FakeCheck #ScamAlert",
                  instagram: "That check looks real. It clears in your account. Then weeks later - it bounces. And you owe the bank. Fake checks are convincing! #CheckScam #BeCareful",
                  twitter: "Fake checks look real and may 'clear' initially. You're responsible when they bounce weeks later. Never send money back! #CheckScam",
                }
              },
              {
                id: "cs-2",
                title: "Lottery and Prize Scams",
                captions: {
                  facebook: "Won a lottery you never entered? Received a check to cover 'taxes' on your prize? It's a scam! Legitimate lotteries don't ask winners to pay fees upfront. That check is fake. #LotteryScam #PrizeScam",
                  instagram: "'You've won!' But you have to pay fees first? That's not winning - that's a scam. Real prizes don't cost money! #LotteryScam #FakeCheck",
                  twitter: "You can't win a lottery you didn't enter. Checks to cover 'prize fees' are fake. Don't fall for it! #LotteryScam",
                }
              },
            ]
          },
        ]
      },
      {
        id: "traffic",
        title: "Traffic",
        description: "Road safety and traffic awareness",
        icon: "TrafficCone",
        articles: [
          {
            id: "pedestrian-safety",
            title: "Pedestrian Safety",
            description: "Tips for walking safely",
            posts: [
              {
                id: "ped-1",
                title: "Be Seen",
                captions: {
                  facebook: "Walking at night? Wear bright or reflective clothing and carry a flashlight. Drivers can't avoid what they can't see! Stay safe and be visible. #PedestrianSafety #BeSeen #NightWalking",
                  instagram: "Dark clothes + dark night = invisible to drivers. Light up, wear reflective gear, and stay safe! #BeSeen #WalkSafe",
                  twitter: "Walking at night? Wear reflective gear and carry a light. Be visible, be safe! #PedestrianSafety",
                }
              },
              {
                id: "ped-2",
                title: "Crosswalk Safety",
                captions: {
                  facebook: "Use crosswalks and wait for walk signals. Make eye contact with drivers before crossing. Never assume a car will stop - even if you have the right of way. #CrosswalkSafety #LookBothWays",
                  instagram: "Right of way doesn't mean a car will stop. Make eye contact with drivers before you step off the curb! #CrosswalkSafety #StaySafe",
                  twitter: "Use crosswalks, wait for signals, make eye contact with drivers. Never assume cars will stop! #PedestrianSafety",
                }
              },
            ]
          },
          {
            id: "distracted-driving",
            title: "Distracted Driving",
            description: "Put the phone down",
            posts: [
              {
                id: "dd-1",
                title: "Phone Down",
                captions: {
                  facebook: "That text can wait. At 55 mph, looking at your phone for 5 seconds is like driving the length of a football field blindfolded. Put it down. It can save a life. #DistractedDriving #JustDrive",
                  instagram: "5 seconds. 100 yards. Eyes on your phone = eyes off the road. Put it away. #DistractedDriving #PhoneDown",
                  twitter: "5 seconds at your phone at 55mph = 100 yards driven blind. No text is worth it. #JustDrive #DistractedDriving",
                }
              },
              {
                id: "dd-2",
                title: "Hands-Free Is Not Risk-Free",
                captions: {
                  facebook: "Think hands-free calling is safe? Your brain is still distracted. Conversations take focus away from driving. Save important calls for when you're parked. #DistractedDriving #FocusOnTheRoad",
                  instagram: "Hands-free doesn't mean distraction-free. Your mind is still on that call, not the road. #DrivingDistracted #SafetyFirst",
                  twitter: "Hands-free calling still diverts mental attention from driving. Keep focused on the road! #DistractedDriving",
                }
              },
            ]
          },
        ]
      },
      {
        id: "other",
        title: "Other",
        description: "Additional crime prevention resources",
        icon: "MoreHorizontal",
        articles: [
          {
            id: "identity-theft",
            title: "Identity Theft Prevention",
            description: "Protect your personal information",
            posts: [
              {
                id: "id-1",
                title: "Shred Documents",
                captions: {
                  facebook: "Don't just trash sensitive documents - shred them! Bank statements, medical records, pre-approved credit offers - criminals go through garbage looking for this info. Invest in a cross-cut shredder. #IdentityTheft #ShredIt",
                  instagram: "Your trash is a treasure trove for identity thieves. Shred anything with personal info before tossing! #ShredIt #IDTheft",
                  twitter: "Shred bank statements, medical records, and credit offers. Identity thieves dig through trash! #IdentityTheft #ShredIt",
                }
              },
              {
                id: "id-2",
                title: "Monitor Your Credit",
                captions: {
                  facebook: "Check your credit report regularly for accounts you didn't open. You're entitled to free reports from each bureau annually. Consider a credit freeze to prevent new accounts from being opened in your name. #CreditMonitor #IDProtection",
                  instagram: "Free credit reports yearly from each bureau. Check for accounts you didn't open. Freeze your credit if needed! #CreditSafety #IdentityTheft",
                  twitter: "Check your free annual credit reports for suspicious activity. Consider a credit freeze for extra protection! #IDTheft",
                }
              },
            ]
          },
        ]
      },
    ]
  },
  {
    id: "fire-prevention",
    title: "Fire Prevention",
    description: "Share safety tips on fire prevention, smoke alarms, and more.",
    subcategories: [
      {
        id: "home-fire",
        title: "Home Fire Safety",
        description: "Prevent fires in your home",
        icon: "Flame",
        articles: [
          {
            id: "smoke-detectors",
            title: "Smoke Detectors",
            description: "Proper smoke detector placement and maintenance",
            posts: [
              {
                id: "sd-1",
                title: "Test Monthly",
                captions: {
                  facebook: "Test your smoke detectors monthly! Push the test button and listen for the alarm. Working smoke detectors save lives - make sure yours work. #SmokeDetectors #FireSafety #TestItTuesday",
                  instagram: "When did you last test your smoke detectors? Do it now - takes 30 seconds, could save your life! #FireSafety #SmokeAlarm",
                  twitter: "Monthly reminder: Press the test button on your smoke detectors! Working alarms save lives. #FireSafety",
                }
              },
              {
                id: "sd-2",
                title: "Replace Batteries",
                captions: {
                  facebook: "Change smoke detector batteries at least once a year - when you change your clocks is a great reminder! And replace the entire unit every 10 years. Check the manufacturing date on the back. #FirePrevention #SafetyFirst",
                  instagram: "Changing clocks this weekend? Change your smoke detector batteries too! #SpringForward #FireSafety",
                  twitter: "Change smoke detector batteries when you change your clocks. Replace units every 10 years! #FireSafety",
                }
              },
              {
                id: "sd-3",
                title: "Proper Placement",
                captions: {
                  facebook: "Where are your smoke detectors? You need one in every bedroom, outside sleeping areas, and on every level of your home. Smoke rises, so mount them on ceilings or high on walls. #SmokeDetector #FireSafe",
                  instagram: "Smoke detector checklist: Every bedroom, every level, outside sleeping areas. Is your home covered? #FireSafety #HomeSafe",
                  twitter: "Smoke detectors: every bedroom, outside sleeping areas, every level. Mount on ceiling or high on wall! #FireSafety",
                }
              },
            ]
          },
          {
            id: "kitchen-safety",
            title: "Kitchen Fire Safety",
            description: "Prevent cooking fires",
            posts: [
              {
                id: "kf-1",
                title: "Never Leave Cooking Unattended",
                captions: {
                  facebook: "Cooking is the #1 cause of home fires. Never leave your stove unattended! If you must leave the kitchen, turn off the burner. A few seconds of distraction can lead to disaster. #KitchenSafety #CookingSafe",
                  instagram: "Step away from the stove? Turn it off first. Cooking fires happen fast! #KitchenFire #NeverLeave #FirePrevention",
                  twitter: "Never leave cooking unattended. Step away? Turn it off. #1 cause of home fires is unattended cooking! #FireSafety",
                }
              },
              {
                id: "kf-2",
                title: "Grease Fire Response",
                captions: {
                  facebook: "NEVER use water on a grease fire - it will explode! Instead: Turn off heat, cover with a metal lid, use baking soda for small fires, or use a fire extinguisher. Know what to do BEFORE it happens! #GreaseFire #KitchenSafety",
                  instagram: "Grease fire? NEVER water! Cover with lid, turn off heat, use baking soda or extinguisher. Save this post! #FireSafety #GreaseFire",
                  twitter: "Grease fire: NO WATER! Cover with metal lid, turn off heat. Water makes grease fires explode! #KitchenSafety",
                }
              },
            ]
          },
        ]
      },
      {
        id: "escape-planning",
        title: "Escape Planning",
        description: "Be prepared to get out safely",
        icon: "DoorOpen",
        articles: [
          {
            id: "escape-routes",
            title: "Home Escape Plan",
            description: "Plan and practice your escape",
            posts: [
              {
                id: "er-1",
                title: "Two Ways Out",
                captions: {
                  facebook: "Does everyone in your home know two ways out of every room? Create a fire escape plan and practice it twice a year. Pick a meeting spot outside. Seconds matter in a fire! #EscapePlan #FireDrill #FamilySafety",
                  instagram: "Fire escape plan: 2 ways out of every room + meeting spot outside. Practice with your family! #FireSafety #EscapePlan",
                  twitter: "Know 2 ways out of every room. Pick a meeting spot outside. Practice your escape plan! #FireSafety",
                }
              },
              {
                id: "er-2",
                title: "Practice Makes Prepared",
                captions: {
                  facebook: "When did your family last practice a fire drill? Do it at night when everyone's asleep - that's when fires are most deadly. Make sure everyone can get out quickly and safely. #FireDrill #FamilySafety",
                  instagram: "Nighttime fire drill challenge: Can your family escape in under 2 minutes? Practice saves lives! #FireDrill #BePrepared",
                  twitter: "Practice fire drills at night when everyone's asleep. That's when real fires are most dangerous! #FireSafety #FamilyDrill",
                }
              },
            ]
          },
        ]
      },
    ]
  },
  {
    id: "whats-new",
    title: "What's New",
    description: "Stay current with seasonal alerts, news, and timely updates.",
    subcategories: [
      {
        id: "latest",
        title: "What's New",
        description: "Latest articles, seasonal tips, and timely updates",
        icon: "FileText",
        articles: [
          {
            id: "winter-safety-2024",
            title: "Winter Safety Tips",
            description: "Stay safe during the cold months",
            posts: [
              {
                id: "ws-1",
                title: "Winter Driving",
                image: "/images/posts/winter-driving.jpg",
                captions: {
                  facebook: "Winter weather is here! Before hitting the road: Check your tires, keep an emergency kit in your car, slow down on icy roads, and increase following distance. Your destination can wait - your safety can't.\n\n#SaferNeighborhoodsTogether #SaferU #WinterDriving #WinterSafety #DriveCarefully",
                  instagram: "Winter driving checklist: Good tires, emergency kit, slow speeds, extra following distance. Stay safe out there!\n\n#SaferNeighborhoodsTogether #SaferU #WinterDriving #SafetyFirst #WinterWeather",
                  twitter: "Winter driving tips: Check tires, emergency kit, slow down, increase following distance. Safety first! #SaferNeighborhoodsTogether #SaferU #WinterSafety",
                }
              },
              {
                id: "ws-2",
                title: "Space Heater Safety",
                image: "/images/posts/space-heater.jpg",
                captions: {
                  facebook: "Using space heaters this winter? Keep them 3 feet from anything flammable, never leave them unattended, and plug directly into wall outlets - not extension cords. Space heaters cause 1/3 of home heating fires!\n\n#SaferNeighborhoodsTogether #SaferU #SpaceHeaterSafety #FirePrevention #WinterSafety",
                  instagram: "Space heater safety: 3 feet clearance, never unattended, no extension cords. Staying warm shouldn't mean risking a fire!\n\n#SaferNeighborhoodsTogether #SaferU #FireSafety #WinterWarning",
                  twitter: "Space heaters: 3ft clearance, never leave unattended, plug into wall not extension cords. #SaferNeighborhoodsTogether #SaferU #FireSafety",
                }
              },
              {
                id: "ws-3",
                title: "Prevent Frozen Pipes",
                image: "/images/posts/frozen-pipes.jpg",
                captions: {
                  facebook: "Protect your pipes from freezing! Let faucets drip on cold nights, open cabinet doors under sinks, keep your thermostat consistent, and know where your main water shut-off is. Frozen pipes can burst and cause major damage.\n\n#SaferNeighborhoodsTogether #SaferU #WinterTips #FrozenPipes #HomeSafety",
                  instagram: "Cold snap coming? Drip faucets, open cabinet doors, keep heat steady. Frozen pipes = expensive repairs!\n\n#SaferNeighborhoodsTogether #SaferU #WinterReady #HomeTips",
                  twitter: "Prevent frozen pipes: Drip faucets, open cabinets under sinks, keep thermostat steady. #SaferNeighborhoodsTogether #SaferU #WinterTips",
                }
              },
            ]
          },
          {
            id: "scam-alert-jan-2024",
            title: "Current Scam Alert",
            description: "Watch out for these active scams",
            posts: [
              {
                id: "sa-1",
                title: "IRS Impersonator Scam",
                image: "/images/posts/irs-scam.jpg",
                captions: {
                  facebook: "SCAM ALERT: The IRS will NEVER call demanding immediate payment, threaten arrest, or request gift cards. If you get this call, hang up! Report to the Treasury Inspector General. Spread the word to protect your neighbors.\n\n#SaferNeighborhoodsTogether #SaferU #ScamAlert #IRSScam #ProtectYourself",
                  instagram: "IRS won't: Call demanding payment, threaten arrest, ask for gift cards. Got that call? It's a SCAM. Hang up!\n\n#SaferNeighborhoodsTogether #SaferU #ScamAlert #DontFallForIt",
                  twitter: "SCAM ALERT: IRS won't call demanding immediate payment or gift cards. Hang up on these scammers! #SaferNeighborhoodsTogether #SaferU #ScamAlert",
                }
              },
              {
                id: "sa-2",
                title: "Package Theft Season",
                image: "/images/posts/porch-pirates.jpg",
                captions: {
                  facebook: "Package thieves are busy! Protect your deliveries: Use package lockers, require signatures, track packages in real-time, install a doorbell camera, or have packages sent to your workplace. Don't make it easy for porch pirates!\n\n#SaferNeighborhoodsTogether #SaferU #PorchPirates #PackageTheft #HolidaySafety",
                  instagram: "Porch pirates are out there! Package lockers, delivery alerts, doorbell cams - protect your deliveries!\n\n#SaferNeighborhoodsTogether #SaferU #PackageSafety #PorchPirates",
                  twitter: "Protect packages: Use lockers, require signatures, install cameras. Porch pirates are active! #SaferNeighborhoodsTogether #SaferU #PackageTheft",
                }
              },
            ]
          },
        ]
      },
    ]
  },
  {
    id: "weather-preparedness",
    title: "Weather Preparedness",
    description: "Stay safe during severe weather events and seasonal conditions.",
    subcategories: [
      {
        id: "severe-storms",
        title: "Severe Storms",
        description: "Tornado, thunderstorm, and high wind safety",
        icon: "CloudLightning",
        articles: [
          {
            id: "tornado-safety",
            title: "Tornado Safety",
            description: "Know what to do when tornadoes threaten",
            posts: [
              {
                id: "ts-1",
                title: "Tornado Warning vs Watch",
                image: "/images/posts/tornado-warning.jpg",
                captions: {
                  facebook: "Know the difference! TORNADO WATCH means conditions favor tornado development - be prepared. TORNADO WARNING means a tornado has been spotted or detected - take shelter immediately! Have a plan before severe weather hits.\n\n#SaferNeighborhoodsTogether #SaferU #TornadoSafety #SevereWeather #BePrepared",
                  instagram: "WATCH = Be prepared. WARNING = Take shelter NOW! Know the difference - it could save your life.\n\n#SaferNeighborhoodsTogether #SaferU #TornadoSafety #WeatherAware",
                  twitter: "WATCH = conditions favor tornadoes. WARNING = take shelter immediately. Know the difference! #SaferNeighborhoodsTogether #SaferU #TornadoSafety",
                }
              },
              {
                id: "ts-2",
                title: "Shelter in Place",
                image: "/images/posts/tornado-shelter.jpg",
                captions: {
                  facebook: "When a tornado warning is issued: Go to your basement or lowest floor interior room. Get under sturdy furniture. Stay away from windows. Cover yourself with blankets or a mattress. If in a mobile home, evacuate to a sturdy building!\n\n#SaferNeighborhoodsTogether #SaferU #TornadoShelter #SafeRoom #EmergencyPrep",
                  instagram: "Tornado shelter checklist: Lowest floor, interior room, away from windows, under sturdy cover. Where's YOUR safe spot?\n\n#SaferNeighborhoodsTogether #SaferU #TornadoSafety #TakeShelter",
                  twitter: "Tornado shelter: Lowest floor, interior room, away from windows. Know your safe spot BEFORE you need it! #SaferNeighborhoodsTogether #SaferU",
                }
              },
              {
                id: "ts-3",
                title: "Emergency Kit Essentials",
                image: "/images/posts/emergency-kit.jpg",
                captions: {
                  facebook: "Is your emergency kit ready? Water (1 gallon/person/day), flashlight, batteries, first aid kit, weather radio, phone chargers, medications, important documents. Keep it where you can grab it quickly!\n\n#SaferNeighborhoodsTogether #SaferU #EmergencyKit #BePrepared #SevereWeather",
                  instagram: "Emergency kit checklist: Water, flashlight, batteries, first aid, weather radio, meds, documents. Ready? #SaferNeighborhoodsTogether #SaferU #EmergencyPrep",
                  twitter: "Emergency kit: Water, flashlight, first aid, weather radio, meds, documents. Is yours ready? #SaferNeighborhoodsTogether #SaferU #BePrepared",
                }
              },
            ]
          },
          {
            id: "thunderstorm-safety",
            title: "Thunderstorm Safety",
            description: "Lightning and severe thunderstorm tips",
            posts: [
              {
                id: "ths-1",
                title: "When Thunder Roars",
                image: "/images/posts/lightning-safety.jpg",
                captions: {
                  facebook: "When thunder roars, go indoors! Lightning can strike up to 10 miles from rain. If you can hear thunder, you're within striking distance. Get inside a building or hard-topped vehicle immediately.\n\n#SaferNeighborhoodsTogether #SaferU #LightningSafety #ThunderstormSafety #GoIndoors",
                  instagram: "Hear thunder? You're in lightning's range! Get inside immediately - buildings or hard-topped vehicles only.\n\n#SaferNeighborhoodsTogether #SaferU #LightningSafety #WhenThunderRoars",
                  twitter: "When thunder roars, go indoors! Lightning strikes up to 10 miles from rain. #SaferNeighborhoodsTogether #SaferU #LightningSafety",
                }
              },
            ]
          },
        ]
      },
      {
        id: "extreme-heat",
        title: "Extreme Heat",
        description: "Beat the heat and stay safe during heat waves",
        icon: "Thermometer",
        articles: [
          {
            id: "heat-safety",
            title: "Heat Wave Safety",
            description: "Protect yourself during extreme heat",
            posts: [
              {
                id: "hs-1",
                title: "Signs of Heat Stroke",
                image: "/images/posts/heat-stroke.jpg",
                captions: {
                  facebook: "Heat stroke is a medical emergency! Warning signs: High body temp, confusion, hot/red skin, rapid pulse, headache, nausea. Call 911 immediately. Move person to shade, cool with water. Never leave anyone in a hot car!\n\n#SaferNeighborhoodsTogether #SaferU #HeatStroke #HeatSafety #SummerSafety",
                  instagram: "Heat stroke signs: High temp, confusion, red skin, rapid pulse. Call 911 immediately! Prevention > treatment.\n\n#SaferNeighborhoodsTogether #SaferU #HeatSafety #KnowTheSigns",
                  twitter: "Heat stroke = 911 emergency. Signs: confusion, hot skin, rapid pulse. Move to shade, cool with water immediately! #SaferNeighborhoodsTogether #SaferU",
                }
              },
              {
                id: "hs-2",
                title: "Stay Cool Tips",
                image: "/images/posts/stay-cool.jpg",
                captions: {
                  facebook: "Beat the heat! Drink plenty of water, wear lightweight loose clothing, limit outdoor activities during peak heat (10am-4pm), never leave kids or pets in cars, check on elderly neighbors. Cooling centers are available!\n\n#SaferNeighborhoodsTogether #SaferU #BeatTheHeat #HeatWave #StayCool",
                  instagram: "Heat wave survival: Hydrate, light clothes, avoid peak sun, NEVER leave kids/pets in cars! Check on neighbors.\n\n#SaferNeighborhoodsTogether #SaferU #BeatTheHeat #SummerSafe",
                  twitter: "Beat the heat: Hydrate, light clothes, avoid 10am-4pm outdoors, never leave kids/pets in cars! #SaferNeighborhoodsTogether #SaferU #HeatSafety",
                }
              },
            ]
          },
        ]
      },
      {
        id: "winter-weather",
        title: "Winter Weather",
        description: "Snow, ice, and cold weather safety",
        icon: "Snowflake",
        articles: [
          {
            id: "winter-storms",
            title: "Winter Storm Preparedness",
            description: "Get ready before winter storms hit",
            posts: [
              {
                id: "wsp-1",
                title: "Winter Storm Kit",
                image: "/images/posts/winter-storm-kit.jpg",
                captions: {
                  facebook: "Winter storm coming? Stock up now! Bottled water, non-perishable food, flashlights, batteries, blankets, medications, pet supplies, car emergency kit. Don't wait until the storm hits to prepare!\n\n#SaferNeighborhoodsTogether #SaferU #WinterStorm #EmergencyPrep #WinterReady",
                  instagram: "Winter storm prep: Water, food, flashlights, batteries, blankets, meds, pet supplies. Ready before the snow flies!\n\n#SaferNeighborhoodsTogether #SaferU #WinterPrep #StormReady",
                  twitter: "Winter storm prep: Water, food, flashlights, blankets, meds. Don't wait - prepare now! #SaferNeighborhoodsTogether #SaferU #WinterStorm",
                }
              },
              {
                id: "wsp-2",
                title: "Carbon Monoxide Danger",
                image: "/images/posts/co-danger.jpg",
                captions: {
                  facebook: "DANGER: Never use generators, grills, or camp stoves indoors! Carbon monoxide is odorless and deadly. Install CO detectors on every level of your home. If your detector goes off, get outside immediately and call 911.\n\n#SaferNeighborhoodsTogether #SaferU #COSafety #CarbonMonoxide #WinterSafety",
                  instagram: "CO kills silently. Never use generators/grills indoors. CO detectors on every floor. Alarm = get out + call 911!\n\n#SaferNeighborhoodsTogether #SaferU #CarbonMonoxide #LifeSaver",
                  twitter: "Never generators/grills indoors - CO kills! Have detectors on every floor. Alarm = evacuate + call 911! #SaferNeighborhoodsTogether #SaferU",
                }
              },
            ]
          },
        ]
      },
    ]
  },
  {
    id: "natural-disaster",
    title: "Natural Disaster",
    description: "Prepare for and respond to natural disasters in your area.",
    subcategories: [
      {
        id: "earthquake",
        title: "Earthquake",
        description: "Earthquake preparedness and response",
        icon: "Activity",
        articles: [
          {
            id: "earthquake-safety",
            title: "Earthquake Response",
            description: "What to do during and after an earthquake",
            posts: [
              {
                id: "eq-1",
                title: "Drop Cover Hold On",
                image: "/images/posts/drop-cover-hold.jpg",
                captions: {
                  facebook: "Earthquake! Remember DROP, COVER, HOLD ON! Drop to your hands and knees. Take cover under sturdy furniture. Hold on until shaking stops. Stay away from windows, outside walls, and anything that could fall. Don't run outside during shaking!\n\n#SaferNeighborhoodsTogether #SaferU #EarthquakeSafety #DropCoverHoldOn #BePrepared",
                  instagram: "Earthquake response: DROP to knees, COVER under furniture, HOLD ON until it stops. Practice with your family!\n\n#SaferNeighborhoodsTogether #SaferU #EarthquakeDrill #DropCoverHoldOn",
                  twitter: "Earthquake: DROP, COVER, HOLD ON! Under sturdy furniture, hold until shaking stops. Don't run outside! #SaferNeighborhoodsTogether #SaferU",
                }
              },
              {
                id: "eq-2",
                title: "Secure Your Space",
                image: "/images/posts/secure-furniture.jpg",
                captions: {
                  facebook: "Earthquake prep tip: Secure heavy furniture to walls! Anchor bookcases, water heaters, and TVs. Move heavy items to lower shelves. Store breakables in latched cabinets. These simple steps prevent injuries during shaking.\n\n#SaferNeighborhoodsTogether #SaferU #EarthquakePrep #SecureYourSpace #SafetyFirst",
                  instagram: "Anchor heavy furniture, move items to low shelves, latch cabinets. Prevent injuries before the shake!\n\n#SaferNeighborhoodsTogether #SaferU #EarthquakePrep #SecureIt",
                  twitter: "Earthquake prep: Anchor furniture to walls, heavy items on low shelves, latch cabinets! #SaferNeighborhoodsTogether #SaferU #BePrepared",
                }
              },
            ]
          },
        ]
      },
      {
        id: "flooding",
        title: "Flooding",
        description: "Flood safety before, during, and after",
        icon: "Waves",
        articles: [
          {
            id: "flood-safety",
            title: "Flood Safety",
            description: "Stay safe when floodwaters threaten",
            posts: [
              {
                id: "fl-1",
                title: "Turn Around Don't Drown",
                image: "/images/posts/turn-around.jpg",
                captions: {
                  facebook: "TURN AROUND, DON'T DROWN! Just 6 inches of moving water can knock you down. 12 inches can carry away a vehicle. Never walk, swim, or drive through flood waters. It's not worth the risk - find another route!\n\n#SaferNeighborhoodsTogether #SaferU #FloodSafety #TurnAroundDontDrown #StaySafe",
                  instagram: "6 inches of water knocks you down. 12 inches moves a car. NEVER drive through floods. Turn around!\n\n#SaferNeighborhoodsTogether #SaferU #FloodSafety #TurnAround",
                  twitter: "6\" of water = knocked down. 12\" = car floats away. NEVER drive through floods! Turn around, don't drown! #SaferNeighborhoodsTogether #SaferU",
                }
              },
              {
                id: "fl-2",
                title: "Flash Flood Warning",
                image: "/images/posts/flash-flood.jpg",
                captions: {
                  facebook: "Flash floods are FAST and DEADLY! When a warning is issued, move immediately to higher ground. Don't wait to see the water. Stay out of flooded areas even after waters recede - roads may be washed out beneath.\n\n#SaferNeighborhoodsTogether #SaferU #FlashFlood #FloodWarning #MoveToHighGround",
                  instagram: "Flash flood warning = move to high ground NOW! Don't wait. Don't watch. Just GO!\n\n#SaferNeighborhoodsTogether #SaferU #FlashFlood #ActFast",
                  twitter: "Flash flood warning? Move to high ground immediately! Don't wait to see water. #SaferNeighborhoodsTogether #SaferU #FloodSafety",
                }
              },
            ]
          },
        ]
      },
      {
        id: "wildfire",
        title: "Wildfire",
        description: "Wildfire preparedness and evacuation",
        icon: "Flame",
        articles: [
          {
            id: "wildfire-prep",
            title: "Wildfire Preparedness",
            description: "Protect your home and family from wildfires",
            posts: [
              {
                id: "wf-1",
                title: "Defensible Space",
                image: "/images/posts/defensible-space.jpg",
                captions: {
                  facebook: "Create defensible space around your home! Clear dead vegetation within 30 feet, trim trees 10 feet from structures, clean gutters and roof, remove firewood from near the house. This buffer zone can save your home!\n\n#SaferNeighborhoodsTogether #SaferU #WildfirePrep #DefensibleSpace #ProtectYourHome",
                  instagram: "Defensible space: 30ft clearance, trimmed trees, clean gutters, firewood away from house. Your home's fire buffer!\n\n#SaferNeighborhoodsTogether #SaferU #WildfirePrevention #FireSmart",
                  twitter: "Create defensible space: 30ft clear zone, trim trees, clean gutters. This buffer could save your home! #SaferNeighborhoodsTogether #SaferU",
                }
              },
              {
                id: "wf-2",
                title: "Evacuation Go Bag",
                image: "/images/posts/go-bag.jpg",
                captions: {
                  facebook: "Is your wildfire GO BAG ready? Include: medications, important documents, phone chargers, water, snacks, change of clothes, pet supplies, cash. When evacuation orders come, you need to leave FAST. Be ready!\n\n#SaferNeighborhoodsTogether #SaferU #GoBag #EvacuationReady #WildfireSafety",
                  instagram: "Go bag essentials: Meds, documents, chargers, water, clothes, pet stuff, cash. Pack it NOW, not when flames approach!\n\n#SaferNeighborhoodsTogether #SaferU #GoBag #BeReady",
                  twitter: "Go bag ready? Meds, documents, chargers, water, pet supplies, cash. When orders come, GO! #SaferNeighborhoodsTogether #SaferU #WildfirePrep",
                }
              },
            ]
          },
        ]
      },
    ]
  },
  {
    id: "community-awareness",
    title: "Community Awareness",
    description: "Build stronger, safer neighborhoods through awareness and engagement.",
    subcategories: [
      {
        id: "neighborhood-watch",
        title: "Neighborhood Watch",
        description: "Organize and participate in community safety",
        icon: "Users",
        articles: [
          {
            id: "starting-watch",
            title: "Starting a Neighborhood Watch",
            description: "How to organize your community",
            posts: [
              {
                id: "nw-1",
                title: "Connect With Neighbors",
                image: "/images/posts/neighbors-connect.jpg",
                captions: {
                  facebook: "Want a safer neighborhood? Start by connecting! Exchange contact info with neighbors, create a group chat, meet regularly. When neighbors know each other, they notice when something's off. Community is your best security!\n\n#SaferNeighborhoodsTogether #SaferU #NeighborhoodWatch #CommunityFirst #SaferTogether",
                  instagram: "Best security system? Neighbors who know each other! Connect, communicate, watch out for one another.\n\n#SaferNeighborhoodsTogether #SaferU #NeighborhoodWatch #StrongerTogether",
                  twitter: "Best security? Neighbors who connect! Exchange info, create group chats, meet regularly. Community = safety! #SaferNeighborhoodsTogether #SaferU",
                }
              },
              {
                id: "nw-2",
                title: "Report Suspicious Activity",
                image: "/images/posts/report-suspicious.jpg",
                captions: {
                  facebook: "See something, say something! Report suspicious activity to police - trust your instincts. Note details: descriptions, vehicles, license plates, direction of travel. You're not being nosy, you're being a good neighbor!\n\n#SaferNeighborhoodsTogether #SaferU #SeeSomethingSaySomething #ReportIt #GoodNeighbor",
                  instagram: "Trust your gut! Suspicious activity? Note details, report to police. You're not nosy - you're protective!\n\n#SaferNeighborhoodsTogether #SaferU #SeeSomething #CommunityWatch",
                  twitter: "See something suspicious? Trust your instincts, note details, report it. Good neighbors look out for each other! #SaferNeighborhoodsTogether #SaferU",
                }
              },
            ]
          },
        ]
      },
      {
        id: "child-safety",
        title: "Child Safety",
        description: "Protecting our youngest community members",
        icon: "Baby",
        articles: [
          {
            id: "stranger-safety",
            title: "Stranger Safety for Kids",
            description: "Teaching children to stay safe",
            posts: [
              {
                id: "cs-1",
                title: "Safe Adults",
                image: "/images/posts/safe-adults.jpg",
                captions: {
                  facebook: "Teach kids about 'safe adults' - people they can go to for help. Police, firefighters, teachers, store employees in uniform. Practice scenarios: What if you're lost? What if someone makes you uncomfortable? Preparation builds confidence!\n\n#SaferNeighborhoodsTogether #SaferU #ChildSafety #SafeAdults #ParentingTips",
                  instagram: "Who are your child's 'safe adults'? Practice scenarios together. Preparation = confidence!\n\n#SaferNeighborhoodsTogether #SaferU #ChildSafety #KidsSafety",
                  twitter: "Teach kids about safe adults: police, firefighters, teachers. Practice 'what if' scenarios together! #SaferNeighborhoodsTogether #SaferU #ChildSafety",
                }
              },
              {
                id: "cs-2",
                title: "Online Safety for Kids",
                image: "/images/posts/online-safety-kids.jpg",
                captions: {
                  facebook: "Kids online? Set clear rules: Never share personal info, don't accept friend requests from strangers, tell a parent if something feels wrong. Check privacy settings, know what apps they use. Open communication is key!\n\n#SaferNeighborhoodsTogether #SaferU #OnlineSafety #DigitalParenting #ProtectKids",
                  instagram: "Kids online safety: No personal info sharing, no stranger requests, tell parents if uncomfortable. Talk openly!\n\n#SaferNeighborhoodsTogether #SaferU #OnlineSafety #DigitalKids",
                  twitter: "Kids online rules: No personal info, no stranger requests, tell parents if uncomfortable. Communication is key! #SaferNeighborhoodsTogether #SaferU",
                }
              },
            ]
          },
        ]
      },
      {
        id: "senior-safety",
        title: "Senior Safety",
        description: "Protecting and supporting older adults",
        icon: "Heart",
        articles: [
          {
            id: "senior-scams",
            title: "Protecting Seniors from Scams",
            description: "Help seniors avoid fraud",
            posts: [
              {
                id: "ss-1",
                title: "Common Scam Warning Signs",
                image: "/images/posts/senior-scam-warning.jpg",
                captions: {
                  facebook: "Help protect seniors from scams! Red flags: Urgency/pressure tactics, requests for gift cards or wire transfers, threats of arrest, prize winnings requiring payment, romance scams. Talk to your loved ones - scammers are convincing!\n\n#SaferNeighborhoodsTogether #SaferU #SeniorScams #ProtectOurSeniors #ScamAwareness",
                  instagram: "Scam red flags: Urgency, gift card requests, threats, 'prize' fees. Talk to seniors in your life about these tactics!\n\n#SaferNeighborhoodsTogether #SaferU #SeniorSafety #ScamAlert",
                  twitter: "Scam red flags: Urgency, gift cards, threats, prize fees. Talk to seniors about these tactics! #SaferNeighborhoodsTogether #SaferU #ProtectSeniors",
                }
              },
              {
                id: "ss-2",
                title: "Check On Seniors",
                image: "/images/posts/check-on-seniors.jpg",
                captions: {
                  facebook: "Be a good neighbor - check on elderly residents! During extreme weather, power outages, or just because. A quick visit or call can make a huge difference. They may need help and not ask. Small gestures matter!\n\n#SaferNeighborhoodsTogether #SaferU #CheckOnNeighbors #SeniorCare #CommunityFirst",
                  instagram: "Check on elderly neighbors - during heat waves, cold snaps, or just because. Small gestures, big impact!\n\n#SaferNeighborhoodsTogether #SaferU #GoodNeighbor #SeniorCare",
                  twitter: "Check on elderly neighbors during extreme weather or just because. Small gestures matter! #SaferNeighborhoodsTogether #SaferU #Community",
                }
              },
            ]
          },
        ]
      },
    ]
  },
]

// Helper functions
export function getCategoryById(categoryId: string): Category | undefined {
  return contentLibrary.find(cat => cat.id === categoryId)
}

export function getSubcategoryById(categoryId: string, subcategoryId: string): Subcategory | undefined {
  const category = getCategoryById(categoryId)
  return category?.subcategories.find(sub => sub.id === subcategoryId)
}

export function getArticleById(categoryId: string, subcategoryId: string, articleId: string): Article | undefined {
  const subcategory = getSubcategoryById(categoryId, subcategoryId)
  return subcategory?.articles.find(art => art.id === articleId)
}

export function getAllCategories(): Category[] {
  return contentLibrary
}

// Aliases for shorter function names
export const getSubcategory = getSubcategoryById
export const getArticle = getArticleById
