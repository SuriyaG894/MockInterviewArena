const request = require("supertest");
const app = require("./index");
const { getCompletion } = require("./llmProvider");

jest.mock("./llmProvider", () => ({
  getCompletion: jest.fn(),
}));

describe("Mock Interview Arena API Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Architect Role Tests", () => {
    it("should process an excellent answer and deal damage to the boss", async () => {
      getCompletion.mockResolvedValueOnce(
        JSON.stringify({
          dialogue: "Impressive system design. The microservices architecture is solid.",
          damageTo: "boss",
          damageAmount: 25,
        })
      );

      const response = await request(app)
        .post("/api/battle/turn")
        .send({
          bossId: "architect",
          userResponse: "I will use API Gateway for routing and Kafka for event streaming.",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        dialogue: "Impressive system design. The microservices architecture is solid.",
        damageTo: "boss",
        damageAmount: 25,
      });
      expect(getCompletion).toHaveBeenCalledTimes(1);
    });

    it("should process a poor answer and deal damage to the player", async () => {
      getCompletion.mockResolvedValueOnce(
        JSON.stringify({
          dialogue: "This introduces a single point of failure and does not scale.",
          damageTo: "player",
          damageAmount: 30,
        })
      );

      const response = await request(app)
        .post("/api/battle/turn")
        .send({
          bossId: "architect",
          userResponse: "I will store everything in a single SQLite file on a single server.",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        dialogue: "This introduces a single point of failure and does not scale.",
        damageTo: "player",
        damageAmount: 30,
      });
    });
  });

  describe("CTO Role Tests", () => {
    it("should process an excellent answer and deal damage to the boss", async () => {
      getCompletion.mockResolvedValueOnce(
        JSON.stringify({
          dialogue: "Great focus on maintainability, testing, and team velocity.",
          damageTo: "boss",
          damageAmount: 20,
        })
      );

      const response = await request(app)
        .post("/api/battle/turn")
        .send({
          bossId: "cto",
          userResponse: "I will implement CI/CD with automated testing to improve velocity.",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        dialogue: "Great focus on maintainability, testing, and team velocity.",
        damageTo: "boss",
        damageAmount: 20,
      });
    });

    it("should process a poor answer and deal damage to the player", async () => {
      getCompletion.mockResolvedValueOnce(
        JSON.stringify({
          dialogue: "This approach lacks any code reviews or testing strategy. It will lead to technical debt.",
          damageTo: "player",
          damageAmount: 40,
        })
      );

      const response = await request(app)
        .post("/api/battle/turn")
        .send({
          bossId: "cto",
          userResponse: "Let's push directly to production on Friday without testing.",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        dialogue: "This approach lacks any code reviews or testing strategy. It will lead to technical debt.",
        damageTo: "player",
        damageAmount: 40,
      });
    });
  });

  describe("PM Role Tests", () => {
    it("should process an excellent answer and deal damage to the boss", async () => {
      getCompletion.mockResolvedValueOnce(
        JSON.stringify({
          dialogue: "Excellent product strategy and MVP prioritization.",
          damageTo: "pm",
          damageAmount: 25,
        })
      );

      const response = await request(app)
        .post("/api/battle/turn")
        .send({
          bossId: "pm",
          userResponse: "I will launch a simple MVP first focusing on user onboarding.",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        dialogue: "Excellent product strategy and MVP prioritization.",
        damageTo: "boss",
        damageAmount: 25,
      });
    });
  });

  describe("QA Role Tests", () => {
    it("should process a poor answer and deal damage to the player", async () => {
      getCompletion.mockResolvedValueOnce(
        JSON.stringify({
          dialogue: "This misses critical security practices.",
          damageTo: "player",
          damageAmount: 35,
        })
      );

      const response = await request(app)
        .post("/api/battle/turn")
        .send({
          bossId: "qa",
          userResponse: "I will just call the charge API and assume it works.",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        dialogue: "This misses critical security practices.",
        damageTo: "player",
        damageAmount: 35,
      });
    });

    it("should process an excellent answer and deal damage to the boss", async () => {
      getCompletion.mockResolvedValueOnce(
        JSON.stringify({
          dialogue: "Excellent test coverage design. Using transaction isolation and idempotency keys will completely prevent double charges.",
          damageTo: "boss",
          damageAmount: 40,
        })
      );

      const response = await request(app)
        .post("/api/battle/turn")
        .send({
          bossId: "qa",
          userResponse: "I will use transaction isolation levels, idempotency keys, and automated chaos testing.",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        dialogue: "Excellent test coverage design. Using transaction isolation and idempotency keys will completely prevent double charges.",
        damageTo: "boss",
        damageAmount: 40,
      });
    });
  });

  describe("Validation & Error Handling", () => {
    it("should return 400 if bossId or userResponse is missing", async () => {
      const response = await request(app)
        .post("/api/battle/turn")
        .send({
          userResponse: "Hello",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("bossId and userResponse are required");
    });

    it("should handle LLM connection failure and return faltered message", async () => {
      getCompletion.mockRejectedValueOnce(new Error("Network Timeout"));

      const response = await request(app)
        .post("/api/battle/turn")
        .send({
          bossId: "architect",
          userResponse: "Test network error handling.",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        dialogue: "The arena's connection to the evaluation engine faltered. Try again.",
        damageTo: "none",
        damageAmount: 0,
      });
    });

    it("should parse JSON response containing markdown code fences correctly", async () => {
      getCompletion.mockResolvedValueOnce(
        "```json\n" +
        '{"dialogue": "Clean architecture response.", "damageTo": "boss", "damageAmount": 15}\n' +
        "```"
      );

      const response = await request(app)
        .post("/api/battle/turn")
        .send({
          bossId: "cto",
          userResponse: "Using clean architecture principles.",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        dialogue: "Clean architecture response.",
        damageTo: "boss",
        damageAmount: 15,
      });
    });

    it("should handle malformed JSON from LLM and return fallback message", async () => {
      getCompletion.mockResolvedValueOnce("this is not json at all");

      const response = await request(app)
        .post("/api/battle/turn")
        .send({
          bossId: "cto",
          userResponse: "Test malformed JSON.",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        dialogue: "Could not parse the evaluation. The arena is confused.",
        damageTo: "none",
        damageAmount: 0,
      });
    });

    it("should parse camelCase and snake_case keys correctly and map capitalized role names", async () => {
      getCompletion.mockResolvedValueOnce(
        JSON.stringify({
          dialogue: "This is a robustness test.",
          damage_to: "Player",
          damage_amount: "25",
        })
      );

      const response = await request(app)
        .post("/api/battle/turn")
        .send({
          bossId: "architect",
          userResponse: "Testing casing and type conversions.",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        dialogue: "This is a robustness test.",
        damageTo: "player",
        damageAmount: 25,
      });
    });

    it("should correctly handle synonyms like candidate/interviewer", async () => {
      getCompletion.mockResolvedValueOnce(
        JSON.stringify({
          critique: "Great answer.",
          damageTarget: "interviewer",
          damage: 15,
        })
      );

      const response = await request(app)
        .post("/api/battle/turn")
        .send({
          bossId: "cto",
          userResponse: "Testing synonyms.",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        dialogue: "Great answer.",
        damageTo: "boss",
        damageAmount: 15,
      });
    });
  });

  describe("Start Battle Challenge Generation", () => {
    it("should generate a dynamic challenge for a selected boss and difficulty", async () => {
      getCompletion.mockResolvedValueOnce(
        "Design a simple payment API with basic token authentication."
      );

      const response = await request(app)
        .post("/api/battle/start")
        .send({
          bossId: "qa",
          difficulty: "easy",
        });

      expect(response.status).toBe(200);
      expect(response.body.challenge).toBe(
        "Design a simple payment API with basic token authentication."
      );
      expect(response.body.welcomeMessage).toContain("Challenge:");
    });

    it("should return 400 if bossId or difficulty is missing", async () => {
      const response = await request(app)
        .post("/api/battle/start")
        .send({
          bossId: "qa",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("bossId and difficulty are required");
    });
  });
});
