/* Sample catalog data for Anime Pakistan (demo) */
const HERO_SLIDES = [
  {
    id: "grave-of-the-fireflies",
    title: "Grave of the Fireflies",
    type: "Movie",
    genres: "Drama · War",
    desc: "Watch this featured title with Urdu and Hindi audio options.",
    langs: ["Hindi", "Urdu"],
    image: "https://image.tmdb.org/t/p/w1280/aHaqZpOL7UyVu0nKqp3SMz0o2E1.jpg",
    poster: "https://image.tmdb.org/t/p/w500/qG3RYlIEn7F5JEW8JQrTLqV0eq1.jpg"
  },
  {
    id: "digimon-tri-1",
    title: "Digimon Adventure tri. Part 1: Reunion",
    type: "Movie",
    genres: "Action · Adventure · Drama",
    desc: "Watch this featured title with Urdu and Hindi audio options.",
    langs: ["Hindi", "Urdu"],
    image: "https://image.tmdb.org/t/p/w1280/8C34YTylNBt4DWM1a9oAAXqmTSr.jpg",
    poster: "https://image.tmdb.org/t/p/w500/8C34YTylNBt4DWM1a9oAAXqmTSr.jpg"
  },
  {
    id: "smurfs-magic-flute",
    title: "The Smurfs and the Magic Flute",
    type: "Movie",
    genres: "Adventure · Fantasy",
    desc: "Watch this featured title with Urdu and Hindi audio options.",
    langs: ["Hindi", "Urdu"],
    image: "https://image.tmdb.org/t/p/w1280/9pfqNpz2YRdLgg5FUKVbWzz5fLR.jpg",
    poster: "https://image.tmdb.org/t/p/w500/9pfqNpz2YRdLgg5FUKVbWzz5fLR.jpg"
  }
];

const CONTINUE_WATCHING = [
  { id: "solo-leveling", title: "Solo Leveling", ep: "S2 E1 · Solo Leveling 2x1", progress: 14, image: "https://image.tmdb.org/t/p/w500/geCRueV3ElhRTv0qXIQnXp6nRQg.jpg" },
  { id: "digimon-tri-1", title: "Digimon Adventure tri. Part 1", ep: "Movie", progress: 4, image: "https://image.tmdb.org/t/p/w500/8C34YTylNBt4DWM1a9oAAXqmTSr.jpg" },
  { id: "scooby-doo", title: "Scooby-Doo! The Mystery Begins", ep: "Movie", progress: 4, image: "https://image.tmdb.org/t/p/w500/sM7zYE6xOmaNwC28LR7cEneAtuN.jpg" },
  { id: "digimon-tri-2", title: "Digimon Adventure tri. Part 2", ep: "Movie", progress: 4, image: "https://image.tmdb.org/t/p/w500/pZIqoUstOEyaoImA1Uk3lSNO5hq.jpg" }
];

const TRENDING_SERIES = [
  { id: "one-piece", title: "One Piece", type: "SERIES", langs: ["English", "Hindi"], episodes: "1155+", poster: "https://image.tmdb.org/t/p/w500/cMD9Ygz11zjJzAovJrAGbKJNm9A.jpg" },
  { id: "barbie-dreamtopia", title: "Barbie Dreamtopia", type: "SERIES", langs: ["Hindi", "Urdu"], episodes: "26", poster: "https://image.tmdb.org/t/p/w500/uiIB9ctqZFbfRXXimtpmZb5dusi.jpg" },
  { id: "nippon-sangoku", title: "NIPPON SANGOKU: The Three Nations", type: "SERIES", langs: ["Hindi", "Urdu"], episodes: "12", poster: "https://image.tmdb.org/t/p/w500/3uKI0bZuzYOb5SGsc9g1flr3xsq.jpg" },
  { id: "batfam", title: "BAT-FAM", type: "SERIES", langs: ["Hindi", "Urdu"], episodes: "10", poster: "https://image.tmdb.org/t/p/w500/qx3SJlAp2RK656TusqKx1qEqVMW.jpg" },
  { id: "cinderella-chef", title: "Cinderella Chef", type: "SERIES", langs: ["Hindi", "Urdu"], episodes: "24", poster: "https://image.tmdb.org/t/p/w500/adLuRUaIzy44nUExYjUix2ZKjqM.jpg" },
  { id: "power-rangers", title: "Power Rangers", type: "SERIES", langs: ["Hindi", "Urdu"], episodes: "538+", poster: "https://image.tmdb.org/t/p/w500/ql9YpFD8J1zeWzLMHHjp4nKKD4n.jpg" },
  { id: "taisho-era", title: "Taisho Era Contract Marriage", type: "SERIES", langs: ["Hindi", "Urdu"], episodes: "8", poster: "https://image.tmdb.org/t/p/w500/e5T5tLm2EqzfjxhYNEchcuzyLcs.jpg" }
];

