export interface TrackedProfile {
  id: string;
  username: string;
  fullName: string;
  profilePicUrl: string;
  followingCount: number;
  followerCount: number;
  isPublic: boolean;
  isActive: boolean;
  newFollowsToday: number;
  newUnfollowsToday: number;
}

export interface FollowEvent {
  id: string;
  profileId: string;
  profileUsername: string;
  profilePicUrl: string;
  targetUsername: string;
  targetFullName: string;
  targetProfilePicUrl: string;
  targetIsVerified: boolean;
  eventType: 'follow' | 'unfollow';
  detectedAt: string;
  isRead: boolean;
}

export const mockProfiles: TrackedProfile[] = [
  {
    id: '1',
    username: 'selenagomez',
    fullName: 'Selena Gomez',
    profilePicUrl: 'https://i.pravatar.cc/150?img=1',
    followingCount: 284,
    followerCount: 429000000,
    isPublic: true,
    isActive: true,
    newFollowsToday: 3,
    newUnfollowsToday: 1,
  },
  {
    id: '2',
    username: 'champagnepapi',
    fullName: 'Drake',
    profilePicUrl: 'https://i.pravatar.cc/150?img=3',
    followingCount: 1843,
    followerCount: 146000000,
    isPublic: true,
    isActive: true,
    newFollowsToday: 7,
    newUnfollowsToday: 0,
  },
  {
    id: '3',
    username: 'zendaya',
    fullName: 'Zendaya',
    profilePicUrl: 'https://i.pravatar.cc/150?img=5',
    followingCount: 482,
    followerCount: 185000000,
    isPublic: true,
    isActive: true,
    newFollowsToday: 0,
    newUnfollowsToday: 2,
  },
];

export const mockEvents: FollowEvent[] = [
  {
    id: 'e1',
    profileId: '1',
    profileUsername: 'selenagomez',
    profilePicUrl: 'https://i.pravatar.cc/150?img=1',
    targetUsername: 'tanamongeau',
    targetFullName: 'Tana Mongeau',
    targetProfilePicUrl: 'https://i.pravatar.cc/150?img=10',
    targetIsVerified: true,
    eventType: 'follow',
    detectedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    isRead: false,
  },
  {
    id: 'e2',
    profileId: '2',
    profileUsername: 'champagnepapi',
    profilePicUrl: 'https://i.pravatar.cc/150?img=3',
    targetUsername: 'lilbaby',
    targetFullName: 'Lil Baby',
    targetProfilePicUrl: 'https://i.pravatar.cc/150?img=11',
    targetIsVerified: true,
    eventType: 'follow',
    detectedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    isRead: false,
  },
  {
    id: 'e3',
    profileId: '1',
    profileUsername: 'selenagomez',
    profilePicUrl: 'https://i.pravatar.cc/150?img=1',
    targetUsername: 'justinbieber',
    targetFullName: 'Justin Bieber',
    targetProfilePicUrl: 'https://i.pravatar.cc/150?img=12',
    targetIsVerified: true,
    eventType: 'unfollow',
    detectedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    isRead: true,
  },
  {
    id: 'e4',
    profileId: '2',
    profileUsername: 'champagnepapi',
    profilePicUrl: 'https://i.pravatar.cc/150?img=3',
    targetUsername: 'model_xyz',
    targetFullName: 'Mystery Model',
    targetProfilePicUrl: 'https://i.pravatar.cc/150?img=20',
    targetIsVerified: false,
    eventType: 'follow',
    detectedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    isRead: true,
  },
  {
    id: 'e5',
    profileId: '3',
    profileUsername: 'zendaya',
    profilePicUrl: 'https://i.pravatar.cc/150?img=5',
    targetUsername: 'tomholland',
    targetFullName: 'Tom Holland',
    targetProfilePicUrl: 'https://i.pravatar.cc/150?img=15',
    targetIsVerified: true,
    eventType: 'unfollow',
    detectedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    isRead: true,
  },
  {
    id: 'e6',
    profileId: '2',
    profileUsername: 'champagnepapi',
    profilePicUrl: 'https://i.pravatar.cc/150?img=3',
    targetUsername: 'rihanna',
    targetFullName: 'Rihanna',
    targetProfilePicUrl: 'https://i.pravatar.cc/150?img=25',
    targetIsVerified: true,
    eventType: 'follow',
    detectedAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    isRead: true,
  },
];

export const mockChartData = [
  { day: 'Mo', follows: 4, unfollows: 1 },
  { day: 'Di', follows: 7, unfollows: 2 },
  { day: 'Mi', follows: 3, unfollows: 0 },
  { day: 'Do', follows: 8, unfollows: 3 },
  { day: 'Fr', follows: 5, unfollows: 1 },
  { day: 'Sa', follows: 12, unfollows: 4 },
  { day: 'So', follows: 6, unfollows: 2 },
];
