export interface Scripture {
  reference: string;
  verse: string;
  /** How David naturally introduces this verse */
  davidIntro: string;
  /** Brief meaning — 1–2 sentences plain language */
  davidReflection: string;
}

export interface MoodData {
  key: string;
  label: string;
  /** David's natural reaction lines before scripture */
  davidReaction: string[];
  /** Natural follow-up questions after scripture */
  davidFollowUps: string[];
  scriptures: Scripture[];
}

export const MOODS_DATA: MoodData[] = [
  {
    key: 'ANXIOUS',
    label: 'Anxious',
    davidReaction: [
      "mm… anxiety will wear somebody down after a while.",
      "yeah… when the mind won't slow down, it's exhausting.",
      "that kind of worry has a way of spreading into everything.",
      "anxiety has a way of making small things feel enormous.",
    ],
    davidFollowUps: [
      "has it been stress mostly… or just life piling up?",
      "is there something specific driving it, or just everything at once?",
      "how long have you been feeling like this?",
      "yeah… you been able to sleep okay?",
    ],
    scriptures: [
      {
        reference: 'Philippians 4:6-7',
        verse: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.',
        davidIntro: "there's actually a verse people come back to a lot when life starts feeling loud like that…",
        davidReflection: "I think people hold onto it because it doesn't tell you to stop feeling anxious. it just says you don't have to carry it alone.",
      },
      {
        reference: '1 Peter 5:7',
        verse: 'Cast all your anxiety on him because he cares for you.',
        davidIntro: "there's a short one from Peter I think about sometimes…",
        davidReflection: "only seven words but they land heavy. cast it. like you're putting something down you were never supposed to carry alone.",
      },
      {
        reference: 'Matthew 6:34',
        verse: 'Therefore do not worry about tomorrow, for tomorrow will worry about itself. Each day has enough trouble of its own.',
        davidIntro: "Jesus actually said something about this once…",
        davidReflection: "it's almost practical. like — just today. that's all. don't borrow trouble from tomorrow.",
      },
      {
        reference: 'Isaiah 41:10',
        verse: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.',
        davidIntro: "there's a verse in Isaiah that's stayed with me…",
        davidReflection: "it's not 'you'll be okay.' it's more like — I've got you. that's the whole thing.",
      },
    ],
  },
  {
    key: 'SAD',
    label: 'Sad',
    davidReaction: [
      "mm… sadness can sit on you for a while.",
      "yeah… sadness has a weight to it that's hard to explain to people who aren't in it.",
      "man… that kind of sadness doesn't just go away on its own, does it.",
      "yeah… sometimes things just feel gray for a while.",
    ],
    davidFollowUps: [
      "what happened?",
      "how long have you been feeling this way?",
      "is there something specific, or just a heaviness that's been there?",
      "yeah… you been holding that in for a while?",
    ],
    scriptures: [
      {
        reference: 'Psalm 34:18',
        verse: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.',
        davidIntro: "there's a line in Psalms I think about sometimes when things get heavy…",
        davidReflection: "I think people hold onto that one because it doesn't rush them. it just says God is near.",
      },
      {
        reference: 'Matthew 5:4',
        verse: 'Blessed are those who mourn, for they will be comforted.',
        davidIntro: "there's something Jesus said that I keep coming back to…",
        davidReflection: "not 'you'll stop mourning.' just — you will be comforted. that grief isn't invisible.",
      },
      {
        reference: 'Psalm 147:3',
        verse: 'He heals the brokenhearted and binds up their wounds.',
        davidIntro: "there's a verse in Psalms that feels like it was written for exactly this…",
        davidReflection: "binds up wounds — like tending to something carefully. not rushing it. actually tending to it.",
      },
      {
        reference: 'John 16:22',
        verse: 'So with you: Now is your time of grief, but I will see you again and you will rejoice, and no one will take away your joy.',
        davidIntro: "Jesus said something to his disciples once that I think about in moments like this…",
        davidReflection: "he didn't skip the grief. he just said — it won't always be this. that's not nothing.",
      },
    ],
  },
  {
    key: 'LONELY',
    label: 'Lonely',
    davidReaction: [
      "mm… loneliness gets loud sometimes.",
      "yeah… that kind of alone is different from just being by yourself.",
      "loneliness has a way of making everything feel farther away.",
      "man… sometimes you can be surrounded by people and still feel completely alone.",
    ],
    davidFollowUps: [
      "is it a specific kind of lonely… or just everything feeling far away?",
      "have you been able to talk to anyone about it?",
      "yeah… how long has it felt like that?",
      "is there someone you wish was closer?",
    ],
    scriptures: [
      {
        reference: 'Psalm 34:18',
        verse: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.',
        davidIntro: "there's a line in Psalms that comes to mind when people feel that kind of alone…",
        davidReflection: "close to the brokenhearted. not watching from far away. close.",
      },
      {
        reference: 'Matthew 28:20',
        verse: 'And surely I am with you always, to the very end of the age.',
        davidIntro: "one of the last things Jesus said to his disciples was…",
        davidReflection: "always. not 'when you're doing well.' not 'when you get it together.' always.",
      },
      {
        reference: 'Isaiah 43:1',
        verse: 'Do not fear, for I have redeemed you; I have summoned you by name; you are mine.',
        davidIntro: "there's a verse in Isaiah that kind of stops you when you read it…",
        davidReflection: "summoned by name. not as a number. by name. that means something.",
      },
      {
        reference: 'Deuteronomy 31:6',
        verse: 'Be strong and courageous. Do not be afraid or terrified, for the Lord your God goes with you; he will never leave you nor forsake you.',
        davidIntro: "there's a promise that shows up more than once in the Bible…",
        davidReflection: "never leave, never forsake. those are pretty strong words. not 'probably' or 'mostly.' never.",
      },
    ],
  },
  {
    key: 'STRESSED',
    label: 'Stressed',
    davidReaction: [
      "yeah… stress has a way of stacking up until everything feels urgent.",
      "mm… when everything is pulling at you at once, it's hard to breathe.",
      "man… that kind of pressure wears on a person over time.",
      "yeah… sounds like your mind hasn't had much room to rest.",
    ],
    davidFollowUps: [
      "is it work, or is it more personal than that?",
      "yeah… how long have you been running at this pace?",
      "what's the thing weighing heaviest right now?",
      "you getting any time to just stop?",
    ],
    scriptures: [
      {
        reference: 'Matthew 11:28-30',
        verse: 'Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls.',
        davidIntro: "there's something Jesus said that I keep coming back to when life gets like this…",
        davidReflection: "he's not asking you to try harder. he's saying come as you are, put it down for a minute.",
      },
      {
        reference: 'Psalm 55:22',
        verse: 'Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken.',
        davidIntro: "there's a verse in Psalms that comes to mind…",
        davidReflection: "cast your cares — like something you're actually handing over. not just hoping it gets lighter. giving it.",
      },
      {
        reference: 'Exodus 14:14',
        verse: 'The Lord will fight for you; you need only to be still.',
        davidIntro: "one verse that's short but it lands hard…",
        davidReflection: "you need only to be still. that's the hard part when you're stressed — being still feels like failing. but sometimes it's the right move.",
      },
    ],
  },
  {
    key: 'OVERWHELMED',
    label: 'Overwhelmed',
    davidReaction: [
      "yeah… when it all piles up at once, it's hard to know where to even start.",
      "mm… overwhelmed is its own kind of exhaustion.",
      "man… sometimes the weight of everything hits you all at once.",
      "yeah… that feeling of too much and not enough at the same time.",
    ],
    davidFollowUps: [
      "what's been the biggest thing pressing on you?",
      "yeah… has it been building for a while, or did something tip it over?",
      "how are you doing physically through all of this?",
      "is there one thing — if it shifted — that would give you some room?",
    ],
    scriptures: [
      {
        reference: 'Psalm 61:2',
        verse: 'From the ends of the earth I call to you, I call as my heart grows faint; lead me to the rock that is higher than I.',
        davidIntro: "there's a line in Psalms I think about when everything feels like too much…",
        davidReflection: "lead me to the rock that is higher than I. sometimes you just need something solid to stand on when you can't find your footing.",
      },
      {
        reference: '2 Corinthians 12:9',
        verse: 'My grace is sufficient for you, for my power is made perfect in weakness.',
        davidIntro: "Paul writes about this in Corinthians — something God said to him when he was at his lowest…",
        davidReflection: "made perfect in weakness. not in spite of it. in it. that's a different way of looking at this.",
      },
      {
        reference: 'Isaiah 40:31',
        verse: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
        davidIntro: "there's a verse in Isaiah that people have been holding onto for centuries…",
        davidReflection: "renew their strength. not infinite energy — renewed. like something that gets restored when you stop trying to run on empty.",
      },
    ],
  },
  {
    key: 'HOPELESS',
    label: 'Hopeless',
    davidReaction: [
      "man… when it gets to that place, it's hard to see past it.",
      "yeah… hopelessness has a way of making the future disappear.",
      "mm… that's a heavy place to be sitting in.",
      "yeah… when it feels like nothing is going to change — that's a particular kind of tired.",
    ],
    davidFollowUps: [
      "how long have you been feeling like this?",
      "is there something specific that brought you to this point?",
      "yeah… are you safe right now?",
      "has it felt this dark before?",
    ],
    scriptures: [
      {
        reference: 'Jeremiah 29:11',
        verse: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.',
        davidIntro: "there's a verse — Jeremiah 29:11 — that people in dark seasons come back to…",
        davidReflection: "it's not a quick fix. it's more like a light you can barely see, but it's there. plans for a future and a hope — that was said to people who had lost almost everything.",
      },
      {
        reference: 'Lamentations 3:22-23',
        verse: "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
        davidIntro: "there's something in Lamentations — a book literally written in grief — that still manages to say this…",
        davidReflection: "new every morning. the person who wrote that was in ruins. and they still said it. that's not nothing.",
      },
      {
        reference: 'Romans 8:38-39',
        verse: 'For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers, neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God.',
        davidIntro: "Paul writes something in Romans that kind of takes your breath away…",
        davidReflection: "nothing in all creation. that's a wide list. and it still ends the same way — nothing. you can't fall far enough out of it.",
      },
    ],
  },
  {
    key: 'GRIEVING',
    label: 'Grieving',
    davidReaction: [
      "mm… grief is its own world. it doesn't move on anyone else's schedule.",
      "yeah… loss has a way of sitting with you even when everything else keeps moving.",
      "man… I'm sorry. that kind of pain is real.",
      "yeah… grief changes you. there's no way around it.",
    ],
    davidFollowUps: [
      "how long has it been?",
      "were you close?",
      "yeah… have you had people around you through this?",
      "what's the hardest part right now?",
    ],
    scriptures: [
      {
        reference: 'Psalm 34:18',
        verse: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.',
        davidIntro: "there's a line in Psalms that feels like it was written for exactly this…",
        davidReflection: "close to the brokenhearted. not watching from a distance. close.",
      },
      {
        reference: 'Revelation 21:4',
        verse: 'He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain.',
        davidIntro: "there's a promise at the end of Revelation that I come back to…",
        davidReflection: "every tear. not some. every one. that's the end of the story. and knowing that doesn't erase the grief now — but it means this isn't the final word.",
      },
      {
        reference: 'John 11:35',
        verse: 'Jesus wept.',
        davidIntro: "you know the shortest verse in the Bible?",
        davidReflection: "Jesus wept. at Lazarus's tomb. he knew he was about to raise him — and he still cried. grief isn't weakness. even Jesus sat in it.",
      },
    ],
  },
  {
    key: 'ANGRY',
    label: 'Angry',
    davidReaction: [
      "yeah… anger usually means something real underneath it.",
      "mm… some things deserve to make you angry.",
      "man… yeah. I hear that.",
      "yeah… anger doesn't come out of nowhere.",
    ],
    davidFollowUps: [
      "what happened?",
      "has this been building for a while?",
      "yeah… is this about one thing, or has it been piling up?",
      "is this something that's happened before?",
    ],
    scriptures: [
      {
        reference: 'Ephesians 4:26-27',
        verse: 'In your anger do not sin. Do not let the sun go down while you are still angry, and do not give the devil a foothold.',
        davidIntro: "there's a verse in Ephesians that's interesting because it doesn't tell you not to be angry…",
        davidReflection: "it starts with 'in your anger' — it assumes you're angry. it just says don't let it stay and grow into something that takes root.",
      },
      {
        reference: 'James 1:19-20',
        verse: 'Everyone should be quick to listen, slow to speak and slow to become angry, because human anger does not produce the righteousness that God desires.',
        davidIntro: "James says something about this that's hard to argue with…",
        davidReflection: "slow to anger doesn't mean never angry. it just means — let yourself hear the whole thing first.",
      },
    ],
  },
  {
    key: 'NUMB',
    label: 'Numb',
    davidReaction: [
      "mm… numb is its own kind of heavy. you'd almost rather feel something.",
      "yeah… when you stop feeling, sometimes that's just the mind protecting itself.",
      "man… numb is hard to explain to people. looks fine from the outside.",
      "yeah… sometimes feeling nothing is harder than feeling something.",
    ],
    davidFollowUps: [
      "how long has it been like this?",
      "did something happen, or did it just kind of creep in?",
      "yeah… are you still doing the regular things — eating, sleeping?",
      "what was the last thing you felt something about?",
    ],
    scriptures: [
      {
        reference: 'Psalm 42:5',
        verse: 'Why, my soul, are you downcast? Why so disturbed within me? Put your hope in God, for I will yet praise him, my Savior and my God.',
        davidIntro: "there's a Psalm where the writer is basically talking to himself, asking why he feels so far away…",
        davidReflection: "he doesn't pretend he's fine. he's honest about the distance. and he still says — I will yet praise him. not now. yet.",
      },
      {
        reference: 'Isaiah 43:2',
        verse: 'When you pass through the waters, I will be with you; and when you pass through the rivers, they will not sweep over you.',
        davidIntro: "there's a verse in Isaiah about going through hard seasons…",
        davidReflection: "when you pass through — not if. it's assumed you'll go through dark places. the promise is just: not alone.",
      },
    ],
  },
  {
    key: 'CONFUSED',
    label: 'Confused',
    davidReaction: [
      "yeah… sometimes not knowing which way to go is its own kind of stress.",
      "mm… confusion is really disorienting, especially when the stakes feel high.",
      "yeah… being unsure about something important wears on you.",
    ],
    davidFollowUps: [
      "what's the decision you're sitting with?",
      "yeah… is it a life-direction thing, or something more immediate?",
      "have you talked to anyone you trust about it?",
    ],
    scriptures: [
      {
        reference: 'Proverbs 3:5-6',
        verse: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
        davidIntro: "there's a Proverb that people in uncertain seasons come back to a lot…",
        davidReflection: "lean not on your own understanding — that's hard when you want clarity. but sometimes the trust comes before the path gets clear.",
      },
      {
        reference: 'Psalm 119:105',
        verse: 'Your word is a lamp for my feet, a light on my path.',
        davidIntro: "there's a verse about not being able to see the whole road…",
        davidReflection: "a lamp for my feet — not a floodlight for the whole journey. just enough light for the next step. sometimes that's all you get.",
      },
    ],
  },
  {
    key: 'HOPEFUL',
    label: 'Hopeful',
    davidReaction: [
      "yeah… hope is something. especially when things have been hard.",
      "mm… that's good. hold onto that.",
      "yeah… hope has a way of shifting everything slightly.",
    ],
    davidFollowUps: [
      "what's making you feel that way?",
      "yeah… something change recently?",
      "that's a good place to be. what's it about?",
    ],
    scriptures: [
      {
        reference: 'Jeremiah 29:11',
        verse: 'For I know the plans I have for you, declares the Lord, plans to give you hope and a future.',
        davidIntro: "there's a verse that was basically written for this feeling…",
        davidReflection: "plans to give you a future and a hope. that's the one people put on their walls — and it earns it.",
      },
    ],
  },
  {
    key: 'GRATEFUL',
    label: 'Grateful',
    davidReaction: [
      "mm… yeah. gratitude has a way of clearing things out a little.",
      "yeah… good. hold onto that.",
      "that's a good thing to feel.",
    ],
    davidFollowUps: [
      "what's been the thing you're most grateful for lately?",
      "yeah… did something specific happen?",
      "good to hear. what's been going right?",
    ],
    scriptures: [
      {
        reference: '1 Thessalonians 5:18',
        verse: "Give thanks in all circumstances; for this is God's will for you in Christ Jesus.",
        davidIntro: "there's a verse about this that's short but it's got some weight to it…",
        davidReflection: "in all circumstances. not just the good ones. that's harder than it sounds — but when you can do it, it really does change how things feel.",
      },
    ],
  },
  {
    key: 'JOYFUL',
    label: 'Joyful',
    davidReaction: [
      "mm… yeah. good.",
      "yeah… that kind of joy is worth sitting in for a minute.",
      "man, that's good to hear.",
    ],
    davidFollowUps: [
      "what's been happening?",
      "yeah… what made the difference?",
      "good. what's it about?",
    ],
    scriptures: [
      {
        reference: 'Nehemiah 8:10',
        verse: 'Do not grieve, for the joy of the Lord is your strength.',
        davidIntro: "there's a line in Nehemiah that I think about when things are actually going well…",
        davidReflection: "the joy of the Lord is your strength. not a nice feeling — strength. something to stand on.",
      },
    ],
  },
  {
    key: 'PEACEFUL',
    label: 'Peaceful',
    davidReaction: [
      "mm… peace is something. especially if things have been hard.",
      "yeah… that's good. peace is harder to come by than people think.",
    ],
    davidFollowUps: [
      "yeah… what's been making you feel peaceful?",
      "that's a good place. what shifted?",
    ],
    scriptures: [
      {
        reference: 'John 14:27',
        verse: 'Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.',
        davidIntro: "Jesus said something about peace that's different from the way the world uses that word…",
        davidReflection: "not as the world gives. the world's peace depends on things going well. this one is something underneath everything else.",
      },
    ],
  },
];

