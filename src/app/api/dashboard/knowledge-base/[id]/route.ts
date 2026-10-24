import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { getCurrentEntrepreneur } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const entrepreneur = await getCurrentEntrepreneur();
  if (!entrepreneur) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;

  await db
    .delete(schema.knowledgeBaseEntries)
    .where(
      and(
        eq(schema.knowledgeBaseEntries.id, id),
        eq(schema.knowledgeBaseEntries.entrepreneurId, entrepreneur.id)
      )
    );

  return NextResponse.json({ ok: true });
}
