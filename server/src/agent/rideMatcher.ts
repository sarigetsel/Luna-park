import Ride, { IRide } from '../models/Ride';

export function normalize(text: string): string {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function matchRideInList(rides: IRide[], rideName: string): IRide | null {
  const query = normalize(rideName);
  if (!query) return null;

  let match = rides.find((ride) => normalize(ride.name) === query);
  if (match) return match;

  match = rides.find((ride) => normalize(ride.name).includes(query));
  if (match) return match;

  match = rides.find((ride) => query.includes(normalize(ride.name)));
  if (match) return match;

  const words = query.split(/\s+/).filter((word) => word.length > 1);
  if (words.length) {
    match = rides.find((ride) => {
      const name = normalize(ride.name);
      return words.every((word) => name.includes(word));
    });
    if (match) return match;
  }

  return null;
}

export async function findRideByName(rideName: string): Promise<IRide | null> {
  const rides = await Ride.find({ status: 'active' }).sort({ name: 1 });
  return matchRideInList(rides, rideName);
}

/** Admin CRUD — matches active and maintenance rides */
export async function findRideByNameAny(rideName: string): Promise<IRide | null> {
  const rides = await Ride.find({}).sort({ name: 1 });
  return matchRideInList(rides, rideName);
}

export async function suggestRideNames(limit = 5, allStatuses = false): Promise<string[]> {
  const filter = allStatuses ? {} : { status: 'active' as const };
  const rides = await Ride.find(filter).select('name').sort({ name: 1 }).limit(limit);
  return rides.map((ride) => ride.name);
}
