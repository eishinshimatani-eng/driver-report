
import { internalMutation } from "./_generated/server";

export const removeIsSubmitted = internalMutation({
    args: {},
    handler: async (ctx) => {
        const reports = await ctx.db.query("dailyReports").collect();
        for (const report of reports) {
            if ("isSubmitted" in report) {
                const { isSubmitted, ...rest } = report as any;
                // Convex doesn't support deleting fields directly via patch if strict schema?
                // Actually, patch replaces the fields specified. To remove a field, if it's not in schema, 
                // usually we interpret the schema. But here the schema DOES NOT have it.
                // If we just write the object without the field using replace?
                // Or using patch with undefined? Convex handles undefined as "remove" sometimes? 
                // No, typically we need to use `db.replace` to remove fields that are no longer in schema but present in doc.

                await ctx.db.replace(report._id, rest);
            }
        }
    },
});
