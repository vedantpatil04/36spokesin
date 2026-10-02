import { bearer } from "./fixtures.js";
import { API, type Http } from "./test-app.js";

let sequence = 0;

export async function createDestination(
  http: Http,
  token: string,
  body: Record<string, unknown> = {},
) {
  sequence += 1;
  const response = await http
    .post(`${API}/admin/destinations`)
    .set(bearer(token))
    .send({
      name: `Destination ${sequence}`,
      region: "Himachal Pradesh",
      difficulty: "CHALLENGING",
      ...body,
    });
  if (response.status !== 201)
    throw new Error(`createDestination: ${response.status} ${JSON.stringify(response.body)}`);
  return response.body.data as { id: string; slug: string };
}

export async function createRide(http: Http, token: string, body: Record<string, unknown> = {}) {
  sequence += 1;
  const response = await http
    .post(`${API}/admin/rides`)
    .set(bearer(token))
    .send({
      title: `Ride ${sequence}`,
      type: "DAY_RIDE",
      location: "Pune",
      meetingPoint: "Chandni Chowk fuel station",
      startsAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      difficulty: "MODERATE",
      capacity: 10,
      status: "UPCOMING",
      ...body,
    });
  if (response.status !== 201)
    throw new Error(`createRide: ${response.status} ${JSON.stringify(response.body)}`);
  return response.body.data as { id: string; slug: string };
}
