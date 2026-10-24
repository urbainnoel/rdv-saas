import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { and, eq } from "drizzle-orm";
import { askAssistant, type ChatMessage, type SlotOption } from "@/lib/chat";
import { notifyUnansweredQuestion, notifyNewLead } from "@/lib/notifications";
import { getAvailableSlotsForRange, type Slot } from "@/lib/slots";
import { createAppointment } from "@/lib/booking";

type ChatBody = {
  slug: string;
  messages: ChatMessage[];
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as ChatBody | null;

  if (!body?.slug || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const [entrepreneur] = await db
    .select()
    .from(schema.entrepreneurs)
    .where(eq(schema.entrepreneurs.slug, body.slug))
    .limit(1);

  if (!entrepreneur) {
    return NextResponse.json({ error: "Entrepreneur introuvable." }, { status: 404 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [entries, services, slotsByDay] = await Promise.all([
    db
      .select({
        type: schema.knowledgeBaseEntries.type,
        question: schema.knowledgeBaseEntries.question,
        answer: schema.knowledgeBaseEntries.answer,
      })
      .from(schema.knowledgeBaseEntries)
      .where(eq(schema.knowledgeBaseEntries.entrepreneurId, entrepreneur.id)),
    db
      .select()
      .from(schema.services)
      .where(and(eq(schema.services.entrepreneurId, entrepreneur.id), eq(schema.services.archived, false))),
    getAvailableSlotsForRange(entrepreneur.id, today, 10),
  ]);

  // On numérote les prochains créneaux libres (toutes journées confondues),
  // pour que l'assistant ne puisse proposer QUE des horaires réels.
  const flatSlots: Slot[] = Object.keys(slotsByDay)
    .sort()
    .flatMap((day) => slotsByDay[day])
    .slice(0, 10);

  const slotOptions: SlotOption[] = flatSlots.map((slot, i) => ({
    index: i + 1,
    label: `${slot.startAt.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })} à ${slot.startAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
  }));

  try {
    const { answer, forward, lead, booking } = await askAssistant({
      businessName: entrepreneur.businessName,
      slug: entrepreneur.slug,
      entries,
      services,
      slotOptions,
      history: body.messages,
    });

    let finalAnswer = answer;

    if (booking) {
      const slot = flatSlots[booking.slotIndex - 1];

      if (!slot) {
        // Le modèle a référencé un créneau qui n'existe pas (ou plus) dans la liste.
        finalAnswer =
          "Désolé, ce créneau ne semble plus disponible. Pouvez-vous choisir un autre horaire parmi ceux proposés ?";
      } else {
        const isEmail = booking.clientContact.includes("@");
        const matchedService = booking.serviceName
          ? services.find((s) => s.name.toLowerCase() === booking.serviceName!.toLowerCase())
          : undefined;

        const result = await createAppointment({
          entrepreneur,
          startAt: slot.startAt,
          endAt: slot.endAt,
          client: {
            fullName: booking.clientName,
            email: isEmail ? booking.clientContact : undefined,
            phone: isEmail ? undefined : booking.clientContact,
          },
          serviceId: matchedService?.id ?? null,
        });

        if (result.ok) {
          const d = slot.startAt;
          finalAnswer = `C'est confirmé, ${booking.clientName.split(" ")[0]} ! Votre rendez-vous est réservé pour le ${d.toLocaleDateString(
            "fr-FR",
            { weekday: "long", day: "numeric", month: "long" }
          )} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}. Vous recevrez une confirmation.`;
        } else if (result.status === 409) {
          finalAnswer = "Oups, ce créneau vient d'être pris par quelqu'un d'autre. Voulez-vous en choisir un autre ?";
        } else {
          finalAnswer =
            "Désolé, je n'ai pas pu finaliser la réservation. Pouvez-vous réessayer ou contacter directement " +
            entrepreneur.businessName +
            " ?";
        }
      }
    }

    if (forward && !booking) {
      const lastUserMessage = [...body.messages].reverse().find((m) => m.role === "user");
      notifyUnansweredQuestion({
        entrepreneur,
        question: lastUserMessage?.content ?? "(question non identifiée)",
      }).catch((err) => console.error("Erreur notification question non répondue:", err));
    }

    if (lead) {
      notifyNewLead({
        entrepreneur,
        leadName: lead.name,
        leadContact: lead.contact,
      }).catch((err) => console.error("Erreur notification nouveau prospect:", err));
    }

    return NextResponse.json({ answer: finalAnswer, forward: forward && !booking });
  } catch (err) {
    console.error("Erreur assistant:", err);
    return NextResponse.json(
      {
        answer:
          "Désolé, l'assistant rencontre un souci technique. Vous pouvez contacter l'entrepreneur directement.",
        forward: true,
      },
      { status: 200 }
    );
  }
}
