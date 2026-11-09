export const WORD_PAIRS = [
  // Food & Drink
  ['Coffee', 'Tea'],
  ['Pizza', 'Pasta'],
  ['Burger', 'Sandwich'],
  ['Sushi', 'Sashimi'],
  ['Cake', 'Pie'],
  ['Beer', 'Wine'],
  ['Chocolate', 'Caramel'],
  ['Pancake', 'Waffle'],
  ['Soup', 'Stew'],
  ['Lemonade', 'Iced Tea'],

  // Places
  ['Beach', 'Pool'],
  ['Library', 'Bookstore'],
  ['Airport', 'Train Station'],
  ['Hospital', 'Clinic'],
  ['Museum', 'Gallery'],
  ['Gym', 'Park'],
  ['Hotel', 'Motel'],
  ['Mall', 'Market'],
  ['Office', 'Coworking Space'],
  ['Stadium', 'Arena'],

  // Music & Instruments
  ['Guitar', 'Ukulele'],
  ['Piano', 'Keyboard'],
  ['Drums', 'Bongos'],
  ['Violin', 'Cello'],
  ['Trumpet', 'Saxophone'],

  // Animals
  ['Dog', 'Wolf'],
  ['Cat', 'Lion'],
  ['Dolphin', 'Whale'],
  ['Eagle', 'Hawk'],
  ['Frog', 'Toad'],
  ['Rabbit', 'Hare'],
  ['Alligator', 'Crocodile'],
  ['Butterfly', 'Moth'],

  // Activities
  ['Hiking', 'Climbing'],
  ['Swimming', 'Diving'],
  ['Painting', 'Drawing'],
  ['Running', 'Jogging'],
  ['Yoga', 'Pilates'],
  ['Camping', 'Glamping'],
  ['Skiing', 'Snowboarding'],
  ['Boxing', 'Wrestling'],

  // Things
  ['Couch', 'Recliner'],
  ['Laptop', 'Tablet'],
  ['Bicycle', 'Motorcycle'],
  ['Candle', 'Lamp'],
  ['Mirror', 'Window'],
  ['Umbrella', 'Parasol'],
  ['Backpack', 'Suitcase'],
  ['Watch', 'Clock'],
  ['Newspaper', 'Magazine'],
  ['Pen', 'Pencil'],

  // Work & Office
  ['Meeting', 'Conference'],
  ['Email', 'Text Message'],
  ['Spreadsheet', 'Database'],
  ['Presentation', 'Speech'],
  ['Intern', 'Apprentice'],
  ['Promotion', 'Raise'],
  ['Interview', 'Audition'],
  ['Resume', 'Portfolio'],

  // Seasons & Weather
  ['Rain', 'Snow'],
  ['Sunrise', 'Sunset'],
  ['Thunder', 'Lightning'],
  ['Autumn', 'Spring'],
  ['Fog', 'Mist'],
  ['Tornado', 'Hurricane'],

  // Entertainment
  ['Movie', 'TV Show'],
  ['Concert', 'Festival'],
  ['Board Game', 'Card Game'],
  ['Podcast', 'Radio Show'],
  ['Novel', 'Short Story'],
  ['Comedy', 'Sitcom'],
  ['Cartoon', 'Anime'],
  ['Theater', 'Cinema'],

  // Clothing
  ['Sneakers', 'Sandals'],
  ['Jacket', 'Sweater'],
  ['Jeans', 'Khakis'],
  ['Hat', 'Cap'],
  ['Scarf', 'Shawl'],
];

export function getRandomPair(excludeIndices = []) {
  const available = WORD_PAIRS.filter((_, i) => !excludeIndices.includes(i));
  if (available.length === 0) return WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
  return available[Math.floor(Math.random() * available.length)];
}
