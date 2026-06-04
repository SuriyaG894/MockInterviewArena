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

    it("should return validation error dialogue and 0 damage if user response is too short or lacks alphanumeric characters", async () => {
      const response = await request(app)
        .post("/api/battle/turn")
        .send({
          bossId: "architect",
          userResponse: ".",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        dialogue: "That response is too short or meaningless. Please provide a substantive answer to the challenge.",
        damageTo: "none",
        damageAmount: 0,
      });

      const response2 = await request(app)
        .post("/api/battle/turn")
        .send({
          bossId: "architect",
          userResponse: "@#$%^&*",
        });

      expect(response2.status).toBe(200);
      expect(response2.body).toEqual({
        dialogue: "That response is too short or meaningless. Please provide a substantive answer to the challenge.",
        damageTo: "none",
        damageAmount: 0,
      });

      expect(getCompletion).not.toHaveBeenCalled();
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
        JSON.stringify({ question: "Design a simple payment API with basic token authentication." })
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

  describe("Candidate Profile Logic", () => {
    it("should inject candidate profile instructions into the system prompt during challenge generation", async () => {
      getCompletion.mockResolvedValueOnce(
        JSON.stringify({ question: "Spring Boot question." })
      );

      const response = await request(app)
        .post("/api/battle/start")
        .send({
          bossId: "cto",
          difficulty: "medium",
          candidateProfile: "Java Spring Boot dev",
        });

      expect(response.status).toBe(200);
      expect(getCompletion).toHaveBeenCalledTimes(1);
      const firstArg = getCompletion.mock.calls[0][0];
      expect(firstArg).toContain("THE CANDIDATE PROFILE / BACKGROUND");
      expect(firstArg).toContain("Java Spring Boot dev");
    });

    it("should inject candidate profile instructions into the system prompt during turn evaluation", async () => {
      getCompletion.mockResolvedValueOnce(
        JSON.stringify({
          dialogue: "Spring Boot evaluation critique.",
          damageTo: "boss",
          damageAmount: 20,
        })
      );

      const response = await request(app)
        .post("/api/battle/turn")
        .send({
          bossId: "cto",
          userResponse: "I will use `@SpringBootApplication` and auto-configure dependencies.",
          difficulty: "medium",
          candidateProfile: "Java Spring Boot dev",
        });

      expect(response.status).toBe(200);
      expect(getCompletion).toHaveBeenCalledTimes(1);
      const firstArg = getCompletion.mock.calls[0][0];
      expect(firstArg).toContain("THE CANDIDATE PROFILE / BACKGROUND");
      expect(firstArg).toContain("Java Spring Boot dev");
      expect(firstArg).toContain("cross-examine their answers against their claimed stack");
    });
  });

  describe("verifyAndExtractResume logic", () => {
    it("should successfully verify a valid resume and return the extracted summary", async () => {
      getCompletion.mockResolvedValueOnce(
        JSON.stringify({
          isResume: true,
          extractedContent: "Extracted Java backend developer summary.",
        })
      );

      const { verifyAndExtractResume } = require("./agent");
      const result = await verifyAndExtractResume(
        "Suriya G. Software Engineer. Skills: Java, Spring Boot, Postgres. Experience: 3 years building payment gateways."
      );

      expect(result).toBe("Extracted Java backend developer summary.");
      expect(getCompletion).toHaveBeenCalledTimes(1);
      const prompt = getCompletion.mock.calls[0][0];
      expect(prompt).toContain("Classification");
      expect(prompt).toContain("Extraction");
    });

    it("should throw an error if the LLM identifies the document as a non-resume", async () => {
      getCompletion.mockResolvedValueOnce(
        JSON.stringify({
          isResume: false,
          extractedContent: "The document is a restaurant receipt for coffee and pastries.",
        })
      );

      const { verifyAndExtractResume } = require("./agent");
      
      await expect(
        verifyAndExtractResume("Starbucks Coffee Company Receipt. Order ID: #1002345. Date: 2026-06-03. Items: 1x Latte ($4.50), 1x Croissant ($3.50), 1x Blueberry Muffin ($3.75). Total: $12.77. Thank you!")
      ).rejects.toThrow("The document is a restaurant receipt for coffee and pastries.");
    });
  });

  describe("Report Card Generation logic", () => {
    it("should successfully generate a report card for a combat session", async () => {
      const mockReport = {
        overallVerdict: {
          status: "PASS",
          overallScore: 85,
          summary: "Great job overall. You scale well.",
        },
        categories: [
          {
            name: "Technical Accuracy & Logic",
            score: 4,
            maxScore: 5,
            feedback: "Solid explanation.",
            strengths: ["Clean logic"],
            improvements: ["Detail performance bounds"],
          },
        ],
        skillsMatrix: [
          {
            skill: "System Design",
            proficiency: "Advanced",
            status: "Targeted",
            comments: "Demonstrated scalability awareness.",
          },
        ],
        timelineFeedback: [
          {
            turnIndex: 1,
            candidateAnswerSummary: "Proposed microservices.",
            scoreImpact: "+10",
            critique: "Excellent approach.",
          },
        ],
      };

      getCompletion.mockResolvedValueOnce(JSON.stringify(mockReport));

      const response = await request(app)
        .post("/api/battle/report")
        .send({
          bossId: "architect",
          battleLog: [
            { sender: "player", text: "I will use microservices and database sharding." },
            { sender: "boss", text: "How will you handle split-brain in your shard setup?" },
          ],
          difficulty: "hard",
          candidateProfile: "Backend architect",
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockReport);
      expect(getCompletion).toHaveBeenCalledTimes(1);
      const prompt = getCompletion.mock.calls[0][0];
      expect(prompt).toContain("nitpicking System Architect");
      expect(prompt).toContain("Candidate Feedback Matrix");
    });

    it("should return 400 if bossId or battleLog is missing or invalid", async () => {
      const response = await request(app)
        .post("/api/battle/report")
        .send({
          bossId: "cto",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("bossId and battleLog are required");
    });
  });
});
