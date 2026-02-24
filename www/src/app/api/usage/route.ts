import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const authEmail = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMAIL;
    const authPassword = process.env.NEXT_PUBLIC_FIREBASE_AUTH_PASSWORD;
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    // Get Firebase auth token
    const authRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          returnSecureToken: true,
        }),
      }
    );
    const authData = await authRes.json();
    const idToken = authData.idToken;

    // Count recipes
    const recipesRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "recipes" }],
            where: {
              fieldFilter: {
                field: { fieldPath: "userId" },
                op: "EQUAL",
                value: { stringValue: userId },
              },
            },
            select: { fields: [{ fieldPath: "__name__" }] },
          },
        }),
      }
    );
    const recipesData = await recipesRes.json();
    const recipesCount = Array.isArray(recipesData)
      ? recipesData.filter((r: any) => r.document).length
      : 0;

    // Count grocery items
    const groceryRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "groceries" }],
            where: {
              fieldFilter: {
                field: { fieldPath: "userId" },
                op: "EQUAL",
                value: { stringValue: userId },
              },
            },
            select: { fields: [{ fieldPath: "__name__" }] },
          },
        }),
      }
    );
    const groceryData = await groceryRes.json();
    const groceryCount = Array.isArray(groceryData)
      ? groceryData.filter((r: any) => r.document).length
      : 0;

    // Count tasks for today
    const today = new Date().toISOString().split("T")[0];
    const tasksRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "tasks" }],
            where: {
              compositeFilter: {
                op: "AND",
                filters: [
                  {
                    fieldFilter: {
                      field: { fieldPath: "userId" },
                      op: "EQUAL",
                      value: { stringValue: userId },
                    },
                  },
                  {
                    fieldFilter: {
                      field: { fieldPath: "date" },
                      op: "EQUAL",
                      value: { stringValue: today },
                    },
                  },
                ],
              },
            },
            select: { fields: [{ fieldPath: "__name__" }] },
          },
        }),
      }
    );
    const tasksData = await tasksRes.json();
    const tasksCount = Array.isArray(tasksData)
      ? tasksData.filter((r: any) => r.document).length
      : 0;

    // Get user profile for tier and family members
    const userRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}?key=${apiKey}`,
      {
        headers: { Authorization: `Bearer ${idToken}` },
      }
    );

    let tier = "free";
    let familyMembersCount = 1;

    if (userRes.ok) {
      const userData = await userRes.json();
      tier = userData.fields?.tier?.stringValue || "free";
      const members = userData.fields?.familyMembers?.arrayValue?.values;
      familyMembersCount = members ? members.length : 1;
    }

    return NextResponse.json({
      tier,
      usage: {
        recipes: recipesCount,
        groceryItems: groceryCount,
        tasks: tasksCount,
        familyMembers: familyMembersCount,
      },
    });
  } catch (err: any) {
    console.error("[Usage] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to get usage" },
      { status: 500 }
    );
  }
}
