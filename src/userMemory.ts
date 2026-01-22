export class UserMemory {
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request) {
    if (request.method === "POST") {
      const data = await request.json();
      await this.state.storage.put("memory", data);
      return Response.json({ ok: true }); // ✅ Return JSON response
    }

    const memory = await this.state.storage.get("memory");
    return Response.json(memory || { history: [] }); // ✅ Return JSON with history array
  }
}