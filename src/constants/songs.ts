export interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  moods: string[];
  coverUrl: string;
}

export const WORSHIP_SONGS: Song[] = [
  {
    id: '1',
    title: 'Way Maker',
    artist: 'Leeland',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Placeholder audio
    moods: ['HOPEFUL', 'GRATEFUL', 'LONELY'],
    coverUrl: 'https://picsum.photos/seed/waymaker/300/300'
  },
  {
    id: '2',
    title: 'Goodness of God',
    artist: 'Bethel Music',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    moods: ['GRATEFUL', 'HOPEFUL'],
    coverUrl: 'https://picsum.photos/seed/goodness/300/300'
  },
  {
    id: '3',
    title: 'It Is Well',
    artist: 'Kristene DiMarco',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    moods: ['ANXIOUS', 'SAD', 'HOPEFUL'],
    coverUrl: 'https://picsum.photos/seed/itiswell/300/300'
  },
  {
    id: '4',
    title: 'Rescue',
    artist: 'Lauren Daigle',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    moods: ['LONELY', 'SAD', 'ANXIOUS'],
    coverUrl: 'https://picsum.photos/seed/rescue/300/300'
  },
  {
    id: '5',
    title: 'Graves Into Gardens',
    artist: 'Elevation Worship',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    moods: ['GRATEFUL', 'HOPEFUL', 'ANGRY'],
    coverUrl: 'https://picsum.photos/seed/graves/300/300'
  },
  {
    id: '6',
    title: 'Peace Be Still',
    artist: 'The Belonging Co',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    moods: ['ANXIOUS', 'ANGRY'],
    coverUrl: 'https://picsum.photos/seed/peace/300/300'
  }
];
