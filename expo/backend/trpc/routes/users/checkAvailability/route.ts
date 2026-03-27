import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/services/firebase";

const inputSchema = z.object({
  pseudo: z.string().trim().min(1).max(50).optional(),
  email: z.string().trim().email().optional(),
}).refine((data) => !!data.pseudo || !!data.email, {
  message: "At least one of pseudo or email is required",
});

const route = publicProcedure
  .input(inputSchema)
  .query(async ({ input }) => {
    const result: { pseudoAvailable?: boolean; emailAvailable?: boolean } = {};

    if (input.pseudo) {
      const lower = input.pseudo.toLowerCase();
      const usersRef = collection(db, "users");
      const qLower = query(usersRef, where("pseudoLower", "==", lower));
      const qsLower = await getDocs(qLower);
      result.pseudoAvailable = qsLower.empty;
    }

    if (input.email) {
      const value = input.email.toLowerCase();
      const usersRef = collection(db, "users");
      const q1 = query(usersRef, where("email", "==", value));
      const qs1 = await getDocs(q1);
      result.emailAvailable = qs1.empty;
    }

    return result;
  });

export default route;