const POPULAR_MOVIES = [
  { id: "grave-of-the-fireflies", title: "Grave of the Fireflies", type: "MOVIE", langs: ["Hindi", "Urdu"], poster: "https://image.tmdb.org/t/p/w500/qG3RYlIEn7F5JEW8JQrTLqV0eq1.jpg" },
  { id: "mha-youre-next", title: "My Hero Academia: You're Next", type: "MOVIE", langs: ["Hindi", "Urdu"], poster: "https://image.tmdb.org/t/p/w500/gL8OdtyhWQ9i8vY7CbmJtqSbMPC.jpg" },
  { id: "digimon-tri-1", title: "Digimon Adventure tri. Part 1: Reunion", type: "MOVIE", langs: ["Hindi", "Urdu"], poster: "https://image.tmdb.org/t/p/w500/8C34YTylNBt4DWM1a9oAAXqmTSr.jpg" },
  { id: "digimon-tri-2", title: "Digimon Adventure tri. Part 2", type: "MOVIE", langs: ["Hindi", "Urdu"], poster: "https://image.tmdb.org/t/p/w500/pZIqoUstOEyaoImA1Uk3lSNO5hq.jpg" },
  { id: "scooby-doo", title: "Scooby-Doo! The Mystery Begins", type: "MOVIE", langs: ["Hindi", "Urdu"], poster: "https://image.tmdb.org/t/p/w500/sM7zYE6xOmaNwC28LR7cEneAtuN.jpg" },
  { id: "smurfs-magic-flute", title: "The Smurfs and the Magic Flute", type: "MOVIE", langs: ["Hindi", "Urdu"], poster: "https://image.tmdb.org/t/p/w500/9pfqNpz2YRdLgg5FUKVbWzz5fLR.jpg" },
  { id: "smurfs", title: "Smurfs", type: "MOVIE", langs: ["Hindi", "Urdu"], poster: "https://image.tmdb.org/t/p/w500/qoW507a8RoGbpILCxt2N87USn8H.jpg" }
];

const TOP_RATED = [
  ...POPULAR_MOVIES.slice(0, 6)
];

const CARTOONS = [
  { id: "mahavatar-narsimha", title: "Mahavatar Narsimha", type: "MOVIE", langs: ["Hindi", "Urdu"], poster: "https://image.tmdb.org/t/p/w500/bADzMfofNWYdxLnlqNuMkO6du34.jpg" },
  { id: "ben10-alien", title: "Ben 10: Alien X-Tinction", type: "MOVIE", langs: ["Hindi", "Urdu"], poster: "https://image.tmdb.org/t/p/w500/lZQKzmE3P5CJ9Bj0wK4jMZuengp.jpg" },
  { id: "ben10-010", title: "Ben 10.010", type: "MOVIE", langs: ["Hindi", "Urdu"], poster: "https://image.tmdb.org/t/p/w500/jjk6nHiZGlRu2f6fWyjNWL0hp0k.jpg" },
  { id: "ben10-heroes", title: "Ben 10 / Generator Rex: Heroes United", type: "MOVIE", langs: ["Hindi", "Urdu"], poster: "https://image.tmdb.org/t/p/w500/k9tv1rXZbOhH7eiCk378x61kNQ1.jpg" },
  { id: "doraemon-dinosaur", title: "Doraemon: Nobita's New Dinosaur", type: "MOVIE", langs: ["Hindi", "Urdu"], poster: "https://image.tmdb.org/t/p/w500/tTrI6PwqzxkgO3dvQ7BEKXM7SYR.jpg" },
  { id: "lego-marvel", title: "LEGO Marvel Super Heroes", type: "MOVIE", langs: ["Hindi", "Urdu"], poster: "https://image.tmdb.org/t/p/w500/6aDh4yH5FHaMfjdsqw4n97rl7FJ.jpg" }
];

const ALL_CATALOG = [
  ...TRENDING_SERIES,
  ...POPULAR_MOVIES,
  ...CARTOONS,
  { id: "solo-leveling", title: "Solo Leveling", type: "SERIES", langs: ["English", "Hindi", "Japanese", "Tamil", "Telugu"], episodes: "25", poster: "https://image.tmdb.org/t/p/w500/geCRueV3ElhRTv0qXIQnXp6nRQg.jpg", genres: ["Action", "Adult Cast", "Adventure", "Fantasy", "Super Power"] }
];

const SOLO_LEVELING = {
  id: "solo-leveling",
  title: "Solo Leveling",
  type: "SERIES",
  genres: ["Action", "Adult Cast", "Adventure", "Fantasy", "Super Power"],
  langs: ["English", "Hindi", "Japanese", "Tamil", "Telugu"],
  poster: "https://image.tmdb.org/t/p/w500/geCRueV3ElhRTv0qXIQnXp6nRQg.jpg",
  overview: "Details for this anime will be added soon.",
  seasons: [
    {
      name: "Season 1",
      episodes: Array.from({ length: 12 }, (_, i) => ({
        num: `S1 E${i + 1}`,
        title: `Solo Leveling 1x${i + 1}`,
        id: `solo-leveling-1x${i + 1}`
      }))
    },
    {
      name: "Season 2",
      episodes: Array.from({ length: 13 }, (_, i) => ({
        num: `S2 E${i + 1}`,
        title: `Solo Leveling 2x${i + 1}`,
        id: `solo-leveling-2x${i + 1}`
      }))
    }
  ]
};
