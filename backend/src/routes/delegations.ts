import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";

export const delegationsRouter = Router();

delegationsRouter.use(requireAuth);

delegationsRouter.get("/", (_request, response) => {
  response.status(501).json({ code: "NOT_IMPLEMENTED", message: "Delegation listing is implemented in User Story 3" });
});

delegationsRouter.post("/", (_request, response) => {
  response.status(501).json({ code: "NOT_IMPLEMENTED", message: "Delegation creation is implemented in User Story 3" });
});

delegationsRouter.post("/:delegationId/revoke", (_request, response) => {
  response.status(501).json({ code: "NOT_IMPLEMENTED", message: "Delegation revocation is implemented in User Story 3" });
});
