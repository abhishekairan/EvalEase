"use server";

import { getMarksWithData } from "@/db/utils/marksUtils";

export type MarksWithDataType = Awaited<ReturnType<typeof getMarksWithData>>;

/**
 * Server action to fetch marks with related data
 * Used for live data fetching in the marks dashboard
 */
export async function fetchMarksData(): Promise<MarksWithDataType> {
  try {
    const data = await getMarksWithData();
    return data;
  } catch (error) {
    console.error("Error fetching marks data:", error);
    throw new Error("Failed to fetch marks data");
  }
}

/**
 * Server action to fetch marks for a specific session
 */
export async function fetchMarksDataBySession(sessionId: number): Promise<MarksWithDataType> {
  try {
    const data = await getMarksWithData({ session: sessionId });
    return data;
  } catch (error) {
    console.error("Error fetching marks data for session:", error);
    throw new Error("Failed to fetch marks data");
  }
}

/**
 * Server action to fetch marks for a specific jury member
 */
export async function fetchMarksDataByJury(juryId: number): Promise<MarksWithDataType> {
  try {
    const data = await getMarksWithData({ juryId });
    return data;
  } catch (error) {
    console.error("Error fetching marks data for jury:", error);
    throw new Error("Failed to fetch marks data");
  }
}