/** Returns a random scripture with full David delivery metadata for a given mood. */
export function getScriptureForMood(moodKey: string): Scripture | null {
  const mood = MOODS_DATA.find(m => m.key === moodKey.toUpperCase());
  if (!mood?.scriptures.length) return null;
  return mood.scriptures[Math.floor(Math.random() * mood.scriptures.length)];
}

/** Returns a random David reaction line for a given mood. */
export function getDavidReactionForMood(moodKey: string): string | null {
  const mood = MOODS_DATA.find(m => m.key === moodKey.toUpperCase());
  if (!mood?.davidReaction.length) return null;
  return mood.davidReaction[Math.floor(Math.random() * mood.davidReaction.length)];
}

/** Returns a random follow-up question David asks after sharing scripture. */
export function getDavidFollowUpForMood(moodKey: string): string | null {
  const mood = MOODS_DATA.find(m => m.key === moodKey.toUpperCase());
  if (!mood?.davidFollowUps.length) return null;
  return mood.davidFollowUps[Math.floor(Math.random() * mood.davidFollowUps.length)];
}

/**
 * Builds a complete David scripture response block for a mood.
 * Use this to inject into system context or pre-populate responses.
 */
export function buildDavidScriptureResponse(moodKey: string): string | null {
  const mood = MOODS_DATA.find(m => m.key === moodKey.toUpperCase());
  if (!mood?.scriptures.length || !mood.davidFollowUps.length) return null;
  const scripture = mood.scriptures[Math.floor(Math.random() * mood.scriptures.length)];
  const followUp = mood.davidFollowUps[Math.floor(Math.random() * mood.davidFollowUps.length)];
  if (!scripture || !followUp) return null;
  const bookName = scripture.reference.split(' ')[0];
  return [
    scripture.davidIntro,
    `'${scripture.verse}'`,
    `that's from ${bookName}. ${scripture.davidReflection}`,
    followUp,
  ].join('\n\n');
}